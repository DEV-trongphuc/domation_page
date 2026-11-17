import React, { useState } from 'react';
import { BookOpen, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type {
  CourseRow,
  CurriculumSubject,
  GradingScaleKey,
} from './educationTypes';
import {
  GRADING_SCALE_OPTIONS,
  STANDARD_CURRICULUM_PRESETS,
} from './educationTypes';

export interface CourseCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCourse: CourseRow | null;
  onSaved: () => void;
}

export const CourseCurriculumModal: React.FC<CourseCurriculumModalProps> = ({
  isOpen,
  onClose,
  editingCourse,
  onSaved,
}) => {
  const { token, tenantSlug } = useAuth();

  const [code, setCode] = useState<string>(editingCourse?.code || '');
  const [name, setName] = useState<string>(editingCourse?.name || '');
  const [durationSessions, setDurationSessions] = useState<string>(
    String(editingCourse?.duration_sessions ?? 16)
  );
  const [tuitionFeeVnd, setTuitionFeeVnd] = useState<string>(
    String(editingCourse?.tuition_fee_vnd ?? 12000000)
  );
  const [gradingScale, setGradingScale] = useState<GradingScaleKey>(
    editingCourse?.grading_scale || 'ects_6'
  );
  const [subjects, setSubjects] = useState<CurriculumSubject[]>(
    editingCourse?.subjects_json && editingCourse.subjects_json.length > 0
      ? editingCourse.subjects_json
      : STANDARD_CURRICULUM_PRESETS.mba_exec.subjects
  );
  const [saving, setSaving] = useState<boolean>(false);

  const totalCredits = subjects.reduce((acc, s) => acc + Math.max(1, Number(s.credits || 3)), 0);

  const applyPreset = (presetKey: string) => {
    const p = STANDARD_CURRICULUM_PRESETS[presetKey];
    if (!p) return;
    setGradingScale(p.scale);
    setSubjects(p.subjects.map((s) => ({ ...s })));
    if (!name.trim()) {
      setName(p.label.split('(')[0].trim());
    }
  };

  const addSubjectRow = () => {
    const nextIdx = subjects.length + 1;
    setSubjects((prev) => [
      ...prev,
      {
        code: `SUB-${String(nextIdx).padStart(2, '0')}`,
        name: '',
        credits: 3,
      },
    ]);
  };

  const updateSubjectRow = (idx: number, field: keyof CurriculumSubject, val: string) => {
    setSubjects((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        if (field === 'credits') {
          return { ...item, credits: Math.max(1, Math.round(Number(val || 3))) };
        }
        return { ...item, [field]: val };
      })
    );
  };

  const removeSubjectRow = (idx: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên Chương trình đào tạo');
      return;
    }
    const cleanedSubjects = subjects
      .map((s, idx) => ({
        code: s.code.trim().toUpperCase() || `SUB-${String(idx + 1).padStart(2, '0')}`,
        name: s.name.trim(),
        credits: Math.max(1, Math.round(Number(s.credits || 3))),
      }))
      .filter((s) => s.name.length > 0);

    setSaving(true);
    try {
      const payload = {
        code: code.trim().toUpperCase() || undefined,
        name: name.trim(),
        duration_sessions: Math.max(1, Number(durationSessions || 12)),
        tuition_fee_vnd: Math.max(0, Number(tuitionFeeVnd || 0)),
        grading_scale: gradingScale,
        credits: cleanedSubjects.reduce((acc, s) => acc + s.credits, 0) || 3,
        subjects_json: cleanedSubjects,
      };

      if (editingCourse) {
        await apiRequest(`/education/courses/${editingCourse.id}`, {
          method: 'PATCH',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã cập nhật Khung chương trình & Thang điểm!');
      } else {
        await apiRequest('/education/courses', {
          method: 'POST',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã tạo Chương trình đào tạo mới!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Chương trình đào tạo'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCourse ? 'Cập Nhật Chương Trình & Khung Tín Chỉ' : 'Thiết Kế Chương Trình Đào Tạo & Thang Điểm'}
      width="min(780px, 95vw)"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Quick Preset Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: '#F8FAFF', border: '1px solid #DBEAFE' }}>
          <Sparkles size={15} style={{ color: '#1E40FF' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>Mẫu khung chuẩn:</span>
          {Object.entries(STANDARD_CURRICULUM_PRESETS).map(([k, p]) => (
            <button
              key={k}
              type="button"
              onClick={() => applyPreset(k)}
              className="btn secondary"
              style={{ height: 30, padding: '0 10px', fontSize: '0.74rem', color: '#1E40FF' }}
            >
              {p.label.split('(')[0].trim()}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Mã khóa (VD: MBA-2026)"
            style={{ height: 42, borderRadius: 12, border: '1px solid #CBD5E1', padding: '0 12px' }}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên chương trình đào tạo *"
            style={{ height: 42, borderRadius: 12, border: '1px solid #CBD5E1', padding: '0 12px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <select
            value={gradingScale}
            onChange={(e) => setGradingScale(e.target.value as GradingScaleKey)}
            style={{ height: 42, borderRadius: 12, border: '1px solid #CBD5E1', padding: '0 10px', background: '#FFFFFF' }}
          >
            {GRADING_SCALE_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
          <input
            type="number"
            value={durationSessions}
            onChange={(e) => setDurationSessions(e.target.value)}
            placeholder="Số buổi học"
            style={{ height: 42, borderRadius: 12, border: '1px solid #CBD5E1', padding: '0 12px' }}
          />
          <input
            type="number"
            value={tuitionFeeVnd}
            onChange={(e) => setTuitionFeeVnd(e.target.value)}
            placeholder="Học phí chuẩn (VNĐ)"
            style={{ height: 42, borderRadius: 12, border: '1px solid #CBD5E1', padding: '0 12px' }}
          />
        </div>

        {/* Curriculum Subjects Builder */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={16} style={{ color: '#1E40FF' }} />
            <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>Danh mục Môn học / Học phần</strong>
            <Badge tone="primary">{subjects.length} môn • {totalCredits} tín chỉ</Badge>
          </div>
          <button
            type="button"
            onClick={addSubjectRow}
            className="btn secondary"
            style={{ height: 34, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Plus size={14} /> Thêm Môn học
          </button>
        </div>

        <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
          {subjects.map((sub, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 84px 36px', gap: 8, alignItems: 'center' }}>
              <input
                value={sub.code}
                onChange={(e) => updateSubjectRow(idx, 'code', e.target.value)}
                placeholder="Mã HP"
                style={{ height: 38, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.8rem' }}
              />
              <input
                value={sub.name}
                onChange={(e) => updateSubjectRow(idx, 'name', e.target.value)}
                placeholder="Tên học phần / chuyên đề..."
                style={{ height: 38, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.8rem' }}
              />
              <input
                type="number"
                min={1}
                max={24}
                value={sub.credits}
                onChange={(e) => updateSubjectRow(idx, 'credits', e.target.value)}
                title="Số tín chỉ"
                style={{ height: 38, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '0.8rem' }}
              />
              <button
                type="button"
                onClick={() => removeSubjectRow(idx)}
                style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="btn-inkica-primary"
            style={{ height: 42, padding: '0 1.35rem', borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Save size={15} /> {saving ? 'Đang lưu...' : editingCourse ? 'Lưu Thay Đổi' : 'Tạo Chương Trình'}
          </button>
        </div>
      </div>
    </CustomModal>
  );
};
