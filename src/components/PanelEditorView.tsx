import React, { useState } from 'react';
import { 
  LayoutGrid, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Camera 
} from 'lucide-react';
import { ComicPage, PanelScript, DialogueItem, ShotType, CharacterRosterItem } from '../types/comic';
import { getArtStyleById } from '../lib/artStyles';
import { buildImageGenerationPrompt } from '../lib/promptBuilder';

interface PanelEditorViewProps {
  pages: ComicPage[];
  onPagesChange: (pages: ComicPage[]) => void;
  characters: CharacterRosterItem[];
  selectedStyleId: string;
  onBack: () => void;
  onProceed: () => void;
}

const SHOT_OPTIONS: { id: ShotType; label: string }[] = [
  { id: 'wide', label: 'Wide Establishing Shot' },
  { id: 'medium', label: 'Medium Character Shot' },
  { id: 'close_up', label: 'Close-Up Portrait' },
  { id: 'extreme_close_up', label: 'Extreme Close Detail' },
  { id: 'birds_eye', label: "Bird's-Eye Overhead" },
  { id: 'dutch_angle', label: 'Dutch Tilted Action Angle' }
];

export const PanelEditorView: React.FC<PanelEditorViewProps> = ({
  pages,
  onPagesChange,
  characters,
  selectedStyleId,
  onBack,
  onProceed
}) => {
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [expandedPromptPanelId, setExpandedPromptPanelId] = useState<string | null>(null);

  const currentPage = pages[selectedPageIndex] || pages[0];
  const artStyle = getArtStyleById(selectedStyleId);

  const updatePanel = (panelId: string, updater: (p: PanelScript) => PanelScript) => {
    const newPages = pages.map((page, pIdx) => {
      if (pIdx !== selectedPageIndex) return page;
      return {
        ...page,
        panels: page.panels.map(panel => panel.id === panelId ? updater(panel) : panel)
      };
    });
    onPagesChange(newPages);
  };

  const addDialogueItem = (panelId: string) => {
    updatePanel(panelId, p => ({
      ...p,
      dialogue: [
        ...p.dialogue,
        {
          id: `dlg-${Date.now()}`,
          speaker: characters[0]?.name || 'Hero',
          line: 'New dialogue line...',
          type: 'speech'
        }
      ]
    }));
  };

  const updateDialogueItem = (panelId: string, dlgId: string, field: keyof DialogueItem, value: any) => {
    updatePanel(panelId, p => ({
      ...p,
      dialogue: p.dialogue.map(d => d.id === dlgId ? { ...d, [field]: value } : d)
    }));
  };

  const removeDialogueItem = (panelId: string, dlgId: string) => {
    updatePanel(panelId, p => ({
      ...p,
      dialogue: p.dialogue.filter(d => d.id !== dlgId)
    }));
  };

  const addPanel = () => {
    const newPanel: PanelScript = {
      id: `panel-${currentPage.page_index}-${currentPage.panels.length + 1}-${Date.now()}`,
      panel_index: currentPage.panels.length + 1,
      page_index: currentPage.page_index,
      shot_type: 'medium',
      scene_description: 'Action scene with dramatic lighting.',
      mood: 'Intense',
      dialogue: [],
      character_tags: [characters[0]?.name || 'Hero'],
      generated_prompt: 'Medium shot of comic hero standing resolute.',
      status: 'pending'
    };

    const newPages = pages.map((page, pIdx) => {
      if (pIdx !== selectedPageIndex) return page;
      return { ...page, panels: [...page.panels, newPanel] };
    });
    onPagesChange(newPages);
  };

  const removePanel = (panelId: string) => {
    const newPages = pages.map((page, pIdx) => {
      if (pIdx !== selectedPageIndex) return page;
      return {
        ...page,
        panels: page.panels
          .filter(p => p.id !== panelId)
          .map((p, idx) => ({ ...p, panel_index: idx + 1 }))
      };
    });
    onPagesChange(newPages);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <LayoutGrid color="#f59e0b" size={28} />
            Step 3: Script Review & Panel Refinement
          </h1>
          <p>
            Fine-tune scene descriptions, camera shot angles, speech bubbles, and captions before generating images.
          </p>
        </div>

        <div className="view-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <button className="btn btn-primary btn-lg" onClick={onProceed}>
            <span>Proceed to Image Generation</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Page Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {pages.map((p, idx) => (
            <button
              key={p.id || idx}
              className={`btn ${selectedPageIndex === idx ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setSelectedPageIndex(idx)}
            >
              <span>Page {p.page_index}: {p.title || `Scene ${p.page_index}`}</span>
              <span className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                {p.panels.length} Panels
              </span>
            </button>
          ))}
        </div>

        <button className="btn btn-secondary btn-sm" onClick={addPanel}>
          <Plus size={14} />
          <span>Add Panel to Page {currentPage.page_index}</span>
        </button>
      </div>

      {/* Panel Cards Grid */}
      <div className="panel-cards-grid">
        {currentPage.panels.map((panel) => {
          const { prompt } = buildImageGenerationPrompt(panel, characters, artStyle);
          const isExpanded = expandedPromptPanelId === panel.id;

          return (
            <div key={panel.id} className="panel-editor-card">
              <div className="panel-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="panel-badge-idx">PANEL #{panel.panel_index}</span>
                  <span className="badge badge-cyan">{panel.shot_type}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setExpandedPromptPanelId(isExpanded ? null : panel.id)}
                    title="View Image Generation Prompt"
                  >
                    <Eye size={14} color="#06b6d4" />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => removePanel(panel.id)}
                    title="Delete Panel"
                  >
                    <Trash2 size={14} color="#f43f5e" />
                  </button>
                </div>
              </div>

              {/* Shot Type & Mood */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                    <Camera size={12} /> Camera Shot
                  </label>
                  <select
                    value={panel.shot_type}
                    onChange={(e) => updatePanel(panel.id, p => ({ ...p, shot_type: e.target.value as ShotType }))}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    {SHOT_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                    Scene Mood
                  </label>
                  <input
                    type="text"
                    value={panel.mood}
                    onChange={(e) => updatePanel(panel.id, p => ({ ...p, mood: e.target.value }))}
                    placeholder="e.g. Dramatic"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Scene Description (Visual Core) */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Visual Scene Description:
                </label>
                <textarea
                  value={panel.scene_description}
                  onChange={(e) => updatePanel(panel.id, p => ({ ...p, scene_description: e.target.value }))}
                  rows={3}
                  placeholder="Describe visual composition, character poses, background, lighting..."
                  style={{ width: '100%', fontSize: '0.86rem' }}
                />
              </div>

              {/* Narrator Caption */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Narrator Caption (Optional Top Box):
                </label>
                <input
                  type="text"
                  value={panel.caption || ''}
                  onChange={(e) => updatePanel(panel.id, p => ({ ...p, caption: e.target.value }))}
                  placeholder="Meanwhile, deep within the obsidian core..."
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              {/* Speech & Dialogue Bubbles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MessageSquare size={13} color="#8b5cf6" />
                    Speech Bubbles ({panel.dialogue.length})
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => addDialogueItem(panel.id)}
                  >
                    <Plus size={12} /> Add Line
                  </button>
                </div>

                {panel.dialogue.map((dlg) => (
                  <div key={dlg.id} className="panel-dialogue-item">
                    <select
                      value={dlg.type}
                      onChange={(e) => updateDialogueItem(panel.id, dlg.id, 'type', e.target.value)}
                      style={{ fontSize: '0.78rem', padding: '0.3rem', width: '85px' }}
                    >
                      <option value="speech">Speech</option>
                      <option value="shout">Shout 💥</option>
                      <option value="thought">Thought 💭</option>
                    </select>

                    <input
                      type="text"
                      value={dlg.speaker}
                      onChange={(e) => updateDialogueItem(panel.id, dlg.id, 'speaker', e.target.value)}
                      placeholder="Speaker"
                      style={{ width: '80px', fontSize: '0.82rem', padding: '0.3rem 0.5rem' }}
                    />

                    <input
                      type="text"
                      value={dlg.line}
                      onChange={(e) => updateDialogueItem(panel.id, dlg.id, 'line', e.target.value)}
                      placeholder="Dialogue line text..."
                      style={{ flex: 1, fontSize: '0.82rem', padding: '0.3rem 0.5rem' }}
                    />

                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeDialogueItem(panel.id, dlg.id)}
                      style={{ padding: '0.2rem' }}
                    >
                      <Trash2 size={13} color="#f43f5e" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Prompt Inspector Drawer */}
              {isExpanded && (
                <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-medium)', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Sparkles size={12} />
                    Assembled AI Prompt (With Roster & Style):
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {prompt}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
