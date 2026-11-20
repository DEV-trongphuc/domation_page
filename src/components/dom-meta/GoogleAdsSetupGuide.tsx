import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  GOOGLE_ADS_APPSCRIPT_SCOPES_JSON,
  GOOGLE_ADS_MCC_QUICK_STEPS,
  GOOGLE_ADS_SETUP_STEPS,
  type DomMetaGoogleAdsAccountItem,
  type DomMetaGoogleAdsConfig,
  type DomMetaGoogleAdsSetupMode,
} from './domMetaTypes';
import type { DomGoogleAdsMccRequestResult } from './domMetaApi';

interface GoogleAdsSetupGuideProps {
  value: DomMetaGoogleAdsConfig;
  onChange: (next: DomMetaGoogleAdsConfig) => void;
  onTestConnection?: (cfg: DomMetaGoogleAdsConfig) => Promise<{ rowsCount: number }>;
  onMccAddOrRequest?: (
    items: Array<{ customer_id: string; label?: string }>,
    note?: string
  ) => Promise<DomGoogleAdsMccRequestResult>;
  onMccResendOtp?: (customerId: string) => Promise<{
    already_connected?: boolean;
    linked: boolean;
    otp_sent_to_masked?: string;
    is_mcc_fallback?: boolean;
    google_ads: DomMetaGoogleAdsConfig;
  }>;
  onMccVerifyOtp?: (
    customerId: string,
    otpCode: string
  ) => Promise<{
    verified: boolean;
    account: DomMetaGoogleAdsAccountItem;
    google_ads: DomMetaGoogleAdsConfig;
  }>;
  onMccRemoveAccount?: (customerId: string) => Promise<{
    removed_customer_id: string;
    google_ads: DomMetaGoogleAdsConfig;
  }>;
  compact?: boolean;
  readOnly?: boolean;
}

function parseMultiCustomerIds(raw: string): { valid: string[]; invalid: string[] } {
  const tokens = raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const tok of tokens) {
    const digits = tok.replace(/\D/g, '');
    if (digits.length === 10) {
      const formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
      if (!seen.has(formatted)) {
        seen.add(formatted);
        valid.push(formatted);
      }
    } else {
      invalid.push(tok);
    }
  }
  return { valid, invalid };
}

export const GoogleAdsSetupGuide: React.FC<GoogleAdsSetupGuideProps> = ({
  value,
  onChange,
  onTestConnection,
  onMccAddOrRequest,
  onMccResendOtp,
  onMccVerifyOtp,
  onMccRemoveAccount,
  compact = false,
  readOnly = false,
}) => {
  const [copiedScopes, setCopiedScopes] = useState(false);
  const [copiedMccId, setCopiedMccId] = useState(false);
  const [showScopesJson, setShowScopesJson] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingAccountId, setTestingAccountId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  // MCC Quick Connect state
  const [rawIdsInput, setRawIdsInput] = useState('');
  const [singleLabel, setSingleLabel] = useState('');
  const [mccNote, setMccNote] = useState('');
  const [submittingMcc, setSubmittingMcc] = useState(false);
  const [mccNotice, setMccNotice] = useState<{
    tone: 'ok' | 'info' | 'err';
    text: string;
  } | null>(null);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [busyCid, setBusyCid] = useState<string | null>(null);

  const activeMode: DomMetaGoogleAdsSetupMode =
    value.setup_mode === 'custom_script'
      ? 'custom_script'
      : value.setup_mode === 'mcc_quick'
        ? 'mcc_quick'
        : value.apps_script_url?.trim()
          ? 'custom_script'
          : 'mcc_quick';

  const mccId = value.mcc_id || '113-061-8835';
  const accounts = useMemo(() => value.accounts || [], [value.accounts]);
  const connectedCount = useMemo(
    () => accounts.filter((a) => a.status === 'connected').length,
    [accounts]
  );
  const parsedInput = useMemo(() => parseMultiCustomerIds(rawIdsInput), [rawIdsInput]);

  const handleToggle = () => {
    if (readOnly) return;
    setTestResult(null);
    setMccNotice(null);
    onChange({
      ...value,
      enabled: !value.enabled,
      setup_mode: activeMode,
    });
  };

  const handleSwitchMode = (nextMode: DomMetaGoogleAdsSetupMode) => {
    if (readOnly) return;
    setTestResult(null);
    setMccNotice(null);
    onChange({
      ...value,
      setup_mode: nextMode,
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

  const handleCopyMccId = async () => {
    try {
      await navigator.clipboard.writeText(mccId);
      setCopiedMccId(true);
      setTimeout(() => setCopiedMccId(false), 2000);
    } catch {
      // Ignore clipboard denial
    }
  };

  const handleTest = async (specificCustomerId?: string) => {
    if (!onTestConnection) return;
    setTesting(true);
    setTestingAccountId(specificCustomerId || null);
    setTestResult(null);
    try {
      const cfgToTest: DomMetaGoogleAdsConfig = specificCustomerId
        ? { ...value, customer_id: specificCustomerId }
        : value;
      const res = await onTestConnection(cfgToTest);
      setTestResult({
        ok: true,
        text: `Kết nối Google Ads${specificCustomerId ? ` (${specificCustomerId})` : ''} thành công! Đã đọc được ${res.rowsCount} dòng hiệu suất chiến dịch.`,
      });
    } catch (err: unknown) {
      setTestResult({
        ok: false,
        text:
          err instanceof Error && err.message
            ? err.message
            : 'Chưa đọc được dữ liệu Google Ads. Vui lòng kiểm tra lại cấu hình.',
      });
    } finally {
      setTesting(false);
      setTestingAccountId(null);
    }
  };

  const handleMccSubmit = async () => {
    setMccNotice(null);
    if (parsedInput.invalid.length > 0) {
      setMccNotice({
        tone: 'err',
        text: `ID không đúng định dạng 10 chữ số (XXX-XXX-XXXX): ${parsedInput.invalid.join(', ')}`,
      });
      return;
    }
    if (parsedInput.valid.length === 0) {
      setMccNotice({
        tone: 'err',
        text: 'Vui lòng nhập ít nhất 1 Google Ads Customer ID (VD: 227-521-6666).',
      });
      return;
    }

    const items = parsedInput.valid.map((cid, idx) => ({
      customer_id: cid,
      label: parsedInput.valid.length === 1 && idx === 0 ? singleLabel.trim() || undefined : undefined,
    }));

    // Demo/Landing preview fallback when no live backend callback is wired
    if (!onMccAddOrRequest) {
      const nowIso = new Date().toISOString();
      const nextAccounts: DomMetaGoogleAdsAccountItem[] = [...accounts];
      for (const it of items) {
        if (!nextAccounts.some((a) => a.customer_id === it.customer_id)) {
          nextAccounts.push({
            customer_id: it.customer_id,
            label: it.label || '',
            status: 'pending_mcc',
            requested_at: nowIso,
          });
        }
      }
      onChange({
        ...value,
        enabled: true,
        setup_mode: 'mcc_quick',
        customer_id: value.customer_id || items[0].customer_id,
        accounts: nextAccounts,
      });
      setRawIdsInput('');
      setSingleLabel('');
      setMccNote('');
      setMccNotice({
        tone: 'info',
        text: `Bản xem trước: Khi đăng nhập Workspace thật, hệ thống sẽ tự gửi Email tới domation.net@gmail.com (CC: turniodev@gmail.com) để mời ${items.map((x) => x.customer_id).join(', ')} vào MCC ${mccId}, sau đó gửi mã OTP 6 số tới email chủ tài khoản Google Ads để kích hoạt.`,
      });
      return;
    }

    setSubmittingMcc(true);
    try {
      const res = await onMccAddOrRequest(items, mccNote.trim() || undefined);
      onChange(res.google_ads);
      setRawIdsInput('');
      setSingleLabel('');
      setMccNote('');

      const msgs: string[] = [];
      if (res.sent_otp_ids.length > 0) {
        const otpSummary = res.sent_otp_ids
          .map((x) => `${x.customer_id} → ${x.masked_to}`)
          .join('; ');
        msgs.push(
          `Đã gửi mã xác nhận OTP 6 số cho tài khoản đã thuộc MCC: ${otpSummary}. Vui lòng nhập mã 6 số vào dòng bên dưới để kích hoạt.`
        );
      }
      if (res.pending_mcc_ids.length > 0) {
        msgs.push(
          `Đã gửi Email yêu cầu mời liên kết MCC ${mccId} tới domation.net@gmail.com (CC: turniodev@gmail.com) cho: ${res.pending_mcc_ids.join(', ')}. Sau khi Accept lời mời trong Google Ads, bấm "Tôi đã Accept — Gửi mã OTP".`
        );
      }
      if (res.already_connected_ids.length > 0) {
        msgs.push(`Các ID đã xác thực sẵn: ${res.already_connected_ids.join(', ')}.`);
      }

      setMccNotice({
        tone: res.sent_otp_ids.length > 0 ? 'ok' : 'info',
        text: msgs.join(' '),
      });
    } catch (err: unknown) {
      setMccNotice({
        tone: 'err',
        text: err instanceof Error ? err.message : 'Không thể gửi yêu cầu liên kết MCC.',
      });
    } finally {
      setSubmittingMcc(false);
    }
  };

  const handleResendOrCheckMcc = async (cid: string) => {
    if (!onMccResendOtp) return;
    setBusyCid(cid);
    setMccNotice(null);
    try {
      const res = await onMccResendOtp(cid);
      onChange(res.google_ads);
      if (res.already_connected) {
        setMccNotice({ tone: 'ok', text: `Tài khoản ${cid} đã được xác thực và sẵn sàng sử dụng.` });
      } else {
        setMccNotice({
          tone: 'ok',
          text: `Đã xác nhận ${cid} thuộc MCC ${mccId}! Mã OTP 6 số vừa gửi tới ${res.otp_sent_to_masked || 'email chủ tài khoản Google Ads'} (hiệu lực 10 phút).`,
        });
      }
    } catch (err: unknown) {
      setMccNotice({
        tone: 'err',
        text: err instanceof Error ? err.message : 'Chưa gửi được mã xác nhận OTP.',
      });
    } finally {
      setBusyCid(null);
    }
  };

  const handleVerifyOtp = async (cid: string) => {
    if (!onMccVerifyOtp) return;
    const code = (otpInputs[cid] || '').replace(/\D/g, '').trim();
    if (code.length !== 6) {
      setMccNotice({ tone: 'err', text: 'Vui lòng nhập đủ 6 chữ số mã OTP xác nhận.' });
      return;
    }
    setBusyCid(cid);
    setMccNotice(null);
    try {
      const res = await onMccVerifyOtp(cid, code);
      onChange(res.google_ads);
      setOtpInputs((prev) => ({ ...prev, [cid]: '' }));
      setMccNotice({
        tone: 'ok',
        text: `Xác thực thành công tài khoản ${cid}${res.account.label ? ` (${res.account.label})` : ''}! Bạn có thể xem báo cáo Google Ads ngay bây giờ.`,
      });
    } catch (err: unknown) {
      setMccNotice({
        tone: 'err',
        text: err instanceof Error ? err.message : 'Mã OTP không chính xác.',
      });
    } finally {
      setBusyCid(null);
    }
  };

  const handleRemoveAccount = async (cid: string) => {
    if (!onMccRemoveAccount) {
      const next = accounts.filter((a) => a.customer_id !== cid);
      onChange({
        ...value,
        accounts: next,
        customer_id: value.customer_id === cid ? next[0]?.customer_id || '' : value.customer_id,
      });
      return;
    }
    setBusyCid(cid);
    setMccNotice(null);
    try {
      const res = await onMccRemoveAccount(cid);
      onChange(res.google_ads);
      setMccNotice({ tone: 'info', text: `Đã gỡ Google Ads ID ${cid} khỏi Workspace.` });
    } catch (err: unknown) {
      setMccNotice({
        tone: 'err',
        text: err instanceof Error ? err.message : 'Không thể gỡ Google Ads ID.',
      });
    } finally {
      setBusyCid(null);
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
              {value.enabled && activeMode === 'mcc_quick' && connectedCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#1E40FF] border border-blue-200/80">
                  {connectedCount} TK đã xác thực
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {value.enabled
                ? 'Hỗ trợ 2 cách kết nối: Thiết lập nhanh 1 phút qua MCC DOMATION (gắn nhiều Google Ads ID + xác thực OTP chủ tài khoản) hoặc tự cấu hình Apps Script riêng.'
                : 'Chỉ chạy Meta Ads? Giao diện được giữ tinh gọn hoàn toàn cho Meta Ads. Khi cần theo dõi thêm Google Ads, hãy gạt nút bên phải để kết nối.'}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={value.enabled}
            disabled={readOnly}
            data-testid="google-ads-toggle"
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer disabled:opacity-50 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
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

      {value.enabled && (
        <div className="space-y-4">
          {/* 2-Mode Setup Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={readOnly}
              data-testid="google-ads-mode-mcc"
              onClick={() => handleSwitchMode('mcc_quick')}
              className={`rounded-2xl border p-3.5 text-left transition-all cursor-pointer flex items-start gap-3 ${
                activeMode === 'mcc_quick'
                  ? 'bg-[#F4F8FF] border-[#1E40FF] shadow-xs ring-1 ring-[#1E40FF]/15'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  activeMode === 'mcc_quick'
                    ? 'bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    Thiết lập nhanh qua MCC DOMATION
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    Khuyên dùng
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Không cần tạo Sheet hay Apps Script. Chỉ gửi Google Ads ID (hỗ trợ nhiều ID) → Accept lời mời MCC → nhập OTP chủ tài khoản là dùng ngay.
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled={readOnly}
              data-testid="google-ads-mode-custom"
              onClick={() => handleSwitchMode('custom_script')}
              className={`rounded-2xl border p-3.5 text-left transition-all cursor-pointer flex items-start gap-3 ${
                activeMode === 'custom_script'
                  ? 'bg-[#F4F8FF] border-[#1E40FF] shadow-xs ring-1 ring-[#1E40FF]/15'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  activeMode === 'custom_script'
                    ? 'bg-gradient-to-br from-[#1E40FF] to-[#0284C7] text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Wrench className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    Tự cấu hình Apps Script riêng
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                    5 bước nâng cao
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Dành cho doanh nghiệp chạy MCC nội bộ độc lập, tự deploy Google Apps Script Web App &amp; Developer Token riêng.
                </p>
              </div>
            </button>
          </div>

          {/* ============================================================== */}
          {/* MODE 1: QUICK CONNECT VIA SHARED DOMATION MCC + ZERO-TRUST OTP */}
          {/* ============================================================== */}
          {activeMode === 'mcc_quick' && (
            <div className="space-y-4">
              {/* 3-Step Guide Banner */}
              <div className="rounded-2xl bg-[#F4F8FF]/90 border border-blue-200/80 p-4 sm:p-5 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1E40FF]">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Kết Nối Nhanh Đa Tài Khoản Chung MCC — Xác Thực OTP Chủ Tài Khoản</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyMccId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-blue-200 text-[11px] font-mono font-semibold text-slate-700 hover:border-[#1E40FF] cursor-pointer"
                  >
                    <span>MCC DOMATION: {mccId}</span>
                    {copiedMccId ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-[#1E40FF]" />
                    )}
                  </button>
                </div>

                <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-2.5`}>
                  {GOOGLE_ADS_MCC_QUICK_STEPS.map((s) => (
                    <div
                      key={s.step}
                      className="rounded-xl bg-white border border-blue-100/90 p-3 flex items-start gap-2.5"
                    >
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200/80 text-[11px] font-mono font-semibold text-[#1E40FF] shrink-0">
                        {s.step}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800">{s.title}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          {s.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add 1 or Multiple Google Ads IDs Form */}
              <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      Thêm Google Ads Customer ID (Hỗ trợ nhiều ID trong cùng 1 Workspace)
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Nhập 1 ID (VD: <code>227-521-6666</code>) hoặc dán nhiều ID cách nhau bằng dấu phẩy / xuống dòng.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className={parsedInput.valid.length <= 1 ? 'sm:col-span-7' : 'sm:col-span-12'}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Google Ads Customer ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={readOnly || submittingMcc}
                      data-testid="google-ads-mcc-ids-input"
                      value={rawIdsInput}
                      onChange={(e) => setRawIdsInput(e.target.value)}
                      placeholder="VD: 227-521-6666 hoặc 227-521-6666, 295-339-0933"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs font-mono font-medium text-slate-800 outline-none transition-colors"
                    />
                  </div>

                  {parsedInput.valid.length <= 1 && (
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tên gợi nhớ <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                      </label>
                      <input
                        type="text"
                        disabled={readOnly || submittingMcc}
                        value={singleLabel}
                        onChange={(e) => setSingleLabel(e.target.value)}
                        placeholder="VD: IDEAS MBA, EcoLife Search..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs text-slate-800 outline-none transition-colors"
                      />
                    </div>
                  )}
                </div>

                {parsedInput.valid.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-500">Nhận diện:</span>
                    {parsedInput.valid.map((cid) => (
                      <span
                        key={cid}
                        className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-[11px] font-mono font-semibold"
                      >
                        {cid}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                  <input
                    type="text"
                    disabled={readOnly || submittingMcc}
                    value={mccNote}
                    onChange={(e) => setMccNote(e.target.value)}
                    placeholder="Ghi chú gửi kèm quản trị MCC (tùy chọn, VD: tài khoản mới của phòng Marketing)..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2 text-xs text-slate-700 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    disabled={readOnly || submittingMcc || parsedInput.valid.length === 0}
                    data-testid="google-ads-mcc-submit"
                    onClick={() => void handleMccSubmit()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {submittingMcc ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Thêm ID &amp; Gửi yêu cầu / OTP</span>
                  </button>
                </div>

                {mccNotice && (
                  <div
                    data-testid="google-ads-mcc-notice"
                    className={`rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed flex items-start gap-2 ${
                      mccNotice.tone === 'ok'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : mccNotice.tone === 'err'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}
                  >
                    {mccNotice.tone === 'ok' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    ) : (
                      <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{mccNotice.text}</span>
                  </div>
                )}
              </div>

              {/* Linked & Pending Google Ads IDs List */}
              <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    Danh sách Google Ads ID của Workspace ({accounts.length})
                  </div>
                  {connectedCount > 1 && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Hỗ trợ xem từng ID hoặc Gộp cả {connectedCount} tài khoản
                    </span>
                  )}
                </div>

                {accounts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-center space-y-1">
                    <div className="text-xs font-semibold text-slate-700">
                      Chưa có Google Ads ID nào được thêm
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Nhập mã 10 chữ số Google Ads ở ô phía trên để gửi yêu cầu mời MCC &amp; nhận mã OTP xác thực chủ tài khoản.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {accounts.map((acc) => {
                      const isPrimary = value.customer_id === acc.customer_id;
                      const isBusy = busyCid === acc.customer_id;
                      return (
                        <div
                          key={acc.customer_id}
                          data-testid={`google-ads-account-row-${acc.customer_id}`}
                          className={`rounded-xl border p-3.5 space-y-2.5 transition-colors ${
                            acc.status === 'connected'
                              ? 'bg-emerald-50/30 border-emerald-200/80'
                              : acc.status === 'pending_otp'
                                ? 'bg-blue-50/40 border-blue-200/90'
                                : 'bg-amber-50/35 border-amber-200/80'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">
                                {acc.customer_id}
                              </span>
                              {acc.label && (
                                <span className="text-xs font-semibold text-slate-700 truncate max-w-[220px]">
                                  · {acc.label}
                                </span>
                              )}
                              {acc.status === 'connected' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10.5px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Đã xác thực</span>
                                </span>
                              )}
                              {acc.status === 'pending_otp' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-[#1E40FF] text-[10.5px] font-bold">
                                  <KeyRound className="w-3 h-3" />
                                  <span>Chờ nhập mã OTP 6 số</span>
                                </span>
                              )}
                              {acc.status === 'pending_mcc' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10.5px] font-bold">
                                  <Clock className="w-3 h-3" />
                                  <span>Chờ Accept lời mời MCC</span>
                                </span>
                              )}
                              {isPrimary && acc.status === 'connected' && (
                                <span className="px-2 py-0.5 rounded-full bg-white border border-blue-200 text-[#1E40FF] text-[10px] font-bold">
                                  Mặc định
                                </span>
                              )}
                            </div>

                            {!readOnly && (
                              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                {acc.status === 'connected' && !isPrimary && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onChange({ ...value, customer_id: acc.customer_id })
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#1E40FF] text-[11px] font-semibold text-slate-700 hover:text-[#1E40FF] cursor-pointer"
                                  >
                                    Đặt mặc định
                                  </button>
                                )}
                                {acc.status === 'connected' && onTestConnection && (
                                  <button
                                    type="button"
                                    disabled={testing}
                                    onClick={() => void handleTest(acc.customer_id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E40FF] text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                                  >
                                    {testing && testingAccountId === acc.customer_id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Play className="w-3 h-3" />
                                    )}
                                    <span>Kiểm tra</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  title="Gỡ tài khoản này"
                                  onClick={() => void handleRemoveAccount(acc.customer_id)}
                                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-rose-300 hover:text-rose-600 text-slate-500 cursor-pointer disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Inline Action Row for pending_mcc */}
                          {acc.status === 'pending_mcc' && !readOnly && (
                            <div className="pt-2 border-t border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="text-[11px] text-amber-900 leading-relaxed">
                                Yêu cầu mời đã gửi tới MCC <strong>{mccId}</strong>. Sau khi bạn bấm <strong>Chấp nhận (Accept)</strong> lời mời trong Google Ads, bấm nút bên cạnh để nhận mã OTP 6 số xác thực chủ tài khoản.
                              </span>
                              {onMccResendOtp && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  data-testid={`google-ads-mcc-check-${acc.customer_id}`}
                                  onClick={() => void handleResendOrCheckMcc(acc.customer_id)}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                                >
                                  {isBusy ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-3 h-3" />
                                  )}
                                  <span>Tôi đã Accept — Gửi mã OTP</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Inline OTP Verification Box for pending_otp */}
                          {acc.status === 'pending_otp' && !readOnly && (
                            <div className="pt-2 border-t border-blue-200/70 space-y-2">
                              <div className="text-[11px] text-slate-700 leading-relaxed">
                                Mã xác nhận 6 số đã được gửi tới:{' '}
                                <strong className="font-mono text-[#1E40FF]">
                                  {acc.otp_sent_to_masked || 'email quản trị viên Google Ads'}
                                </strong>{' '}
                                (hiệu lực 10 phút).
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={6}
                                  disabled={isBusy}
                                  data-testid={`google-ads-otp-input-${acc.customer_id}`}
                                  value={otpInputs[acc.customer_id] || ''}
                                  onChange={(e) =>
                                    setOtpInputs((prev) => ({
                                      ...prev,
                                      [acc.customer_id]: e.target.value.replace(/\D/g, '').slice(0, 6),
                                    }))
                                  }
                                  placeholder="Nhập 6 số OTP"
                                  className="w-36 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-mono font-bold tracking-[0.2em] text-center text-slate-900 outline-none focus:border-[#1E40FF]"
                                />
                                {onMccVerifyOtp && (
                                  <button
                                    type="button"
                                    disabled={isBusy || (otpInputs[acc.customer_id] || '').length !== 6}
                                    data-testid={`google-ads-otp-verify-${acc.customer_id}`}
                                    onClick={() => void handleVerifyOtp(acc.customer_id)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1E40FF] hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-bold cursor-pointer"
                                  >
                                    {isBusy ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                    )}
                                    <span>Xác nhận &amp; Kích hoạt</span>
                                  </button>
                                )}
                                {onMccResendOtp && (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => void handleResendOrCheckMcc(acc.customer_id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 text-[11px] font-semibold text-slate-600 cursor-pointer disabled:opacity-50"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Gửi lại mã</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {testResult && (
                  <div
                    className={`flex items-center gap-1.5 text-xs font-semibold pt-1 ${
                      testResult.ok ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {testResult.ok && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{testResult.text}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE 2: ADVANCED 5-STEP SELF-HOSTED APPS SCRIPT & SHEETS       */}
          {/* ============================================================== */}
          {activeMode === 'custom_script' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#F4F8FF]/90 border border-blue-200/80 p-4 sm:p-5 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1E40FF]">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Hướng Dẫn 5 Bước Tự Kết Nối Google Ads Qua Apps Script Riêng</span>
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
                        <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          {s.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

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

              <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Google Ads Customer ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={value.customer_id}
                      onChange={(e) => onChange({ ...value, customer_id: e.target.value })}
                      placeholder="VD: 295-339-0933"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs font-mono font-medium text-slate-800 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Developer Token{' '}
                      <span className="text-slate-400 font-normal">(Tùy chọn Direct API)</span>
                    </label>
                    <input
                      type="password"
                      disabled={readOnly}
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
                    disabled={readOnly}
                    value={value.apps_script_url}
                    onChange={(e) => onChange({ ...value, apps_script_url: e.target.value })}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs font-mono text-slate-800 outline-none transition-colors"
                  />
                </div>

                {onTestConnection && !readOnly && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      disabled={testing || !value.apps_script_url.trim()}
                      onClick={() => void handleTest()}
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
      )}
    </div>
  );
};
