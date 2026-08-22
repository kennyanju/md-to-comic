import { Hono } from 'hono';
import { cors } from 'hono/cors';

export interface Env {
  OPENROUTER_API_KEY?: string;
  REPLICATE_API_TOKEN?: string;
  HF_ACCESS_TOKEN?: string;
  AI?: any; // Cloudflare Workers AI binding
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for web frontend
app.use('*', cors({
  origin: ['https://md-to-comic.kennyanju.workers.dev', 'http://localhost:5173'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Health Check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'md-to-comic-api',
    runtime: 'Cloudflare Workers',
    timestamp: new Date().toISOString()
  });
});

// 1. Ingest / Parse Markdown API
app.post('/api/parse-markdown', async (c) => {
  try {
    const { markdown } = await c.req.json<{ markdown: string }>();
    if (!markdown) {
      return c.json({ error: 'Markdown content required' }, 400);
    }

    // Split on headers and comments
    const sections = markdown.split(/(?=^#{1,3}\s+)|<!--\s*page-break\s*-->/im);
    const chunks = sections.map((sec, idx) => ({
      page_index: idx + 1,
      heading: sec.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim() || `Scene ${idx + 1}`,
      raw_markdown: sec.trim(),
      word_count: sec.trim().split(/\s+/).filter(Boolean).length
    }));

    return c.json({ chunks, count: chunks.length });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 2. OpenRouter Structured Scripting Proxy API
app.post('/api/generate-script', async (c) => {
  try {
    const body = await c.req.json();
    const { systemPrompt, userPrompt, api_key, model = 'google/gemini-2.5-pro' } = body;

    const key = api_key || c.env.OPENROUTER_API_KEY;
    if (!key) {
      return c.json({ error: 'OpenRouter API key required' }, 401);
    }

    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://md-to-comic.pages.dev',
        'X-Title': 'MD to Comic Cloudflare Pipeline'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!openRouterRes.ok) {
      const err = await openRouterRes.text();
      return c.json({ error: `OpenRouter error: ${err}` }, openRouterRes.status as any);
    }

    const data = await openRouterRes.json();
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 3. Image Generation Proxy API (Replicate / Hugging Face / Cloudflare AI)
app.post('/api/generate-image', async (c) => {
  try {
    const body = await c.req.json();
    const { backend, prompt, negative_prompt, api_key } = body;

    if (backend === 'cloudflare_ai' && c.env.AI) {
      const response = await c.env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
        prompt: prompt,
        negative_prompt: negative_prompt,
        num_steps: 20
      });
      return new Response(response, {
        headers: { 'Content-Type': 'image/png' }
      });
    }

    if (backend === 'huggingface') {
      const token = api_key || c.env.HF_ACCESS_TOKEN;
      if (!token) return c.json({ error: 'Hugging Face API token is required' }, 401);
      const requestedModel = body.model || 'stabilityai/stable-diffusion-xl-base-1.0';
      
      // Prioritize partner router providers, native hf-inference, and automatic SDXL fallback
      const candidateEndpoints: Array<{ url: string; model: string }> = [
        { url: `https://router.huggingface.co/fal-ai/models/${requestedModel}`, model: requestedModel },
        { url: `https://router.huggingface.co/together/models/${requestedModel}`, model: requestedModel },
        { url: `https://router.huggingface.co/hf-inference/models/${requestedModel}`, model: requestedModel },
        { url: `https://router.huggingface.co/models/${requestedModel}`, model: requestedModel }
      ];

      // If requested model is FLUX and gets deprecated by hf-inference, also attempt native SDXL
      if (requestedModel.includes('FLUX') || requestedModel.includes('flux')) {
        candidateEndpoints.push(
          { url: 'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0', model: 'stabilityai/stable-diffusion-xl-base-1.0' },
          { url: 'https://router.huggingface.co/hf-inference/models/ByteDance/SDXL-Lightning', model: 'ByteDance/SDXL-Lightning' }
        );
      }

      let lastError = 'Image generation failed';
      let lastStatus = 500;

      for (const candidate of candidateEndpoints) {
        try {
          const hfRes = await fetch(candidate.url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'image/png'
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                negative_prompt: negative_prompt || undefined,
                width: 768,
                height: 512,
                num_inference_steps: 4
              }
            })
          });

          if (hfRes.ok) {
            return new Response(await hfRes.arrayBuffer(), {
              headers: { 'Content-Type': hfRes.headers.get('Content-Type') || 'image/png' }
            });
          }

          lastStatus = hfRes.status;
          const errText = await hfRes.text();
          try {
            const parsed = JSON.parse(errText);
            lastError = parsed.error || parsed.message || errText;
          } catch {
            lastError = errText;
          }

          // If status is 401 (bad token), no need to retry other endpoints
          if (hfRes.status === 401) {
            break;
          }

          // For 410 (deprecated model on current provider), 404 (not on provider), 530 (DNS), or 503 (loading), continue to next candidate
        } catch (fetchErr: any) {
          lastError = fetchErr.message;
        }
      }

      return c.json({ error: `Hugging Face Error: ${lastError}` }, lastStatus as any);
    }

    if (backend === 'replicate') {
      const token = api_key || c.env.REPLICATE_API_TOKEN;
      if (!token) return c.json({ error: 'Replicate token required' }, 401);
      const repModel = body.model || 'black-forest-labs/flux-schnell';
      
      const repRes = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait'
        },
        body: JSON.stringify({
          version: repModel.includes(':') ? repModel.split(':')[1] : undefined,
          model: !repModel.includes(':') ? repModel : undefined,
          input: { prompt, negative_prompt, aspect_ratio: '16:9', num_outputs: 1, output_format: 'png', go_fast: true }
        })
      });
      const data = await repRes.json();
      return c.json(data);
    }

    return c.json({ error: 'Invalid backend or missing credentials' }, 400);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 4. Poll Image Proxy API (For Replicate)
app.get('/api/poll-image', async (c) => {
  const backend = c.req.query('backend');
  const id = c.req.query('id');
  const api_key = c.req.header('X-API-Key');

  if (backend === 'replicate') {
    const token = api_key || c.env.REPLICATE_API_TOKEN;
    if (!token) return c.json({ error: 'Replicate token required' }, 401);
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return c.json(await pollRes.json());
  }
  return c.json({ error: 'Unsupported backend' }, 400);
});

export default app;
