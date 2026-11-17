import React from 'react';
import { History } from 'lucide-react';
import { Badge, FormCard } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { formatShortDate } from '../../../autodataApi';
import {
  FLOW_NODES_11,
  type FlowNodeType11,
  type FlowSnapshotItem,
} from './flowConstants';

export interface FlowSnapshotModalProps {
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
    title="Lịch Sử Phiên Bản Bất Biến (`mkt_flow_snapshots`)"
    width={560}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {snapshots.length === 0 ? (
        <div style={{ fontSize: '0.82rem', color: '#64748B', padding: '1rem 0' }}>
          Chưa có phiên bản xuất bản nào. Nhấn &ldquo;Kích Hoạt &amp; Lưu Snapshot&rdquo; để đóng băng phiên bản đầu tiên.
        </div>
      ) : (
        snapshots.map((s) => (
          <div
            key={s.id}
            style={{
              padding: '0.75rem 0.95rem',
              borderRadius: 12,
              background: '#F8F9FA',
              border: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                <History size={13} style={{ display: 'inline', marginRight: 5, color: '#1E40FF' }} />
                Phiên bản v{s.version} • Trigger: {s.trigger_type}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
                Điểm kiểm toán DOM Agent: {s.review_score}/100 • {formatShortDate(s.created_at)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRestore(s.id)}
              className="btn secondary sm"
              style={{ height: 36, color: '#1E40FF', fontWeight: 700 }}
            >
              Khôi phục
            </button>
          </div>
        ))
      )}
    </div>
  </CustomModal>
);

export interface AddFlowStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPickNode: (type: FlowNodeType11, label: string) => void;
}

export const AddFlowStepModal: React.FC<AddFlowStepModalProps> = ({
  isOpen,
  onClose,
  onPickNode,
}) => (
  <CustomModal
    isOpen={isOpen}
    onClose={onClose}
    title="Chèn Node Hành Động Hoặc Rẽ Nhánh Mới (11 Nodes)"
    width={720}
  >
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {FLOW_NODES_11.map((n) => (
        <FormCard
          key={n.type}
          onClick={() => onPickNode(n.type, n.label)}
          title={n.label}
          description={n.desc}
          badge={<Badge tone={n.tone}>{n.category.toUpperCase()}</Badge>}
        />
      ))}
    </div>
  </CustomModal>
);
