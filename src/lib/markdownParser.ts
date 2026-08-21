import { FrontmatterMetadata, MarkdownChunk, CharacterRosterItem } from '../types/comic';

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
    sections.push({ heading, content });
  }

  // Fallback if no headings
  if (sections.length === 0 && body) {
    sections.push({ heading: 'Story Opening', content: body });
  }

  const chunks: MarkdownChunk[] = sections.map((sec, idx) => {
    const wordCount = sec.content.split(/\s+/).filter(Boolean).length;
    return {
      id: `chunk-${idx + 1}-${Date.now()}`,
      page_index: idx + 1,
      heading: sec.heading,
      raw_markdown: sec.content,
      word_count: wordCount,
      panels: []
    };
  });

  // Extract character candidates from dialogue patterns like:
  // "Text" Kira said or Kira: "Text" or Jax replied
  const detectedCharacters = extractCharacters(body);

  return {
    metadata,
    chunks,
    detectedCharacters
  };
}

/**
 * Heuristic extraction of character names and potential roles
 */
function extractCharacters(text: string): CharacterRosterItem[] {
  const charMap = new Map<string, { role: string; count: number }>();

  // Patterns: Kira whispered / Jax roared / Dr. Ada said / Professor Ada
  const dialogueAfterPattern = /"([^"]+)"\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|whispered|roared|replied|shouted|murmured|asked|exclaimed|gasped|warned)/g;
  let match: RegExpExecArray | null;

  while ((match = dialogueAfterPattern.exec(text)) !== null) {
    const name = match[2].trim();
    if (name && !['Suddenly', 'Inside', 'After', 'Behind', 'High', 'Beneath'].includes(name)) {
      const cur = charMap.get(name) || { role: 'Protagonist', count: 0 };
      cur.count += 1;
      charMap.set(name, cur);
    }
  }

  // Pattern: Kira: "Dialogue" or Sir Gareth: "..."
  const dialogueBeforePattern = /^([A-Z][a-zA-Z\s.-]+):\s*"/gm;
  while ((match = dialogueBeforePattern.exec(text)) !== null) {
    const name = match[1].trim();
    if (name.length > 1 && name.length < 25) {
      const cur = charMap.get(name) || { role: 'Character', count: 0 };
      cur.count += 2;
      charMap.set(name, cur);
    }
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
