import { 
  MarkdownChunk, 
  FrontmatterMetadata, 
  CharacterRosterItem, 
  PanelScript, 
  DialogueItem 
} from '../types/comic';
import { buildLlmScriptingPrompt, buildOfflineMockPanels } from './promptBuilder';

export interface GenerateScriptOptions {
  chunk: MarkdownChunk;
  metadata: FrontmatterMetadata;
  characters: CharacterRosterItem[];
  apiKey?: string;
  model?: string;
  artStyleId: string;
  targetPanels?: number;
}

export async function generateComicScript(options: GenerateScriptOptions): Promise<PanelScript[]> {
  const { chunk, metadata, characters, apiKey, model = 'google/gemini-2.5-pro', artStyleId, targetPanels = 4 } = options;

  // If no API key provided, generate with smart offline mock engine
  if (!apiKey || apiKey.trim() === '') {
    // Artificial small delay to simulate processing
    await new Promise(res => setTimeout(res, 800));
    return buildOfflineMockPanels(chunk, chunk.page_index, artStyleId, characters);
  }

  const { systemPrompt, userPrompt } = buildLlmScriptingPrompt(chunk, metadata, characters, targetPanels);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://md-to-comic.pages.dev',
        'X-Title': 'MD to Comic Generator'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`OpenRouter API error (${response.status}): ${errText}. Falling back to smart script generator.`);
      return buildOfflineMockPanels(chunk, chunk.page_index, artStyleId, characters);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return parseLlmPanelsResponse(content, chunk.page_index, artStyleId, characters);
  } catch (err) {
    console.error('Failed to call OpenRouter:', err);
    return buildOfflineMockPanels(chunk, chunk.page_index, artStyleId, characters);
  }
}

/**
 * Safely parses raw JSON or markdown-wrapped JSON response into typed PanelScript array
 */
function parseLlmPanelsResponse(
  rawContent: string, 
  pageIndex: number, 
  artStyleId: string, 
  characters: CharacterRosterItem[]
): PanelScript[] {
  let cleaned = rawContent.trim();

  // Strip ```json and ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  try {
    let parsed = JSON.parse(cleaned);

    // If it wrapped in an object like { "panels": [...] }
    if (!Array.isArray(parsed)) {
      if (Array.isArray(parsed.panels)) {
        parsed = parsed.panels;
      } else if (Array.isArray(parsed.comic_panels)) {
        parsed = parsed.comic_panels;
      } else {
        // Find any array property in the object
        const firstArray = Object.values(parsed).find(v => Array.isArray(v));
        if (firstArray && Array.isArray(firstArray)) {
          parsed = firstArray;
        } else {
          parsed = [parsed];
        }
      }
    }

    return (parsed as Record<string, any>[]).map((item, idx) => {
      const pIdx = item.panel_index || idx + 1;
      const dialogueItems: DialogueItem[] = Array.isArray(item.dialogue)
        ? item.dialogue.map((d: any, dIdx: number) => ({
            id: `dlg-${pageIndex}-${pIdx}-${dIdx + 1}`,
            speaker: d.speaker || 'Hero',
            line: d.line || d.text || '',
            type: (['speech', 'shout', 'thought', 'caption'].includes(d.type) ? d.type : 'speech') as any
          }))
        : [];

      return {
        id: `panel-${pageIndex}-${pIdx}-${Date.now()}-${idx}`,
        panel_index: pIdx,
        page_index: pageIndex,
        shot_type: (['wide', 'medium', 'close_up', 'extreme_close_up', 'birds_eye', 'dutch_angle'].includes(item.shot_type)
          ? item.shot_type
          : 'medium') as any,
        scene_description: item.scene_description || 'Detailed comic scene illustration.',
        mood: item.mood || 'Dramatic',
        caption: item.caption || undefined,
        dialogue: dialogueItems,
        character_tags: Array.isArray(item.character_tags) ? item.character_tags : [],
        generated_prompt: item.scene_description || '',
        status: 'pending'
      };
    });
  } catch (err) {
    console.error('Error parsing LLM response as JSON:', err, rawContent);
    // Fallback if parsing failed
    const dummyChunk = { id: `chk-${pageIndex}`, page_index: pageIndex, heading: `Page ${pageIndex}`, raw_markdown: rawContent, word_count: 50, panels: [] };
    return buildOfflineMockPanels(dummyChunk, pageIndex, artStyleId, characters);
  }
}
