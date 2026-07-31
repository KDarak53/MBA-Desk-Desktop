import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload } from '../../types';
import { ProcessingState } from '../../App';

interface Props {
  processing: ProcessingState;
  onUpload: (limit: string, navigate: (path: string) => void) => void;
}

export default function Home({ processing, onUpload }: Props) {
  const [history, setHistory] = useState<Upload[]>([]);
  const [limit, setLimit] = useState('10');
  const navigate = useNavigate();

  useEffect(() => {
    window.mbaDesk.getAllUploads().then((uploads: any) => setHistory(uploads));
  }, [
    // Refresh history when processing finishes
    processing.stage === 'done' ? 'done' : null
  ]);

  // Reload history when a new report lands
  useEffect(() => {
    if (processing.stage === 'done' || processing.stage === 'idle') {
      window.mbaDesk.getAllUploads().then((uploads: any) => setHistory(uploads));
    }
  }, [processing.stage]);

  async function handleDelete(e: React.MouseEvent, uploadId: number) {
    e.preventDefault();
    e.stopPropagation();
    await window.mbaDesk.deleteUpload(uploadId);
    setHistory((h) => h.filter((u: Upload) => u.id !== uploadId));
  }

  const { stage, error } = processing;
  const busy = stage === 'processing' || stage === 'picking';

  return (
    <div className="h-full overflow-y-auto bg-slate-950 flex flex-col">
      {/* Top nav */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white">MBA Daily Briefing</h1>
          <p className="text-xs text-slate-400 mt-0.5">Upload a newspaper PDF for your intelligence report</p>
        </div>
        <Link to="/settings" className="text-slate-400 hover:text-white transition text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800">
          &#9881; Settings
        </Link>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">

        {/* Upload card */}
        <div className="w-full max-w-lg">
          <button
            onClick={busy ? undefined : () => onUpload(limit, navigate)}
            disabled={busy}
            className={`w-full rounded-2xl border-2 border-dashed p-12 flex flex-col items-center gap-4 transition-all
              ${busy
                ? 'border-blue-500/50 bg-blue-950/30 cursor-wait'
                : 'border-slate-700 hover:border-blue-500 hover:bg-slate-900 cursor-pointer'
              }`}
          >
            {stage === 'processing' ? (
              <>
                <div className="w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-blue-300 font-semibold">Analysing with Gemini...</p>
                <p className="text-slate-500 text-sm">This takes 60-120 seconds for a full newspaper</p>
                <p className="text-slate-600 text-xs mt-1">You can navigate freely — processing continues in the background</p>
              </>
            ) : stage === 'picking' ? (
              <>
                <span className="text-4xl">&#128194;</span>
                <p className="text-slate-300">Opening file picker...</p>
              </>
            ) : (
              <>
                <span className="text-5xl">&#128240;</span>
                <div className="text-center">
                  <p className="text-white font-semibold text-lg">Upload Newspaper PDF</p>
                  <p className="text-slate-400 text-sm mt-1">Click to select a PDF from your computer</p>
                  
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <span className="text-slate-400 text-sm">Limit articles:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 hover:bg-slate-700 transition w-20 text-center"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="All"
                    />
                  </div>
                </div>
                <div className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition">
                  Choose File
                </div>
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-300 text-sm flex items-start gap-2">
              <span>&#9888;</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="w-full max-w-lg">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Past Reports</h2>
            <div className="space-y-2">
              {history.map((u: Upload) => (
                <Link
                  key={u.id}
                  to={`/newspaper/report/${u.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 hover:bg-slate-800 transition group"
                >
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{u.filename}</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {u.articleCount} articles &middot; {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <span className="text-slate-500 group-hover:text-white text-sm transition">&#8594;</span>
                    <button
                      onClick={(e) => handleDelete(e, u.id)}
                      className="text-slate-600 hover:text-red-400 transition text-xs px-2 py-1 rounded"
                      title="Delete"
                    >&#10005;</button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
