import { SwotData } from '../types';

interface QuadrantProps {
  title: string;
  bullets: string[];
  bg: string;
  text: string;
  border: string;
  dot: string;
}

function Quadrant({ title, bullets, bg, text, border, dot }: QuadrantProps) {
  return (
    <div className={`p-4 rounded-xl border ${border} ${bg}`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 opacity-70 ${text}`}>{title}</h3>
      <ul className="space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full ${dot}`} />
            <span className={`text-xs leading-snug ${text}`}>{b}</span>
          </li>
        ))}
        {bullets.length === 0 && <li className="text-xs opacity-40 italic">—</li>}
      </ul>
    </div>
  );
}

export default function SwotGrid({ swot }: { swot: SwotData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Quadrant title="Strengths"     bullets={swot.strengths}     bg="bg-emerald-950/40" text="text-emerald-200" border="border-emerald-800/50" dot="bg-emerald-400" />
      <Quadrant title="Weaknesses"    bullets={swot.weaknesses}    bg="bg-red-950/40"     text="text-red-200"     border="border-red-800/50"     dot="bg-red-400"     />
      <Quadrant title="Opportunities" bullets={swot.opportunities} bg="bg-blue-950/40"    text="text-blue-200"    border="border-blue-800/50"    dot="bg-blue-400"    />
      <Quadrant title="Threats"       bullets={swot.threats}       bg="bg-amber-950/40"   text="text-amber-200"   border="border-amber-800/50"   dot="bg-amber-400"   />
    </div>
  );
}
