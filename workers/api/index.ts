import { Hono } from 'hono';
import { cors } from 'hono/cors';

export interface Env {
  DB?: D1Database;
  ASSETS?: R2Bucket;
  KEYS_KV?: KVNamespace;
  OPENROUTER_API_KEY?: string;
  REPLICATE_API_TOKEN?: string;
  HF_ACCESS_TOKEN?: string;
  AI?: any; // Cloudflare Workers AI binding
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for web frontend
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
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
    const { chunk, characters, art_style, api_key, model = 'google/gemini-2.5-pro' } = body;

    const key = api_key || c.env.OPENROUTER_API_KEY;
    if (!key) {
      return c.json({ error: 'OpenRouter API key required' }, 401);
    }

    const systemPrompt = `You are a professional comic book scriptwriter.
Art style: ${art_style || 'Comic Book'}
Output a JSON array of comic panels with panel_index, shot_type, scene_description, mood, caption, character_tags, and dialogue array.`;

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
          { role: 'user', content: `Story Chunk:\n${chunk.raw_markdown}` }
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

    if (backend === 'replicate') {
      const token = api_key || c.env.REPLICATE_API_TOKEN;
      if (!token) return c.json({ error: 'Replicate token required' }, 401);

      const repRes = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait'
        },
        body: JSON.stringify({
          model: 'black-forest-labs/flux-schnell',
          input: { prompt, negative_prompt }
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

export default app;
