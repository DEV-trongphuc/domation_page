import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Copy,
  HelpCircle,
  Sparkles,
  X,
} from 'lucide-react';
import { buildGoogleAppsScriptSnippet, type HelpTopicKey } from './autodataTypes';

interface HelpTopicMeta {
  badge: string;
  title: string;
  summary: string;
  bullets: string[];
  codeLabel?: string;
  getCode?: (webhookUrl?: string, saleEmail?: string) => string;
}

const HELP_TOPICS: Record<HelpTopicKey, HelpTopicMeta> = {
  internal_sale_default: {
    badge: 'MẶC ĐỊNH CHUẨN • SALE NỘI BỘ',
    title: 'Mặc định chia cho từng Sale nội bộ (is_external_agency = false)',
    summary:
      'Auto Data mặc định phân bổ trực tiếp cho từng nhân viên Sale cá nhân trong công ty. Sale nội bộ nhìn thấy đầy đủ Số Điện Thoại để gọi chốt khách ngay lập tức.',
    bullets: [
      'Mặc định: is_external_agency = false — Hiển thị đầy đủ SĐT (VD: 0912 888 678) cho Sale nội bộ phụ trách.',
      'Tùy chọn mở rộng: Chỉ khi doanh nghiệp bật công tắc "Chia thêm cho Đại lý ngoài / CTV F1", hệ thống mới kích hoạt che SĐT dạng 0912***678 đối với tài khoản F1.',
      'Mỗi Sale có Cổng làm việc riêng, nhận thông báo ZaloBot cá nhân và đồng bộ Google Sheets độc lập.',
    ],
    codeLabel: 'Cấu hình JSON mặc định khi khởi tạo',
    getCode: () =>
      `{\n  "is_external_agency": false,\n  "recipient_type": "internal_individual_sale",\n  "mask_pii_for_external": false\n}`,
  },
  round_robin_formula: {
    badge: 'THUẬT TOÁN ĐỊNH TUYẾN < 4 GIÂY',
    title: 'Công thức Chia Vòng Trọng Số & Xoay Vòng 1:1 (Round-Robin)',
    summary:
      'Bộ định tuyến tính toán điểm thiếu hụt (Deficit Score) theo thời gian thực giữa các Sale đang bật trạng thái Online để đảm bảo công bằng tuyệt đối.',
    bullets: [
      'Chia Trọng Số (Weighted Fair-Share): Ưu tiên Sale có tỷ lệ (Số Lead đã nhận / Trọng số KPI) thấp nhất. Ví dụ Senior x3 nhận 3 khách thì Junior x1 nhận 1 khách.',
      'Xoay Vòng 1:1 (Strict Round-Robin): Chia tuần tự theo con trỏ (cursor % N_sale_online).',
      'Sale bật chế độ Nghỉ phép (Offline) sẽ tạm ngưng nhận số mà không bị trôi mất định mức công bằng (Chỉ số Gini < 0.05).',
    ],
    codeLabel: 'Công thức tính ưu tiên nhận số (Deficit Fair-Share)',
    getCode: () =>
      `Deficit_Score(Sale_i) = Received_Ads_Count(Sale_i) / max(1, Weight(Sale_i))\nNext_Assignee = argmin_{Sale_i in Online_Pool} Deficit_Score(Sale_i)\n// Lưu ý: Lead cá nhân tự nhập tại Cổng Sale KHÔNG cộng vào Received_Ads_Count!`,
  },
  dedupe_90d: {
    badge: 'CHỐNG TRÙNG NGUYÊN TỬ 90 NGÀY',
    title: 'Cơ chế chuẩn hóa SĐT & Chống trùng 90 ngày đa chính sách',
    summary:
      'Mọi SĐT đổ về từ Facebook, TikTok, Website hay Google Sheets đều được chuẩn hóa đầu số Việt Nam (+84 → 0) và đối chiếu nguyên tử trong chu kỳ 90 ngày.',
    bullets: [
      'Chính sách 1 (Khuyên dùng): Trả về đúng Sale cũ đang chăm sóc kèm nhãn nhắc khách quay lại — chấm dứt tranh giành khách nội bộ.',
      'Chính sách 2: Ghi nối nguồn UTM mới vào hồ sơ sẵn có, không tạo thẻ rác.',
      'Chính sách 3 & 4: Mở vòng chia mới (khi chạy đa sản phẩm độc lập) hoặc Chặn trùng tuyệt đối ngay tại cổng.',
    ],
    codeLabel: 'Chuẩn hóa & Quét cửa sổ chống trùng',
    getCode: () =>
      `normalized_phone = raw_phone.replace(/^\\+84/, '0').replace(/\\D/g, '')\nis_duplicate = (now - existing_lead.created_at) <= 90_days`,
  },
  sla_recall: {
    badge: 'CAM KẾT TỐC ĐỘ PHẢN HỒI SLA',
    title: 'Tự động thu hồi SLA 15 phút & Đền bù số rác 1-đổi-1',
    summary:
      'Giữ "thời điểm vàng" 5 phút đầu khi khách vừa để lại thông tin trên quảng cáo, đồng thời bảo vệ quyền lợi định mức của từng Sale.',
    bullets: [
      'Thu hồi tự động (Auto-Recall): Nếu quá hạn SLA (mặc định 15 phút) mà Sale chưa bấm tiếp nhận, hệ thống tự thu hồi chuyển ngay cho Sale Online kế tiếp.',
      'Báo số rác 1-đổi-1: Gặp SĐT sai, thuê bao hoặc nhầm đối tượng, Sale báo lỗi để Admin duyệt cộng bù 1 lượt ưu tiên ở vòng kế tiếp.',
      'Miễn trừ thông minh: Lead do Sale tự nhập/import tại Cổng Sale Cá Nhân được miễn 100% quy tắc thu hồi SLA.',
    ],
  },
  sale_port_personal: {
    badge: 'CỔNG SALE CÁ NHÂN & SHEETS 2 CHIỀU',
    title: 'Lead Cá Nhân (Bypass Vòng Chia), Xuất CSV & Google Sheets 2 Chiều',
    summary:
      'Không chỉ nhận số từ Marketing công ty, mỗi Sale có không gian riêng để quản lý tệp khách tự khai thác hoàn toàn độc lập.',
    bullets: [
      'Tự nhập / Import Data riêng: Đi thẳng vào giỏ của Sale đó, BỎ QUA vòng chia Round-Robin, KHÔNG trừ quota nhận số Ads và KHÔNG bị thu hồi SLA.',
      'Xuất CSV cá nhân chuẩn UTF-8: Tải danh sách khách hàng riêng mở trực tiếp trên Microsoft Excel không lỗi font tiếng Việt.',
      'Đồng bộ Google Sheets 2 chiều theo từng Sale: Lead mới tự chảy vào Sheet riêng của Sale; Sale sửa cột Trạng thái/Ghi chú trên Sheet tự cập nhật ngược về hệ thống.',
    ],
  },
  apps_script: {
    badge: 'MÃ KẾT NỐI COPY 1 CHẠM',
    title: 'Google Apps Script: Đổ Lead Tự Động & Đồng Bộ Sheets 2 Chiều',
    summary:
      'Sao chép đoạn mã dưới đây dán vào Google Sheet (Tiện ích mở rộng → Apps Script) để vừa tự bắn Lead mới vào vòng chia, vừa đồng bộ ngược trạng thái chăm sóc của từng Sale.',
    bullets: [
      'Hàm onFormSubmit(e): Vừa có khách điền Google Form / Sheet là bắn tới cổng Webhook dưới 1 giây.',
      'Hàm onEdit(e): Khi Sale đổi cột Trạng thái (Cột F) hoặc Ghi chú (Cột G) trên Sheet cá nhân, dữ liệu tự đồng bộ ngược về Auto Data.',
      'Đã điền sẵn URL Webhook của bạn (hoặc URL mẫu nếu chưa đăng nhập).',
    ],
    codeLabel: 'Code.gs (Google Apps Script 2 Chiều)',
    getCode: (webhookUrl, saleEmail) => buildGoogleAppsScriptSnippet(webhookUrl, saleEmail),
  },
  meta_capi: {
    badge: 'META CONVERSION API v21.0',
    title: 'Đồng bộ ngược tín hiệu khách chất lượng về Facebook Dataset',
    summary:
      'Thay vì để Facebook tối ưu theo lượt điền form ảo, Auto Data chỉ gửi tín hiệu chuyển đổi HTTP 200 khi Sale xác nhận khách thật / đủ điều kiện / chốt đơn.',
    bullets: [
      'Tự động băm ẩn danh SHA-256 đối với SĐT và Email trước khi truyền lên Meta Graph API v21.0.',
      'Giúp thuật toán phân phối quảng cáo học đúng chân dung khách có tỷ lệ mua cao, giảm chi phí trên mỗi khách chất lượng.',
      'Kết nối Tùy chọn: Bạn có thể vào sử dụng hệ thống ngay và gắn Pixel/Dataset Token bất cứ lúc nào.',
    ],
    codeLabel: 'Payload chuẩn hóa gửi Meta Graph v21.0',
    getCode: () =>
      `{\n  "event_name": "QualifiedLead",\n  "action_source": "system_generated",\n  "user_data": { "ph": ["<sha256_normalized_phone>"] }\n}`,
  },
  zalobot_chatid: {
    badge: 'HƯỚNG DẪN ZALO BOT /CHATID',
    title: 'Lấy mã /chatid Zalo Bot & Kiểm tra kết nối trực tiếp trong 30 giây',
    summary:
      'Zalo Bot giúp bắn thông báo khách mới tới điện thoại từng Sale dưới 4 giây hoàn toàn miễn phí tin nhắn nội bộ.',
    bullets: [
      'Bước 1: Tạo Bot trên https://bot.zaloplatforms.com và sao chép Bot Access Token.',
      'Bước 2: Nhân viên Sale mở Zalo tìm Bot, bấm "Quan tâm / Bắt đầu" rồi gõ lệnh /chatid để nhận mã định danh.',
      'Bước 3: Dán Token + Chat ID vào mục Kết nối Zalo Bot và bấm "Kiểm tra kết nối trực tiếp" để nhận tin test thật ngay trên điện thoại.',
      'Lưu ý: Bước này là TÙY CHỌN — bạn có thể bấm "Tạm bỏ qua & vào setup ngay" để cấu hình sau.',
    ],
    codeLabel: 'Lệnh gõ trong khung chat Zalo Bot',
    getCode: () => `/chatid`,
  },
  billing_3m_900k: {
    badge: 'CHÍNH SÁCH GIÁ MINH BẠCH',
    title: 'Miễn phí 3 Tháng Đầu (90 Ngày) → Gia hạn 900k/tháng hoặc -15% Năm',
    summary:
      'Mọi doanh nghiệp đăng ký mới đều được kích hoạt ngay 3 tháng (90 ngày) dùng thử miễn phí trọn vẹn tính năng mà không cần thẻ thanh toán.',
    bullets: [
      'Sau 3 tháng miễn phí: Gói mặc định Auto Data Lite Standard chỉ 900.000₫/tháng.',
      'Ưu đãi thanh toán năm (-15%): Chỉ còn tương đương 765.000₫/tháng (9.180.000₫/năm — tiết kiệm ngay 1.620.000₫).',
      'Gia hạn sớm hoặc nạp Ví Topup được cộng dồn 100% vào số ngày dùng thử còn dư, không mất bất kỳ ngày nào.',
    ],
  },
};

interface AutoDataHelpTriggerProps {
  topic: HelpTopicKey;
  label?: string;
  tone?: 'light' | 'dark';
  webhookUrl?: string;
  saleEmail?: string;
  onOpenTour?: () => void;
}

export function AutoDataHelpTrigger({
  topic,
  label,
  tone = 'light',
  webhookUrl,
  saleEmail,
  onOpenTour,
}: AutoDataHelpTriggerProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const meta = HELP_TOPICS[topic];
  const codeText = meta.getCode ? meta.getCode(webhookUrl, saleEmail) : undefined;

  const handleCopy = async () => {
    if (!codeText) return;
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Giải thích chi tiết: ${meta.title}`}
        title={`Xem giải thích: ${meta.title}`}
        className={`inline-flex items-center justify-center gap-1 rounded-full border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
          label ? 'px-2.5 py-1 text-[11px] font-semibold' : 'w-5 h-5 text-[11px] font-bold'
        } ${
          tone === 'dark'
            ? 'border-white/25 bg-white/10 text-blue-200 hover:bg-white/20 hover:text-white'
            : 'border-slate-300 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'
        }`}
      >
        <span>?</span>
        {label && <span>{label}</span>}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={meta.title}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
          }}
          className="fixed inset-0 z-[160] bg-slate-950/60 backdrop-blur-sm p-4 flex items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
          >
            <div className="px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{meta.badge}</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-950 leading-snug">
                  {meta.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng hộp thoại trợ giúp"
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-left">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{meta.summary}</p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                {meta.bullets.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {codeText && (
                <div className="rounded-2xl bg-slate-950 text-slate-100 p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono font-semibold text-slate-400 truncate">
                      {meta.codeLabel || 'Mã mẫu / Công thức'}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopy()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Đã sao chép!' : 'Sao chép mã'}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] sm:text-xs font-mono text-blue-200 overflow-x-auto leading-relaxed whitespace-pre">
                    {codeText}
                  </pre>
                </div>
              )}
            </div>

            <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              {onOpenTour ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onOpenTour();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Compass className="w-3.5 h-3.5 shrink-0" />
                  <span>Xem Tour hướng dẫn A–Z</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-500">Mẹo nhanh vận hành DOMATION Auto Data</span>
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-slate-900 text-white px-5 py-2 text-xs font-semibold hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface TourStepDefinition {
  stepBadge: string;
  title: string;
  description: string;
  highlights: string[];
  topicForSnippet?: HelpTopicKey;
}

const TOUR_STEPS: TourStepDefinition[] = [
  {
    stepBadge: 'BƯỚC 1 / 7 • MẶC ĐỊNH CHO TỪNG SALE NỘI BỘ',
    title: 'Bản Lite chuyên cho Sale & Chia Data — Mặc định Sale nội bộ',
    description:
      'Auto Data được thiết kế tinh gọn để đội Sale dùng được ngay trong 60 giây. Mặc định hệ thống chia trực tiếp tới từng nhân viên Sale nội bộ (is_external_agency = false), hiển thị đầy đủ SĐT để gọi khách ngay.',
    highlights: [
      'Không bắt buộc khai báo sơ đồ phức tạp; tạo tài khoản xong có sẵn cổng Webhook thật.',
      'Chế độ Đại lý ngoài / CTV F1 (che số 0912***678) được tách riêng thành công tắc Tùy chọn khi cần.',
    ],
    topicForSnippet: 'internal_sale_default',
  },
  {
    stepBadge: 'BƯỚC 2 / 7 • THUẬT TOÁN VÒNG CHIA CÔNG BẰNG',
    title: 'Chia Vòng Trọng Số (Weighted Fair-Share) & Xoay Vòng 1:1',
    description:
      'Tự động cân bằng số lượng Lead theo hệ số năng lực (VD: Senior x3, Junior x1) hoặc xoay vòng tuần tự 1:1 giữa các nhân sự đang bật Online.',
    highlights: [
      'Công thức Deficit Score = Số Lead Ads đã nhận / Trọng số.',
      'Nhân sự nghỉ phép bật Offline không bị đổ số oan và được bảo lưu định mức.',
    ],
    topicForSnippet: 'round_robin_formula',
  },
  {
    stepBadge: 'BƯỚC 3 / 7 • CHỐNG TRÙNG 90 NGÀY & THU HỒI SLA',
    title: 'Chấm dứt tranh chấp khách trùng & Không bỏ rơi Lead nóng',
    description:
      'Quét trùng SĐT trong cửa sổ 90 ngày để trả về đúng Sale đang chăm sóc, kết hợp đồng hồ đếm ngược SLA 15 phút tự thu hồi nếu Sale chưa tiếp nhận.',
    highlights: [
      'Chuẩn hóa mọi đầu số +84 / 84 / 09x trước khi kiểm tra trùng.',
      'Hỗ trợ báo số rác / sai đối tượng để cộng bù tự động 1-đổi-1 ở vòng kế tiếp.',
    ],
    topicForSnippet: 'dedupe_90d',
  },
  {
    stepBadge: 'BƯỚC 4 / 7 • CỔNG SALE CÁ NHÂN & XUẤT CSV',
    title: 'Sale tự nhập/import khách riêng: Bypass Vòng Chia & Miễn SLA Recall',
    description:
      'Mỗi nhân viên Sale có Cổng cá nhân để tự nhập hoặc import danh sách khách tự tìm kiếm mà không bị trộn chung vào giỏ Ads công ty.',
    highlights: [
      'Đi thẳng vào giỏ riêng của Sale: KHÔNG qua vòng chia, KHÔNG tính vào quota nhận số, KHÔNG bị thu hồi SLA 15p.',
      'Xuất file CSV dữ liệu cá nhân chuẩn tiếng Việt (UTF-8 BOM) bất kỳ lúc nào.',
    ],
  },
  {
    stepBadge: 'BƯỚC 5 / 7 • GOOGLE SHEETS 2 CHIỀU & APPS SCRIPT',
    title: 'Đồng bộ Google Sheets 2 chiều riêng cho từng Sale',
    description:
      'Dán đoạn mã Google Apps Script có sẵn để kết nối trực tiếp Google Sheet quen thuộc của từng Sale với Auto Data theo cả 2 chiều.',
    highlights: [
      'Chiều đi: Lead mới chia hoặc tự nhập tự động ghi dòng mới vào Sheet cá nhân của Sale.',
      'Chiều về: Sale cập nhật Trạng thái / Ghi chú trên Sheet tự đồng bộ ngược về hệ thống.',
    ],
    topicForSnippet: 'apps_script',
  },
  {
    stepBadge: 'BƯỚC 6 / 7 • KẾT NỐI TÙY CHỌN & ZALO BOT A–Z',
    title: ' Bắt buộc vs Tùy chọn rõ ràng — Xác thực Zalo Bot trực tiếp',
    description:
      'Bạn có thể bấm "Tạm bỏ qua & vào setup ngay" đối với các kênh nâng cao, hoặc làm theo 4 bước A–Z gõ /chatid trên Zalo Bot và bấm Kiểm tra kết nối trực tiếp.',
    highlights: [
      'Rõ ràng nhãn "Bắt buộc" (Tài khoản + Webhook mặc định) và "Tùy chọn" (Zalo Bot, Meta CAPI, Sheets).',
      'Có sẵn nút Test kết nối Zalo Bot Live API & chế độ Sandbox kiểm thử tức thì.',
    ],
    topicForSnippet: 'zalobot_chatid',
  },
  {
    stepBadge: 'BƯỚC 7 / 7 • 3 THÁNG 0Đ & LỘ TRÌNH NÂNG CẤP SUITE',
    title: 'Miễn phí 3 tháng đầu → 900k/tháng (-15% năm) & Mở rộng dễ dàng',
    description:
      'Trải nghiệm 90 ngày miễn phí 100%. Khi đội ngũ lớn mạnh, nâng cấp liền mạch từ Bản Lite lên Marketing Automation, Full CRM 360° hoặc Enterprise ERP 5.0.',
    highlights: [
      'Gói chuẩn 900.000₫/tháng; thanh toán năm giảm 15% chỉ còn 765.000₫/tháng.',
      'Giữ nguyên 100% lịch sử Lead & dữ liệu Sale khi nâng cấp lên /automation, /crm, /erp.',
    ],
  },
];

interface AutoDataStepTourModalProps {
  open: boolean;
  onClose: () => void;
  webhookUrl?: string;
  saleEmail?: string;
  onActionStartSetup?: () => void;
}

export function AutoDataStepTourModal({
  open,
  onClose,
  webhookUrl,
  saleEmail,
  onActionStartSetup,
}: AutoDataStepTourModalProps) {
  const [idx, setIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx((v) => Math.min(TOUR_STEPS.length - 1, v + 1));
      if (e.key === 'ArrowLeft') setIdx((v) => Math.max(0, v - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const current = TOUR_STEPS[idx];
  const snippetTopic = current.topicForSnippet ? HELP_TOPICS[current.topicForSnippet] : undefined;
  const snippetText = snippetTopic?.getCode ? snippetTopic.getCode(webhookUrl, saleEmail) : undefined;

  const copyCurrentSnippet = async () => {
    if (!snippetText) return;
    try {
      await navigator.clipboard.writeText(snippetText);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hướng dẫn từng bước DOMATION Auto Data"
      onClick={onClose}
      className="fixed inset-0 z-[155] bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="px-5 sm:px-7 py-4 bg-slate-950 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold truncate">
                Tour Hướng Dẫn Nhanh DOMATION Auto Data (A–Z)
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Dùng phím mũi tên ← → hoặc bấm từng bước bên dưới
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hướng dẫn"
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Đóng</span>
          </button>
        </div>

        {/* Stepper dots */}
        <div className="px-5 sm:px-7 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          {TOUR_STEPS.map((_, stepIdx) => (
            <button
              key={stepIdx}
              type="button"
              onClick={() => setIdx(stepIdx)}
              className={`h-2 rounded-full transition-all cursor-pointer shrink-0 ${
                stepIdx === idx
                  ? 'w-9 bg-blue-600'
                  : stepIdx < idx
                    ? 'w-4 bg-emerald-500'
                    : 'w-4 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Chuyển tới bước ${stepIdx + 1}`}
            />
          ))}
        </div>

        <div className="p-5 sm:p-7 overflow-y-auto space-y-4">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
            {current.stepBadge}
          </div>
          <h3 className="text-lg sm:text-2xl font-extrabold text-slate-950 leading-snug">
            {current.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{current.description}</p>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2.5">
            {current.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{h}</span>
              </div>
            ))}
          </div>

          {snippetText && (
            <div className="rounded-2xl bg-slate-950 text-slate-100 p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-mono text-slate-400 truncate">
                  {snippetTopic?.codeLabel || 'Mã mẫu'}
                </span>
                <button
                  type="button"
                  onClick={() => void copyCurrentSnippet()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Đã sao chép!' : 'Sao chép nhanh'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-blue-200 overflow-x-auto max-h-40 leading-relaxed whitespace-pre">
                {snippetText}
              </pre>
            </div>
          )}
        </div>

        <div className="px-5 sm:px-7 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={idx === 0}
            onClick={() => setIdx((v) => Math.max(0, v - 1))}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Bước trước</span>
          </button>

          <div className="flex items-center gap-2.5">
            {idx < TOUR_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setIdx((v) => v + 1)}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-5 py-2 text-xs font-semibold hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Bước tiếp theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : onActionStartSetup ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onActionStartSetup();
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white px-5 py-2 text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Vào thiết lập ngay</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white px-5 py-2 text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Hoàn tất xem hướng dẫn</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
