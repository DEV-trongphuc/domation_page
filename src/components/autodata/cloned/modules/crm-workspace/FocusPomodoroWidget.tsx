import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Flame, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import type { WorkspaceTaskRecord } from '../../drawers/crmTypes';
import { crmMutate, type CrmAuthCreds } from '../../drawers/crm360Api';

export interface FocusPomodoroWidgetProps {
  tasks: WorkspaceTaskRecord[];
  creds: CrmAuthCreds;
  onLogged: () => Promise<void> | void;
}

const MODES = [
  { key: 'focus', label: 'Tập trung 25p', minutes: 25 },
  { key: 'short_break', label: 'Nghỉ ngắn 5p', minutes: 5 },
  { key: 'long_break', label: 'Nghỉ dài 15p', minutes: 15 },
] as const;

export const FocusPomodoroWidget: React.FC<FocusPomodoroWidgetProps> = ({
  tasks,
  creds,
  onLogged,
}) => {
  const activeTasks = tasks.filter((t) => t.status_key !== 'done' && !t.is_hidden);
  const [mode, setMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const resolvedTaskId = selectedTaskId || activeTasks[0]?.id || '';

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [running]);

  const switchMode = (next: 'focus' | 'short_break' | 'long_break', mins: number) => {
    setRunning(false);
    setMode(next);
    setSeconds(mins * 60);
  };

  const handleCompleteSession = async () => {
    const mins = MODES.find((m) => m.key === mode)?.minutes || 25;
    try {
      await crmMutate('/workspace/pomodoro', 'POST', creds, {
        task_id: resolvedTaskId || null,
        duration_minutes: mins,
        mode,
        note: 'Hoàn tất phiên Sticky Focus trên Bàn làm việc',
      });
      toast.success(`Đã ghi nhận phiên ${mins} phút (${mode})!`);
      setRunning(false);
      setSeconds(mins * 60);
      await onLogged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể ghi nhận phiên Pomodoro');
    }
  };

  const handleNextTask = () => {
    if (activeTasks.length <= 1) return;
    const curIdx = activeTasks.findIndex((t) => t.id === resolvedTaskId);
    const nextTask = activeTasks[(curIdx + 1) % activeTasks.length];
    if (nextTask) setSelectedTaskId(nextTask.id);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #DBEAFE',
        borderRadius: 16,
        padding: '0.9rem 1.2rem',
        boxShadow: '0 6px 20px rgba(30, 64, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: '#EFF6FF',
            color: '#1E40FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Flame size={18} />
        </div>
        <div>
          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
            Focus Sticky Pomodoro
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => switchMode(m.key, m.minutes)}
                style={{
                  border: 'none',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  background: mode === m.key ? '#1E40FF' : '#F1F5F9',
                  color: mode === m.key ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <select
        value={resolvedTaskId}
        onChange={(e) => setSelectedTaskId(e.target.value)}
        style={{
          height: 40,
          minWidth: 220,
          maxWidth: 320,
          borderRadius: 10,
          border: '1px solid #E2E8F0',
          padding: '0 10px',
          fontSize: '0.8rem',
          background: '#F8FAFC',
          color: '#0F172A',
        }}
      >
        <option value="">— Chọn việc đang tập trung —</option>
        {activeTasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '1.3rem',
            fontWeight: 800,
            color: '#1E40FF',
            minWidth: 68,
            textAlign: 'center',
          }}
        >
          {mm}:{ss}
        </span>

        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          style={{
            height: 40,
            padding: '0 14px',
            borderRadius: 10,
            border: 'none',
            background: '#1E40FF',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.8rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            cursor: 'pointer',
          }}
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? 'Dừng' : 'Chạy'}
        </button>

        <button
          type="button"
          onClick={handleNextTask}
          title="Chuyển việc tiếp theo"
          style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <SkipForward size={14} />
        </button>

        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setSeconds((MODES.find((m) => m.key === mode)?.minutes || 25) * 60);
          }}
          title="Đặt lại"
          style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <RotateCcw size={14} />
        </button>

        <button
          type="button"
          onClick={() => void handleCompleteSession()}
          style={{
            height: 40,
            padding: '0 12px',
            borderRadius: 10,
            border: '1px solid #BBF7D0',
            background: '#ECFDF5',
            color: '#059669',
            fontWeight: 700,
            fontSize: '0.78rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            cursor: 'pointer',
          }}
        >
          <CheckCircle2 size={14} /> Lưu phiên
        </button>
      </div>
    </div>
  );
};
