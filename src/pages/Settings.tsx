import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppConfig } from '../types';

export default function Settings({ onSave }: { onSave?: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [dataDir, setDataDir] = useState('');
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.mbaDesk.getConfig().then((cfg) => {
      setApiKey(cfg.geminiApiKey);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await window.mbaDesk.saveConfig({ geminiApiKey: apiKey });
    setSaved(true);
    onSave?.();
    setTimeout(() => { setSaved(false); navigate('/'); }, 1200);
  }

  async function handleOpenDataDir() {
    await window.mbaDesk.openDataDir();
  }

  return (
    <div className="min-h-full bg-slate-950 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-slate-400 text-sm mb-8">Configure your API key and local data</p>

        <form onSubmit={handleSave} className="space-y-6">
          {/* API Key */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2" htmlFor="apiKey">
              Gemini API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza…"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Get your key at{' '}
              <span className="text-blue-400">ai.google.dev</span>.
              Stored locally in your AppData folder — never transmitted anywhere.
            </p>
          </div>

          {/* Local data */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Local Data</label>
            <button
              type="button"
              onClick={handleOpenDataDir}
              className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 text-sm text-left transition flex items-center justify-between"
            >
              <span>Open data folder in Explorer</span>
              <span className="text-slate-500">↗</span>
            </button>
            <p className="text-xs text-slate-500 mt-1.5">
              Reports, articles, and config are stored in AppData\Roaming\MBA Desk
            </p>
          </div>

          {/* Save */}
          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-semibold text-sm transition
              ${saved
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
          >
            {saved ? '✓ Saved — returning…' : 'Save & Continue'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-300 text-xs transition">
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
}
