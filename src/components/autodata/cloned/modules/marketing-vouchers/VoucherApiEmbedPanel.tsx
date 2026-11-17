import React from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import type { VoucherPoolDto } from './voucherTypes';

export const VoucherApiEmbedPanel: React.FC<{ pool: VoucherPoolDto }> = ({ pool }) => {
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://domation.net';
  const claimSlug = pool.slug || pool.id;
  const publicClaimUrl = `${originUrl}/claim/${claimSlug}`;
  const publicApiUrl = `${originUrl}/api/v1/public/marketing/vouchers/${claimSlug}/claim`;
  const curlExample = `curl -X POST "${publicApiUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Nguyễn Minh Anh","phone":"0909123456","email":"khachhang@congty.vn"}'`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '1rem', borderRadius: 14, background: '#EFF6FF', border: '1px solid #DBEAFE' }}>
        <div style={{ fontWeight: 800, color: '#1E40FF', fontSize: '0.88rem', marginBottom: 4 }}>
          1. Trang Nhận Mã Công Khai (Public Voucher Claim Page)
        </div>
        <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: 8 }}>
          Gửi đường dẫn này qua Zalo, Facebook, SMS hoặc in mã QR tại sự kiện. Khách nhập SĐT hoặc Email nhận mã tức thì.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input" readOnly style={{ height: 40, background: '#FFFFFF', fontFamily: 'monospace' }} value={publicClaimUrl} />
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(publicClaimUrl);
              toast.success('Đã sao chép đường dẫn nhận Voucher!');
            }}
            className="btn secondary sm"
            style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Copy size={14} /> Sao chép
          </button>
          <a
            href={publicClaimUrl}
            target="_blank"
            rel="noreferrer"
            style={{ height: 40, padding: '0 0.95rem', borderRadius: 10, background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
          >
            <ExternalLink size={14} /> Mở trang
          </a>
        </div>
      </div>

      <div style={{ padding: '1rem', borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem', marginBottom: 4 }}>
          2. Biến Trộn Email / ZNS & Automation Flow (Merge Shortcode)
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <code style={{ flex: 1, padding: '0.55rem 0.8rem', background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', color: '#1E40FF', fontWeight: 700 }}>
            {`{{voucher.${claimSlug}}}`}
          </code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(`{{voucher.${claimSlug}}}`);
              toast.success('Đã sao chép biến trộn Voucher!');
            }}
            className="btn secondary sm"
            style={{ height: 38 }}
          >
            <Copy size={13} /> Copy Shortcode
          </button>
        </div>
      </div>

      <div style={{ padding: '1rem', borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem' }}>
            3. REST API / Webhook Cấp Mã Từ Landing Page Ngoài
          </span>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(curlExample);
              toast.success('Đã sao chép lệnh cURL mẫu!');
            }}
            className="btn secondary sm"
            style={{ height: 32 }}
          >
            <Copy size={13} /> Copy cURL
          </button>
        </div>
        <pre style={{ margin: 0, padding: '0.85rem', borderRadius: 10, background: '#0F172A', color: '#E2E8F0', fontSize: '0.74rem', overflowX: 'auto' }}>
          {curlExample}
        </pre>
      </div>
    </div>
  );
};

export default VoucherApiEmbedPanel;
