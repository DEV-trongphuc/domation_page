import React from 'react';
import { Expand, Layers, Sparkles } from 'lucide-react';
import { DomResponsiveSubtabs } from '../dom-meta/DomMetaSelect';
import { SmoothAppImage } from '../SmoothAppImage';
import type { AutomationScreenItem } from './automationShowcaseData';

interface AutomationInteractiveStageProps {
  screens: AutomationScreenItem[];
  activeId: string;
  onChangeActive: (id: string) => void;
  onInspectScreen: (screen: AutomationScreenItem) => void;
}

const TONE_BADGE_MAP: Record<string, string> = {
  blue: 'bg-blue-50 text-[#1E40FF] border-blue-200/80',
  sky: 'bg-sky-50 text-[#0284C7] border-sky-200/80',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
  red: 'bg-red-50 text-[#DC2626] border-red-200/80',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
};

export const AutomationInteractiveStage: React.FC<AutomationInteractiveStageProps> = ({
  screens,
  activeId,
  onChangeActive,
  onInspectScreen,
}) => {
  const activeScreen = screens.find((s) => s.id === activeId) || screens[0];

  return (
    <div className="space-y-4">
      {/* Unified Single-Row Tab Selector (DomResponsiveSubtabs for Mobile/Desktop Parity) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <DomResponsiveSubtabs
          tabs={screens.map((s) => ({
            id: s.id,
            label: s.tabLabel,
            testId: `automation-stage-tab-${s.id}`,
          }))}
          value={activeScreen.id}
          onChange={onChangeActive}
          maxMobile={2}
          maxTablet={4}
          maxDesktop={7}
          variant="pill"
          moreLabel="Thêm màn hình"
        />

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/95 border border-slate-200/90 text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeScreen.modeTag}</span>
          </span>
          <button
            type="button"
            onClick={() => onInspectScreen(activeScreen)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white hover:bg-blue-50 text-[#1E40FF] border border-blue-200/80 transition-colors cursor-pointer"
          >
            <Expand className="w-3.5 h-3.5" />
            <span>Phóng to</span>
          </button>
        </div>
      </div>

      {/* Main Browser Stage Card */}
      <div className="rounded-[24px] sm:rounded-[28px] bg-white/92 backdrop-blur-xl border border-slate-200/90 shadow-[0_28px_72px_-28px_rgba(30,64,255,0.22)] overflow-hidden">
        {/* Browser Chrome Bar */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50/95 border-b border-slate-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/85" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/85" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/85" />
            </div>
            <div className="ml-2 px-3 py-1 rounded-lg bg-white border border-slate-200/80 text-[11px] font-mono text-slate-500 truncate max-w-[210px] sm:max-w-[340px]">
              https://{activeScreen.routeLabel.replace(/\s+/g, '')}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1E40FF] border border-blue-100 tabular-nums">
              {activeScreen.badgeText}
            </span>
          </div>
        </div>

        {/* Visual Frame */}
        <div
          onClick={() => onInspectScreen(activeScreen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onInspectScreen(activeScreen);
            }
          }}
          aria-label={`Xem phóng to màn hình ${activeScreen.title}`}
          className="group relative bg-slate-50 cursor-zoom-in overflow-hidden border-b border-slate-200/75"
        >
          <SmoothAppImage
            src={activeScreen.image}
            alt={activeScreen.title}
            aspectClass="aspect-[16/10]"
            fit="contain"
            eager
            hoverZoom={false}
            bgClass="bg-slate-50"
            className="w-full"
          />

          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 text-white text-xs font-semibold shadow-lg pointer-events-none">
            <Expand className="w-3.5 h-3.5" />
            <span>Click để xem chi tiết HD</span>
          </div>
        </div>

        {/* Bottom Caption + Live KPI Strip */}
        <div className="p-4 sm:p-6 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1E40FF]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeScreen.eyebrow}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {activeScreen.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {activeScreen.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 shrink-0">
            {activeScreen.metrics.map((m) => (
              <div
                key={m.label}
                className={`px-3 py-2 rounded-xl border text-left ${TONE_BADGE_MAP[m.tone || 'blue']}`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80 whitespace-nowrap">
                  {m.label}
                </div>
                <div className="text-xs sm:text-sm font-extrabold tabular-nums whitespace-nowrap">
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Concise 3-highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {activeScreen.highlights.map((item) => (
          <div
            key={item}
            className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-white/85 border border-slate-200/80 text-xs text-slate-700 font-medium shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-[#1E40FF] shrink-0 mt-0.5" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
