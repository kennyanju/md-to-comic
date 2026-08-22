import { describe, it, expect } from 'vitest';
import { extractFrontmatter, parseMarkdownChunks } from '../lib/markdownParser';

describe('markdownParser', () => {
  it('extracts YAML frontmatter successfully', () => {
    const raw = `---
title: Neon Detective
author: Kenny
art_style: cyberpunk-neon
panels_per_page: 4
---
# Scene 1
The rain fell onto the cyber streets.`;

    const { metadata, body } = extractFrontmatter(raw);
    expect(metadata.title).toBe('Neon Detective');
    expect(metadata.author).toBe('Kenny');
    expect(metadata.art_style).toBe('cyberpunk-neon');
    expect(metadata.panels_per_page).toBe(4);
    expect(body.trim()).toContain('# Scene 1');
  });

  it('handles markdown without frontmatter gracefully', () => {
    const raw = `# Scene 1: The Encounter
Jax stood in the dark alley.`;
    const { metadata, body } = extractFrontmatter(raw);
    expect(metadata).toEqual({});
    expect(body).toBe(raw);
  });

  it('splits multi-page markdown on headers and page-break comments', () => {
    const raw = `# Page 1: The Beginning
Jax activated his visor.

<!-- page-break -->

## Page 2: The Ambush
The drone fired lasers.

# Page 3: The Escape
Jax jumped from the ledge.`;

    const { chunks } = parseMarkdownChunks(raw);
    expect(chunks.length).toBe(3);
    expect(chunks[0].heading).toBe('Page 1: The Beginning');
    expect(chunks[1].heading).toBe('Page 2: The Ambush');
    expect(chunks[2].heading).toBe('Page 3: The Escape');
  });

  it('detects characters from dialogues and capital names', () => {
    const raw = `---
title: Cyber Story
---
# Scene 1
Jax pulled his trench coat tighter. "We need to leave now," Jax warned.
Kira nodded firmly. "I already bypassed their security firewall," Kira answered.`;

    const parsed = parseMarkdownChunks(raw);
    expect(parsed.detectedCharacters.length).toBeGreaterThanOrEqual(1);
    const names = parsed.detectedCharacters.map(c => c.name);
    expect(names).toContain('Jax');
  });

  it('detects characters with titles, honorifics, and hyphenated names', () => {
    const raw = `
# Act 1
Dr. Voss scanned the datapad carefully.
"The core is stabilizing," Professor Ada whispered.
Captain Jean-Luc ordered the shields up.
ZARA: "All systems green."
`;

    const parsed = parseMarkdownChunks(raw);
    const names = parsed.detectedCharacters.map(c => c.name);
    expect(names.some(n => n.includes('Dr. Voss'))).toBe(true);
    expect(names.some(n => n.includes('Professor Ada'))).toBe(true);
    expect(names.some(n => n.includes('Captain Jean-Luc'))).toBe(true);
  });
});
