import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Layers,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
import { DomationLogoMark } from '../DomationLogoMark';
import { DomResponsiveSubtabs } from '../dom-meta/DomMetaSelect';

export type SetupProductKey = 'autodata' | 'dommeta' | 'erp';

interface NonCoderSetupModalProps {
  open: boolean;
  initialProduct?: SetupProductKey;
  onClose: () => void;
  onLaunchAutodataWizard?: () => void;
  onOpenMetaReport?: () => void;
  onNavigate?: (path: string) => void;
}

const PRODUCT_GUIDES: Record<
  SetupProductKey,
  {
    badge: string;
    title: string;
    subtitle: string;
    steps: Array<{
      step: string;
      reqLabel: string;
      reqTone: 'required' | 'optional';
      title: string;
      plainDesc: string;
    }>;
    techSnippet: string;
    primaryCta: string;
  }
> = {
  autodata: {
    badge: 'AUTO DATA CRM • 60 GIÂY',
    title: 'Thiết lập Chia Data Tự Động cho người không rành kỹ thuật',
    subtitle:
      'Chỉ cần điền tên đội Sale ở Bước 1 — mọi luật chia vòng <5s, lọc trùng 180 ngày (6 tháng) và chống trễ SLA 120s đã bật sẵn.',
    steps: [
      {
        step: 'Bước 1',
        reqLabel: 'Bắt buộc',
        reqTone: 'required',
        title: 'Đặt tên Không gian làm việc & Tài khoản Quản trị',
        plainDesc:
          'Tạo đường dẫn riêng cho công ty (ví dụ /data/ten-cong-ty) để nhận khách từ Facebook, LadiPage, TikTok.',
      },
      {
        step: 'Bước 2',
        reqLabel: 'Tùy chọn',
        reqTone: 'optional',
        title: 'Kiểm tra luật Chia đều & Lọc trùng 180 ngày (6 tháng)',
        plainDesc:
          'Mặc định chia đều theo lượt Online, giữ khách cũ 180 ngày cho đúng Sale đang chăm và hoàn 1:1 nếu sai số.',
      },
      {
        step: 'Bước 3',
        reqLabel: 'Tùy chọn',
        reqTone: 'optional',
        title: 'Kết nối Bot Zalo / Telegram & Gửi thử 1 chạm',
        plainDesc:
          'Dán mã Bot hoặc bấm "Bỏ qua & vào ngay" để test chia khách tức thì, có thể gắn Bot sau bất cứ lúc nào.',
      },
    ],
    techSnippet: `POST https://domation.net/api/v1/webhooks/<slug>\nHeader: Content-Type: application/json\nBody: { "full_name": "Nguyễn Văn A", "phone": "0987654321", "source": "meta_lead_ads" }`,
    primaryCta: 'Mở Trình Tạo Workspace 3 Bước',
  },
  dommeta: {
    badge: 'DOM META REPORT • 1 CHẠM',
    title: 'Kết nối Báo cáo Quảng cáo Meta & CAPI cho chủ doanh nghiệp',
    subtitle:
      'Xem chi tiêu, Lead thật từ CRM, giờ cao điểm 24/7 và tự động bắn ngược tín hiệu học tệp về Meta — không cần biết code.',
    steps: [
      {
        step: 'Bước 1',
        reqLabel: 'Bắt buộc',
        reqTone: 'required',
        title: 'Đăng nhập Facebook Business hoặc Dùng chung Token CRM',
        plainDesc:
          'Nếu đã kết nối trên AutoData CRM, DOM Meta tự động nhận tài khoản quảng cáo bằng 1 nút bấm.',
      },
      {
        step: 'Bước 2',
        reqLabel: 'Tùy chọn',
        reqTone: 'optional',
        title: 'Chọn Tài khoản Quảng cáo & Bật Google Ads (nếu chạy)',
        plainDesc:
          'Giữ gọn giao diện chỉ hiện Meta Ads, hoặc gạt công tắc để xem gộp thêm từ khóa Google Ads.',
      },
      {
        step: 'Bước 3',
        reqLabel: 'Tùy chọn',
        reqTone: 'optional',
        title: 'Bật Vòng tròn Tối ưu CAPI & Báo cáo Cuối ngày',
        plainDesc:
          'Hệ thống băm SHA-256 tự động gửi tín hiệu khách chất lượng về Meta để giảm chi phí trên mỗi khách hàng.',
      },
    ],
    techSnippet: `GET /api/v1/integrations/dom-meta/overview\nCAPI Quality Gate: Purchase / Lead -> SHA-256 -> Meta Graph v25.0`,
    primaryCta: 'Mở DOM Meta Report',
  },
  erp: {
    badge: 'DOMATION ERP 5.0 • 12 PHÂN HỆ',
    title: 'Khởi động Hệ điều hành Doanh nghiệp & Tài chính VietQR',
    subtitle:
      'Liên thông trực tiếp từ Lead CRM sang Hợp đồng, Công nợ, Kho vận, Chấm công và Báo cáo tự động đa kênh.',
    steps: [
      {
        step: 'Bước 1',
        reqLabel: 'Bắt buộc',
        reqTone: 'required',
        title: 'Chọn Mô hình Doanh nghiệp & Số lượng Nhân sự',
        plainDesc:
          'Từ gói Standard (20 Sale & 5 Quản lý) đến Growth (85 Sale & 15 Quản lý) hoặc Enterprise không giới hạn.',
      },
      {
        step: 'Bước 2',
        reqLabel: 'Tùy chọn',
        reqTone: 'optional',
        title: 'Bật các Phân hệ cần dùng (CRM, Hợp đồng, HRM, Kho)',
        plainDesc:
          'Bắt đầu gọn nhẹ với CRM + Báo cáo ngày, bật thêm phân hệ kế toán & duyệt chi khi đội ngũ mở rộng.',
      },
      {
        step: 'Bước 3',
        reqLabel: 'Tùy chọn',
        reqTone: 'optional',
        title: 'Kiểm tra Trạng thái Kết nối & Nạp ví VietQR',
        plainDesc:
          'Theo dõi trạng thái Zalo, Email, AI Key dùng chung tại 1 bảng duy nhất với thanh toán VietQR tự động.',
      },
    ],
    techSnippet: `GET /api/v1/billing/catalog\nPOST /api/v1/billing/switch-package { "package_code": "domation_crm_erp", "billing_cycle": "annual" }`,
    primaryCta: 'Khám phá DOMATION ERP',
  },
};

export const NonCoderSetupModal: React.FC<NonCoderSetupModalProps> = ({
  open,
  initialProduct = 'autodata',
  onClose,
  onLaunchAutodataWizard,
  onOpenMetaReport,
  onNavigate,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<SetupProductKey | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({ 0: true });
  const [showAdvancedCode, setShowAdvancedCode] = useState(false);

  const product = selectedProduct ?? initialProduct;
  const setProduct = (next: SetupProductKey) => setSelectedProduct(next);

  const handleClose = useCallback(() => {
    setSelectedProduct(null);
    setShowAdvancedCode(false);
    setCheckedSteps({ 0: true });
    onClose();
  }, [onClose]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setSelectedProduct(null);
        setShowAdvancedCode(false);
        setCheckedSteps({ 0: true });
      }
    });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  if (!open) return null;

  const guide = PRODUCT_GUIDES[product];
  const step1Checked = Boolean(checkedSteps[0]);
  const step2Checked = Boolean(checkedSteps[1]);
  const step3Checked = Boolean(checkedSteps[2]);

  const handlePrimaryAction = () => {
    handleClose();
    if (product === 'autodata' && onLaunchAutodataWizard) {
      onLaunchAutodataWizard();
      return;
    }
    if (product === 'dommeta') {
      if (onOpenMetaReport) onOpenMetaReport();
      else if (onNavigate) onNavigate('/meta-report');
      return;
    }
    if (product === 'erp') {
      if (onNavigate) onNavigate('/erp');
      else if (onLaunchAutodataWizard) onLaunchAutodataWizard();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hướng dẫn thiết lập nhanh từng bước cho người không rành kỹ thuật"
      className="fixed inset-0 z-[130] bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-t-[26px] sm:rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden"
      >
        {/* Mobile bottom-sheet grabber */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <DomationLogoMark size={30} className="shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#1E40FF] truncate">
                {guide.badge}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Thiết lập dễ hiểu — Check từng bước
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng hướng dẫn thiết lập"
            className="w-11 h-11 sm:w-9 sm:h-9 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Product Switcher (Zero-Wrap DomResponsiveSubtabs) */}
          <DomResponsiveSubtabs
            variant="segmented"
            maxMobile={2}
            maxTablet={3}
            maxDesktop={3}
            value={product}
            onChange={(id) => setProduct(id as SetupProductKey)}
            tabs={[
              { id: 'autodata', label: 'Auto Data & CRM', shortLabel: 'Auto Data' },
              { id: 'dommeta', label: 'DOM Meta & CAPI', shortLabel: 'Meta Report' },
              { id: 'erp', label: 'ERP & VietQR', shortLabel: 'ERP 5.0' },
            ]}
          />

          {/* 3-Step Visual Check-Step Bar */}
          <div
            data-tour="setup-stepper"
            className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3"
          >
            {[
              { label: 'Bước 1 ✓ Khởi tạo (Bắt buộc)', done: step1Checked },
              { label: 'Bước 2 ✓ Cấu hình (Tùy chọn)', done: step2Checked },
              { label: 'Test thành công ✓', done: step3Checked },
            ].map((pill, idx) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                className={`min-h-[44px] flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors cursor-pointer ${
                  pill.done
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${pill.done ? 'text-emerald-600' : 'text-slate-300'}`}
                />
                <span className="truncate">{pill.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
              {guide.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{guide.subtitle}</p>
          </div>

          {/* 3 Check-Step Cards */}
          <div className="space-y-2.5">
            {guide.steps.map((st, idx) => {
              const checked = Boolean(checkedSteps[idx]);
              return (
                <button
                  key={st.step}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                  className={`w-full text-left min-h-[44px] rounded-2xl border p-3.5 sm:p-4 transition-all cursor-pointer ${
                    checked
                      ? 'border-blue-200 bg-blue-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        checked
                          ? 'bg-[#1E40FF] text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {checked ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">{st.step}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            st.reqTone === 'required'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {st.reqLabel}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-slate-800">{st.title}</div>
                      <p className="text-xs text-slate-600 leading-relaxed">{st.plainDesc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Collapsible Technical Mode (Default Closed) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
            <button
              type="button"
              onClick={() => setShowAdvancedCode((v) => !v)}
              className="min-h-[44px] w-full flex items-center justify-between gap-2 text-xs font-bold text-slate-700 cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#1E40FF]" />
                <span>Chế độ Nâng cao (Kỹ thuật)</span>
              </span>
              {showAdvancedCode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showAdvancedCode && (
              <pre className="mt-2.5 overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-emerald-400">
                {guide.techSnippet}
              </pre>
            )}
          </div>

          <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3 flex items-center gap-2.5 text-xs text-slate-700">
            <ShieldCheck className="w-4 h-4 text-[#1E40FF] shrink-0" />
            <span>
              <strong>An toàn tuyệt đối:</strong> Miễn phí 30 ngày đầu, mọi cấu hình có thể chỉnh lại sau trong Cài đặt.
            </span>
          </div>
        </div>

        {/* Mobile-Safe 2-Button Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-white grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Xem sau</span>
          </button>
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="min-h-[44px] rounded-xl bg-[#1E40FF] hover:bg-[#1E3A8A] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span className="truncate">{guide.primaryCta}</span>
            <ArrowRight className="w-4 h-4 shrink-0 hidden sm:inline" />
          </button>
        </div>
      </div>
    </div>
  );
};
