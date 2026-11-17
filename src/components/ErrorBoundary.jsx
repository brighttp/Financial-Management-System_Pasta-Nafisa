import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 selection:bg-primary">
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
              PN
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Terjadi Kendala Memuat Tampilan</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Sistem mengalami kendala sementara saat merender tampilan aplikasi.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[11px] font-mono text-left break-words max-h-28 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
            >
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

