import { ImageGeneratorAdapter } from './types';
import { ReplicateAdapter } from './replicateAdapter';
import { HuggingFaceAdapter } from './huggingfaceAdapter';
import { CloudflareAiAdapter } from './cloudflareAiAdapter';
import { MockGraphicAdapter } from './mockAdapter';
import { ImageBackendType } from '../../types/comic';

export * from './types';

const adapters: Record<ImageBackendType, ImageGeneratorAdapter> = {
  replicate: new ReplicateAdapter(),
  huggingface: new HuggingFaceAdapter(),
  cloudflare_ai: new CloudflareAiAdapter(),
  mock_demo: new MockGraphicAdapter()
};

export function getImageGenerator(type: ImageBackendType): ImageGeneratorAdapter {
  return adapters[type] || adapters.mock_demo;
}

export const AVAILABLE_BACKENDS = [
  { id: 'mock_demo', name: '⚡ Built-in Comic Synth (Instant Demo)', description: 'Fast offline canvas generator for testing & demo without API keys' },
  { id: 'replicate', name: 'Replicate (FLUX.1-schnell / SDXL)', description: 'High quality cloud image generation via Replicate API' },
  { id: 'huggingface', name: 'Hugging Face Inference', description: 'FLUX / SDXL inference endpoints via HF Hub token' },
  { id: 'cloudflare_ai', name: 'Cloudflare Workers AI', description: 'Serverless SDXL Base inference directly on Cloudflare edge' }
];
