import React from 'react';
import { Download, Printer } from 'lucide-react';
import { CustomModal } from '../../components/ui/CustomModal';
import { formatShortDate, formatVnd } from '../../../autodataApi';
import {
  numberToVietnameseWords,
  type CommercialLineItem,
  type LegalEntityInfo,
} from './financeTypes';

export interface PrintableCommercialDoc {
  docTypeLabel: string;
  code: string;
  title: string;
  counterpartyLabel: string;
  counterpartyName: string;
  counterpartyTaxCode?: string | null;
  counterpartyAddress?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  items: CommercialLineItem[];
  subtotalVnd: number;
  discountVnd: number;
  taxVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
  paidVnd?: number;
  notes?: string | null;
  termsText?: string | null;
  vietQrUrl?: string | null;
}

interface PrintableDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: PrintableCommercialDoc | null;
  legalEntity?: LegalEntityInfo | null;
}

export const PrintableDocModal: React.FC<PrintableDocModalProps> = ({
  isOpen,
  onClose,
  doc,
  legalEntity,
}) => {
  if (!doc) return null;

  const buildPrintableHtml = (): string => {
    const rowsHtml = doc.items
      .map(
        (item, idx) => `
        <tr>
          <td style="padding:8px 10px;border:1px solid #CBD5E1;text-align:center">${idx + 1}</td>
          <td style="padding:8px 10px;border:1px solid #CBD5E1">${item.sku || '—'}</td>
          <td style="padding:8px 10px;border:1px solid #CBD5E1">
            <strong>${item.name}</strong>
            ${item.description ? `<div style="font-size:11px;color:#64748B">${item.description}</div>` : ''}
          </td>
          <td style="padding:8px 10px;border:1px solid #CBD5E1;text-align:center">${item.unit || 'Cái'}</td>
          <td style="padding:8px 10px;border:1px solid #CBD5E1;text-align:right">${item.qty ?? item.ordered_qty ?? 1}</td>
          <td style="padding:8px 10px;border:1px solid #CBD5E1;text-align:right">${formatVnd(item.unit_price_vnd)}</td>
          <td style="padding:8px 10px;border:1px solid #CBD5E1;text-align:center">${item.discount_pct || 0}%</td>
          <td style="padding:8px 10px;border:1px solid #CBD5E1;text-align:center">${item.tax_pct || 0}%</td>
          <td style="padding:8px 10px;border:1px solid #CBD5E1;text-align:right;font-weight:700">${formatVnd(item.line_total_vnd)}</td>
        </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${doc.docTypeLabel} - ${doc.code}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0F172A; padding: 32px; background: #FFFFFF; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }
    th { background: #EFF6FF; color: #1E40FF; padding: 10px; border: 1px solid #CBD5E1; text-align: left; }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;border-bottom:2px solid #1E40FF;padding-bottom:14px">
    <div>
      <div style="font-size:16px;font-weight:800;color:#1E40FF">${legalEntity?.legal_entity_name || 'DOANH NGHIỆP'}</div>
      <div style="font-size:12px;color:#475569;margin-top:4px">MST: ${legalEntity?.tax_code || '—'} • Đ/c: ${legalEntity?.address || '—'}</div>
      <div style="font-size:12px;color:#475569">NH: ${legalEntity?.bank_name || ''} — STK: ${legalEntity?.bank_account_no || ''} (${legalEntity?.bank_account_holder || ''})</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:900;color:#0F172A">${doc.docTypeLabel.toUpperCase()}</div>
      <div style="font-size:13px;font-weight:700;color:#1E40FF">Số: ${doc.code}</div>
      <div style="font-size:12px;color:#64748B">Ngày: ${formatShortDate(doc.issueDate)}</div>
    </div>
  </div>
  <div style="margin-top:16px;padding:12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;font-size:13px">
    <div><strong>${doc.counterpartyLabel}:</strong> ${doc.counterpartyName}</div>
    ${doc.counterpartyTaxCode ? `<div><strong>Mã số thuế:</strong> ${doc.counterpartyTaxCode}</div>` : ''}
    ${doc.counterpartyAddress ? `<div><strong>Địa chỉ:</strong> ${doc.counterpartyAddress}</div>` : ''}
    <div><strong>Nội dung:</strong> ${doc.title}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="text-align:center">#</th><th>SKU</th><th>Hàng hóa / Dịch vụ</th>
        <th style="text-align:center">ĐVT</th><th style="text-align:right">SL</th>
        <th style="text-align:right">Đơn giá</th><th style="text-align:center">CK</th>
        <th style="text-align:center">VAT</th><th style="text-align:right">Thành tiền</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div style="margin-top:16px;display:flex;justify-content:flex-end">
    <div style="width:320px;font-size:13px">
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Tạm tính:</span><strong>${formatVnd(doc.subtotalVnd)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Chiết khấu:</span><strong>-${formatVnd(doc.discountVnd)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Thuế GTGT (VAT):</span><strong>${formatVnd(doc.taxVnd)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Phí vận chuyển:</span><strong>${formatVnd(doc.shippingFeeVnd)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:2px solid #0F172A;font-size:16px;color:#1E40FF"><span>TỔNG CỘNG:</span><strong>${formatVnd(doc.totalVnd)}</strong></div>
    </div>
  </div>
  <div style="margin-top:10px;font-size:13px;font-style:italic">Số tiền bằng chữ: <strong>${numberToVietnameseWords(doc.totalVnd)}</strong></div>
  ${doc.termsText ? `<div style="margin-top:12px;font-size:12px;color:#475569"><strong>Điều khoản:</strong> ${doc.termsText}</div>` : ''}
  <div style="margin-top:36px;display:flex;justify-content:space-between;text-align:center;font-size:13px">
    <div style="width:45%"><strong>ĐẠI DIỆN KHÁCH HÀNG / ĐỐI TÁC</strong><div style="color:#64748B;font-size:11px">(Ký, ghi rõ họ tên)</div></div>
    <div style="width:45%"><strong>ĐẠI DIỆN PHÁP NHÂN LẬP PHIẾU</strong><div style="color:#64748B;font-size:11px">(Ký, đóng dấu)</div></div>
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=960,height=780');
    if (!win) return;
    win.document.open();
    win.document.write(buildPrintableHtml());
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([buildPrintableHtml()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.code}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${doc.docTypeLabel} • ${doc.code}`}
      width="880px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            padding: '1.25rem',
            borderRadius: 16,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 12,
              borderBottom: '2px solid #1E40FF',
              paddingBottom: 12,
            }}
          >
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E40FF' }}>
                {legalEntity?.legal_entity_name || 'PHÁP NHÂN DOANH NGHIỆP'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4 }}>
                MST: <strong>{legalEntity?.tax_code || 'Chưa cấu hình'}</strong> • Đ/c:{' '}
                {legalEntity?.address || '—'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                NH: {legalEntity?.bank_name} — STK: {legalEntity?.bank_account_no || '—'} (
                {legalEntity?.bank_account_holder})
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>
                {doc.docTypeLabel.toUpperCase()}
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1E40FF' }}>
                Mã chứng từ: {doc.code}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Ngày lập: {formatShortDate(doc.issueDate)}
                {doc.dueDate ? ` • Hạn: ${formatShortDate(doc.dueDate)}` : ''}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 12,
              background: '#F8FAFF',
              border: '1px solid #DBEAFE',
              fontSize: '0.82rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 8,
            }}
          >
            <div>
              <span style={{ color: '#64748B' }}>{doc.counterpartyLabel}: </span>
              <strong style={{ color: '#0F172A' }}>{doc.counterpartyName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Tiêu đề: </span>
              <strong style={{ color: '#0F172A' }}>{doc.title}</strong>
            </div>
            {doc.counterpartyTaxCode && (
              <div>
                <span style={{ color: '#64748B' }}>MST Đối tác: </span>
                <strong>{doc.counterpartyTaxCode}</strong>
              </div>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#EFF6FF', color: '#1E40FF' }}>
                  <th style={{ padding: '8px 10px', border: '1px solid #DBEAFE' }}>#</th>
                  <th style={{ padding: '8px 10px', border: '1px solid #DBEAFE', textAlign: 'left' }}>SKU</th>
                  <th style={{ padding: '8px 10px', border: '1px solid #DBEAFE', textAlign: 'left' }}>
                    Sản phẩm / Dịch vụ
                  </th>
                  <th style={{ padding: '8px 10px', border: '1px solid #DBEAFE' }}>ĐVT</th>
                  <th style={{ padding: '8px 10px', border: '1px solid #DBEAFE', textAlign: 'right' }}>SL</th>
                  <th style={{ padding: '8px 10px', border: '1px solid #DBEAFE', textAlign: 'right' }}>Đơn giá</th>
                  <th style={{ padding: '8px 10px', border: '1px solid #DBEAFE' }}>CK</th>
                  <th style={{ padding: '8px 10px', border: '1px solid #DBEAFE' }}>VAT</th>
                  <th style={{ padding: '8px 10px', border: '1px solid #DBEAFE', textAlign: 'right' }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {doc.items.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 14, textAlign: 'center', color: '#64748B' }}>
                      Chứng từ tổng hợp (không tách dòng SKU chi tiết)
                    </td>
                  </tr>
                ) : (
                  doc.items.map((li, idx) => (
                    <tr key={`${li.sku}-${idx}`} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E40FF' }}>
                        {li.sku || '—'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{li.name}</div>
                        {li.description && (
                          <div style={{ fontSize: '0.73rem', color: '#64748B' }}>{li.description}</div>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{li.unit || 'Cái'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                        {li.qty ?? li.ordered_qty ?? 1}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        {formatVnd(li.unit_price_vnd)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{li.discount_pct || 0}%</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{li.tax_pct || 0}%</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>
                        {formatVnd(li.line_total_vnd)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: '0.8rem', color: '#334155', fontStyle: 'italic' }}>
                Bằng chữ: <strong>{numberToVietnameseWords(doc.totalVnd)}</strong>
              </div>
              {doc.termsText && (
                <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 6 }}>
                  Điều khoản: {doc.termsText}
                </div>
              )}
              {doc.vietQrUrl && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={doc.vietQrUrl}
                    alt="VietQR"
                    style={{ width: 96, height: 96, borderRadius: 10, border: '1px solid #E2E8F0' }}
                  />
                  <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                    Quét mã VietQR để thanh toán nhanh vào tài khoản Pháp nhân.
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                minWidth: 270,
                padding: '0.85rem 1rem',
                borderRadius: 12,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                fontSize: '0.82rem',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Tạm tính:</span>
                <strong>{formatVnd(doc.subtotalVnd)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Chiết khấu:</span>
                <strong style={{ color: '#DC2626' }}>-{formatVnd(doc.discountVnd)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Thuế VAT:</span>
                <strong>{formatVnd(doc.taxVnd)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Phí vận chuyển:</span>
                <strong>{formatVnd(doc.shippingFeeVnd)}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #CBD5E1',
                  paddingTop: 6,
                  marginTop: 4,
                  fontSize: '0.96rem',
                  fontWeight: 900,
                  color: '#1E40FF',
                }}
              >
                <span>Tổng thanh toán:</span>
                <span>{formatVnd(doc.totalVnd)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn secondary" onClick={onClose} style={{ height: 44 }}>
            Đóng
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={handleDownloadHtml}
            style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1E40FF' }}
          >
            <Download size={16} /> Tải bản HTML
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handlePrint}
            style={{ height: 44, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Printer size={16} /> In chứng từ / Xuất PDF
          </button>
        </div>
      </div>
    </CustomModal>
  );
};
