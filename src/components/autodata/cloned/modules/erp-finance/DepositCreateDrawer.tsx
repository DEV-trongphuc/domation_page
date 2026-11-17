import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, Landmark, Plus, Trash2, Upload, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  numberToVietnameseWords,
  type B2bCompanyRecord,
  type CommissionShareEntry,
  type FinanceLeadRef,
  type FinanceStaffRef,
} from './financeTypes';

interface DepositCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  leads: FinanceLeadRef[];
  companies: B2bCompanyRecord[];
  staff: FinanceStaffRef[];
  onSaveSuccess: () => void;
}

interface MilestoneInputRow {
  name: string;
  amount_vnd: string;
  expected_pay_date: string;
  unc_url: string;
}

const DRAFT_KEY = 'domation_deposit_create_draft_v2';

export const DepositCreateDrawer: React.FC<DepositCreateDrawerProps> = ({
  isOpen,
  onClose,
  leads,
  companies,
  staff,
  onSaveSuccess,
}) => {
  const { token, tenantSlug } = useAuth();
  const [saving, setSaving] = useState(false);

  const [leadId, setLeadId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [contractValueVnd, setContractValueVnd] = useState('');
  const [expectedCommissionVnd, setExpectedCommissionVnd] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [uncAttachmentUrl, setUncAttachmentUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [milestones, setMilestones] = useState<MilestoneInputRow[]>([
    {
      name: 'Đợt 1 — Thanh toán tiền đặt cọc',
      amount_vnd: '',
      expected_pay_date: new Date().toISOString().slice(0, 10),
      unc_url: '',
    },
  ]);

  const [commissionShares, setCommissionShares] = useState<CommissionShareEntry[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const totalMilestonesVnd = useMemo(
    () => milestones.reduce((s, m) => s + Math.max(0, Math.round(Number(m.amount_vnd || 0))), 0),
    [milestones]
  );

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          leadId,
          companyId,
          customerName,
          unitCode,
          contractValueVnd,
          expectedCommissionVnd,
          milestones,
          notes,
        })
      );
      toast.success('Đã lưu nháp Phiếu đặt cọc!');
    } catch {
      toast.error('Không thể lưu bản nháp vào trình duyệt.');
    }
  };

  const handleLoadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) {
        toast.error('Chưa có bản nháp nào được lưu.');
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      setLeadId(String(parsed.leadId || ''));
      setCompanyId(String(parsed.companyId || ''));
      setCustomerName(String(parsed.customerName || ''));
      setUnitCode(String(parsed.unitCode || ''));
      setContractValueVnd(String(parsed.contractValueVnd || ''));
      setExpectedCommissionVnd(String(parsed.expectedCommissionVnd || ''));
      setNotes(String(parsed.notes || ''));
      if (Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
        setMilestones(parsed.milestones as MilestoneInputRow[]);
      }
      toast.success('Đã khôi phục bản nháp!');
    } catch {
      toast.error('Bản nháp không hợp lệ.');
    }
  };

  const addMilestoneRow = () => {
    setMilestones((prev) => [
      ...prev,
      {
        name: `Đợt ${prev.length + 1} — Thanh toán theo tiến độ`,
        amount_vnd: '',
        expected_pay_date: '',
        unc_url: '',
      },
    ]);
  };

  const addCommissionParticipant = () => {
    if (!selectedStaffId) return;
    const found = staff.find((u) => u.id === selectedStaffId);
    if (!found) return;
    if (commissionShares.some((c) => c.user_id === found.id)) return;
    const totalComm = Math.max(0, Math.round(Number(expectedCommissionVnd || 0)));
    const nextCount = commissionShares.length + 1;
    const evenPct = Math.round(100 / nextCount);
    setCommissionShares((prev) =>
      [...prev, { user_id: found.id, user_name: found.full_name, share_pct: evenPct, amount_vnd: 0 }].map((item) => ({
        ...item,
        share_pct: evenPct,
        amount_vnd: Math.round((totalComm * evenPct) / 100),
      }))
    );
    setSelectedStaffId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedName =
      customerName.trim() ||
      companies.find((c) => c.id === companyId)?.name ||
      leads.find((l) => l.id === leadId)?.name ||
      '';
    if (!resolvedName) {
      toast.error('Vui lòng chọn Khách hàng hoặc nhập tên người đặt cọc.');
      return;
    }
    if (totalMilestonesVnd <= 0) {
      toast.error('Vui lòng nhập số tiền cho ít nhất 1 đợt đặt cọc > 0.');
      return;
    }

    setSaving(true);
    try {
      await apiRequest('/finance/deposits', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          lead_id: leadId || null,
          company_id: companyId || null,
          customer_name: resolvedName,
          unit_code: unitCode.trim() || null,
          amount_vnd: totalMilestonesVnd,
          contract_value_vnd: Math.max(totalMilestonesVnd, Math.round(Number(contractValueVnd || totalMilestonesVnd))),
          expected_commission_vnd: Math.max(0, Math.round(Number(expectedCommissionVnd || 0))),
          currency,
          exchange_rate: Number(exchangeRate || 1),
          payment_method: paymentMethod,
          unc_attachment_url: uncAttachmentUrl.trim() || milestones[0]?.unc_url || null,
          status: uncAttachmentUrl.trim() ? 'received' : 'pending',
          notes,
          milestones: milestones
            .filter((m) => Number(m.amount_vnd || 0) > 0)
            .map((m) => ({
              name: m.name,
              amount_vnd: Math.round(Number(m.amount_vnd)),
              expected_pay_date: m.expected_pay_date || null,
              unc_url: m.unc_url || null,
              status: m.unc_url ? 'submitted' : 'pending',
            })),
          commission_shares: commissionShares,
        },
      });
      localStorage.removeItem(DRAFT_KEY);
      toast.success('Đã khởi tạo Phiếu đặt cọc & Lịch thanh toán nhiều đợt!');
      onSaveSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Phiếu đặt cọc.'));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(15, 23, 42, 0.42)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(760px, 100vw)',
          height: '100%',
          background: '#FFFFFF',
          boxShadow: '-12px 0 36px rgba(15, 23, 42, 0.16)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.1rem 1.4rem',
            borderBottom: '1px solid #E2E8F0',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: '#EFF6FF',
                color: '#1E40FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Landmark size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                Tạo Phiếu Đặt Cọc & Lịch Thanh Toán Đa Đợt
              </h2>
              <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Gắn Hồ sơ Khách hàng 360°, Chứng từ UNC Ngân hàng & Chia hoa hồng tự động
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn secondary"
              onClick={handleLoadDraft}
              style={{ height: 36, fontSize: '0.76rem' }}
            >
              Khôi phục nháp
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} color="#475569" />
            </button>
          </div>
        </div>

        {/* Scrollable Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">Khách hàng CRM 360°</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={leadId}
                onChange={(e) => {
                  const id = e.target.value;
                  setLeadId(id);
                  const found = leads.find((l) => l.id === id);
                  if (found) setCustomerName(found.name);
                }}
              >
                <option value="">-- Chọn Liên hệ CRM --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Đối tác / Doanh nghiệp B2B</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={companyId}
                onChange={(e) => {
                  const id = e.target.value;
                  setCompanyId(id);
                  const found = companies.find((c) => c.id === id);
                  if (found) setCustomerName(found.name);
                }}
              >
                <option value="">-- Chọn Doanh nghiệp B2B --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 12 }}>
            <div>
              <label className="form-label">Tên Khách hàng / Người nộp cọc *</label>
              <input
                className="form-input"
                style={{ height: 44 }}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nhập họ tên hoặc tên pháp nhân..."
                required
              />
            </div>
            <div>
              <label className="form-label">Mã Sản phẩm / Mã Căn / Lô / Hợp đồng</label>
              <input
                className="form-input"
                style={{ height: 44 }}
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                placeholder="VD: A12-08 / HĐ-2026"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.6fr 0.6fr', gap: 10 }}>
            <div>
              <label className="form-label">Tổng giá trị Hợp đồng</label>
              <input
                type="number"
                min={0}
                className="form-input"
                style={{ height: 44 }}
                value={contractValueVnd}
                onChange={(e) => setContractValueVnd(e.target.value)}
                placeholder="VD: 500000000"
              />
            </div>
            <div>
              <label className="form-label">Hoa hồng dự kiến (VNĐ)</label>
              <input
                type="number"
                min={0}
                className="form-input"
                style={{ height: 44 }}
                value={expectedCommissionVnd}
                onChange={(e) => setExpectedCommissionVnd(e.target.value)}
                placeholder="VD: 15000000"
              />
            </div>
            <div>
              <label className="form-label">Loại tiền</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="form-label">Tỷ giá</label>
              <input
                type="number"
                min={1}
                className="form-input"
                style={{ height: 44 }}
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
              />
            </div>
          </div>

          {/* Multi-Tranche Milestones Schedule */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 14,
              background: '#F8FAFF',
              border: '1px solid #DBEAFE',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                  Lịch Thanh Toán Đặt Cọc Đa Đợt (Milestones)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Tổng tiền các đợt: <strong style={{ color: '#1E40FF' }}>{formatVnd(totalMilestonesVnd)}</strong> ({numberToVietnameseWords(totalMilestonesVnd)})
                </div>
              </div>
              <button
                type="button"
                className="btn secondary"
                onClick={addMilestoneRow}
                style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Plus size={14} /> Thêm đợt
              </button>
            </div>

            {milestones.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.3fr 1fr 0.9fr 1.1fr auto',
                  gap: 8,
                  alignItems: 'center',
                  background: '#FFFFFF',
                  padding: 8,
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                }}
              >
                <input
                  className="form-input"
                  style={{ height: 38, fontSize: '0.8rem' }}
                  value={m.name}
                  onChange={(e) =>
                    setMilestones((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                    )
                  }
                  placeholder="Tên đợt cọc"
                />
                <input
                  type="number"
                  min={0}
                  className="form-input"
                  style={{ height: 38, fontSize: '0.8rem', textAlign: 'right' }}
                  value={m.amount_vnd}
                  onChange={(e) =>
                    setMilestones((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, amount_vnd: e.target.value } : x))
                    )
                  }
                  placeholder="Số tiền (VNĐ)"
                />
                <input
                  type="date"
                  className="form-input"
                  style={{ height: 38, fontSize: '0.78rem' }}
                  value={m.expected_pay_date}
                  onChange={(e) =>
                    setMilestones((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, expected_pay_date: e.target.value } : x))
                    )
                  }
                />
                <input
                  className="form-input"
                  style={{ height: 38, fontSize: '0.78rem' }}
                  value={m.unc_url}
                  onChange={(e) =>
                    setMilestones((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, unc_url: e.target.value } : x))
                    )
                  }
                  placeholder="Link ảnh UNC ngân hàng"
                />
                <button
                  type="button"
                  onClick={() =>
                    setMilestones((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))
                  }
                  style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* UNC Bank Slip + Payment Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 12 }}>
            <div>
              <label className="form-label">Phương thức nộp tiền</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="bank_transfer">Chuyển khoản Ngân hàng (UNC / VietQR)</option>
                <option value="cash">Tiền mặt tại Quỹ</option>
                <option value="card">Thẻ POS</option>
              </select>
            </div>
            <div>
              <label className="form-label">Đính kèm Ủy nhiệm chi (UNC URL / Cloud File)</label>
              <div style={{ position: 'relative' }}>
                <Upload size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 14 }} />
                <input
                  className="form-input"
                  style={{ height: 44, paddingLeft: 36 }}
                  value={uncAttachmentUrl}
                  onChange={(e) => setUncAttachmentUrl(e.target.value)}
                  placeholder="Dán URL chứng từ UNC để Kế toán đối soát..."
                />
              </div>
            </div>
          </div>

          {/* Commission Participants */}
          <div
            style={{
              padding: '0.95rem',
              borderRadius: 14,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                Nhân sự đồng hưởng Hoa hồng (Commission Split)
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  className="form-input"
                  style={{ height: 36, width: 200, background: '#FFFFFF' }}
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                >
                  <option value="">+ Chọn nhân sự...</option>
                  {staff.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={addCommissionParticipant}
                  style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <UserPlus size={14} /> Thêm
                </button>
              </div>
            </div>

            {commissionShares.map((cs, idx) => (
              <div
                key={cs.user_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  background: '#FFFFFF',
                  padding: '6px 10px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ fontWeight: 700 }}>{cs.user_name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="form-input"
                    style={{ width: 72, height: 32, textAlign: 'center' }}
                    value={cs.share_pct}
                    onChange={(e) => {
                      const pct = Number(e.target.value || 0);
                      const totalComm = Math.max(0, Math.round(Number(expectedCommissionVnd || 0)));
                      setCommissionShares((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? { ...x, share_pct: pct, amount_vnd: Math.round((totalComm * pct) / 100) }
                            : x
                        )
                      );
                    }}
                  />
                  <span>% ({formatVnd(cs.amount_vnd)})</span>
                  <button
                    type="button"
                    onClick={() => setCommissionShares((prev) => prev.filter((_, i) => i !== idx))}
                    style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="form-label">Ghi chú cho Kế toán & Pháp chế</label>
            <textarea
              className="form-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú nội dung chuyển khoản, cam kết giữ chỗ..."
            />
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: 12,
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <button
              type="button"
              className="btn secondary"
              onClick={handleSaveDraft}
              style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Bookmark size={15} /> Lưu nháp
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn secondary" onClick={onClose} style={{ height: 44 }}>
                Đóng
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn primary"
                style={{ height: 44, background: '#1E40FF', fontWeight: 800 }}
              >
                {saving ? 'Đang tạo phiếu...' : `Lưu Phiếu Cọc (${formatVnd(totalMilestonesVnd)})`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
