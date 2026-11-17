import React, { useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  interpolateZaloTemplateBody,
  type ZaloTemplateButtonDto,
  type ZaloTemplateDto,
  type ZaloTemplateParamDto,
} from './socialBotTypes';

export interface ZaloTemplateCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  oaName?: string;
  oaId?: string;
  editingTemplate?: ZaloTemplateDto | null;
  onSaved: () => void;
}

const ZaloTemplateFormInner: React.FC<{
  oaName: string;
  oaId?: string;
  editingTemplate?: ZaloTemplateDto | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ oaName, oaId, editingTemplate, onClose, onSaved }) => {
  const { token, tenantSlug } = useAuth();
  const isEdit = Boolean(editingTemplate?.id);

  const [name, setName] = useState(editingTemplate?.name || '');
  const [templateCode, setTemplateCode] = useState(editingTemplate?.template_code || 'ZNS_290881');
  const [templateType, setTemplateType] = useState<ZaloTemplateDto['template_type']>(
    editingTemplate?.template_type || 'zns_transaction'
  );
  const [priceVnd, setPriceVnd] = useState(String(editingTemplate?.price_vnd ?? 250));
  const [contentBody, setContentBody] = useState(
    editingTemplate?.content_body ||
      'Xin chào {{customer_name}}, đơn hàng {{order_code}} của bạn đã được xác nhận thành công. Cảm ơn bạn đã đồng hành!'
  );
  const [paramsSchema, setParamsSchema] = useState<ZaloTemplateParamDto[]>(
    editingTemplate?.params_schema && editingTemplate.params_schema.length > 0
      ? editingTemplate.params_schema
      : [
          { key: 'customer_name', crm_field: 'name', sample_value: 'Nguyễn Minh Anh' },
          { key: 'order_code', crm_field: 'custom', sample_value: 'SO-2026-089' },
        ]
  );
  const [buttons, setButtons] = useState<ZaloTemplateButtonDto[]>(
    editingTemplate?.buttons && editingTemplate.buttons.length > 0
      ? editingTemplate.buttons
      : [{ title: 'Xem chi tiết đơn hàng', url: 'https://domation.net' }]
  );
  const [saving, setSaving] = useState(false);

  const previewRenderedText = useMemo(
    () => interpolateZaloTemplateBody(contentBody, paramsSchema),
    [contentBody, paramsSchema]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contentBody.trim()) {
      toast.error('Vui lòng nhập tên mẫu và nội dung tin nhắn Zalo.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        oa_id: oaId || undefined,
        name: name.trim(),
        template_code: templateCode.trim(),
        template_type: templateType,
        price_vnd: Math.max(0, Number(priceVnd || 250)),
        content_body: contentBody.trim(),
        params_schema: paramsSchema,
        buttons,
        status: 'approved',
      };

      if (isEdit && editingTemplate) {
        await apiRequest(`/marketing/social-bot/zalo-templates/${editingTemplate.id}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã cập nhật mẫu tin Zalo ZNS / ZBS!');
      } else {
        await apiRequest('/marketing/social-bot/zalo-templates', {
          method: 'POST',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã khởi tạo mẫu tin Zalo ZNS / ZBS mới!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu mẫu tin Zalo.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) 330px', gap: 16, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Tên mẫu tin ZNS / ZBS *</label>
            <input className="form-input" style={{ height: 42 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Thông báo xác nhận lịch hẹn / đơn hàng..." />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Mã Template Zalo (ID)</label>
            <input className="form-input" style={{ height: 42, fontFamily: 'monospace' }} value={templateCode} onChange={(e) => setTemplateCode(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Phân loại dịch vụ Zalo</label>
            <select className="form-input" style={{ height: 42 }} value={templateType} onChange={(e) => setTemplateType(e.target.value as ZaloTemplateDto['template_type'])}>
              <option value="zns_transaction">ZNS Giao dịch / CSKH (Transaction)</option>
              <option value="zns_otp">ZNS Mã xác thực bảo mật (OTP)</option>
              <option value="zns_promotion">ZNS Ưu đãi hậu mãi (Promotion)</option>
              <option value="zbs_broadcast">ZBS Tin truyền thông OA (Broadcast)</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Đơn giá dự kiến (VNĐ/tin)</label>
            <input type="number" min={0} className="form-input" style={{ height: 42 }} value={priceVnd} onChange={(e) => setPriceVnd(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Nội dung mẫu tin (Sử dụng biến <code>{`{{ten_bien}}`}</code>)</label>
          <textarea className="form-input" rows={4} style={{ padding: '0.65rem' }} value={contentBody} onChange={(e) => setContentBody(e.target.value)} />
        </div>

        <div style={{ padding: '0.85rem', borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>
              Ánh Xạ Biến Tham Số Sang Hồ Sơ 360° (Parameter Mapping)
            </span>
            <button
              type="button"
              onClick={() => setParamsSchema((p) => [...p, { key: `param_${p.length + 1}`, crm_field: 'custom', sample_value: 'Giá trị mẫu' }])}
              className="btn secondary sm"
              style={{ height: 28, fontSize: '0.72rem', color: '#1E40FF' }}
            >
              <Plus size={12} /> Thêm biến
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {paramsSchema.map((param, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 30px', gap: 6, alignItems: 'center' }}>
                <input
                  className="form-input"
                  style={{ height: 34, fontSize: '0.76rem', background: '#FFFFFF', fontFamily: 'monospace' }}
                  placeholder="customer_name"
                  value={param.key}
                  onChange={(e) => setParamsSchema((prev) => prev.map((x, i) => (i === idx ? { ...x, key: e.target.value } : x)))}
                />
                <select
                  className="form-input"
                  style={{ height: 34, fontSize: '0.76rem', background: '#FFFFFF' }}
                  value={param.crm_field}
                  onChange={(e) => setParamsSchema((prev) => prev.map((x, i) => (i === idx ? { ...x, crm_field: e.target.value as ZaloTemplateParamDto['crm_field'] } : x)))}
                >
                  <option value="name">Trường CRM: Họ tên</option>
                  <option value="phone">Trường CRM: Số điện thoại</option>
                  <option value="email">Trường CRM: Email</option>
                  <option value="custom">Giá trị tĩnh / Tùy chỉnh</option>
                </select>
                <input
                  className="form-input"
                  style={{ height: 34, fontSize: '0.76rem', background: '#FFFFFF' }}
                  placeholder="Giá trị xem trước..."
                  value={param.sample_value}
                  onChange={(e) => setParamsSchema((prev) => prev.map((x, i) => (i === idx ? { ...x, sample_value: e.target.value } : x)))}
                />
                <button type="button" onClick={() => setParamsSchema((prev) => prev.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Nút bấm hành động trên thẻ Zalo (Tối đa 2)</span>
            {buttons.length < 2 && (
              <button type="button" onClick={() => setButtons((b) => [...b, { title: 'Truy cập Website', url: 'https://domation.net' }])} className="btn secondary sm" style={{ height: 28, fontSize: '0.72rem' }}>
                + Thêm nút
              </button>
            )}
          </div>
          {buttons.map((b, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 30px', gap: 6, alignItems: 'center' }}>
              <input className="form-input" style={{ height: 36, fontSize: '0.78rem' }} value={b.title} onChange={(e) => setButtons((prev) => prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))} />
              <input className="form-input" style={{ height: 36, fontSize: '0.78rem' }} value={b.url} onChange={(e) => setButtons((prev) => prev.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)))} />
              <button type="button" onClick={() => setButtons((prev) => prev.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 42 }}>Hủy</button>
          <button
            type="submit"
            disabled={saving}
            style={{
              height: 42,
              padding: '0 1.25rem',
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
            <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu Mẫu Tin Zalo'}
          </button>
        </div>
      </div>

      <div style={{ padding: '1.1rem', borderRadius: 20, background: '#E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>Xem Trước Thẻ Tin Zalo</span>
          <Badge tone="primary">{formatVnd(Number(priceVnd || 0))}/tin</Badge>
        </div>

        <div style={{ borderRadius: 16, background: '#FFFFFF', overflow: 'hidden', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)' }}>
          <div style={{ padding: '0.8rem 1rem', background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: '0.84rem' }}>{oaName}</span>
            <span style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <CheckCircle2 size={12} /> Official
            </span>
          </div>

          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>{name || 'Tiêu đề thông báo ZNS'}</div>
            <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{previewRenderedText}</div>

            {buttons.map((b, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.55rem 0.8rem',
                  borderRadius: 10,
                  background: '#EFF6FF',
                  border: '1px solid #DBEAFE',
                  color: '#1E40FF',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{b.title || 'Nút hành động'}</span>
                <ExternalLink size={13} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
};

export const ZaloTemplateCreateModal: React.FC<ZaloTemplateCreateModalProps> = ({
  isOpen,
  onClose,
  oaName = 'Zalo Official Account',
  oaId,
  editingTemplate,
  onSaved,
}) => (
  <CustomModal
    isOpen={isOpen}
    onClose={onClose}
    title={editingTemplate?.id ? `Chỉnh Sửa Mẫu Zalo — ${editingTemplate.name}` : 'Tạo Mẫu Tin Zalo ZNS / ZBS & Xem Trước Trực Tiếp'}
    width={960}
  >
    <ZaloTemplateFormInner
      key={editingTemplate?.id || 'create-zalo-tpl'}
      oaName={oaName}
      oaId={oaId}
      editingTemplate={editingTemplate}
      onClose={onClose}
      onSaved={onSaved}
    />
  </CustomModal>
);

export default ZaloTemplateCreateModal;
