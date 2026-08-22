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

      {projectTitle && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-purple" aria-label={`Current Project: ${projectTitle}`}>
            <Layers size={12} aria-hidden="true" /> {projectTitle}
          </span>
        </div>
      )}

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
            aria-label="Export Comic as PDF or PNG"
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
