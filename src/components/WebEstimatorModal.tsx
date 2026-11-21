import React, { useMemo, useState } from 'react';
import { Calculator, CheckSquare, ExternalLink, Sparkles, Square } from 'lucide-react';
import { GlassModal } from './GlassModal';
import { SPECIALIST_ZALO_URL } from './common/ZaloSpecialistBanner';
import { DOMATION_WEB_ADDONS, DOMATION_WEB_MODULES } from '../data/enterpriseData';
import { handleSpaLinkClick } from '../utils/navigation';

interface WebEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote: (summaryText: string) => void;
}

const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + '₫';

export const WebEstimatorModal: React.FC<WebEstimatorModalProps> = ({
  isOpen,
  onClose,
  onRequestQuote,
}) => {
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    DOMATION_WEB_MODULES.forEach((m) => {
      init[m.id] = true;
    });
    return init;
  });

  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({
    crmErp: true,
  });

  const moduleTotal = useMemo(
    () =>
      DOMATION_WEB_MODULES.reduce(
        (acc, mod) => (selectedModules[mod.id] ? acc + mod.price : acc),
        0
      ),
    [selectedModules]
  );

  const addonTotal = useMemo(
    () =>
      DOMATION_WEB_ADDONS.reduce(
        (acc, add) => (selectedAddons[add.id] ? acc + add.price : acc),
        0
      ),
    [selectedAddons]
  );

  const grandTotal = moduleTotal + addonTotal;

  const toggleModule = (id: string) =>
    setSelectedModules((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleAddon = (id: string) =>
    setSelectedAddons((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSubmitQuote = () => {
    const mods = DOMATION_WEB_MODULES.filter((m) => selectedModules[m.id]).map((m) => m.name);
    const adds = DOMATION_WEB_ADDONS.filter((a) => selectedAddons[a.id]).map((a) => a.name);
    const summary = `Dự toán Website (${formatVnd(grandTotal)}): ${mods.length} module lõi${
      adds.length ? ` + Add-on: ${adds.join(', ')}` : ''
    }`;
    onClose();
    onRequestQuote(summary);
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="DỰ TOÁN CHI PHÍ MINH BẠCH • WEB & CRM SYNC"
      title="Máy Tính Dự Toán Thiết Kế Website Doanh Nghiệp"
      subtitle="Chọn các phân hệ lõi và tính năng mở rộng theo nhu cầu thực tế của doanh nghiệp. Bàn giao 100% mã nguồn & hỗ trợ đồng bộ Lead về CRM/ZaloBot."
      maxWidthClass="max-w-5xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left selection columns */}
        <div className="lg:col-span-7 space-y-6">
          {/* Core modules */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#1E40FF] flex items-center justify-center text-xs font-extrabold">
                  1
                </span>
                Gói Website Tiêu Chuẩn (Trọn Bộ 12.000.000₫)
              </h4>
              <span className="text-xs font-bold text-[#1E40FF]">{formatVnd(moduleTotal)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DOMATION_WEB_MODULES.map((mod) => {
                const checked = !!selectedModules[mod.id];
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => toggleModule(mod.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                      checked
                        ? 'bg-blue-50/75 border-blue-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 leading-snug">{mod.name}</div>
                      <div className="text-[11px] font-bold text-[#0284C7] mt-1">
                        {formatVnd(mod.price)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add-on integrations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-50 text-[#0284C7] flex items-center justify-center text-xs font-extrabold">
                  2
                </span>
                Tính Năng Mở Rộng & Kết Nối Hệ Sinh Thái
              </h4>
              <span className="text-xs font-bold text-[#0284C7]">{formatVnd(addonTotal)}</span>
            </div>

            <div className="space-y-2.5">
              {DOMATION_WEB_ADDONS.map((addon) => {
                const checked = !!selectedAddons[addon.id];
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon.id)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      checked
                        ? 'bg-gradient-to-r from-blue-50/90 to-cyan-50/70 border-blue-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {addon.name}
                        </span>
                        <span className="text-xs font-extrabold text-[#1E40FF] shrink-0">
                          +{formatVnd(addon.price)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{addon.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right sticky summary card */}
        <div className="lg:col-span-5">
          <div className="sticky top-0 rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-slate-950 via-[#0F172A] to-[#0A2568] text-white shadow-xl border border-blue-400/25">
            <div className="flex items-center gap-2 text-cyan-300 text-[11px] font-bold uppercase tracking-widest mb-2">
              <Calculator className="w-4 h-4" /> Tổng Dự Toán Đầu Tư
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {formatVnd(grandTotal)}
            </div>
            <p className="text-xs text-slate-300 mt-1.5">
              Đã bao gồm tư vấn kiến trúc chuyển đổi, tối ưu tốc độ {'< 3s'} & bảo hành kỹ thuật 12 tháng.
            </p>

            <div className="my-5 pt-4 border-t border-white/15 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Phân hệ nền tảng ({DOMATION_WEB_MODULES.filter((m) => selectedModules[m.id]).length}/8 mục)</span>
                <span className="font-bold text-white">{formatVnd(moduleTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tích hợp & mở rộng ({DOMATION_WEB_ADDONS.filter((a) => selectedAddons[a.id]).length} mục)</span>
                <span className="font-bold text-cyan-300">{formatVnd(addonTotal)}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <a
                href={SPECIALIST_ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-[#0068FF] hover:bg-[#1A7AFF] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Nhờ Chuyên Viên Tạo Qua Zalo</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSubmitQuote}
                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Gửi Dự Toán</span>
                </button>
                <a
                  href="/web-design"
                  onClick={(e) => {
                    onClose();
                    handleSpaLinkClick(e, '/web-design');
                  }}
                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/15 transition-colors whitespace-nowrap"
                >
                  <span>Bảng Giá</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassModal>
  );
};
