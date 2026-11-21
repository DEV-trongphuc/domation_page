import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import type {
  DomMetaQuickConnectStatus,
  DomMetaWorkspaceConfig,
} from './domMetaTypes';
import {
  discoverMetaAccountsFromToken,
  fetchDomMetaQuickConnectStatus,
  quickConnectDomMeta,
  type DomMetaAuthContext,
} from './domMetaApi';
import { DOM_META_MODAL_BASE_Z, DomMetaModalPortal } from './DomMetaModals';
import { ZaloSpecialistBanner } from '../common/ZaloSpecialistBanner';

export interface DomMetaQuickConnectModalProps {
  open: boolean;
  authContext: DomMetaAuthContext;
  initialStatus?: DomMetaQuickConnectStatus | null;
  onConnected: (result: {
    status: DomMetaQuickConnectStatus;
    config: DomMetaWorkspaceConfig;
    mode: 'auto_reuse' | 'token_connect';
  }) => void;
  onClose: () => void;
}

interface DiscoveredAccountOption {
  ad_account_id: string;
  name: string;
  currency: string;
  business_name?: string | null;
  default_pixel_id?: string;
}

export const DomMetaQuickConnectModal: React.FC<DomMetaQuickConnectModalProps> = ({
  open,
  authContext,
  initialStatus,
  onConnected,
  onClose,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [status, setStatus] = useState<DomMetaQuickConnectStatus | null>(initialStatus || null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [accessToken, setAccessToken] = useState('');
  const [manualAccountId, setManualAccountId] = useState('');
  const [pixelId, setPixelId] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredAccountOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [primaryId, setPrimaryId] = useState('');
  const [accountQuery, setAccountQuery] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchDomMetaQuickConnectStatus(authContext)
      .then((st) => {
        if (!cancelled) {
          setStatus(st);
          setLoadingStatus(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadingStatus(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, authContext]);

  const effectiveStatus = status || initialStatus || null;

  const filteredDiscovered = useMemo(() => {
    const q = accountQuery.trim().toLowerCase();
    if (!q) return discovered;
    return discovered.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.ad_account_id.includes(q) ||
        (a.business_name || '').toLowerCase().includes(q)
    );
  }, [discovered, accountQuery]);

  const checkedAccounts = useMemo(
    () => discovered.filter((a) => Boolean(selectedIds[a.ad_account_id])),
    [discovered, selectedIds]
  );

  if (!open) return null;

  const handleInstantAutoReuse = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await quickConnectDomMeta(authContext, {
        auto_reuse: true,
        pixel_id: pixelId.trim() || undefined,
      });
      onConnected({ status: res.status, config: res.config, mode: res.mode });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error && err.message
          ? err.message
          : 'Không thể kích hoạt tự động từ tài khoản sẵn có.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscoverStep1 = async () => {
    const cleanTok = accessToken.trim();
    if (!cleanTok || cleanTok.length < 15) {
      setErrorMsg('Vui lòng dán mã kết nối Meta (bắt đầu bằng EAA...).');
      return;
    }
    setErrorMsg(null);
    setDiscovering(true);
    try {
      const list = await discoverMetaAccountsFromToken(authContext, cleanTok);
      if (list.length === 0) {
        if (manualAccountId.trim()) {
          const cleanManual = manualAccountId.trim().replace(/^act_/i, '');
          const manualItem: DiscoveredAccountOption = {
            ad_account_id: cleanManual,
            name: `TK Quảng Cáo #${cleanManual.slice(-6)}`,
            currency: 'VND',
          };
          setDiscovered([manualItem]);
          setSelectedIds({ [cleanManual]: true });
          setPrimaryId(cleanManual);
          setStep(2);
        } else {
          setErrorMsg(
            'Chưa tìm thấy tài khoản quảng cáo từ mã này. Bạn có thể nhập trực tiếp Mã tài khoản quảng cáo ở ô bên dưới.'
          );
        }
        return;
      }

      const nextSelected: Record<string, boolean> = {};
      list.slice(0, 10).forEach((item) => {
        nextSelected[item.ad_account_id] = true;
      });
      setDiscovered(list);
      setSelectedIds(nextSelected);
      setPrimaryId(list[0]?.ad_account_id || '');
      setStep(2);
    } catch (err: unknown) {
      if (manualAccountId.trim()) {
        const cleanManual = manualAccountId.trim().replace(/^act_/i, '');
        const manualItem: DiscoveredAccountOption = {
          ad_account_id: cleanManual,
          name: `TK Quảng Cáo #${cleanManual.slice(-6)}`,
          currency: 'VND',
        };
        setDiscovered([manualItem]);
        setSelectedIds({ [cleanManual]: true });
        setPrimaryId(cleanManual);
        setStep(2);
      } else {
        setErrorMsg(
          err instanceof Error && err.message
            ? err.message
            : 'Không thể tải danh sách tài khoản quảng cáo. Vui lòng kiểm tra lại mã kết nối.'
        );
      }
    } finally {
      setDiscovering(false);
    }
  };

  const handleActivateStep2 = async () => {
    if (checkedAccounts.length === 0) {
      setErrorMsg('Vui lòng tích chọn ít nhất 1 tài khoản quảng cáo để theo dõi.');
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const effectivePrimary =
        primaryId && selectedIds[primaryId]
          ? primaryId
          : checkedAccounts[0]?.ad_account_id || '';
      const res = await quickConnectDomMeta(authContext, {
        access_token: accessToken.trim(),
        accounts: checkedAccounts.map((a) => ({
          ad_account_id: a.ad_account_id,
          name: a.name,
          pixel_id: pixelId.trim() || a.default_pixel_id || undefined,
        })),
        pixel_id: pixelId.trim() || checkedAccounts[0]?.default_pixel_id || undefined,
        primary_ad_account_id: effectivePrimary,
      });
      onConnected({ status: res.status, config: res.config, mode: res.mode });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error && err.message
          ? err.message
          : 'Không thể kích hoạt kết nối tài khoản quảng cáo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DomMetaModalPortal onClose={onClose} overlayId="dom-meta-quick-connect-modal">
      <div
        role="dialog"
        aria-modal="true"
        data-testid="dom-meta-quick-connect-modal"
        onClick={onClose}
        style={{ zIndex: DOM_META_MODAL_BASE_Z }}
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-0 sm:p-6 flex items-end sm:items-center justify-center dom-ios-backdrop"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] bg-white rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 dom-ios-modal-responsive"
        >
          <div className="sm:hidden dom-sheet-grabber" />
          {/* Header */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-[#F4F8FF] via-white to-[#F0FDFA] border-b border-slate-200 flex items-center justify-between gap-2.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white flex items-center justify-center shadow-sm shrink-0">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-wider text-[#1E40FF]">
                    Kết nối nhanh 2 bước
                  </span>
                  <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                    Đồng bộ 2 chiều với CRM
                  </span>
                </div>
                <h3 className="text-xs sm:text-base font-semibold text-slate-900 truncate mt-0.5">
                  Kết Nối Tài Khoản Quảng Cáo Meta
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2 sm:gap-3 text-xs">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`inline-flex items-center gap-1.5 sm:gap-2 font-semibold cursor-pointer min-w-0 ${
                step === 1 ? 'text-[#1E40FF]' : 'text-emerald-700'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  step === 1
                    ? 'bg-[#1E40FF] text-white'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {step > 1 ? <Check className="w-3 h-3" /> : '1'}
              </span>
              <span className="truncate sm:hidden">B1: Dán mã Meta</span>
              <span className="hidden sm:inline">Bước 1: Dán mã kết nối Meta</span>
            </button>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span
              className={`inline-flex items-center gap-1.5 sm:gap-2 font-semibold min-w-0 ${
                step === 2 ? 'text-[#1E40FF]' : 'text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  step === 2 ? 'bg-[#1E40FF] text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                2
              </span>
              <span className="truncate sm:hidden">B2: Chọn TK QC</span>
              <span className="hidden sm:inline">Bước 2: Chọn tài khoản quảng cáo</span>
            </span>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <ZaloSpecialistBanner context="setup" variant="compact" />
            {loadingStatus && (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center gap-2 text-xs text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin text-[#1E40FF]" />
                <span>Đang kiểm tra kết nối Meta sẵn có trong hệ thống...</span>
              </div>
            )}

            {/* 1-Click Auto-Reuse Banner if Meta Token already exists in CRM / CAPI */}
            {effectiveStatus?.has_meta_token && effectiveStatus.accounts.length > 0 && step === 1 && (
              <div
                data-testid="quick-connect-auto-reuse-banner"
                className="rounded-2xl bg-gradient-to-r from-emerald-50/90 via-[#F4F8FF] to-white border border-emerald-200 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Phát hiện {effectiveStatus.accounts.length} tài khoản quảng cáo Meta đã kết nối sẵn!
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tài khoản{' '}
                      <strong className="text-slate-800">
                        {effectiveStatus.primary_account_name ||
                          effectiveStatus.accounts[0]?.name}
                      </strong>{' '}
                      đã sẵn sàng. Bạn có thể kích hoạt ngay mà không cần nhập lại mã kết nối.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={submitting}
                    data-testid="quick-connect-reuse-btn"
                    onClick={() => void handleInstantAutoReuse()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {effectiveStatus.dom_meta_connected
                        ? 'Đồng bộ lại từ kết nối sẵn có'
                        : 'Kích hoạt 1 chạm ngay (không cần nhập lại mã)'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-700">
                {errorMsg}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#1E40FF]" />
                      <span>Mã kết nối Meta (Access Token)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowGuide((v) => !v)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#1E40FF] hover:underline cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showGuide ? 'Ẩn hướng dẫn lấy mã' : 'Hướng dẫn lấy mã trong 30 giây'}</span>
                    </button>
                  </div>

                  {showGuide && (
                    <div className="rounded-2xl bg-[#F4F8FF] border border-blue-200/80 p-3.5 text-xs text-slate-700 space-y-1.5">
                      <div className="font-semibold text-slate-800">
                        3 bước lấy mã kết nối từ Meta Business:
                      </div>
                      <ol className="list-decimal pl-4 space-y-1 text-[11.5px] text-slate-600">
                        <li>
                          Mở <strong>Meta Business Settings → Người dùng hệ thống</strong> (hoặc công cụ Graph API Explorer của Meta).
                        </li>
                        <li>
                          Chọn ứng dụng của doanh nghiệp và bật quyền đọc báo cáo quảng cáo (<code>ads_read</code>, <code>read_insights</code>).
                        </li>
                        <li>
                          Sao chép chuỗi mã bắt đầu bằng <code>EAA...</code> và dán vào ô bên dưới.
                        </li>
                      </ol>
                      <a
                        href="https://developers.facebook.com/tools/explorer/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#1E40FF] hover:underline pt-0.5"
                      >
                        <span>Mở trang cấp mã chính thức của Meta</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  <textarea
                    rows={3}
                    data-testid="quick-connect-token-input"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Dán chuỗi mã bắt đầu bằng EAA... vào đây"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] px-3.5 py-2.5 text-xs font-mono text-slate-800 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11.5px] font-medium text-slate-600">
                      Mã TK Quảng cáo cụ thể (tùy chọn nếu tự quét)
                    </label>
                    <input
                      type="text"
                      value={manualAccountId}
                      onChange={(e) => setManualAccountId(e.target.value)}
                      placeholder="VD: 302787476028580"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] px-3 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11.5px] font-medium text-slate-600">
                      Mã Meta Pixel đồng bộ CAPI (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={pixelId}
                      onChange={(e) => setPixelId(e.target.value)}
                      placeholder="VD: 112233445566778"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] px-3 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800">
                    Tìm thấy {discovered.length} tài khoản quảng cáo · Đã chọn{' '}
                    <span className="text-[#1E40FF]">{checkedAccounts.length}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const all: Record<string, boolean> = {};
                        filteredDiscovered.forEach((a) => {
                          all[a.ad_account_id] = true;
                        });
                        setSelectedIds((prev) => ({ ...prev, ...all }));
                      }}
                      className="text-[#1E40FF] font-semibold hover:underline cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedIds({})}
                      className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                {discovered.length > 4 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={accountQuery}
                      onChange={(e) => setAccountQuery(e.target.value)}
                      placeholder="Tìm theo tên hoặc ID tài khoản quảng cáo..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] text-xs outline-none"
                    />
                  </div>
                )}

                <div className="max-h-[260px] overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
                  {filteredDiscovered.map((acc) => {
                    const checked = Boolean(selectedIds[acc.ad_account_id]);
                    const isPrimary = primaryId === acc.ad_account_id;
                    return (
                      <div
                        key={acc.ad_account_id}
                        onClick={() => {
                          setSelectedIds((prev) => {
                            const nextVal = !prev[acc.ad_account_id];
                            if (nextVal && !primaryId) setPrimaryId(acc.ad_account_id);
                            return { ...prev, [acc.ad_account_id]: nextVal };
                          });
                        }}
                        className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          checked ? 'bg-[#F4F8FF]/70' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="accent-[#1E40FF] w-4 h-4 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate">
                              {acc.name}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              ID: {acc.ad_account_id} · {acc.currency}
                              {acc.business_name ? ` · ${acc.business_name}` : ''}
                            </div>
                          </div>
                        </div>

                        {checked && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrimaryId(acc.ad_account_id);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold shrink-0 cursor-pointer ${
                              isPrimary
                                ? 'bg-[#1E40FF] text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                            }`}
                          >
                            {isPrimary ? 'Mặc định' : 'Đặt mặc định'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer: Strictly 2 buttons horizontally on mobile */}
          <div className="px-4 sm:px-6 pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] sm:py-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 sm:flex items-center justify-between gap-2.5 shrink-0">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3.5 py-2.5 sm:py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer text-center"
              >
                ← Quay lại
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 sm:py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer text-center"
              >
                Đóng
              </button>
            )}

            {step === 1 ? (
              <button
                type="button"
                disabled={discovering}
                data-testid="quick-connect-discover-btn"
                onClick={() => void handleDiscoverStep1()}
                className="px-3.5 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:opacity-95 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
              >
                {discovering ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="truncate">Tải TK Quảng cáo →</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || checkedAccounts.length === 0}
                data-testid="quick-connect-activate-btn"
                onClick={() => void handleActivateStep2()}
                className="px-3.5 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:opacity-95 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="truncate">Kích hoạt ngay</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </DomMetaModalPortal>
  );
};

export interface DomMetaQuickConnectButtonProps {
  authContext: DomMetaAuthContext;
  canManageConfig?: boolean;
  autoActivate?: boolean;
  compact?: boolean;
  onConnected?: (result: {
    status: DomMetaQuickConnectStatus;
    config: DomMetaWorkspaceConfig;
    mode: 'auto_reuse' | 'token_connect';
  }) => void;
  onOpenReport?: () => void;
}

export const DomMetaQuickConnectButton: React.FC<DomMetaQuickConnectButtonProps> = ({
  authContext,
  canManageConfig = true,
  autoActivate = true,
  compact = false,
  onConnected,
  onOpenReport,
}) => {
  const [status, setStatus] = useState<DomMetaQuickConnectStatus | null>(null);
  const [autoActivating, setAutoActivating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const autoTriedRef = useRef(false);
  const onConnectedRef = useRef(onConnected);

  useEffect(() => {
    onConnectedRef.current = onConnected;
  });

  useEffect(() => {
    if (!authContext.accessToken && !authContext.previewQuickConnectStatus && !authContext.directAdAccountId) {
      return;
    }
    let cancelled = false;
    fetchDomMetaQuickConnectStatus(authContext)
      .then(async (st) => {
        if (cancelled) return;
        setStatus(st);
        if (
          st.can_auto_connect &&
          !st.dom_meta_connected &&
          autoActivate &&
          canManageConfig &&
          !autoTriedRef.current
        ) {
          autoTriedRef.current = true;
          setAutoActivating(true);
          try {
            const res = await quickConnectDomMeta(authContext, { auto_reuse: true });
            if (!cancelled) {
              setStatus(res.status);
              onConnectedRef.current?.({
                status: res.status,
                config: res.config,
                mode: res.mode,
              });
            }
          } catch {
            // Viewer or non-admin role may not have manage_config; keep status gracefully
          } finally {
            if (!cancelled) setAutoActivating(false);
          }
        }
      })
      .catch(() => {
        // Ignore non-blocking status check failure
      });
    return () => {
      cancelled = true;
    };
  }, [
    authContext,
    autoActivate,
    canManageConfig,
  ]);

  const isConnected = Boolean(status?.dom_meta_connected || (status?.has_meta_token && (status?.active_accounts || 0) > 0));

  return (
    <>
      <div className="inline-flex items-center gap-2 flex-wrap">
        <button
          type="button"
          data-testid="dom-meta-quick-connect-trigger"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition-all cursor-pointer ${
            compact ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
          } ${
            isConnected
              ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-800'
              : 'bg-gradient-to-r from-[#1E40FF] to-[#0284C7] text-white border-transparent shadow-sm hover:opacity-95'
          }`}
        >
          {autoActivating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isConnected ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <Zap className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>
            {autoActivating
              ? 'Đang tự động liên kết Meta...'
              : isConnected
                ? `Meta Ads: ${status?.primary_account_name || `${status?.active_accounts || 1} TK đang chạy`}`
                : 'Kết nối nhanh Meta Ads'}
          </span>
        </button>

        {isConnected && onOpenReport && (
          <button
            type="button"
            onClick={onOpenReport}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F4F8FF] hover:bg-blue-100/70 border border-blue-200 text-xs font-semibold text-[#1E40FF] cursor-pointer"
          >
            <span>Mở Báo cáo Quảng cáo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <DomMetaQuickConnectModal
        open={modalOpen}
        authContext={authContext}
        initialStatus={status}
        onConnected={(res) => {
          setStatus(res.status);
          onConnected?.(res);
        }}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};
