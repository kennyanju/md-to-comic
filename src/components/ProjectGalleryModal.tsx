import React, { useState, useRef, useEffect } from 'react';
import { Folder, Trash2, Upload, X } from 'lucide-react';
import { listSavedProjects, deleteProject } from '../lib/storage';
import { useToast } from './ToastContext';

interface ProjectGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (id: string) => void;
  onImportProject: (file: File) => void;
}

export const ProjectGalleryModal: React.FC<ProjectGalleryModalProps> = ({ 
  isOpen, 
  onClose, 
  onLoadProject, 
  onImportProject 
}) => {
  const [projects, setProjects] = useState(listSavedProjects());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setProjects(listSavedProjects());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const refreshProjects = () => setProjects(listSavedProjects());

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved comic project?')) {
      deleteProject(id);
      refreshProjects();
      toast.info('Project removed from gallery.');
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
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '600px' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-modal-title"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Folder color="#8b5cf6" size={22} aria-hidden="true" />
            <h2 id="gallery-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800 }}>Project Gallery</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close Gallery Dialog">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Load a previously saved comic project or import an exported JSON backup file.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Saved Comic Projects</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  No saved projects found in local storage.
                </div>
              ) : (
                projects.map(p => (
                  <div 
                    key={p.id} 
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'background var(--transition-fast)', 
                      padding: '0.85rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid var(--border-subtle)'
                    }}
                    onClick={() => {
                      onLoadProject(p.id);
                      onClose();
                      toast.success(`Loaded project "${p.title || 'Untitled'}"`);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-purple)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{p.title || 'Untitled Project'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Last modified: {new Date(p.updated_at).toLocaleString()}
                      </div>
                    </div>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={(e) => handleDelete(p.id, e)}
                      style={{ color: '#fda4af' }}
                      title="Delete project"
                      aria-label={`Delete project ${p.title}`}
                      type="button"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Import Backup</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Restore a graphic novel project from an exported JSON file.
            </p>
            <input 
              type="file" 
              accept="application/json" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
            <button 
              className="btn btn-secondary" 
              onClick={() => fileInputRef.current?.click()}
              type="button"
              style={{ width: '100%' }}
            >
              <Upload size={16} aria-hidden="true" />
              <span>Select Project JSON File</span>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
