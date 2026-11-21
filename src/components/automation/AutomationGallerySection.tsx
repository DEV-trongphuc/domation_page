import React, { useMemo, useState } from 'react';
import { Expand, LayoutGrid, Smartphone } from 'lucide-react';
import { DomResponsiveSubtabs } from '../dom-meta/DomMetaSelect';
import { SmoothAppImage } from '../SmoothAppImage';
import {
  AUTOMATION_SCREENS,
  type AutomationScreenCategory,
  type AutomationScreenItem,
} from './automationShowcaseData';

interface AutomationGallerySectionProps {
  onInspectScreen: (screen: AutomationScreenItem) => void;
}

const FILTER_TABS: Array<{ id: 'all' | AutomationScreenCategory; label: string }> = [
  { id: 'all', label: 'Tất cả Màn hình' },
  { id: 'flows', label: 'Flow & Trigger' },
  { id: 'campaigns', label: 'Email & Voucher' },
  { id: 'omnichannel', label: 'Zalo, Messenger & AI' },
  { id: 'analytics', label: 'Phân tích & CAPI' },
];

export const AutomationGallerySection: React.FC<AutomationGallerySectionProps> = ({
  onInspectScreen,
}) => {
  const [filterCat, setFilterCat] = useState<'all' | AutomationScreenCategory>('all');

  const desktopScreens = useMemo(() => {
    const allDesktop = AUTOMATION_SCREENS.filter((s) => !s.isMobile);
    if (filterCat === 'all') return allDesktop;
    return allDesktop.filter((s) => s.category === filterCat);
  }, [filterCat]);

  const mobileScreens = useMemo(
    () => AUTOMATION_SCREENS.filter((s) => s.isMobile),
    []
  );

  return (
    <section
      id="screens-gallery"
      className="scroll-mt-24 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative z-10"
    >
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14">
        {/* Desktop Modules Filterable Gallery */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="ql-eyebrow">
                <LayoutGrid className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                <span>20+ PHÂN HỆ AUTOMATION THỰC TẾ</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                Khám Phá Trọn Bộ Màn Hình{' '}
                <span className="text-gradient-inkica">App DOMATION Marketing</span>
              </h2>
            </div>

            <DomResponsiveSubtabs
              tabs={FILTER_TABS.map((t) => ({
                id: t.id,
                label: t.label,
                badge:
                  t.id === 'all'
                    ? AUTOMATION_SCREENS.filter((s) => !s.isMobile).length
                    : AUTOMATION_SCREENS.filter((s) => !s.isMobile && s.category === t.id).length,
              }))}
              value={filterCat}
              onChange={(id) => setFilterCat(id as 'all' | AutomationScreenCategory)}
              maxMobile={2}
              maxTablet={4}
              maxDesktop={5}
              variant="pill"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {desktopScreens.map((screen) => (
              <div
                key={screen.id}
                onClick={() => onInspectScreen(screen)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onInspectScreen(screen);
                  }
                }}
                aria-label={`Phóng to ${screen.title}`}
                className="group rounded-2xl bg-white/92 border border-slate-200/90 hover:border-blue-300 shadow-xs hover:shadow-[0_18px_40px_-20px_rgba(30,64,255,0.24)] transition-all overflow-hidden flex flex-col cursor-zoom-in"
              >
                <div className="relative bg-slate-50 border-b border-slate-200/80 overflow-hidden">
                  <SmoothAppImage
                    src={screen.image}
                    alt={screen.title}
                    aspectClass="aspect-[16/10]"
                    fit="contain"
                    bgClass="bg-slate-50"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/95 border border-slate-200/90 text-slate-700 shadow-2xs">
                      {screen.modeTag}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-slate-900/85 text-white flex items-center justify-center shadow">
                    <Expand className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#1E40FF]">
                      {screen.tabLabel}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {screen.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {screen.subtitle}
                    </p>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 bg-[#F8FAFF] border border-slate-200/80 rounded-lg px-2.5 py-1 truncate">
                    {screen.badgeText}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* iOS Mobile App Showcase Band */}
        <div className="rounded-[28px] bg-gradient-to-br from-[#F8FAFF] via-white to-sky-50/70 border border-slate-200/90 shadow-[0_22px_58px_-28px_rgba(2,132,199,0.2)] p-5 sm:p-8 lg:p-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div className="space-y-2 max-w-2xl">
              <div className="ql-eyebrow">
                <Smartphone className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                <span>TRẢI NGHIỆM MOBILE 390PX CHUẨN APP iOS</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-bold text-slate-900 leading-snug">
                Theo Dõi Chiến Dịch &amp;{' '}
                <span className="text-gradient-inkica">Duyệt Flow Tức Thì Trên Điện Thoại</span>
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 self-start md:self-auto">
              0px tràn ngang • Segmented Tabs 1 hàng
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {mobileScreens.map((m) => (
              <div
                key={m.id}
                onClick={() => onInspectScreen(m)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onInspectScreen(m);
                  }
                }}
                aria-label={`Phóng to giao diện mobile ${m.title}`}
                className="group rounded-[26px] bg-white border-2 border-slate-200 hover:border-[#1E40FF] shadow-sm hover:shadow-lg transition-all p-2.5 flex flex-col gap-2.5 cursor-zoom-in"
              >
                <div className="mx-auto w-14 h-1 rounded-full bg-slate-200 my-0.5" />
                <div className="rounded-[18px] overflow-hidden border border-slate-200/80 bg-slate-50">
                  <SmoothAppImage
                    src={m.image}
                    alt={m.title}
                    aspectClass="aspect-[390/844]"
                    fit="cover"
                    bgClass="bg-slate-50"
                  />
                </div>
                <div className="px-1.5 pb-1 space-y-0.5 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#0284C7]">
                    {m.tabLabel}
                  </div>
                  <div className="text-xs font-bold text-slate-900 line-clamp-2">
                    {m.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
