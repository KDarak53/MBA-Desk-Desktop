import { Link } from 'react-router-dom';
import { ProcessingState } from '../App';

export default function Dashboard({ processing }: { processing: ProcessingState }) {
  const tools = [
    {
      id: 'newspaper',
      name: 'Smart News Paper',
      description: 'Upload daily newspaper PDFs for intelligent extraction, SWOT analysis, and strategic reading.',
      icon: '📰',
      path: '/newspaper/home',
      color: 'blue'
    },
    {
      id: 'case-studies',
      name: 'Case Studies',
      description: 'Upload Harvard/Stanford case studies for instant protagonist mapping, dilemmas, and frameworks.',
      icon: '📚',
      path: '#', // placeholder
      color: 'emerald',
      comingSoon: true
    },
    {
      id: 'financials',
      name: 'Financial Modeling',
      description: 'Extract tables from 10-Ks and generate DCF models automatically.',
      icon: '📈',
      path: '#', // placeholder
      color: 'purple',
      comingSoon: true
    }
  ];

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to MBA Desk</h1>
        <p className="text-slate-400">Select a tool to get started with your coursework.</p>
      </header>

      {/* Show active processing banner if something is running in the background */}
      {(processing.stage === 'picking' || processing.stage === 'processing') && (
        <div className="mb-8 p-4 bg-blue-900/20 border border-blue-800/50 rounded-2xl flex items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <h3 className="text-blue-100 font-semibold text-sm">Background Task Running</h3>
            <p className="text-blue-300 text-xs mt-0.5">Smart News Paper is currently analysing a PDF.</p>
          </div>
          <Link to="/newspaper/home" className="ml-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition">
            View Progress
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.comingSoon ? '#' : tool.path}
            className={`relative group flex flex-col p-6 rounded-2xl border transition-all duration-300 ${
              tool.comingSoon 
                ? 'bg-slate-900/50 border-slate-800 opacity-60 cursor-not-allowed'
                : 'bg-slate-900 border-slate-700 hover:border-blue-500 hover:bg-slate-800 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20'
            }`}
          >
            {tool.comingSoon && (
              <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded-md">
                Coming Soon
              </span>
            )}
            <div className={`text-4xl mb-4 p-3 inline-flex bg-slate-950 rounded-xl w-16 h-16 items-center justify-center border border-slate-800 ${
              !tool.comingSoon && 'group-hover:scale-110 transition-transform duration-300'
            }`}>
              {tool.icon}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{tool.name}</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{tool.description}</p>
            
            {!tool.comingSoon && (
              <div className="mt-6 flex items-center text-blue-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Launch Tool <span className="ml-2">→</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
