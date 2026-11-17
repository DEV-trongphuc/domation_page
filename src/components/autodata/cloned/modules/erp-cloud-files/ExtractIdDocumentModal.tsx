import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  Sparkles,
  UploadCloud,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  SAMPLE_CCCD_TEXT,
  type CloudFileItem,
  type IdCardExtractedFields,
  type LeadLookupItem,
} from './cloudFilesTypes';

export interface ExtractIdDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudFiles: CloudFileItem[];
  defaultLeadId?: string;
  onApplied?: () => Promise<void> | void;
}

export const ExtractIdDocumentModal: React.FC<ExtractIdDocumentModalProps> = ({
  isOpen,
  onClose,
  cloudFiles,
  defaultLeadId = '',
  onApplied,
}) => {
  const { token, tenantSlug } = useAuth();
  const [step, setStep] = useState<'select' | 'scanning' | 'review'>('select');
  const [leads, setLeads] = useState<LeadLookupItem[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState(defaultLeadId);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [rawText, setRawText] = useState(SAMPLE_CCCD_TEXT);
  const [sourceTitle, setSourceTitle] = useState('CCCD Định danh Khách hàng');
  const [extractionId, setExtractionId] = useState('');
  const [applying, setApplying] = useState(false);

  const [fields, setFields] = useState<IdCardExtractedFields>({
    document_type: 'cccd',
    full_name: '',
    citizen_id: '',
    passport: '',
    birthday: '',
    gender: '',
    nationality: 'Việt Nam',
    address: '',
    issue_date: '',
    expiry_date: '',
    issue_place: '',
  });

  const loadLeads = useCallback(async () => {
    const res = await apiRequest<{ items?: LeadLookupItem[]; data?: LeadLookupItem[] }>('/leads?limit=50', {
      token,
      tenantSlug,
    });
    return res.items || res.data || [];
  }, [token, tenantSlug]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const list = await loadLeads();
        if (!cancelled) {
          setLeads(list);
          if (!selectedLeadId && list[0]?.id) {
            setSelectedLeadId(list[0].id);
          }
        }
      } catch {
        if (!cancelled) setLeads([]);
      } finally {
        if (!cancelled) setLoadingLeads(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, loadLeads, selectedLeadId]);

  const handleLocalFileRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceTitle(file.name);
    try {
      const txt = await file.text();
      if (txt.trim()) {
        setRawText(txt.slice(0, 6000));
      }
      toast.success(`Đã nạp tệp ${file.name} vào DOM Vision Scanner`);
    } catch {
      toast.error('Không thể đọc nội dung tệp');
    }
  };

  const handleRunIdScan = async () => {
    if (!rawText.trim() && !selectedFileId) {
      toast.error('Vui lòng chọn tệp CCCD/Hộ chiếu hoặc dán nội dung để quét');
      return;
    }
    setStep('scanning');
    try {
      const res = await apiRequest<{
        id: string;
        id_card: IdCardExtractedFields;
      }>('/erp-ops/ocr/extract-id-card', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          source_file_id: selectedFileId || undefined,
          source_title: sourceTitle.trim() || undefined,
          raw_text: rawText.trim() || undefined,
        },
      });
      setExtractionId(res.id);
      setFields({
        document_type: res.id_card.document_type || 'cccd',
        full_name: res.id_card.full_name || '',
        citizen_id: res.id_card.citizen_id || '',
        passport: res.id_card.passport || '',
        birthday: res.id_card.birthday || '',
        gender: res.id_card.gender || '',
        nationality: res.id_card.nationality || 'Việt Nam',
        address: res.id_card.address || '',
        issue_date: res.id_card.issue_date || '',
        expiry_date: res.id_card.expiry_date || '',
        issue_place: res.id_card.issue_place || '',
      });
      setStep('review');
      toast.success('DOM Vision AI đã trích xuất thông tin CCCD / Hộ chiếu!');
    } catch (err) {
      setStep('select');
      toast.error(getErrorMessage(err, 'Không thể bóc tách giấy tờ tùy thân'));
    }
  };

  const handleApplyToLead = async () => {
    if (!extractionId) return;
    if (!selectedLeadId) {
      toast.error('Vui lòng chọn Hồ sơ Khách hàng (CRM Lead) để điền tự động');
      return;
    }
    setApplying(true);
    try {
      await apiRequest(`/erp-ops/ocr/extractions/${extractionId}/apply-lead`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          lead_id: selectedLeadId,
          overrides: fields,
        },
      });
      toast.success('Đã cập nhật dữ liệu định danh CCCD/Passport vào Hồ sơ CRM Lead!');
      await onApplied?.();
      setStep('select');
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật Hồ sơ CRM Lead'));
    } finally {
      setApplying(false);
    }
  };

  const suggestedFiles = cloudFiles.filter((f) =>
    /cccd|cmnd|passport|ho_chieu|dinh_danh|id/i.test(`${f.name} ${f.category_key}`)
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="DOM Vision AI — Bóc Tách CCCD / Hộ Chiếu & Tự Động Điền CRM"
      width={680}
    >
      {loadingLeads && step === 'select' ? (
        <ModalBodySkeleton rows={4} />
      ) : step === 'scanning' ? (
        <div style={{ padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: '#EEF2FF', color: '#1E40FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={30} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
            DOM Vision AI đang nhận diện trường định danh CCCD / Passport...
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
            Đang chuẩn hóa Họ tên, Số định danh 12 số, Ngày sinh, Thường trú & Ngày cấp
          </div>
        </div>
      ) : step === 'select' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                1. Chọn tệp trên Cloud Drive (Gợi ý thông minh)
              </label>
              <select
                value={selectedFileId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedFileId(id);
                  const found = cloudFiles.find((f) => f.id === id);
                  if (found) {
                    setSourceTitle(found.name);
                    if (found.content_preview) setRawText(found.content_preview);
                  }
                }}
                style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}
              >
                <option value="">-- Nhập trực tiếp hoặc chọn tệp Cloud --</option>
                {(suggestedFiles.length > 0 ? suggestedFiles : cloudFiles).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.version_tag})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                2. Hoặc tải tệp từ máy tính (.txt / OCR scan)
              </label>
              <label
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: '1px dashed #1E40FF',
                  background: '#F8FAFF',
                  color: '#1E40FF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <UploadCloud size={16} /> Chọn tệp từ máy
                <input type="file" accept=".txt,.md,.json,.csv" onChange={(e) => void handleLocalFileRead(e)} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={7}
            placeholder="Nội dung văn bản mặt trước & mặt sau CCCD / Hộ chiếu..."
            style={{ borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 12px', fontSize: '0.82rem', lineHeight: 1.5 }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>
              Đóng
            </button>
            <button
              type="button"
              onClick={() => void handleRunIdScan()}
              style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Sparkles size={16} /> Quét AI CCCD / Passport
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} color="#1E40FF" />
              <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>Kiểm tra & Xác nhận dữ liệu bóc tách</strong>
            </div>
            <Badge tone="success" icon={<CheckCircle2 size={12} />}>
              {fields.document_type.toUpperCase()} Hợp lệ
            </Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input value={fields.full_name || ''} onChange={(e) => setFields({ ...fields, full_name: e.target.value })} placeholder="Họ và tên" style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
            <input value={fields.citizen_id || ''} onChange={(e) => setFields({ ...fields, citizen_id: e.target.value })} placeholder="Số CCCD / CMND" style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
            <input value={fields.passport || ''} onChange={(e) => setFields({ ...fields, passport: e.target.value })} placeholder="Số Hộ chiếu (Passport)" style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
            <input type="date" value={fields.birthday || ''} onChange={(e) => setFields({ ...fields, birthday: e.target.value })} title="Ngày sinh" style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
            <input value={fields.gender || ''} onChange={(e) => setFields({ ...fields, gender: e.target.value })} placeholder="Giới tính (Nam/Nữ)" style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
            <input value={fields.nationality || ''} onChange={(e) => setFields({ ...fields, nationality: e.target.value })} placeholder="Quốc tịch" style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
            <input type="date" value={fields.issue_date || ''} onChange={(e) => setFields({ ...fields, issue_date: e.target.value })} title="Ngày cấp" style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
            <input type="date" value={fields.expiry_date || ''} onChange={(e) => setFields({ ...fields, expiry_date: e.target.value })} title="Ngày hết hạn" style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          </div>
          <input value={fields.address || ''} onChange={(e) => setFields({ ...fields, address: e.target.value })} placeholder="Nơi thường trú / Địa chỉ..." style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          <input value={fields.issue_place || ''} onChange={(e) => setFields({ ...fields, issue_place: e.target.value })} placeholder="Cơ quan cấp..." style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
              Chọn Hồ sơ Khách hàng CRM để ghi nhận tự động (KYC Auto-Fill)
            </label>
            <select value={selectedLeadId} onChange={(e) => setSelectedLeadId(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid #1E40FF', padding: '0 12px', background: '#F8FAFF' }}>
              <option value="">-- Chọn Khách hàng CRM --</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.phone || l.email || l.status || 'Lead'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => setStep('select')} className="btn secondary" style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={15} /> Quét lại
            </button>
            <button
              type="button"
              disabled={applying || !selectedLeadId}
              onClick={() => void handleApplyToLead()}
              style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: selectedLeadId ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <UserCheck size={16} /> {applying ? 'Đang cập nhật...' : 'Áp dụng vào CRM Lead'}
            </button>
          </div>
        </div>
      )}
    </CustomModal>
  );
};
