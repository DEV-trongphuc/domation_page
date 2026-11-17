import React, { useState } from 'react';
import { History, Play, Sparkles } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { formatShortDate } from '../../../autodataApi';
import type { FlowSnapshotItem, FlowTraceItem } from './flowConstants';

interface FlowSimulateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunSimulate: (sample: { name: string; lead_score: number; email_consent: string }) => Promise<{
    trace: FlowTraceItem[];
    wouldPushToSaleRound: boolean;
  } | null>;
}

export const FlowSimulateModal: React.FC<FlowSimulateModalProps> = ({
  isOpen,
  onClose,
  onRunSimulate,
}) => {
  const [sampleName, setSampleName] = useState('Nguyễn Minh Khang');
  const [sampleScore, setSampleScore] = useState('25');
  const [sampleConsent, setSampleConsent] = useState('subscribed');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ trace: FlowTraceItem[]; wouldPushToSaleRound: boolean } | null>(null);

  const handleStart = async () => {
    setRunning(true);
    try {
      const res = await onRunSimulate({
        name: sampleName,
        lead_score: Number(sampleScore || 0),
        email_consent: sampleConsent,
      });
      if (res) setResult(res);
    } finally {
      setRunning(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Giả Lập Đường Đi Kịch Bản (Dry-Run Path Simulator)"
      width={600}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 8 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Tên Hồ sơ giả lập</label>
            <input className="form-input" style={{ height: 44 }} value={sampleName} onChange={(e) => setSampleName(e.target.value)} />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Lead Score đầu vào</label>
            <input
              type="number"
              className="form-input"
              style={{ height: 44 }}
              value={sampleScore}
              onChange={(e) => setSampleScore(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Trạng thái Email</label>
            <select
              className="form-input"
              style={{ height: 44 }}
              value={sampleConsent}
              onChange={(e) => setSampleConsent(e.target.value)}
            >
              <option value="subscribed">subscribed</option>
              <option value="unsubscribed">unsubscribed</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          disabled={running}
          onClick={() => void handleStart()}
          style={{
            height: 44,
            borderRadius: 12,
            border: 'none',
            background: '#1E40FF',
            color: '#FFFFFF',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <Play size={15} /> {running ? 'Đang mô phỏng...' : 'Chạy Thử Không Ghi CSDL'}
        </button>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            {result.wouldPushToSaleRound && (
              <Badge tone="success">
                Kết quả: Hồ sơ đạt chuẩn sẽ được đẩy thẳng vào Vòng chia Sale Auto Data!
              </Badge>
            )}
            {result.trace.map((item, idx) => (
              <div
                key={`${item.step_id}-${idx}`}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 12,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A' }}>
                  Bước {idx + 1}: {item.label} ({item.node_type})
                </div>
                <div style={{ fontSize: '0.76rem', color: '#1E40FF', marginTop: 2 }}>{item.outcome}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomModal>
  );
};

interface FlowReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: {
    score: number;
    grade: string;
    findings: Array<{ severity: string; message: string }>;
  } | null;
}

export const FlowReviewModal: React.FC<FlowReviewModalProps> = ({ isOpen, onClose, review }) => (
  <CustomModal
    isOpen={isOpen}
    onClose={onClose}
    title="DOM Agent Kiểm Toán Kịch Bản Tự Động"
    width={540}
  >
    {review && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1rem', borderRadius: 14, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#1E40FF' }}>
            <Sparkles size={18} /> Điểm Tối Ưu Kịch Bản: {review.score}/100
          </div>
          <Badge tone={review.score >= 85 ? 'success' : 'warning'}>{review.grade}</Badge>
        </div>
        {review.findings.length === 0 ? (
          <div style={{ fontSize: '0.84rem', color: '#059669', fontWeight: 700 }}>
            Kịch bản chặt chẽ 100%, không phát hiện lỗi rẽ nhánh hay gửi dồn gây Spam!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {review.findings.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 12,
                  background: f.severity === 'error' ? '#FEF2F2' : f.severity === 'warning' ? '#FFFBEB' : '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.8rem',
                  color: '#0F172A',
                }}
              >
                {f.message}
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </CustomModal>
);

interface FlowSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: FlowSnapshotItem[];
  onRestore: (snapshotId: string) => void;
}

export const FlowSnapshotHistoryModal: React.FC<FlowSnapshotModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onRestore,
}) => (
  <CustomModal
    isOpen={isOpen}
    onClose={onClose}
    title="Lịch Sử Phiên Bản Bất Biến (flow_snapshots)"
    width={540}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {snapshots.length === 0 ? (
        <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
          Chưa có phiên bản xuất bản nào. Nhấn &ldquo;Kích hoạt & Lưu Snapshot&rdquo; để đóng băng phiên bản đầu tiên.
        </div>
      ) : (
        snapshots.map((s) => (
          <div
            key={s.id}
            style={{
              padding: '0.75rem 0.95rem',
              borderRadius: 12,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                <History size={13} style={{ display: 'inline', marginRight: 5 }} />
                Phiên bản v{s.version} • Trigger: {s.trigger_type}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                Điểm kiểm toán: {s.review_score}/100 • {formatShortDate(s.created_at)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRestore(s.id)}
              className="btn secondary sm"
              style={{ height: 36, color: '#1E40FF' }}
            >
              Khôi phục
            </button>
          </div>
        ))
      )}
    </div>
  </CustomModal>
);
