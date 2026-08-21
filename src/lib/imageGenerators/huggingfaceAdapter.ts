import { ImageGeneratorAdapter, GenerateImageOptions } from './types';
import { buildImageGenerationPrompt } from '../promptBuilder';

export class HuggingFaceAdapter implements ImageGeneratorAdapter {
  id = 'huggingface';
  name = 'Hugging Face Inference API';

  async generatePanelImage(options: GenerateImageOptions): Promise<string> {
    const { panel, characters, artStyle, settings } = options;
    const token = settings.hf_token;

    if (!token) {
      throw new Error('Hugging Face API token is required. Please set it in Settings.');
    }

    const { prompt, negative_prompt } = buildImageGenerationPrompt(panel, characters, artStyle);
    const model = settings.hf_model || 'black-forest-labs/FLUX.1-schnell';

    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        backend: 'huggingface',
        api_key: token,
        model,
        prompt,
        negative_prompt
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Hugging Face error (${response.status}): ${err}`);
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
