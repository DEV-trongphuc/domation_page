import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  MailWarning,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest } from '../../../autodataApi';
import { buildLocalValidationResult } from './htmlCompiler';
import type {
  EmailBlockItem,
  EmailBodyStyle,
  EmailValidationIssue,
  SenderVaultStatus,
  ValidationResultPayload,
} from './templateTypes';

export interface EmailValidationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
  tenantSlug?: string | null;
  subject: string;
  preheader: string;
  blocks: EmailBlockItem[];
  bodyStyle: EmailBodyStyle;
  compiledHtml: string;
  senderVault?: SenderVaultStatus;
  onFocusBlock: (blockId: string) => void;
  onAutoInsertUnsubscribe: () => void;
}

interface BackendValidateResponse {
  score?: number;
  deliverability_grade?: 'A+' | 'A' | 'B' | 'C' | 'D';
  deliverabilityGrade?: 'A+' | 'A' | 'B' | 'C' | 'D';
  has_unsubscribe?: boolean;
  broken_links?: Array<{ block_id?: string; url?: string; message?: string }>;
  missing_alt?: Array<{ block_id?: string; message?: string }>;
  issues?: Array<{
    id?: string;
    block_id?: string | null;
    severity?: 'high' | 'medium' | 'low';
    category?: EmailValidationIssue['category'];
    title?: string;
    message?: string;
  }>;
  sender_vault?: SenderVaultStatus;
}

const ValidationModalInner: React.FC<Omit<EmailValidationPanelProps, 'isOpen'>> = ({
  onClose,
  token,
  tenantSlug,
  subject,
  preheader,
  blocks,
  bodyStyle,
  compiledHtml,
  senderVault,
  onFocusBlock,
  onAutoInsertUnsubscribe,
}) => {
  const [checking, setChecking] = useState(true);
  const [result, setResult] = useState<ValidationResultPayload>(() =>
    buildLocalValidationResult(subject, blocks, compiledHtml, senderVault)
  );

  const runCheck = useCallback(async () => {
    setChecking(true);
    const localReport = buildLocalValidationResult(subject, blocks, compiledHtml, senderVault);
    try {
      const apiRes = await apiRequest<BackendValidateResponse>('/marketing/templates/validate', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          subject,
          preheader,
          blocks,
          body_style: bodyStyle,
          compiled_html: compiledHtml,
        },
      });
      const mappedIssues: EmailValidationIssue[] = Array.isArray(apiRes.issues)
        ? apiRes.issues.map((it, idx) => ({
            id: it.id || `srv-${idx}`,
            blockId: it.block_id ?? null,
            category: it.category || 'spam_keyword',
            severity: it.severity || 'medium',
            title: it.title || it.message || 'Cảnh báo kiểm định',
            detail: it.message || it.title || '',
          }))
        : localReport.issues;

      const rawScore = typeof apiRes.score === 'number' ? apiRes.score : localReport.score;
      const grade =
        apiRes.deliverability_grade ||
        apiRes.deliverabilityGrade ||
        (rawScore >= 85 ? 'A+' : rawScore >= 70 ? 'A' : rawScore >= 50 ? 'B' : 'C');

      setResult({
        score: rawScore,
        deliverabilityGrade: grade,
        hasUnsubscribe: apiRes.has_unsubscribe ?? localReport.hasUnsubscribe,
        brokenLinksCount: apiRes.broken_links?.length ?? localReport.brokenLinksCount,
        missingAltCount: apiRes.missing_alt?.length ?? localReport.missingAltCount,
        issues: mappedIssues.length > 0 ? mappedIssues : localReport.issues,
        senderVault: apiRes.sender_vault || senderVault,
      });
    } catch {
      setResult(localReport);
    } finally {
      setChecking(false);
    }
  }, [subject, preheader, blocks, bodyStyle, compiledHtml, senderVault, token, tenantSlug]);

  useEffect(() => {
    let active = true;
    (async () => {
      await Promise.resolve();
      if (active) await runCheck();
    })();
    return () => {
      active = false;
    };
  }, [runCheck]);

  if (checking) {
    return <ModalBodySkeleton rows={4} />;
  }

  const vault = result.senderVault || senderVault;
  const scoreColor = result.score >= 80 ? '#059669' : result.score >= 55 ? '#1E40FF' : '#D97706';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 10,
        }}
      >
        <div style={{ padding: 14, borderRadius: 14, background: '#F8FAFF', border: '1px solid #DBEAFE' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>ĐIỂM VÀO INBOX (0–100)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: '1.7rem', fontWeight: 800, color: scoreColor }}>{result.score}/100</span>
            <Badge tone={result.score >= 80 ? 'success' : 'primary'}>Hạng {result.deliverabilityGrade}</Badge>
          </div>
        </div>

        <div style={{ padding: 14, borderRadius: 14, background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>TRẠNG THÁI SPF / DKIM VAULT</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            {vault?.configured ? (
              <>
                <ShieldCheck size={17} color="#059669" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
                  Đã xác thực ({vault.provider})
                </span>
              </>
            ) : (
              <>
                <ShieldAlert size={17} color="#D97706" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B45309' }}>
                  Chế độ Sandbox (Chưa nối SES/SMTP)
                </span>
              </>
            )}
          </div>
          {vault?.from_email && (
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 3 }}>Sender: {vault.from_email}</div>
          )}
        </div>
      </div>

      {!result.hasUnsubscribe && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MailWarning size={18} color="#DC2626" />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#991B1B' }}>
                Thiếu liên kết Hủy đăng ký {'{{unsubscribe_url}}'}
              </div>
              <div style={{ fontSize: '0.73rem', color: '#B91C1C' }}>
                Gmail & Outlook yêu cầu liên kết hủy đăng ký hợp lệ để tránh bị chặn hàng loạt.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onAutoInsertUnsubscribe}
            style={{
              height: 38,
              padding: '0 12px',
              borderRadius: 10,
              border: 'none',
              background: '#DC2626',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
            }}
          >
            <Wand2 size={14} /> Tự chèn Unsubscribe
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Badge tone={result.brokenLinksCount === 0 ? 'success' : 'warning'}>
          Link lỗi / trống: {result.brokenLinksCount}
        </Badge>
        <Badge tone={result.missingAltCount === 0 ? 'success' : 'info'}>
          Ảnh thiếu ALT: {result.missingAltCount}
        </Badge>
        <Badge tone={result.hasUnsubscribe ? 'success' : 'danger'}>
          Unsubscribe: {result.hasUnsubscribe ? 'Hợp lệ' : 'Thiếu'}
        </Badge>
      </div>

      {result.issues.length === 0 ? (
        <div
          style={{
            padding: '22px 16px',
            borderRadius: 14,
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            textAlign: 'center',
            color: '#065F46',
          }}
        >
          <CheckCircle2 size={26} style={{ margin: '0 auto 6px' }} />
          <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>Mẫu Email đạt chuẩn Deliverability cao!</div>
          <div style={{ fontSize: '0.76rem', marginTop: 3 }}>
            Không phát hiện từ khóa Spam, link hỏng hay ảnh thiếu mô tả ALT.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 290, overflowY: 'auto' }}>
          {result.issues.map((iss) => (
            <div
              key={iss.id}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                background: iss.severity === 'high' ? '#FEF2F2' : iss.severity === 'medium' ? '#FFFBEB' : '#F8FAFC',
                border: `1px solid ${iss.severity === 'high' ? '#FECACA' : iss.severity === 'medium' ? '#FDE68A' : '#E2E8F0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                {iss.category === 'missing_alt' ? (
                  <ImageIcon size={15} color="#D97706" style={{ marginTop: 2 }} />
                ) : (
                  <AlertTriangle size={15} color={iss.severity === 'high' ? '#DC2626' : '#D97706'} style={{ marginTop: 2 }} />
                )}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{iss.title}</div>
                  <div style={{ fontSize: '0.73rem', color: '#475569', marginTop: 2 }}>{iss.detail}</div>
                </div>
              </div>
              {iss.blockId && (
                <button
                  type="button"
                  onClick={() => {
                    onFocusBlock(iss.blockId as string);
                    onClose();
                  }}
                  style={{
                    height: 32,
                    padding: '0 10px',
                    borderRadius: 8,
                    border: '1px solid #DBEAFE',
                    background: '#FFFFFF',
                    color: '#1E40FF',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Sửa khối <ExternalLink size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
        <button type="button" onClick={() => void runCheck()} className="btn secondary" style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Kiểm tra lại
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
        >
          Hoàn tất
        </button>
      </div>
    </div>
  );
};

export const EmailValidationPanel: React.FC<EmailValidationPanelProps> = (props) => (
  <CustomModal
    isOpen={props.isOpen}
    onClose={props.onClose}
    title="Kiểm Định Deliverability, Link & Điểm Chống Spam"
    width={640}
  >
    {props.isOpen && <ValidationModalInner {...props} />}
  </CustomModal>
);

export default EmailValidationPanel;
