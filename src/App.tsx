import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Report from './pages/Report';
import ArticleDetail from './pages/ArticleDetail';
import Settings from './pages/Settings';

type InitState = 'loading' | 'ready' | 'no-key' | 'error';

export default function App() {
  const [initState, setInitState] = useState<InitState>('loading');
  const [initError, setInitError] = useState('');

  useEffect(() => {
    // Poll until window.mbaDesk is available (preload may not be ready at first paint)
    let attempts = 0;
    const tryInit = () => {
      attempts++;
      if (typeof window.mbaDesk === 'undefined') {
        if (attempts < 20) {
          setTimeout(tryInit, 200);
        } else {
          setInitError('window.mbaDesk is not defined — preload script may have failed to load.');
          setInitState('error');
        }
        return;
      }

      window.mbaDesk.getConfig()
        .then((cfg: any) => {
          setInitState(cfg?.geminiApiKey ? 'ready' : 'no-key');
        })
        .catch((err: any) => {
          console.error('getConfig failed:', err);
          setInitError(String(err?.message ?? err));
          setInitState('error');
        });
    };

    const timer = setTimeout(tryInit, 300);
    return () => clearTimeout(timer);
  }, []);

  if (initState === 'loading') {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0f172a', color:'#94a3b8', fontFamily:'system-ui' }}>
        <div style={{ width:32, height:32, border:'2px solid #3b82f6', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <p style={{ marginTop:16, fontSize:14 }}>Starting…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (initState === 'error') {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0f172a', color:'#f87171', fontFamily:'system-ui', padding:32 }}>
        <h2 style={{ fontWeight:'bold', fontSize:20, marginBottom:8 }}>Startup Error</h2>
        <p style={{ fontSize:13, fontFamily:'monospace', wordBreak:'break-all', maxWidth:480, textAlign:'center' }}>{initError}</p>
        <button
          onClick={() => { setInitState('loading'); setInitError(''); }}
          style={{ marginTop:24, padding:'8px 20px', background:'#991b1b', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:14 }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Routes>
        <Route path="/" element={initState === 'ready' ? <Home /> : <Navigate to="/settings" replace />} />
        <Route path="/report/:uploadId" element={<Report />} />
        <Route path="/report/:uploadId/article/:articleId" element={<ArticleDetail />} />
        <Route path="/settings" element={<Settings onSave={() => setInitState('ready')} />} />
      </Routes>
    </div>
  );
}
