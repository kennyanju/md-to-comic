import { ComicProject, UserSettings } from '../types/comic';

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
  hf_model: 'black-forest-labs/FLUX.1-schnell',
  panelsPerPage: 4
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadActiveProject(): ComicProject | null {
  try {
    const raw = localStorage.getItem(ACTIVE_PROJECT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveProject(project: ComicProject): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(project));
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
    const projects = listSavedProjects();
    const existingIdx = projects.findIndex(p => p.id === project.id);
    const summary = { id: project.id, title: project.title, updated_at: project.updated_at };
    
    if (existingIdx >= 0) {
      projects[existingIdx] = summary;
    } else {
      projects.push(summary);
    }
    
    // Save summary list
    localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(projects));
    // Save full project data using its ID as the key
    localStorage.setItem(`comic_proj_${project.id}`, JSON.stringify(project));
  } catch (e) {
    console.error('Failed to save project to gallery:', e);
  }
}

export function loadProjectFromGallery(id: string): ComicProject | null {
  try {
    const raw = localStorage.getItem(`comic_proj_${id}`);
    return raw ? JSON.parse(raw) : null;
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
