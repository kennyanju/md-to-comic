import { 
  MarkdownChunk, 
  FrontmatterMetadata, 
  CharacterRosterItem, 
  PanelScript, 
  ArtStylePreset, 
  ShotType 
} from '../types/comic';
import { getArtStyleById } from './artStyles';

export function buildLlmScriptingPrompt(
  chunk: MarkdownChunk,
  metadata: FrontmatterMetadata,
  characters: CharacterRosterItem[],
  targetPanels: number = 4
) {
  const charDetails = characters
    .map(c => `- ${c.name} (${c.role}): ${c.visual_description}`)
    .join('\n');

  const systemPrompt = `You are an elite comic book writer and visual storyboard artist.
Transform the provided markdown story scene into a structured sequence of exactly ${targetPanels} comic panels.

ART STYLE: ${metadata.art_style || 'Modern Western Comic'}
GENRE: ${metadata.genre || 'Action / Drama'}
PALETTE: ${metadata.palette || 'Vibrant saturated comic tones'}

CHARACTERS IN STORY:
${charDetails || 'Protagonist with distinct comic styling'}

OUTPUT FORMAT REQUIREMENTS:
You MUST respond with a valid JSON array of objects. Do not include markdown code blocks (like \`\`\`json). Output raw JSON only.
Each item in the array represents one comic panel and must match this schema:
[
  {
    "panel_index": 1,
    "shot_type": "wide" | "medium" | "close_up" | "extreme_close_up" | "birds_eye" | "dutch_angle",
    "scene_description": "Vivid visual description of the visual scene, characters present, poses, lighting, and background for image generation (max 80 words)",
    "mood": "mood word or short phrase",
    "caption": "Narrator text or scene setting (or empty string if none)",
    "character_tags": ["Character Name 1", "Character Name 2"],
    "dialogue": [
      {
        "speaker": "Character Name",
        "line": "Dialogue line text",
        "type": "speech" | "shout" | "thought" | "caption"
      }
    ]
  }
]`;

  const userPrompt = `SCENE TITLE: ${chunk.heading}
STORY TEXT TO CONVERT:
---
${chunk.raw_markdown}
---

Generate ${targetPanels} distinct, cinematic comic panels with dynamic storytelling and visual variety.`;

  return { systemPrompt, userPrompt };
}

/**
 * Combines panel scene description with character consistency snippets and art style modifiers
 */
export function buildImageGenerationPrompt(
  panel: PanelScript,
  characters: CharacterRosterItem[],
  artStyle: ArtStylePreset
): { prompt: string; negative_prompt: string } {
  // Shot type prefix
  const shotPrefixes: Record<ShotType, string> = {
    wide: 'wide angle establishing shot of',
    medium: 'medium shot of',
    close_up: 'close-up portrait shot of',
    extreme_close_up: 'extreme close-up detail shot of',
    birds_eye: 'high overhead bird-eye perspective shot of',
    dutch_angle: 'dynamic tilted Dutch angle action shot of'
  };

  const shotStr = shotPrefixes[panel.shot_type] || 'comic panel shot of';

  // Inject visual descriptions of characters tagged in this panel
  const charSnippets = panel.character_tags
    .map(tag => {
      const found = characters.find(c => c.name.toLowerCase() === tag.toLowerCase());
      return found ? found.visual_description : tag;
    })
    .filter(Boolean)
    .join(', ');

  const promptParts = [
    `${shotStr} ${panel.scene_description}`,
    charSnippets ? `featuring ${charSnippets}` : '',
    `mood: ${panel.mood || 'dramatic'}`,
    artStyle.prompt_suffix
  ].filter(Boolean);

  const fullPrompt = promptParts.join(', ');
  const negativePrompt = panel.negative_prompt || artStyle.negative_prompt;

  return {
    prompt: fullPrompt,
    negative_prompt: negativePrompt
  };
}

/**
 * Smart heuristic script generator for instant demo / offline mode
 */
export function buildOfflineMockPanels(
  chunk: MarkdownChunk,
  pageIndex: number,
  artStyleId: string,
  characters: CharacterRosterItem[]
): PanelScript[] {
  const artStyle = getArtStyleById(artStyleId);
  const lines = chunk.raw_markdown.split('\n').map(l => l.trim()).filter(Boolean);
  
  const shotTypes: ShotType[] = ['wide', 'medium', 'close_up', 'dutch_angle'];
  const moods = ['Intense & Suspenseful', 'Action Packed', 'Mysterious Revelation', 'Climactic'];
  
  const heroName = characters[0]?.name || 'Hero';
  const partnerName = characters[1]?.name || 'Jax';

  const panels: PanelScript[] = [];
  const panelCount = 4;

  for (let i = 1; i <= panelCount; i++) {
    const shot = shotTypes[(i - 1) % shotTypes.length];
    const mood = moods[(i - 1) % moods.length];

    let desc = '';
    let caption = '';
    const dialogue = [];
    const tags: string[] = [];

    if (i === 1) {
      desc = `Establishing scene for ${chunk.heading}. Atmospheric backdrop with high contrast shadows and glowing environment lighting.`;
      caption = `${chunk.heading} — The journey begins.`;
      tags.push(heroName);
    } else if (i === 2) {
      desc = `${heroName} navigating the area with intense focus, inspecting a critical anomaly or device.`;
      dialogue.push({
        id: `dlg-${pageIndex}-${i}-1`,
        speaker: heroName,
        line: "Sub-systems are active... we're right on schedule.",
        type: 'speech' as const
      });
      tags.push(heroName);
    } else if (i === 3) {
      desc = `Close view of ${partnerName || heroName} reacting with sudden alarm as energy pulses illuminate the frame.`;
      dialogue.push({
        id: `dlg-${pageIndex}-${i}-1`,
        speaker: partnerName || heroName,
        line: "Look out! Energy surge detected!",
        type: 'shout' as const
      });
      tags.push(partnerName || heroName);
    } else {
      desc = `Dynamic showdown climax! Energy crackles as heroes take a defensive stand against looming forces.`;
      dialogue.push({
        id: `dlg-${pageIndex}-${i}-1`,
        speaker: heroName,
        line: "Hold your ground! We finish this together!",
        type: 'shout' as const
      });
      tags.push(heroName);
      if (partnerName) tags.push(partnerName);
    }

    const initialPrompt = `${shot} ${desc}, ${artStyle.prompt_suffix}`;

    panels.push({
      id: `panel-${pageIndex}-${i}-${Date.now()}`,
      panel_index: i,
      page_index: pageIndex,
      shot_type: shot,
      scene_description: desc,
      mood: mood,
      caption: caption || undefined,
      dialogue: dialogue,
      character_tags: tags,
      generated_prompt: initialPrompt,
      negative_prompt: artStyle.negative_prompt,
      status: 'pending'
    });
  }

  return panels;
}
