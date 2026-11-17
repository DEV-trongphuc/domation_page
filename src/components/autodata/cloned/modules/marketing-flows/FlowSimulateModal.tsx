import React, { useState } from 'react';
import { CheckCircle2, Eye, Play } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import type { FlowTraceItem } from './flowConstants';

export interface SampleSimulationLead {
  name: string;
  email: string;
  phone: string;
  lead_score: number;
  email_consent: string;
  zns_consent: string;
  tags: string;
  total_revenue_vnd: number;
}

export interface FlowSimulateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunSimulate: (sample: SampleSimulationLead) => Promise<{
    trace: FlowTraceItem[];
    wouldPushToSaleRound: boolean;
  } | null>;
  onHighlightTraceOnCanvas: (stepIds: string[]) => void;
}

export const FlowSimulateModal: React.FC<FlowSimulateModalProps> = ({
  isOpen,
  onClose,
  onRunSimulate,
  onHighlightTraceOnCanvas,
}) => {
  const [sample, setSample] = useState<SampleSimulationLead>({
    name: 'Nguyễn Minh Khang',
    email: 'khang.nguyen@viettech-corp.vn',
    phone: '0909123456',
    lead_score: 35,
    email_consent: 'subscribed',
    zns_consent: 'opted_in',
    tags: 'VIP, Quan_Tam_Bang_Gia',
    total_revenue_vnd: 15000000,
  });

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    trace: FlowTraceItem[];
    wouldPushToSaleRound: boolean;
  } | null>(null);

  const handleStart = async () => {
    setRunning(true);
    try {
      const res = await onRunSimulate(sample);
      if (res) {
        setResult(res);
      }
    } finally {
      setRunning(false);
    }
  };

  const handleApplyHighlight = () => {
    if (!result) return;
    onHighlightTraceOnCanvas(result.trace.map((t) => t.step_id));
    onClose();
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Giả Lập Đường Đi Kịch Bản Không Ghi CSDL (Dry-Run Path Simulator)"
      width={680}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 8 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Họ tên Lead giả lập</label>
            <input
              className="form-input"
              style={{ height: 40 }}
              value={sample.name}
              onChange={(e) => setSample((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Lead Score đầu vào</label>
            <input
              type="number"
              className="form-input"
              style={{ height: 40 }}
              value={sample.lead_score}
              onChange={(e) => setSample((prev) => ({ ...prev, lead_score: Number(e.target.value || 0) }))}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Doanh thu tích lũy (VNĐ)</label>
            <input
              type="number"
              className="form-input"
              style={{ height: 40 }}
              value={sample.total_revenue_vnd}
              onChange={(e) => setSample((prev) => ({ ...prev, total_revenue_vnd: Number(e.target.value || 0) }))}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: 8 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Trạng thái Email</label>
            <select
              className="form-input"
              style={{ height: 40 }}
              value={sample.email_consent}
              onChange={(e) => setSample((prev) => ({ ...prev, email_consent: e.target.value }))}
            >
              <option value="subscribed">subscribed (Nhận tin)</option>
              <option value="unsubscribed">unsubscribed (Đã hủy)</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Trạng thái Zalo ZNS</label>
            <select
              className="form-input"
              style={{ height: 40 }}
              value={sample.zns_consent}
              onChange={(e) => setSample((prev) => ({ ...prev, zns_consent: e.target.value }))}
            >
              <option value="opted_in">opted_in (Cho phép)</option>
              <option value="opted_out">opted_out (Từ chối)</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Nhãn CRM hiện có (`tags`)</label>
            <input
              className="form-input"
              style={{ height: 40 }}
              value={sample.tags}
              onChange={(e) => setSample((prev) => ({ ...prev, tags: e.target.value }))}
            />
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
          <Play size={15} /> {running ? 'Đang chạy giả lập nhánh...' : 'Chạy Giả Lập Đường Đi Ngay'}
        </button>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              {result.wouldPushToSaleRound ? (
                <Badge tone="success" icon={<CheckCircle2 size={12} />}>
                  Hồ sơ đạt chuẩn sẽ được đẩy thẳng vào Vòng chia Sale Auto Data!
                </Badge>
              ) : (
                <Badge tone="info">Đã hoàn tất mô phỏng {result.trace.length} bước</Badge>
              )}

              <button
                type="button"
                onClick={handleApplyHighlight}
                className="btn secondary sm"
                style={{ height: 34, color: '#059669', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Eye size={13} /> Tô Sáng Đường Đi Trên Canvas
              </button>
            </div>

            <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.trace.map((item, idx) => (
                <div
                  key={`${item.step_id}-${idx}`}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 12,
                    background: '#F8F9FA',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A' }}>
                      Bước #{idx + 1}: {item.label} ({item.node_type})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#1E40FF', marginTop: 2 }}>{item.outcome}</div>
                  </div>
                  {item.branch && <Badge tone="purple">Nhánh {item.branch}</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CustomModal>
  );
};

export default FlowSimulateModal;
