import { ImageGeneratorAdapter, GenerateImageOptions } from './types';
import { buildImageGenerationPrompt } from '../promptBuilder';

export class CloudflareAiAdapter implements ImageGeneratorAdapter {
  id = 'cloudflare_ai';
  name = 'Cloudflare Workers AI (SDXL Base)';

  async generatePanelImage(options: GenerateImageOptions): Promise<string> {
    const { panel, characters, artStyle, settings } = options;
    const token = settings.cloudflare_token;
    const accountId = settings.cloudflare_account_id;

    if (!token || !accountId) {
      throw new Error('Cloudflare API Token & Account ID are required. Please configure them in Settings.');
    }

    const { prompt: builtPrompt } = buildImageGenerationPrompt(panel, characters, artStyle);
    const finalPrompt = panel.generated_prompt || builtPrompt;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          num_steps: 20
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Cloudflare AI error (${response.status}): ${err}`);
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
