import React, { useState } from 'react';
import sounds from '../sound.js';
import { getSupabaseConfig, saveSupabaseConfig, testSupabaseConnection, isSupabaseAvailable } from '../supabaseClient.js';

export default function SupabaseConfigModal({ onClose, onConfigSaved }) {
  const current = getSupabaseConfig();
  const [url, setUrl] = useState(current.url);
  const [key, setKey] = useState(current.key);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    if (!url || !key) {
      setTestResult({ success: false, message: 'Please enter both URL and Anon Key first.' });
      return;
    }
    sounds.btnClick();
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url.trim(), key.trim());
    setTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    sounds.btnClick();
    const ok = saveSupabaseConfig(url.trim(), key.trim());
    if (onConfigSaved) onConfigSaved(ok);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1600 }}>
      <div className="modal" style={{ maxWidth: '580px', width: '95%' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚡</span> Supabase Realtime Relay Settings
        </div>

        <div className="modal-body" style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Supabase Realtime provides instant, zero-cold-start WebSockets for online multiplayer without requiring a dedicated server running 24/7.
          </p>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', color: '#93C5FD' }}>
              Project URL
            </label>
            <input
              type="text"
              className="input-field"
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem' }}
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', color: '#93C5FD' }}>
              Anon Public API Key
            </label>
            <textarea
              className="input-field"
              rows={3}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? '⏳ Testing Connection...' : '🧪 Test Realtime Channel'}
            </button>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '0.75rem',
                color: '#60A5FA',
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'underline',
                marginLeft: 'auto'
              }}
            >
              Get free keys at supabase.com ↗
            </a>
          </div>

          {testResult && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                marginBottom: '10px',
                background: testResult.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                color: testResult.success ? '#34D399' : '#F87171'
              }}
            >
              {testResult.success ? '✓ ' : '✗ '} {testResult.message}
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>💾 Save & Apply</button>
        </div>
      </div>
    </div>
  );
}
