import { Link } from 'react-router-dom';
import { Article } from '../types';

interface Props {
  article: Article;
  uploadId: number;
  currentParams: string;
}

const SCORE_STYLES: Record<number, string> = {
  5: 'bg-emerald-900/60 text-emerald-300 ring-1 ring-emerald-700',
  4: 'bg-blue-900/60 text-blue-300 ring-1 ring-blue-700',
  3: 'bg-amber-900/60 text-amber-300 ring-1 ring-amber-700',
  2: 'bg-slate-800 text-slate-400 ring-1 ring-slate-600',
  1: 'bg-slate-800 text-slate-500 ring-1 ring-slate-700',
};

export default function ArticleCard({ article, uploadId, currentParams }: Props) {
  const href = `/report/${uploadId}/article/${article.id}${currentParams ? `?${currentParams}` : ''}`;
  const scoreStyle = SCORE_STYLES[article.relevanceScore] ?? SCORE_STYLES[1];

  return (
    <Link to={href} className="block group">
      <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden
        hover:border-slate-600 hover:shadow-lg hover:shadow-black/30
        active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col">

        {/* Top accent bar based on score */}
        <div className={`h-0.5 w-full ${
          article.relevanceScore >= 4 ? 'bg-emerald-500' :
          article.relevanceScore >= 3 ? 'bg-blue-500' : 'bg-slate-700'
        }`} />

        <div className="p-5 flex flex-col flex-1">
          {/* Score + page */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">Page {article.page}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreStyle}`}>
              {article.relevanceScore}/5
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-white font-semibold text-sm leading-snug mb-3 group-hover:text-blue-300 transition line-clamp-3">
            {article.headline}
          </h2>

          {/* Teaser */}
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 flex-1 mb-4">
            {article.summary}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {article.functions.slice(0, 3).map((fn) => (
              <span key={fn} className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400 ring-1 ring-slate-700">
                {fn}
              </span>
            ))}
            {article.sector && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-800 ml-auto">
                {article.sector}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
