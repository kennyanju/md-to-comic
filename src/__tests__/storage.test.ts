import { describe, it, expect, beforeEach } from 'vitest';
import { 
  loadSettings, 
  loadDecryptedSettings,
  saveSettings, 
  DEFAULT_SETTINGS, 
  loadActiveProject, 
  saveActiveProject,
  listSavedProjects,
  saveProjectToGallery,
  loadProjectFromGallery,
  deleteProject
} from '../lib/storage';
import { ComicProject } from '../types/comic';

// Mock localStorage for test runner
const mockStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStore[key] || null,
  setItem: (key: string, value: string) => { mockStore[key] = value; },
  removeItem: (key: string) => { delete mockStore[key]; },
  clear: () => { Object.keys(mockStore).forEach(k => delete mockStore[k]); }
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('storage', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('loads default settings when storage is empty', () => {
    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('persists and retrieves user settings correctly', async () => {
    const customSettings = {
      ...DEFAULT_SETTINGS,
      openrouter_key: 'sk-test-12345',
      preferred_llm_model: 'anthropic/claude-3.5-sonnet'
    };
    await saveSettings(customSettings);
    const loaded = await loadDecryptedSettings();
    expect(loaded.openrouter_key).toBe('sk-test-12345');
    expect(loaded.preferred_llm_model).toBe('anthropic/claude-3.5-sonnet');
  });

  it('saves and loads active project', () => {
    const project: ComicProject = {
      id: 'proj-test',
      title: 'Test Cyber Comic',
      created_at: 1000,
      updated_at: 2000,
      metadata: {},
      raw_markdown: '# Test',
      selected_style_id: 'cyberpunk-neon',
      characters: [],
      pages: [],
      current_step: 1
    };

    saveActiveProject(project);
    const loaded = loadActiveProject();
    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe('proj-test');
    expect(loaded?.title).toBe('Test Cyber Comic');
  });

  it('saves, loads, and deletes projects from gallery', async () => {
    const project: ComicProject = {
      id: 'proj-gallery-1',
      title: 'Gallery Comic',
      created_at: 1000,
      updated_at: 2000,
      metadata: {},
      raw_markdown: '# Gallery',
      selected_style_id: 'manga-anime',
      characters: [],
      pages: [],
      current_step: 2
    };

    saveProjectToGallery(project);
    const list = listSavedProjects();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('proj-gallery-1');

    const loaded = await loadProjectFromGallery('proj-gallery-1');
    expect(loaded?.id).toBe('proj-gallery-1');

    deleteProject('proj-gallery-1');
    expect(listSavedProjects().length).toBe(0);
    expect(await loadProjectFromGallery('proj-gallery-1')).toBeNull();
  });
});
