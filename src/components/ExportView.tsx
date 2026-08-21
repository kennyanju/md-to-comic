import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Archive, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2, 
  X,
  FileCode,
  Printer
} from 'lucide-react';
import { ComicProject } from '../types/comic';
import { downloadComicPdf, downloadPagePng, downloadProjectZip } from '../lib/pdfExporter';

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
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string>('');

  if (!isOpen) return null;

  const totalPanels = project.pages.reduce((acc, p) => acc + p.panels.length, 0);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await downloadComicPdf(project, (cur, tot, msg) => {
        setPdfProgress(`${msg} (${Math.round((cur / tot) * 100)}%)`);
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
      setPdfProgress('');
    }
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      await downloadProjectZip(project);
    } catch (err) {
      console.error('ZIP export failed:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project.title || 'comic-project').toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Printer color="#8b5cf6" size={22} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Export Graphic Novel</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
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
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{project.metadata.art_style || 'Comic'}</div>
            </div>
          </div>

          {/* Export Options Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {/* Multi-Page PDF */}
            <div
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                border: '1px solid var(--border-medium)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.05rem' }}>
                  <FileText color="#ec4899" size={20} />
                  Complete Comic PDF
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  High-DPI multi-page printable PDF book with embedded metadata, speech balloons, and page numbers.
                </p>
              </div>

              {pdfProgress && (
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  {pdfProgress}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
              >
                <Download size={16} />
                <span>{isExportingPdf ? 'Compiling PDF...' : 'Download PDF Book'}</span>
              </button>
            </div>

            {/* Assets ZIP Bundle */}
            <div
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                border: '1px solid var(--border-medium)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.05rem' }}>
                  <Archive color="#f59e0b" size={20} />
                  Raw Assets ZIP
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Download all individual high-resolution PNG panel images, page renders, and JSON metadata.
                </p>
              </div>

              <button
                className="btn btn-secondary"
                onClick={handleExportZip}
                disabled={isExportingZip}
              >
                <Download size={16} />
                <span>{isExportingZip ? 'Packaging ZIP...' : 'Download ZIP Bundle'}</span>
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
                >
                  <ImageIcon size={14} color="#06b6d4" />
                  <span>Page {p.page_index} PNG</span>
                </button>
              ))}
            </div>
          </div>

          {/* JSON Project Backup */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={handleExportJson}>
              <FileCode size={14} />
              <span>Export Project JSON Backup</span>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
