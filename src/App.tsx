import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { WizardStepper } from './components/WizardStepper';
import { IngestionView } from './components/IngestionView';
import { ScriptingView } from './components/ScriptingView';
import { PanelEditorView } from './components/PanelEditorView';
import { GenerationView } from './components/GenerationView';
import { ProjectGalleryModal } from './components/ProjectGalleryModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, useToast } from './components/ToastContext';

const ComicStudioView = React.lazy(() => import('./components/ComicStudioView').then(module => ({ default: module.ComicStudioView })));
const ExportView = React.lazy(() => import('./components/ExportView').then(module => ({ default: module.ExportView })));
const SettingsModal = React.lazy(() => import('./components/SettingsModal').then(module => ({ default: module.SettingsModal })));

import { ComicProject, UserSettings, ComicPage, PageLayoutType, BorderStyle } from './types/comic';
import { parseMarkdownChunks } from './lib/markdownParser';
import { generateComicScript } from './lib/llmClient';
import { SAMPLE_STORIES } from './lib/sampleStories';
import { 
  loadSettings, 
  loadDecryptedSettings,
  saveSettings, 
  loadActiveProject, 
  loadHydratedActiveProject,
  saveActiveProject, 
  loadProjectFromGallery, 
  saveProjectToGallery 
} from './lib/storage';
import { generateUUID } from './lib/crypto';
import { useUndoRedo } from './hooks/useUndoRedo';

import './styles/index.css';
import './styles/app.css';
import './styles/components.css';
import './styles/comicStudio.css';

const INITIAL_PROJECT: ComicProject = {
  id: `proj-${generateUUID()}`,
  title: 'Neon Protocol: The Ghost Chip',
  created_at: Date.now(),
  updated_at: Date.now(),
  metadata: {},
  raw_markdown: SAMPLE_STORIES[0].markdown,
  selected_style_id: 'cyberpunk-neon',
  characters: [],
  pages: [],
  current_step: 0
};

const AppContent: React.FC = () => {
  const {
    state: project,
    setState: setProject,
    undo,
    redo,
    canUndo,
    canRedo
  } = useUndoRedo<ComicProject>(() => {
    return loadActiveProject() || INITIAL_PROJECT;
  }, { maxHistory: 40, debounceMs: 500 });

  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [maxReachedStep, setMaxReachedStep] = useState(project.current_step);
  const [panelsPerPage, setPanelsPerPage] = useState(settings.panelsPerPage || 4);
  const toast = useToast();

  // Dynamic document title update
  useEffect(() => {
    const title = project.title ? `${project.title} — MD to Comic Studio` : 'MD to Comic Studio';
    document.title = title;
  }, [project.title]);

  // Initial load: hydrate project with IndexedDB images and decrypted settings
  useEffect(() => {
    loadHydratedActiveProject().then(hydrated => {
      if (hydrated) {
        setProject(hydrated, false);
      }
    }).catch(console.warn);

    loadDecryptedSettings().then(decrypted => {
      setSettings(decrypted);
    }).catch(console.warn);
  }, []);

  // Auto-parse characters and metadata on first load if markdown is present without characters
  useEffect(() => {
    if (project.characters.length === 0 && project.raw_markdown) {
      const parsed = parseMarkdownChunks(project.raw_markdown);
      setProject(prev => ({
        ...prev,
        metadata: parsed.metadata,
        characters: parsed.detectedCharacters,
        title: (parsed.metadata.title as string) || 'Comic Story'
      }), false);
      
      if (parsed.metadata.panels_per_page && typeof parsed.metadata.panels_per_page === 'number') {
        setPanelsPerPage(parsed.metadata.panels_per_page);
      }
    }
  }, []);

  // Autosave project
  useEffect(() => {
    saveActiveProject(project);
    if (project.current_step > maxReachedStep) {
      setMaxReachedStep(project.current_step);
    }
  }, [project]);

  const handleSettingsSave = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    toast.success('Settings updated & encrypted successfully');
  };

  useEffect(() => {
    if (panelsPerPage !== settings.panelsPerPage) {
      const updated = { ...settings, panelsPerPage };
      setSettings(updated);
      saveSettings(updated);
    }
  }, [panelsPerPage]);

  const handleMarkdownChange = (md: string) => {
    const parsed = parseMarkdownChunks(md);
    setProject(prev => ({
      ...prev,
      raw_markdown: md,
      metadata: parsed.metadata,
      characters: parsed.detectedCharacters,
      title: (parsed.metadata.title as string) || prev.title,
      updated_at: Date.now()
    }));
  };

  const handleStyleSelect = (styleId: string) => {
    setProject(prev => ({
      ...prev,
      selected_style_id: styleId,
      updated_at: Date.now()
    }));
    toast.info(`Art style set to "${styleId}".`);
  };

  const handleRunScriptGeneration = async () => {
    const hasDonePanels = project.pages.some(p => p.panels.some(panel => panel.status === 'done'));
    if (hasDonePanels) {
      const confirm = window.confirm('You already have panels with generated images. Re-running script generation will overwrite them. Continue?');
      if (!confirm) return;
    }

    setIsGeneratingScript(true);
    const parsed = parseMarkdownChunks(project.raw_markdown);

    try {
      const promises = parsed.chunks.map(async (chunk, i) => {
        const panels = await generateComicScript({
          chunk,
          metadata: project.metadata,
          characters: project.characters,
          apiKey: settings.openrouter_key,
          model: settings.preferred_llm_model,
          artStyleId: project.selected_style_id,
          targetPanels: panelsPerPage
        });

        let defaultLayout: PageLayoutType = 'grid-4';
        if (project.selected_style_id === 'manga-anime' && panels.length === 6) defaultLayout = 'manga-6';
        else if (panels.length === 5) defaultLayout = 'action-5';
        else if (panels.length === 6) defaultLayout = 'manga-6';
        else if (panels.length === 3) defaultLayout = 'cinematic-3';
        else if (panels.length === 2) defaultLayout = 'hero-split-2';
        else if (panels.length === 1) defaultLayout = 'splash-1';

        let defaultBorder: BorderStyle = 'ink-gutter';
        if (project.selected_style_id === 'cyberpunk-neon') defaultBorder = 'neon-glow';
        if (project.selected_style_id === 'manga-anime') defaultBorder = 'manga-clean';
        if (project.selected_style_id === 'noir-detective') defaultBorder = 'classic-black';

        return {
          id: `page-${i + 1}-${generateUUID().slice(0, 8)}`,
          page_index: i + 1,
          title: chunk.heading,
          panels,
          layout_config: {
            layout_type: defaultLayout,
            border_style: defaultBorder,
            gutter_width: project.selected_style_id === 'manga-anime' ? 4 : 14,
            font_family: 'Bangers',
            bg_color: '#ffffff',
            border_color: '#000000',
            show_page_number: true,
            dpi: 150
          }
        } as ComicPage;
      });

      const generatedPages = await Promise.all(promises);

      setProject(prev => ({
        ...prev,
        pages: generatedPages,
        current_step: 2, // Go to Panel Review
        updated_at: Date.now()
      }));
      setMaxReachedStep(Math.max(maxReachedStep, 2));
      toast.success('Script generated! Proceeding to Panel Review.');
    } catch (err) {
      console.error('Failed to generate script:', err);
      toast.error('Failed to generate script. Check your API key and connection.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleQuickDemo = () => {
    const sample = SAMPLE_STORIES[0];
    const parsed = parseMarkdownChunks(sample.markdown);

    setProject({
      id: `proj-demo-${generateUUID().slice(0, 8)}`,
      title: sample.title,
      created_at: Date.now(),
      updated_at: Date.now(),
      metadata: parsed.metadata,
      raw_markdown: sample.markdown,
      selected_style_id: sample.style_id,
      characters: parsed.detectedCharacters,
      pages: [],
      current_step: 0
    });
    setMaxReachedStep(0);
    toast.info(`Loaded demo story: "${sample.title}"`);
  };

  const handleResetProject = () => {
    if (window.confirm('Start a new comic project? Ensure your current work is saved to gallery.')) {
      if (project.id && project.pages.length > 0) {
        saveProjectToGallery(project);
      }
      setProject({
        id: `proj-${generateUUID()}`,
        title: 'New Comic Story',
        created_at: Date.now(),
        updated_at: Date.now(),
        metadata: {},
        raw_markdown: '',
        selected_style_id: 'western-heroic',
        characters: [],
        pages: [],
        current_step: 0
      });
      setMaxReachedStep(0);
      toast.info('New comic project initiated');
    }
  };

  const handleLoadProject = async (id: string) => {
    const loaded = await loadProjectFromGallery(id);
    if (loaded) {
      setProject(loaded);
      setMaxReachedStep(loaded.current_step);
      toast.success(`Loaded project: "${loaded.title || 'Comic'}"`);
    }
  };

  const handleImportProject = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported && imported.id && imported.pages) {
          setProject(imported);
          setMaxReachedStep(imported.current_step);
          saveProjectToGallery(imported);
          toast.success(`Imported project: ${imported.title || 'Comic'}`);
        } else {
          toast.error('Invalid project JSON structure.');
        }
      } catch {
        toast.error('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const parsedChunks = useMemo(() => parseMarkdownChunks(project.raw_markdown).chunks, [project.raw_markdown]);
  const hasPanels = project.pages.some(p => p.panels.length > 0);

  return (
    <div className="app-container">
      <a href="#main-viewport" className="skip-to-content">
        Skip to main content
      </a>

      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetProject={handleResetProject}
        onQuickDemo={handleQuickDemo}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        selectedStyleId={project.selected_style_id}
        onStyleSelect={handleStyleSelect}
        hasPanels={hasPanels}
        projectTitle={project.title}
      />

      <WizardStepper
        currentStep={project.current_step}
        onStepClick={(step) => setProject(p => ({ ...p, current_step: step }))}
        maxReachedStep={maxReachedStep}
      />

      <main id="main-viewport" className="main-viewport" tabIndex={-1}>
        {project.current_step === 0 && (
          <IngestionView
            markdown={project.raw_markdown}
            onMarkdownChange={handleMarkdownChange}
            selectedStyleId={project.selected_style_id}
            onStyleSelect={handleStyleSelect}
            onProceed={() => setProject(p => ({ ...p, current_step: 1 }))}
          />
        )}

        {project.current_step === 1 && (
          <ScriptingView
            chunks={parsedChunks}
            characters={project.characters}
            onCharactersChange={(chars) => setProject(p => ({ ...p, characters: chars }))}
            selectedModel={settings.preferred_llm_model}
            onModelChange={(m) => setSettings(s => ({ ...s, preferred_llm_model: m }))}
            panelsPerPage={panelsPerPage}
            onPanelsPerPageChange={setPanelsPerPage}
            isGenerating={isGeneratingScript}
            onRunScriptGeneration={handleRunScriptGeneration}
            onBack={() => setProject(p => ({ ...p, current_step: 0 }))}
            onProceed={() => setProject(p => ({ ...p, current_step: 2 }))}
            hasGeneratedPanels={project.pages.length > 0}
          />
        )}

        {project.current_step === 2 && (
          <PanelEditorView
            pages={project.pages}
            onPagesChange={(pages) => setProject(p => ({ ...p, pages }))}
            characters={project.characters}
            selectedStyleId={project.selected_style_id}
            onStyleSelect={handleStyleSelect}
            onBack={() => setProject(p => ({ ...p, current_step: 1 }))}
            onProceed={() => setProject(p => ({ ...p, current_step: 3 }))}
          />
        )}

        {project.current_step === 3 && (
          <GenerationView
            pages={project.pages}
            onPagesChange={(pages) => setProject(p => ({ ...p, pages }))}
            characters={project.characters}
            selectedStyleId={project.selected_style_id}
            onStyleSelect={handleStyleSelect}
            settings={settings}
            onSettingsChange={setSettings}
            onBack={() => setProject(p => ({ ...p, current_step: 2 }))}
            onProceed={() => setProject(p => ({ ...p, current_step: 4 }))}
            onOpenSettingsModal={() => setIsSettingsOpen(true)}
          />
        )}

        {project.current_step === 4 && (
          <Suspense fallback={<div className="loading-spinner" aria-label="Loading Comic Studio" />}>
            <ComicStudioView
              pages={project.pages}
              onPagesChange={(pages) => setProject(p => ({ ...p, pages }))}
              characters={project.characters}
              selectedStyleId={project.selected_style_id}
              settings={settings}
              onBack={() => setProject(p => ({ ...p, current_step: 3 }))}
              onProceed={() => setIsExportOpen(true)}
              onOpenExport={() => setIsExportOpen(true)}
            />
          </Suspense>
        )}
      </main>

      <footer className="footer">
        <div>
          <strong>MD to Comic Studio</strong> — Powered by OpenRouter, Replicate, Hugging Face & Cloudflare
        </div>
        <div className="footer-links">
          <span>Dual Mode: Cloud API & Built-in Engine</span>
          <span>Cloudflare Workers Ready</span>
        </div>
      </footer>

      <Suspense fallback={null}>
        <ExportView
          project={project}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSave={handleSettingsSave}
        />
      </Suspense>

      <ProjectGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onLoadProject={handleLoadProject}
        onImportProject={handleImportProject}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
