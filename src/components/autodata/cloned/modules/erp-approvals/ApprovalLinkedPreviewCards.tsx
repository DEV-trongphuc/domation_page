import React from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Package,
  QrCode,
  Receipt,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { formatVnd } from '../../../autodataApi';
import type { ResolvedApprovalLinkedPreview } from './approvalTypes';

const TH_STYLE: React.CSSProperties = {
  padding: '0.65rem 0.85rem',
  fontSize: '0.7rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: '#64748B',
  background: '#F8F9FA',
  borderBottom: '1px solid #E2E8F0',
  textAlign: 'left',
};

const TD_STYLE: React.CSSProperties = {
  padding: '0.7rem 0.85rem',
  fontSize: '0.82rem',
  color: '#0F172A',
  borderBottom: '1px solid #F1F5F9',
};

export const ApprovalLinkedPreviewCards: React.FC<{
  preview: ResolvedApprovalLinkedPreview;
}> = ({ preview }) => {
  // 1. Deposit / Cash Advance Tranche + VietQR Block
  if (preview.kind === 'deposit') {
    return (
      <Card
        title="Xem Trước Chứng Từ Gốc • Đặt Cọc / Tạm Ứng & Lịch Giải Ngân"
        subtitle={
          preview.customer_name || preview.deal_or_project
            ? `${preview.customer_name || 'Nội bộ'}${preview.deal_or_project ? ` • ${preview.deal_or_project}` : ''}`
            : 'Chi tiết tiến độ thanh toán và tài khoản thụ hưởng VietQR'
        }
        padding="1rem 1.15rem"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Đợt</th>
                  <th style={TH_STYLE}>Hạng mục / Mốc tiến độ</th>
                  <th style={TH_STYLE}>Hạn dự kiến</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Tỷ lệ</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Số tiền</th>
                  <th style={TH_STYLE}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {preview.tranches.map((tr) => (
                  <tr key={tr.tranche_no}>
                    <td style={{ ...TD_STYLE, fontWeight: 800, color: '#1E40FF' }}>Đợt #{tr.tranche_no}</td>
                    <td style={{ ...TD_STYLE, fontWeight: 600 }}>{tr.title}</td>
                    <td style={TD_STYLE}>{tr.due_date || '—'}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'right' }}>
                      {tr.percentage !== null && tr.percentage !== undefined ? `${tr.percentage}%` : '—'}
                    </td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 800 }}>
                      {formatVnd(tr.amount_vnd)}
                    </td>
                    <td style={TD_STYLE}>
                      <Badge tone={tr.status === 'approved' || tr.status === 'paid' ? 'success' : 'primary'}>
                        {tr.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(preview.bank_name || preview.bank_account) && (
            <div
              style={{
                padding: '0.95rem 1.1rem',
                borderRadius: 14,
                background: '#F8FAFF',
                border: '1px solid #DBEAFE',
                display: 'grid',
                gridTemplateColumns: preview.vietqr_url ? 'minmax(0, 1fr) 150px' : '1fr',
                gap: 14,
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CreditCard size={15} color="#1E40FF" />
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
                    Thông tin Chuyển khoản Thụ hưởng
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                  Ngân hàng: <strong>{preview.bank_name || '—'}</strong> • Chủ TK:{' '}
                  <strong>{preview.bank_holder || '—'}</strong>
                </div>
                {preview.bank_account && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E40FF' }}>
                      STK: {preview.bank_account}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(preview.bank_account || '');
                        toast.success('Đã sao chép số tài khoản thụ hưởng!');
                      }}
                      className="btn secondary"
                      style={{ height: 30, padding: '0 8px', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Copy size={12} /> Copy STK
                    </button>
                  </div>
                )}
              </div>

              {preview.vietqr_url && (
                <div style={{ textAlign: 'center' }}>
                  <Badge tone="primary" icon={<QrCode size={11} />}>
                    VietQR 24/7
                  </Badge>
                  <img
                    src={preview.vietqr_url}
                    alt="VietQR"
                    style={{
                      marginTop: 6,
                      width: 136,
                      height: 136,
                      objectFit: 'contain',
                      borderRadius: 10,
                      background: '#FFFFFF',
                      padding: 4,
                      border: '1px solid #E2E8F0',
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  // 2. Expense Voucher Lines + VAT Indicator + Receipt Attachments
  if (preview.kind === 'expense') {
    return (
      <Card
        title="Xem Trước Phiếu Chi Phí • Hạng Mục Hạch Toán & Hóa Đơn VAT"
        actions={
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {preview.cost_center_or_branch && (
              <Badge tone="neutral">{preview.cost_center_or_branch}</Badge>
            )}
            <Badge
              tone={preview.has_vat_invoice ? 'success' : 'warning'}
              icon={<Receipt size={11} />}
            >
              {preview.has_vat_invoice ? 'Có Hóa đơn GTGT (VAT)' : 'Không kèm HĐ VAT'}
            </Badge>
          </div>
        }
        padding="1rem 1.15rem"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Diễn giải khoản chi</th>
                  <th style={TH_STYLE}>Nhóm chi phí</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>SL</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Đơn giá</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Thuế VAT</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {preview.lines.map((ln, idx) => (
                  <tr key={idx}>
                    <td style={{ ...TD_STYLE, fontWeight: 700 }}>{ln.description}</td>
                    <td style={TD_STYLE}>{ln.category || preview.expense_category}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'right' }}>{ln.qty}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'right' }}>{formatVnd(ln.unit_price_vnd)}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'right' }}>{formatVnd(ln.vat_vnd)}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 800, color: '#1E40FF' }}>
                      {formatVnd(ln.total_vnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.receipt_urls.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>
                Chứng từ / Hóa đơn đính kèm ({preview.receipt_urls.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {preview.receipt_urls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.45rem 0.85rem',
                      borderRadius: 10,
                      border: '1px solid #DBEAFE',
                      background: '#F8FAFF',
                      color: '#1E40FF',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <FileText size={13} /> Xem chứng từ #{idx + 1} <ExternalLink size={12} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // 3. Leave / Overtime / Attendance Balance & Department Overlap
  if (preview.kind === 'leave') {
    return (
      <Card
        title="Đối Chiếu Quỹ Phép Năm & Lịch Nghỉ Trùng Trong Phòng Ban"
        subtitle={`${preview.employee_name}${preview.employee_code ? ` (${preview.employee_code})` : ''}${preview.department_name ? ` • ${preview.department_name}` : ''}`}
        padding="1rem 1.15rem"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
            <div style={{ padding: '0.75rem 0.9rem', borderRadius: 12, background: '#F8FAFF', border: '1px solid #DBEAFE' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>PHÉP NĂM CÒN LẠI</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E40FF', marginTop: 2 }}>
                {preview.annual_leave_remaining}/{preview.annual_leave_quota} ngày
              </div>
            </div>
            <div style={{ padding: '0.75rem 0.9rem', borderRadius: 12, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>SỐ NGÀY / CÔNG ĐỀ XUẤT</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                {preview.requested_days} ngày {preview.leave_type ? `(${preview.leave_type})` : ''}
              </div>
            </div>
            <div style={{ padding: '0.75rem 0.9rem', borderRadius: 12, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>KHOẢNG THỜI GIAN</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={14} color="#1E40FF" /> {preview.date_range_label}
              </div>
            </div>
          </div>

          {preview.overlapping_leaves.length === 0 ? (
            <div
              style={{
                padding: '0.7rem 0.95rem',
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.24)',
                fontSize: '0.8rem',
                color: '#059669',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle2 size={15} /> Không có nhân sự nào cùng bộ phận trùng lịch nghỉ trong thời gian này.
            </div>
          ) : (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 12,
                background: 'rgba(217, 119, 6, 0.08)',
                border: '1px solid rgba(217, 119, 6, 0.28)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} /> Cảnh báo: Có {preview.overlapping_leaves.length} đơn nghỉ phép cùng bộ phận liên quan:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {preview.overlapping_leaves.map((ov, idx) => (
                  <Badge key={ov.id || idx} tone="warning" icon={<Users size={11} />}>
                    {ov.requester_name}: {ov.start_date || '—'} → {ov.end_date || '—'} ({ov.status})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // 4. Purchase Order / Sales Order SKU Line Items
  return (
    <Card
      title={`Chi Tiết ${preview.is_purchase_order ? 'Đơn Mua Hàng (PO)' : 'Đơn Bán Hàng (SO)'} • ${preview.order_code}`}
      subtitle={
        preview.partner_name
          ? `${preview.is_purchase_order ? 'Nhà cung cấp' : 'Khách hàng'}: ${preview.partner_name}${preview.delivery_note ? ` • ${preview.delivery_note}` : ''}`
          : 'Bảng kê chi tiết mã hàng SKU, đơn giá, thuế suất và tổng thanh toán'
      }
      actions={
        <Badge tone="primary" icon={<Package size={11} />}>
          {preview.sku_items.length} dòng hàng SKU
        </Badge>
      }
      padding="1rem 1.15rem"
    >
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #E2E8F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH_STYLE}>Mã SKU</th>
              <th style={TH_STYLE}>Tên Hàng hóa / Dịch vụ</th>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>SL × Đơn giá</th>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>Thuế GTGT</th>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {preview.sku_items.map((item, idx) => (
              <tr key={`${item.sku}-${idx}`}>
                <td style={{ ...TD_STYLE, fontWeight: 700, color: '#1E40FF' }}>{item.sku}</td>
                <td style={{ ...TD_STYLE, fontWeight: 600 }}>{item.product_name}</td>
                <td style={{ ...TD_STYLE, textAlign: 'right' }}>
                  {item.qty} {item.unit} × {formatVnd(item.unit_price_vnd)}
                </td>
                <td style={{ ...TD_STYLE, textAlign: 'right' }}>
                  {item.tax_pct}% ({formatVnd(item.tax_vnd)})
                </td>
                <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 800 }}>
                  {formatVnd(item.line_total_vnd)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#F8FAFF' }}>
              <td colSpan={4} style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 700, borderBottom: 'none' }}>
                Tổng thanh toán (Tạm tính {formatVnd(preview.subtotal_vnd)} + Thuế {formatVnd(preview.tax_total_vnd)}):
              </td>
              <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 800, color: '#1E40FF', fontSize: '0.94rem', borderBottom: 'none' }}>
                {formatVnd(preview.grand_total_vnd)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
};
