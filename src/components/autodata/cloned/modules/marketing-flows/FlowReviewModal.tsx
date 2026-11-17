import React from 'react';
import { AlertTriangle, CheckCircle2, Lightbulb, RefreshCw, Sparkles, XCircle } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';

export interface FlowReviewFinding {
  severity: string;
  message: string;
  step_id?: string;
}

export interface FlowReviewData {
  auditor?: string;
  score: number;
  grade: string;
  findings: FlowReviewFinding[];
}

export interface FlowReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: FlowReviewData | null;
  auditing?: boolean;
  onReAudit?: () => Promise<void>;
  onSelectStep?: (stepId: string) => void;
}

export const FlowReviewModal: React.FC<FlowReviewModalProps> = ({
  isOpen,
  onClose,
  review,
  auditing = false,
  onReAudit,
  onSelectStep,
}) => {
  const findings = review?.findings || [];
  const errorsCount = findings.filter((f) => f.severity === 'error').length;
  const warningsCount = findings.filter((f) => f.severity === 'warning').length;
  const tipsCount = findings.filter((f) => f.severity !== 'error' && f.severity !== 'warning').length;

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="DOM Agent Kiểm Toán & Tối Ưu Hóa Kịch Bản Tự Động"
      width={600}
    >
      {review && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              padding: '1rem 1.15rem',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFF 100%)',
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 800, fontSize: '1rem', color: '#1E40FF' }}>
                <Sparkles size={18} /> Điểm Sức Khỏe DOM Agent: {review.score}/100
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 3 }}>
                Rà soát rẽ nhánh mồ côi, chống dồn tin Spam, bảo vệ hạn ngạch SES & bàn giao Vòng chia Sale
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge tone={review.score >= 85 ? 'success' : review.score >= 65 ? 'warning' : 'danger'}>
                Hạng {review.grade}
              </Badge>
              {onReAudit && (
                <button
                  type="button"
                  disabled={auditing}
                  onClick={() => void onReAudit()}
                  className="btn secondary sm"
                  style={{ height: 34 }}
                  title="Chạy kiểm toán lại"
                >
                  <RefreshCw size={13} className={auditing ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge tone={errorsCount > 0 ? 'danger' : 'neutral'}>{errorsCount} Lỗi nghiêm trọng</Badge>
            <Badge tone={warningsCount > 0 ? 'warning' : 'neutral'}>{warningsCount} Cảnh báo rẽ nhánh</Badge>
            <Badge tone="info">{tipsCount} Khuyến nghị tối ưu</Badge>
          </div>

          {findings.length === 0 ? (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 14,
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                fontWeight: 700,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle2 size={18} /> Kịch bản chặt chẽ 100%, sẵn sàng xuất bản Snapshot & chạy Real-time!
            </div>
          ) : (
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {findings.map((f, idx) => {
                const isErr = f.severity === 'error';
                const isWarn = f.severity === 'warning';
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem 0.95rem',
                      borderRadius: 12,
                      background: isErr ? '#FEF2F2' : isWarn ? '#FFFBEB' : '#F8FAFF',
                      border: isErr ? '1px solid #FECACA' : isWarn ? '1px solid #FDE68A' : '1px solid #DBEAFE',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      {isErr ? (
                        <XCircle size={16} color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />
                      ) : isWarn ? (
                        <AlertTriangle size={16} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
                      ) : (
                        <Lightbulb size={16} color="#1E40FF" style={{ marginTop: 2, flexShrink: 0 }} />
                      )}
                      <div style={{ fontSize: '0.8rem', color: '#0F172A', lineHeight: 1.45 }}>{f.message}</div>
                    </div>

                    {f.step_id && onSelectStep && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectStep(f.step_id!);
                          onClose();
                        }}
                        className="btn secondary sm"
                        style={{ height: 30, fontSize: '0.72rem', color: '#1E40FF', flexShrink: 0 }}
                      >
                        Tới Node
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </CustomModal>
  );
};

export default FlowReviewModal;
