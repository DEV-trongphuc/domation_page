import React from 'react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { StepParticipantsModal } from './StepParticipantsModal';
import { ManualTriggerFlowModal } from './ManualTriggerFlowModal';
import { FlowSimulateModal, type SampleSimulationLead } from './FlowSimulateModal';
import { FlowReviewModal, type FlowReviewData } from './FlowReviewModal';
import { AddFlowStepModal, FlowSnapshotHistoryModal } from './FlowModals';
import type {
  FlowCatalogResources,
  FlowDefinitionDto,
  FlowNodeType11,
  FlowSnapshotItem,
  FlowStepNode,
  FlowTraceItem,
} from './flowConstants';

export interface FlowStudioOverlaysProps {
  pendingInsert: { parentId: string | null; branch: 'next' | 'yes' | 'no' | 'A' | 'B' } | null;
  onCloseInsert: () => void;
  onPickNode: (type: FlowNodeType11, label: string) => void;
  participantsTarget: FlowStepNode | null;
  onCloseParticipants: () => void;
  editingId: string | null;
  manualTriggerTarget: { id: string | null; name: string } | null;
  onCloseManualTrigger: () => void;
  flowName: string;
  audiences: FlowCatalogResources['audiences'];
  onReload: () => Promise<void>;
  simOpen: boolean;
  onCloseSim: () => void;
  onRunSimulate: (sample: SampleSimulationLead) => Promise<{
    trace: FlowTraceItem[];
    wouldPushToSaleRound: boolean;
  } | null>;
  onHighlightTrace: (ids: string[]) => void;
  reviewData: FlowReviewData | null;
  onCloseReview: () => void;
  auditing: boolean;
  onReAudit: () => Promise<void>;
  onSelectStepFromReview: (id: string) => void;
  snapshotsOpen: boolean;
  onCloseSnapshots: () => void;
  snapshots: FlowSnapshotItem[];
  onRestoreSnapshot: (snapId: string) => void;
  deleteTarget: FlowDefinitionDto | null;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
}

export const FlowStudioOverlays: React.FC<FlowStudioOverlaysProps> = ({
  pendingInsert,
  onCloseInsert,
  onPickNode,
  participantsTarget,
  onCloseParticipants,
  editingId,
  manualTriggerTarget,
  onCloseManualTrigger,
  flowName,
  audiences,
  onReload,
  simOpen,
  onCloseSim,
  onRunSimulate,
  onHighlightTrace,
  reviewData,
  onCloseReview,
  auditing,
  onReAudit,
  onSelectStepFromReview,
  snapshotsOpen,
  onCloseSnapshots,
  snapshots,
  onRestoreSnapshot,
  deleteTarget,
  onCloseDelete,
  onConfirmDelete,
}) => (
  <>
    <AddFlowStepModal isOpen={Boolean(pendingInsert)} onClose={onCloseInsert} onPickNode={onPickNode} />

    <StepParticipantsModal
      key={participantsTarget?.id || 'closed'}
      isOpen={Boolean(participantsTarget)}
      onClose={onCloseParticipants}
      flowId={editingId}
      step={participantsTarget}
    />

    <ManualTriggerFlowModal
      isOpen={Boolean(manualTriggerTarget)}
      onClose={onCloseManualTrigger}
      flowId={manualTriggerTarget?.id || null}
      flowName={manualTriggerTarget?.name || flowName}
      audiences={audiences}
      onTriggered={onReload}
    />

    <FlowSimulateModal
      isOpen={simOpen}
      onClose={onCloseSim}
      onRunSimulate={onRunSimulate}
      onHighlightTraceOnCanvas={onHighlightTrace}
    />

    <FlowReviewModal
      isOpen={Boolean(reviewData)}
      onClose={onCloseReview}
      review={reviewData}
      auditing={auditing}
      onReAudit={onReAudit}
      onSelectStep={onSelectStepFromReview}
    />

    <FlowSnapshotHistoryModal
      isOpen={snapshotsOpen}
      onClose={onCloseSnapshots}
      snapshots={snapshots}
      onRestore={onRestoreSnapshot}
    />

    <ConfirmModal
      isOpen={Boolean(deleteTarget)}
      onClose={onCloseDelete}
      onConfirm={onConfirmDelete}
      title="Xác nhận xóa Automation Flow"
      message={`Bạn có chắc chắn muốn xóa kịch bản "${deleteTarget?.name || ''}" không?`}
    />
  </>
);
