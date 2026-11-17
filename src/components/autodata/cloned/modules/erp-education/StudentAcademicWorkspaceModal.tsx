import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, PauseCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import {
  Badge,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import type {
  StudentSubjectTranscriptItem,
  StudentWorkspacePayload,
} from './educationTypes';
import { StudentPostponeOcrTab } from './StudentPostponeOcrTab';

export interface StudentAcademicWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollmentId: string;
  initialSection?: 'transcript' | 'postpone';
  onUpdated?: () => void;
}

type WorkspaceTab = 'transcript' | 'postpone';

export const StudentAcademicWorkspaceModal: React.FC<StudentAcademicWorkspaceModalProps> = ({
  isOpen,
  onClose,
  enrollmentId,
  initialSection = 'transcript',
  onUpdated,
}) => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const canEdit = can('education_addon', 'edit') || can('education_addon', 'create');
  const canApprove = can('education_addon', 'approve');

  const [tab, setTab] = useState<WorkspaceTab>(initialSection);
  const [loadedId, setLoadedId] = useState<string>('');
  const [workspace, setWorkspace] = useState<StudentWorkspacePayload | null>(null);

  const refreshWorkspace = useCallback(async () => {
    if (!enrollmentId) return;
    const data = await apiRequest<StudentWorkspacePayload>(
      `/education/students/${enrollmentId}/workspace`,
      { token, tenantSlug }
    );
    setWorkspace(data);
    setLoadedId(enrollmentId);
    onUpdated?.();
  }, [enrollmentId, token, tenantSlug, onUpdated]);

  useEffect(() => {
    if (!isOpen || !enrollmentId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRequest<StudentWorkspacePayload>(
          `/education/students/${enrollmentId}/workspace`,
          { token, tenantSlug }
        );
        if (!cancelled) {
          setWorkspace(data);
          setLoadedId(enrollmentId);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(getErrorMessage(err, 'Không thể tải Không gian Học vụ 360°'));
          setLoadedId(enrollmentId);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, enrollmentId, token, tenantSlug]);

  const isLoading = Boolean(isOpen && enrollmentId && loadedId !== enrollmentId);

  const transcriptCols: ReadonlyArray<TableColumn<StudentSubjectTranscriptItem>> = [
    { key: 'code', header: 'Mã HP', render: (r) => <strong>{r.subject_code}</strong> },
    { key: 'name', header: 'Môn học / Chuyên đề', render: (r) => r.subject_name },
    { key: 'cr', header: 'Tín chỉ', numeric: true, render: (r) => `${r.credits} TC` },
    { key: 'fin', header: 'Điểm TK', numeric: true, render: (r) => r.final_score ?? '—' },
    {
      key: 'ects',
      header: 'ECTS 6 / GPA',
      numeric: true,
      render: (r) => (r.ects_score_6 !== null ? `${r.ects_score_6} / ${r.gpa_score ?? '—'}` : '—'),
    },
    {
      key: 'let',
      header: 'Xếp loại',
      render: (r) =>
        r.letter_grade ? (
          <Badge tone={r.status === 'passed' ? 'success' : 'danger'}>{r.letter_grade}</Badge>
        ) : (
          '—'
        ),
    },
    {
      key: 'st',
      header: 'Trạng thái',
      render: (r) => (
        <Badge
          tone={
            r.status === 'passed'
              ? 'success'
              : r.status === 'failed'
              ? 'danger'
              : r.status === 'deferred'
              ? 'warning'
              : 'neutral'
          }
        >
          {r.status === 'passed'
            ? 'Hoàn thành'
            : r.status === 'failed'
            ? 'Chưa đạt'
            : r.status === 'deferred'
            ? 'Bảo lưu'
            : 'Đang học'}
        </Badge>
      ),
    },
  ];

  const pct = workspace?.curriculum_progress.progress_pct ?? 0;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference;

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Không Gian Học Vụ 360° & Hồ Sơ Bảo Lưu OCR"
      width="min(1040px, 96vw)"
    >
      {isLoading || !workspace ? (
        <ModalBodySkeleton rows={5} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
              padding: 16,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)',
              border: '1px solid #DBEAFE',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <svg width="84" height="84" viewBox="0 0 84 84" style={{ flexShrink: 0 }}>
                <circle cx="42" cy="42" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="7" />
                <circle
                  cx="42"
                  cy="42"
                  r={radius}
                  fill="none"
                  stroke="#1E40FF"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 42 42)"
                />
                <text x="42" y="46" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0F172A">
                  {pct}%
                </text>
              </svg>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                  {workspace.enrollment.student_name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 2 }}>
                  {workspace.enrollment.class_code} — {workspace.enrollment.course_name}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <Badge tone={workspace.enrollment.status === 'deferred' ? 'warning' : 'success'}>
                    {workspace.enrollment.status.toUpperCase()}
                  </Badge>
                  <Badge tone="primary">
                    {workspace.curriculum_progress.earned_credits}/{workspace.curriculum_progress.total_credits} Tín chỉ
                  </Badge>
                </div>
              </div>
            </div>

            <div style={{ padding: '10px 14px', borderRadius: 12, background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>ĐIỂM TÍCH LŨY ĐA THANG</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
                ECTS 6: {workspace.curriculum_progress.cumulative_ects_6 ?? '—'} • GPA 4: {workspace.curriculum_progress.cumulative_gpa_4 ?? '—'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
                Hệ 10.0: <strong>{workspace.curriculum_progress.cumulative_scale_10 ?? '—'}</strong> ({workspace.curriculum_progress.completed_subjects_count}/{workspace.curriculum_progress.total_subjects} môn đạt)
              </div>
            </div>

            <div style={{ padding: '10px 14px', borderRadius: 12, background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>CHUYÊN CẦN & HỌC PHÍ</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
                Chuyên cần: {workspace.attendance.attendance_rate}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
                Đã đóng: <strong>{formatVnd(workspace.enrollment.tuition_paid_vnd)}</strong>
              </div>
            </div>
          </div>

          <PillTabs<WorkspaceTab>
            activeKey={tab}
            onChange={setTab}
            tabs={[
              { key: 'transcript', label: 'Chương Trình & Bảng Điểm Tín Chỉ', icon: <BookOpen size={14} />, count: workspace.subjects.length },
              { key: 'postpone', label: 'Bảo Lưu / Hoãn Học & Xác Thực OCR', icon: <PauseCircle size={14} />, count: workspace.postpone_history.length },
            ]}
          />

          {tab === 'transcript' ? (
            <Table
              columns={transcriptCols}
              rows={workspace.subjects}
              rowKey={(r) => r.subject_code}
              emptyTitle="Chưa có môn học trong khung chương trình"
            />
          ) : (
            <StudentPostponeOcrTab
              workspace={workspace}
              canEdit={canEdit}
              canApprove={canApprove}
              onRefresh={refreshWorkspace}
            />
          )}
        </div>
      )}
    </CustomModal>
  );
};
