import React, { useState } from 'react';
import {
  ArrowRight,
  Clock,
  GitBranch,
  Mail,
  MessageCircle,
  Send,
  Webhook,
  Zap,
  ZoomIn,
} from 'lucide-react';
import { DomResponsiveSubtabs } from '../dom-meta/DomMetaSelect';
import { SmoothAppImage } from '../SmoothAppImage';
import {
  FLOW_SIM_PRESETS,
  type FlowSimNode,
  type FlowSimPreset,
} from './automationShowcaseData';

interface AutomationFlowSimulatorProps {
  onOpenContact: (topic?: string) => void;
  onInspectImage: (imageSrc: string, title: string, subtitle?: string) => void;
}

const NODE_META: Record<
  FlowSimNode['stepType'],
  {
    icon: React.ComponentType<{ className?: string }>;
    pillClass: string;
    label: string;
  }
> = {
  trigger: {
    icon: Zap,
    pillClass: 'bg-blue-50 text-[#1E40FF] border-blue-200',
    label: 'Trigger',
  },
  email: {
    icon: Mail,
    pillClass: 'bg-sky-50 text-[#0284C7] border-sky-200',
    label: 'Email AWS SES',
  },
  wait: {
    icon: Clock,
    pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
    label: 'Wait Delay',
  },
  condition: {
    icon: GitBranch,
    pillClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    label: 'IF / ELSE',
  },
  zalo_zns: {
    icon: MessageCircle,
    pillClass: 'bg-blue-50 text-[#0068FF] border-blue-200',
    label: 'Zalo ZNS',
  },
  webhook: {
    icon: Webhook,
    pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
    label: 'Webhook HMAC',
  },
  crm_handoff: {
    icon: Send,
    pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'CRM / CAPI',
  },
};

export const AutomationFlowSimulator: React.FC<AutomationFlowSimulatorProps> = ({
  onOpenContact,
  onInspectImage,
}) => {
  const [presetId, setPresetId] = useState<string>(FLOW_SIM_PRESETS[0].id);
  const preset: FlowSimPreset =
    FLOW_SIM_PRESETS.find((p) => p.id === presetId) || FLOW_SIM_PRESETS[0];
  const [selectedNodeId, setSelectedNodeId] = useState<string>(preset.nodes[0].id);

  const activeNode =
    preset.nodes.find((n) => n.id === selectedNodeId) || preset.nodes[0];
  const activeMeta = NODE_META[activeNode.stepType];

  const handlePresetChange = (nextId: string) => {
    setPresetId(nextId);
    const nextPreset = FLOW_SIM_PRESETS.find((p) => p.id === nextId);
    if (nextPreset?.nodes[0]) {
      setSelectedNodeId(nextPreset.nodes[0].id);
    }
  };

  return (
    <section
      id="flow-simulator"
      className="scroll-mt-24 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 relative z-10"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Row matching /dom-ai & /data */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="ql-eyebrow">
              <GitBranch className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
              <span>MÔ PHỎNG FLOW ENGINE THỰC CHIẾN</span>
            </div>
            <h2 className="text-[20px] sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-[1.22] tracking-tight">
              Từng Bước Kịch Bản{' '}
              <span className="text-gradient-inkica">Chính Xác Từ Trigger Đến Chốt Đơn</span>
            </h2>
          </div>

          <DomResponsiveSubtabs
            tabs={FLOW_SIM_PRESETS.map((p) => ({
              id: p.id,
              label: p.label,
              testId: `flow-sim-preset-${p.id}`,
            }))}
            value={preset.id}
            onChange={handlePresetChange}
            maxMobile={2}
            maxTablet={3}
            maxDesktop={3}
            variant="pill"
          />
        </div>

        {/* Clean Single Glass Container */}
        <div className="rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_14px_38px_-22px_rgba(15,23,42,0.14)] p-4 sm:p-6 lg:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-center">
            {/* Left (5 cols): Clean Connected Step Timeline */}
            <div className="lg:col-span-5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-1 pb-1">
                <span>Chọn bước để xem màn hình cấu hình</span>
                <span className="text-[#1E40FF] font-bold">{preset.conversionRate}</span>
              </div>

              <div className="space-y-1.5">
                {preset.nodes.map((node, idx) => {
                  const st = NODE_META[node.stepType];
                  const Icon = st.icon;
                  const isSelected = node.id === activeNode.id;

                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`w-full text-left rounded-2xl px-3.5 py-2.5 border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#EEF4FF] to-white border-[#1E40FF]/60 shadow-[0_8px_20px_-12px_rgba(30,64,255,0.4)]'
                          : 'bg-white border-slate-200/80 hover:border-blue-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#1E40FF] text-white border-[#1E40FF]'
                              : st.pillClass
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                              0{idx + 1}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                              {st.label}
                            </span>
                            {node.branch === 'yes' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ĐÚNG
                              </span>
                            )}
                            {node.branch === 'no' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                DỰ PHÒNG
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-[13px] font-bold text-slate-900 truncate">
                            {node.title}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                        {node.timingLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right (7 cols): Crisp macOS Browser Frame + Minimal Footer (Zero Blue Banner Clutter) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-slate-200/95 bg-white shadow-sm">
                {/* Light macOS Chrome Bar */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 max-w-sm px-3 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-500 truncate text-center">
                    https://app.domation.net/marketing/flows
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onInspectImage(
                        activeNode.screenshot,
                        activeNode.title,
                        activeNode.previewHeadline
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E40FF] hover:underline cursor-pointer shrink-0"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Phóng to</span>
                  </button>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    onInspectImage(
                      activeNode.screenshot,
                      activeNode.title,
                      activeNode.previewHeadline
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onInspectImage(
                        activeNode.screenshot,
                        activeNode.title,
                        activeNode.previewHeadline
                      );
                    }
                  }}
                  aria-label={`Phóng to ${activeNode.title}`}
                  className="bg-white cursor-zoom-in overflow-hidden"
                >
                  <SmoothAppImage
                    src={activeNode.screenshot}
                    alt={activeNode.title}
                    aspectClass="aspect-[16/10]"
                    fit="contain"
                    hoverZoom={false}
                    bgClass="bg-white"
                  />
                </div>
              </div>

              {/* Minimal Light Caption Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E40FF]">
                      {activeMeta.label}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {activeNode.metricsChip}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {activeNode.previewHeadline}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {activeNode.previewSummary}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenContact(`Tư vấn thiết kế Flow: ${preset.label}`)}
                  className="btn-inkica-primary text-xs px-4 py-2.5 rounded-xl shrink-0 self-start sm:self-center whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Dựng Kịch Bản Này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
