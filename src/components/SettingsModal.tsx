import React, { useState } from 'react';
import { Settings, Key, ShieldCheck, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
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
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Settings color="#8b5cf6" size={22} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>API Keys & Cloudflare Settings</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.85rem' }}>
            <ShieldCheck color="#10b981" size={20} />
            <span>
              <strong>BYOK Security:</strong> Your API keys are saved securely in your local browser storage. They are never shared or logged.
            </span>
          </div>

          {/* OpenRouter Key */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontWeight: 700, fontSize: '0.88rem' }}>OpenRouter API Key (LLM Scripting)</label>
              {testResult.openrouter && (
                <span style={{ fontSize: '0.78rem', color: testResult.openrouter.ok ? '#10b981' : '#f43f5e', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {testResult.openrouter.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {testResult.openrouter.message}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
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
              >
                <RefreshCw size={13} className={testingKey === 'openrouter' ? 'spinning' : ''} />
                <span>Test</span>
              </button>
            </div>
          </div>

          {/* Replicate Key */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontWeight: 700, fontSize: '0.88rem' }}>Replicate API Token (FLUX.1 / SDXL)</label>
            <input
              type="password"
              placeholder="r8_..."
              value={formData.replicate_key}
              onChange={(e) => handleChange('replicate_key', e.target.value)}
            />
          </div>

          {/* Hugging Face Token */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontWeight: 700, fontSize: '0.88rem' }}>Hugging Face User Access Token</label>
            <input
              type="password"
              placeholder="hf_..."
              value={formData.hf_token}
              onChange={(e) => handleChange('hf_token', e.target.value)}
            />
          </div>

          {/* Cloudflare Workers AI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Cloudflare Account ID</label>
              <input
                type="text"
                placeholder="e.g. 7c34..."
                value={formData.cloudflare_account_id}
                onChange={(e) => handleChange('cloudflare_account_id', e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Cloudflare API Token</label>
              <input
                type="password"
                placeholder="Workers AI Token"
                value={formData.cloudflare_token}
                onChange={(e) => handleChange('cloudflare_token', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
