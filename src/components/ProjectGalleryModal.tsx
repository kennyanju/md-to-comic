import React, { useState, useRef, useEffect } from 'react';
import { Folder, Trash2, Upload, X } from 'lucide-react';
import { listSavedProjects, deleteProject } from '../lib/storage';

interface ProjectGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (id: string) => void;
  onImportProject: (file: File) => void;
}

export const ProjectGalleryModal: React.FC<ProjectGalleryModalProps> = ({ isOpen, onClose, onLoadProject, onImportProject }) => {
  const [projects, setProjects] = useState(listSavedProjects());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setProjects(listSavedProjects());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const refreshProjects = () => setProjects(listSavedProjects());

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved comic project?')) {
      deleteProject(id);
      refreshProjects();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportProject(e.target.files[0]);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <h2 className="modal-title">
          <Folder size={20} />
          Project Gallery
        </h2>
        <p className="text-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Load a saved project or import a backup JSON file.
        </p>

        <div className="settings-section">
          <h3 className="section-title">Saved Projects</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
            {projects.length === 0 ? (
              <p className="text-secondary" style={{ textAlign: 'center', padding: '1rem 0' }}>No saved projects found.</p>
            ) : (
              projects.map(p => (
                <div 
                  key={p.id} 
                  className="setting-row" 
                  style={{ cursor: 'pointer', transition: 'background 0.2s', padding: '0.75rem' }}
                  onClick={() => {
                    onLoadProject(p.id);
                    onClose();
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{p.title || 'Untitled Project'}</div>
                    <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                      Last updated: {new Date(p.updated_at).toLocaleString()}
                    </div>
                  </div>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={(e) => handleDelete(p.id, e)}
                    style={{ color: '#ef4444' }}
                    title="Delete project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="settings-section" style={{ marginTop: '2rem' }}>
          <h3 className="section-title">Import Backup</h3>
          <p className="text-secondary" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
            Restore a project from an exported JSON file.
          </p>
          <input 
            type="file" 
            accept="application/json" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
          />
          <button 
            className="btn btn-secondary w-full" 
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            <span>Select Project JSON File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
