import { ImageGeneratorAdapter, GenerateImageOptions } from './types';
import { buildImageGenerationPrompt } from '../promptBuilder';

export class ReplicateAdapter implements ImageGeneratorAdapter {
  id = 'replicate';
  name = 'Replicate (FLUX.1-schnell / SDXL)';

  async generatePanelImage(options: GenerateImageOptions): Promise<string> {
    const { panel, characters, artStyle, settings } = options;
    const apiKey = settings.replicate_key;

    if (!apiKey) {
      throw new Error('Replicate API key is required. Please set it in Settings.');
    }

    const { prompt, negative_prompt } = buildImageGenerationPrompt(panel, characters, artStyle);
    const model = settings.replicate_model || 'black-forest-labs/flux-schnell';

    // Call our Worker Proxy
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        backend: 'replicate',
        api_key: apiKey,
        model,
        prompt,
        negative_prompt
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Worker error (${response.status}): ${err}`);
    }

    let prediction = await response.json();

    // Poll worker if not completed immediately
    let attempts = 0;
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(`/api/poll-image?backend=replicate&id=${prediction.id}`, {
        headers: { 'X-API-Key': apiKey }
      });
      if (pollRes.ok) {
        prediction = await pollRes.json();
      }
      attempts++;
    }

    if (prediction.status === 'succeeded' && prediction.output) {
      const out = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      return out;
    }

    throw new Error(`Replicate prediction failed or timed out: ${prediction.error || 'Unknown error'}`);
  }
}
