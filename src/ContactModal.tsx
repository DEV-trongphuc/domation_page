import React, { useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { GlassModal } from './components/GlassModal';
import { DomationLogoMark } from './components/DomationLogoMark';

const APPS_SCRIPT_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbw3rzpfXvneN7mAVgvUFAmrP0BvkdU1yK1JCyiCAJp49bI_HRTr1Lkp07Q4BahEzYko2w/exec';

export interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeColor?: string;
  defaultService?: string;
  defaultNote?: string;
}

const SERVICE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Marketing Automation & AI', value: 'Marketing Automation & Trợ lý AI Phòng ban (RAG)' },
  { label: 'Auto Chia Data & CAPI', value: 'Hệ thống Auto Chia Data ZaloBot & Meta CAPI' },
  { label: 'Enterprise ERP 5.0', value: 'Enterprise ERP 5.0 (12 Phân hệ • Chấm công GPS & Payroll)' },
  { label: 'CRM 360° & Bán Hàng', value: 'CRM 360° & Quản trị Bán hàng' },
  { label: 'Website & Sa bàn 3D', value: 'Website Chuyên Nghiệp & Sa bàn 3D WebGL (Từ 12.0M₫)' },
  { label: 'Hạ tầng Dữ liệu Riêng', value: 'Tư vấn Chuyển đổi số & Hạ tầng Dữ liệu Riêng' },
];

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  defaultService,
  defaultNote,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [service, setService] = useState(defaultService || SERVICE_OPTIONS[0].value);
  const [message, setMessage] = useState(defaultNote || '');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const openSyncKey = `${isOpen}:${defaultService || ''}:${defaultNote || ''}`;
  const [prevOpenSyncKey, setPrevOpenSyncKey] = useState(openSyncKey);
  if (openSyncKey !== prevOpenSyncKey) {
    setPrevOpenSyncKey(openSyncKey);
    if (isOpen) {
      setStatus('idle');
      setErrorMsg('');
      if (defaultService) setService(defaultService);
      if (defaultNote) setMessage(defaultNote);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!name.trim() || cleanPhone.length < 9) {
      setErrorMsg('Vui lòng nhập Họ tên và Số điện thoại / Zalo hợp lệ.');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const payload = {
        name: name.trim(),
        phone: cleanPhone,
        company: company.trim() || 'Chưa cung cấp',
        service,
        message: message.trim() || 'Yêu cầu tư vấn kiến trúc giải pháp DOMATION Enterprise',
        source: 'domation.net',
        submittedAt: new Date().toISOString(),
      };

      await fetch(APPS_SCRIPT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      setStatus('success');
      setName('');
      setPhone('');
      setCompany('');
      setMessage('');
    } catch {
      setStatus('error');
      setErrorMsg(
        'Kết nối gián đoạn tạm thời. Anh/chị vui lòng bấm Chat Zalo trực tiếp 0378.859.736 để được hỗ trợ ngay!'
      );
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-4xl"
      hideHeader
      noPaddingBody
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Left: Sleek Royal-to-Sky Blue Gradient Direct Panel */}
        <div className="lg:col-span-5 relative overflow-hidden bg-gradient-to-br from-[#1E40FF] via-[#1D4ED8] to-[#0284C7] text-white p-6 sm:p-7 flex flex-col justify-between gap-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-cyan-300/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-16 w-60 h-60 rounded-full bg-indigo-950/25 blur-3xl"
          />

          <div className="relative z-10 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-xl bg-white/95 shadow-sm">
                  <DomationLogoMark className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-sm font-extrabold tracking-tight text-white">
                    DOMATION.NET
                  </div>
                  <div className="text-[11px] font-medium text-blue-100">
                    Huỳnh Trọng Phúc • Architect
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Online
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight text-white">
                Đặt Lịch Demo &amp; Tư Vấn 1-1
              </h3>
              <p className="text-xs sm:text-[13px] text-blue-100/95 leading-relaxed">
                Khảo sát trực tiếp quy trình thực tế, tư vấn gói triển khai phù hợp và setup từ A–Z.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <a
                href="https://zalo.me/0378859736"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-white/12 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white text-[#0068FF] font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                    Zalo
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">Chat Zalo Trực Tiếp</div>
                    <div className="text-[11px] text-blue-100 font-mono">0378.859.736</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-blue-100 group-hover:text-white transition-colors shrink-0" />
              </a>

              <a
                href="https://www.facebook.com/turni0"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 backdrop-blur-md transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">Facebook Messenger</div>
                    <div className="text-[11px] text-blue-100">fb.com/turni0</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-blue-100 group-hover:text-white transition-colors shrink-0" />
              </a>

              <a
                href="mailto:turniodev@gmail.com"
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/16 border border-white/15 text-xs text-white font-medium transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                <span className="truncate">turniodev@gmail.com</span>
              </a>
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-white/20 flex items-center gap-2 text-[11px] text-blue-50 font-medium">
            <ShieldCheck className="w-4 h-4 text-cyan-200 shrink-0" />
            <span>Phản hồi 15 phút • Bảo mật NDA 100%</span>
          </div>
        </div>

        {/* Right: Minimal Clean Form */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-7 flex flex-col justify-center relative">
          <button
            type="button"
            data-dom-overlay-close="true"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="hidden sm:flex absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-[#1E40FF] border border-slate-200/80 items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {status === 'success' ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8 flex flex-col items-center justify-center text-center my-auto">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">
                Đã Tiếp Nhận Yêu Cầu Tư Vấn!
              </h4>
              <p className="text-sm text-slate-600 mt-2 max-w-md leading-relaxed">
                Thông tin của anh/chị đã gửi về hệ thống DOMATION. Đội ngũ kỹ sư sẽ liên hệ qua Zalo hoặc Điện thoại trong 15 phút.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="ql-btn-outline px-4 py-2 text-xs cursor-pointer"
                >
                  Gửi Yêu Cầu Khác
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-inkica-primary px-5 py-2 text-xs cursor-pointer"
                >
                  Hoàn Tất
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-1 sm:pr-10">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Thông tin nhận demo &amp; báo giá
                </div>
                <button
                  type="button"
                  data-dom-overlay-close="true"
                  onClick={onClose}
                  aria-label="Đóng cửa sổ"
                  className="sm:hidden w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Họ và Tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Nguyễn Minh Anh"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Số Điện Thoại / Zalo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 09xx xxx xxx"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Doanh Nghiệp / Thương Hiệu
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="VD: Công ty BĐS / Nha khoa / Giáo dục..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Giải Pháp Quan Tâm
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_OPTIONS.map((opt) => {
                    const active = service === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setService(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          active
                            ? 'bg-[#1E40FF] text-white border-[#1E40FF] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Mô Tả Nhu Cầu Ngắn Gọn
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="VD: Cần thiết lập Flow Email + Zalo ZNS chăm sóc học viên hoặc chia data..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full btn-inkica-primary py-3 px-6 text-sm cursor-pointer disabled:opacity-60 rounded-xl"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang Gửi Thông Tin...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi Yêu Cầu Demo &amp; Nhận Báo Giá</span>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </GlassModal>
  );
};
