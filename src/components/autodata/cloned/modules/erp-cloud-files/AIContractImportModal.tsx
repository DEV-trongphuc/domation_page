import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  DollarSign,
  FileCheck2,
  Sparkles,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  SAMPLE_CONTRACT_TEXT,
  type ParsedContractPayload,
} from './cloudFilesTypes';

export interface AIContractImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => Promise<void> | void;
}

export const AIContractImportModal: React.FC<AIContractImportModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { token, tenantSlug } = useAuth();
  const [sourceTitle, setSourceTitle] = useState('Hợp đồng Kinh tế B2B 2026');
  const [rawText, setRawText] = useState(SAMPLE_CONTRACT_TEXT);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedContractPayload | null>(null);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingTx, setSavingTx] = useState(false);

  const handleFileDropOrSelect = async (file?: File) => {
    if (!file) return;
    setSourceTitle(file.name);
    try {
      const content = await file.text();
      if (content.trim()) {
        setRawText(content.slice(0, 8000));
      }
      toast.success(`Đã đọc tệp hợp đồng: ${file.name}`);
    } catch {
      toast.error('Vui lòng chọn tệp văn bản hoặc dán nội dung hợp đồng');
    }
  };

  const handleParseContract = async () => {
    if (!rawText.trim()) {
      toast.error('Vui lòng dán nội dung hoặc tải tệp Hợp đồng');
      return;
    }
    setParsing(true);
    try {
      const res = await apiRequest<ParsedContractPayload>('/erp-ops/ocr/parse-contract', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          source_title: sourceTitle.trim() || 'Hợp đồng B2B',
          raw_text: rawText,
        },
      });
      setParsed(res);
      toast.success('DOM Agent đã bóc tách điều khoản, Pháp nhân Bên A & các đợt thanh toán!');
      await onSaved?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể phân tích Hợp đồng AI'));
    } finally {
      setParsing(false);
    }
  };

  const handleSaveB2bCompany = async () => {
    if (!parsed) return;
    setSavingCompany(true);
    try {
      const comp = await apiRequest<{ id: string }>(`/erp-ops/ocr/extractions/${parsed.id}/save-company`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: parsed.party_b?.name || parsed.source_title,
          tax_code: parsed.party_b?.tax_code || undefined,
          billing_address: parsed.party_b?.address || undefined,
          representative_name: parsed.party_b?.representative || undefined,
        },
      });
      setParsed((prev) => (prev ? { ...prev, saved_company_id: comp.id } : prev));
      toast.success('Đã khởi tạo hồ sơ Công ty B2B từ Hợp đồng!');
      await onSaved?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Công ty B2B'));
    } finally {
      setSavingCompany(false);
    }
  };

  const handleSaveFinanceTransaction = async () => {
    if (!parsed) return;
    setSavingTx(true);
    try {
      const tx = await apiRequest<{ id: string }>(`/erp-ops/ocr/extractions/${parsed.id}/save-transaction`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          tx_type: 'income',
          amount_vnd: parsed.contract_value_vnd,
        },
      });
      setParsed((prev) => (prev ? { ...prev, saved_transaction_id: tx.id } : prev));
      toast.success('Đã hạch toán giá trị Hợp đồng sang Sổ quỹ Tài chính!');
      await onSaved?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể hạch toán giao dịch'));
    } finally {
      setSavingTx(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="DOM Agent AI — Bóc Tách Hợp Đồng, Đối Soát Pháp Nhân & Đợt Thanh Toán"
      width={740}
    >
      {!parsed ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void handleFileDropOrSelect(e.dataTransfer.files?.[0]);
            }}
            style={{
              padding: '1.25rem',
              borderRadius: 16,
              border: '1.5px dashed #1E40FF',
              background: '#F8FAFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>
                Kéo thả tệp Hợp đồng (.txt / bản quét OCR) hoặc dán nội dung bên dưới
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
                Tự động kiểm tra chéo MST Bên A với Chi nhánh Trụ sở & tách lịch thu tiền theo từng đợt
              </div>
            </div>
            <label
              style={{
                height: 40,
                padding: '0 14px',
                borderRadius: 10,
                background: '#FFFFFF',
                border: '1px solid #DBEAFE',
                color: '#1E40FF',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Upload size={15} /> Chọn tệp
              <input
                type="file"
                accept=".txt,.md,.csv,.json"
                onChange={(e) => void handleFileDropOrSelect(e.target.files?.[0])}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <input
            value={sourceTitle}
            onChange={(e) => setSourceTitle(e.target.value)}
            placeholder="Tên hồ sơ hợp đồng..."
            style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 14px' }}
          />

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            placeholder="Dán nội dung Hợp đồng kinh tế vào đây..."
            style={{ borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 12px', fontSize: '0.82rem', lineHeight: 1.5 }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>
              Đóng
            </button>
            <button
              type="button"
              disabled={parsing}
              onClick={() => void handleParseContract()}
              style={{
                height: 44,
                padding: '0 18px',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkles size={16} /> {parsing ? 'Đang bóc tách...' : 'Phân tích Hợp đồng & Lịch Thanh Toán'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Party A Branch Verification */}
          <div style={{ padding: '12px 14px', borderRadius: 14, background: '#F8FAFF', border: '1px solid #DBEAFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>ĐỐI SOÁT PHÁP NHÂN BÊN A (TRỤ SỞ TENANT)</div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                {parsed.branch_verification.expected_legal_entity || 'Doanh nghiệp'} • MST: {parsed.branch_verification.expected_tax_code || '—'}
              </div>
            </div>
            <Badge
              tone={parsed.branch_verification.tax_code_matched ? 'success' : 'info'}
              icon={<FileCheck2 size={12} />}
            >
              {parsed.branch_verification.tax_code_matched ? 'Khớp MST Pháp nhân Bên A' : 'Đã xác thực Đối tác Bên B'}
            </Badge>
          </div>

          {/* Counterparty & Value */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0', fontSize: '0.82rem', display: 'grid', gap: 4 }}>
              <div><strong>Đối tác Bên B:</strong> {parsed.party_b?.name || '—'}</div>
              <div><strong>MST Bên B:</strong> {parsed.party_b?.tax_code || '—'}</div>
              <div><strong>Đại diện:</strong> {parsed.party_b?.representative || '—'}</div>
              <div><strong>Địa chỉ:</strong> {parsed.party_b?.address || '—'}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 14, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40FF' }}>TỔNG GIÁ TRỊ HỢP ĐỒNG</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A' }}>{formatVnd(parsed.contract_value_vnd)}</span>
              <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                Hiệu lực: {parsed.start_date || '—'} → {parsed.end_date || '—'}
              </span>
            </div>
          </div>

          {/* Payment Milestones */}
          <div style={{ borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: '#F8F9FA', borderBottom: '1px solid #E2E8F0', fontSize: '0.76rem', fontWeight: 800, color: '#475569' }}>
              LỊCH TRÌNH ĐỢT THANH TOÁN ({parsed.payment_milestones.length} ĐỢT)
            </div>
            {parsed.payment_milestones.map((m) => (
              <div key={m.tranche_no} style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem' }}>
                <div>
                  <strong style={{ color: '#0F172A' }}>{m.name}</strong>
                  <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
                    Tỷ lệ {m.percentage}% {m.due_date ? `• Hạn thu: ${m.due_date}` : ''} {m.inferred ? '• (Gợi ý chuẩn)' : ''}
                  </div>
                </div>
                <strong style={{ color: '#1E40FF' }}>{formatVnd(m.amount_vnd)}</strong>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" onClick={() => setParsed(null)} className="btn secondary" style={{ height: 44 }}>
              Phân tích hợp đồng khác
            </button>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {parsed.saved_company_id ? (
                <Badge tone="success" icon={<CheckCircle2 size={13} />}>Đã lưu B2B Company</Badge>
              ) : (
                <button type="button" disabled={savingCompany} onClick={() => void handleSaveB2bCompany()} className="btn secondary" style={{ height: 44, color: '#1E40FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={15} /> {savingCompany ? 'Đang lưu...' : 'Lưu Công ty B2B'}
                </button>
              )}
              {parsed.saved_transaction_id ? (
                <Badge tone="success" icon={<CheckCircle2 size={13} />}>Đã ghi Sổ quỹ</Badge>
              ) : (
                <button type="button" disabled={savingTx} onClick={() => void handleSaveFinanceTransaction()} style={{ height: 44, padding: '0 16px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <DollarSign size={15} /> {savingTx ? 'Đang hạch toán...' : 'Hạch toán Sổ quỹ / SO'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </CustomModal>
  );
};
