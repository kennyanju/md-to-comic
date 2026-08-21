import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  Sliders, 
  Type, 
  Grid, 
  Sparkles, 
  Move,
  FileCheck
} from 'lucide-react';
import { ComicPage, PageLayoutType, BorderStyle, DialogueItem } from '../types/comic';
import { renderComicPageToCanvas, calculatePanelRects } from '../lib/canvasCompositor';
import { downloadPagePng } from '../lib/pdfExporter';

interface ComicStudioViewProps {
  pages: ComicPage[];
  onPagesChange: (pages: ComicPage[]) => void;
  onBack: () => void;
  onProceed: () => void;
  onOpenExport: () => void;
}

const LAYOUT_PRESETS: { id: PageLayoutType; name: string; desc: string; icon: string }[] = [
  { id: 'grid-4', name: '4-Panel Classic Grid', desc: '2x2 Golden Age balance', icon: '田' },
  { id: 'action-5', name: '5-Panel Action Splash', desc: 'Top banner + 3 center + bottom', icon: '🀄' },
  { id: 'cinematic-3', name: '3-Panel Cinematic', desc: 'Widescreen horizontal banners', icon: '☰' },
  { id: 'manga-6', name: '6-Panel Manga Grid', desc: 'Dense sequential action', icon: '⚏' },
  { id: 'hero-split-2', name: '2-Panel Hero Split', desc: 'Side-by-side vertical showdown', icon: '▥' },
  { id: 'splash-1', name: 'Full Splash Cover', desc: '1 High-impact single art page', icon: '▢' }
];

const BORDER_STYLES: { id: BorderStyle; name: string }[] = [
  { id: 'ink-gutter', name: 'Ink Gutter (Organic Bold)' },
  { id: 'classic-black', name: 'Classic Black Gutter' },
  { id: 'neon-glow', name: 'Cyberpunk Neon Glow' },
  { id: 'manga-clean', name: 'Manga Fine Lines' },
  { id: 'borderless', name: 'Borderless (Modern)' }
];

const COMIC_FONTS = [
  { id: 'Bangers', name: 'Bangers (Heroic Action)' },
  { id: 'Comic Neue', name: 'Comic Neue (Classic Balloon)' },
  { id: 'Outfit', name: 'Outfit (Modern Clean)' },
  { id: 'Inter', name: 'Inter (Graphic Novel)' }
];

export const ComicStudioView: React.FC<ComicStudioViewProps> = ({
  pages,
  onPagesChange,
  onBack,
  onProceed,
  onOpenExport
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging bubble state
  const [draggingBubble, setDraggingBubble] = useState<{
    panelId: string;
    dialogueId: string;
    panelIndex: number;
  } | null>(null);

  const currentPage = pages[currentPageIndex] || pages[0];
  const layout = currentPage.layout_config || {
    layout_type: 'grid-4',
    border_style: 'ink-gutter',
    gutter_width: 14,
    font_family: 'Bangers',
    bg_color: '#ffffff',
    border_color: '#000000',
    show_page_number: true,
    dpi: 150
  };

  // Re-render canvas whenever page or layout changes
  useEffect(() => {
    const abortController = new AbortController();
    if (canvasRef.current && currentPage) {
      renderComicPageToCanvas(canvasRef.current, currentPage, 1.0, abortController.signal).catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });
    }
    return () => abortController.abort();
  }, [currentPage, currentPageIndex]);

  const updateCurrentPageLayout = (updater: (cfg: typeof layout) => typeof layout) => {
    const updatedPages = pages.map((p, idx) => {
      if (idx !== currentPageIndex) return p;
      return {
        ...p,
        layout_config: updater(p.layout_config || layout)
      };
    });
    onPagesChange(updatedPages);
  };

  // Interactive Bubble Dragging
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingBubble || !canvasRef.current || !containerRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = 1200 / rect.width;
    const scaleY = 1700 / rect.height;

    const canvasX = clientX * scaleX;
    const canvasY = clientY * scaleY;

    // Find panel rect
    const margin = 28;
    const gutter = layout.gutter_width || 14;
    const panelRects = calculatePanelRects(layout.layout_type, 1200, 1700, gutter, margin);
    const panelRect = panelRects[draggingBubble.panelIndex];

    if (!panelRect) return;

    // Calculate normalized 0-1 relative pos within panel
    const normX = Math.max(0.1, Math.min(0.9, (canvasX - panelRect.x) / panelRect.width));
    const normY = Math.max(0.1, Math.min(0.9, (canvasY - panelRect.y) / panelRect.height));

    // Update dialogue bubblePos
    const updatedPages = pages.map((pg, pIdx) => {
      if (pIdx !== currentPageIndex) return pg;
      return {
        ...pg,
        panels: pg.panels.map(panel => {
          if (panel.id !== draggingBubble.panelId) return panel;
          return {
            ...panel,
            dialogue: panel.dialogue.map(dlg => {
              if (dlg.id !== draggingBubble.dialogueId) return dlg;
              return { ...dlg, bubblePos: { x: normX, y: normY } };
            })
          };
        })
      };
    });

    onPagesChange(updatedPages);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <Palette color="#8b5cf6" size={28} />
            Step 5: Comic Studio & Layout Engine
          </h1>
          <p>
            Choose comic grid templates, customize ink borders, adjust gutter widths, and drag speech bubbles directly onto panels to perfect composition.
          </p>
        </div>

        <div className="view-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <button className="btn btn-secondary" onClick={() => downloadPagePng(currentPage)}>
            <Download size={16} />
            <span>Download Page PNG</span>
          </button>

          <button className="btn btn-accent btn-lg" onClick={onOpenExport}>
            <FileCheck size={18} />
            <span>Compile PDF & Export</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="comic-studio-grid">
        {/* Left Column: Comic Page Canvas Viewer */}
        <div className="canvas-viewport-wrapper">
          {/* Pagination & Status */}
          <div className="canvas-toolbar">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Page:</span>
              {pages.map((p, idx) => (
                <button
                  key={p.id || idx}
                  className={`btn ${currentPageIndex === idx ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setCurrentPageIndex(idx)}
                >
                  Page {p.page_index}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-purple">
                <Move size={12} /> Drag Bubble Handles to Reposition
              </span>
            </div>
          </div>

          {/* Interactive Canvas Container with Drag Handles */}
          <div
            ref={containerRef}
            className="canvas-container"
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={() => setDraggingBubble(null)}
            onMouseLeave={() => setDraggingBubble(null)}
          >
            <canvas ref={canvasRef} className="comic-main-canvas" width={1200} height={1700} />

            {/* Bubble Drag Handles Overlay */}
            {currentPage.panels.map((panel, pIdx) => {
              const panelRects = calculatePanelRects(layout.layout_type, 1200, 1700, (layout.gutter_width || 14), 28);
              const pRect = panelRects[pIdx];
              if (!pRect) return null;

              return panel.dialogue.map((dlg, dIdx) => {
                const normX = dlg.bubblePos?.x ?? (dIdx % 2 === 0 ? 0.3 : 0.7);
                const normY = dlg.bubblePos?.y ?? (0.28 + dIdx * 0.22);

                const leftPercent = ((pRect.x + normX * pRect.width) / 1200) * 100;
                const topPercent = ((pRect.y + normY * pRect.height) / 1700) * 100;

                return (
                  <div
                    key={dlg.id}
                    className="bubble-overlay-handle"
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingBubble({ panelId: panel.id, dialogueId: dlg.id, panelIndex: pIdx });
                    }}
                  >
                    <div className="bubble-handle-badge">
                      <Move size={10} />
                      <span>{dlg.speaker}</span>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>

        {/* Right Column: Layout & Styling Controls */}
        <div className="studio-sidebar">
          {/* Layout Grid Selector */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Grid size={16} color="#06b6d4" />
              Page Grid Layout
            </div>

            <div className="layout-preset-grid">
              {LAYOUT_PRESETS.map((preset) => {
                const isActive = layout.layout_type === preset.id;
                return (
                  <div
                    key={preset.id}
                    className={`layout-preset-card ${isActive ? 'active' : ''}`}
                    onClick={() => updateCurrentPageLayout(cfg => ({ ...cfg, layout_type: preset.id }))}
                  >
                    <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>{preset.icon}</div>
                    <div className="layout-preset-title">{preset.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Border & Gutter Style */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={16} color="#8b5cf6" />
              Border & Gutter Styling
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Border Frame Style:
              </label>
              <select
                value={layout.border_style}
                onChange={(e) => updateCurrentPageLayout(cfg => ({ ...cfg, border_style: e.target.value as BorderStyle }))}
                style={{ width: '100%' }}
              >
                {BORDER_STYLES.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                <span>Gutter Width:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{layout.gutter_width || 14}px</strong>
              </div>
              <input
                type="range"
                min={4}
                max={32}
                value={layout.gutter_width || 14}
                onChange={(e) => updateCurrentPageLayout(cfg => ({ ...cfg, gutter_width: Number(e.target.value) }))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Typography */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Type size={16} color="#f59e0b" />
              Dialogue & Caption Font
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {COMIC_FONTS.map(f => (
                <label
                  key={f.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: layout.font_family === f.id ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-secondary)',
                    border: layout.font_family === f.id ? '1px solid var(--accent-purple)' : '1px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="font-select"
                    checked={layout.font_family === f.id}
                    onChange={() => updateCurrentPageLayout(cfg => ({ ...cfg, font_family: f.id as any }))}
                  />
                  <span style={{ fontFamily: f.id, fontSize: '1rem' }}>{f.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
