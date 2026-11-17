import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Percent,
  Plus,
  Sparkles,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import { SignatureCanvasPad } from './PayrollSkeleton';
import {
  PAYROLL_SHARED_INPUT_STYLE,
  PAYROLL_SHARED_LABEL_STYLE,
  percentageToVietnameseWords,
  vndToVietnameseWords,
  type CooperationSlipDto,
  type TenantDirectoryMemberDto,
} from './payrollTypes';

export interface ShareDraftRow {
  user_id: string;
  percentage: string;
}

interface ShareSplitEditorTableProps {
  rows: ShareDraftRow[];
  onChange: (next: ShareDraftRow[]) => void;
  directory: TenantDirectoryMemberDto[];
  expectedCommissionVnd: number;
}

export const ShareSplitEditorTable: React.FC<ShareSplitEditorTableProps> = ({
  rows,
  onChange,
  directory,
  expectedCommissionVnd,
}) => {
  const totalPct = useMemo(
    () =>
      Math.round(
        rows.reduce((sum, r) => sum + (Number.isFinite(Number(r.percentage)) ? Number(r.percentage) : 0), 0) *
          100
      ) / 100,
    [rows]
  );

  const isExactHundred = Math.abs(totalPct - 100) < 0.01;

  const handleEqualSplit = () => {
    if (rows.length === 0) return;
    const base = Math.floor((10000 / rows.length)) / 100;
    const next = rows.map((r, idx) => {
      if (idx === rows.length - 1) {
        const rem = Math.round((100 - base * (rows.length - 1)) * 100) / 100;
        return { ...r, percentage: String(rem) };
      }
      return { ...r, percentage: String(base) };
    });
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={15} color="#1E40FF" />
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>
            Bảng Phân Chia Tỷ Lệ Đồng Hưởng Hoa Hồng (Tổng bắt buộc = 100%)
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleEqualSplit}
            style={{
              height: 34,
              padding: '0 10px',
              borderRadius: 9,
              border: '1px solid #BFDBFE',
              background: '#EFF6FF',
              color: '#1E40FF',
              fontSize: '0.76rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={13} /> Chia đều 100%
          </button>
          <button
            type="button"
            onClick={() => onChange([...rows, { user_id: '', percentage: '0' }])}
            style={{
              height: 34,
              padding: '0 10px',
              borderRadius: 9,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: '0.76rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
            }}
          >
            <Plus size={13} /> Thêm cổ đông Sale
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((row, idx) => {
          const pctNum = Number(row.percentage || 0);
          const shareVnd = Math.round((expectedCommissionVnd * pctNum) / 100);
          return (
            <div
              key={idx}
              style={{
                padding: '0.75rem',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                background: '#F8FAFF',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(180px, 1.6fr) 130px auto',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <select
                  value={row.user_id}
                  onChange={(e) => {
                    const next = rows.map((item, i) =>
                      i === idx ? { ...item, user_id: e.target.value } : item
                    );
                    onChange(next);
                  }}
                  style={PAYROLL_SHARED_INPUT_STYLE}
                >
                  <option value="">-- Chọn nhân sự hưởng hoa hồng --</option>
                  {directory.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} {m.email ? `(${m.email})` : ''}
                    </option>
                  ))}
                </select>

                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={row.percentage}
                    onChange={(e) => {
                      const next = rows.map((item, i) =>
                        i === idx ? { ...item, percentage: e.target.value } : item
                      );
                      onChange(next);
                    }}
                    style={{ ...PAYROLL_SHARED_INPUT_STYLE, paddingRight: 28, fontWeight: 800 }}
                  />
                  <Percent
                    size={13}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748B',
                    }}
                  />
                </div>

                <button
                  type="button"
                  disabled={rows.length <= 1}
                  onClick={() => onChange(rows.filter((_, i) => i !== idx))}
                  style={{
                    height: 44,
                    width: 44,
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: rows.length <= 1 ? '#CBD5E1' : '#DC2626',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: rows.length <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  gap: 6,
                  fontSize: '0.75rem',
                  color: '#475569',
                }}
              >
                <span>
                  Bằng chữ: <strong style={{ color: '#1E40FF' }}>{percentageToVietnameseWords(pctNum)}</strong>
                </span>
                <span>
                  Tạm tính: <strong style={{ color: '#059669' }}>{formatVnd(shareVnd)}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: '0.75rem 1rem',
          borderRadius: 12,
          background: isExactHundred ? 'rgba(16, 185, 129, 0.08)' : '#FEF2F2',
          border: isExactHundred ? '1px solid rgba(16, 185, 129, 0.26)' : '1px solid #FECACA',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          fontSize: '0.82rem',
        }}
      >
        <div>
          <strong>Tổng tỷ lệ phân bổ: {totalPct}%</strong> —{' '}
          <span style={{ fontStyle: 'italic' }}>{percentageToVietnameseWords(totalPct)}</span>
        </div>
        <Badge tone={isExactHundred ? 'success' : 'danger'}>
          {isExactHundred ? 'Hợp lệ (Đủ 100%)' : `Lệch ${Math.round((100 - totalPct) * 100) / 100}%`}
        </Badge>
      </div>
    </div>
  );
};

function validateShareRows(
  rows: ShareDraftRow[],
  directory: TenantDirectoryMemberDto[],
  expectedCommissionVnd: number
): {
  valid: boolean;
  error?: string;
  shareholders: Array<{
    user_id: string;
    name: string;
    user_name: string;
    email: string;
    percentage: number;
    amount_vnd: number;
  }>;
  sharesMap: Record<string, number>;
} {
  if (rows.length === 0) {
    return { valid: false, error: 'Cần ít nhất 1 nhân sự tham gia phiếu hợp tác.', shareholders: [], sharesMap: {} };
  }
  const seen = new Set<string>();
  const sharesMap: Record<string, number> = {};
  const shareholders: Array<{
    user_id: string;
    name: string;
    user_name: string;
    email: string;
    percentage: number;
    amount_vnd: number;
  }> = [];
  let sum = 0;

  for (const r of rows) {
    const uid = r.user_id.trim();
    const pct = Number(r.percentage);
    if (!uid || !Number.isFinite(pct) || pct <= 0) {
      return {
        valid: false,
        error: 'Vui lòng chọn đầy đủ nhân sự và nhập tỷ lệ phần trăm lớn hơn 0%.',
        shareholders: [],
        sharesMap: {},
      };
    }
    if (seen.has(uid)) {
      return {
        valid: false,
        error: 'Một nhân sự không được xuất hiện trùng lặp 2 dòng trên cùng phiếu chia.',
        shareholders: [],
        sharesMap: {},
      };
    }
    seen.add(uid);
    sum += pct;
    sharesMap[uid] = pct;
    const member = directory.find((d) => d.id === uid);
    shareholders.push({
      user_id: uid,
      name: member?.full_name || uid,
      user_name: member?.full_name || uid,
      email: member?.email || '',
      percentage: pct,
      amount_vnd: Math.round((expectedCommissionVnd * pct) / 100),
    });
  }

  if (Math.abs(sum - 100) >= 0.01) {
    return {
      valid: false,
      error: `Tổng tỷ lệ chia hoa hồng bắt buộc bằng đúng 100% (hiện tại là ${Math.round(sum * 100) / 100}%).`,
      shareholders: [],
      sharesMap: {},
    };
  }

  return { valid: true, shareholders, sharesMap };
}

export const CreateCooperationSlipModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  directory: TenantDirectoryMemberDto[];
  defaultUserId: string;
  token: string | null;
  tenantSlug: string;
  onCreated: () => Promise<void>;
}> = ({ isOpen, onClose, directory, defaultUserId, token, tenantSlug, onCreated }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dealCode, setDealCode] = useState('');
  const [projectName, setProjectName] = useState('');
  const [expectedRevenue, setExpectedRevenue] = useState('500000000');
  const [expectedCommission, setExpectedCommission] = useState('15000000');
  const [notes, setNotes] = useState('');
  const [shareRows, setShareRows] = useState<ShareDraftRow[]>(() => [
    { user_id: defaultUserId, percentage: '100' },
  ]);
  const [saving, setSaving] = useState(false);

  const commNum = Math.max(0, Number(expectedCommission || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !dealCode.trim() || !projectName.trim()) {
      toast.error('Vui lòng điền tên khách hàng, mã Deal/Sản phẩm và tên dự án.');
      return;
    }
    const check = validateShareRows(shareRows, directory, commNum);
    if (!check.valid) {
      toast.error(check.error || 'Tỷ lệ chia không hợp lệ.');
      return;
    }

    setSaving(true);
    try {
      await apiRequest('/payroll/cooperation-slips', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          title: `${projectName.trim()} — ${customerName.trim()}`,
          partner_name: customerName.trim(),
          customer_name: customerName.trim(),
          full_name: customerName.trim(),
          partner_contact: customerPhone.trim(),
          customer_phone: customerPhone.trim(),
          phone: customerPhone.trim(),
          deal_code: dealCode.trim(),
          unit_code: dealCode.trim(),
          project_name: projectName.trim(),
          estimated_value_vnd: Math.max(0, Number(expectedRevenue || 0)),
          expected_revenue_vnd: Math.max(0, Number(expectedRevenue || 0)),
          expected_revenue: Math.max(0, Number(expectedRevenue || 0)),
          expected_commission_vnd: commNum,
          expected_commission: commNum,
          terms_text: notes.trim() || null,
          notes: notes.trim() || null,
          shareholders: check.shareholders,
          shares: check.sharesMap,
        },
      });
      toast.success('Đã lập Phiếu hợp tác chia hoa hồng và gửi thông báo ký số!');
      setCustomerName('');
      setCustomerPhone('');
      setDealCode('');
      setProjectName('');
      setNotes('');
      onClose();
      await onCreated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo phiếu hợp tác.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Khởi Tạo Phiếu Hợp Tác & Phân Chia Hoa Hồng Đa Sale"
      width={720}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Tên khách hàng / Đối tác *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nhập họ tên khách hàng hoặc pháp nhân..."
              style={PAYROLL_SHARED_INPUT_STYLE}
            />
          </div>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Số điện thoại khách hàng</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="VD: 0909xxxxxx"
              style={PAYROLL_SHARED_INPUT_STYLE}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 10 }}>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Mã Giao dịch / Mã Căn / Hợp đồng *</label>
            <input
              type="text"
              value={dealCode}
              onChange={(e) => setDealCode(e.target.value)}
              placeholder="VD: DEAL-2026-089"
              style={PAYROLL_SHARED_INPUT_STYLE}
            />
          </div>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Dự án / Gói sản phẩm dịch vụ *</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Nhập tên dự án hoặc gói giải pháp..."
              style={PAYROLL_SHARED_INPUT_STYLE}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Doanh thu kỳ vọng (VNĐ)</label>
            <input
              type="number"
              min={0}
              step={1000000}
              value={expectedRevenue}
              onChange={(e) => setExpectedRevenue(e.target.value)}
              style={PAYROLL_SHARED_INPUT_STYLE}
            />
          </div>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Tổng quỹ hoa hồng phân bổ (VNĐ) *</label>
            <input
              type="number"
              min={0}
              step={500000}
              value={expectedCommission}
              onChange={(e) => setExpectedCommission(e.target.value)}
              style={PAYROLL_SHARED_INPUT_STYLE}
            />
          </div>
        </div>

        <div style={{ fontSize: '0.77rem', color: '#1E40FF' }}>
          Quỹ hoa hồng bằng chữ: <strong>{vndToVietnameseWords(commNum)}</strong>
        </div>

        <ShareSplitEditorTable
          rows={shareRows}
          onChange={setShareRows}
          directory={directory}
          expectedCommissionVnd={commNum}
        />

        <div>
          <label style={PAYROLL_SHARED_LABEL_STYLE}>Ghi chú thỏa thuận phối hợp</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú vai trò tìm nguồn khách, tư vấn chốt Deal, chăm sóc hậu mãi..."
            style={PAYROLL_SHARED_INPUT_STYLE}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            className="btn secondary"
            style={{ height: 44, padding: '0 1.2rem' }}
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              height: 44,
              padding: '0 1.35rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {saving ? 'Đang khởi tạo...' : 'Tạo phiếu & Gửi yêu cầu ký số'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};

export const UpdateSharesModal: React.FC<{
  slip: CooperationSlipDto | null;
  onClose: () => void;
  directory: TenantDirectoryMemberDto[];
  token: string | null;
  tenantSlug: string;
  onSaved: () => Promise<void>;
}> = ({ slip, onClose, directory, token, tenantSlug, onSaved }) => {
  const [rows, setRows] = useState<ShareDraftRow[]>(() =>
    slip
      ? slip.shareholders.map((s) => ({ user_id: s.user_id, percentage: String(s.percentage) }))
      : []
  );
  const [commAmount, setCommAmount] = useState(() => String(slip?.expected_commission_vnd || 0));
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  if (!slip) return null;
  const commNum = Math.max(0, Number(commAmount || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateShareRows(rows, directory, commNum);
    if (!check.valid) {
      toast.error(check.error || 'Tỷ lệ phân chia chưa hợp lệ.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`/payroll/cooperation-slips/${slip.id}/shares`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: {
          shareholders: check.shareholders,
          shares: check.sharesMap,
          expected_commission_vnd: commNum,
          expected_commission: commNum,
          reason: reason.trim() || 'Cập nhật lại tỷ lệ đồng hưởng hoa hồng',
        },
      });
      toast.success('Đã cập nhật tỷ lệ chia hoa hồng và đặt lại vòng ký số đồng thuận!');
      onClose();
      await onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật tỷ lệ chia hoa hồng.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomModal
      isOpen={Boolean(slip)}
      onClose={onClose}
      title={`Điều Chỉnh Tỷ Lệ Hoa Hồng • ${slip.code}`}
      width={680}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
        <div>
          <label style={PAYROLL_SHARED_LABEL_STYLE}>Tổng quỹ hoa hồng dự kiến (VNĐ)</label>
          <input
            type="number"
            min={0}
            step={500000}
            value={commAmount}
            onChange={(e) => setCommAmount(e.target.value)}
            style={PAYROLL_SHARED_INPUT_STYLE}
          />
        </div>

        <ShareSplitEditorTable
          rows={rows}
          onChange={setRows}
          directory={directory}
          expectedCommissionVnd={commNum}
        />

        <div>
          <label style={PAYROLL_SHARED_LABEL_STYLE}>Lý do điều chỉnh tỷ lệ</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do cập nhật tỷ lệ đóng góp giữa các thành viên..."
            style={PAYROLL_SHARED_INPUT_STYLE}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            className="btn secondary"
            style={{ height: 44, padding: '0 1.2rem' }}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              height: 44,
              padding: '0 1.3rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu tỷ lệ 100% mới'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};

export const CooperationSignAndActionModals: React.FC<{
  signingSlip: CooperationSlipDto | null;
  onCloseSign: () => void;
  decidingSlip: CooperationSlipDto | null;
  onCloseDecide: () => void;
  disputingSlip: CooperationSlipDto | null;
  onCloseDispute: () => void;
  currentUserId: string;
  token: string | null;
  tenantSlug: string;
  onRefresh: () => Promise<void>;
}> = ({
  signingSlip,
  onCloseSign,
  decidingSlip,
  onCloseDecide,
  disputingSlip,
  onCloseDispute,
  currentUserId,
  token,
  tenantSlug,
  onRefresh,
}) => {
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null);
  const [decisionComment, setDecisionComment] = useState('');
  const [disputeNote, setDisputeNote] = useState('');
  const [busy, setBusy] = useState(false);

  const myShare = signingSlip?.shareholders.find((s) => s.user_id === currentUserId) || signingSlip?.shareholders[0];

  const handleConfirmSign = async () => {
    if (!signingSlip) return;
    if (!sigDataUrl) {
      toast.error('Vui lòng ký điện tử vào khung Canvas trước khi xác nhận!');
      return;
    }
    setBusy(true);
    try {
      await apiRequest(`/payroll/cooperation-slips/${signingSlip.id}/sign`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          signature_data_url: sigDataUrl,
          signature_img: sigDataUrl,
        },
      });
      toast.success('Đã ký số đồng thuận phiếu hợp tác hoa hồng!');
      setSigDataUrl(null);
      onCloseSign();
      await onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ký xác nhận phiếu hợp tác.'));
    } finally {
      setBusy(false);
    }
  };

  const handleManagerDecide = async (decision: 'approved' | 'rejected') => {
    if (!decidingSlip) return;
    setBusy(true);
    try {
      await apiRequest(`/payroll/cooperation-slips/${decidingSlip.id}/decide`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          decision,
          action: decision === 'approved' ? 'approve' : 'reject',
          comment: decisionComment.trim() || null,
        },
      });
      toast.success(
        decision === 'approved'
          ? 'Đã phê duyệt chốt Phiếu hợp tác hoa hồng!'
          : 'Đã từ chối Phiếu hợp tác hoa hồng.'
      );
      setDecisionComment('');
      onCloseDecide();
      await onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xử lý phê duyệt phiếu hợp tác.'));
    } finally {
      setBusy(false);
    }
  };

  const handleSendDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputingSlip) return;
    if (!disputeNote.trim()) {
      toast.error('Vui lòng nhập nội dung khiếu nại / đề xuất điều chỉnh tỷ lệ.');
      return;
    }
    setBusy(true);
    try {
      await apiRequest(`/payroll/cooperation-slips/${disputingSlip.id}/dispute`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          reason: disputeNote.trim(),
          dispute_reason: disputeNote.trim(),
          note: disputeNote.trim(),
        },
      });
      toast.success('Đã gửi yêu cầu điều chỉnh / khiếu nại tỷ lệ hoa hồng!');
      setDisputeNote('');
      onCloseDispute();
      await onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi yêu cầu điều chỉnh.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Shareholder Digital Signature Modal */}
      <CustomModal
        isOpen={Boolean(signingSlip)}
        onClose={onCloseSign}
        title={signingSlip ? `Ký Số Đồng Thuận Hoa Hồng • ${signingSlip.code}` : ''}
        width={640}
      >
        {signingSlip && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                padding: '0.9rem 1.1rem',
                borderRadius: 12,
                background: '#F8FAFF',
                border: '1px solid #DBEAFE',
                fontSize: '0.83rem',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div>
                Khách hàng: <strong>{signingSlip.customer_name}</strong> • Mã Deal:{' '}
                <strong>{signingSlip.deal_code}</strong> ({signingSlip.project_name})
              </div>
              <div>
                Tổng quỹ hoa hồng: <strong style={{ color: '#1E40FF' }}>{formatVnd(signingSlip.expected_commission_vnd)}</strong>
              </div>
              {myShare && (
                <div style={{ color: '#059669', fontWeight: 700 }}>
                  Phần thụ hưởng của {myShare.user_name}: {myShare.percentage}% (
                  {percentageToVietnameseWords(myShare.percentage)}) = {formatVnd(myShare.amount_vnd)}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B' }}>
                NHẬT KÝ CHỮ KÝ SỐ & IP XÁC THỰC CỦA CỔ ĐÔNG TRÊN PHIẾU:
              </div>
              {signingSlip.shareholders.map((sh) => (
                <div
                  key={sh.user_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: '#F8F9FA',
                    fontSize: '0.78rem',
                  }}
                >
                  <span>
                    <strong>{sh.user_name}</strong> — {sh.percentage}% ({formatVnd(sh.amount_vnd)})
                  </span>
                  {sh.signed ? (
                    <Badge tone="success">
                      Đã ký {sh.signed_at ? formatShortDate(sh.signed_at) : ''}{' '}
                      {sh.signed_ip ? `• IP ${sh.signed_ip}` : ''}
                    </Badge>
                  ) : (
                    <Badge tone="warning">Chờ ký xác nhận</Badge>
                  )}
                </div>
              ))}
            </div>

            <SignatureCanvasPad
              label="Chữ ký điện tử xác nhận đồng thuận tỷ lệ chia hoa hồng"
              disabled={busy}
              onSignatureChange={setSigDataUrl}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={onCloseSign}
                className="btn secondary"
                style={{ height: 44, padding: '0 1.15rem' }}
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleConfirmSign()}
                style={{
                  height: 44,
                  padding: '0 1.35rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <CheckCircle2 size={16} />
                {busy ? 'Đang ghi nhận chữ ký...' : 'Ký xác nhận đồng thuận'}
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Manager Approve / Reject Modal */}
      <CustomModal
        isOpen={Boolean(decidingSlip)}
        onClose={onCloseDecide}
        title={decidingSlip ? `Phê Duyệt Quản Lý • ${decidingSlip.code}` : ''}
        width={560}
      >
        {decidingSlip && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
              Xác nhận phê duyệt hoặc từ chối phiếu hợp tác khách hàng{' '}
              <strong>{decidingSlip.customer_name}</strong> ({decidingSlip.project_name}) với quỹ hoa hồng{' '}
              <strong style={{ color: '#1E40FF' }}>{formatVnd(decidingSlip.expected_commission_vnd)}</strong>.
            </div>
            <div>
              <label style={PAYROLL_SHARED_LABEL_STYLE}>Ý kiến phê duyệt / Ghi chú của Quản lý</label>
              <textarea
                rows={3}
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                placeholder="Nhập nhận xét hoặc lý do phê duyệt / từ chối..."
                style={{ ...PAYROLL_SHARED_INPUT_STYLE, height: 'auto', padding: '0.7rem 0.85rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleManagerDecide('rejected')}
                style={{
                  height: 44,
                  padding: '0 1.15rem',
                  borderRadius: 12,
                  border: '1px solid #FECACA',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <XCircle size={15} /> Từ chối phiếu
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleManagerDecide('approved')}
                style={{
                  height: 44,
                  padding: '0 1.3rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#059669',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <CheckCircle2 size={15} /> Phê duyệt chốt hoa hồng
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Dispute / Adjustment Request Modal */}
      <CustomModal
        isOpen={Boolean(disputingSlip)}
        onClose={onCloseDispute}
        title={disputingSlip ? `Yêu Cầu Điều Chỉnh / Khiếu Nại • ${disputingSlip.code}` : ''}
        width={540}
      >
        <form onSubmit={handleSendDispute} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B45309', fontSize: '0.82rem' }}>
            <AlertTriangle size={16} />
            <span>Phiếu sẽ chuyển sang trạng thái Cần đối soát để Quản lý và các bên xem xét lại.</span>
          </div>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Lý do đề nghị điều chỉnh tỷ lệ *</label>
            <textarea
              rows={4}
              value={disputeNote}
              onChange={(e) => setDisputeNote(e.target.value)}
              placeholder="Nêu rõ căn cứ đóng góp tư vấn, dẫn khách hoặc đề xuất tỷ lệ % mới..."
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, height: 'auto', padding: '0.7rem 0.85rem' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={onCloseDispute}
              className="btn secondary"
              style={{ height: 44, padding: '0 1.15rem' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                height: 44,
                padding: '0 1.3rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {busy ? 'Đang gửi...' : 'Gửi yêu cầu điều chỉnh'}
            </button>
          </div>
        </form>
      </CustomModal>
    </>
  );
};
