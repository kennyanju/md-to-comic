import { FrontmatterMetadata, MarkdownChunk, CharacterRosterItem } from '../types/comic';
import { generateUUID } from './crypto';

/**
 * Extracts YAML frontmatter and markdown body
 */
export function extractFrontmatter(rawText: string): {
  metadata: FrontmatterMetadata;
  body: string;
} {
  const frontmatterRegex = /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*/;
  const match = rawText.match(frontmatterRegex);

  if (!match) {
    return {
      metadata: {},
      body: rawText.trim()
    };
  }

  const yamlContent = match[1];
  const body = rawText.slice(match[0].length).trim();
  const metadata: FrontmatterMetadata = {};

  const lines = yamlContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.slice(0, colonIndex).trim();
      let value = trimmed.slice(colonIndex + 1).trim();

      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (!isNaN(Number(value)) && value !== '') {
        metadata[key] = Number(value);
      } else {
        metadata[key] = value;
      }
    }
  }

  return { metadata, body };
}

function generateSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
}

/**
 * Splits markdown body into pages/chunks based on headers, panel-breaks, or word density
 */
export function parseMarkdownChunks(rawText: string): {
  metadata: FrontmatterMetadata;
  chunks: MarkdownChunk[];
  detectedCharacters: CharacterRosterItem[];
} {
  const { metadata, body } = extractFrontmatter(rawText);

  // Split on <!-- page-break --> or headers # / ##
  const sections: { heading: string; content: string }[] = [];

  const rawSections = body.split(/(?=^#{1,3}\s+)|<!--\s*page-break\s*-->/im);

  for (const sec of rawSections) {
    const trimmed = sec.trim();
    if (!trimmed) continue;

    // Check if section starts with heading
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/m);
    let heading = 'Scene';
    let content = trimmed;

    if (headingMatch) {
      heading = headingMatch[2].trim();
      content = trimmed.slice(headingMatch[0].length).trim();
    }

    // Further split if there are <!-- panel-break --> markers or if very long
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    
    if (wordCount > 500) {
      // Split on double newlines to make sub-chunks
      const subChunks = content.split(/\n\s*\n/);
      let currentSubChunk = '';
      let subIndex = 1;
      
      for (const para of subChunks) {
        currentSubChunk += para + '\n\n';
        if (currentSubChunk.split(/\s+/).filter(Boolean).length >= 350) {
          sections.push({ 
            heading: `${heading} (Part ${subIndex})`, 
            content: currentSubChunk.trim() 
          });
          currentSubChunk = '';
          subIndex++;
        }
      }
      if (currentSubChunk.trim()) {
        sections.push({ 
          heading: subIndex > 1 ? `${heading} (Part ${subIndex})` : heading, 
          content: currentSubChunk.trim() 
        });
      }
    } else {
      sections.push({ heading, content });
    }
  }

  // Fallback if no headings
  if (sections.length === 0 && body) {
    sections.push({ heading: 'Story Opening', content: body });
  }

  const chunks: MarkdownChunk[] = sections.map((sec, idx) => {
    const wordCount = sec.content.split(/\s+/).filter(Boolean).length;
    const stableId = generateSlug(sec.heading) || 'scene';
    const uuidSuffix = generateUUID().slice(0, 8);
    return {
      id: `chunk-${idx + 1}-${stableId}-${uuidSuffix}`,
      page_index: idx + 1,
      heading: sec.heading,
      raw_markdown: sec.content,
      word_count: wordCount,
      panels: []
    };
  });

  // Extract character candidates from dialogue patterns
  const detectedCharacters = extractCharacters(body);

  return {
    metadata,
    chunks,
    detectedCharacters
  };
}

const EXCLUDED_WORDS = new Set([
  'Suddenly', 'Inside', 'After', 'Behind', 'High', 'Beneath', 'The', 'They', 'He', 'She', 'It', 'We', 'You',
  'Meanwhile', 'Chapter', 'Scene', 'Page', 'Act', 'However', 'Furthermore', 'Afterward', 'Outside',
  'Around', 'Everywhere', 'Someone', 'Anyone', 'Everyone', 'Nobody', 'Nothing', 'Something', 'Everything',
  'Then', 'When', 'Where', 'Why', 'How', 'What', 'Who', 'Before', 'Under', 'Above', 'Across', 'Through',
  'Finally', 'Instantly', 'Quickly', 'Slowly', 'Carefully', 'Silent', 'Silence', 'Darkness', 'Light',
  'Later', 'Soon', 'Next', 'Yesterday', 'Today', 'Tomorrow', 'Again', 'Together', 'Alone'
]);

/**
 * Heuristic extraction of character names and potential roles
 */
export function extractCharacters(text: string): CharacterRosterItem[] {
  const charMap = new Map<string, { role: string; count: number }>();

  const trackName = (name: string, weight: number = 1) => {
    let n = name.trim();
    // Strip trailing punctuation
    n = n.replace(/[:,"'!?]+$/, '').trim();
    if (
      n && 
      n.length >= 2 && 
      n.length <= 30 && 
      !EXCLUDED_WORDS.has(n) &&
      !/^\d+$/.test(n)
    ) {
      const cur = charMap.get(n) || { role: 'Character', count: 0 };
      cur.count += weight;
      charMap.set(n, cur);
    }
  };

  // Pattern 1: Title + Name (e.g. Dr. Voss, Professor Ada, Captain Rynn, Sir Gareth, Lady Vane)
  const titlePattern = /\b(?:Dr\.?|Doctor|Prof\.?|Professor|Captain|Capt\.?|Sir|Lord|Lady|Agent|Commander|Master|King|Queen|Princess|Prince)\s+([A-Z][a-zA-Z-]+(?:\s+[A-Z][a-zA-Z-]+)?)\b/g;
  let match: RegExpExecArray | null;
  while ((match = titlePattern.exec(text)) !== null) {
    trackName(match[0], 2.5);
  }

  // Pattern 2: Dialogue follow-up (e.g. "..." Kira said / "..." Jean-Luc whispered / "..." ZARA shouted)
  const dialogueAfterPattern = /["'”]\s+([A-Z][a-zA-Z-]+(?:\s+[A-Z][a-zA-Z-]+)?)\s+(?:said|whispered|roared|replied|shouted|murmured|asked|exclaimed|gasped|warned|yelled|muttered|called|snarled)/g;
  while ((match = dialogueAfterPattern.exec(text)) !== null) {
    trackName(match[1], 2);
  }

  // Pattern 3: Script dialogue format (e.g. KIRA: "..." or Jean-Luc: "..." or ZARA: ...)
  const dialogueBeforePattern = /^([A-Z][a-zA-Z0-9\s.-]+):\s*["'“]/gm;
  while ((match = dialogueBeforePattern.exec(text)) !== null) {
    trackName(match[1], 2);
  }

  // Pattern 4: Bold names in markdown e.g. **Kira** or **Jean-Luc**
  const boldNamePattern = /\*\*([A-Z][a-zA-Z-]+(?:\s+[A-Z][a-zA-Z-]+)?)\*\*/g;
  while ((match = boldNamePattern.exec(text)) !== null) {
    trackName(match[1], 1.5);
  }

  // Pattern 5: Name + action verb (e.g. Kira charged, Jax leaped, Jean-Luc drew)
  const actionPattern = /\b([A-Z][a-zA-Z-]+(?:\s+[A-Z][a-zA-Z-]+)?)\s+(?:charged|leaped|jumped|ran|turned|smiled|frowned|nodded|stood|walked|dashed|stepped|glanced|looked|sighed|lunged)\b/g;
  while ((match = actionPattern.exec(text)) !== null) {
    trackName(match[1], 1);
  }

  // Palettes for badges
  const palette = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#f43f5e'];

  const results: CharacterRosterItem[] = [];
  let colorIdx = 0;

  for (const [name, info] of charMap.entries()) {
    results.push({
      id: `char-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name,
      role: info.count > 2 ? 'Main Hero' : 'Key Character',
      visual_description: `${name}, distinct facial features, expressive eyes, characteristic styled outfit`,
      color_accent: palette[colorIdx % palette.length]
    });
    colorIdx++;
  }

  // If no characters detected, provide default protagonist
  if (results.length === 0) {
    results.push({
      id: 'char-hero',
      name: 'Hero',
      role: 'Protagonist',
      visual_description: 'Bold comic protagonist, distinct styled hair, heroic jacket/armor, vibrant eyes',
      color_accent: '#8b5cf6'
    });
  }

  return results;
}
