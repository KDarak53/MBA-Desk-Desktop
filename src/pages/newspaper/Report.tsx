import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Report as ReportType, Article, FUNCTIONS } from '../../types';
import ArticleCard from '../../components/ArticleCard';

type SortKey = 'score' | 'page';

export default function Report() {
  const { uploadId } = useParams<{ uploadId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [report, setReport] = useState<ReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const selectedFunction = searchParams.get('function') ?? 'All';
  const selectedSector   = searchParams.get('sector')   ?? 'All';
  const sortBy           = (searchParams.get('sort') ?? 'score') as SortKey;

  useEffect(() => {
    if (!uploadId) return;
    window.mbaDesk.getReport(Number(uploadId))
      .then((r) => { setReport(r); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [uploadId]);

  const functionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    report?.articles.forEach((a) => {
      a.functions.forEach((f) => { counts[f] = (counts[f] ?? 0) + 1; });
    });
    return counts;
  }, [report]);

  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    report?.articles.forEach((a) => {
      if (a.sector) counts[a.sector] = (counts[a.sector] ?? 0) + 1;
    });
    return counts;
  }, [report]);

  const filtered = useMemo(() => {
    if (!report) return [];
    return report.articles.filter((a) => {
      const fnMatch = selectedFunction === 'All'
        ? true
        : selectedFunction === 'Cross-functional'
          ? a.functions.length > 1
          : a.functions.includes(selectedFunction as any);
      const secMatch = selectedSector === 'All' ? true : a.sector === selectedSector;
      return fnMatch && secMatch;
    });
  }, [report, selectedFunction, selectedSector]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) =>
      sortBy === 'score' ? b.relevanceScore - a.relevanceScore : a.page - b.page
    ), [filtered, sortBy]);

  function setFilter(key: string, value: string) {
    setSearchParams((prev) => { prev.set(key, value); return prev; });
  }

  async function handleExport(format: 'markdown') {
    if (!uploadId) return;
    setExporting(true);
    try { await window.mbaDesk.exportReport(format, Number(uploadId)); }
    finally { setExporting(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error || !report) return (
    <div className="flex items-center justify-center h-full text-red-400">{error || 'Report not found'}</div>
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-950 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/" className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-block">← All Reports</Link>
          <h1 className="text-2xl font-bold text-white">{report.upload.filename}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {report.upload.articleCount} articles · {new Date(report.upload.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleExport('markdown')}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {exporting ? '…' : '↓ Download Markdown'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Filter Bar */}
        <div className="mb-6 bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <div className="flex flex-wrap gap-2 mb-4">
            {(['All', 'Cross-functional', ...FUNCTIONS] as const).map((fn) => {
              const count = fn === 'All'
                ? report.articles.length
                : fn === 'Cross-functional'
                  ? report.articles.filter((a) => a.functions.length > 1).length
                  : functionCounts[fn] ?? 0;
              if (fn !== 'All' && fn !== 'Cross-functional' && count === 0) return null;
              return (
                <button
                  key={fn}
                  onClick={() => setFilter('function', fn)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition
                    ${selectedFunction === fn
                      ? fn === 'Cross-functional'
                        ? 'bg-purple-600 text-white'
                        : 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                  {fn} {fn !== 'Cross-functional' && `(${count})`}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {/* Sector filter */}
            {Object.keys(sectorCounts).length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">Sector:</span>
                <select
                  value={selectedSector}
                  onChange={(e) => setFilter('sector', e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All</option>
                  {Object.entries(sectorCounts).map(([sec, cnt]) => (
                    <option key={sec} value={sec}>{sec} ({cnt})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-slate-500 text-xs">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setFilter('sort', e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="score">Relevance Score</option>
                <option value="page">Page Order</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        {sorted.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-slate-800">
            <p className="text-slate-500">No articles match this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sorted.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                uploadId={Number(uploadId)}
                currentParams={searchParams.toString()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
