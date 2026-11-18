import React, { useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
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
  { label: 'Auto Chia Data & Meta CAPI', value: 'Hệ thống Auto Chia Data ZaloBot & Meta CAPI' },
  { label: 'Enterprise ERP 5.0', value: 'Enterprise ERP 5.0 (12 Phân hệ • Chấm công GPS & Payroll)' },
  { label: 'CRM 360° & Bán Hàng', value: 'CRM 360° & Quản trị Bán hàng' },
  { label: 'Automation & AI RAG', value: 'Marketing Automation & Trợ lý AI Phòng ban (RAG)' },
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
      setErrorMsg('Vui lòng nhập Họ tên và Số điện thoại / Zalo hợp lệ để đội ngũ liên hệ.');
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
        'Kết nối gián đoạn tạm thời. Anh/chị vui lòng bấm kết nối Zalo trực tiếp 0378.859.736 để được hỗ trợ tức thì!'
      );
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="KẾT NỐI TRỰC TIẾP ĐỘI NGŨ KIẾN TRÚC DOMATION"
      title="Đặt Lịch Demo & Tư Vấn Giải Pháp"
      subtitle="Trao đổi trực tiếp 1-1 với Solution Architect về quy trình triển khai, chi phí và lộ trình bàn giao thực tế."
      maxWidthClass="max-w-4xl"
    >
      <div className="rounded-[24px] border border-slate-200/85 bg-white/90 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
        {/* Left: Light Swiss Glass Architect & Direct Channels */}
        <div className="lg:col-span-5 p-5 sm:p-6 bg-gradient-to-br from-[#F4F8FF]/90 via-white to-slate-50/80 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
              <div className="flex items-center gap-3 min-w-0">
                <DomationLogoMark className="w-10 h-10 shrink-0 shadow-xs" />
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900 truncate">
                    DOMATION Enterprise
                  </div>
                  <div className="text-[11px] font-semibold text-[#1E40FF] truncate">
                    Huỳnh Trọng Phúc • Solution Architect
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>

            <div className="space-y-2">
              <a
                href="https://zalo.me/0378859736"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-[#0068FF]/50 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#0068FF] text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    Zalo
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900">Chat Zalo Trực Tiếp</div>
                    <div className="text-[11px] text-slate-500 font-mono">0378.859.736</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#0068FF] transition-colors shrink-0" />
              </a>

              <a
                href="https://www.facebook.com/turni0"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-[#1E40FF]/50 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#1E40FF] flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900">Facebook Messenger</div>
                    <div className="text-[11px] text-slate-500">fb.com/turni0</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#1E40FF] transition-colors shrink-0" />
              </a>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 pt-1">
                <a
                  href="mailto:turniodev@gmail.com"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/80 border border-slate-200/80 hover:border-blue-200 text-xs text-slate-700 font-medium transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                  <span className="truncate">turniodev@gmail.com</span>
                </a>
                <a
                  href="tel:0378859736"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/80 border border-slate-200/80 hover:border-emerald-200 text-xs text-slate-800 font-mono font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>0378.859.736</span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/80 space-y-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
              <span>Phản hồi nhanh trong 15 phút (giờ hành chính)</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Bảo mật NDA 100% dữ liệu &amp; ý tưởng doanh nghiệp</span>
            </div>
          </div>
        </div>

        {/* Right: Clean Pill-Based Lead Request Form */}
        <div className="lg:col-span-7 p-5 sm:p-6 bg-white">
          {status === 'success' ? (
            <div className="h-full min-h-[340px] rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">
                Đã Tiếp Nhận Yêu Cầu Tư Vấn!
              </h4>
              <p className="text-sm text-slate-600 mt-2 max-w-md leading-relaxed">
                Thông tin của anh/chị đã được gửi thẳng về hệ thống điều phối DOMATION. Đội ngũ kỹ sư sẽ liên hệ qua Zalo hoặc Điện thoại trong thời gian sớm nhất.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="ql-btn-outline px-4 py-2 text-xs cursor-pointer"
                >
                  Gửi Thêm Yêu Cầu Khác
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
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
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
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
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Doanh Nghiệp / Thương Hiệu
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="VD: Công ty BĐS / Nha khoa / Chuỗi bán lẻ..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
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
                            : 'bg-slate-50/80 text-slate-700 border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mô Tả Nhu Cầu Hoặc Mục Tiêu Triển Khai
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="VD: Cần chia data tự động từ Meta Form về đội Sale qua ZaloBot và đồng bộ CAPI..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40FF] focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
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
                className="w-full btn-inkica-primary py-3.5 px-6 text-sm cursor-pointer disabled:opacity-60"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang Gửi Thông Tin Về Hệ Thống...</span>
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
