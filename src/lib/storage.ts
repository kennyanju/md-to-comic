import { ComicProject, UserSettings } from '../types/comic';
import { encryptSecret, decryptSecret } from './crypto';
import { saveAllProjectImages, hydratePagesWithImages } from './imageDb';

const SETTINGS_KEY = 'md_to_comic_settings';
const ACTIVE_PROJECT_KEY = 'md_to_comic_active_project';
const SAVED_PROJECTS_KEY = 'md_to_comic_saved_projects';

export const DEFAULT_SETTINGS: UserSettings = {
  openrouter_key: '',
  replicate_key: '',
  hf_token: '',
  cloudflare_token: '',
  cloudflare_account_id: '',
  preferred_llm_model: 'google/gemini-2.5-pro',
  preferred_image_backend: 'mock_demo',
  replicate_model: 'black-forest-labs/flux-schnell',
  hf_model: 'stabilityai/stable-diffusion-xl-base-1.0',
  panelsPerPage: 4
};

type SensitiveKey = 'openrouter_key' | 'replicate_key' | 'hf_token' | 'cloudflare_token';
const SENSITIVE_KEYS: SensitiveKey[] = [
  'openrouter_key',
  'replicate_key',
  'hf_token',
  'cloudflare_token'
];

/**
 * Synchronously loads settings from localStorage with immediate legacy/decrypted values
 */
export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Asynchronously loads and decrypts user settings
 */
export async function loadDecryptedSettings(): Promise<UserSettings> {
  const settings = loadSettings();
  const decrypted: UserSettings = { ...settings };

  for (const key of SENSITIVE_KEYS) {
    const val = settings[key];
    if (typeof val === 'string' && val) {
      (decrypted as Record<SensitiveKey, string>)[key] = await decryptSecret(val);
    }
  }

  return decrypted;
}

/**
 * Saves settings to localStorage with encrypted API keys
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    const encrypted: UserSettings = { ...settings };
    for (const key of SENSITIVE_KEYS) {
      const val = settings[key];
      if (typeof val === 'string' && val) {
        (encrypted as Record<SensitiveKey, string>)[key] = await encryptSecret(val);
      }
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(encrypted));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

/**
 * Helper to strip base64 data URIs for localStorage safety
 */
function createLightweightProject(project: ComicProject): ComicProject {
  return {
    ...project,
    pages: project.pages.map(page => ({
      ...page,
      assembled_image_url: undefined,
      panels: page.panels.map(p => ({
        ...p,
        // If image_url is a heavy base64 data URI, strip it from localStorage payload
        // (it will be persisted in IndexedDB)
        image_url: p.image_url?.startsWith('data:image') ? undefined : p.image_url
      }))
    }))
  };
}

export function loadActiveProject(): ComicProject | null {
  try {
    const raw = localStorage.getItem(ACTIVE_PROJECT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Asynchronously loads active project and hydrates panel images from IndexedDB
 */
export async function loadHydratedActiveProject(): Promise<ComicProject | null> {
  const project = loadActiveProject();
  if (!project) return null;

  try {
    const hydratedPages = await hydratePagesWithImages(project.pages);
    return { ...project, pages: hydratedPages };
  } catch (err) {
    console.warn('Failed to hydrate active project from IndexedDB:', err);
    return project;
  }
}

export function saveActiveProject(project: ComicProject): void {
  try {
    // Persist full images in IndexedDB asynchronously
    saveAllProjectImages(project.pages).catch(console.warn);

    // Attempt direct save
    try {
      localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(project));
    } catch (quotaErr) {
      // If quota exceeded, save lightweight version without heavy inline base64
      console.warn('LocalStorage quota limit reached, saving lightweight project payload:', quotaErr);
      const light = createLightweightProject(project);
      localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(light));
    }
  } catch (e) {
    console.error('Failed to save active project:', e);
  }
}

export function listSavedProjects(): Array<{ id: string; title: string; updated_at: number }> {
  try {
    const raw = localStorage.getItem(SAVED_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProjectToGallery(project: ComicProject): void {
  try {
    saveAllProjectImages(project.pages).catch(console.warn);

    const projects = listSavedProjects();
    const existingIdx = projects.findIndex(p => p.id === project.id);
    const summary = { id: project.id, title: project.title, updated_at: project.updated_at };
    
    if (existingIdx >= 0) {
      projects[existingIdx] = summary;
    } else {
      projects.push(summary);
    }
    
    localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(projects));

    try {
      localStorage.setItem(`comic_proj_${project.id}`, JSON.stringify(project));
    } catch (quotaErr) {
      console.warn('LocalStorage quota exceeded in gallery save, stripping inline images:', quotaErr);
      const light = createLightweightProject(project);
      localStorage.setItem(`comic_proj_${project.id}`, JSON.stringify(light));
    }
  } catch (e) {
    console.error('Failed to save project to gallery:', e);
  }
}

export async function loadProjectFromGallery(id: string): Promise<ComicProject | null> {
  try {
    const raw = localStorage.getItem(`comic_proj_${id}`);
    if (!raw) return null;
    const project: ComicProject = JSON.parse(raw);
    const hydratedPages = await hydratePagesWithImages(project.pages);
    return { ...project, pages: hydratedPages };
  } catch {
    return null;
  }
}

export function deleteProject(id: string): void {
  try {
    let projects = listSavedProjects();
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(projects));
    localStorage.removeItem(`comic_proj_${id}`);
  } catch (e) {
    console.error('Failed to delete project:', e);
  }
}
