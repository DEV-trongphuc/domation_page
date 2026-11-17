import React, { useRef, useState } from 'react';
import { Award, CheckCircle2, FileUp, PlayCircle, Sparkles, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type { StudentWorkspacePayload } from './educationTypes';

export interface StudentPostponeOcrTabProps {
  workspace: StudentWorkspacePayload;
  canEdit: boolean;
  canApprove: boolean;
  onRefresh: () => Promise<void>;
}

export const StudentPostponeOcrTab: React.FC<StudentPostponeOcrTabProps> = ({
  workspace,
  canEdit,
  canApprove,
  onRefresh,
}) => {
  const { token, tenantSlug } = useAuth();
  const enrollmentId = workspace.enrollment.id;
  const ocr = workspace.enrollment.postpone_ocr_json;

  const [postponeReason, setPostponeReason] = useState<string>(workspace.enrollment.postpone_reason || '');
  const [postponeUntil, setPostponeUntil] = useState<string>(workspace.enrollment.postpone_until || '');
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [rawDocText, setRawDocText] = useState<string>('');
  const [autoApprove, setAutoApprove] = useState<boolean>(false);
  const [decisionNote, setDecisionNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const docFileRef = useRef<HTMLInputElement | null>(null);

  const handleAddMonthsToUntil = (months: number) => {
    const base = new Date();
    base.setMonth(base.getMonth() + months);
    setPostponeUntil(base.toISOString().slice(0, 10));
  };

  const handleReadDocFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      setRawDocText(text.slice(0, 4000));
      setDocumentUrl(`tenants/documents/${encodeURIComponent(file.name)}`);
      toast.success(`Đã nạp nội dung đơn "${file.name}" vào bộ trích xuất OCR`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đọc tệp đơn bảo lưu'));
    }
  };

  const handleSubmitPostpone = async () => {
    if (!enrollmentId || submitting) return;
    setSubmitting(true);
    try {
      await apiRequest(`/education/enrollments/${enrollmentId}/postpone`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          postpone_reason: postponeReason.trim() || undefined,
          postpone_until: postponeUntil || undefined,
          raw_document_text: rawDocText.trim() || undefined,
          document_url: documentUrl.trim() || undefined,
          auto_approve: autoApprove,
        },
      });
      toast.success(
        autoApprove && canApprove
          ? 'Đã trích xuất OCR & phê duyệt Bảo lưu học tập!'
          : 'Đã gửi hồ sơ Bảo lưu kèm trích xuất OCR!'
      );
      await onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi yêu cầu bảo lưu'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostponeDecision = async (decision: 'approved' | 'rejected' | 'resumed') => {
    if (!enrollmentId || submitting) return;
    setSubmitting(true);
    try {
      await apiRequest(`/education/enrollments/${enrollmentId}/postpone-decision`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { decision, note: decisionNote.trim() || undefined },
      });
      const label =
        decision === 'approved'
          ? 'Đã phê duyệt Bảo lưu (Deferred)'
          : decision === 'resumed'
          ? 'Đã khôi phục trạng thái Đi học lại (Active)'
          : 'Đã từ chối hồ sơ bảo lưu';
      toast.success(label);
      setDecisionNote('');
      await onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật quyết định bảo lưu'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: 14, borderRadius: 14, background: '#F8FAFF', border: '1.5px dashed #93C5FD', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={18} style={{ color: '#1E40FF' }} />
          <div style={{ fontSize: '0.82rem', color: '#0F172A' }}>
            <strong>Quét OCR Đơn Xin Bảo Lưu / Tạm Hoãn Học Tập:</strong> Tự động bóc tách Họ tên, Lý do, Ngày hết hạn bảo lưu & tính lịch nhắc đi học lại.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={docFileRef} type="file" accept=".txt,.csv,.md,.html" style={{ display: 'none' }} onChange={handleReadDocFile} />
          <button type="button" onClick={() => docFileRef.current?.click()} className="btn secondary" style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <FileUp size={14} /> Tải Tệp Đơn
          </button>
          <button
            type="button"
            onClick={() => {
              setRawDocText(`CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐƠN XIN BẢO LƯU KẾT QUẢ HỌC TẬP\nHọ và tên học viên: ${workspace.enrollment.student_name}\nLý do xin bảo lưu: Công tác dài hạn tại chi nhánh nước ngoài\nTừ ngày: 15/11/2026\nĐến ngày: 15/05/2027`);
              setPostponeReason('Công tác dài hạn tại chi nhánh nước ngoài');
              setPostponeUntil('2027-05-15');
            }}
            className="btn secondary"
            style={{ height: 36 }}
          >
            Điền Mẫu OCR Nhanh
          </button>
        </div>
      </div>

      <textarea
        rows={3}
        value={rawDocText}
        onChange={(e) => setRawDocText(e.target.value)}
        placeholder="Dán nội dung văn bản Đơn xin bảo lưu để hệ thống trích xuất OCR tự động..."
        style={{ width: '100%', borderRadius: 12, border: '1px solid #CBD5E1', padding: 10, fontSize: '0.82rem' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
        <input value={postponeReason} onChange={(e) => setPostponeReason(e.target.value)} placeholder="Lý do bảo lưu / hoãn học *" style={{ height: 42, borderRadius: 12, border: '1px solid #CBD5E1', padding: '0 12px' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <input type="date" value={postponeUntil} onChange={(e) => setPostponeUntil(e.target.value)} style={{ flex: 1, height: 42, borderRadius: 12, border: '1px solid #CBD5E1', padding: '0 10px' }} />
          {[3, 6, 12].map((m) => (
            <button key={m} type="button" onClick={() => handleAddMonthsToUntil(m)} className="btn secondary" style={{ height: 42, padding: '0 10px', fontSize: '0.75rem' }}>
              +{m}T
            </button>
          ))}
        </div>
        <input value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} placeholder="Link chứng từ đính kèm (tùy chọn)" style={{ height: 42, borderRadius: 12, border: '1px solid #CBD5E1', padding: '0 12px' }} />
      </div>

      {canEdit && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {canApprove ? (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
              <input type="checkbox" checked={autoApprove} onChange={(e) => setAutoApprove(e.target.checked)} />
              Duyệt bảo lưu ngay khi lưu (Auto-approve)
            </label>
          ) : <span />}
          <button type="button" disabled={submitting} onClick={handleSubmitPostpone} className="btn-inkica-primary" style={{ height: 42, padding: '0 1.25rem', borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>
            {submitting ? 'Đang xử lý OCR...' : 'Lưu Hồ Sơ Bảo Lưu & Chạy OCR'}
          </button>
        </div>
      )}

      {ocr && (ocr.extracted_student_name || ocr.extracted_reason) && (
        <div style={{ padding: 14, borderRadius: 14, background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>Kết quả Bóc tách OCR & Đối chiếu Hồ sơ</strong>
            <div style={{ display: 'flex', gap: 6 }}>
              <Badge tone={ocr.name_matched ? 'success' : 'warning'}>{ocr.name_matched ? 'Khớp họ tên Học viên' : 'Cần kiểm tra tên'}</Badge>
              <Badge tone="info">Trạng thái: {workspace.enrollment.postpone_status}</Badge>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#475569' }}>
            • Học viên trên đơn: <strong>{ocr.extracted_student_name || '—'}</strong> • Hạn bảo lưu: <strong>{ocr.extracted_until_date || workspace.enrollment.postpone_until || '—'}</strong> • Lịch nhắc đi học lại: <strong>{ocr.remind_date || '—'}</strong>
          </div>
        </div>
      )}

      {canApprove && workspace.enrollment.postpone_status !== 'none' && (
        <div style={{ padding: 14, borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <input value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} placeholder="Ghi chú phê duyệt / quyết định học vụ..." style={{ flex: '1 1 220px', height: 38, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 10px', background: '#FFFFFF' }} />
          <button type="button" disabled={submitting} onClick={() => void handlePostponeDecision('approved')} className="btn secondary" style={{ height: 38, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={14} /> Duyệt Bảo Lưu
          </button>
          <button type="button" disabled={submitting} onClick={() => void handlePostponeDecision('resumed')} className="btn secondary" style={{ height: 38, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <PlayCircle size={14} /> Đi Học Lại (Resume)
          </button>
          <button type="button" disabled={submitting} onClick={() => void handlePostponeDecision('rejected')} className="btn secondary" style={{ height: 38, color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <XCircle size={14} /> Từ Chối
          </button>
        </div>
      )}

      {workspace.postpone_history.length === 0 ? (
        <EmptyState icon={<Award size={22} />} title="Chưa có lịch sử bảo lưu" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {workspace.postpone_history.map((h) => (
            <div key={h.id} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <div>
                <strong>{h.action.toUpperCase()}</strong> — {h.postpone_reason || h.note || 'Cập nhật trạng thái bảo lưu'}
                {h.postpone_until ? ` (Hạn: ${h.postpone_until.slice(0, 10)})` : ''}
              </div>
              <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{formatShortDate(h.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
