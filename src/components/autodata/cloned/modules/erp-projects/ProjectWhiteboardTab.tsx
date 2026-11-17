import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  History,
  PenTool,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge, Card, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  STICKY_COLORS,
  type ProjectRow,
  type WhiteboardElementItem,
  type WhiteboardSnapshotRow,
} from './projectsTypes';

export interface ProjectWhiteboardTabProps {
  project: ProjectRow | null;
  elements: WhiteboardElementItem[];
  onChangeElements: React.Dispatch<React.SetStateAction<WhiteboardElementItem[]>>;
  canEdit: boolean;
  onRefreshProject: () => Promise<void> | void;
}

export const ProjectWhiteboardTab: React.FC<ProjectWhiteboardTabProps> = ({
  project,
  elements,
  onChangeElements,
  canEdit,
  onRefreshProject,
}) => {
  const { token, tenantSlug } = useAuth();
  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState<'sticky' | 'milestone' | 'box'>('sticky');
  const [newColor, setNewColor] = useState('#FEF3C7');
  const [savingBoard, setSavingBoard] = useState(false);

  const [snapshots, setSnapshots] = useState<WhiteboardSnapshotRow[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotNote, setSnapshotNote] = useState('');
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchSnapshots = useCallback(
    async (projId: string) => {
      const res = await apiRequest<{ items: WhiteboardSnapshotRow[] }>(
        `/projects/${projId}/whiteboard/snapshots`,
        { token, tenantSlug }
      );
      return res.items || [];
    },
    [token, tenantSlug]
  );

  useEffect(() => {
    if (!project?.id) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchSnapshots(project.id);
        if (!cancelled) setSnapshots(items);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải lịch sử Snapshot Bảng trắng'));
      } finally {
        if (!cancelled) setLoadingSnapshots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project?.id, fetchSnapshots]);

  const handleAddElement = () => {
    if (!newText.trim()) {
      toast.error('Vui lòng nhập nội dung thẻ cộng tác');
      return;
    }
    const idx = elements.length;
    onChangeElements((prev) => [
      ...prev,
      {
        id: `wb-${idx + 1}-${newText.trim().length}`,
        type: newType,
        text: newText.trim(),
        x: 24 + (idx % 3) * 235,
        y: 24 + Math.floor(idx / 3) * 145,
        color: newColor,
      },
    ]);
    setNewText('');
  };

  const handleNudgeElement = (id: string, dx: number, dy: number) => {
    onChangeElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, x: Math.max(12, el.x + dx), y: Math.max(12, el.y + dy) } : el))
    );
  };

  const handleSaveLiveBoard = async () => {
    if (!project) return;
    setSavingBoard(true);
    try {
      await apiRequest(`/projects/${project.id}/whiteboard`, {
        method: 'PUT',
        token,
        tenantSlug,
        body: { elements },
      });
      toast.success('Đã lưu Bảng trắng cộng tác vào dự án');
      await onRefreshProject();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Bảng trắng'));
    } finally {
      setSavingBoard(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!project) return;
    setSavingSnapshot(true);
    try {
      await apiRequest(`/projects/${project.id}/whiteboard`, {
        method: 'PUT',
        token,
        tenantSlug,
        body: { elements },
      });
      const created = await apiRequest<WhiteboardSnapshotRow>(
        `/projects/${project.id}/whiteboard/snapshots`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            snapshot_name: snapshotName.trim() || undefined,
            snapshot_json: elements,
            thumbnail_note: snapshotNote.trim() || `${elements.length} phần tử cộng tác`,
          },
        }
      );
      setSnapshots((prev) => [created, ...prev]);
      setSnapshotName('');
      setSnapshotNote('');
      setSnapshotModalOpen(false);
      toast.success(`Đã chụp phiên bản v${created.version_no} (${created.snapshot_name})`);
      await onRefreshProject();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Snapshot Bảng trắng'));
    } finally {
      setSavingSnapshot(false);
    }
  };

  const handleRestoreSnapshot = async (snap: WhiteboardSnapshotRow) => {
    if (!project) return;
    setRestoringId(snap.id);
    try {
      const res = await apiRequest<{ elements: WhiteboardElementItem[] }>(
        `/projects/${project.id}/whiteboard/snapshots/${snap.id}/restore`,
        { method: 'POST', token, tenantSlug, body: {} }
      );
      onChangeElements(res.elements || []);
      toast.success(`Đã khôi phục Bảng trắng về phiên bản v${snap.version_no}: ${snap.snapshot_name}`);
      await onRefreshProject();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể khôi phục Snapshot'));
    } finally {
      setRestoringId(null);
    }
  };

  if (!project) {
    return (
      <EmptyState
        icon={<PenTool size={24} />}
        title="Chưa chọn Dự án cho Bảng trắng cộng tác"
        description="Khởi tạo hoặc chọn một dự án ở thanh trên để phác thảo sơ đồ và quản lý lịch sử phiên bản Snapshot."
      />
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.85fr) minmax(290px, 0.95fr)', gap: '1rem', alignItems: 'start' }}>
      <Card
        title={`Bảng Trắng Cộng Tác — ${project.name}`}
        subtitle="Ghim Sticky Note, Cột mốc nghiệm thu & Khối quy trình"
        actions={
          canEdit ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setSnapshotModalOpen(true)} className="btn secondary" style={{ height: 42, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Camera size={15} /> Chụp Snapshot
              </button>
              <button type="button" disabled={savingBoard} onClick={() => void handleSaveLiveBoard()} style={{ height: 42, padding: '0 16px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Save size={15} /> {savingBoard ? 'Đang lưu...' : 'Lưu Bảng trắng'}
              </button>
            </div>
          ) : undefined
        }
      >
        {canEdit && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            <select value={newType} onChange={(e) => setNewType(e.target.value as 'sticky' | 'milestone' | 'box')} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF' }}>
              <option value="sticky">Thẻ Sticky Note</option>
              <option value="milestone">Mốc Milestone</option>
              <option value="box">Khối Quy trình</option>
            </select>
            <input value={newText} onChange={(e) => setNewText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddElement(); }} placeholder="Nhập ý tưởng, rủi ro hoặc mốc bàn giao..." style={{ flex: '1 1 220px', height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {STICKY_COLORS.map((c) => (
                <button key={c.hex} type="button" title={c.label} onClick={() => setNewColor(c.hex)} style={{ width: 28, height: 28, borderRadius: '50%', background: c.hex, border: newColor === c.hex ? '2.5px solid #1E40FF' : '1px solid #CBD5E1', cursor: 'pointer' }} />
              ))}
            </div>
            <button type="button" onClick={handleAddElement} className="btn secondary" style={{ height: 44, color: '#1E40FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Plus size={15} /> Ghim thẻ
            </button>
          </div>
        )}

        <div style={{ position: 'relative', minHeight: 420, borderRadius: 16, border: '1px solid #E2E8F0', backgroundColor: '#F8F9FA', backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '20px 20px', overflow: 'auto', padding: 16 }}>
          {elements.length === 0 ? (
            <div style={{ padding: '5rem 1rem', textAlign: 'center', color: '#64748B', fontSize: '0.86rem' }}>
              Bảng trắng đang trống. Hãy ghim thẻ mới hoặc khôi phục từ cột Lịch sử Snapshot bên phải.
            </div>
          ) : (
            elements.map((el) => (
              <div
                key={el.id}
                style={{ position: 'absolute', left: el.x, top: el.y, width: 215, minHeight: 112, padding: 12, borderRadius: el.type === 'milestone' ? 999 : 14, background: el.color || '#FEF3C7', border: el.type === 'milestone' ? '2px solid #1E40FF' : '1px solid rgba(15,23,42,0.12)', boxShadow: '0 6px 16px rgba(15,23,42,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge tone={el.type === 'milestone' ? 'primary' : 'neutral'}>{el.type.toUpperCase()}</Badge>
                  {canEdit && (
                    <button type="button" onClick={() => onChangeElements((prev) => prev.filter((item) => item.id !== el.id))} style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.4 }}>{el.text}</div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => handleNudgeElement(el.id, -24, 0)} style={{ border: '1px solid #CBD5E1', background: '#FFF', borderRadius: 6, padding: 2, cursor: 'pointer' }}><ArrowLeft size={11} /></button>
                    <button type="button" onClick={() => handleNudgeElement(el.id, 0, -24)} style={{ border: '1px solid #CBD5E1', background: '#FFF', borderRadius: 6, padding: 2, cursor: 'pointer' }}><ArrowUp size={11} /></button>
                    <button type="button" onClick={() => handleNudgeElement(el.id, 0, 24)} style={{ border: '1px solid #CBD5E1', background: '#FFF', borderRadius: 6, padding: 2, cursor: 'pointer' }}><ArrowDown size={11} /></button>
                    <button type="button" onClick={() => handleNudgeElement(el.id, 24, 0)} style={{ border: '1px solid #CBD5E1', background: '#FFF', borderRadius: 6, padding: 2, cursor: 'pointer' }}><ArrowRight size={11} /></button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title="Lịch Sử Phiên Bản (Snapshots)" subtitle="Khôi phục 1 chạm bất kỳ mốc thiết kế nào" actions={<Badge tone="primary" icon={<History size={12} />}>{snapshots.length} bản lưu</Badge>}>
        {loadingSnapshots ? (
          <CardSkeleton height={160} />
        ) : snapshots.length === 0 ? (
          <EmptyState icon={<History size={22} />} title="Chưa có Snapshot nào" description="Bấm Chụp Snapshot để đóng băng phiên bản Bảng trắng trước khi chỉnh sửa lớn." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {snapshots.map((snap) => (
              <div key={snap.id} style={{ padding: '12px 14px', borderRadius: 14, background: '#F8FAFF', border: '1px solid #DBEAFE', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>{snap.snapshot_name}</strong>
                  <Badge tone="primary">v{snap.version_no}</Badge>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                  {snap.thumbnail_note || `${(snap.elements || snap.snapshot_json || []).length} thẻ`} • {formatShortDate(snap.created_at)}
                </div>
                {canEdit && (
                  <button
                    type="button"
                    disabled={restoringId === snap.id}
                    onClick={() => void handleRestoreSnapshot(snap)}
                    className="btn secondary"
                    style={{ height: 36, marginTop: 4, color: '#1E40FF', fontWeight: 700, fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <RotateCcw size={13} /> {restoringId === snap.id ? 'Đang khôi phục...' : 'Khôi phục phiên bản này'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <CustomModal isOpen={snapshotModalOpen} onClose={() => setSnapshotModalOpen(false)} title="Lưu Phiên Bản Snapshot Bảng Trắng" width={460}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input value={snapshotName} onChange={(e) => setSnapshotName(e.target.value)} placeholder="Tên phiên bản (VD: Kiến trúc Kho Sprint 2)..." style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 14px' }} />
          <input value={snapshotNote} onChange={(e) => setSnapshotNote(e.target.value)} placeholder="Ghi chú thay đổi chính..." style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setSnapshotModalOpen(false)} className="btn secondary" style={{ height: 44 }}>Đóng</button>
            <button type="button" disabled={savingSnapshot} onClick={() => void handleSaveSnapshot()} style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>
              {savingSnapshot ? 'Đang chụp...' : 'Lưu Snapshot'}
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};
