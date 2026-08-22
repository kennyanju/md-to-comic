import React from 'react';
import { 
  BookOpen, 
  Settings, 
  RotateCcw, 
  Sparkles, 
  Download, 
  Layers, 
  Folder, 
  Undo2, 
  Redo2, 
  Palette 
} from 'lucide-react';
import { ART_STYLES } from '../lib/artStyles';

interface NavbarProps {
  onOpenSettings: () => void;
  onResetProject: () => void;
  onQuickDemo: () => void;
  onOpenExport: () => void;
  onOpenGallery: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  selectedStyleId?: string;
  onStyleSelect?: (styleId: string) => void;
  hasPanels: boolean;
  projectTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onResetProject,
  onQuickDemo,
  onOpenExport,
  onOpenGallery,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  selectedStyleId,
  onStyleSelect,
  hasPanels,
  projectTitle
}) => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl+';

  return (
    <header className="navbar" role="banner">
      <div className="brand-section">
        <div className="brand-icon-badge" aria-hidden="true">
          <BookOpen size={22} strokeWidth={2.5} />
        </div>
        <div>
          <div className="brand-title">MD TO COMIC</div>
          <div className="brand-tagline">AI Graphic Novel Studio</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {projectTitle && (
          <span className="badge badge-purple" aria-label={`Current Project: ${projectTitle}`}>
            <Layers size={12} aria-hidden="true" /> {projectTitle}
          </span>
        )}

        {/* Global Undo / Redo */}
        {(onUndo || onRedo) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onUndo}
              disabled={!canUndo}
              title={`Undo (${modKey}Z)`}
              aria-label="Undo last change"
              type="button"
              style={{ padding: '0.35rem 0.5rem' }}
            >
              <Undo2 size={15} aria-hidden="true" />
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onRedo}
              disabled={!canRedo}
              title={`Redo (${modKey}Shift+Z)`}
              aria-label="Redo last change"
              type="button"
              style={{ padding: '0.35rem 0.5rem' }}
            >
              <Redo2 size={15} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Art Style Quick Selector */}
        {selectedStyleId && onStyleSelect && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Change Art Style Preset">
            <Palette size={14} color="var(--accent-purple)" aria-hidden="true" />
            <select
              value={selectedStyleId}
              onChange={(e) => onStyleSelect(e.target.value)}
              style={{ 
                fontSize: '0.78rem', 
                padding: '0.25rem 0.5rem', 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)'
              }}
              aria-label="Switch Art Style"
            >
              {ART_STYLES.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <nav className="nav-actions" aria-label="Main Actions">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={onQuickDemo} 
          title="Load sample story with pre-configured settings"
          aria-label="Load Quick Demo Story"
          type="button"
        >
          <Sparkles size={14} color="#f59e0b" aria-hidden="true" />
          <span>Quick Demo</span>
        </button>

        {hasPanels && (
          <button 
            className="btn btn-accent btn-sm" 
            onClick={onOpenExport}
            aria-label="Export Comic as PDF, CBZ or PNG"
            type="button"
          >
            <Download size={14} aria-hidden="true" />
            <span>Export Comic</span>
          </button>
        )}

        <button 
          className="btn btn-ghost btn-sm" 
          onClick={onOpenGallery} 
          title="Open Project Gallery"
          aria-label="Open Project Gallery"
          type="button"
        >
          <Folder size={14} aria-hidden="true" />
          <span>Projects</span>
        </button>

        <button 
          className="btn btn-ghost btn-sm" 
          onClick={onResetProject} 
          title="Start new project"
          aria-label="Start New Project"
          type="button"
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>New</span>
        </button>

        <button 
          className="btn btn-secondary btn-sm" 
          onClick={onOpenSettings} 
          title="Configure API keys"
          aria-label="Open API Keys & Settings"
          type="button"
        >
          <Settings size={14} aria-hidden="true" />
          <span>Settings</span>
        </button>
      </nav>
    </header>
  );
};
