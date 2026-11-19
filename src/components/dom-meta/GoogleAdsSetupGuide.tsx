import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Play,
  Sparkles,
} from 'lucide-react';
import {
  GOOGLE_ADS_APPSCRIPT_SCOPES_JSON,
  GOOGLE_ADS_SETUP_STEPS,
  type DomMetaGoogleAdsConfig,
} from './domMetaTypes';

interface GoogleAdsSetupGuideProps {
  value: DomMetaGoogleAdsConfig;
  onChange: (next: DomMetaGoogleAdsConfig) => void;
  onTestConnection?: (cfg: DomMetaGoogleAdsConfig) => Promise<{ rowsCount: number }>;
  compact?: boolean;
}

export const GoogleAdsSetupGuide: React.FC<GoogleAdsSetupGuideProps> = ({
  value,
  onChange,
  onTestConnection,
  compact = false,
}) => {
  const [copiedScopes, setCopiedScopes] = useState(false);
  const [showScopesJson, setShowScopesJson] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  const handleToggle = () => {
    setTestResult(null);
    onChange({
      ...value,
      enabled: !value.enabled,
    });
  };

  const handleCopyScopes = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_ADS_APPSCRIPT_SCOPES_JSON);
      setCopiedScopes(true);
      setTimeout(() => setCopiedScopes(false), 2000);
    } catch {
      // Ignore clipboard denial
    }
  };

  const handleTest = async () => {
    if (!onTestConnection) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(value);
      setTestResult({
        ok: true,
        text: `Kết nối Google Ads thành công! Đã đọc được ${res.rowsCount} dòng hiệu suất chiến dịch.`,
      });
    } catch (err: unknown) {
      setTestResult({
        ok: false,
        text:
          err instanceof Error && err.message
            ? err.message
            : 'Chưa đọc được dữ liệu từ Apps Script URL. Vui lòng kiểm tra Bước 4.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Master Toggle Switch Card — Default OFF */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all ${
          value.enabled
            ? 'bg-gradient-to-r from-[#F4F8FF] via-white to-cyan-50/40 border-blue-200 shadow-sm'
            : 'bg-slate-50/90 border-slate-200/85'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm sm:text-base font-semibold text-slate-800">
                Mở rộng Báo cáo Google Ads
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  value.enabled
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {value.enabled ? 'Đang bật' : 'Tùy chọn bật thêm'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {value.enabled
                ? 'Bảng báo cáo Google Ads sẽ hiển thị trên thanh điều hướng cùng hướng dẫn kết nối 5 bước chi tiết.'
                : 'Chỉ chạy Meta Ads? Giao diện được giữ tinh gọn hoàn toàn cho Meta Ads. Khi cần theo dõi thêm Google Ads, hãy gạt nút bên phải để kết nối.'}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={value.enabled}
            data-testid="google-ads-toggle"
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              value.enabled ? 'bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]' : 'bg-slate-300'
            }`}
            style={{ width: 52 }}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ${
                value.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expandable 5-Step Guide + Credentials Form (ONLY when toggled ON) */}
      {value.enabled && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#F4F8FF]/90 border border-blue-200/80 p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1E40FF]">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Hướng Dẫn 5 Bước Kết Nối Google Ads Qua Google Sheets</span>
              </div>
              <a
                href="https://script.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E40FF] hover:underline"
              >
                <span>Mở Google Apps Script</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-2.5`}>
              {GOOGLE_ADS_SETUP_STEPS.map((s) => (
                <div
                  key={s.step}
                  className="rounded-xl bg-white border border-blue-100/90 p-3 flex items-start gap-2.5"
                >
                  <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200/80 text-[11px] font-mono font-semibold text-[#1E40FF] shrink-0">
                    {s.step}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800">{s.title}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Copyable appsscript.json OAuth Scopes (compact header + toggleable JSON) */}
            <div className="rounded-xl bg-slate-900 text-slate-100 px-3.5 py-2.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-semibold text-cyan-300">
                  appsscript.json (Cấp quyền Bước 03: adwords + spreadsheets + external_request)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowScopesJson((v) => !v)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-slate-200 cursor-pointer"
                  >
                    {showScopesJson ? 'Thu gọn JSON' : 'Xem JSON'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyScopes}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1E40FF] hover:bg-blue-600 text-[11px] font-semibold text-white cursor-pointer"
                  >
                    {copiedScopes ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-300" />
                        <span>Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              {showScopesJson && (
                <pre className="text-[10.5px] font-mono text-slate-200 overflow-x-auto leading-relaxed pt-1 border-t border-slate-800">
                  {GOOGLE_ADS_APPSCRIPT_SCOPES_JSON}
                </pre>
              )}
            </div>
          </div>

          {/* Connection Inputs */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Ads Customer ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={value.customer_id}
                  onChange={(e) => onChange({ ...value, customer_id: e.target.value })}
                  placeholder="VD: 295-339-0933"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs font-mono font-medium text-slate-800 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Developer Token <span className="text-slate-400 font-normal">(Tùy chọn Direct API)</span>
                </label>
                <input
                  type="password"
                  value={value.developer_token ?? ''}
                  onChange={(e) => onChange({ ...value, developer_token: e.target.value })}
                  placeholder={
                    value.has_developer_token
                      ? `Đã lưu (${value.developer_token_masked || '••••'}) — để trống nếu giữ nguyên`
                      : 'Nhập nếu dùng Google Ads Direct API...'
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs font-mono text-slate-800 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Apps Script Web App URL (<code>.../exec</code>){' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                value={value.apps_script_url}
                onChange={(e) => onChange({ ...value, apps_script_url: e.target.value })}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs font-mono text-slate-800 outline-none transition-colors"
              />
            </div>

            {onTestConnection && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  disabled={testing || !value.apps_script_url.trim()}
                  onClick={handleTest}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-[#1E40FF] text-xs font-semibold transition-colors cursor-pointer"
                >
                  {testing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>Kiểm tra kết nối Google Ads</span>
                </button>

                {testResult && (
                  <div
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      testResult.ok ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {testResult.ok && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{testResult.text}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
