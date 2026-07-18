export default function StrategicRead({ bullets }: { bullets: string[] }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
        The Strategic Read
      </h3>
      <ul className="space-y-4">
        {bullets.map((point, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
              {i + 1}
            </span>
            <p className="text-slate-200 text-sm leading-relaxed">{point}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
