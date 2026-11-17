import type {
  EmailBlockItem,
  EmailBlockType15,
  EmailBodyStyle,
  MergeTagDefinition,
} from './templateTypes';

export {
  buildLocalValidationResult,
  evaluateLocalSpamScore,
} from './spamValidator';

export type {
  EmailBlockItem,
  EmailBlockType15,
  EmailBodyStyle,
  MergeTagDefinition,
  SpamCheckFinding,
  SpamCheckReport,
} from './templateTypes';

export const EMAIL_15_BLOCK_PALETTE: ReadonlyArray<{
  type: EmailBlockType15;
  label: string;
  desc: string;
  category: 'layout' | 'content' | 'commerce';
}> = [
  { type: 'hero_banner', label: 'Hero Banner', desc: 'Tiêu đề lớn + nút kêu gọi hành động', category: 'layout' },
  { type: 'columns', label: 'Cột Đa Năng (1–4 Cột)', desc: 'Bố cục 1/2/3/4 cột & tỷ lệ 33/67 co giãn Mobile', category: 'layout' },
  { type: 'divider', label: 'Đường phân cách', desc: 'Đường kẻ mảnh chia tách bố cục', category: 'layout' },
  { type: 'text', label: 'Đoạn văn bản RichText', desc: 'Định dạng đậm/nghiêng/link & biến trộn', category: 'content' },
  { type: 'image', label: 'Hình ảnh & Banner', desc: 'Ảnh thư viện kèm ALT & liên kết đích', category: 'content' },
  { type: 'button', label: 'Nút bấm CTA', desc: 'Nút chuyển đổi nổi bật chuẩn 44px', category: 'content' },
  { type: 'testimonial', label: 'Đánh giá Khách hàng', desc: 'Trích dẫn phản hồi thực tế tăng uy tín', category: 'content' },
  { type: 'video_thumbnail', label: 'Video Thumbnail', desc: 'Khung xem trước Video kèm nút Play', category: 'content' },
  { type: 'social_links', label: 'Liên kết Mạng xã hội', desc: 'Website, Fanpage, Zalo OA, LinkedIn', category: 'content' },
  { type: 'custom_html', label: 'Mã HTML Tùy chỉnh', desc: 'Nhúng đoạn HTML inline nâng cao', category: 'content' },
  { type: 'voucher_box', label: 'Hộp Mã Ưu Đãi', desc: 'Khung mã Voucher nét đứt cá nhân hóa', category: 'commerce' },
  { type: 'countdown_timer', label: 'Đồng hồ Đếm ngược SVG', desc: 'Đếm ngược Ngày/Giờ/Phút/Giây trực quan', category: 'commerce' },
  { type: 'product_card', label: 'Thẻ Sản phẩm', desc: 'Ảnh + Giá ưu đãi + Giá gốc + Nút mua', category: 'commerce' },
  { type: 'pricing_card', label: 'Thẻ Bảng giá', desc: 'Gói đề xuất kèm giá & danh sách quyền lợi', category: 'commerce' },
  { type: 'table', label: 'Bảng dữ liệu trực quan', desc: 'Thêm/xóa dòng cột trực tiếp trên Canvas', category: 'commerce' },
];

export function createDefaultEmailBlock(type: EmailBlockType15, uid: string): EmailBlockItem {
  switch (type) {
    case 'hero_banner':
      return { id: uid, type, title: 'Giải pháp Tăng trưởng dành cho {{lead.name}}', content: 'Tối ưu chuyển đổi đa kênh từ {{tenant.name}} với quy trình tự động hóa thông minh.', buttonLabel: 'Nhận tư vấn ngay', url: 'https://domation.net', align: 'center', accentColor: '#1E40FF', borderRadius: 16 };
    case 'text':
      return { id: uid, type, title: 'Xin chào {{lead.name}},', content: 'Cảm ơn bạn đã quan tâm đến {{lead.product_interest}}. Dưới đây là lộ trình triển khai được cá nhân hóa riêng cho doanh nghiệp của bạn.', align: 'left' };
    case 'image':
      return { id: uid, type, title: 'Hình ảnh chiến dịch', altText: 'Banner chiến dịch doanh nghiệp', imageUrl: 'https://placehold.co/600x250/EFF6FF/1E40FF?text=DOMATION+Campaign', imageWidthPct: 100, url: 'https://domation.net', align: 'center', borderRadius: 12 };
    case 'button':
      return { id: uid, type, buttonLabel: 'Khám phá chi tiết', url: 'https://domation.net', align: 'center', accentColor: '#1E40FF', borderRadius: 12 };
    case 'divider':
      return { id: uid, type, padding: '12px 28px' };
    case 'columns':
      return {
        id: uid,
        type,
        columnLayout: '50/50',
        columnGap: 12,
        stackOnMobile: true,
        columns: [
          { heading: 'Tự động hóa 24/7', body: 'Phản hồi và nuôi dưỡng khách hàng tiềm năng ngay khi phát sinh tương tác.', ctaLabel: 'Xem quy trình', ctaUrl: 'https://domation.net', widthPct: 50 },
          { heading: 'Đo lường Doanh thu thực', body: 'Theo dõi chính xác hiệu quả từng chiến dịch Email & Zalo ZNS.', ctaLabel: 'Xem báo cáo', ctaUrl: 'https://domation.net', widthPct: 50 },
        ],
      };
    case 'product_card':
      return { id: uid, type, title: 'Gói Triển Khai Chuyên Sâu', content: 'Tích hợp trọn bộ dữ liệu khách hàng 360° và kịch bản chăm sóc đa kênh.', priceText: '2.490.000₫', originalPriceText: '3.500.000₫', buttonLabel: 'Đăng ký ưu đãi', url: 'https://domation.net', imageUrl: 'https://placehold.co/240x180/EFF6FF/1E40FF?text=Product', altText: 'Gói triển khai chuyên sâu', accentColor: '#1E40FF', borderRadius: 14 };
    case 'voucher_box':
      return { id: uid, type, title: 'Mã Ưu Đãi Đặc Quyền Dành Cho {{lead.name}}', voucherCode: '{{lead.voucher_code}}', voucherExpiry: 'Áp dụng trong 72 giờ kể từ khi nhận email', content: 'Nhập mã khi xác nhận đơn hàng để nhận chiết khấu trực tiếp.', accentColor: '#1E40FF', borderRadius: 14 };
    case 'countdown_timer':
      return { id: uid, type, title: 'Ưu đãi kết thúc sau', countdownIso: '2026-12-31T23:59:59.000Z', accentColor: '#1E40FF' };
    case 'social_links':
      return { id: uid, type, align: 'center', socialLinks: [{ network: 'Website', url: 'https://domation.net' }, { network: 'Facebook', url: 'https://facebook.com' }, { network: 'Zalo OA', url: 'https://zalo.me' }] };
    case 'testimonial':
      return { id: uid, type, title: 'Giám đốc Kinh doanh — Đối tác Doanh nghiệp', content: 'Tỉ lệ mở Email và chuyển đổi sang đội Sale tăng hơn 42% chỉ sau 2 tuần vận hành.', accentColor: '#1E40FF' };
    case 'video_thumbnail':
      return { id: uid, type, title: 'Video Hướng Dẫn Nhanh (2 Phút)', content: 'Nhấn để xem toàn cảnh quy trình vận hành thực tế', url: 'https://domation.net', accentColor: '#1E40FF', borderRadius: 14 };
    case 'pricing_card':
      return { id: uid, type, subtitle: 'Gói Khuyên Dùng', title: 'Growth Suite Combo', priceText: '2.990.000₫ / tháng', content: '• Không giới hạn kịch bản Flow\n• Đồng bộ Vòng chia Sale tức thì\n• Bảo mật dữ liệu doanh nghiệp', buttonLabel: 'Nâng cấp ngay', url: 'https://domation.net', accentColor: '#1E40FF', borderRadius: 16 };
    case 'table':
      return { id: uid, type, tableHeaderBg: '#EFF6FF', tableHeaderColor: '#1E40FF', tableStriped: true, rows: [['Hạng mục', 'Quyền lợi', 'Trạng thái'], ['Cổng gửi AWS SES / ZNS', 'Tên miền riêng DKIM/SPF', 'Đã kích hoạt'], ['Báo cáo ROAS thực tế', 'Liên thông CRM Pipeline', 'Đã kích hoạt']] };
    case 'custom_html':
      return { id: uid, type, content: '<div style="padding:14px;border-radius:12px;background:#F8FAFF;border:1px solid #DBEAFE;color:#0F172A;font-size:13px;">Khối HTML tùy chỉnh cho <strong>{{tenant.name}}</strong></div>' };
  }
}

function escapeHtml(raw: unknown): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSafeRichHtml(raw: string): string {
  if (!raw) return '';
  if (!/<(b|strong|i|em|u|a|br|span)\b/i.test(raw)) return escapeHtml(raw);
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+=["'][^"']*["']/gi, '');
}

export function buildCountdownSvgString(targetIso: string, accentHex = '#1E40FF', label = 'Ưu đãi kết thúc sau'): string {
  const safeHex = /^#[0-9a-fA-F]{6}$/.test(accentHex) ? accentHex : '#1E40FF';
  const parsed = new Date(targetIso).getTime();
  const refEpoch = 1767225600000;
  const diffSec = Number.isFinite(parsed)
    ? Math.max(0, Math.min(86400 * 99, Math.floor(Math.abs(parsed - refEpoch) / 1000) || 172800))
    : 172800;
  const cells = [
    { v: String(Math.min(99, Math.max(1, Math.floor(diffSec / 86400)))).padStart(2, '0'), u: 'NGÀY', x: 24 },
    { v: String(Math.floor((diffSec % 86400) / 3600)).padStart(2, '0'), u: 'GIỜ', x: 120 },
    { v: String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0'), u: 'PHÚT', x: 216 },
    { v: String(diffSec % 60).padStart(2, '0'), u: 'GIÂY', x: 312 },
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 416 112" style="max-width:416px;height:auto;">
    <rect width="416" height="112" rx="16" fill="#F8FAFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="208" y="23" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#334155">${escapeHtml(label)}</text>
    ${cells.map((c) => `<g transform="translate(${c.x}, 36)"><rect width="80" height="62" rx="12" fill="#FFFFFF" stroke="#DBEAFE" stroke-width="1.5"/><text x="40" y="34" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" fill="${safeHex}">${c.v}</text><text x="40" y="52" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" fill="#64748B">${c.u}</text></g>`).join('')}
  </svg>`;
}

export function compileBlocksToEmailHtml(blocks: EmailBlockItem[], bodyStyle: EmailBodyStyle = {}, title = 'DOMATION Email'): string {
  const canvasBg = bodyStyle.canvasColor || '#F8F9FA';
  const cardBg = bodyStyle.cardColor || '#FFFFFF';
  const primary = bodyStyle.primaryColor || '#1E40FF';
  const textCol = bodyStyle.textColor || '#0F172A';
  const fontFam = bodyStyle.fontFamily || 'Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif';
  const maxWidth = bodyStyle.maxWidth || 600;

  const rowsHtml = blocks
    .map((block) => {
      const align = block.align || 'left';
      const accent = block.accentColor || primary;
      const blockText = block.textColor || textCol;
      const blockBg = block.backgroundColor ? `background:${block.backgroundColor};` : '';
      const pad = block.spacing ? `${block.spacing.top}px ${block.spacing.right}px ${block.spacing.bottom}px ${block.spacing.left}px` : block.padding || '16px 28px';
      const radius = block.border?.radius ?? block.borderRadius ?? 12;
      const borderCss = block.border && block.border.style !== 'none' && block.border.width > 0 ? `border:${block.border.width}px ${block.border.style} ${block.border.color || '#E2E8F0'};` : '';
      const typoFont = block.typography?.fontFamily || fontFam;
      const typoSize = block.typography?.fontSize || 15;
      const typoLine = block.typography?.lineHeight || 1.65;
      const typoWeight = block.typography?.fontWeight || 'normal';

      switch (block.type) {
        case 'hero_banner':
          return `<tr><td style="padding:${pad};${blockBg}"><div style="background:linear-gradient(135deg,${accent} 0%,#0284C7 100%);border-radius:${radius}px;padding:30px 26px;text-align:${align};color:#FFFFFF;${borderCss}"><h1 style="margin:0 0 10px 0;font-family:${typoFont};font-size:23px;line-height:1.3;font-weight:800;color:#FFFFFF;">${escapeHtml(block.title || '')}</h1><p style="margin:0 0 18px 0;font-family:${typoFont};font-size:14px;line-height:1.6;color:rgba(255,255,255,0.94);">${renderSafeRichHtml(block.content || '')}</p>${block.buttonLabel ? `<a href="${escapeHtml(block.url || 'https://domation.net')}" style="display:inline-block;padding:12px 24px;background:#FFFFFF;color:${accent};font-weight:700;font-size:14px;border-radius:10px;text-decoration:none;">${escapeHtml(block.buttonLabel)}</a>` : ''}</div></td></tr>`;
        case 'text':
          return `<tr><td style="padding:${pad};${blockBg}text-align:${align};color:${blockText};font-family:${typoFont};font-size:${typoSize}px;font-weight:${typoWeight};line-height:${typoLine};"><div style="${borderCss ? `${borderCss}border-radius:${radius}px;padding:12px;` : ''}">${block.title ? `<h2 style="margin:0 0 8px 0;font-size:${Math.max(17, typoSize + 3)}px;font-weight:700;color:${blockText};">${escapeHtml(block.title)}</h2>` : ''}<div style="white-space:pre-line;">${renderSafeRichHtml(block.content || '')}</div></div></td></tr>`;
        case 'image': {
          const imgW = block.imageWidthPct ? `${Math.min(100, Math.max(20, block.imageWidthPct))}%` : '100%';
          const imgTag = `<img src="${escapeHtml(block.imageUrl || 'https://placehold.co/600x240/EFF6FF/1E40FF?text=Image')}" alt="${escapeHtml(block.altText || block.title || '')}" style="width:${imgW};max-width:100%;height:auto;border-radius:${radius}px;${borderCss || 'border:1px solid #E2E8F0;'}" />`;
          return `<tr><td style="padding:${pad};${blockBg}text-align:${align};">${block.url ? `<a href="${escapeHtml(block.url)}" style="text-decoration:none;">${imgTag}</a>` : imgTag}</td></tr>`;
        }
        case 'button':
          return `<tr><td style="padding:${pad};${blockBg}text-align:${align};"><a href="${escapeHtml(block.url || 'https://domation.net')}" style="display:inline-block;padding:13px 28px;background:${accent};color:${block.textColor || '#FFFFFF'};font-family:${typoFont};font-size:${block.typography?.fontSize || 14}px;font-weight:700;border-radius:${radius}px;text-decoration:none;${borderCss}">${escapeHtml(block.buttonLabel || 'Xem chi tiết')}</a></td></tr>`;
        case 'divider':
          return `<tr><td style="padding:${pad};${blockBg}"><hr style="border:none;border-top:${block.border?.width || 1}px ${block.border?.style && block.border.style !== 'none' ? block.border.style : 'solid'} ${block.border?.color || '#E2E8F0'};margin:0;" /></td></tr>`;
        case 'columns': {
          const cols = block.columns && block.columns.length > 0 ? block.columns : [{ heading: 'Cột 1', body: '' }, { heading: 'Cột 2', body: '' }];
          const gapHalf = Math.round((block.columnGap ?? 12) / 2);
          const stackClass = block.stackOnMobile === false ? '' : 'stack-col';
          return `<tr><td style="padding:${pad};${blockBg}"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>${cols.map((c) => `<td class="${stackClass}" width="${c.widthPct || Math.floor(100 / cols.length)}%" valign="top" style="padding:${gapHalf}px;"><div style="background:#F8FAFF;border:1px solid #E2E8F0;border-radius:${radius}px;padding:16px;"><div style="font-size:15px;font-weight:700;color:#0F172A;margin-bottom:6px;">${escapeHtml(c.heading || '')}</div><div style="font-size:13px;color:#475569;line-height:1.55;">${escapeHtml(c.body || '')}</div>${c.ctaLabel ? `<div style="margin-top:10px;"><a href="${escapeHtml(c.ctaUrl || 'https://domation.net')}" style="color:${accent};font-size:13px;font-weight:700;text-decoration:none;">${escapeHtml(c.ctaLabel)} →</a></div>` : ''}</div></td>`).join('')}</tr></table></td></tr>`;
        }
        case 'product_card':
          return `<tr><td style="padding:${pad};${blockBg}"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #E2E8F0;border-radius:${radius}px;overflow:hidden;background:#FFFFFF;${borderCss}"><tr><td class="stack-col" width="38%" style="padding:16px;background:#F8FAFF;text-align:center;"><img src="${escapeHtml(block.imageUrl || 'https://placehold.co/220x160/EFF6FF/1E40FF?text=Product')}" alt="${escapeHtml(block.altText || block.title || 'Product')}" style="max-width:100%;border-radius:10px;" /></td><td class="stack-col" width="62%" style="padding:18px;"><div style="font-size:16px;font-weight:800;color:#0F172A;">${escapeHtml(block.title || '')}</div><div style="font-size:13px;color:#64748B;margin:6px 0 10px 0;">${escapeHtml(block.content || '')}</div><div style="margin-bottom:12px;"><span style="font-size:18px;font-weight:800;color:${accent};">${escapeHtml(block.priceText || '')}</span>${block.originalPriceText ? `<span style="font-size:12px;color:#94A3B8;text-decoration:line-through;margin-left:8px;">${escapeHtml(block.originalPriceText)}</span>` : ''}</div><a href="${escapeHtml(block.url || 'https://domation.net')}" style="display:inline-block;padding:10px 20px;background:${accent};color:#FFFFFF;font-size:13px;font-weight:700;border-radius:10px;text-decoration:none;">${escapeHtml(block.buttonLabel || 'Chọn mua')}</a></td></tr></table></td></tr>`;
        case 'voucher_box':
          return `<tr><td style="padding:${pad};${blockBg}"><div style="border:2px dashed ${accent};background:#EFF6FF;border-radius:${radius}px;padding:18px;text-align:center;"><div style="font-size:12px;font-weight:700;text-transform:uppercase;color:${accent};">${escapeHtml(block.title || '')}</div><div style="margin:10px auto;display:inline-block;padding:10px 22px;background:#FFFFFF;border:1px solid #BFDBFE;border-radius:10px;font-family:monospace;font-size:20px;font-weight:800;letter-spacing:0.1em;color:#0F172A;">${escapeHtml(block.voucherCode || '{{lead.voucher_code}}')}</div><div style="font-size:13px;color:#475569;">${escapeHtml(block.content || '')}</div>${block.voucherExpiry ? `<div style="font-size:11px;color:#64748B;margin-top:6px;">${escapeHtml(block.voucherExpiry)}</div>` : ''}</div></td></tr>`;
        case 'countdown_timer':
          return `<tr><td style="padding:${pad};${blockBg}text-align:center;">${buildCountdownSvgString(block.countdownIso || '2026-12-31T23:59:59Z', accent, block.title || 'Ưu đãi kết thúc sau')}</td></tr>`;
        case 'social_links':
          return `<tr><td style="padding:${pad};${blockBg}text-align:${block.align || 'center'};">${(block.socialLinks || []).map((s) => `<a href="${escapeHtml(s.url)}" style="display:inline-block;margin:3px 5px;padding:7px 14px;border-radius:999px;background:#F1F5F9;border:1px solid #E2E8F0;color:${accent};font-size:12px;font-weight:700;text-decoration:none;">${escapeHtml(s.network)}</a>`).join('')}</td></tr>`;
        case 'testimonial':
          return `<tr><td style="padding:${pad};${blockBg}"><div style="background:#F8FAFC;border-left:4px solid ${accent};border-radius:0 ${radius}px ${radius}px 0;padding:16px 20px;"><div style="font-size:14px;font-style:italic;color:#1E293B;line-height:1.6;">“${renderSafeRichHtml(block.content || '')}”</div><div style="margin-top:8px;font-size:13px;font-weight:700;color:#0F172A;">— ${escapeHtml(block.title || '')}</div></div></td></tr>`;
        case 'video_thumbnail':
          return `<tr><td style="padding:${pad};${blockBg}text-align:center;"><a href="${escapeHtml(block.url || 'https://domation.net')}" style="display:block;text-decoration:none;"><div style="border-radius:${radius}px;border:1px solid #DBEAFE;background:#EFF6FF;padding:24px 18px;"><div style="width:50px;height:50px;line-height:50px;margin:0 auto 8px auto;border-radius:999px;background:${accent};color:#FFFFFF;font-size:18px;font-weight:800;">▶</div><div style="font-size:15px;font-weight:700;color:#0F172A;">${escapeHtml(block.title || '')}</div><div style="font-size:12px;color:#64748B;margin-top:4px;">${escapeHtml(block.content || '')}</div></div></a></td></tr>`;
        case 'pricing_card':
          return `<tr><td style="padding:${pad};${blockBg}"><div style="border:1.5px solid ${accent};border-radius:${radius}px;padding:22px;text-align:center;background:#FFFFFF;"><div style="font-size:12px;font-weight:800;color:${accent};text-transform:uppercase;">${escapeHtml(block.subtitle || '')}</div><div style="font-size:19px;font-weight:800;color:#0F172A;margin:6px 0;">${escapeHtml(block.title || '')}</div><div style="font-size:26px;font-weight:800;color:${accent};margin:8px 0;">${escapeHtml(block.priceText || '')}</div><div style="font-size:13px;color:#475569;line-height:1.6;margin-bottom:14px;white-space:pre-line;">${escapeHtml(block.content || '')}</div><a href="${escapeHtml(block.url || 'https://domation.net')}" style="display:inline-block;padding:11px 24px;background:${accent};color:#FFFFFF;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;">${escapeHtml(block.buttonLabel || 'Đăng ký')}</a></div></td></tr>`;
        case 'table': {
          const rows = block.rows && block.rows.length > 0 ? block.rows : [['Cột 1', 'Cột 2']];
          const hdrBg = block.tableHeaderBg || '#EFF6FF';
          const hdrCol = block.tableHeaderColor || '#1E40FF';
          return `<tr><td style="padding:${pad};${blockBg}"><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:10px;border-collapse:collapse;overflow:hidden;">${rows.map((r, idx) => `<tr style="background:${idx === 0 ? hdrBg : block.tableStriped && idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF'};">${r.map((c) => idx === 0 ? `<th style="padding:10px 12px;border-bottom:1px solid #DBEAFE;font-size:12px;font-weight:700;color:${hdrCol};text-align:left;">${escapeHtml(c)}</th>` : `<td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:13px;color:#0F172A;">${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</table></td></tr>`;
        }
        case 'custom_html':
          return `<tr><td style="padding:${pad};${blockBg}">${block.content || ''}</td></tr>`;
      }
    })
    .join('\n');

  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${escapeHtml(title)}</title><style>@media only screen and (max-width: 600px) { .email-shell { width: 100% !important; } .stack-col { display: block !important; width: 100% !important; box-sizing: border-box !important; } }</style></head><body style="margin:0;padding:20px 10px;background:${canvasBg};font-family:${fontFam};color:${textCol};"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${canvasBg};"><tr><td align="center"><table class="email-shell" width="${maxWidth}" cellpadding="0" cellspacing="0" role="presentation" style="max-width:${maxWidth}px;width:100%;background:${cardBg};border:1px solid #E2E8F0;border-radius:20px;overflow:hidden;">${rowsHtml}<tr><td style="padding:16px 24px;background:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;font-size:12px;color:#64748B;">Gửi từ <strong>{{tenant.name}}</strong> • <a href="{{unsubscribe_url}}" style="color:${primary};">Hủy đăng ký nhận tin</a></td></tr></table></td></tr></table></body></html>`;
}

export function previewRenderMergeTags(html: string, tags: MergeTagDefinition[]): string {
  let out = html;
  for (const t of tags) {
    out = out.split(t.key).join(t.sample);
  }
  return out;
}
