import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { DomationLogoMark } from './DomationLogoMark';
import { ContactModal } from '../ContactModal';
import { handleSpaLinkClick } from '../utils/navigation';

export interface DomationFooterProps {
  onOpenContact?: () => void;
}

export const DomationFooter: React.FC<DomationFooterProps> = ({ onOpenContact }) => {
  const [internalContactOpen, setInternalContactOpen] = useState(false);

  const handleOpenContact = () => {
    if (onOpenContact) {
      onOpenContact();
      return;
    }
    setInternalContactOpen(true);
  };

  return (
    <>
      <footer className="relative z-10 bg-gradient-to-br from-slate-950 via-[#0F172A] to-[#0A2568] text-white border-t border-slate-800/40 pt-14 pb-20 sm:pb-10 px-4 sm:px-6 mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <DomationLogoMark className="w-10 h-10 shrink-0 shadow-md" />
                <div>
                  <div className="text-lg font-bold tracking-tight">
                    DOMATION<span className="text-cyan-400">.NET</span>
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Bespoke Enterprise OS &amp; AI Agent
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                Thiết kế riêng kiến trúc ERP 5.0, CRM 360°, Flow rẽ nhánh và đội ngũ AI Agent đồng bộ đa nền tảng cho từng doanh nghiệp.
              </p>
            </div>

            <div className="md:col-span-3 space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                Chuyên Trang Giải Pháp
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <a
                    href="/erp"
                    onClick={(e) => handleSpaLinkClick(e, '/erp')}
                    className="hover:text-white transition-colors"
                  >
                    Enterprise ERP 5.0
                  </a>
                </li>
                <li>
                  <a
                    href="/crm"
                    onClick={(e) => handleSpaLinkClick(e, '/crm')}
                    className="hover:text-white transition-colors"
                  >
                    CRM 360° &amp; Quản Trị Bán Hàng
                  </a>
                </li>
                <li>
                  <a
                    href="/automation"
                    onClick={(e) => handleSpaLinkClick(e, '/automation')}
                    className="hover:text-white transition-colors"
                  >
                    AI Agent &amp; Flow Automation
                  </a>
                </li>
                <li>
                  <a
                    href="/data"
                    onClick={(e) => handleSpaLinkClick(e, '/data')}
                    className="hover:text-white transition-colors"
                  >
                    Auto Chia Data &amp; Meta CAPI
                  </a>
                </li>
                <li>
                  <a
                    href="/meta-report"
                    onClick={(e) => handleSpaLinkClick(e, '/meta-report')}
                    className="hover:text-white transition-colors"
                  >
                    Meta Ads Realtime Report
                  </a>
                </li>
                <li>
                  <a
                    href="/web-design"
                    onClick={(e) => handleSpaLinkClick(e, '/web-design')}
                    className="hover:text-white transition-colors"
                  >
                    Thiết Kế Website Thương Hiệu
                  </a>
                </li>
                <li>
                  <a
                    href="/portfolio"
                    onClick={(e) => handleSpaLinkClick(e, '/portfolio')}
                    className="hover:text-white transition-colors text-cyan-200 font-semibold"
                  >
                    Portfolio &amp; Case Study Đa Ngành
                  </a>
                </li>
                <li>
                  <a
                    href="/boost"
                    onClick={(e) => handleSpaLinkClick(e, '/boost')}
                    className="hover:text-white transition-colors text-cyan-200 font-semibold"
                  >
                    Blog DOMATION • Kiến Thức &amp; SEO
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                Kết Nối Solution Architect
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <div>
                  Hotline / Zalo:{' '}
                  <a
                    href="https://zalo.me/0378859736"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white hover:text-cyan-300 font-mono"
                  >
                    0378.859.736
                  </a>
                </div>
                <div>
                  Email:{' '}
                  <a
                    href="mailto:turniodev@gmail.com"
                    className="font-semibold text-white hover:text-cyan-300"
                  >
                    turniodev@gmail.com
                  </a>
                </div>
                <div>
                  Facebook:{' '}
                  <a
                    href="https://www.facebook.com/turni0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white hover:text-cyan-300"
                  >
                    fb.com/turni0
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenContact}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-blue-500/30 border border-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Đặt Lịch Tư Vấn 1-1</span>
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>© 2026 DOMATION Enterprise Technology. All rights reserved.</span>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span>Bespoke Enterprise Architecture • AI Agent Systems.</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span>
                Powered by{' '}
                <a
                  href="https://turnio.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:text-cyan-200 hover:underline font-semibold"
                >
                  Turnio DEV
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {!onOpenContact && (
        <ContactModal
          isOpen={internalContactOpen}
          onClose={() => setInternalContactOpen(false)}
        />
      )}
    </>
  );
};
