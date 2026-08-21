import React, { useState, useRef } from 'react';
import { Upload, Sparkles, FileText, ArrowRight, Palette, Layers } from 'lucide-react';
import { ART_STYLE_PRESETS } from '../lib/artStyles';
import { SAMPLE_STORIES, SampleStory } from '../lib/sampleStories';
import { extractFrontmatter } from '../lib/markdownParser';

interface IngestionViewProps {
  markdown: string;
  onMarkdownChange: (md: string) => void;
  selectedStyleId: string;
  onStyleSelect: (id: string) => void;
  onProceed: () => void;
}

export const IngestionView: React.FC<IngestionViewProps> = ({
  markdown,
  onMarkdownChange,
  selectedStyleId,
  onStyleSelect,
  onProceed
}) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { metadata } = extractFrontmatter(markdown);
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const chunkCount = (markdown.match(/(?=^#{1,3}\s+)|<!--\s*page-break\s*-->/gim) || []).length || 1;

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) onMarkdownChange(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const loadSample = (sample: SampleStory) => {
    onMarkdownChange(sample.markdown);
    onStyleSelect(sample.style_id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <FileText color="#8b5cf6" size={28} />
            Step 1: Document Ingestion & Art Style
          </h1>
          <p>
            Upload or paste your multi-page Markdown story. Headings (<code>#</code>, <code>##</code>) and <code>&lt;!-- page-break --&gt;</code> markers naturally define comic page divisions.
          </p>
        </div>

        <div className="view-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={onProceed}
            disabled={!markdown.trim()}
          >
            <span>Configure AI Scripting</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Sample Templates Bar */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sparkles color="#f59e0b" size={18} />
          <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Load Ready-to-Use Story Templates:</span>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {SAMPLE_STORIES.map(s => (
            <button
              key={s.id}
              className="btn btn-secondary btn-sm"
              onClick={() => loadSample(s)}
            >
              <span>{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '2rem' }}>
        {/* Left Column: Markdown Editor & File Drop */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            className={`glass-card ${dragOver ? 'dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: dragOver ? '2px dashed var(--accent-cyan)' : '1px dashed var(--border-medium)',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-secondary)'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".md,.mdx,.txt,.markdown"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            <Upload size={28} color="#8b5cf6" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Drag & Drop your <code>.md</code> file here, or <span style={{ color: 'var(--accent-cyan)' }}>Browse Files</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Supports Multi-Page Markdown, MDX, and Frontmatter YAML
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Markdown Source Editor</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="badge badge-purple">{wordCount} Words</span>
                <span className="badge badge-cyan">{chunkCount} Scene Pages</span>
              </div>
            </div>

            <textarea
              value={markdown}
              onChange={(e) => onMarkdownChange(e.target.value)}
              placeholder="# Scene 1: The Encounter&#10;&#10;Rain fell over the neon rooftops...&#10;&#10;> &quot;Watch out!&quot; Jax shouted."
              rows={14}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                resize: 'vertical',
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* Right Column: Frontmatter Inspector & Art Style Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Frontmatter Summary */}
          {Object.keys(metadata).length > 0 && (
            <div className="glass-card">
              <div style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={16} color="#06b6d4" />
                Detected Frontmatter Metadata
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.85rem' }}>
                {Object.entries(metadata).map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--bg-secondary)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k}: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{String(v)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Art Style Selection */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <Palette size={18} color="#f59e0b" />
                Select Comic Visual Style
              </div>
              <span className="badge badge-amber">{ART_STYLE_PRESETS.length} Styles</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {ART_STYLE_PRESETS.map((preset) => {
                const isSelected = selectedStyleId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => onStyleSelect(preset.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-secondary)',
                      border: isSelected ? '2px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 16px var(--accent-purple-glow)' : 'none'
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        background: preset.preview_gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        flexShrink: 0
                      }}
                    >
                      {preset.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isSelected ? '#ffffff' : 'var(--text-primary)' }}>
                        {preset.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {preset.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
