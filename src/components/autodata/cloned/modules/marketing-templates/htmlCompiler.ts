export type EmailBlockType15 =
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'columns'
  | 'product_card'
  | 'voucher_box'
  | 'countdown_timer'
  | 'social_links'
  | 'hero_banner'
  | 'testimonial'
  | 'video_thumbnail'
  | 'pricing_card'
  | 'table'
  | 'custom_html';

export interface EmailColumnItem {
  heading?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface EmailBlockItem {
  id: string;
  type: EmailBlockType15;
  title?: string;
  subtitle?: string;
  content?: string;
  url?: string;
  imageUrl?: string;
  buttonLabel?: string;
  voucherCode?: string;
  priceText?: string;
  originalPriceText?: string;
  countdownIso?: string;
  columns?: EmailColumnItem[];
  rows?: string[][];
  socialLinks?: Array<{ network: string; url: string }>;
  align?: 'left' | 'center' | 'right';
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  borderRadius?: number;
}

export interface EmailBodyStyle {
  canvasColor?: string;
  cardColor?: string;
  primaryColor?: string;
  textColor?: string;
  fontFamily?: string;
  maxWidth?: number;
}

export interface MergeTagDefinition {
  key: string;
  label: string;
  sample: string;
}

export interface SpamCheckFinding {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface SpamCheckReport {
  score: number;
  deliverabilityGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  issues: SpamCheckFinding[];
}

export const EMAIL_15_BLOCK_PALETTE: ReadonlyArray<{
  type: EmailBlockType15;
  label: string;
  desc: string;
}> = [
  { type: 'hero_banner', label: 'Hero Banner', desc: 'Tiêu đề lớn + nút kêu gọi hành động' },
  { type: 'text', label: 'Đoạn văn bản', desc: 'Tiêu đề phụ & nội dung cá nhân hóa' },
  { type: 'image', label: 'Hình ảnh', desc: 'Ảnh banner hoặc sản phẩm có gắn link' },
  { type: 'button', label: 'Nút bấm CTA', desc: 'Nút chuyển đổi nổi bật chuẩn 44px' },
  { type: 'divider', label: 'Đường phân cách', desc: 'Đường kẻ mảnh chia bố cục' },
  { type: 'columns', label: 'Cột đôi (2 Columns)', desc: 'Bố cục 2 cột tự động co giãn Mobile' },
  { type: 'product_card', label: 'Thẻ Sản phẩm', desc: 'Ảnh + Giá ưu đãi + Giá gốc + Nút mua' },
  { type: 'voucher_box', label: 'Hộp Mã Ưu Đãi', desc: 'Khung mã Voucher nét đứt cá nhân hóa' },
  { type: 'countdown_timer', label: 'Đồng hồ Đếm ngược SVG', desc: 'Đếm ngược Ngày/Giờ/Phút/Giây' },
  { type: 'testimonial', label: 'Đánh giá Khách hàng', desc: 'Trích dẫn phản hồi thực tế tăng uy tín' },
  { type: 'video_thumbnail', label: 'Video Thumbnail', desc: 'Khung xem trước Video kèm nút Play' },
  { type: 'pricing_card', label: 'Thẻ Bảng giá', desc: 'Gói đề xuất kèm giá & quyền lợi' },
  { type: 'table', label: 'Bảng dữ liệu', desc: 'Bảng đối chiếu hạng mục hoặc chi tiết đơn' },
  { type: 'social_links', label: 'Liên kết Mạng xã hội', desc: 'Website, Fanpage, Zalo OA' },
  { type: 'custom_html', label: 'Mã HTML Tùy chỉnh', desc: 'Nhúng đoạn HTML inline nâng cao' },
];

export function createDefaultEmailBlock(type: EmailBlockType15, uid: string): EmailBlockItem {
  switch (type) {
    case 'hero_banner':
      return {
        id: uid,
        type,
        title: 'Giải pháp Tăng trưởng dành cho {{lead.name}}',
        content: 'Tối ưu chuyển đổi đa kênh từ {{tenant.name}} với quy trình tự động hóa thông minh.',
        buttonLabel: 'Nhận tư vấn ngay',
        url: 'https://domation.net',
        align: 'center',
        accentColor: '#1E40FF',
      };
    case 'text':
      return {
        id: uid,
        type,
        title: 'Xin chào {{lead.name}},',
        content:
          'Cảm ơn bạn đã quan tâm đến {{lead.product_interest}}. Dưới đây là thông tin chi tiết được thiết kế riêng cho nhu cầu của bạn.',
        align: 'left',
      };
    case 'image':
      return {
        id: uid,
        type,
        title: 'Hình ảnh minh họa',
        imageUrl: 'https://placehold.co/600x250/EFF6FF/1E40FF?text=DOMATION+Campaign',
        url: 'https://domation.net',
        align: 'center',
      };
    case 'button':
      return {
        id: uid,
        type,
        buttonLabel: 'Khám phá chi tiết',
        url: 'https://domation.net',
        align: 'center',
        accentColor: '#1E40FF',
      };
    case 'divider':
      return { id: uid, type };
    case 'columns':
      return {
        id: uid,
        type,
        columns: [
          {
            heading: 'Tự động hóa 24/7',
            body: 'Phản hồi và nuôi dưỡng khách hàng tiềm năng ngay khi phát sinh tương tác.',
            ctaLabel: 'Xem quy trình',
            ctaUrl: 'https://domation.net',
          },
          {
            heading: 'Đo lường Doanh thu thực',
            body: 'Theo dõi chính xác hiệu quả từng chiến dịch Email & Zalo ZNS.',
            ctaLabel: 'Xem báo cáo',
            ctaUrl: 'https://domation.net',
          },
        ],
      };
    case 'product_card':
      return {
        id: uid,
        type,
        title: 'Gói Triển Khai Chuyên Sâu',
        content: 'Tích hợp trọn bộ dữ liệu khách hàng 360° và kịch bản chăm sóc đa kênh.',
        priceText: '2.490.000₫',
        originalPriceText: '3.500.000₫',
        buttonLabel: 'Đăng ký ưu đãi',
        url: 'https://domation.net',
        imageUrl: 'https://placehold.co/240x180/EFF6FF/1E40FF?text=Product',
        accentColor: '#1E40FF',
      };
    case 'voucher_box':
      return {
        id: uid,
        type,
        title: 'Mã Ưu Đãi Đặc Quyền Dành Cho {{lead.name}}',
        voucherCode: '{{lead.voucher_code}}',
        content: 'Áp dụng giảm trực tiếp khi xác nhận đơn hàng trong tuần này.',
        accentColor: '#1E40FF',
      };
    case 'countdown_timer':
      return {
        id: uid,
        type,
        title: 'Ưu đãi kết thúc sau',
        countdownIso: '2026-12-31T23:59:59.000Z',
        accentColor: '#1E40FF',
      };
    case 'social_links':
      return {
        id: uid,
        type,
        socialLinks: [
          { network: 'Website', url: 'https://domation.net' },
          { network: 'Facebook', url: 'https://facebook.com' },
          { network: 'Zalo OA', url: 'https://zalo.me' },
        ],
      };
    case 'testimonial':
      return {
        id: uid,
        type,
        title: 'Giám đốc Kinh doanh — Đối tác Doanh nghiệp',
        content: 'Tỉ lệ mở Email và chuyển đổi sang đội Sale tăng hơn 42% chỉ sau 2 tuần vận hành.',
        accentColor: '#1E40FF',
      };
    case 'video_thumbnail':
      return {
        id: uid,
        type,
        title: 'Video Hướng Dẫn Nhanh (2 Phút)',
        content: 'Nhấn để xem toàn cảnh quy trình vận hành thực tế',
        url: 'https://domation.net',
        accentColor: '#1E40FF',
      };
    case 'pricing_card':
      return {
        id: uid,
        type,
        subtitle: 'Gói Khuyên Dùng',
        title: 'Growth Suite Combo',
        priceText: '2.990.000₫ / tháng',
        content: '• Không giới hạn kịch bản Flow\n• Đồng bộ Vòng chia Sale tức thì\n• Bảo mật dữ liệu doanh nghiệp',
        buttonLabel: 'Nâng cấp ngay',
        url: 'https://domation.net',
        accentColor: '#1E40FF',
      };
    case 'table':
      return {
        id: uid,
        type,
        rows: [
          ['Hạng mục', 'Quyền lợi', 'Trạng thái'],
          ['Cổng gửi AWS SES / ZNS', 'Tên miền riêng DKIM/SPF', 'Đã kích hoạt'],
          ['Báo cáo ROAS thực tế', 'Liên thông CRM Pipeline', 'Đã kích hoạt'],
        ],
      };
    case 'custom_html':
      return {
        id: uid,
        type,
        content:
          '<div style="padding:14px;border-radius:12px;background:#F8FAFC;border:1px solid #E2E8F0;color:#0F172A;font-size:13px;">Khối HTML tùy chỉnh cho <strong>{{tenant.name}}</strong></div>',
      };
  }
}

function escapeHtml(raw: unknown): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildCountdownSvgString(targetIso: string, accentHex = '#1E40FF', label = 'Ưu đãi kết thúc sau'): string {
  const safeHex = /^#[0-9a-fA-F]{6}$/.test(accentHex) ? accentHex : '#1E40FF';
  const parsed = new Date(targetIso).getTime();
  const diffSec = Number.isFinite(parsed) ? Math.max(0, Math.min(86400 * 99, Math.floor((parsed - 1767225600000) / 1000) || 172800)) : 172800;
  const d = String(Math.min(99, Math.max(2, Math.floor(diffSec / 86400)))).padStart(2, '0');
  const h = '14';
  const m = '38';
  const s = '25';

  const cells = [
    { v: d, u: 'NGÀY', x: 24 },
    { v: h, u: 'GIỜ', x: 120 },
    { v: m, u: 'PHÚT', x: 216 },
    { v: s, u: 'GIÂY', x: 312 },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 416 112" style="max-width:416px;height:auto;">
    <rect width="416" height="112" rx="16" fill="#F8FAFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="208" y="23" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#334155">${escapeHtml(label)}</text>
    ${cells
      .map(
        (c) => `<g transform="translate(${c.x}, 36)">
          <rect width="80" height="62" rx="12" fill="#FFFFFF" stroke="#DBEAFE" stroke-width="1.5"/>
          <text x="40" y="34" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" fill="${safeHex}">${c.v}</text>
          <text x="40" y="52" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" fill="#64748B">${c.u}</text>
        </g>`
      )
      .join('')}
  </svg>`;
}

export function compileBlocksToEmailHtml(
  blocks: EmailBlockItem[],
  bodyStyle: EmailBodyStyle = {},
  title = 'DOMATION Email'
): string {
  const canvasBg = bodyStyle.canvasColor || '#F8F9FA';
  const cardBg = bodyStyle.cardColor || '#FFFFFF';
  const primary = bodyStyle.primaryColor || '#1E40FF';
  const textCol = bodyStyle.textColor || '#0F172A';
  const maxWidth = bodyStyle.maxWidth || 600;

  const rowsHtml = blocks
    .map((block) => {
      const align = block.align || 'left';
      const accent = block.accentColor || primary;
      const pad = block.padding || '16px 28px';
      const radius = block.borderRadius ?? 12;

      switch (block.type) {
        case 'hero_banner':
          return `<tr><td style="padding:${pad};">
            <div style="background:linear-gradient(135deg,${accent} 0%,#0284C7 100%);border-radius:${radius}px;padding:30px 26px;text-align:${align};color:#FFFFFF;">
              <h1 style="margin:0 0 10px 0;font-size:23px;line-height:1.3;font-weight:800;color:#FFFFFF;">${escapeHtml(block.title || '')}</h1>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.92);">${escapeHtml(block.content || '')}</p>
              ${
                block.buttonLabel
                  ? `<a href="${escapeHtml(block.url || 'https://domation.net')}" style="display:inline-block;padding:12px 24px;background:#FFFFFF;color:${accent};font-weight:700;font-size:14px;border-radius:10px;text-decoration:none;">${escapeHtml(block.buttonLabel)}</a>`
                  : ''
              }
            </div>
          </td></tr>`;

        case 'text':
          return `<tr><td style="padding:${pad};text-align:${align};color:${textCol};font-size:15px;line-height:1.65;">
            ${block.title ? `<h2 style="margin:0 0 8px 0;font-size:18px;font-weight:700;color:${textCol};">${escapeHtml(block.title)}</h2>` : ''}
            <div style="white-space:pre-line;">${escapeHtml(block.content || '')}</div>
          </td></tr>`;

        case 'image':
          return `<tr><td style="padding:${pad};text-align:${align};">
            <img src="${escapeHtml(block.imageUrl || 'https://placehold.co/600x240/EFF6FF/1E40FF?text=Image')}" alt="${escapeHtml(block.title || 'Email Image')}" style="max-width:100%;height:auto;border-radius:${radius}px;border:1px solid #E2E8F0;" />
          </td></tr>`;

        case 'button':
          return `<tr><td style="padding:${pad};text-align:${align};">
            <a href="${escapeHtml(block.url || 'https://domation.net')}" style="display:inline-block;padding:13px 28px;background:${accent};color:#FFFFFF;font-size:14px;font-weight:700;border-radius:${radius}px;text-decoration:none;">${escapeHtml(block.buttonLabel || 'Xem chi tiết')}</a>
          </td></tr>`;

        case 'divider':
          return `<tr><td style="padding:${pad};"><hr style="border:none;border-top:1px solid #E2E8F0;margin:0;" /></td></tr>`;

        case 'columns': {
          const cols = block.columns && block.columns.length > 0 ? block.columns : [{ heading: 'Cột 1', body: '' }, { heading: 'Cột 2', body: '' }];
          const wPct = Math.floor(100 / cols.length);
          return `<tr><td style="padding:${pad};"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>${cols
            .map(
              (c) => `<td class="stack-col" width="${wPct}%" valign="top" style="padding:6px;">
                <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;">
                  <div style="font-size:15px;font-weight:700;color:#0F172A;margin-bottom:6px;">${escapeHtml(c.heading || '')}</div>
                  <div style="font-size:13px;color:#475569;line-height:1.55;">${escapeHtml(c.body || '')}</div>
                  ${c.ctaLabel ? `<div style="margin-top:10px;"><a href="${escapeHtml(c.ctaUrl || 'https://domation.net')}" style="color:${accent};font-size:13px;font-weight:700;text-decoration:none;">${escapeHtml(c.ctaLabel)} →</a></div>` : ''}
                </div>
              </td>`
            )
            .join('')}</tr></table></td></tr>`;
        }

        case 'product_card':
          return `<tr><td style="padding:${pad};">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #E2E8F0;border-radius:${radius}px;overflow:hidden;background:#FFFFFF;">
              <tr>
                <td width="38%" style="padding:16px;background:#F8FAFF;text-align:center;">
                  <img src="${escapeHtml(block.imageUrl || 'https://placehold.co/220x160/EFF6FF/1E40FF?text=Product')}" alt="${escapeHtml(block.title || '')}" style="max-width:100%;border-radius:10px;" />
                </td>
                <td width="62%" style="padding:18px;">
                  <div style="font-size:16px;font-weight:800;color:#0F172A;">${escapeHtml(block.title || '')}</div>
                  <div style="font-size:13px;color:#64748B;margin:6px 0 10px 0;">${escapeHtml(block.content || '')}</div>
                  <div style="margin-bottom:12px;">
                    <span style="font-size:18px;font-weight:800;color:${accent};">${escapeHtml(block.priceText || '')}</span>
                    ${block.originalPriceText ? `<span style="font-size:12px;color:#94A3B8;text-decoration:line-through;margin-left:8px;">${escapeHtml(block.originalPriceText)}</span>` : ''}
                  </div>
                  <a href="${escapeHtml(block.url || 'https://domation.net')}" style="display:inline-block;padding:10px 20px;background:${accent};color:#FFFFFF;font-size:13px;font-weight:700;border-radius:10px;text-decoration:none;">${escapeHtml(block.buttonLabel || 'Chọn mua')}</a>
                </td>
              </tr>
            </table>
          </td></tr>`;

        case 'voucher_box':
          return `<tr><td style="padding:${pad};">
            <div style="border:2px dashed ${accent};background:#EFF6FF;border-radius:${radius}px;padding:18px;text-align:center;">
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:${accent};">${escapeHtml(block.title || '')}</div>
              <div style="margin:10px auto;display:inline-block;padding:10px 22px;background:#FFFFFF;border:1px solid #BFDBFE;border-radius:10px;font-family:monospace;font-size:20px;font-weight:800;letter-spacing:0.1em;color:#0F172A;">${escapeHtml(block.voucherCode || '{{lead.voucher_code}}')}</div>
              <div style="font-size:13px;color:#475569;">${escapeHtml(block.content || '')}</div>
            </div>
          </td></tr>`;

        case 'countdown_timer':
          return `<tr><td style="padding:${pad};text-align:center;">${buildCountdownSvgString(block.countdownIso || '2026-12-31T23:59:59Z', accent, block.title || 'Ưu đãi kết thúc sau')}</td></tr>`;

        case 'social_links':
          return `<tr><td style="padding:${pad};text-align:center;">${(block.socialLinks || [])
            .map(
              (s) =>
                `<a href="${escapeHtml(s.url)}" style="display:inline-block;margin:0 5px;padding:7px 14px;border-radius:999px;background:#F1F5F9;border:1px solid #E2E8F0;color:${accent};font-size:12px;font-weight:700;text-decoration:none;">${escapeHtml(s.network)}</a>`
            )
            .join('')}</td></tr>`;

        case 'testimonial':
          return `<tr><td style="padding:${pad};">
            <div style="background:#F8FAFC;border-left:4px solid ${accent};border-radius:0 12px 12px 0;padding:16px 20px;">
              <div style="font-size:14px;font-style:italic;color:#1E293B;line-height:1.6;">“${escapeHtml(block.content || '')}”</div>
              <div style="margin-top:8px;font-size:13px;font-weight:700;color:#0F172A;">— ${escapeHtml(block.title || '')}</div>
            </div>
          </td></tr>`;

        case 'video_thumbnail':
          return `<tr><td style="padding:${pad};text-align:center;">
            <a href="${escapeHtml(block.url || 'https://domation.net')}" style="display:block;text-decoration:none;">
              <div style="border-radius:${radius}px;border:1px solid #E2E8F0;background:#EFF6FF;padding:24px 18px;">
                <div style="width:50px;height:50px;line-height:50px;margin:0 auto 8px auto;border-radius:999px;background:${accent};color:#FFFFFF;font-size:18px;font-weight:800;">▶</div>
                <div style="font-size:15px;font-weight:700;color:#0F172A;">${escapeHtml(block.title || '')}</div>
                <div style="font-size:12px;color:#64748B;margin-top:4px;">${escapeHtml(block.content || '')}</div>
              </div>
            </a>
          </td></tr>`;

        case 'pricing_card':
          return `<tr><td style="padding:${pad};">
            <div style="border:1.5px solid ${accent};border-radius:${radius}px;padding:22px;text-align:center;background:#FFFFFF;">
              <div style="font-size:12px;font-weight:800;color:${accent};text-transform:uppercase;">${escapeHtml(block.subtitle || '')}</div>
              <div style="font-size:19px;font-weight:800;color:#0F172A;margin:6px 0;">${escapeHtml(block.title || '')}</div>
              <div style="font-size:26px;font-weight:800;color:${accent};margin:8px 0;">${escapeHtml(block.priceText || '')}</div>
              <div style="font-size:13px;color:#475569;line-height:1.6;margin-bottom:14px;white-space:pre-line;">${escapeHtml(block.content || '')}</div>
              <a href="${escapeHtml(block.url || 'https://domation.net')}" style="display:inline-block;padding:11px 24px;background:${accent};color:#FFFFFF;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;">${escapeHtml(block.buttonLabel || 'Đăng ký')}</a>
            </div>
          </td></tr>`;

        case 'table': {
          const rows = block.rows && block.rows.length > 0 ? block.rows : [['Cột 1', 'Cột 2']];
          return `<tr><td style="padding:${pad};"><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:10px;border-collapse:collapse;overflow:hidden;">${rows
            .map(
              (r, idx) =>
                `<tr>${r
                  .map((c) =>
                    idx === 0
                      ? `<th style="padding:10px 12px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;font-size:12px;font-weight:700;color:#475569;text-align:left;">${escapeHtml(c)}</th>`
                      : `<td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:13px;color:#0F172A;">${escapeHtml(c)}</td>`
                  )
                  .join('')}</tr>`
            )
            .join('')}</table></td></tr>`;
        }

        case 'custom_html':
          return `<tr><td style="padding:${pad};">${block.content || ''}</td></tr>`;
      }
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-shell { width: 100% !important; }
      .stack-col { display: block !important; width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin:0;padding:20px 10px;background:${canvasBg};font-family:Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:${textCol};">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${canvasBg};">
    <tr>
      <td align="center">
        <table class="email-shell" width="${maxWidth}" cellpadding="0" cellspacing="0" role="presentation" style="max-width:${maxWidth}px;width:100%;background:${cardBg};border:1px solid #E2E8F0;border-radius:20px;overflow:hidden;">
          ${rowsHtml}
          <tr>
            <td style="padding:16px 24px;background:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;font-size:12px;color:#64748B;">
              Gửi từ <strong>{{tenant.name}}</strong> • <a href="{{unsubscribe_url}}" style="color:${primary};">Hủy đăng ký nhận tin</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function previewRenderMergeTags(html: string, tags: MergeTagDefinition[]): string {
  let out = html;
  for (const t of tags) {
    out = out.split(t.key).join(t.sample);
  }
  return out;
}

const SPAM_KEYWORDS = [
  'miễn phí 100%',
  'trúng thưởng',
  'rút tiền ngay',
  'làm giàu nhanh',
  'không rủi ro',
  'thu nhập thụ động',
  'vốn 0 đồng',
];

export function evaluateLocalSpamScore(subject: string, blocks: EmailBlockItem[], compiledHtml: string): SpamCheckReport {
  const issues: SpamCheckFinding[] = [];
  let score = 5;

  const trimmedSubject = subject.trim();
  if (!trimmedSubject) {
    score += 25;
    issues.push({ severity: 'high', message: 'Chưa nhập Tiêu đề Email (Subject).' });
  } else {
    if (trimmedSubject.length > 78) {
      score += 10;
      issues.push({ severity: 'low', message: 'Tiêu đề dài trên 78 ký tự có thể bị cắt trên điện thoại.' });
    }
    if ((trimmedSubject.match(/!/g) || []).length >= 2) {
      score += 12;
      issues.push({ severity: 'medium', message: 'Tránh dùng nhiều dấu chấm than (!) liên tiếp.' });
    }
  }

  const textLower = `${trimmedSubject} ${compiledHtml.replace(/<[^>]+>/g, ' ')}`.toLowerCase();
  for (const kw of SPAM_KEYWORDS) {
    if (textLower.includes(kw)) {
      score += 15;
      issues.push({ severity: 'medium', message: `Phát hiện từ khóa nhạy cảm dễ rơi tab Quảng cáo/Spam: "${kw}".` });
    }
  }

  for (const b of blocks) {
    if ((b.type === 'button' || b.type === 'product_card' || b.type === 'pricing_card') && (!b.url || b.url.trim() === '#')) {
      score += 10;
      issues.push({ severity: 'medium', message: `Khối "${b.title || b.buttonLabel || b.type}" chưa gắn URL đích hợp lệ.` });
    }
  }

  const clamped = Math.min(100, Math.max(0, score));
  const deliverabilityGrade: SpamCheckReport['deliverabilityGrade'] =
    clamped <= 15 ? 'A+' : clamped <= 30 ? 'A' : clamped <= 50 ? 'B' : clamped <= 70 ? 'C' : 'D';
  return { score: clamped, deliverabilityGrade, issues };
}
