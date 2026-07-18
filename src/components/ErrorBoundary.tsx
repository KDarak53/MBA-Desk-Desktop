import React from 'react';

interface State { hasError: boolean; error: string }

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white p-8">
          <div className="max-w-lg w-full bg-red-950/50 border border-red-800 rounded-2xl p-8">
            <h1 className="text-xl font-bold text-red-300 mb-2">Something went wrong</h1>
            <p className="text-sm text-red-400 font-mono break-all">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="mt-6 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-semibold transition"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
