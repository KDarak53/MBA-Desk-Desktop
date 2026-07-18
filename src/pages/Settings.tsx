import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Settings({ onSave, isProcessing }: { onSave?: () => void; isProcessing?: boolean }) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window.mbaDesk !== 'undefined') {
      window.mbaDesk.getConfig().then((cfg: any) => {
        setApiKey(cfg?.geminiApiKey ?? '');
      }).catch(() => {});
    }
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      await window.mbaDesk.saveConfig({ geminiApiKey: apiKey.trim() });
      setSaved(true);
      onSave?.();
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo / heading */}
        {isProcessing && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 16, height: 16, border: '2px solid #60a5fa', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div>
              <p style={{ color: '#93c5fd', fontSize: 13, fontWeight: 500, margin: 0 }}>Processing in background...</p>
              <p style={{ color: '#60a5fa', fontSize: 12, margin: '2px 0 0 0', opacity: 0.8 }}>You can safely change settings.</p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📰</div>
          <h1 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 24, margin: 0 }}>MBA Desk</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 6 }}>Enter your Gemini API key to get started</p>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy…"
              autoFocus
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 12,
                color: '#f1f5f9',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ color: '#475569', fontSize: 12, marginTop: 8 }}>
              Get your free key at <span style={{ color: '#60a5fa' }}>aistudio.google.com</span> → Get API Key
            </p>
          </div>

          <button
            type="submit"
            disabled={!apiKey.trim() || saving}
            style={{
              width: '100%',
              padding: '13px 0',
              background: saved ? '#16a34a' : (apiKey.trim() ? '#2563eb' : '#1e3a5f'),
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: apiKey.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
            }}
          >
            {saved ? '✓ Saved! Opening…' : saving ? 'Saving…' : 'Save & Continue →'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer' }}
          >
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
}
