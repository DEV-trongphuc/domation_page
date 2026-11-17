import React, { useState } from 'react';
import { Gift, Percent, Save, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type { VoucherPoolDto, VoucherPoolPayload } from './voucherTypes';

export interface VoucherCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPool?: VoucherPoolDto | null;
  onSaved: () => void;
}

const VoucherCampaignFormBody: React.FC<{
  editingPool?: VoucherPoolDto | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ editingPool, onClose, onSaved }) => {
  const { token, tenantSlug } = useAuth();
  const isEdit = Boolean(editingPool?.id);

  const [name, setName] = useState(editingPool?.name || '');
  const [description, setDescription] = useState(editingPool?.description || '');
  const [codePrefix, setCodePrefix] = useState(editingPool?.code_prefix || 'DOM');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_vnd' | 'gift'>(
    editingPool?.discount_type || 'percentage'
  );
  const [discountValue, setDiscountValue] = useState(String(editingPool?.discount_value ?? 20));
  const [minOrderVnd, setMinOrderVnd] = useState(String(editingPool?.min_order_vnd ?? 0));
  const [maxUsesPerCode, setMaxUsesPerCode] = useState(String(editingPool?.max_uses_per_code ?? 1));
  const [expiresAt, setExpiresAt] = useState(
    editingPool?.expires_at ? String(editingPool.expires_at).slice(0, 16) : ''
  );
  const [status, setStatus] = useState(editingPool?.status || 'active');
  const [autoGenerateCount, setAutoGenerateCount] = useState('25');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên Chiến dịch Voucher.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: VoucherPoolPayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        code_prefix: codePrefix.trim().toUpperCase() || 'DOM',
        discount_type: discountType,
        discount_value: Math.max(0, Number(discountValue || 0)),
        min_order_vnd: Math.max(0, Number(minOrderVnd || 0)),
        max_uses_per_code: Math.max(1, Number(maxUsesPerCode || 1)),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        status,
        ...(isEdit ? {} : { auto_generate_count: Math.min(500, Math.max(0, Number(autoGenerateCount || 0))) }),
      };

      if (isEdit && editingPool) {
        await apiRequest(`/marketing/vouchers/${editingPool.id}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã cập nhật quy tắc Chiến dịch Voucher!');
      } else {
        await apiRequest('/marketing/vouchers', {
          method: 'POST',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã khởi tạo Kho Voucher & phát hành lô mã ưu đãi!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Chiến dịch Voucher.'));
    } finally {
      setSubmitting(false);
    }
  };

  const typeCardStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.75rem',
    borderRadius: 12,
    border: active ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
    background: active ? '#EFF6FF' : '#FFFFFF',
    color: active ? '#1E40FF' : '#334155',
    fontWeight: 700,
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  });

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label className="form-label" style={{ fontWeight: 700 }}>Tên chiến dịch ưu đãi *</label>
        <input
          className="form-input"
          style={{ height: 44 }}
          placeholder="VD: Ưu đãi Khai trương Quý 4 — Khách VIP..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <label className="form-label" style={{ fontWeight: 700 }}>Mô tả điều kiện & thể lệ áp dụng</label>
        <textarea
          className="form-input"
          rows={2}
          style={{ padding: '0.6rem 0.8rem' }}
          placeholder="Áp dụng cho đơn hàng tại quầy POS hoặc đặt lịch trực tuyến..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label className="form-label" style={{ fontWeight: 700 }}>Hình thức ưu đãi (Discount Rule)</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <button
            type="button"
            onClick={() => setDiscountType('percentage')}
            style={typeCardStyle(discountType === 'percentage')}
          >
            <Percent size={15} /> Giảm theo %
          </button>
          <button
            type="button"
            onClick={() => setDiscountType('fixed_vnd')}
            style={typeCardStyle(discountType === 'fixed_vnd')}
          >
            <Tag size={15} /> Giảm tiền VNĐ
          </button>
          <button
            type="button"
            onClick={() => setDiscountType('gift')}
            style={typeCardStyle(discountType === 'gift')}
          >
            <Gift size={15} /> Quà tặng (Gift)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>
            {discountType === 'percentage'
              ? 'Mức giảm (%)'
              : discountType === 'gift'
                ? 'Giá trị quà quy đổi (VNĐ)'
                : 'Số tiền giảm (VNĐ)'}
          </label>
          <input
            type="number"
            min={0}
            className="form-input"
            style={{ height: 44 }}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
          />
        </div>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Đơn hàng tối thiểu (VNĐ)</label>
          <input
            type="number"
            min={0}
            className="form-input"
            style={{ height: 44 }}
            value={minOrderVnd}
            onChange={(e) => setMinOrderVnd(e.target.value)}
            placeholder="0 = Không giới hạn"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Tiền tố mã (Prefix)</label>
          <input
            className="form-input"
            style={{ height: 44, fontWeight: 700, letterSpacing: '0.05em' }}
            value={codePrefix}
            onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
            placeholder="DOMVIP"
          />
        </div>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Lượt dùng / mã</label>
          <input
            type="number"
            min={1}
            max={1000}
            className="form-input"
            style={{ height: 44 }}
            value={maxUsesPerCode}
            onChange={(e) => setMaxUsesPerCode(e.target.value)}
          />
        </div>
        {!isEdit ? (
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Số mã sinh tự động</label>
            <input
              type="number"
              min={0}
              max={500}
              className="form-input"
              style={{ height: 44 }}
              value={autoGenerateCount}
              onChange={(e) => setAutoGenerateCount(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Trạng thái chiến dịch</label>
            <select
              className="form-input"
              style={{ height: 44 }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Đang hoạt động</option>
              <option value="paused">Tạm dừng</option>
              <option value="draft">Bản nháp</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="form-label" style={{ fontWeight: 700 }}>Thời điểm hết hạn (Tùy chọn)</label>
        <input
          type="datetime-local"
          className="form-input"
          style={{ height: 44 }}
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
        <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>
          Hủy
        </button>
        <button
          type="submit"
          disabled={submitting}
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
          <Save size={15} /> {submitting ? 'Đang lưu...' : isEdit ? 'Cập Nhật Chiến Dịch' : 'Khởi Tạo & Sinh Mã'}
        </button>
      </div>
    </form>
  );
};

export const VoucherCampaignModal: React.FC<VoucherCampaignModalProps> = ({
  isOpen,
  onClose,
  editingPool,
  onSaved,
}) => (
  <CustomModal
    isOpen={isOpen}
    onClose={onClose}
    title={editingPool?.id ? `Chỉnh Sửa Chiến Dịch Voucher — ${editingPool.name}` : 'Khởi Tạo Chiến Dịch & Kho Mã Voucher'}
    width={620}
  >
    <VoucherCampaignFormBody
      key={editingPool?.id || 'create-pool'}
      editingPool={editingPool}
      onClose={onClose}
      onSaved={onSaved}
    />
  </CustomModal>
);

export default VoucherCampaignModal;
