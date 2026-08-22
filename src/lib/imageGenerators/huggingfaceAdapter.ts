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

    const { prompt: builtPrompt, negative_prompt } = buildImageGenerationPrompt(panel, characters, artStyle);
    const finalPrompt = panel.generated_prompt || builtPrompt;
    const model = settings.hf_model || 'stabilityai/stable-diffusion-2-1';

    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        backend: 'huggingface',
        api_key: token,
        model,
        prompt: finalPrompt,
        negative_prompt
      })
    });

    if (!response.ok) {
      let errorMsg = `Hugging Face error (${response.status})`;
      try {
        const json = await response.json();
        if (json.error) {
          errorMsg = typeof json.error === 'string' ? json.error : JSON.stringify(json.error);
        }
      } catch {
        try {
          const text = await response.text();
          if (text) errorMsg = text;
        } catch {}
      }
      throw new Error(errorMsg);
    }

    // Notify the UI if Cloudflare AI was used as a fallback
    const backendUsed = response.headers.get('X-Image-Backend');
    if (backendUsed === 'cloudflare-ai') {
      window.dispatchEvent(new CustomEvent('comic:cf-ai-fallback', {
        detail: { message: 'HF model unavailable — generated with Cloudflare AI instead.' }
      }));
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
