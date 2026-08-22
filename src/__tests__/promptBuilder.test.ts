import { describe, it, expect } from 'vitest';
import { 
  buildLlmScriptingPrompt, 
  buildImageGenerationPrompt, 
  buildOfflineMockPanels 
} from '../lib/promptBuilder';
import { getArtStyleById } from '../lib/artStyles';
import { CharacterRosterItem, PanelScript } from '../types/comic';

describe('promptBuilder', () => {
  const mockCharacters: CharacterRosterItem[] = [
    {
      id: 'char-1',
      name: 'Jax',
      visual_description: 'Cyberpunk mercenary with glowing blue cybernetic eye and chrome arm',
      role: 'Protagonist',
      color_accent: '#8b5cf6'
    }
  ];

  it('builds structured LLM scripting prompt with character anchors', () => {
    const chunk = {
      id: 'chk-1',
      page_index: 1,
      heading: 'Scene 1',
      raw_markdown: 'Jax infiltrated the mainframe.',
      word_count: 5,
      panels: []
    };

    const { systemPrompt, userPrompt } = buildLlmScriptingPrompt(chunk, { title: 'Neon Protocol' }, mockCharacters, 4);
    expect(systemPrompt).toContain('elite comic book writer');
    expect(userPrompt).toContain('Scene 1');
    expect(userPrompt).toContain('Jax infiltrated');
    expect(systemPrompt).toContain('Jax (Protagonist)');
  });

  it('assembles image generation prompts with art style suffix and negative prompts', () => {
    const style = getArtStyleById('cyberpunk-neon');
    const panel: PanelScript = {
      id: 'p-1',
      panel_index: 1,
      page_index: 1,
      shot_type: 'close_up',
      scene_description: 'Jax looking intensely into the neon terminal',
      mood: 'Tense',
      dialogue: [],
      character_tags: ['Jax'],
      generated_prompt: '',
      status: 'pending'
    };

    const { prompt, negative_prompt } = buildImageGenerationPrompt(panel, mockCharacters, style);
    expect(prompt).toContain('close-up portrait shot');
    expect(prompt).toContain('Jax looking intensely');
    expect(prompt).toContain('cybernetic eye');
    expect(prompt).toContain(style.prompt_suffix);
    expect(negative_prompt).toBe(style.negative_prompt);
  });

  it('builds offline mock panels correctly when API is not configured', () => {
    const chunk = {
      id: 'chk-1',
      page_index: 1,
      heading: 'Scene 1',
      raw_markdown: 'Jax enters the high-tech vault.',
      word_count: 6,
      panels: []
    };

    const panels = buildOfflineMockPanels(chunk, 1, 'western-heroic', mockCharacters, 4);
    expect(panels.length).toBe(4);
    expect(panels[0].page_index).toBe(1);
    expect(panels[0].panel_index).toBe(1);
    expect(panels[0].generated_prompt).toBeTruthy();
  });
});
