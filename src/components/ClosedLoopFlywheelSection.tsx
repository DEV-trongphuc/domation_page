import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Compass,
  Cpu,
  Filter,
  GitMerge,
  Lock,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Users,
  Wand2,
  Zap,
} from 'lucide-react';
import { DomResponsiveSubtabs } from './dom-meta/DomMetaSelect';

export type FlywheelProduct = 'autodata' | 'dommeta' | 'erp';

export interface ClosedLoopFlywheelSectionProps {
  variant?: 'home' | 'data';
  onOpenSetupGuide?: (product?: FlywheelProduct) => void;
  onOpenFocusTour?: (product?: FlywheelProduct) => void;
  className?: string;
}

interface CycleStep {
  id: string;
  step: string;
  shortLabel: string;
  title: string;
  badge: string;
  latency: string;
  summary: string;
  metrics: { label: string; value: string }[];
  bullets: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentBg: string;
  accentText: string;
  accentBorder: string;
}

interface CapiStage {
  id: string;
  crmLabel: string;
  viLabel: string;
  capiEvent: string;
  polarity: 'positive' | 'neutral' | 'negative';
  hashSample: string;
  signalEffect: string;
}

const CYCLE_STEPS: CycleStep[] = [
  {
    id: 'ingress',
    step: '01',
    shortLabel: 'Lead Ingress < 5s',
    title: 'Thu Lead Đa Kênh & Lọc Trùng 180 Ngày',
    badge: 'BƯỚC 01 • TIẾP NHẬN TỨC THÌ',
    latency: '< 5 giây',
    summary:
      'Webhook từ Meta Lead Ads, Google Ads, TikTok Instant Form, Ladipage và Website đổ về một cửa, tự chuẩn hóa +84 và kiểm tra trùng đa kênh 180 ngày (6 tháng).',
    metrics: [
      { label: 'Độ trễ Webhook', value: '< 5s' },
      { label: 'Cửa sổ lọc trùng', value: '180 Ngày (6 Tháng)' },
      { label: 'Chuẩn hóa SĐT', value: 'E.164 (+84)' },
    ],
    bullets: [
      'Gắn tự động Campaign ID, Adset ID, Ad ID, fbclid & 16-digit Meta Lead ID.',
      'Khách cũ quay lại sau 1–180 ngày đẩy thẳng về đúng Sale đang chăm, tránh tranh chấp nội bộ.',
    ],
    icon: Zap,
    accentBg: 'from-[#1E40FF] to-[#2563EB]',
    accentText: 'text-[#1E40FF]',
    accentBorder: 'border-blue-200',
  },
  {
    id: 'routing',
    step: '02',
    shortLabel: 'AI Score & 5-Port',
    title: 'AI Pre-Score, Chia 5 Cổng & SLA 120s',
    badge: 'BƯỚC 02 • CHIA CÔNG BẰNG',
    latency: '120s SLA',
    summary:
      'AI chấm điểm chất lượng Lead (0–100) & chặn số rác từ Blacklist trước khi chia Round-Robin công bằng qua 5 cổng bảo vệ. Quá 120s chưa nhận tự thu hồi chuyển vòng; sai số hoàn 1:1.',
    metrics: [
      { label: 'AI Pre-Score', value: '0 – 100 điểm' },
      { label: 'Thu hồi quá hạn', value: '120 giây SLA' },
      { label: 'Bù số lỗi / spam', value: '1-đổi-1' },
    ],
    bullets: [
      '5 cổng lọc: Roster dự án, Check-in ca, Vacation Mode, Van chống ôm số & Quota giờ/ngày/tháng.',
      'Ping ZaloBot / Telegram kèm tóm tắt nhu cầu AI để Sale gọi khi khách còn cầm máy.',
    ],
    icon: Cpu,
    accentBg: 'from-[#0284C7] to-[#06B6D4]',
    accentText: 'text-[#0284C7]',
    accentBorder: 'border-cyan-200',
  },
  {
    id: 'pipeline',
    step: '03',
    shortLabel: '9-Stage Pipeline',
    title: 'Sale Chăm Sóc & Chuyển Đổi 9 Trạng Thái',
    badge: 'BƯỚC 03 • PIPELINE THỰC CHIẾN',
    latency: 'Real-time',
    summary:
      'Mỗi cuộc gọi của Sale cập nhật 1 chạm trên Cổng Sale / CRM 360° qua 9 nấc trạng thái chuẩn hóa — tách bạch khách nét, hẹn lịch, đặt cọc, chốt doanh thu VND với số sai/spam.',
    metrics: [
      { label: 'Tích cực (Học sâu)', value: '5 Nấc chuyển đổi' },
      { label: 'Trung tính (Bỏ qua)', value: '2 Nấc giữ sạch tệp' },
      { label: 'Loại trừ / Rác', value: 'Notlead • Spam' },
    ],
    bullets: [
      'Ghi nhận doanh thu thực (VND) theo từng bài Ads & từng Sale phụ trách.',
      'Tách biệt Lead cá nhân của Sale (0 quota) với Lead quảng cáo công ty.',
    ],
    icon: GitMerge,
    accentBg: 'from-emerald-600 to-teal-500',
    accentText: 'text-emerald-700',
    accentBorder: 'border-emerald-200',
  },
  {
    id: 'capi',
    step: '04',
    shortLabel: 'SHA-256 Meta CAPI',
    title: 'Bắn Ngược SHA-256 CAPI — Ads Tự Thông Minh',
    badge: 'BƯỚC 04 • PHẢN HỒI HỌC MÁY',
    latency: 'Forward-Only',
    summary:
      'Dữ liệu PII được băm một chiều SHA-256 trước khi gửi Meta Conversions API: đẩy tín hiệu tích cực (Lead -> Purchase) lẫn tín hiệu âm (DisqualifiedLead) để Meta Machine Learning tự tối ưu CPL/CPA.',
    metrics: [
      { label: 'Mã hóa PII', value: 'SHA-256 Hash' },
      { label: 'Chống bắn lùi', value: 'Forward-Only' },
      { label: 'Tối ưu Meta ML', value: 'Giảm CPL & Lead rác' },
    ],
    bullets: [
      'Chỉ bắn tiến (Qualified -> Booked -> Booking -> Deposited -> Closed), không bắn lùi gây nhiễu Pixel.',
      'Tự động loại trừ chân dung tệp rác nhờ tín hiệu DisqualifiedLead gửi ngược về Meta.',
    ],
    icon: RefreshCw,
    accentBg: 'from-[#0F172A] to-[#1E40FF]',
    accentText: 'text-[#1E40FF]',
    accentBorder: 'border-indigo-200',
  },
];

const CAPI_STAGES: CapiStage[] = [
  {
    id: 'Qualified',
    crmLabel: 'Qualified',
    viLabel: 'Thiện chí',
    capiEvent: 'Lead',
    polarity: 'positive',
    hashSample: 'ph: sha256(+84909***), fbc, lead_id',
    signalEffect: 'Dạy Meta ưu tiên phân phối tới tệp người dùng có nhu cầu thật.',
  },
  {
    id: 'Booked',
    crmLabel: 'Booked',
    viLabel: 'Hẹn gặp',
    capiEvent: 'Schedule',
    polarity: 'positive',
    hashSample: 'ph + em sha256, event_id: sch_9042',
    signalEffect: 'Tăng trọng số thuật toán tìm nhóm khách sẵn sàng đặt lịch hẹn/khám/xem nhà.',
  },
  {
    id: 'Booking',
    crmLabel: 'Booking',
    viLabel: 'Giữ chỗ',
    capiEvent: 'InitiateCheckout',
    polarity: 'positive',
    hashSample: 'ph + fn + ln sha256, content_ids',
    signalEffect: 'Báo hiệu ý định mua hàng cao ngay trước bước thanh toán.',
  },
  {
    id: 'Deposited',
    crmLabel: 'Deposited',
    viLabel: 'Đặt cọc',
    capiEvent: 'AddPaymentInfo',
    polarity: 'positive',
    hashSample: 'value: deposit_vnd, currency: VND',
    signalEffect: 'Huấn luyện Meta Optimize theo nhóm khách hàng có hành vi xuống tiền.',
  },
  {
    id: 'Closed',
    crmLabel: 'Closed',
    viLabel: 'Chốt HĐ',
    capiEvent: 'Purchase',
    polarity: 'positive',
    hashSample: 'value: deal_vnd, currency: VND, fbp',
    signalEffect: 'Tín hiệu ROAS tối thượng giúp Meta mở rộng Lookalike từ người mua thật.',
  },
  {
    id: 'Badtiming',
    crmLabel: 'Badtiming',
    viLabel: 'Sai thời điểm',
    capiEvent: 'Skip',
    polarity: 'neutral',
    hashSample: 'held_local_crm (không bắn nhiễu)',
    signalEffect: 'Giữ nguyên độ tinh khiết của Pixel, chăm lại bằng Automation Flow.',
  },
  {
    id: 'NoAnswer',
    crmLabel: 'NoAnswer',
    viLabel: 'Không nghe máy',
    capiEvent: 'Skip',
    polarity: 'neutral',
    hashSample: 'held_local_crm (chờ gọi lại)',
    signalEffect: 'Không phạt nhầm chiến dịch khi khách bận chưa kịp nhấc máy.',
  },
  {
    id: 'Notlead',
    crmLabel: 'Notlead / Spam',
    viLabel: 'Sai số / Rác',
    capiEvent: 'DisqualifiedLead',
    polarity: 'negative',
    hashSample: 'ph + lead_id sha256, reason: spam',
    signalEffect: 'Bắn tín hiệu âm để Meta né phân phối vào nhóm đối tượng ảo/sai tệp.',
  },
  {
    id: 'unrated',
    crmLabel: 'unrated',
    viLabel: 'Chờ gọi',
    capiEvent: 'Pending (120s SLA)',
    polarity: 'neutral',
    hashSample: 'awaiting_first_touch_sla',
    signalEffect: 'Đồng hồ SLA 120s đếm ngược — tự chuyển vòng nếu Sale chưa tiếp nhận.',
  },
];

export const ClosedLoopFlywheelSection: React.FC<ClosedLoopFlywheelSectionProps> = ({
  variant = 'home',
  onOpenSetupGuide,
  onOpenFocusTour,
  className = '',
}) => {
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [activeStageId, setActiveStageId] = useState<string>('Closed');

  const activeStep = CYCLE_STEPS[activeStepIdx] || CYCLE_STEPS[0];
  const activeStage = CAPI_STAGES.find((s) => s.id === activeStageId) || CAPI_STAGES[4];
  const ActiveIcon = activeStep.icon;

  const defaultProduct: FlywheelProduct = 'autodata';

  const triggerFocusTour = (product: FlywheelProduct = defaultProduct) => {
    if (onOpenFocusTour) {
      onOpenFocusTour(product);
      return;
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('domation:open-focus-tour', {
          cancelable: true,
          detail: { product, source: 'closed_loop_flywheel' },
        })
      );
    }
  };

  const triggerSetupGuide = (product: FlywheelProduct = defaultProduct) => {
    if (onOpenSetupGuide) {
      onOpenSetupGuide(product);
      return;
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('domation:open-setup-guide', {
          cancelable: true,
          detail: { product, source: 'closed_loop_flywheel' },
        })
      );
    }
  };

  return (
    <section
      id="closed-loop"
      className={`scroll-mt-24 relative py-12 sm:py-18 px-4 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[28px] sm:rounded-[34px] bg-gradient-to-br from-white via-[#F6F9FF] to-[#ECFEFF]/75 backdrop-blur-2xl border border-blue-200/80 shadow-[0_24px_70px_-28px_rgba(30,64,255,0.18)] p-5 sm:p-8 lg:p-10 space-y-7">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="max-w-3xl space-y-2.5">
              <div className="ql-eyebrow">
                <RefreshCw className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                <span>VÒNG TRÒN TỐI ƯU KHÉP KÍN • META ADS ↔ CRM ↔ CAPI</span>
              </div>
              <h2 className="text-xl sm:text-3xl lg:text-[34px] font-bold text-slate-900 leading-[1.22] tracking-tight">
                Quảng Cáo Hút Khách — Chia Số &lt; 5s —{' '}
                <span className="text-gradient-inkica">Bắn Ngược CAPI Tự Thông Minh</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                Chấm dứt tình trạng CPL trên Ads Manager rẻ nhưng toàn số rác hoặc Sale ôm số không gọi: mọi điểm chạm từ bài Ads, AI chấm điểm, Sale chốt đơn đến SHA-256 Meta CAPI khép thành một vòng học máy liên tục.
              </p>
            </div>

            {/* Dual M4 Modal/Tour Hooks */}
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => triggerFocusTour(defaultProduct)}
                className="btn-inkica-primary min-h-[44px] rounded-full px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>Xem Focus Tour Hệ Sinh Thái</span>
              </button>
              <button
                type="button"
                onClick={() => triggerSetupGuide(defaultProduct)}
                className="ql-btn-outline min-h-[44px] rounded-full px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                <Wand2 className="w-4 h-4 text-[#1E40FF] shrink-0" />
                <span>Setup Từng Bước Không Cần Code</span>
              </button>
            </div>
          </div>

          {/* Interactive Loop Diagram + Step Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Visual 4-Node Closed-Loop Circle */}
            <div className="lg:col-span-5 rounded-3xl bg-white/95 border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  CLOSED-LOOP INTELLIGENCE
                </span>
                <span className="text-[11px] font-mono text-[#1E40FF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  {variant === 'data' ? 'AutoData × CAPI' : 'Ecosystem Loop'}
                </span>
              </div>

              {/* Circular Orbit Visual */}
              <div className="relative py-2">
                {/* Connecting Circular Ring (Desktop/Tablet visual) */}
                <div
                  aria-hidden="true"
                  className="hidden sm:block absolute inset-x-10 inset-y-6 rounded-[44px] border-2 border-dashed border-blue-200/90 pointer-events-none"
                />

                {/* Center Flywheel Core */}
                <div className="sm:hidden mb-3 rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0284C7] text-white px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">
                      Vòng Lặp Tự Tiến Hóa
                    </div>
                    <div className="text-xs font-bold">Mỗi cuộc gọi nuôi máy học Meta Ads</div>
                  </div>
                  <TrendingDown className="w-5 h-5 text-cyan-300 shrink-0" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                  {CYCLE_STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = idx === activeStepIdx;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setActiveStepIdx(idx)}
                        aria-pressed={isActive}
                        className={`text-left rounded-2xl p-3.5 sm:p-4 border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                          isActive
                            ? 'bg-gradient-to-br from-[#EEF4FF] via-white to-[#ECFEFF] border-[#1E40FF] shadow-[0_12px_28px_-12px_rgba(30,64,255,0.35)] ring-1 ring-[#1E40FF]/30'
                            : 'bg-slate-50/85 border-slate-200/85 hover:bg-white hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${step.accentBg} text-white flex items-center justify-center shrink-0 shadow-xs`}
                          >
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                            {step.step} • {step.latency}
                          </span>
                        </div>
                        <div>
                          <div
                            className={`text-xs sm:text-sm font-bold leading-snug ${
                              isActive ? 'text-[#1E40FF]' : 'text-slate-900'
                            }`}
                          >
                            {step.shortLabel}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {step.title}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Desktop Center Flywheel Pill */}
                <div className="hidden sm:flex justify-center mt-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0284C7] text-white px-4 py-1.5 text-[11px] font-semibold shadow-md">
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Meta Ads ↔ AI Pre-Score ↔ Sale 9 Nấc ↔ SHA-256 CAPI</span>
                  </div>
                </div>
              </div>

              {/* Quick Stepper Pills */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                <span>Bấm từng bước để soi cơ chế thực tế</span>
                <button
                  type="button"
                  onClick={() => setActiveStepIdx((prev) => (prev + 1) % CYCLE_STEPS.length)}
                  className="min-h-[44px] sm:min-h-0 px-2 inline-flex items-center gap-1 font-semibold text-[#1E40FF] hover:underline cursor-pointer shrink-0"
                >
                  <span>Bước tiếp theo</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Right: Active Step Detail Card */}
            <div className="lg:col-span-7 rounded-3xl bg-white/95 border border-slate-200/90 p-5 sm:p-7 shadow-xs flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/75 text-[10.5px] font-bold uppercase tracking-wider text-[#1E40FF]">
                    <ActiveIcon className="w-3.5 h-3.5" />
                    <span>{activeStep.badge}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{activeStep.latency}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-slate-900 leading-snug">
                    {activeStep.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                    {activeStep.summary}
                  </p>
                </div>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {activeStep.metrics.map((m) => (
                    <div
                      key={m.label}
                      className="rounded-2xl bg-slate-50/90 border border-slate-200/80 px-3 py-2.5"
                    >
                      <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate">
                        {m.label}
                      </div>
                      <div className="text-xs sm:text-sm font-bold font-mono text-[#1E40FF] mt-0.5 truncate">
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Verified Bullet Details */}
                <div className="space-y-2">
                  {activeStep.bullets.map((b) => (
                    <div
                      key={b}
                      className="flex items-start gap-2.5 rounded-xl bg-[#F4F8FF]/75 border border-blue-100/80 px-3.5 py-2.5 text-xs text-slate-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive 9-Stage CAPI Signal Preview */}
              <div className="rounded-2xl bg-slate-950 text-white p-4 sm:p-5 space-y-3 border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                      9 Trạng Thái CRM → Tín Hiệu Meta CAPI (SHA-256)
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3 text-cyan-300" />
                    Forward-Only
                  </span>
                </div>

                {/* 9 Stage Interactive Pills */}
                <DomResponsiveSubtabs
                  tabs={CAPI_STAGES.map((stage) => ({
                    id: stage.id,
                    label: `${stage.crmLabel} → ${stage.capiEvent}`,
                  }))}
                  value={activeStage.id}
                  onChange={setActiveStageId}
                  maxMobile={2}
                  className="[&>button]:min-h-[44px] sm:[&>button]:min-h-0"
                />

                {/* Selected Stage Payload Effect */}
                <div className="rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white">
                      {activeStage.crmLabel} ({activeStage.viLabel}) →{' '}
                      <span className="text-cyan-300 font-mono">{activeStage.capiEvent}</span>
                    </div>
                    <div className="text-slate-300">{activeStage.signalEffect}</div>
                  </div>
                  <code className="text-[10px] font-mono text-cyan-200 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-white/10 shrink-0 break-all max-w-full">
                    {activeStage.hashSample}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Strip: Cross-Product Hook Bar */}
          <div className="rounded-2xl bg-white/90 border border-slate-200/80 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-700">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#1E40FF]">
                <Filter className="w-3.5 h-3.5" />
                Chống trùng 180 ngày
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                5 Cổng Round-Robin + 1:1 Refund
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
                Gắn thẳng vào DomMeta Graph v25.0
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => triggerFocusTour('dommeta')}
                className="min-h-[44px] sm:min-h-0 px-2 inline-flex items-center gap-1 font-semibold text-[#1E40FF] hover:underline cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Tour DomMeta Report</span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => triggerSetupGuide('autodata')}
                className="min-h-[44px] sm:min-h-0 px-2 inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-[#1E40FF] cursor-pointer"
              >
                <span>Check-step Setup 60s</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClosedLoopFlywheelSection;
