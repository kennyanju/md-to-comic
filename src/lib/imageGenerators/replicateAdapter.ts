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

    // Call Replicate API (Predictions endpoint)
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        version: model.includes(':') ? model.split(':')[1] : undefined,
        model: !model.includes(':') ? model : undefined,
        input: {
          prompt: prompt,
          negative_prompt: negative_prompt,
          aspect_ratio: '16:9',
          num_outputs: 1,
          output_format: 'png',
          go_fast: true
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Replicate error (${response.status}): ${err}`);
    }

    let prediction = await response.json();

    // Poll if not completed immediately
    let attempts = 0;
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
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
