import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Cookie, FileText, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import {
  COOKIE_CONSENT_STORAGE_KEY,
  type CookieConsentPreferences,
  type LegalDocTab,
} from './autodataTypes';

interface AutoDataLegalModalProps {
  open: boolean;
  activeTab: LegalDocTab;
  onTabChange: (tab: LegalDocTab) => void;
  onClose: () => void;
}

export function AutoDataLegalModal({
  open,
  activeTab,
  onTabChange,
  onClose,
}: AutoDataLegalModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activeTab === 'terms' ? 'Điều khoản sử dụng DOMATION Auto Data' : 'Chính sách bảo mật DOMATION Auto Data'}
      onClick={onClose}
      className="fixed inset-0 z-[165] bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
      >
        <div className="px-4 sm:px-7 py-3.5 sm:py-4 bg-gradient-to-r from-blue-50/70 via-white to-cyan-50/60 border-b border-blue-100 flex items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => onTabChange('terms')}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'terms'
                  ? 'ql-pill-tab-active rounded-full'
                  : 'ql-pill-tab'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Điều khoản sử dụng</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('privacy')}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'privacy'
                  ? 'ql-pill-tab-active rounded-full'
                  : 'ql-pill-tab'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Chính sách bảo mật</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng tài liệu pháp lý"
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-7 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {activeTab === 'terms' ? (
            <>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  CẬP NHẬT HIỆU LỰC • NĂM 2026
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-950 mt-1">
                  Điều khoản sử dụng nền tảng DOMATION Auto Data (/data)
                </h3>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">1. Phạm vi dịch vụ DOMATION Auto Data</h4>
                <p>
                  DOMATION Auto Data là nền tảng chuyên biệt cho đội ngũ Sale và tự động phân bổ dữ liệu khách hàng đa kênh (REST API / Webhook, Facebook Lead Ads, TikTok, Google Sheets, ZaloBot, Meta CAPI). Khi doanh nghiệp phát sinh nhu cầu mở rộng, tài khoản có thể nâng cấp liền mạch lên Marketing Automation (/automation), Full CRM 360° (/crm) hoặc Enterprise ERP 5.0 (/erp).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">2. Quyền sở hữu độc lập dữ liệu của Doanh nghiệp (Tenant)</h4>
                <p>
                  Toàn bộ danh sách khách hàng tiềm năng (Leads), dữ liệu cá nhân do nhân viên Sale tự nhập/import tại Cổng Sale Cá Nhân và lịch sử tương tác thuộc quyền sở hữu 100% của Doanh nghiệp đăng ký Workspace. Mỗi tổ chức được cô lập dữ liệu độc lập theo mã định danh (Tenant Isolation).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">3. Chính sách Dùng thử 1 Tháng 0đ, Gia hạn &amp; Ví Topup</h4>
                <p>
                  Mọi tổ chức khởi tạo mới được cấp 01 tháng (30 ngày) dùng thử miễn phí đầy đủ tính năng. Sau thời gian dùng thử, doanh nghiệp tự chủ lựa chọn gia hạn gói tiêu chuẩn từ 1.500.000₫/tháng (ưu đãi giảm 15% khi thanh toán theo năm còn 1.275.000₫/tháng — 15.300.000₫/năm). Các giao dịch gia hạn sớm đều được cộng dồn trọn vẹn số ngày còn lại.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">4. Trách nhiệm sử dụng hợp pháp kênh thông báo</h4>
                <p>
                  Khách hàng cam kết chỉ thu thập và xử lý dữ liệu từ các nguồn quảng cáo, biểu mẫu đăng ký hợp pháp của mình; không sử dụng cổng Webhook hoặc Zalo Bot để phát tán tin nhắn rác trái quy định pháp luật Việt Nam.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  TUÂN THỦ NGHỊ ĐỊNH 13/2023/NĐ-CP VỀ BẢO VỆ DỮ LIỆU CÁ NHÂN
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-950 mt-1">
                  Chính sách bảo mật thông tin &amp; Cookie trên DOMATION Auto Data
                </h3>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">1. Cơ chế bảo vệ dữ liệu SĐT &amp; Phân quyền Sale</h4>
                <p>
                  Mặc định hệ thống phân phối dữ liệu trực tiếp cho nhân viên Sale nội bộ được ủy quyền của doanh nghiệp. Khi doanh nghiệp bật tùy chọn chia sẻ cho Đại lý liên kết / Cộng tác viên F1 bên ngoài, hệ thống hỗ trợ che giấu SĐT tự động dạng 0912***678 ngay từ tầng bảo mật. Dữ liệu Lead cá nhân tại Cổng Sale được tách biệt khỏi vòng chia chung.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">2. Băm ẩn danh SHA-256 khi đồng bộ Meta Conversion API</h4>
                <p>
                  Khi kích hoạt tính năng phản hồi sự kiện khách chất lượng về Meta Dataset (CAPI v21.0), số điện thoại và email đều được chuẩn hóa và băm một chiều theo chuẩn mật mã SHA-256 trước khi truyền tải qua kết nối HTTPS mã hóa.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">3. Cam kết Không chia sẻ chéo &amp; Không thương mại hóa dữ liệu</h4>
                <p>
                  DOMATION tuyệt đối không bán, không cho thuê và không khai thác chéo dữ liệu khách hàng của bất kỳ doanh nghiệp nào dưới mọi hình thức. Quản trị viên doanh nghiệp có toàn quyền xuất CSV hoặc yêu cầu xóa vĩnh viễn dữ liệu bất cứ lúc nào.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">4. Sử dụng Cookie &amp; Bộ nhớ cục bộ (Local Storage)</h4>
                <p>
                  Trang /data sử dụng Cookie/Local Storage thiết yếu để duy trì phiên đăng nhập an toàn vào Workspace của bạn và ghi nhớ lựa chọn quyền riêng tư. Các Cookie phân tích hiệu năng và đối soát chiến dịch chỉ hoạt động khi có sự đồng ý của bạn.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="px-4 sm:px-7 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            CÔNG TY TNHH DOM MARKETING
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-inkica-primary rounded-full px-4 sm:px-5 py-2 text-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            Đóng tài liệu
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function readStoredCookieConsent(): CookieConsentPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentPreferences;
    if (parsed && parsed.essential === true && typeof parsed.updated_at === 'string') {
      return parsed;
    }
  } catch {
    // Ignore corrupted storage
  }
  return null;
}

interface AutoDataCookieConsentProps {
  hidden?: boolean;
  forceOpenCounter?: number;
  onOpenLegal: (tab: LegalDocTab) => void;
}

export function AutoDataCookieConsent({
  hidden = false,
  forceOpenCounter = 0,
  onOpenLegal,
}: AutoDataCookieConsentProps) {
  const [savedConsent, setSavedConsent] = useState<CookieConsentPreferences | null>(() =>
    readStoredCookieConsent()
  );
  const [DismissedForForceCount, setDismissedForForceCount] = useState<number>(0);
  const [customizing, setCustomizing] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(
    () => readStoredCookieConsent()?.analytics ?? true
  );
  const [marketingEnabled, setMarketingEnabled] = useState<boolean>(
    () => readStoredCookieConsent()?.marketing ?? true
  );

  const isForcedOpen = forceOpenCounter > 0 && forceOpenCounter !== DismissedForForceCount;
  const shouldShow = !hidden && (!savedConsent || isForcedOpen);

  if (!shouldShow) return null;

  const persistChoice = (analytics: boolean, marketing: boolean) => {
    const next: CookieConsentPreferences = {
      essential: true,
      analytics,
      marketing,
      updated_at: new Date().toISOString(),
    };
    setSavedConsent(next);
    setAnalyticsEnabled(analytics);
    setMarketingEnabled(marketing);
    setCustomizing(false);
    setDismissedForForceCount(forceOpenCounter);
    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  return (
    <aside
      aria-label="Tùy chọn Cookie và Quyền riêng tư"
      className="fixed bottom-3 left-3 right-[4.5rem] sm:bottom-5 sm:left-5 sm:right-auto sm:max-w-[440px] z-[65] rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-3.5 sm:p-5 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.22)] space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
          <Cookie className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Bảo mật Dữ liệu &amp; Tùy chọn Cookie</span>
        </div>
        {savedConsent && (
          <button
            type="button"
            onClick={() => setDismissedForForceCount(forceOpenCounter)}
            aria-label="Đóng bảng Cookie"
            className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        DOMATION sử dụng Cookie thiết yếu để bảo mật phiên Workspace của bạn và tối ưu tốc độ định tuyến. Xem chi tiết tại{' '}
        <button
          type="button"
          onClick={() => onOpenLegal('privacy')}
          className="font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          Chính sách bảo mật
        </button>{' '}
        &amp;{' '}
        <button
          type="button"
          onClick={() => onOpenLegal('terms')}
          className="font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          Điều khoản
        </button>
        .
      </p>

      {customizing && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-800">1. Thiết yếu (Phiên đăng nhập &amp; Bảo mật)</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 whitespace-nowrap">
              Luôn bật
            </span>
          </div>
          <label className="flex items-center justify-between gap-2 cursor-pointer">
            <span className="text-slate-700">2. Phân tích hiệu năng phản hồi</span>
            <input
              type="checkbox"
              checked={analyticsEnabled}
              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between gap-2 cursor-pointer">
            <span className="text-slate-700">3. Đối soát UTM &amp; Chiến dịch</span>
            <input
              type="checkbox"
              checked={marketingEnabled}
              onChange={(e) => setMarketingEnabled(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {customizing ? (
          <button
            type="button"
            onClick={() => persistChoice(analyticsEnabled, marketingEnabled)}
            className="btn-inkica-primary min-h-[44px] rounded-xl px-3.5 sm:px-4 py-2 text-[11px] sm:text-xs cursor-pointer whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>Lưu tùy chọn</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => persistChoice(true, true)}
            className="btn-inkica-primary min-h-[44px] rounded-xl px-3.5 sm:px-4 py-2 text-[11px] sm:text-xs cursor-pointer whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>Chấp nhận tất cả</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => persistChoice(false, false)}
          className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          Chỉ thiết yếu
        </button>

        {!customizing && (
          <button
            type="button"
            onClick={() => setCustomizing(true)}
            className="min-h-[44px] inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3 h-3 shrink-0" />
            <span>Tùy chỉnh</span>
          </button>
        )}
      </div>
    </aside>
  );
}
