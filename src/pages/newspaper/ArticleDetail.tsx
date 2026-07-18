import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Article } from '../../types';
import SwotGrid from '../../components/SwotGrid';
import StrategicRead from '../../components/StrategicRead';

export default function ArticleDetail() {
  const { uploadId, articleId } = useParams<{ uploadId: string; articleId: string }>();
  const [searchParams] = useSearchParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  const backHref = `/newspaper/report/${uploadId}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  useEffect(() => {
    if (!uploadId) return;
    window.mbaDesk.getReport(Number(uploadId)).then((r) => {
      const found = r?.articles.find((a) => String(a.id) === articleId) ?? null;
      setArticle(found);
      setLoading(false);
    });
  }, [uploadId, articleId]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!article) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
      <p>Article not found.</p>
      <Link to={backHref} className="text-blue-400 hover:underline text-sm">← Back to report</Link>
    </div>
  );

  const scoreColor =
    article.relevanceScore >= 4 ? 'bg-emerald-900/60 text-emerald-300 ring-emerald-700' :
    article.relevanceScore >= 3 ? 'bg-blue-900/60 text-blue-300 ring-blue-700' :
    'bg-slate-800 text-slate-400 ring-slate-600';

  return (
    <div className="h-full overflow-y-auto bg-slate-950 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <Link to={backHref} className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm mb-6 transition">
          ← Back to report
        </Link>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-6 border-b border-slate-800">
            <div className="flex justify-between items-start gap-4 mb-4">
              <h1 className="text-2xl font-bold text-white leading-snug">{article.headline}</h1>
              <div className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ring-1 ${scoreColor}`}>
                {article.relevanceScore}/5
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Page {article.page}</span>
              {article.sector && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-400 ring-1 ring-emerald-800">
                  {article.sector}
                </span>
              )}
              {article.functions.map((fn) => (
                <span key={fn} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 ring-1 ring-slate-700">
                  {fn}
                </span>
              ))}
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Detailed Summary</h2>
              <p className="text-slate-200 leading-relaxed">{article.detailedSummary || article.summary}</p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Business Impact</h2>
              <p className="text-slate-200 leading-relaxed">{article.businessImpact}</p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">SWOT Analysis & Strategic Thinking</h2>
              {article.swot ? (
                <>
                  <SwotGrid swot={article.swot} />
                  {article.strategicRead.length > 0 && (
                    <div className="mt-4">
                      <StrategicRead bullets={article.strategicRead} />
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
                  <p className="text-slate-400 font-medium">Re-upload to regenerate this section</p>
                  <p className="text-xs text-slate-600 mt-1">SWOT data available for articles processed after the schema update</p>
                </div>
              )}
            </section>
          </div>
        </div>

      </div>
    </div>
  );
}
