import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Archive, 
  Image as ImageIcon, 
  X,
  FileCode,
  Printer,
  BookOpen
} from 'lucide-react';
import { ComicProject } from '../types/comic';
import { downloadComicPdf, downloadPagePng, downloadProjectZip, downloadComicCbz } from '../lib/pdfExporter';
import { useToast } from './ToastContext';

interface ExportViewProps {
  project: ComicProject;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportView: React.FC<ExportViewProps> = ({
  project,
  isOpen,
  onClose
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCbz, setIsExportingCbz] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string>('');
  const [cbzProgress, setCbzProgress] = useState<string>('');
  const toast = useToast();

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

  const totalPanels = project.pages.reduce((acc, p) => acc + p.panels.length, 0);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await downloadComicPdf(project, (cur, tot, msg) => {
        setPdfProgress(`${msg} (${Math.round((cur / tot) * 100)}%)`);
      });
      toast.success('Comic PDF book exported successfully!');
    } catch (err) {
      console.error('PDF export failed:', err);
      toast.error('Failed to export PDF. Check console for details.');
    } finally {
      setIsExportingPdf(false);
      setPdfProgress('');
    }
  };

  const handleExportCbz = async () => {
    setIsExportingCbz(true);
    try {
      await downloadComicCbz(project, (cur, tot, msg) => {
        setCbzProgress(`${msg} (${Math.round((cur / tot) * 100)}%)`);
      });
      toast.success('Standard CBZ Comic Book Archive downloaded!');
    } catch (err) {
      console.error('CBZ export failed:', err);
      toast.error('Failed to compile CBZ comic book.');
    } finally {
      setIsExportingCbz(false);
      setCbzProgress('');
    }
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      await downloadProjectZip(project);
      toast.success('Asset ZIP bundle downloaded!');
    } catch (err) {
      console.error('ZIP export failed:', err);
      toast.error('Failed to bundle ZIP assets.');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportJson = () => {
    try {
      const jsonStr = JSON.stringify(project, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(project.title || 'comic-project').toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Project JSON backup exported!');
    } catch {
      toast.error('Failed to export JSON file.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '780px' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Printer color="#8b5cf6" size={22} aria-hidden="true" />
            <h2 id="export-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800 }}>Export Graphic Novel</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close Export Dialog">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          {/* Project Summary Card */}
          <div className="glass-card" style={{ background: 'var(--bg-primary)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Pages</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{project.pages.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Panels</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{totalPanels}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Art Style</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{project.selected_style_id || 'Comic'}</div>
            </div>
          </div>

          {/* Export Options Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {/* Multi-Page PDF */}
            <div
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
                border: '1px solid var(--border-medium)',
                padding: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.98rem' }}>
                  <FileText color="#ec4899" size={18} aria-hidden="true" />
                  PDF Graphic Novel
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: '1.35' }}>
                  High-DPI multi-page printable PDF book with embedded metadata and balloon layers.
                </p>
              </div>

              {pdfProgress && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  {pdfProgress}
                </div>
              )}

              <button
                className="btn btn-primary btn-sm"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                type="button"
              >
                <Download size={14} aria-hidden="true" />
                <span>{isExportingPdf ? 'Compiling PDF...' : 'Download PDF'}</span>
              </button>
            </div>

            {/* CBZ Comic Archive */}
            <div
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
                border: '1px solid var(--border-medium)',
                padding: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.98rem' }}>
                  <BookOpen color="#06b6d4" size={18} aria-hidden="true" />
                  CBZ Comic Archive
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: '1.35' }}>
                  Standard Comic Book ZIP for Kindle, Apple Books, and Kavita with ComicInfo.xml metadata.
                </p>
              </div>

              {cbzProgress && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  {cbzProgress}
                </div>
              )}

              <button
                className="btn btn-accent btn-sm"
                onClick={handleExportCbz}
                disabled={isExportingCbz}
                type="button"
              >
                <Download size={14} aria-hidden="true" />
                <span>{isExportingCbz ? 'Packaging CBZ...' : 'Download CBZ'}</span>
              </button>
            </div>

            {/* Assets ZIP Bundle */}
            <div
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
                border: '1px solid var(--border-medium)',
                padding: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.98rem' }}>
                  <Archive color="#f59e0b" size={18} aria-hidden="true" />
                  Raw Assets ZIP
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: '1.35' }}>
                  Download individual raw panel PNGs, page compositions, and story markdown.
                </p>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleExportZip}
                disabled={isExportingZip}
                type="button"
              >
                <Download size={14} aria-hidden="true" />
                <span>{isExportingZip ? 'Packaging ZIP...' : 'Download ZIP'}</span>
              </button>
            </div>
          </div>

          {/* Individual Page Downloads */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Download Single Page PNGs:</div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {project.pages.map((p) => (
                <button
                  key={p.id}
                  className="btn btn-secondary btn-sm"
                  onClick={() => downloadPagePng(p)}
                  type="button"
                  aria-label={`Download Page ${p.page_index} as PNG`}
                >
                  <ImageIcon size={14} color="#06b6d4" aria-hidden="true" />
                  <span>Page {p.page_index} PNG</span>
                </button>
              ))}
            </div>
          </div>

          {/* JSON Project Backup */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={handleExportJson} type="button">
              <FileCode size={14} aria-hidden="true" />
              <span>Export Project JSON Backup</span>
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
