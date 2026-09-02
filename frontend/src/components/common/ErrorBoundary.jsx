import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
        <div className="p-8 rounded-3xl bg-slate-900 border border-rose-500/30 text-right space-y-4 shadow-xl" dir="rtl">
          <div className="flex items-center space-x-3 space-x-reverse text-rose-400">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">حدث خطأ أثناء تحميل هذا القسم</h3>
              <p className="text-xs text-rose-300/80">{this.state.error?.message || 'خطأ غير متوقع في الواجهة.'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-2 space-x-reverse"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة محاولة التحميل</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
