import React, { useMemo, useState } from 'react';
import { ExternalLink, Layers, PlayCircle, ZoomIn } from 'lucide-react';
import { GlassModal, ImageZoomModal } from './GlassModal';
import { MODAL_SCREEN_GALLERIES, type SolutionPillar } from '../data/enterpriseData';
import { handleSpaLinkClick } from '../utils/navigation';

export type InspectionTabId = SolutionPillar['id'] | 'inkica';

interface ProductInspectionModalProps {
  isOpen: boolean;
  initialTab: InspectionTabId;
  onClose: () => void;
  onOpenContact?: (topic?: string) => void;
}

const TAB_LABELS: { id: InspectionTabId; short: string; count: string }[] = [
  { id: 'data-capi', short: 'Auto Data & CAPI', count: '8' },
  { id: 'erp', short: 'ERP 5.0 Suite', count: '18' },
  { id: 'crm', short: 'CRM 360°', count: '9' },
  { id: 'autoflow', short: 'AI & Automation', count: '6' },
  { id: 'meta-report', short: 'Meta Ad Report', count: '12 + Video' },
  { id: 'web-3d', short: 'Web 3D & Landing', count: '11' },
  { id: 'inkica', short: 'INKICA Studio', count: '5' },
];

export const ProductInspectionModal: React.FC<ProductInspectionModalProps> = ({
  isOpen,
  initialTab,
  onClose,
  onOpenContact,
}) => {
  const [activeTab, setActiveTab] = useState<InspectionTabId>(initialTab);
  const [erpCategory, setErpCategory] = useState<string>('Tất cả');
  const [zoomedItem, setZoomedItem] = useState<{
    src: string;
    title: string;
    badge?: string;
    desc?: string;
  } | null>(null);

  const openSyncKey = `${isOpen}:${initialTab}`;
  const [prevOpenSyncKey, setPrevOpenSyncKey] = useState(openSyncKey);
  if (openSyncKey !== prevOpenSyncKey) {
    setPrevOpenSyncKey(openSyncKey);
    if (isOpen) {
      setActiveTab(initialTab);
      setErpCategory('Tất cả');
    }
  }

  const currentGallery = MODAL_SCREEN_GALLERIES[activeTab] || MODAL_SCREEN_GALLERIES['data-capi'];

  const erpCategories = useMemo(() => {
    if (activeTab !== 'erp') return [];
    const cats = new Set<string>(['Tất cả']);
    currentGallery.items.forEach((it) => {
      if (it.category) cats.add(it.category);
    });
    return Array.from(cats);
  }, [activeTab, currentGallery]);

  const visibleItems = useMemo(() => {
    if (activeTab !== 'erp' || erpCategory === 'Tất cả') return currentGallery.items;
    return currentGallery.items.filter((it) => it.category === erpCategory);
  }, [activeTab, erpCategory, currentGallery]);

  return (
    <>
      <GlassModal
        isOpen={isOpen}
        onClose={onClose}
        eyebrow="PHÒNG TRƯNG BÀY SẢN PHẨM THỰC TẾ"
        title={currentGallery.title}
        subtitle={currentGallery.subtitle}
        maxWidthClass="max-w-6xl"
        headerActions={
          currentGallery.liveUrl && (
            <a
              href={currentGallery.liveUrl}
              target={currentGallery.liveUrl.startsWith('/') ? undefined : '_blank'}
              rel={currentGallery.liveUrl.startsWith('/') ? undefined : 'noopener noreferrer'}
              onClick={
                currentGallery.liveUrl.startsWith('/')
                  ? (e) => {
                      onClose();
                      handleSpaLinkClick(e, currentGallery.liveUrl!);
                    }
                  : undefined
              }
              className="btn-inkica-primary px-3.5 py-2 text-xs hidden sm:inline-flex"
            >
              <span>{currentGallery.liveLabel || 'Xem Demo'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )
        }
      >
        {/* Switcher Tabs — Single Compact Row */}
        <div className="flex items-center lg:justify-between gap-1.5 pb-3.5 mb-5 border-b border-slate-100 overflow-x-auto flex-nowrap">
          {TAB_LABELS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setErpCategory('Tất cả');
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  active
                    ? 'ql-pill-tab-active'
                    : 'ql-pill-tab'
                }`}
              >
                <span>{tab.short}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ERP Category Filter */}
        {activeTab === 'erp' && erpCategories.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-5 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#1E40FF]" /> Phân hệ:
            </span>
            {erpCategories.map((cat) => {
              const selected = erpCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setErpCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    selected
                      ? 'bg-[#1E40FF] text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Embedded YouTube Demo if available (e.g. Meta Ad Report) */}
        {currentGallery.youtubeEmbed && (
          <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-lg">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white text-xs font-bold">
              <span className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-cyan-400" />
                Video Demo Kết Nối & Đọc Số Liệu Meta Ads Realtime
              </span>
              <span className="text-[10px] text-slate-400 font-mono">YouTube HD</span>
            </div>
            <div className="aspect-video w-full">
              <iframe
                src={currentGallery.youtubeEmbed}
                title="Meta Ads Report Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Screenshots Grid inside Modal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {visibleItems.map((item, idx) => (
            <button
              key={`${activeTab}-${idx}-${item.src}`}
              type="button"
              onClick={() => setZoomedItem(item)}
              className="group text-left rounded-2xl border border-slate-200/85 bg-white hover:border-slate-300 hover:shadow-[0_14px_32px_-12px_rgba(15,23,42,0.12)] transition-all overflow-hidden flex flex-col cursor-pointer"
            >
              <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2.5">
                  <span className="px-2.5 py-1 rounded-full bg-white/95 text-slate-900 text-[10px] font-bold flex items-center gap-1 shadow">
                    <ZoomIn className="w-3 h-3 text-[#1E40FF]" /> Phóng to
                  </span>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 flex-1 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E40FF] mb-1">
                  {item.badge}
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-[#1E40FF] transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                  {item.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Modal Footer Action */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Nhấn vào từng màn hình để phóng to chi tiết. Tất cả dữ liệu nhạy cảm đều được che bảo mật.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {currentGallery.liveUrl && (
              <a
                href={currentGallery.liveUrl}
                target={currentGallery.liveUrl.startsWith('/') ? undefined : '_blank'}
                rel={currentGallery.liveUrl.startsWith('/') ? undefined : 'noopener noreferrer'}
                onClick={
                  currentGallery.liveUrl.startsWith('/')
                    ? (e) => {
                        onClose();
                        handleSpaLinkClick(e, currentGallery.liveUrl!);
                      }
                    : undefined
                }
                className="ql-btn-outline px-4 py-2 text-xs sm:hidden"
              >
                <span>{currentGallery.liveLabel || 'Mở Demo'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenContact?.(`Tư vấn triển khai ${currentGallery.title}`);
              }}
              className="btn-inkica-primary px-5 py-2.5 text-xs cursor-pointer"
            >
              Đặt Lịch Demo Trực Tiếp Cho Doanh Nghiệp
            </button>
          </div>
        </div>
      </GlassModal>

      <ImageZoomModal image={zoomedItem} onClose={() => setZoomedItem(null)} />
    </>
  );
};
