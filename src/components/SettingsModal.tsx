import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { UserSettings } from '../types/comic';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [k: string]: { ok: boolean; message: string } }>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
    }
  }, [isOpen, settings]);

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

  const handleChange = (field: keyof UserSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const testOpenRouter = async () => {
    if (!formData.openrouter_key) return;
    setTestingKey('openrouter');
    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { 'Authorization': `Bearer ${formData.openrouter_key}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(prev => ({ ...prev, openrouter: { ok: true, message: `Connected (${data.data?.label || 'Active'})` } }));
      } else {
        setTestResult(prev => ({ ...prev, openrouter: { ok: false, message: 'Invalid API Key' } }));
      }
    } catch {
      setTestResult(prev => ({ ...prev, openrouter: { ok: false, message: 'Network / Connection error' } }));
    } finally {
      setTestingKey(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '640px' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Settings color="#8b5cf6" size={22} aria-hidden="true" />
            <h2 id="settings-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800 }}>API Keys & Cloudflare Settings</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close Settings Modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.85rem' }}>
            <ShieldCheck color="#10b981" size={20} aria-hidden="true" />
            <span>
              <strong>WebCrypto AES-GCM 256-bit Encrypted:</strong> Your API keys and tokens are encrypted on-device before writing to storage. They are never shared, uploaded or logged.
            </span>
          </div>

          {/* OpenRouter Key */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label htmlFor="openrouter_key" style={{ fontWeight: 700, fontSize: '0.88rem' }}>OpenRouter API Key (LLM Scripting)</label>
              {testResult.openrouter && (
                <span style={{ fontSize: '0.78rem', color: testResult.openrouter.ok ? '#10b981' : '#f43f5e', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {testResult.openrouter.ok ? <CheckCircle2 size={12} aria-hidden="true" /> : <AlertCircle size={12} aria-hidden="true" />}
                  {testResult.openrouter.message}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="openrouter_key"
                type="password"
                placeholder="sk-or-v1-..."
                value={formData.openrouter_key}
                onChange={(e) => handleChange('openrouter_key', e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={testOpenRouter}
                disabled={!formData.openrouter_key || testingKey === 'openrouter'}
                type="button"
                aria-label="Test OpenRouter API Key"
              >
                <RefreshCw size={13} className={testingKey === 'openrouter' ? 'spinning' : ''} aria-hidden="true" />
                <span>Test</span>
              </button>
            </div>
          </div>

          {/* Replicate Key */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label htmlFor="replicate_key" style={{ fontWeight: 700, fontSize: '0.88rem' }}>Replicate API Token (FLUX.1 / SDXL)</label>
            <input
              id="replicate_key"
              type="password"
              placeholder="r8_..."
              value={formData.replicate_key}
              onChange={(e) => handleChange('replicate_key', e.target.value)}
            />
          </div>

          {/* Hugging Face Token */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label htmlFor="hf_token" style={{ fontWeight: 700, fontSize: '0.88rem' }}>Hugging Face User Access Token</label>
            <input
              id="hf_token"
              type="password"
              placeholder="hf_..."
              value={formData.hf_token}
              onChange={(e) => handleChange('hf_token', e.target.value)}
            />
          </div>

          {/* Cloudflare Workers AI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="cloudflare_account_id" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Cloudflare Account ID</label>
              <input
                id="cloudflare_account_id"
                type="text"
                placeholder="e.g. 7c34..."
                value={formData.cloudflare_account_id}
                onChange={(e) => handleChange('cloudflare_account_id', e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="cloudflare_token" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Cloudflare API Token</label>
              <input
                id="cloudflare_token"
                type="password"
                placeholder="Workers AI Token"
                value={formData.cloudflare_token}
                onChange={(e) => handleChange('cloudflare_token', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} type="button">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
