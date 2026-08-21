import React from 'react';
import { BookOpen, Settings, RotateCcw, Sparkles, Download, Layers, Folder } from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  onResetProject: () => void;
  onQuickDemo: () => void;
  onOpenExport: () => void;
  onOpenGallery: () => void;
  hasPanels: boolean;
  projectTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onResetProject,
  onQuickDemo,
  onOpenExport,
  onOpenGallery,
  hasPanels,
  projectTitle
}) => {
  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-icon-badge">
          <BookOpen size={22} strokeWidth={2.5} />
        </div>
        <div>
          <div className="brand-title">MD TO COMIC</div>
          <div className="brand-tagline">AI Graphic Novel Studio</div>
        </div>
      </div>

      {projectTitle && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-purple">
            <Layers size={12} /> {projectTitle}
          </span>
        </div>
      )}

      <div className="nav-actions">
        <button className="btn btn-secondary btn-sm" onClick={onQuickDemo} title="Load sample story with pre-configured settings">
          <Sparkles size={14} color="#f59e0b" />
          <span>Quick Demo</span>
        </button>

        {hasPanels && (
          <button className="btn btn-accent btn-sm" onClick={onOpenExport}>
            <Download size={14} />
            <span>Export Comic</span>
          </button>
        )}

        <button className="btn btn-ghost btn-sm" onClick={onOpenGallery} title="Open Project Gallery">
          <Folder size={14} />
          <span>Projects</span>
        </button>

        <button className="btn btn-ghost btn-sm" onClick={onResetProject} title="Start new project">
          <RotateCcw size={14} />
          <span>New</span>
        </button>

        <button className="btn btn-secondary btn-sm" onClick={onOpenSettings} title="Configure API keys">
          <Settings size={14} />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
};
