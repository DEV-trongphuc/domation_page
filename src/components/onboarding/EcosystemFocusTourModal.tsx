import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { DomationLogoMark } from '../DomationLogoMark';
import { ZaloSpecialistBanner } from '../common/ZaloSpecialistBanner';
import { DomResponsiveSubtabs } from '../dom-meta/DomMetaSelect';
import { lockBodyScroll, pushOverlay, unlockBodyScroll } from '../../utils/overlayStack';

export type EcosystemTourSystemKey = 'flywheel' | 'autodata' | 'dommeta' | 'automation' | 'erp';

interface EcosystemFocusTourModalProps {
  open: boolean;
  initialSystem?: EcosystemTourSystemKey;
  onClose: () => void;
  onStartTrial?: (system: EcosystemTourSystemKey) => void;
  onOpenSetupGuide?: (product: 'autodata' | 'dommeta' | 'erp') => void;
}

interface TourSlide {
  id: EcosystemTourSystemKey;
  label: string;
  shortLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  metrics: Array<{ label: string; value: string }>;
  icon: React.ReactNode;
}

const TOUR_SLIDES: TourSlide[] = [
  {
    id: 'flywheel',
    label: 'Vòng Tròn Tối Ưu',
    shortLabel: 'Vòng tròn',
    eyebrow: 'BƯỚC 1 / 5 • CLOSED-LOOP INTELLIGENCE',
    title: 'Vòng tròn khép kín: Meta Ads ↔ Chia Data Tức Thì ↔ Học tệp CAPI',
    description:
      'Mỗi Lead từ Meta/Google Ads được chia cho Sale tức thì, giữ chuẩn phản hồi 120s SLA (hoàn 1:1 nếu sai số) và bắn ngược 9 tầng tín hiệu SHA-256 về Meta Pixel để AI quảng cáo học đúng khách mua thật.',
    bullets: [
      '01. Đổ Lead Ads → Chống trùng 180 ngày (6 tháng) & lọc số rác ngay cổng vào',
      '02. Chia đều cho Sale Online tức thì, quá 120s tự thu hồi chuyển người khác',
      '03. Sale cập nhật trạng thái (Lead, Schedule, Purchase, DisqualifiedLead) → Meta học tệp chuẩn',
    ],
    metrics: [
      { label: 'Tốc độ chia số', value: 'Tức thì' },
      { label: 'Chống trễ SLA', value: '120 giây' },
      { label: 'Chuẩn bảo mật CAPI', value: 'SHA-256' },
    ],
    icon: <RefreshCw className="w-4 h-4" />,
  },
  {
    id: 'autodata',
    label: 'Auto Data & CRM',
    shortLabel: 'Auto Data',
    eyebrow: 'BƯỚC 2 / 5 • AUTO CHIA DATA & SALE CRM',
    title: 'Chia số công bằng theo năng lực, minh bạch Gini & Zalo Bot tức thì',
    description:
      'Loại bỏ tình trạng tranh giành data hoặc quên gọi khách. Hỗ trợ cả Sale nội bộ (xem đủ SĐT) lẫn Đại lý F1 (tự động che số bảo mật) và đồng bộ 2 chiều Google Sheets.',
    bullets: [
      'Gói Standard: 20 Sale & 5 Quản lý (1.500.000₫/tháng • -15%/năm)',
      'Bù ticket lỗi 1:1 tự động khi khách sai số hoặc ngoài khu vực',
      'Báo cáo cuối ngày qua Zalo, Telegram, Email & Discord (tùy chọn gộp Meta Ads)',
    ],
    metrics: [
      { label: 'Lọc trùng lịch sử', value: '180 ngày' },
      { label: 'Standard Quota', value: '20 Sale + 5 QL' },
      { label: 'Miễn phí dùng thử', value: '30 ngày' },
    ],
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 'dommeta',
    label: 'DOM Meta Report',
    shortLabel: 'Meta Report',
    eyebrow: 'BƯỚC 3 / 5 • META & GOOGLE ADS REALTIME',
    title: 'Báo cáo Quảng cáo Realtime gắn trực tiếp Doanh thu CRM thật',
    description:
      'Không chỉ nhìn CPL rẻ trên trình quản lý quảng cáo — DOM Meta đối chiếu từng bài Ads với số khách Qualified, Đặt cọc & Chốt đơn thực tế từ CRM.',
    bullets: [
      'Phân tích sâu Result, Spend, Giữ chân Video 3s, Khung giờ vàng 24/7, Độ tuổi & Vùng miền',
      'Dùng chung Gemini AI Key AES-256-GCM với CRM để AI phân tích bài quảng cáo',
      'Bật mở rộng Google Ads 5 bước khi cần theo dõi đa kênh',
    ],
    metrics: [
      { label: 'Meta Graph API', value: 'v25.0 Live' },
      { label: 'Chia sẻ báo cáo', value: 'Link công khai' },
      { label: 'AI Phân tích', value: 'Gemini Flash' },
    ],
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    id: 'automation',
    label: 'Marketing Automation',
    shortLabel: 'Automation',
    eyebrow: 'BƯỚC 4 / 5 • CHĂM SÓC TỰ ĐỘNG ĐA KÊNH',
    title: 'Kịch bản nuôi dưỡng tự động Zalo, Email & Webhook 2 chiều',
    description:
      'Khách chưa chốt ngay không bị rơi rụng. Luồng Automation tự động gửi tài liệu, nhắc lịch hẹn và gắn thẻ nhiệt độ Nóng/Ấm/Lạnh.',
    bullets: [
      'Kết nối LadiPage, Website, Google Forms, TikTok Lead không cần lập trình',
      'Mẫu kịch bản có sẵn cho Bất động sản, Giáo dục, Thẩm mỹ & Tài chính',
      'Theo dõi lịch sử tương tác xuyên suốt trên từng hồ sơ khách hàng',
    ],
    metrics: [
      { label: 'Độ trễ Trigger', value: 'Realtime' },
      { label: 'Kênh gửi tin', value: 'Zalo/Tele/Mail' },
      { label: 'AppScript Mail', value: '0₫/tháng' },
    ],
    icon: <Bot className="w-4 h-4" />,
  },
  {
    id: 'erp',
    label: 'DOMATION ERP 5.0',
    shortLabel: 'ERP 5.0',
    eyebrow: 'BƯỚC 5 / 5 • HỆ ĐIỀU HÀNH DOANH NGHIỆP',
    title: '12 Phân hệ khép kín: Hợp đồng, Công nợ, Kho, Nhân sự & VietQR',
    description:
      'Khi doanh nghiệp tăng trưởng, mở rộng thẳng lên ERP 5.0 trên cùng dữ liệu CRM — quản trị dòng tiền, phê duyệt đa cấp và tính hoa hồng tự động.',
    bullets: [
      'Phân quyền RLS đa chi nhánh & tách biệt dữ liệu theo phòng ban',
      'Quản lý gói Plan & Topup đồng bộ, hỗ trợ thanh toán VietQR minh bạch',
      'Gộp toàn bộ chỉ số Marketing + Vận hành cho Ban Giám Đốc trên 1 màn hình',
    ],
    metrics: [
      { label: 'Phân hệ lõi', value: '12 Modules' },
      { label: 'CRM + ERP Bundle', value: '6.000.000₫/th' },
      { label: 'Bảo mật dữ liệu', value: 'Tenant RLS' },
    ],
    icon: <Building2 className="w-4 h-4" />,
  },
];

export const EcosystemFocusTourModal: React.FC<EcosystemFocusTourModalProps> = ({
  open,
  initialSystem = 'flywheel',
  onClose,
  onStartTrial,
  onOpenSetupGuide,
}) => {
  const initialIdx = Math.max(
    0,
    TOUR_SLIDES.findIndex((s) => s.id === initialSystem)
  );
  const [overrideIdx, setOverrideIdx] = useState<number | null>(null);
  const stepIdx = overrideIdx ?? initialIdx;
  const setStepIdx = (next: number | ((prev: number) => number)) => {
    setOverrideIdx((prev) => {
      const current = prev ?? initialIdx;
      return typeof next === 'function' ? next(current) : next;
    });
  };

  const handleClose = useCallback(() => {
    setOverrideIdx(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setOverrideIdx(null);
    });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    const unregister = pushOverlay('ecosystem-focus-tour-modal', () => handleClose(), 235);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setOverrideIdx((prev) => Math.min(TOUR_SLIDES.length - 1, (prev ?? initialIdx) + 1));
      }
      if (e.key === 'ArrowLeft') {
        setOverrideIdx((prev) => Math.max(0, (prev ?? initialIdx) - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      unlockBodyScroll();
      unregister();
    };
  }, [open, handleClose, initialIdx]);

  if (!open) return null;

  const slide = TOUR_SLIDES[stepIdx] || TOUR_SLIDES[0];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === TOUR_SLIDES.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Focus Tour Hệ sinh thái DOMATION"
      className="fixed inset-0 z-[130] bg-slate-900/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-t-[26px] sm:rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden dom-macos-modal-enter dom-ios-modal-panel"
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <DomationLogoMark size={28} className="shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#1E40FF] truncate">
                FOCUS TOUR HỆ SINH THÁI DOMATION
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                Khám phá từng hệ thống trong 60 giây
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="min-h-[44px] px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Bỏ qua
            </button>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Đóng Focus Tour"
              className="w-11 h-11 sm:w-9 sm:h-9 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          <DomResponsiveSubtabs
            variant="segmented"
            maxMobile={2}
            maxTablet={3}
            maxDesktop={5}
            value={slide.id}
            onChange={(id) => {
              const found = TOUR_SLIDES.findIndex((s) => s.id === id);
              if (found >= 0) setStepIdx(found);
            }}
            tabs={TOUR_SLIDES.map((s) => ({
              id: s.id,
              label: s.label,
              shortLabel: s.shortLabel,
              icon: s.icon,
            }))}
          />

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-[#F8FAFF] to-white p-4 sm:p-6 space-y-4">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#1E40FF]">
              {slide.eyebrow}
            </div>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900 leading-snug">
              {slide.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{slide.description}</p>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {slide.metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-2.5 text-center"
                >
                  <div className="text-xs sm:text-base font-black text-[#1E40FF] truncate">
                    {m.value}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate mt-0.5">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Bullets */}
            <ul className="space-y-2">
              {slide.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            {onOpenSetupGuide && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onOpenSetupGuide(
                      slide.id === 'dommeta' ? 'dommeta' : slide.id === 'erp' ? 'erp' : 'autodata'
                    );
                  }}
                  className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-bold text-[#1E40FF] hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Xem hướng dẫn setup 3 bước cho phân hệ này →</span>
                </button>
              </div>
            )}
          </div>

          <ZaloSpecialistBanner
            context={slide.id === 'erp' ? 'custom' : 'setup'}
            variant="compact"
          />

          {/* Step Dots */}
          <div className="hidden sm:flex items-center justify-center gap-0.5" aria-hidden="true">
            {TOUR_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStepIdx(idx)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer group"
              >
                <span
                  className={`h-2 rounded-full transition-all ${
                    idx === stepIdx ? 'w-6 bg-[#1E40FF]' : 'w-2 bg-slate-200 group-hover:bg-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Footer — Strictly max 2 buttons horizontally */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-white grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-45 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Quay lại</span>
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={() => setStepIdx((i) => Math.min(TOUR_SLIDES.length - 1, i + 1))}
              className="min-h-[44px] rounded-xl bg-[#1E40FF] hover:bg-[#1E3A8A] px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Tiếp theo</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                handleClose();
                if (onStartTrial) onStartTrial(slide.id);
              }}
              className="min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Dùng thử miễn phí 30 ngày</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
