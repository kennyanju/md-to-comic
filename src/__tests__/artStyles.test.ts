import { describe, it, expect } from 'vitest';
import { ART_STYLE_PRESETS, getArtStyleById } from '../lib/artStyles';

describe('artStyles', () => {
  it('contains valid art style presets', () => {
    expect(ART_STYLE_PRESETS.length).toBeGreaterThan(0);
    ART_STYLE_PRESETS.forEach(style => {
      expect(style.id).toBeTruthy();
      expect(style.name).toBeTruthy();
      expect(style.prompt_suffix).toBeTruthy();
      expect(style.negative_prompt).toBeTruthy();
    });
  });

  it('retrieves style by ID accurately', () => {
    const manga = getArtStyleById('manga-anime');
    expect(manga.id).toBe('manga-anime');
    expect(manga.name).toContain('Manga');
  });

  it('falls back to default style when given invalid ID', () => {
    const fallback = getArtStyleById('non-existent-style-123');
    expect(fallback).toBeDefined();
    expect(fallback.id).toBe(ART_STYLE_PRESETS[0].id);
  });
});
