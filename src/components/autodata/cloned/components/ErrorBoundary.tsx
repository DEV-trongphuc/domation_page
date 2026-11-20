/* eslint-disable react-refresh/only-export-components */
import { Component, lazy } from 'react';
import type { ComponentType, ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

const CHUNK_ERR_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|Unable to preload CSS|error loading dynamically imported module|ChunkLoadError/i;

export function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === 'string') return CHUNK_ERR_RE.test(err);
  const e = err as { name?: string; message?: string; stack?: string };
  return (
    e.name === 'ChunkLoadError' ||
    CHUNK_ERR_RE.test(e.message || '') ||
    CHUNK_ERR_RE.test(e.stack || '')
  );
}

async function purgeStaleChunkCaches(): Promise<void> {
  if (typeof window === 'undefined') return;
  const tasks: Promise<unknown>[] = [];
  if ('caches' in window) {
    try {
      tasks.push(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
    } catch {
      // ignore
    }
  }
  if ('serviceWorker' in navigator) {
    try {
      tasks.push(
        navigator.serviceWorker.getRegistrations().then((regs) => Promise.all(regs.map((r) => r.update())))
      );
    } catch {
      // ignore
    }
  }
  await Promise.allSettled(tasks);
}

export function lazyWithChunkRetry<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await importer();
    } catch (err) {
      if (isChunkLoadError(err)) {
        await purgeStaleChunkCaches();
        return await importer();
      }
      throw err;
    }
  });
}

if (typeof window !== 'undefined') {
  const handleChunkErrorBackground = async (msg: string) => {
    if (isChunkLoadError(msg)) {
      console.warn('[ErrorBoundary] Detected dynamic chunk fetch error in background:', msg);
      await purgeStaleChunkCaches();
    }
  };

  window.addEventListener(
    'error',
    (e) => {
      void handleChunkErrorBackground(e.message || '');
    },
    true
  );

  window.addEventListener('unhandledrejection', (e) => {
    const msg = (e.reason as { message?: string } | undefined)?.message || String(e.reason || '');
    void handleChunkErrorBackground(msg);
  });
}

const ERROR_BOUNDARY_I18N: Record<string, Record<string, string>> = {
  en: {
    'Đã xảy ra lỗi hệ thống': 'A system error occurred',
    'Chúng tôi xin lỗi vì sự bất tiện này. Lỗi đã được ghi nhận. Vui lòng tải lại trang để tiếp tục.':
      'We apologize for the inconvenience. The error has been logged. Please reload the page to continue.',
    'Không thể tải nội dung này': 'Could not load this section',
    'Đã xảy ra sự cố khi hiển thị phần này.': 'An error occurred while rendering this section.',
    'Thử lại': 'Retry',
    'Tải lại trang': 'Reload page',
  },
  ja: {
    'Đã xảy ra lỗi hệ thống': 'システムエラーが発生しました',
    'Chúng tôi xin lỗi vì sự bất tiện này. Lỗi đã được ghi nhận. Vui lòng tải lại trang để tiếp tục.':
      'ご不便をおかけして申し訳ございません。ページを再読み込みして続行してください。',
    'Không thể tải nội dung này': 'このセクションを読み込めません',
    'Đã xảy ra sự cố khi hiển thị phần này.': 'このセクションの表示中に問題が発生しました。',
    'Thử lại': '再試行',
    'Tải lại trang': 'ページを再読み込み',
  },
  zh: {
    'Đã xảy ra lỗi hệ thống': '发生系统错误',
    'Chúng tôi xin lỗi vì sự bất tiện này. Lỗi đã được ghi nhận. Vui lòng tải lại trang để tiếp tục.':
      '对于给您带来的不便，我们深表歉意。请重新加载页面以继续。',
    'Không thể tải nội dung này': '无法加载此部分',
    'Đã xảy ra sự cố khi hiển thị phần này.': '显示此部分时发生错误。',
    'Thử lại': '重试',
    'Tải lại trang': '重新加载页面',
  },
};

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  compact?: boolean;
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    if (isChunkLoadError(error) && typeof window !== 'undefined') {
      const now = Date.now();
      let lastReload = 0;
      try {
        lastReload = parseInt(sessionStorage.getItem('domation_chunk_boundary_reload_ts') || '0', 10) || 0;
      } catch {
        lastReload = 0;
      }
      void purgeStaleChunkCaches().finally(() => {
        if (now - lastReload > 15000) {
          try {
            sessionStorage.setItem('domation_chunk_boundary_reload_ts', String(now));
          } catch {
            // ignore storage errors in restricted environments
          }
          const url = new URL(window.location.href);
          url.searchParams.set('_v', String(now));
          window.location.replace(url.toString());
        }
      });
    }
  }

  public handleReset = () => {
    if (isChunkLoadError(this.state.error) && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('_v');
      window.location.replace(url.toString());
      return;
    }
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      let lang = 'vi';
      try {
        lang = (typeof localStorage !== 'undefined' && localStorage.getItem('domation_lang')) || 'vi';
      } catch {
        lang = 'vi';
      }
      const t = (key: string) => {
        if (lang === 'vi') return key;
        return ERROR_BOUNDARY_I18N[lang]?.[key] || ERROR_BOUNDARY_I18N.en[key] || key;
      };

      if (this.props.compact) {
        return (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-center flex flex-col items-center gap-2">
            <p className="m-0 text-sm font-semibold text-red-600">{t('Không thể tải nội dung này')}</p>
            <p className="m-0 text-xs text-slate-500">{t('Đã xảy ra sự cố khi hiển thị phần này.')}</p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50"
            >
              <RefreshCw size={14} /> {t('Thử lại')}
            </button>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[360px] p-6 sm:p-10 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-lg mx-auto my-8">
          <div className="w-14 h-14 mb-5 text-red-500 bg-red-50 rounded-full flex items-center justify-center shadow-inner">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{t('Đã xảy ra lỗi hệ thống')}</h2>
          <p className="text-slate-500 mb-6 max-w-md text-sm leading-relaxed">
            {t('Chúng tôi xin lỗi vì sự bất tiện này. Lỗi đã được ghi nhận. Vui lòng tải lại trang để tiếp tục.')}
          </p>
          <div className="grid grid-cols-2 sm:flex gap-3 justify-center w-full sm:w-auto">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-5 min-h-[44px] rounded-xl bg-[#1E40FF] text-white text-sm font-semibold hover:bg-[#1E3A8A]"
            >
              <RefreshCw size={16} /> {t('Thử lại')}
            </button>
            <button
              type="button"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('_v');
                window.location.replace(url.toString());
              }}
              className="inline-flex items-center justify-center gap-2 px-5 min-h-[44px] rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50"
            >
              {t('Tải lại trang')}
            </button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <div className="mt-6 p-4 bg-red-50 rounded-xl text-left w-full overflow-auto max-h-56 border border-red-100">
              <p className="text-red-800 font-mono text-xs whitespace-pre-wrap">{this.state.error.toString()}</p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
