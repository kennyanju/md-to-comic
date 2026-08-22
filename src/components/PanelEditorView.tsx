import React, { useState } from 'react';
import { 
  LayoutGrid, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Sparkles, 
  Eye, 
  Camera,
  ChevronUp,
  ChevronDown,
  Palette
} from 'lucide-react';
import { ComicPage, ShotType, CharacterRosterItem, BubbleType } from '../types/comic';
import { getArtStyleById, ART_STYLES } from '../lib/artStyles';
import { buildImageGenerationPrompt } from '../lib/promptBuilder';
import { usePanelUpdater } from '../hooks/usePanelUpdater';

interface PanelEditorViewProps {
  pages: ComicPage[];
  onPagesChange: (pages: ComicPage[]) => void;
  characters: CharacterRosterItem[];
  selectedStyleId: string;
  onStyleSelect?: (styleId: string) => void;
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
  onStyleSelect,
  onBack,
  onProceed
}) => {
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [expandedPromptPanelId, setExpandedPromptPanelId] = useState<string | null>(null);

  const {
    updatePanel,
    addPanel,
    removePanel,
    reorderPanels,
    addDialogueItem,
    updateDialogueItem,
    removeDialogueItem
  } = usePanelUpdater(pages, onPagesChange);

  const currentPage = pages[selectedPageIndex] || pages[0];
  const artStyle = getArtStyleById(selectedStyleId);

  const handleShotChange = (panelId: string, shot_type: ShotType) => {
    updatePanel(panelId, p => {
      const updated = { ...p, shot_type };
      return {
        ...updated,
        generated_prompt: buildImageGenerationPrompt(updated, characters, artStyle).prompt
      };
    }, selectedPageIndex);
  };

  const handleSceneDescChange = (panelId: string, scene_description: string) => {
    updatePanel(panelId, p => {
      const updated = { ...p, scene_description };
      return {
        ...updated,
        generated_prompt: buildImageGenerationPrompt(updated, characters, artStyle).prompt
      };
    }, selectedPageIndex);
  };

  const handleMoodChange = (panelId: string, mood: string) => {
    updatePanel(panelId, p => {
      const updated = { ...p, mood };
      return {
        ...updated,
        generated_prompt: buildImageGenerationPrompt(updated, characters, artStyle).prompt
      };
    }, selectedPageIndex);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <LayoutGrid color="#f59e0b" size={28} aria-hidden="true" />
            Step 3: Script Review & Panel Refinement
          </h1>
          <p>
            Fine-tune scene descriptions, camera shot angles, speech bubbles, and captions before generating images.
          </p>
        </div>

        <div className="view-actions">
          {onStyleSelect && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Palette size={16} color="var(--accent-purple)" aria-hidden="true" />
              <select
                value={selectedStyleId}
                onChange={(e) => onStyleSelect(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.7rem' }}
                aria-label="Change Art Style"
              >
                {ART_STYLES.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          )}

          <button className="btn btn-secondary" onClick={onBack} type="button">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back</span>
          </button>

          <button className="btn btn-primary btn-lg" onClick={onProceed} type="button">
            <span>Proceed to Image Generation</span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Page Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }} role="tablist" aria-label="Comic Pages">
          {pages.map((p, idx) => (
            <button
              key={p.id || idx}
              role="tab"
              aria-selected={selectedPageIndex === idx}
              aria-controls={`page-panel-${idx}`}
              className={`btn ${selectedPageIndex === idx ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setSelectedPageIndex(idx)}
              type="button"
            >
              <span>Page {p.page_index}: {p.title || `Scene ${p.page_index}`}</span>
              <span className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                {p.panels.length} Panels
              </span>
            </button>
          ))}
        </div>

        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => addPanel(selectedPageIndex, characters[0]?.name || 'Hero')} 
          type="button"
        >
          <Plus size={14} aria-hidden="true" />
          <span>Add Panel to Page {currentPage.page_index}</span>
        </button>
      </div>

      {/* Panel Cards Grid */}
      <div className="panel-cards-grid" id={`page-panel-${selectedPageIndex}`}>
        {currentPage.panels.map((panel, panelIdx) => {
          const livePrompt = panel.generated_prompt || buildImageGenerationPrompt(panel, characters, artStyle).prompt;
          const isExpanded = expandedPromptPanelId === panel.id;

          return (
            <div key={panel.id} className="panel-editor-card">
              <div className="panel-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="panel-badge-idx">PANEL #{panel.panel_index}</span>
                  <span className="badge badge-cyan">{panel.shot_type}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {/* Reorder Buttons */}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => reorderPanels(selectedPageIndex, panelIdx, panelIdx - 1)}
                    disabled={panelIdx === 0}
                    title="Move Panel Up"
                    aria-label={`Move panel ${panel.panel_index} up`}
                    type="button"
                    style={{ padding: '0.2rem' }}
                  >
                    <ChevronUp size={14} aria-hidden="true" />
                  </button>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => reorderPanels(selectedPageIndex, panelIdx, panelIdx + 1)}
                    disabled={panelIdx === currentPage.panels.length - 1}
                    title="Move Panel Down"
                    aria-label={`Move panel ${panel.panel_index} down`}
                    type="button"
                    style={{ padding: '0.2rem' }}
                  >
                    <ChevronDown size={14} aria-hidden="true" />
                  </button>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setExpandedPromptPanelId(isExpanded ? null : panel.id)}
                    title="View Image Generation Prompt"
                    aria-label={`Toggle AI prompt for panel ${panel.panel_index}`}
                    type="button"
                  >
                    <Eye size={14} color="#06b6d4" aria-hidden="true" />
                  </button>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => removePanel(panel.id, selectedPageIndex)}
                    title="Delete Panel"
                    aria-label={`Delete panel ${panel.panel_index}`}
                    type="button"
                  >
                    <Trash2 size={14} color="#f43f5e" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Shot Type & Mood */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.5rem' }}>
                <div>
                  <label htmlFor={`shot-select-${panel.id}`} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                    <Camera size={12} aria-hidden="true" /> Camera Shot
                  </label>
                  <select
                    id={`shot-select-${panel.id}`}
                    value={panel.shot_type}
                    onChange={(e) => handleShotChange(panel.id, e.target.value as ShotType)}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    {SHOT_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`mood-input-${panel.id}`} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                    Scene Mood
                  </label>
                  <input
                    id={`mood-input-${panel.id}`}
                    type="text"
                    value={panel.mood}
                    onChange={(e) => handleMoodChange(panel.id, e.target.value)}
                    placeholder="e.g. Dramatic"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Scene Description (Visual Core) */}
              <div>
                <label htmlFor={`scene-desc-${panel.id}`} style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Visual Scene Description:
                </label>
                <textarea
                  id={`scene-desc-${panel.id}`}
                  value={panel.scene_description}
                  onChange={(e) => handleSceneDescChange(panel.id, e.target.value)}
                  rows={3}
                  placeholder="Describe visual composition, character poses, background, lighting..."
                  style={{ width: '100%', fontSize: '0.86rem' }}
                />
              </div>

              {/* Narrator Caption */}
              <div>
                <label htmlFor={`caption-input-${panel.id}`} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Narrator Caption (Optional Top Box):
                </label>
                <input
                  id={`caption-input-${panel.id}`}
                  type="text"
                  value={panel.caption || ''}
                  onChange={(e) => updatePanel(panel.id, p => ({ ...p, caption: e.target.value }), selectedPageIndex)}
                  placeholder="Meanwhile, deep within the obsidian core..."
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              {/* Speech & Dialogue Bubbles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MessageSquare size={13} color="#8b5cf6" aria-hidden="true" />
                    Speech Bubbles ({panel.dialogue.length})
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => addDialogueItem(panel.id, selectedPageIndex, characters[0]?.name || 'Hero')}
                    type="button"
                  >
                    <Plus size={12} aria-hidden="true" /> Add Line
                  </button>
                </div>

                {panel.dialogue.map((dlg) => (
                  <div key={dlg.id} className="panel-dialogue-item">
                    <select
                      value={dlg.type}
                      onChange={(e) => updateDialogueItem(panel.id, selectedPageIndex, dlg.id, 'type', e.target.value as BubbleType)}
                      style={{ fontSize: '0.78rem', padding: '0.3rem', width: '85px' }}
                      aria-label="Bubble Type"
                    >
                      <option value="speech">Speech</option>
                      <option value="shout">Shout 💥</option>
                      <option value="thought">Thought 💭</option>
                    </select>

                    <input
                      type="text"
                      value={dlg.speaker}
                      onChange={(e) => updateDialogueItem(panel.id, selectedPageIndex, dlg.id, 'speaker', e.target.value)}
                      placeholder="Speaker"
                      style={{ width: '80px', fontSize: '0.82rem', padding: '0.3rem 0.5rem' }}
                      aria-label="Speaker Name"
                    />

                    <input
                      type="text"
                      value={dlg.line}
                      onChange={(e) => updateDialogueItem(panel.id, selectedPageIndex, dlg.id, 'line', e.target.value)}
                      placeholder="Dialogue line text..."
                      style={{ flex: 1, fontSize: '0.82rem', padding: '0.3rem 0.5rem' }}
                      aria-label="Dialogue text"
                    />

                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeDialogueItem(panel.id, selectedPageIndex, dlg.id)}
                      style={{ padding: '0.2rem' }}
                      aria-label="Remove speech bubble"
                      type="button"
                    >
                      <Trash2 size={13} color="#f43f5e" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Prompt Inspector Drawer */}
              {isExpanded && (
                <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-medium)', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Sparkles size={12} aria-hidden="true" />
                    Assembled AI Prompt (With Roster & Style):
                  </div>
                  <textarea
                    value={livePrompt}
                    onChange={(e) => updatePanel(panel.id, p => ({ ...p, generated_prompt: e.target.value }), selectedPageIndex)}
                    rows={4}
                    style={{ 
                      width: '100%', 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '0.78rem', 
                      color: 'var(--text-primary)', 
                      lineHeight: '1.4',
                      padding: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
