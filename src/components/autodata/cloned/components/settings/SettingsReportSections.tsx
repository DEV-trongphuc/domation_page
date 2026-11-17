import React from 'react';
import { Lock, Users, FileText, TrendingUp, Plus, Trash2, Radio } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { DEFAULT_NOTE_TYPES, type NoteTypeConfig, type TenantSettingsDto } from '../../utils/pipelineConfig';

interface Props {
  settings: TenantSettingsDto;
  updateSetting: <K extends keyof TenantSettingsDto>(key: K, val: TenantSettingsDto[K]) => void;
  t: (s: string) => string;
}

export const SettingsReportSections: React.FC<Props> = ({ settings, updateSetting, t }) => {
  const rolePerms = settings.role_permissions || {
    allow_manager_export_csv: true,
    allow_manager_manage_pipelines: false,
    allow_sale_create_lead: false,
    allow_sale_reassign_lead: false,
  };
  const noteTypes: NoteTypeConfig[] =
    Array.isArray(settings.note_types) && settings.note_types.length > 0
      ? settings.note_types
      : DEFAULT_NOTE_TYPES;

  const updateNote = (idx: number, patch: Partial<NoteTypeConfig>) => {
    const next = noteTypes.map((n, i) => (i === idx ? { ...n, ...patch } : n));
    updateSetting('note_types', next);
  };

  const addNoteType = () => {
    updateSetting('note_types', [
      ...noteTypes,
      { value: `CUSTOM_NOTE_${noteTypes.length + 1}`, label: 'Ghi chú mới', cat: 'note', internal_only: false },
    ]);
  };

  const removeNoteType = (idx: number) => {
    if (noteTypes.length <= 1) return;
    updateSetting('note_types', noteTypes.filter((_, i) => i !== idx));
  };

  const prefixLen = settings.pii_mask_phone_prefix ?? 4;
  const suffixLen = settings.pii_mask_phone_suffix ?? 3;
  const maskCh = (settings.pii_mask_char || '*')[0] || '*';
  const samplePhone = '0912345678';
  const maskedDemo =
    settings.pii_masking_enabled === false
      ? samplePhone
      : `${samplePhone.slice(0, prefixLen)}${maskCh.repeat(Math.max(3, 10 - prefixLen - suffixLen))}${suffixLen > 0 ? samplePhone.slice(-suffixLen) : ''}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
      {/* 1. PII Masking & Security */}
      <div data-tour="settings-rep-pii" className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', background: '#0f172a', color: 'white', padding: 4, borderRadius: 6 }}>
            <Lock size={16} />
          </span>
          {t('Bảo Mật Dữ Liệu Khách Hàng (PII Masking)')}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          {t('Xem trước che SĐT')}: <code style={{ fontWeight: 700, color: '#1E40FF' }}>{maskedDemo}</code>
        </p>

        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">{t('Giữ số đầu (Prefix)')}</label>
            <input
              type="number"
              min={0}
              max={6}
              className="form-input"
              value={prefixLen}
              onChange={(e) => updateSetting('pii_mask_phone_prefix', Math.max(0, Math.min(6, Number(e.target.value) || 0)))}
            />
          </div>
          <div>
            <label className="form-label">{t('Giữ số cuối (Suffix)')}</label>
            <input
              type="number"
              min={0}
              max={6}
              className="form-input"
              value={suffixLen}
              onChange={(e) => updateSetting('pii_mask_phone_suffix', Math.max(0, Math.min(6, Number(e.target.value) || 0)))}
            />
          </div>
          <div>
            <label className="form-label">{t('Ký tự che (Mask Char)')}</label>
            <input
              maxLength={1}
              className="form-input"
              value={maskCh}
              onChange={(e) => updateSetting('pii_mask_char', (e.target.value || '*')[0])}
            />
          </div>
        </div>

        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { key: 'pii_masking_enabled', label: 'Kích hoạt che PII theo phân quyền', val: settings.pii_masking_enabled ?? true },
            { key: 'pii_mask_before_accept', label: 'Che SĐT trước khi Sale bấm Tiếp nhận', val: settings.pii_mask_before_accept ?? true },
            { key: 'pii_mask_all_sales', label: 'Che SĐT của mọi Sale kể cả chính chủ', val: settings.pii_mask_all_sales ?? false },
            { key: 'pii_mask_email', label: 'Che địa chỉ Email khách hàng', val: settings.pii_mask_email ?? true },
            { key: 'pii_hide_internal_notes', label: 'Ẩn ghi chú nội bộ Admin khỏi Sale/Đại lý', val: settings.pii_hide_internal_notes ?? true },
          ].map((item) => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{t(item.label)}</span>
              <ToggleSwitch checked={Boolean(item.val)} onChange={(c) => updateSetting(item.key as any, c)} small />
            </div>
          ))}
        </div>
      </div>

      {/* 2. RBAC, Co-Managers Limit & UX Table Limits */}
      <div data-tour="settings-rep-rbac" className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', background: '#1E40FF', color: 'white', padding: 4, borderRadius: 6 }}>
            <Users size={16} />
          </span>
          {t('Phân Quyền RBAC, Giới Hạn Đồng Quản Lý & Bảng Dữ Liệu')}
        </h3>

        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">{t('Số Đồng quản lý tối đa mỗi Sale/Đại lý (0 = Tắt)')}</label>
            <input
              type="number"
              min={0}
              max={20}
              className="form-input"
              value={settings.max_co_managers_per_consultant ?? 3}
              onChange={(e) => updateSetting('max_co_managers_per_consultant', Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
            />
          </div>
          <div>
            <label className="form-label">{t('Số dòng mỗi trang mặc định (Page Size)')}</label>
            <CustomSelect
              options={[10, 20, 30, 50, 100].map((n) => ({ value: String(n), label: `${n} dòng / trang` }))}
              value={String(settings.default_table_page_size ?? 20)}
              onChange={(val) => updateSetting('default_table_page_size', Number(val) || 20)}
              width="100%"
            />
          </div>
          <div>
            <label className="form-label">{t('Giới hạn dòng xuất Export CSV')}</label>
            <input
              type="number"
              min={10}
              max={50000}
              className="form-input"
              value={settings.max_export_rows ?? 5000}
              onChange={(e) => updateSetting('max_export_rows', Math.max(10, Math.min(50000, Number(e.target.value) || 5000)))}
            />
          </div>
          <div>
            <label className="form-label">{t('Số lượt cộng bù khi duyệt 1 Ticket lỗi')}</label>
            <input
              type="number"
              min={0}
              max={10}
              className="form-input"
              value={settings.compensation_credits_per_ticket ?? 1}
              onChange={(e) => updateSetting('compensation_credits_per_ticket', Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
            />
          </div>
        </div>

        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { key: 'allow_manager_export_csv', label: 'Cho phép Manager xuất CSV' },
            { key: 'allow_manager_manage_pipelines', label: 'Cho phép Manager chỉnh sửa Pipeline' },
            { key: 'allow_sale_create_lead', label: 'Cho phép Sale tự tạo Lead CRM mới' },
            { key: 'allow_sale_reassign_lead', label: 'Cho phép Sale tự chuyển giao Lead' },
          ].map((item) => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{t(item.label)}</span>
              <ToggleSwitch
                checked={Boolean((rolePerms as any)[item.key])}
                onChange={(c) => updateSetting('role_permissions', { ...rolePerms, [item.key]: c })}
                small
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Custom Note Types CRUD */}
      <div data-tour="settings-rep-notetypes" className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-flex', background: '#0284c7', color: 'white', padding: 4, borderRadius: 6 }}>
                <FileText size={16} />
              </span>
              {t('Danh Mục Loại Ghi Chú Chăm Sóc (Note Types)')}
            </h3>
          </div>
          <button type="button" onClick={addNoteType} className="btn outline sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> {t('Thêm loại ghi chú')}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {noteTypes.map((nt, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 110px auto auto', gap: '0.625rem', alignItems: 'center', background: 'var(--color-bg)', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--color-border-light)' }}>
              <input
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                value={nt.value}
                onChange={(e) => updateNote(idx, { value: e.target.value })}
                placeholder="CALL_CONNECTED"
              />
              <input
                className="form-input"
                style={{ fontSize: '0.82rem' }}
                value={nt.label}
                onChange={(e) => updateNote(idx, { label: e.target.value })}
                placeholder="Nhãn hiển thị"
              />
              <select
                value={nt.cat}
                onChange={(e) => updateNote(idx, { cat: e.target.value as any })}
                className="form-input"
                style={{ fontSize: '0.8rem' }}
              >
                <option value="call">Cuộc gọi</option>
                <option value="zalo">Zalo/Chat</option>
                <option value="note">Ghi chú</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                <input
                  type="checkbox"
                  checked={Boolean(nt.internal_only)}
                  onChange={(e) => updateNote(idx, { internal_only: e.target.checked })}
                />
                {t('Nội bộ')}
              </label>
              <button
                type="button"
                onClick={() => removeNoteType(idx)}
                style={{ border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Ads & Fair-Share KPI Benchmarks */}
      <div data-tour="settings-rep-benchmarks" className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', background: '#10b981', color: 'white', padding: 4, borderRadius: 6 }}>
            <TrendingUp size={16} />
          </span>
          {t('Ngưỡng Đánh Giá KPI Quảng Cáo & Công Bằng Fair-Share')}
        </h3>

        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label">{t('Giá trị đơn chốt CAPI mặc định (VNĐ)')}</label>
            <input
              type="number"
              min={0}
              step={1000000}
              className="form-input"
              value={settings.default_closed_deal_value_vnd ?? 50000000}
              onChange={(e) => updateSetting('default_closed_deal_value_vnd', Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <div>
            <label className="form-label">{t('Ngưỡng CPL mục tiêu cảnh báo đắt (VNĐ / Lead)')}</label>
            <input
              type="number"
              min={1000}
              step={10000}
              className="form-input"
              value={settings.ads_target_cpl_vnd ?? 300000}
              onChange={(e) => updateSetting('ads_target_cpl_vnd', Math.max(1000, Number(e.target.value) || 300000))}
            />
          </div>
          <div>
            <label className="form-label">{t('Tỷ lệ Lead chất lượng tối thiểu mục tiêu (%)')}</label>
            <input
              type="number"
              min={1}
              max={100}
              className="form-input"
              value={settings.ads_min_positive_rate_pct ?? 25}
              onChange={(e) => updateSetting('ads_min_positive_rate_pct', Math.max(1, Math.min(100, Number(e.target.value) || 25)))}
            />
          </div>
          <div>
            <label className="form-label">{t('Ngưỡng cảnh báo Fatigue Tần suất Ads (Frequency)')}</label>
            <input
              type="number"
              min={1}
              max={20}
              step={0.1}
              className="form-input"
              value={settings.ads_max_frequency_fatigue ?? 3.5}
              onChange={(e) => updateSetting('ads_max_frequency_fatigue', Math.max(1, Math.min(20, Number(e.target.value) || 3.5)))}
            />
          </div>
          <div>
            <label className="form-label">{t('Ngưỡng cảnh báo lệch công bằng Fair-Share (%)')}</label>
            <input
              type="number"
              min={10}
              max={100}
              className="form-input"
              value={settings.fairness_warning_threshold_pct ?? 75}
              onChange={(e) => updateSetting('fairness_warning_threshold_pct', Math.max(10, Math.min(100, Number(e.target.value) || 75)))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SettingsAiGlobalSection: React.FC<Props> = ({ settings, updateSetting, t }) => (
  <div data-tour="settings-ai-global" className="card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', background: '#6366f1', color: 'white', padding: 4, borderRadius: 6 }}>
        <Radio size={16} />
      </span>
      {t('Tham Số Meta CAPI & Outbound Webhook Toàn Cục')}
    </h3>
    <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', marginTop: '1rem' }}>
      <div>
        <label className="form-label">{t('CAPI Action Source')}</label>
        <CustomSelect
          options={['system_generated', 'website', 'app', 'phone_call', 'chat', 'email', 'other'].map((s) => ({
            value: s,
            label: s,
          }))}
          value={settings.capi_action_source || 'system_generated'}
          onChange={(val) => updateSetting('capi_action_source', String(val))}
          width="100%"
        />
      </div>
      <div>
        <label className="form-label">{t('Meta Graph API Version')}</label>
        <input
          className="form-input"
          value={settings.capi_api_version || 'v21.0'}
          onChange={(e) => updateSetting('capi_api_version', e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">{t('Tên nguồn CAPI (Event Source Name)')}</label>
        <input
          className="form-input"
          value={settings.capi_event_source_name || 'DOMATION AutoData'}
          onChange={(e) => updateSetting('capi_event_source_name', e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">{t('Custom Field Key đọc giá trị chốt đơn')}</label>
        <input
          className="form-input"
          placeholder="VD: deal_value_vnd"
          value={settings.capi_value_custom_field_key ?? ''}
          onChange={(e) => updateSetting('capi_value_custom_field_key', e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">{t('CAPI Timeout (ms)')}</label>
        <input
          type="number"
          min={1000}
          max={30000}
          className="form-input"
          value={settings.capi_timeout_ms ?? 8000}
          onChange={(e) => updateSetting('capi_timeout_ms', Math.max(1000, Math.min(30000, Number(e.target.value) || 8000)))}
        />
      </div>
      <div>
        <label className="form-label">{t('Số lần thử lại Webhook tối đa (1–10)')}</label>
        <input
          type="number"
          min={1}
          max={10}
          className="form-input"
          value={settings.outbound_webhook_max_retries ?? 5}
          onChange={(e) => updateSetting('outbound_webhook_max_retries', Math.max(1, Math.min(10, Number(e.target.value) || 5)))}
        />
      </div>
    </div>
  </div>
);
