import { PanelScript, CharacterRosterItem, ArtStylePreset, UserSettings } from '../../types/comic';

export interface GenerateImageOptions {
  panel: PanelScript;
  characters: CharacterRosterItem[];
  artStyle: ArtStylePreset;
  settings: UserSettings;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:4';
}

export interface ImageGeneratorAdapter {
  id: string;
  name: string;
  generatePanelImage(options: GenerateImageOptions): Promise<string>; // Returns Image URL or Data URL
}
