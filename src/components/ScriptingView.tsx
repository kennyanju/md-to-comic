import React, { useState } from 'react';
import { Cpu, Users, Plus, Trash2, ArrowRight, ArrowLeft, Wand2, CheckCircle2 } from 'lucide-react';
import { MarkdownChunk, CharacterRosterItem } from '../types/comic';

interface ScriptingViewProps {
  chunks: MarkdownChunk[];
  characters: CharacterRosterItem[];
  onCharactersChange: (chars: CharacterRosterItem[]) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  panelsPerPage: number;
  onPanelsPerPageChange: (n: number) => void;
  isGenerating: boolean;
  onRunScriptGeneration: () => Promise<void>;
  onBack: () => void;
  onProceed: () => void;
  hasGeneratedPanels: boolean;
}

export const OPENROUTER_MODELS = [
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (Recommended for structured comics)', badge: 'Fast & Rich' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Nuanced dialogue & pacing)', badge: 'Premium' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (Open-Weights power)', badge: 'Cost Efficient' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat (High speed scripting)', badge: 'Ultra Fast' }
];

export const ScriptingView: React.FC<ScriptingViewProps> = ({
  chunks,
  characters,
  onCharactersChange,
  selectedModel,
  onModelChange,
  panelsPerPage,
  onPanelsPerPageChange,
  isGenerating,
  onRunScriptGeneration,
  onBack,
  onProceed,
  hasGeneratedPanels
}) => {
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');

  const addCharacter = () => {
    if (!newCharName.trim()) return;
    const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#f43f5e'];
    const newChar: CharacterRosterItem = {
      id: `char-${Date.now()}`,
      name: newCharName.trim(),
      role: 'Supporting Hero',
      visual_description: newCharDesc.trim() || `${newCharName}, distinctive styled outfit, expressive eyes`,
      color_accent: colors[characters.length % colors.length]
    };
    onCharactersChange([...characters, newChar]);
    setNewCharName('');
    setNewCharDesc('');
  };

  const removeCharacter = (id: string) => {
    onCharactersChange(characters.filter(c => c.id !== id));
  };

  const updateCharacterDesc = (id: string, desc: string) => {
    onCharactersChange(
      characters.map(c => c.id === id ? { ...c, visual_description: desc } : c)
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <Cpu color="#06b6d4" size={28} />
            Step 2: AI Scripting & Character Roster
          </h1>
          <p>
            Configure the LLM engine to storyboard your document into structured comic panels with dialogue, camera shot directions, and character visual consistency.
          </p>
        </div>

        <div className="view-actions">
          <button className="btn btn-secondary" onClick={onBack} disabled={isGenerating}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          {hasGeneratedPanels ? (
            <button className="btn btn-primary btn-lg" onClick={onProceed}>
              <span>Review Panel Scripts</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="btn btn-accent btn-lg"
              onClick={onRunScriptGeneration}
              disabled={isGenerating}
            >
              <Wand2 size={18} />
              <span>{isGenerating ? 'Synthesizing Storyboard...' : 'Generate Comic Script'}</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: '2rem' }}>
        {/* Left Column: Character Consistency Roster */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '1.05rem' }}>
              <Users color="#8b5cf6" size={20} />
              Character Visual Roster (Consistency Anchor)
            </div>
            <span className="badge badge-purple">{characters.length} Identified</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            These visual descriptions are automatically injected into every panel where the character appears to maintain hair, outfit, and facial continuity across all panels.
          </p>

          {/* Character List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
            {characters.map((char) => (
              <div
                key={char.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid var(--border-medium)`,
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: char.color_accent,
                        boxShadow: `0 0 8px ${char.color_accent}`
                      }}
                    />
                    <strong style={{ fontSize: '0.95rem' }}>{char.name}</strong>
                    <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{char.role}</span>
                  </div>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeCharacter(char.id)}
                    title="Remove character"
                  >
                    <Trash2 size={14} color="#f43f5e" />
                  </button>
                </div>

                <textarea
                  value={char.visual_description}
                  onChange={(e) => updateCharacterDesc(char.id, e.target.value)}
                  rows={2}
                  placeholder="Visual features (e.g. glowing cyber visor, silver undercut, weathered leather jacket)"
                  style={{ fontSize: '0.85rem', background: 'var(--bg-primary)' }}
                />
              </div>
            ))}
          </div>

          {/* Add Character Input */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <input
              type="text"
              placeholder="Character Name"
              value={newCharName}
              onChange={(e) => setNewCharName(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="text"
              placeholder="Visual description (hair, costume, aura)"
              value={newCharDesc}
              onChange={(e) => setNewCharDesc(e.target.value)}
              style={{ flex: 2 }}
            />
            <button className="btn btn-secondary btn-sm" onClick={addCharacter}>
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Right Column: Model & Pipeline Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Model Picker */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>LLM Scripting Engine (OpenRouter)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {OPENROUTER_MODELS.map(m => (
                <label
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: selectedModel === m.id ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-secondary)',
                    border: selectedModel === m.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="radio"
                      name="model-select"
                      checked={selectedModel === m.id}
                      onChange={() => onModelChange(m.id)}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.name}</span>
                  </div>
                  <span className="badge badge-amber">{m.badge}</span>
                </label>
              ))}
            </div>

            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Panels per Scene Page:</span>
              <select
                value={panelsPerPage}
                onChange={(e) => onPanelsPerPageChange(Number(e.target.value))}
                style={{ width: '130px' }}
              >
                <option value={2}>2 Panels</option>
                <option value={3}>3 Panels</option>
                <option value={4}>4 Panels (Classic)</option>
                <option value={5}>5 Panels (Action)</option>
                <option value={6}>6 Panels (Manga)</option>
              </select>
            </div>
          </div>

          {/* Scene Pages Overview */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Document Storyboard Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {chunks.map((chk, idx) => (
                <div
                  key={chk.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--accent-purple)', fontWeight: 700, marginRight: '0.5rem' }}>
                      Page {idx + 1}:
                    </span>
                    <strong>{chk.heading}</strong>
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>{chk.word_count} words • ~{panelsPerPage} panels</span>
                </div>
              ))}
            </div>

            {hasGeneratedPanels && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                <CheckCircle2 size={18} />
                <span>Script generated successfully! Ready for panel review.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
