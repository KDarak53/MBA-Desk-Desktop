import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Home from './pages/newspaper/Home';
import Report from './pages/newspaper/Report';
import ArticleDetail from './pages/newspaper/ArticleDetail';
import Settings from './pages/Settings';

type InitState = 'loading' | 'ready' | 'no-key' | 'error';

export interface ProcessingState {
  stage: 'idle' | 'picking' | 'processing' | 'done' | 'error';
  error: string;
}

// Global processing state shared across pages so navigation doesn't kill the job
export default function App() {
  const [initState, setInitState] = useState<InitState>('loading');
  const [initError, setInitError] = useState('');

  // Processing lives here — survives Home unmount/remount
  const [processing, setProcessing] = useState<ProcessingState>({ stage: 'idle', error: '' });

  useEffect(() => {
    let attempts = 0;
    const tryInit = () => {
      attempts++;
      if (typeof window.mbaDesk === 'undefined') {
        if (attempts < 20) { setTimeout(tryInit, 200); return; }
        setInitError('window.mbaDesk is not defined — preload script may have failed.');
        setInitState('error');
        return;
      }
      window.mbaDesk.getConfig()
        .then((cfg: any) => setInitState(cfg?.geminiApiKey ? 'ready' : 'no-key'))
        .catch((err: any) => { setInitError(String(err?.message ?? err)); setInitState('error'); });
    };
    const t = setTimeout(tryInit, 300);
    return () => clearTimeout(t);
  }, []);

  const handleUpload = useCallback(async (limit: string, navigate: (path: string) => void) => {
    setProcessing({ stage: 'picking', error: '' });
    try {
      const filePath = await window.mbaDesk.pickPdf();
      if (!filePath) { setProcessing({ stage: 'idle', error: '' }); return; }

      setProcessing({ stage: 'processing', error: '' });
      // This Promise lives in App — survives navigation away from Home
      const report = await window.mbaDesk.processPdf(filePath, limit) as any;
      setProcessing({ stage: 'done', error: '' });
      navigate(`/newspaper/report/${report.upload.id}`);
      // Reset after navigation
      setTimeout(() => setProcessing({ stage: 'idle', error: '' }), 500);
    } catch (err: any) {
      const msg = err?.message === 'NO_API_KEY'
        ? 'Gemini API key not set. Go to Settings first.'
        : (err?.message ?? 'Processing failed. Please try again.');
      setProcessing({ stage: 'error', error: msg });
    }
  }, []);

  if (initState === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#94a3b8', fontFamily: 'system-ui' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: 16, fontSize: 14 }}>Starting...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (initState === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#f87171', fontFamily: 'system-ui', padding: 32 }}>
        <h2 style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 8 }}>Startup Error</h2>
        <p style={{ fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: 480, textAlign: 'center' }}>{initError}</p>
        <button onClick={() => { setInitState('loading'); setInitError(''); }} style={{ marginTop: 24, padding: '8px 20px', background: '#991b1b', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Routes>
        <Route
          path="/"
          element={
            initState === 'ready'
              ? <Layout />
              : <Navigate to="/settings" replace />
          }
        >
          {/* Dashboard is the default index route */}
          <Route index element={<Dashboard processing={processing} />} />
          
          {/* Newspaper tool nested routes */}
          <Route path="newspaper/home" element={<Home processing={processing} onUpload={handleUpload} />} />
          <Route path="newspaper/report/:uploadId" element={<Report />} />
          <Route path="newspaper/report/:uploadId/article/:articleId" element={<ArticleDetail />} />
          
          <Route path="settings" element={<Settings onSave={() => setInitState('ready')} isProcessing={processing.stage === 'picking' || processing.stage === 'processing'} />} />
        </Route>
        
        {/* Settings outside layout for first-run login */}
        <Route 
          path="/settings" 
          element={
            initState === 'ready' 
              ? <Navigate to="/" replace /> 
              : <Settings onSave={() => setInitState('ready')} />
          } 
        />
      </Routes>
    </div>
  );
}
