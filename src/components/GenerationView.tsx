import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Maximize2,
  Sliders
} from 'lucide-react';
import { ComicPage, PanelScript, ImageBackendType, UserSettings, CharacterRosterItem } from '../types/comic';
import { AVAILABLE_BACKENDS, getImageGenerator } from '../lib/imageGenerators';
import { getArtStyleById } from '../lib/artStyles';

interface GenerationViewProps {
  pages: ComicPage[];
  onPagesChange: (pages: ComicPage[]) => void;
  characters: CharacterRosterItem[];
  selectedStyleId: string;
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
  onBack: () => void;
  onProceed: () => void;
  onOpenSettingsModal: () => void;
}

export const GenerationView: React.FC<GenerationViewProps> = ({
  pages,
  onPagesChange,
  characters,
  selectedStyleId,
  settings,
  onSettingsChange,
  onBack,
  onProceed,
  onOpenSettingsModal
}) => {
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingPanelIds, setGeneratingPanelIds] = useState<Set<string>>(new Set());
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const artStyle = getArtStyleById(selectedStyleId);

  // Flatten all panels
  const allPanels: { panel: PanelScript; pageIdx: number }[] = [];
  pages.forEach((page, pIdx) => {
    page.panels.forEach(panel => {
      allPanels.push({ panel, pageIdx: pIdx });
    });
  });

  const completedCount = allPanels.filter(p => p.panel.status === 'done').length;
  const totalPanels = allPanels.length;
  const progressPercent = totalPanels > 0 ? Math.round((completedCount / totalPanels) * 100) : 0;

  const generateSinglePanel = async (panel: PanelScript, pageIdx: number) => {
    setGeneratingPanelIds(prev => new Set(prev).add(panel.id));

    // Update panel status to generating
    updatePanelInPages(panel.id, pageIdx, p => ({ ...p, status: 'generating', error: undefined }));

    try {
      const generator = getImageGenerator(settings.preferred_image_backend);
      const imageUrl = await generator.generatePanelImage({
        panel,
        characters,
        artStyle,
        settings
      });

      updatePanelInPages(panel.id, pageIdx, p => ({
        ...p,
        status: 'done',
        image_url: imageUrl
      }));
    } catch (err: any) {
      console.error(`Failed to generate panel ${panel.id}:`, err);
      updatePanelInPages(panel.id, pageIdx, p => ({
        ...p,
        status: 'failed',
        error: err.message || 'Image generation failed'
      }));
    } finally {
      setGeneratingPanelIds(prev => {
        const next = new Set(prev);
        next.delete(panel.id);
        return next;
      });
    }
  };

  const generateAllPanels = async () => {
    setIsGeneratingAll(true);

    const pendingPanels = allPanels.filter(({ panel }) => panel.status !== 'done');
    
    // Process in batches of 3
    const BATCH_SIZE = 3;
    for (let i = 0; i < pendingPanels.length; i += BATCH_SIZE) {
      const batch = pendingPanels.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(({ panel, pageIdx }) => generateSinglePanel(panel, pageIdx))
      );
    }

    setIsGeneratingAll(false);
  };

  const updatePanelInPages = (panelId: string, pageIdx: number, updater: (p: PanelScript) => PanelScript) => {
    onPagesChange(
      pages.map((pg, idx) => {
        if (idx !== pageIdx) return pg;
        return {
          ...pg,
          panels: pg.panels.map(p => p.id === panelId ? updater(p) : p)
        };
      })
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <ImageIcon color="#ec4899" size={28} />
            Step 4: Visual Panel Generation
          </h1>
          <p>
            Generate high-resolution visual artwork for every comic panel using your preferred AI backend or our built-in comic synth engine.
          </p>
        </div>

        <div className="view-actions">
          <button className="btn btn-secondary" onClick={onBack} disabled={isGeneratingAll}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <button
            className="btn btn-accent"
            onClick={generateAllPanels}
            disabled={isGeneratingAll}
          >
            <Sparkles size={16} />
            <span>{isGeneratingAll ? 'Generating Panels...' : 'Generate All Panels'}</span>
          </button>

          <button
            className="btn btn-primary btn-lg"
            onClick={onProceed}
            disabled={completedCount === 0}
          >
            <span>Open Comic Studio</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Backend & Progress Bar */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sliders size={18} color="#06b6d4" />
            <span style={{ fontWeight: 700 }}>Inference Backend:</span>
            <select
              value={settings.preferred_image_backend}
              onChange={(e) => onSettingsChange({ ...settings, preferred_image_backend: e.target.value as ImageBackendType })}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
            >
              {AVAILABLE_BACKENDS.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {settings.preferred_image_backend !== 'mock_demo' && (
              <button className="btn btn-ghost btn-sm" onClick={onOpenSettingsModal} style={{ color: 'var(--accent-cyan)' }}>
                🔑 Configure API Key
              </button>
            )}
            <span className="badge badge-purple" style={{ fontSize: '0.85rem' }}>
              {completedCount} / {totalPanels} Panels Ready ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Visual Progress Track */}
        <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* Gallery of Panel Cards */}
      <div className="panel-cards-grid">
        {allPanels.map(({ panel, pageIdx }) => {
          const isPanelGenerating = generatingPanelIds.has(panel.id);

          return (
            <div key={panel.id} className="panel-editor-card">
              <div className="panel-card-header">
                <div>
                  <span className="panel-badge-idx">P{pageIdx + 1} • #{panel.panel_index}</span>
                  <span className="badge badge-cyan" style={{ marginLeft: '0.5rem' }}>{panel.shot_type}</span>
                </div>

                <div>
                  {panel.status === 'done' && <span className="badge badge-green"><CheckCircle2 size={12} /> Ready</span>}
                  {panel.status === 'generating' && <span className="badge badge-amber"><RefreshCw size={12} className="spinning" /> Generating</span>}
                  {panel.status === 'failed' && <span className="badge badge-red"><AlertCircle size={12} /> Failed</span>}
                  {panel.status === 'pending' && <span className="badge badge-purple">Pending</span>}
                </div>
              </div>

              {/* Panel Image Preview Box */}
              <div className="panel-img-preview-box">
                {panel.image_url ? (
                  <>
                    <img src={panel.image_url} alt={`Panel ${panel.panel_index}`} />
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setPreviewImageUrl(panel.image_url!)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.6)',
                        padding: '0.35rem',
                        borderRadius: 'var(--radius-sm)'
                      }}
                      title="View Full Size"
                    >
                      <Maximize2 size={14} color="#ffffff" />
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                    <ImageIcon size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                    <div style={{ fontSize: '0.85rem' }}>Image not yet generated</div>
                  </div>
                )}
              </div>

              {/* Scene & Dialogue snippet */}
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                <strong>Prompt:</strong> {panel.scene_description}
              </div>

              {panel.error && (
                <div style={{ fontSize: '0.78rem', color: '#fda4af', background: 'rgba(244, 63, 94, 0.15)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  {panel.error}
                </div>
              )}

              {/* Action: Re-roll button */}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => generateSinglePanel(panel, pageIdx)}
                disabled={isPanelGenerating || isGeneratingAll}
                style={{ width: '100%' }}
              >
                <RefreshCw size={13} className={isPanelGenerating ? 'spinning' : ''} />
                <span>{panel.image_url ? 'Regenerate Panel' : 'Generate This Panel'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Preview Lightbox */}
      {previewImageUrl && (
        <div className="modal-overlay" onClick={() => setPreviewImageUrl(null)}>
          <div style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <img
              src={previewImageUrl}
              alt="Panel full view"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
            />
            <button
              className="btn btn-secondary"
              onClick={() => setPreviewImageUrl(null)}
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.8)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
