export type ShotType = 
  | 'wide' 
  | 'medium' 
  | 'close_up' 
  | 'extreme_close_up' 
  | 'birds_eye' 
  | 'dutch_angle';

export type BubbleType = 'speech' | 'shout' | 'thought' | 'caption';

export interface DialogueItem {
  id: string;
  speaker: string;
  line: string;
  type: BubbleType;
  // Normalized coordinates (0-1 relative to panel or canvas)
  bubblePos?: { x: number; y: number };
  tailTarget?: { x: number; y: number };
}

export interface PanelScript {
  id: string;
  panel_index: number;
  page_index: number;
  shot_type: ShotType;
  scene_description: string;
  mood: string;
  caption?: string;
  dialogue: DialogueItem[];
  character_tags: string[];
  generated_prompt: string;
  negative_prompt?: string;
  image_url?: string;
  status: 'pending' | 'generating' | 'done' | 'failed';
  error?: string;
}

export interface CharacterRosterItem {
  id: string;
  name: string;
  visual_description: string;
  role: string;
  color_accent: string;
}

export interface FrontmatterMetadata {
  title?: string;
  author?: string;
  genre?: string;
  art_style?: string;
  palette?: string;
  target_pages?: number;
  panels_per_page?: number;
  [key: string]: unknown;
}

export interface MarkdownChunk {
  id: string;
  page_index: number;
  heading: string;
  raw_markdown: string;
  word_count: number;
  panels: PanelScript[];
}

export type PageLayoutType = 
  | 'dynamic-auto'   // Dynamic organic grid auto-calculated for any panel count
  | 'grid-4'         // 2x2 classic grid
  | 'cinematic-3'    // 3 widescreen horizontal banners
  | 'action-5'       // 1 top banner + 3 middle split + 1 bottom banner
  | 'manga-6'        // 3 rows x 2 cols (or diagonal split)
  | 'hero-split-2'   // Left/Right vertical showdown split
  | 'splash-1';      // Single high-impact splash page / cover

export type BorderStyle = 
  | 'ink-gutter'     // Organic bold comic ink border with white gutters
  | 'classic-black'  // Sharp geometric black gutters
  | 'neon-glow'      // Cyberpunk cyan/violet glowing borders
  | 'borderless'     // Seamless modern edge-to-edge
  | 'manga-clean';   // Fine Japanese manga style gutters

export interface PageLayoutConfig {
  layout_type: PageLayoutType;
  border_style: BorderStyle;
  gutter_width: number;
  font_family: 'Bangers' | 'Comic Neue' | 'Outfit' | 'Inter';
  bg_color: string;
  border_color: string;
  show_page_number: boolean;
  dpi: 150 | 300;
}

export interface ComicPage {
  id: string;
  page_index: number;
  title: string;
  layout_config: PageLayoutConfig;
  panels: PanelScript[];
  assembled_image_url?: string;
}

export interface ArtStylePreset {
  id: string;
  name: string;
  description: string;
  prompt_suffix: string;
  negative_prompt: string;
  preview_gradient: string;
  icon: string;
}

export type ImageBackendType = 'replicate' | 'huggingface' | 'cloudflare_ai' | 'mock_demo';

export interface UserSettings {
  openrouter_key: string;
  replicate_key: string;
  hf_token: string;
  cloudflare_token: string;
  cloudflare_account_id: string;
  preferred_llm_model: string;
  preferred_image_backend: ImageBackendType;
  replicate_model: string;
  hf_model: string;
  panelsPerPage: number;
}

export interface ComicProject {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  metadata: FrontmatterMetadata;
  raw_markdown: string;
  selected_style_id: string;
  characters: CharacterRosterItem[];
  pages: ComicPage[];
  current_step: number; // 0: Ingest, 1: Script, 2: Panels, 3: Generate, 4: Comic Studio, 5: Export
}
