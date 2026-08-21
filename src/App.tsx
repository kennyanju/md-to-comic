import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WizardStepper } from './components/WizardStepper';
import { IngestionView } from './components/IngestionView';
import { ScriptingView } from './components/ScriptingView';
import { PanelEditorView } from './components/PanelEditorView';
import { GenerationView } from './components/GenerationView';
import { ComicStudioView } from './components/ComicStudioView';
import { ExportView } from './components/ExportView';
import { SettingsModal } from './components/SettingsModal';

import { ComicProject, UserSettings, ComicPage } from './types/comic';
import { parseMarkdownChunks } from './lib/markdownParser';
import { generateComicScript } from './lib/llmClient';
import { SAMPLE_STORIES } from './lib/sampleStories';
import { loadSettings, saveSettings, loadActiveProject, saveActiveProject } from './lib/storage';

import './styles/index.css';
import './styles/app.css';
import './styles/components.css';
import './styles/comicStudio.css';

const INITIAL_PROJECT: ComicProject = {
  id: `proj-${Date.now()}`,
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

export const App: React.FC = () => {
  const [project, setProject] = useState<ComicProject>(() => {
    return loadActiveProject() || INITIAL_PROJECT;
  });

  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [maxReachedStep, setMaxReachedStep] = useState(project.current_step);
  const [panelsPerPage, setPanelsPerPage] = useState(4);

  // Auto-parse characters and metadata on first load or when markdown changes if no characters exist
  useEffect(() => {
    if (project.characters.length === 0 && project.raw_markdown) {
      const parsed = parseMarkdownChunks(project.raw_markdown);
      setProject(prev => ({
        ...prev,
        metadata: parsed.metadata,
        characters: parsed.detectedCharacters,
        title: (parsed.metadata.title as string) || 'Comic Story'
      }));
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
  };

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

  const handleRunScriptGeneration = async () => {
    setIsGeneratingScript(true);
    const parsed = parseMarkdownChunks(project.raw_markdown);

    try {
      const generatedPages: ComicPage[] = [];

      for (let i = 0; i < parsed.chunks.length; i++) {
        const chunk = parsed.chunks[i];
        const panels = await generateComicScript({
          chunk,
          metadata: project.metadata,
          characters: project.characters,
          apiKey: settings.openrouter_key,
          model: settings.preferred_llm_model,
          artStyleId: project.selected_style_id,
          targetPanels: panelsPerPage
        });

        generatedPages.push({
          id: `page-${i + 1}-${Date.now()}`,
          page_index: i + 1,
          title: chunk.heading,
          panels,
          layout_config: {
            layout_type: panels.length === 5 ? 'action-5' : panels.length === 6 ? 'manga-6' : panels.length === 3 ? 'cinematic-3' : 'grid-4',
            border_style: project.selected_style_id === 'cyberpunk-neon' ? 'neon-glow' : 'ink-gutter',
            gutter_width: 14,
            font_family: 'Bangers',
            bg_color: '#ffffff',
            border_color: '#000000',
            show_page_number: true,
            dpi: 150
          }
        });
      }

      setProject(prev => ({
        ...prev,
        pages: generatedPages,
        current_step: 2, // Go to Panel Review
        updated_at: Date.now()
      }));
      setMaxReachedStep(Math.max(maxReachedStep, 2));
    } catch (err) {
      console.error('Failed to generate script:', err);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleQuickDemo = () => {
    const sample = SAMPLE_STORIES[0];
    const parsed = parseMarkdownChunks(sample.markdown);

    setProject({
      id: `proj-demo-${Date.now()}`,
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
  };

  const handleResetProject = () => {
    if (window.confirm('Start a new comic project? Unsaved changes will be cleared.')) {
      setProject({
        id: `proj-${Date.now()}`,
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
    }
  };

  const parsedChunks = parseMarkdownChunks(project.raw_markdown).chunks;
  const hasPanels = project.pages.some(p => p.panels.length > 0);

  return (
    <div className="app-container">
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetProject={handleResetProject}
        onQuickDemo={handleQuickDemo}
        onOpenExport={() => setIsExportOpen(true)}
        hasPanels={hasPanels}
        projectTitle={project.title}
      />

      <WizardStepper
        currentStep={project.current_step}
        onStepClick={(step) => setProject(p => ({ ...p, current_step: step }))}
        maxReachedStep={maxReachedStep}
      />

      <main className="main-viewport">
        {project.current_step === 0 && (
          <IngestionView
            markdown={project.raw_markdown}
            onMarkdownChange={handleMarkdownChange}
            selectedStyleId={project.selected_style_id}
            onStyleSelect={(id) => setProject(p => ({ ...p, selected_style_id: id }))}
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
            settings={settings}
            onSettingsChange={setSettings}
            onBack={() => setProject(p => ({ ...p, current_step: 2 }))}
            onProceed={() => setProject(p => ({ ...p, current_step: 4 }))}
            onOpenSettingsModal={() => setIsSettingsOpen(true)}
          />
        )}

        {project.current_step === 4 && (
          <ComicStudioView
            pages={project.pages}
            onPagesChange={(pages) => setProject(p => ({ ...p, pages }))}
            onBack={() => setProject(p => ({ ...p, current_step: 3 }))}
            onProceed={() => setIsExportOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
          />
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

      <ExportView
        project={project}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSettingsSave}
      />
    </div>
  );
};
export default App;
