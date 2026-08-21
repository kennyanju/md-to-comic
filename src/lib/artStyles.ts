import { ArtStylePreset } from '../types/comic';

export const ART_STYLE_PRESETS: ArtStylePreset[] = [
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon Noir',
    description: 'High contrast, neon magenta & cyan lighting, gritty rain-slicked cityscapes, dark shadows',
    prompt_suffix: 'cyberpunk comic book art style, neon glow lighting, high contrast ink lines, cyan and magenta ambient lighting, hyper-detailed graphic novel, dramatic lighting, 8k',
    negative_prompt: 'blurry, watermark, text, low quality, photorealistic, 3d render, washed out, muted colors',
    preview_gradient: 'linear-gradient(135deg, #06b6d4, #ec4899)',
    icon: '⚡'
  },
  {
    id: 'western-heroic',
    name: 'Modern Western Comic',
    description: 'Dynamic Marvel/DC style ink outlines, bold halftones, saturated colors, energetic heroic compositions',
    prompt_suffix: 'modern western comic book illustration, dynamic ink outlines, bold cross-hatching, rich saturated colors, sequential art, comic panel, detailed background, masterpiece',
    negative_prompt: 'photograph, blurry, deformed anatomy, muted, sketch, bad hands, cropped',
    preview_gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    icon: '💥'
  },
  {
    id: 'manga-anime',
    name: 'Manga / Anime Action',
    description: 'Clean Japanese manga line art, screentones, expressive character design, high octane perspective',
    prompt_suffix: 'anime comic manga style, crisp clean line art, subtle screentones, expressive anime facial features, vibrant cell shading, high dynamic range, key visual',
    negative_prompt: 'western cartoon, messy linework, 3d, realistic photo, blurry, watermark',
    preview_gradient: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
    icon: '⛩️'
  },
  {
    id: 'noir-detective',
    name: 'Gritty Noir Graphic Novel',
    description: 'Sin City style deep stark black inking, selective spot colors (crimson red / amber), moody atmospheric haze',
    prompt_suffix: 'dark noir graphic novel art, stark black ink shadows, chiascuro lighting, deep blacks with selective crimson red accent, gritty textural details, dramatic cinematic angle',
    negative_prompt: 'bright cheerful colors, oversaturated, flat lighting, pastel, blurry, cartoonish',
    preview_gradient: 'linear-gradient(135deg, #1e1b4b, #e11d48)',
    icon: '🕵️'
  },
  {
    id: 'watercolor-fantasy',
    name: 'Watercolor Fantasy',
    description: 'Soft ethereal watercolor washes, delicate pen inking, whimsical storybook atmosphere',
    prompt_suffix: 'watercolor storybook comic illustration, soft bleeding watercolor washes, fine pen ink outlines, magical atmosphere, rich dreamy palette, masterwork graphic novel',
    negative_prompt: 'hard CGI, neon, harsh shadows, photorealistic, blurry, low resolution',
    preview_gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    icon: '🎨'
  },
  {
    id: 'retro-80s',
    name: 'Retro 80s Vintage Comic',
    description: 'Authentic vintage Ben-Day dots, faded paper texture, classic four-color CMYK printing look',
    prompt_suffix: 'vintage 1980s bronze age comic book art, authentic Ben-Day dots halftone, aged paper grain, bold newsprint ink, nostalgic retro color palette',
    negative_prompt: 'modern digital render, smooth gradients, 3d CGI, photorealism, glossy',
    preview_gradient: 'linear-gradient(135deg, #f97316, #eab308)',
    icon: '📺'
  }
];

export const getArtStyleById = (id: string): ArtStylePreset => {
  return ART_STYLE_PRESETS.find(s => s.id === id) || ART_STYLE_PRESETS[0];
};
