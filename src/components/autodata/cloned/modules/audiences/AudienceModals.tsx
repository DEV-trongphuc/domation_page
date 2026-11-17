import React, { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  FileSpreadsheet,
  GitBranch,
  Plus,
  RefreshCw,
  Scissors,
  Send,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Badge, Card, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { maskPiiEmail, maskPiiPhone } from '../../contexts/entitlementConstants';
import type {
  AudienceExclusionItem,
  AudienceItem,
  AudienceType,
  MasterContactRow,
} from './audienceTypes';

/* ============================================================================
 * 1. CREATE / EDIT STATIC OR SYNC AUDIENCE ("TỆP DATA")
 * ============================================================================ */

interface StaticAudienceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAudience?: AudienceItem | null;
  initialLeadIds?: string[];
  onSaved: (saved: AudienceItem) => void;
}

export const StaticAudienceFormModal: React.FC<StaticAudienceFormModalProps> = ({
  isOpen,
  onClose,
  initialAudience,
  initialLeadIds = [],
  onSaved,
}) => {
  const { token, tenantSlug } = useAuth();
  const { terminology } = useEntitlement();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [audienceType, setAudienceType] = useState<'static_data' | 'sync_data'>('static_data');
  const [syncUrl, setSyncUrl] = useState('');
  const [colorHex, setColorHex] = useState('#0284C7');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const syncForm = () => {
      if (initialAudience) {
        setName(initialAudience.name);
        setDescription(initialAudience.description || '');
        setAudienceType(initialAudience.audience_type === 'sync_data' ? 'sync_data' : 'static_data');
        setSyncUrl(initialAudience.sync_source_url || '');
        setColorHex(initialAudience.color_hex || '#0284C7');
      } else {
        setName('');
        setDescription(
          initialLeadIds.length > 0
            ? `Lưu từ bộ lọc danh sách (${initialLeadIds.length} ${terminology.customerLabel})`
            : ''
        );
        setAudienceType('static_data');
        setSyncUrl('');
        setColorHex('#0284C7');
      }
    };
    syncForm();
  }, [isOpen, initialAudience, initialLeadIds.length, terminology.customerLabel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const body = {
      name: name.trim(),
      description: description.trim(),
      audience_type: audienceType as AudienceType,
      sync_source_url: audienceType === 'sync_data' ? syncUrl.trim() : null,
      sync_config: audienceType === 'sync_data' ? { url: syncUrl.trim() } : {},
      color_hex: colorHex,
      ...(initialLeadIds.length > 0 ? { initial_lead_ids: initialLeadIds } : {}),
    };

    try {
      let saved: AudienceItem;
      if (initialAudience?.id) {
        saved = await apiRequest<AudienceItem>(`/audiences/${initialAudience.id}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body,
        });
      } else {
        saved = await apiRequest<AudienceItem>('/audiences', {
          method: 'POST',
          token,
          tenantSlug,
          body,
        });
      }
      onSaved(saved);
      toast.success(initialAudience ? 'Đã cập nhật Tệp Data!' : 'Đã tạo Tệp Data thành công!');
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Tệp Data.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialAudience ? `Chỉnh sửa Tệp Data: ${initialAudience.name}` : 'Tạo Tệp Data Mới (Tĩnh / Đồng bộ Nguồn)'}
      width="620px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <PillTabs
          tabs={[
            { key: 'static_data', label: 'Tệp Data Tĩnh (CSV / Form / Bộ lọc CRM)', icon: <Users size={15} /> },
            { key: 'sync_data', label: 'Tệp Đồng bộ Google Sheets 2 Chiều', icon: <FileSpreadsheet size={15} /> },
          ]}
          activeKey={audienceType}
          onChange={setAudienceType}
        />

        {initialLeadIds.length > 0 && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 14,
              background: 'rgba(30, 64, 255, 0.08)',
              border: '1px solid rgba(30, 64, 255, 0.2)',
              fontSize: '0.8rem',
              color: '#1E40FF',
              fontWeight: 600,
            }}
          >
            Sẽ nạp ngay <strong>{initialLeadIds.length}</strong> {terminology.customerLabel} đang chọn vào Tệp Data này.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '0.85rem' }}>
          <div className="form-group">
            <label className="form-label">Tên Tệp Data *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder={`Ví dụ: Danh sách ${terminology.customerLabel} Sự kiện Ra mắt Q4`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Màu thẻ</label>
            <input
              type="color"
              className="form-input"
              style={{ padding: 4, cursor: 'pointer' }}
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Mô tả nguồn & ghi chú</label>
          <input
            type="text"
            className="form-input"
            placeholder="Thu thập từ Form Landing Page, nhập CSV hoặc lưu từ CRM..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {audienceType === 'sync_data' && (
          <div className="form-group">
            <label className="form-label">Liên kết Google Sheets CSV / Apps Script URL *</label>
            <input
              type="url"
              required
              className="form-input"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={syncUrl}
              onChange={(e) => setSyncUrl(e.target.value)}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button type="button" className="btn secondary" onClick={onClose}>
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-inkica-primary"
            style={{
              height: 42,
              padding: '0 1.25rem',
              borderRadius: 14,
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {saving ? 'Đang lưu...' : initialAudience ? 'Lưu thay đổi' : 'Tạo Tệp Data'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};

/* ============================================================================
 * 2. UNIFIED CSV / PASTE IMPORT INTO SHARED LEADS + AUDIENCE
 * ============================================================================ */

interface ImportAudienceCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  audience: AudienceItem | null;
  onImported: (addedRows: MasterContactRow[], targetAudienceId: string) => void;
}

export const ImportAudienceCsvModal: React.FC<ImportAudienceCsvModalProps> = ({
  isOpen,
  onClose,
  audience,
  onImported,
}) => {
  const { token, tenantSlug } = useAuth();
  const { hasModule, terminology } = useEntitlement();
  const canRouteToSale = hasModule('rounds');

  const [csvText, setCsvText] = useState('');
  const [importMode, setImportMode] = useState<'marketing_nurture' | 'unassigned_pending'>('marketing_nurture');
  const [defaultSource, setDefaultSource] = useState('CSV Import');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const reset = () => {
      setCsvText('');
      setImportMode('marketing_nurture');
      setDefaultSource(audience ? `Tệp: ${audience.name}` : 'CSV Import');
    };
    reset();
  }, [isOpen, audience]);

  const parseDraftRows = (raw: string): Array<{
    name: string;
    phone?: string;
    email?: string;
    source?: string;
    product_interest?: string;
  }> => {
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return [];

    const sep = lines[0].includes('\t') ? '\t' : ',';
    const firstCols = lines[0].split(sep).map((c) => c.trim().toLowerCase());
    const hasHeader =
      firstCols.some((c) => c.includes('name') || c.includes('tên') || c.includes('phone') || c.includes('sđt') || c.includes('email'));

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const out: Array<{ name: string; phone?: string; email?: string; source?: string; product_interest?: string }> = [];

    for (const line of dataLines) {
      const cols = line.split(sep).map((c) => c.replace(/^"|"$/g, '').trim());
      if (cols.length === 0) continue;
      const name = cols[0] || `${terminology.customerLabel} mới`;
      const second = cols[1] || '';
      const third = cols[2] || '';
      let phone: string | undefined;
      let email: string | undefined;

      if (second.includes('@')) {
        email = second;
        if (third && !third.includes('@')) phone = third;
      } else {
        if (second) phone = second;
        if (third && third.includes('@')) email = third;
      }
      if (!phone && !email) continue;
      out.push({
        name,
        phone,
        email,
        source: cols[3] || defaultSource,
        product_interest: cols[4] || undefined,
      });
    }
    return out;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setCsvText(content);
  };

  const parsedPreview = parseDraftRows(csvText);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audience || parsedPreview.length === 0) return;
    setImporting(true);
    try {
      await apiRequest(`/audiences/${audience.id}/import`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          rows: parsedPreview,
          status: canRouteToSale ? importMode : 'marketing_nurture',
        },
      });
      const createdLocal: MasterContactRow[] = parsedPreview.map((r, i) => ({
        id: `imp_${Date.now()}_${i}`,
        name: r.name,
        phone: r.phone || null,
        email: r.email || null,
        source: r.source || defaultSource,
        product_interest: r.product_interest || null,
        status: canRouteToSale ? importMode : 'marketing_nurture',
        lifecycle_stage: 'lead',
        lead_score: 20,
        email_consent: 'subscribed',
        created_at: new Date().toISOString(),
      }));
      onImported(createdLocal, audience.id);
      toast.success(`Đã nạp & khử trùng ${parsedPreview.length} hồ sơ vào "${audience.name}"!`);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể nhập danh sách CSV vào Tệp Data.'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Import CSV / Dán Danh Bạ vào "${audience?.name || 'Tệp Data'}"`}
      width="720px"
    >
      <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            borderRadius: 16,
            background: '#F8FAFF',
            border: '1px solid #DBEAFE',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#1E3A8A' }}>
            Hỗ trợ linh hoạt cả hồ sơ <strong>chỉ có Email</strong> hoặc <strong>chỉ có SĐT</strong> — tự động khử trùng theo <code>tenant_id</code>.
          </div>
          <label
            className="btn secondary sm"
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, height: 34 }}
          >
            <Upload size={14} /> Chọn file .CSV / .TXT
            <input type="file" accept=".csv,.txt,.tsv" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">Dán dữ liệu (Cột: Họ tên, SĐT hoặc Email, Email phụ, Nguồn, Sản phẩm)</label>
          <textarea
            className="form-textarea"
            rows={6}
            style={{ height: 'auto', padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem' }}
            placeholder={`Nguyễn Minh Anh, 0901234567, minhanh@company.vn, Landing_Q4, Gói Enterprise\nTrần Bảo Ngọc, baongoc@client.vn, , Webinar_AI, Demo Marketing`}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          <div className="form-group">
            <label className="form-label">Chế độ điều phối sau khi nạp</label>
            <select
              className="form-input"
              value={importMode}
              onChange={(e) =>
                setImportMode(e.target.value as 'marketing_nurture' | 'unassigned_pending')
              }
            >
              <option value="marketing_nurture">
                Chế độ A: Nuôi dưỡng Marketing trước (KHÔNG chia Sale)
              </option>
              {canRouteToSale && (
                <option value="unassigned_pending">
                  Chế độ B: Vừa vào Tệp vừa Chia nóng cho Sale ngay
                </option>
              )}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nhãn nguồn mặc định</label>
            <input
              type="text"
              className="form-input"
              value={defaultSource}
              onChange={(e) => setDefaultSource(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Badge tone={parsedPreview.length > 0 ? 'success' : 'neutral'}>
            Nhận diện hợp lệ: {parsedPreview.length} hồ sơ
          </Badge>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn secondary" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              disabled={importing || parsedPreview.length === 0}
              className="btn-inkica-primary"
              style={{
                height: 42,
                padding: '0 1.25rem',
                borderRadius: 14,
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: parsedPreview.length === 0 ? 'not-allowed' : 'pointer',
                opacity: parsedPreview.length === 0 ? 0.55 : 1,
              }}
            >
              {importing ? 'Đang nhập...' : `Nhập ${parsedPreview.length} Hồ Sơ`}
            </button>
          </div>
        </div>
      </form>
    </CustomModal>
  );
};

/* ============================================================================
 * 3. RANDOM A/B AUDIENCE SPLIT MODAL
 * ============================================================================ */

interface SplitAudienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  audience: AudienceItem | null;
  onSplitCreated: (createdParts: AudienceItem[]) => void;
}

export const SplitAudienceModal: React.FC<SplitAudienceModalProps> = ({
  isOpen,
  onClose,
  audience,
  onSplitCreated,
}) => {
  const { token, tenantSlug } = useAuth();
  const [ratioA, setRatioA] = useState(50);
  const [prefix, setPrefix] = useState('');
  const [splitting, setSplitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !audience) return;
    const init = () => {
      setRatioA(50);
      setPrefix(`${audience.name} — Test`);
    };
    init();
  }, [isOpen, audience]);

  const handleSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audience) return;
    setSplitting(true);
    const ratioB = 100 - ratioA;
    try {
      const res = await apiRequest<{
        created_audiences?: AudienceItem[];
        items?: AudienceItem[];
        created?: AudienceItem[];
      }>(
        `/audiences/${audience.id}/split`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            parts: 2,
            ratios: [ratioA, ratioB],
            ratio_a: ratioA,
            name_prefix: prefix.trim() || audience.name,
          },
        }
      );
      const list = res.created_audiences || res.items || res.created || [];
      if (list.length > 0) {
        onSplitCreated(list);
      } else {
        const countA = Math.round((audience.cached_member_count * ratioA) / 100);
        const countB = Math.max(0, audience.cached_member_count - countA);
        onSplitCreated([
          {
            id: `split_a_${Date.now()}`,
            name: `${prefix || audience.name} (Nhóm A - ${ratioA}%)`,
            audience_type: 'static_data',
            cached_member_count: countA,
            color_hex: '#1E40FF',
          },
          {
            id: `split_b_${Date.now() + 1}`,
            name: `${prefix || audience.name} (Nhóm B - ${ratioB}%)`,
            audience_type: 'static_data',
            cached_member_count: countB,
            color_hex: '#0284C7',
          },
        ]);
      }
      toast.success(`Đã tách ngẫu nhiên thành Nhóm A (${ratioA}%) & Nhóm B (${ratioB}%)!`);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tách tệp A/B.'));
    } finally {
      setSplitting(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tách Ngẫu Nhiên A/B Testing: ${audience?.name || ''}`}
      width="540px"
    >
      <form onSubmit={handleSplit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div className="form-group">
          <label className="form-label">Tiền tố tên 2 tệp con sau khi tách</label>
          <input
            type="text"
            required
            className="form-input"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
        </div>

        <Card padding="1rem">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.84rem', fontWeight: 700 }}>
            <span style={{ color: '#1E40FF' }}>Nhóm A: {ratioA}%</span>
            <span style={{ color: '#0284C7' }}>Nhóm B: {100 - ratioA}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={90}
            step={5}
            value={ratioA}
            onChange={(e) => setRatioA(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#1E40FF' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {[50, 70, 80].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRatioA(preset)}
                className="btn secondary sm"
                style={{ height: 30, fontSize: '0.75rem' }}
              >
                {preset}% / {100 - preset}%
              </button>
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn secondary" onClick={onClose}>
            Hủy
          </button>
          <button
            type="submit"
            disabled={splitting}
            className="btn-inkica-primary"
            style={{
              height: 42,
              padding: '0 1.25rem',
              borderRadius: 14,
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Scissors size={15} /> {splitting ? 'Đang tách...' : 'Tách Tệp A/B Ngay'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};

/* ============================================================================
 * 4. AUDIENCE MEMBERS, EXCLUSIONS & PUSH-TO-SALE DRAWER MODAL
 * ============================================================================ */

interface AudienceMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  audience: AudienceItem | null;
  fallbackContacts: MasterContactRow[];
  initialSubTab?: 'members' | 'exclusions';
  onChanged: () => void;
}

export const AudienceMembersAndExclusionsModal: React.FC<AudienceMembersModalProps> = ({
  isOpen,
  onClose,
  audience,
  fallbackContacts,
  initialSubTab = 'members',
  onChanged,
}) => {
  const { token, tenantSlug, bootstrapData } = useAuth();
  const { hasModule, can, terminology, switchPackage } = useEntitlement();
  const canUnmask = can('audiences', 'unmask_phone');
  const canRouteToSale = hasModule('rounds');
  const rounds = useMemo(() => bootstrapData?.rounds || [], [bootstrapData?.rounds]);

  const [subTab, setSubTab] = useState<'members' | 'exclusions'>(initialSubTab);
  const [members, setMembers] = useState<MasterContactRow[]>([]);
  const [exclusions, setExclusions] = useState<AudienceExclusionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [exclInput, setExclInput] = useState('');
  const [exclReason, setExclReason] = useState('Không gửi chiến dịch này');
  const [selectedRoundId, setSelectedRoundId] = useState('');

  useEffect(() => {
    if (!isOpen || !audience) return;
    let cancelled = false;
    const loadDetails = async () => {
      setSubTab(initialSubTab);
      setSelectedRoundId(audience.target_round_id || rounds[0]?.id || '');
      setLoading(true);
      try {
        const [memRes, excRes] = await Promise.all([
          apiRequest<{ items?: MasterContactRow[] } | MasterContactRow[]>(`/audiences/${audience.id}/members`, {
            token,
            tenantSlug,
          }).catch(() => ({ items: fallbackContacts.slice(0, 12) })),
          apiRequest<{ items?: AudienceExclusionItem[] } | AudienceExclusionItem[]>(`/audiences/${audience.id}/exclusions`, {
            token,
            tenantSlug,
          }).catch(() => ({ items: [] })),
        ]);
        if (!cancelled) {
          setMembers(Array.isArray(memRes) ? memRes : memRes.items || []);
          setExclusions(Array.isArray(excRes) ? excRes : excRes.items || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadDetails();
    return () => {
      cancelled = true;
    };
  }, [isOpen, audience, initialSubTab, token, tenantSlug, fallbackContacts, rounds]);

  const handleRemoveMember = async (leadId: string) => {
    if (!audience) return;
    const prevMembers = members;
    setMembers((prev) => prev.filter((m) => m.id !== leadId));
    try {
      await apiRequest(`/audiences/${audience.id}/members/${leadId}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã gỡ thành viên khỏi tệp.');
      onChanged();
    } catch (err) {
      setMembers(prevMembers);
      toast.error(getErrorMessage(err, 'Không thể gỡ thành viên khỏi tệp.'));
    }
  };

  const handleAddExclusion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audience || !exclInput.trim()) return;
    const val = exclInput.trim();
    const isEmail = val.includes('@');
    try {
      const created = await apiRequest<AudienceExclusionItem>(
        `/audiences/${audience.id}/exclusions`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            email: isEmail ? val : undefined,
            phone: !isEmail ? val : undefined,
            reason: exclReason.trim(),
          },
        }
      );
      setExclusions((prev) => [
        {
          id: created.id || `exc_${Date.now()}`,
          email: created.email ?? (isEmail ? val : null),
          phone: created.phone ?? (!isEmail ? val : null),
          reason: created.reason ?? exclReason.trim(),
          created_at: created.created_at || new Date().toISOString(),
        },
        ...prev,
      ]);
      setExclInput('');
      toast.success('Đã thêm vào danh sách loại trừ của tệp!');
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thêm vào danh sách loại trừ.'));
    }
  };

  const handleRemoveExclusion = async (excId: string) => {
    if (!audience) return;
    const prevExclusions = exclusions;
    setExclusions((prev) => prev.filter((x) => x.id !== excId));
    try {
      await apiRequest(`/audiences/${audience.id}/exclusions/${excId}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã gỡ khỏi danh sách loại trừ.');
      onChanged();
    } catch (err) {
      setExclusions(prevExclusions);
      toast.error(getErrorMessage(err, 'Không thể gỡ khỏi danh sách loại trừ.'));
    }
  };

  const handlePushToSaleRound = async () => {
    if (!audience) return;
    try {
      const res = await apiRequest<{ promoted_count?: number; pushed_count?: number }>(
        `/audiences/${audience.id}/push-to-sale`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: { round_id: selectedRoundId || undefined },
        }
      );
      toast.success(
        `Đã đẩy ${res.promoted_count ?? res.pushed_count ?? members.length} ${terminology.customerLabel} sang Vòng chia Sale!`
      );
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đẩy tệp sang Vòng chia Sale.'));
    }
  };

  const handleEvaluateNow = async () => {
    if (!audience) return;
    try {
      const res = await apiRequest<{ total_count?: number }>(
        `/audiences/${audience.id}/evaluate`,
        {
          method: 'POST',
          token,
          tenantSlug,
        }
      );
      toast.success(`Đã đồng bộ Tệp Logic: ${res.total_count ?? members.length} thành viên khớp!`);
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đánh giá lại Tệp Logic.'));
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết Tệp: ${audience?.name || ''}`}
      width="860px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <PillTabs
            tabs={[
              { key: 'members', label: 'Thành viên trong Tệp', icon: <Users size={14} />, count: members.length },
              { key: 'exclusions', label: 'Danh sách Loại trừ (Suppressions)', icon: <Ban size={14} />, count: exclusions.length },
            ]}
            activeKey={subTab}
            onChange={setSubTab}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {audience?.audience_type === 'dynamic_logic' && (
              <button
                type="button"
                onClick={() => void handleEvaluateNow()}
                className="btn secondary sm"
                style={{ height: 36, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Đánh giá lại Tệp Logic
              </button>
            )}

            {canRouteToSale ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <select
                  className="form-input"
                  style={{ height: 36, width: 180, fontSize: '0.78rem' }}
                  value={selectedRoundId}
                  onChange={(e) => setSelectedRoundId(e.target.value)}
                >
                  <option value="">Vòng chia mặc định</option>
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handlePushToSaleRound()}
                  className="btn-inkica-primary"
                  style={{
                    height: 36,
                    padding: '0 0.95rem',
                    borderRadius: 12,
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Send size={13} /> Đẩy sang Vòng chia Sale
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void switchPackage('growth_combo')}
                className="btn secondary sm"
                style={{ height: 36, fontSize: '0.76rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <GitBranch size={14} /> Mở khóa Chia số Sale (Growth Suite)
              </button>
            )}
          </div>
        </div>

        {subTab === 'members' ? (
          loading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : (
          <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>{terminology.customerLabel}</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Liên hệ</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Trạng thái</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      Chưa có thành viên nào trong tệp này.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{m.name}</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }} className="autodata-tabular-nums">
                        {maskPiiPhone(m.masked_phone || m.phone, canUnmask)} • {maskPiiEmail(m.email, canUnmask)}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge tone={m.status === 'marketing_nurture' ? 'info' : 'success'}>
                          {m.status === 'marketing_nurture' ? 'Nuôi dưỡng MKT' : m.status || 'Active'}
                        </Badge>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {audience?.audience_type !== 'dynamic_logic' && (
                          <button
                            type="button"
                            onClick={() => void handleRemoveMember(m.id)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#DC2626',
                              cursor: 'pointer',
                            }}
                            title="Gỡ khỏi tệp"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <form
              onSubmit={handleAddExclusion}
              style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr auto', gap: 8 }}
            >
              <input
                type="text"
                required
                className="form-input"
                style={{ height: 40 }}
                placeholder="Nhập SĐT hoặc Email cần loại trừ khỏi tệp..."
                value={exclInput}
                onChange={(e) => setExclInput(e.target.value)}
              />
              <input
                type="text"
                className="form-input"
                style={{ height: 40 }}
                placeholder="Lý do loại trừ (VIP, Đối tác, Đã chốt...)"
                value={exclReason}
                onChange={(e) => setExclReason(e.target.value)}
              />
              <button
                type="submit"
                className="btn-inkica-primary"
                style={{
                  height: 40,
                  padding: '0 1rem',
                  borderRadius: 12,
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Plus size={15} /> Loại trừ
              </button>
            </form>

            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>SĐT / Email bị chặn</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Lý do</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Gỡ</th>
                  </tr>
                </thead>
                <tbody>
                  {exclusions.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: '1.75rem', textAlign: 'center', color: '#64748B' }}>
                        Chưa có bản ghi loại trừ nào cho tệp này.
                      </td>
                    </tr>
                  ) : (
                    exclusions.map((ex) => (
                      <tr key={ex.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                          {ex.email || ex.phone || ex.lead_id}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748B' }}>{ex.reason || '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => void handleRemoveExclusion(ex.id)}
                            style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </CustomModal>
  );
};
