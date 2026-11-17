import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Edit2,
  Inbox,
  MousePointerClick,
  Power,
  Search,
  Send,
  Trash2,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, EmptyState, FormCard } from '../../components/ui/AutoDataLoadingModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { FormEditorModal } from './FormEditorModal';
import { FormEmbedModal } from './FormEmbedModal';
import { FormSubmissionsModal } from './FormSubmissionsModal';
import { resolveFormTheme, type AudienceRef, type MktFormDto, type RoundRef } from './types';

interface FormsTabProps {
  forms: MktFormDto[];
  audiences: AudienceRef[];
  rounds: RoundRef[];
  onReload: () => Promise<void>;
  externalCreateTrigger?: number;
}

export const FormsTab: React.FC<FormsTabProps> = ({
  forms,
  audiences,
  rounds,
  onReload,
}) => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const canCreate = can('forms_triggers', 'create');
  const canEdit = can('forms_triggers', 'edit');
  const canDelete = can('forms_triggers', 'delete');

  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'marketing_nurture' | 'sale_round'>('all');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<MktFormDto | null>(null);
  const [editorPreset, setEditorPreset] = useState<'phone_only' | 'email_only' | 'full'>('phone_only');

  const [embedForm, setEmbedForm] = useState<MktFormDto | null>(null);
  const [submissionsForm, setSubmissionsForm] = useState<MktFormDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MktFormDto | null>(null);

  const openCreateWithPreset = (preset: 'phone_only' | 'email_only' | 'full') => {
    setEditingForm(null);
    setEditorPreset(preset);
    setEditorOpen(true);
  };

  const openEdit = (form: MktFormDto) => {
    setEditingForm(form);
    setEditorOpen(true);
  };

  const handleToggleStatus = async (form: MktFormDto) => {
    const nextStatus = form.status === 'active' ? 'paused' : 'active';
    try {
      await apiRequest(`/marketing/forms/${form.id}`, {
        method: 'PUT',
        token,
        tenantSlug,
        body: { status: nextStatus },
      });
      toast.success(nextStatus === 'active' ? 'Đã kích hoạt Biểu mẫu!' : 'Đã tạm dừng nhận phản hồi!');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái Biểu mẫu.'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/marketing/forms/${deleteTarget.id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã xóa Biểu mẫu.');
      setDeleteTarget(null);
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa Biểu mẫu.'));
    }
  };

  const filteredForms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return forms.filter((f) => {
      if (modeFilter !== 'all' && f.routing_mode !== modeFilter) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q) ||
        f.public_token.toLowerCase().includes(q)
      );
    });
  }, [forms, search, modeFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Quick-Start Presets */}
      {canCreate && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.85rem' }}>
          <FormCard
            icon={<Zap size={18} />}
            title="Mẫu Nhanh: Form Chỉ Thu SĐT"
            description="Tối ưu chuyển đổi Landing Page — không ép khách nhập Email nếu đã có SĐT."
            onClick={() => openCreateWithPreset('phone_only')}
            badge={<Badge tone="primary">1 Chạm</Badge>}
          />
          <FormCard
            icon={<Send size={18} />}
            title="Mẫu Nhanh: Form Chỉ Thu Email"
            description="Thu thập độc giả nhận Ebook / Báo cáo ngành vào kho Marketing Nurture."
            onClick={() => openCreateWithPreset('email_only')}
            badge={<Badge tone="info">Newsletter</Badge>}
          />
          <FormCard
            icon={<CheckCircle2 size={18} />}
            title="Mẫu Nhanh: Form Tư Vấn Chia Sale"
            description="Thu Họ tên, SĐT, Gói dịch vụ & định tuyến thẳng vào Vòng chia Auto Data."
            onClick={() => openCreateWithPreset('full')}
            badge={<Badge tone="success">Mode B</Badge>}
          />
        </div>
      )}

      {/* Search & Mode Filter Toolbar */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '0.75rem 1rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            className="form-input"
            style={{ height: 40, paddingLeft: 36, background: '#F8F9FA', border: '1px solid #E2E8F0' }}
            placeholder="Tìm theo tên biểu mẫu hoặc mã token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(
            [
              ['all', `Tất cả (${forms.length})`],
              ['marketing_nurture', 'Mode A: Nurture'],
              ['sale_round', 'Mode B: Chia Sale'],
            ] as const
          ).map(([key, label]) => {
            const active = modeFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setModeFilter(key)}
                style={{
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: active ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                  background: active ? '#EEF2FF' : '#FFFFFF',
                  color: active ? '#1E40FF' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Forms Grid */}
      {filteredForms.length === 0 ? (
        <EmptyState
          title="Chưa có Biểu mẫu phù hợp"
          description="Chọn một trong 3 mẫu khởi tạo nhanh phía trên để thiết kế Form kéo thả và nhúng lên Website."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {filteredForms.map((f) => {
            const theme = resolveFormTheme(f.theme);
            const isPaused = f.status !== 'active';
            return (
              <FormCard
                key={f.id}
                icon={<MousePointerClick size={18} />}
                title={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span>{f.name}</span>
                    {isPaused && <Badge tone="warning">Tạm dừng</Badge>}
                  </span>
                }
                description={f.description || `${f.fields.length} trường dữ liệu • Layout ${theme.layout}`}
                badge={
                  f.routing_mode === 'sale_round' ? (
                    <Badge tone="success">Mode B: Chia Sale</Badge>
                  ) : (
                    <Badge tone="primary">Mode A: Nurture</Badge>
                  )
                }
                footer={
                  <>
                    <button
                      type="button"
                      onClick={() => setSubmissionsForm(f)}
                      style={{
                        border: '1px solid #DBEAFE',
                        background: '#F8FAFF',
                        color: '#1E40FF',
                        borderRadius: 9,
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        cursor: 'pointer',
                      }}
                      title="Xem danh sách lượt điền (Bảo mật PII)"
                    >
                      <Inbox size={13} /> {f.submission_count.toLocaleString('vi-VN')} lượt điền
                    </button>

                    <div style={{ display: 'flex', gap: 5 }}>
                      <button
                        type="button"
                        onClick={() => setEmbedForm(f)}
                        className="btn secondary sm"
                        style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title="Mã nhúng 4 giao diện & Kiểm thử"
                      >
                        <Code2 size={13} /> Nhúng
                      </button>
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleToggleStatus(f)}
                            className="btn secondary sm"
                            style={{ height: 36, color: isPaused ? '#059669' : '#D97706' }}
                            title={isPaused ? 'Kích hoạt lại' : 'Tạm dừng Form'}
                          >
                            <Power size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(f)}
                            className="btn secondary sm"
                            style={{ height: 36 }}
                            title="Thiết kế kéo thả"
                          >
                            <Edit2 size={13} />
                          </button>
                        </>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(f)}
                          className="btn secondary sm"
                          style={{ height: 36, color: '#DC2626' }}
                          title="Xóa Biểu mẫu"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </>
                }
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  <Badge tone="neutral">{f.fields.length} trường</Badge>
                  {f.require_otp && <Badge tone="warning">OTP {f.otp_channel.toUpperCase()}</Badge>}
                  {f.target_audience_name && <Badge tone="info">Tệp: {f.target_audience_name}</Badge>}
                  {f.distribution_round_name && <Badge tone="purple">Vòng: {f.distribution_round_name}</Badge>}
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginLeft: 'auto' }}>
                    {formatShortDate(f.created_at)}
                  </span>
                </div>
              </FormCard>
            );
          })}
        </div>
      )}

      <FormEditorModal
        isOpen={editorOpen}
        editingForm={editingForm}
        initialPreset={editorPreset}
        audiences={audiences}
        rounds={rounds}
        onClose={() => setEditorOpen(false)}
        onSaved={onReload}
      />

      <FormEmbedModal
        form={embedForm}
        onClose={() => setEmbedForm(null)}
        onSubmitted={onReload}
      />

      <FormSubmissionsModal
        form={submissionsForm}
        onClose={() => setSubmissionsForm(null)}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Xóa Biểu mẫu thu Lead?"
        message={`Bạn có chắc chắn muốn xóa biểu mẫu "${deleteTarget?.name || ''}"? Các mã nhúng đang gắn trên Website sẽ ngừng hoạt động.`}
        confirmText="Xóa Biểu mẫu"
        onConfirm={() => void handleDeleteConfirm()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default FormsTab;
