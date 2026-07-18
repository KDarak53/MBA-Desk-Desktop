import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Report from './pages/Report';
import ArticleDetail from './pages/ArticleDetail';
import Settings from './pages/Settings';
import TitleBar from './components/TitleBar';

export default function App() {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    window.mbaDesk.getConfig().then((cfg) => {
      setHasApiKey(!!cfg.geminiApiKey);
    });
  }, []);

  if (hasApiKey === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TitleBar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={hasApiKey ? <Home /> : <Navigate to="/settings" replace />} />
          <Route path="/report/:uploadId" element={<Report />} />
          <Route path="/report/:uploadId/article/:articleId" element={<ArticleDetail />} />
          <Route path="/settings" element={<Settings onSave={() => setHasApiKey(true)} />} />
        </Routes>
      </main>
    </div>
  );
}
