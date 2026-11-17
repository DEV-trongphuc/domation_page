import React, { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KeyRound, Palette, Plus, Save, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { FormLivePreviewPanel, SortableFieldRow } from './FormEditorParts';
import { FormRoutingSection, FormThemeSection } from './FormRoutingAndThemeSections';
import {
  FIELD_PALETTE_ITEMS,
  createPresetFormFields,
  hasAtLeastOneIdentityField,
  resolveFormThankYou,
  resolveFormTheme,
  type AudienceRef,
  type FormFieldItem,
  type FormFieldType,
  type FormThankYouConfig,
  type FormThemeConfig,
  type MktFormDto,
  type RoundRef,
} from './types';

interface EditorInnerProps {
  editingForm: MktFormDto | null;
  initialPreset: 'phone_only' | 'email_only' | 'full';
  audiences: AudienceRef[];
  rounds: RoundRef[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}

const FormEditorInner: React.FC<EditorInnerProps> = ({
  editingForm,
  initialPreset,
  audiences,
  rounds,
  onClose,
  onSaved,
}) => {
  const { token, tenantSlug } = useAuth();
  const { terminology, hasModule } = useEntitlement();
  const hasSaleRoundEntitlement = hasModule('rounds');

  const [name, setName] = useState(() =>
    editingForm?.name ||
    (initialPreset === 'phone_only'
      ? 'Form Thu SĐT Nhanh (Không bắt buộc Email)'
      : initialPreset === 'email_only'
        ? 'Form Đăng Ký Nhận Tài Liệu Email'
        : `Form Tư Vấn ${terminology.customerLabel} Đa Trường`)
  );
  const [description, setDescription] = useState(
    () => editingForm?.description || 'Điền thông tin để nhận tư vấn và tài liệu ưu đãi ngay lập tức.'
  );
  const [routingMode, setRoutingMode] = useState<'marketing_nurture' | 'sale_round'>(
    () => editingForm?.routing_mode || (initialPreset === 'full' ? 'sale_round' : 'marketing_nurture')
  );
  const [targetAudienceId, setTargetAudienceId] = useState(() => editingForm?.target_audience_id || '');
  const [distributionRoundId, setDistributionRoundId] = useState(() => editingForm?.distribution_round_id || '');
  const [requireOtp, setRequireOtp] = useState(() => Boolean(editingForm?.require_otp));
  const [otpChannel, setOtpChannel] = useState<'email' | 'sms'>(() => editingForm?.otp_channel || 'sms');
  const [fields, setFields] = useState<FormFieldItem[]>(() =>
    editingForm?.fields && editingForm.fields.length > 0
      ? editingForm.fields
      : createPresetFormFields(initialPreset)
  );
  const [theme, setTheme] = useState<FormThemeConfig>(() => resolveFormTheme(editingForm?.theme));
  const [thankYou, setThankYou] = useState<FormThankYouConfig>(() => resolveFormThankYou(editingForm?.thank_you));
  const [inspectorSection, setInspectorSection] = useState<'fields' | 'routing' | 'theme'>('fields');
  const [previewThankYou, setPreviewThankYou] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields((prev) => {
      const oldIdx = prev.findIndex((f) => f.id === active.id);
      const newIdx = prev.findIndex((f) => f.id === over.id);
      return oldIdx >= 0 && newIdx >= 0 ? arrayMove(prev, oldIdx, newIdx) : prev;
    });
  };

  const addPaletteField = (type: FormFieldType, defaultKey: string, label: string, placeholder: string) => {
    setFields((prev) => {
      const keyExists = prev.some((p) => p.key === defaultKey);
      const nextKey = keyExists ? `${defaultKey}_${prev.length + 1}` : defaultKey;
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          key: nextKey,
          label,
          type,
          required: type === 'phone' || type === 'email',
          placeholder,
          options: type === 'select' ? ['Lựa chọn 1', 'Lựa chọn 2', 'Lựa chọn 3'] : undefined,
        },
      ];
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên Biểu mẫu.');
      return;
    }
    if (!hasAtLeastOneIdentityField(fields)) {
      toast.error('Biểu mẫu cần ít nhất 1 trường Số điện thoại hoặc Email (không bắt buộc có cả hai).');
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        routing_mode: routingMode,
        target_audience_id: targetAudienceId || null,
        distribution_round_id: routingMode === 'sale_round' ? distributionRoundId || null : null,
        require_otp: requireOtp,
        otp_channel: otpChannel,
        fields,
        theme,
        thank_you: thankYou,
      };
      if (editingForm) {
        await apiRequest(`/marketing/forms/${editingForm.id}`, { method: 'PUT', token, tenantSlug, body });
        toast.success('Đã cập nhật Biểu mẫu thành công!');
      } else {
        await apiRequest('/marketing/forms', { method: 'POST', token, tenantSlug, body });
        toast.success('Đã xuất bản Biểu mẫu mới!');
      }
      await onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu cấu hình Biểu mẫu.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.95fr)', gap: '1.15rem', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Tên Biểu mẫu</label>
            <input className="form-input" style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Mô tả hiển thị dưới tiêu đề</label>
            <input className="form-input" style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 12, background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
          {(
            [
              ['fields', `1. Trường Kéo Thả (${fields.length})`, Sparkles],
              ['routing', '2. Định Tuyến & OTP', KeyRound],
              ['theme', '3. Giao Diện & Cảm Ơn', Palette],
            ] as const
          ).map(([key, label, Icon]) => {
            const active = inspectorSection === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setInspectorSection(key)}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 9,
                  border: active ? '1px solid rgba(30,64,255,0.2)' : 'none',
                  background: active ? '#FFFFFF' : 'transparent',
                  color: active ? '#1E40FF' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Icon size={14} /> {label}
              </button>
            );
          })}
        </div>

        {inspectorSection === 'fields' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                Hỗ trợ Form chỉ SĐT hoặc chỉ Email — kéo biểu tượng ⠿ để đổi vị trí:
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => setFields(createPresetFormFields('phone_only'))} className="btn secondary sm" style={{ height: 32, fontSize: '0.74rem' }}>Mẫu Chỉ SĐT</button>
                <button type="button" onClick={() => setFields(createPresetFormFields('email_only'))} className="btn secondary sm" style={{ height: 32, fontSize: '0.74rem' }}>Mẫu Chỉ Email</button>
                <button type="button" onClick={() => setFields(createPresetFormFields('full'))} className="btn secondary sm" style={{ height: 32, fontSize: '0.74rem' }}>Mẫu Đầy Đủ</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(136px, 1fr))', gap: 6 }}>
              {FIELD_PALETTE_ITEMS.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => addPaletteField(item.type, item.defaultKey, item.label, item.placeholder)}
                  style={{ padding: '0.5rem 0.65rem', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8F9FA', textAlign: 'left', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E40FF', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus size={12} /> {item.label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: 2 }}>{item.hint}</div>
                </button>
              ))}
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 330, overflowY: 'auto', paddingRight: 4 }}>
                  {fields.map((fld, idx) => (
                    <SortableFieldRow
                      key={fld.id}
                      field={fld}
                      index={idx}
                      total={fields.length}
                      onChange={(patch) => setFields((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)))}
                      onMove={(delta) => setFields((prev) => {
                        const target = idx + delta;
                        return target >= 0 && target < prev.length ? arrayMove(prev, idx, target) : prev;
                      })}
                      onRemove={() => setFields((prev) => prev.filter((_, i) => i !== idx))}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {inspectorSection === 'routing' && (
          <FormRoutingSection
            routingMode={routingMode}
            onChangeRoutingMode={setRoutingMode}
            hasSaleRoundEntitlement={hasSaleRoundEntitlement}
            targetAudienceId={targetAudienceId}
            onChangeAudience={setTargetAudienceId}
            distributionRoundId={distributionRoundId}
            onChangeRound={setDistributionRoundId}
            requireOtp={requireOtp}
            onChangeRequireOtp={setRequireOtp}
            otpChannel={otpChannel}
            onChangeOtpChannel={setOtpChannel}
            audiences={audiences}
            rounds={rounds}
          />
        )}

        {inspectorSection === 'theme' && (
          <FormThemeSection
            theme={theme}
            onChangeTheme={(patch) => setTheme((p) => ({ ...p, ...patch }))}
            thankYou={thankYou}
            onChangeThankYou={(patch) => setThankYou((p) => ({ ...p, ...patch }))}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>Hủy</button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            style={{ height: 44, padding: '0 1.35rem', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <Save size={15} /> {saving ? 'Đang lưu...' : editingForm ? 'Cập Nhật Biểu Mẫu' : 'Lưu & Phát Hành Form'}
          </button>
        </div>
      </div>

      <FormLivePreviewPanel
        name={name}
        description={description}
        fields={fields}
        theme={theme}
        thankYou={thankYou}
        requireOtp={requireOtp}
        otpChannel={otpChannel}
        previewThankYou={previewThankYou}
        onToggleThankYou={() => setPreviewThankYou((v) => !v)}
        previewValues={previewValues}
        onChangePreviewValue={(fid, val) => setPreviewValues((p) => ({ ...p, [fid]: val }))}
      />
    </div>
  );
};

interface FormEditorModalProps {
  isOpen: boolean;
  editingForm: MktFormDto | null;
  initialPreset: 'phone_only' | 'email_only' | 'full';
  audiences: AudienceRef[];
  rounds: RoundRef[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export const FormEditorModal: React.FC<FormEditorModalProps> = ({
  isOpen,
  editingForm,
  initialPreset,
  audiences,
  rounds,
  onClose,
  onSaved,
}) => (
  <CustomModal
    isOpen={isOpen}
    onClose={onClose}
    title={editingForm ? `Thiết Kế Biểu Mẫu — ${editingForm.name}` : 'Thiết Kế Biểu Mẫu Thu Lead Đa Chế Độ'}
    width={980}
  >
    {isOpen && (
      <FormEditorInner
        key={editingForm?.id || `new_${initialPreset}`}
        editingForm={editingForm}
        initialPreset={initialPreset}
        audiences={audiences}
        rounds={rounds}
        onClose={onClose}
        onSaved={onSaved}
      />
    )}
  </CustomModal>
);

export default FormEditorModal;
