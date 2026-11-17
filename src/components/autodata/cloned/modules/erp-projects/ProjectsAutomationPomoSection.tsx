import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  GitBranch,
  Pause,
  Play,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type {
  ChecklistEntry,
  OverviewPayload,
  PomodoroSessionRow,
  TaskRow,
  WorkflowTemplateRow,
} from './projectsTypes';

export interface ProjectsAutomationPomoSectionProps {
  mode: 'pomodoro' | 'automation';
  tasks: TaskRow[];
  pomodoroSessions: PomodoroSessionRow[];
  templates: WorkflowTemplateRow[];
  overview: OverviewPayload | null;
  selectedProjectId: string;
  initialPomodoroTaskId?: string;
  canCreate: boolean;
  onReload: () => Promise<void> | void;
}

export const ProjectsAutomationPomoSection: React.FC<ProjectsAutomationPomoSectionProps> = ({
  mode,
  tasks,
  pomodoroSessions,
  templates,
  overview,
  selectedProjectId,
  initialPomodoroTaskId = '',
  canCreate,
  onReload,
}) => {
  const { token, tenantSlug } = useAuth();

  // Pomodoro state
  const [pomoTaskId, setPomoTaskId] = useState(initialPomodoroTaskId);
  const [presetMins, setPresetMins] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [pomoNote, setPomoNote] = useState('');

  // Automation state
  const defaultPipeId = overview?.pipelines[0]?.id || '';
  const [tplPipelineId, setTplPipelineId] = useState(defaultPipeId);
  const [tplStageId, setTplStageId] = useState(
    overview?.stages.find((s) => s.pipeline_id === defaultPipeId)?.id || ''
  );
  const [tplTitle, setTplTitle] = useState('Khảo sát nhu cầu & chuẩn bị báo giá cho {{lead.name}}');
  const [tplDueHours, setTplDueHours] = useState('24');
  const [tplChecklistRaw, setTplChecklistRaw] = useState('Gọi xác nhận lịch hẹn\nGửi hồ sơ năng lực');

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const effectivePomoTaskId = pomoTaskId || initialPomodoroTaskId;

  const filteredStages = useMemo(
    () => (overview?.stages || []).filter((s) => !tplPipelineId || s.pipeline_id === tplPipelineId),
    [overview?.stages, tplPipelineId]
  );

  const handleLogPomodoro = async () => {
    try {
      await apiRequest('/projects/pomodoro/sessions', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          task_id: effectivePomoTaskId || null,
          duration_minutes: presetMins,
          mode: 'focus',
          note: pomoNote.trim() || `Hoàn thành phiên Focus ${presetMins} phút`,
        },
      });
      toast.success(`Đã cộng +${presetMins} phút Focus vào thời lượng công việc`);
      setRunning(false);
      setSecondsLeft(presetMins * 60);
      setPomoNote('');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ghi nhận phiên Pomodoro'));
    }
  };

  const handleCreateTemplate = async () => {
    const chosenStage = tplStageId || filteredStages[0]?.id || '';
    if (!tplTitle.trim() || !chosenStage) {
      toast.error('Vui lòng chọn Bước Pipeline và nhập tiêu đề công việc mẫu');
      return;
    }
    const checklist: ChecklistEntry[] = tplChecklistRaw
      .split('\n')
      .map((line, idx) => ({ id: `chk-${idx + 1}`, text: line.trim(), done: false }))
      .filter((item) => item.text.length > 0);
    try {
      await apiRequest('/projects/workflow-templates', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          pipeline_id: tplPipelineId || null,
          stage_id: chosenStage,
          project_id: selectedProjectId || null,
          title_template: tplTitle.trim(),
          due_offset_hours: Number(tplDueHours || 24),
          priority: 'high',
          checklist,
        },
      });
      toast.success('Đã kích hoạt luật tự sinh công việc khi chuyển bước CRM');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo mẫu tự động hóa'));
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await apiRequest(`/projects/workflow-templates/${id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã gỡ mẫu tự động hóa');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa mẫu'));
    }
  };

  if (mode === 'pomodoro') {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const ss = String(secondsLeft % 60).padStart(2, '0');
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
        <Card
          title="Đồng Hồ Tập Trung Sâu (Focus Pomodoro)"
          subtitle="Tự động cộng số phút thực làm vào logged_minutes của công việc"
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '0.5rem 0' }}>
            <div style={{ fontSize: '3.2rem', fontWeight: 900, color: '#1E40FF', letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums' }}>
              {mm}:{ss}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[15, 25, 45, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setRunning(false);
                    setPresetMins(m);
                    setSecondsLeft(m * 60);
                  }}
                  style={{
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 999,
                    border: presetMins === m ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                    background: presetMins === m ? '#EFF6FF' : '#FFFFFF',
                    color: presetMins === m ? '#1E40FF' : '#475569',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {m} phút
                </button>
              ))}
            </div>
            <select
              value={effectivePomoTaskId}
              onChange={(e) => setPomoTaskId(e.target.value)}
              style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}
            >
              <option value="">-- Chọn công việc cần tính giờ Focus --</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} (Đã log {t.logged_minutes}p)
                </option>
              ))}
            </select>
            <input
              value={pomoNote}
              onChange={(e) => setPomoNote(e.target.value)}
              placeholder="Ghi chú kết quả phiên tập trung..."
              style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {running ? <Pause size={15} /> : <Play size={15} />} {running ? 'Tạm dừng' : 'Bắt đầu'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRunning(false);
                  setSecondsLeft(presetMins * 60);
                }}
                className="btn secondary"
                style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RotateCcw size={15} /> Đặt lại
              </button>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => void handleLogPomodoro()}
                  className="btn secondary"
                  style={{ height: 44, color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <CheckCircle2 size={15} /> Ghi nhận +{presetMins}p
                </button>
              )}
            </div>
          </div>
        </Card>

        <Card title="Nhật Ký Phiên Tập Trung Gần Đây" subtitle={`${pomodoroSessions.length} phiên đã ghi nhận`}>
          {pomodoroSessions.length === 0 ? (
            <EmptyState title="Chưa có phiên Pomodoro nào" description="Bắt đầu đồng hồ và bấm Ghi nhận để lưu lịch sử." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pomodoroSessions.slice(0, 8).map((s) => (
                <div key={s.id} style={{ padding: '10px 12px', borderRadius: 12, background: '#F8F9FA', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>{s.task_title || s.note || 'Phiên tập trung'}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{s.user_name || 'Thành viên'} • {formatShortDate(s.created_at)}</div>
                  </div>
                  <Badge tone="primary">+{s.duration_minutes}p</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
      <Card
        title="Luật Tự Sinh Công Việc Khi Chuyển Bước CRM"
        subtitle="Khi Lead chuyển sang bước Pipeline chỉ định, hệ thống tự động sinh Task kèm Checklist"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select
              value={tplPipelineId}
              onChange={(e) => {
                const nextPipe = e.target.value;
                setTplPipelineId(nextPipe);
                const first = overview?.stages.find((st) => st.pipeline_id === nextPipe);
                if (first) setTplStageId(first.id);
              }}
              style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}
            >
              {(overview?.pipelines || []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={tplStageId}
              onChange={(e) => setTplStageId(e.target.value)}
              style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}
            >
              {filteredStages.map((st) => (
                <option key={st.id} value={st.id}>{st.stage_name}</option>
              ))}
            </select>
          </div>
          <input value={tplTitle} onChange={(e) => setTplTitle(e.target.value)} placeholder="Tiêu đề mẫu (hỗ trợ {{lead.name}})..." style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          <input type="number" value={tplDueHours} onChange={(e) => setTplDueHours(e.target.value)} placeholder="Hạn hoàn thành (số giờ sau khi chuyển bước)" style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          <textarea value={tplChecklistRaw} onChange={(e) => setTplChecklistRaw(e.target.value)} rows={3} placeholder="Mỗi dòng 1 mục Checklist..." style={{ borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 12px' }} />
          {canCreate && (
            <button type="button" onClick={() => void handleCreateTemplate()} style={{ height: 44, borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>
              Kích hoạt Luật Stage → Task
            </button>
          )}
        </div>
      </Card>

      <Card title="Danh Sách Luật Đang Hoạt Động" subtitle={`${templates.length} quy tắc tự động`}>
        {templates.length === 0 ? (
          <EmptyState icon={<GitBranch size={22} />} title="Chưa có luật tự động nào" description="Thiết lập quy tắc bên trái để tự động giao việc cho đội triển khai." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {templates.map((tpl) => (
              <div key={tpl.id} style={{ padding: 12, borderRadius: 14, background: '#F8FAFF', border: '1px solid #DBEAFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{tpl.title_template}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                    Bước: {tpl.stage_name || tpl.stage_key} • Hạn +{tpl.due_offset_hours}h • {tpl.checklist.length} mục checklist
                  </div>
                </div>
                <button type="button" onClick={() => void handleDeleteTemplate(tpl.id)} style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
