import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Download, FileSpreadsheet, Save, Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { Badge, EmptyState, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type {
  ClassRow,
  CurriculumSubject,
  EditableGradeCell,
  GradebookMatrixPayload,
  GradingScaleKey,
  MatrixStudentItem,
  ParsedGradeImportRow,
} from './educationTypes';
import { GRADING_SCALE_OPTIONS } from './educationTypes';
import { convertGradeByScale, downloadGradebookCsvTemplate } from './gradingScaleUtils';
import { GradebookImportTab } from './GradebookImportTab';

export interface ClassGradebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClassId?: string;
  initialMode?: 'grid' | 'import';
  classesList: ReadonlyArray<ClassRow>;
  onSaved?: () => void;
}

type ModalTabMode = 'grid' | 'import';

export const ClassGradebookModal: React.FC<ClassGradebookModalProps> = ({
  isOpen,
  onClose,
  initialClassId = '',
  initialMode = 'grid',
  classesList,
  onSaved,
}) => {
  const { token, tenantSlug } = useAuth();
  const [classOverrideId, setClassOverrideId] = useState<string>('');
  const activeClassId = classOverrideId || initialClassId || classesList[0]?.id || '';

  const [mode, setMode] = useState<ModalTabMode>(initialMode);
  const [loadedClassId, setLoadedClassId] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [gradingScale, setGradingScale] = useState<GradingScaleKey>('scale_10');
  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string>('');
  const [students, setStudents] = useState<MatrixStudentItem[]>([]);
  const [cells, setCells] = useState<Record<string, Record<string, EditableGradeCell>>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());

  const [importText, setImportText] = useState<string>('');
  const [importRows, setImportRows] = useState<ParsedGradeImportRow[]>([]);

  const applyMatrixPayload = useCallback((data: GradebookMatrixPayload) => {
    setGradingScale(data.grading_scale || 'scale_10');
    const subs = data.subjects.length > 0 ? data.subjects : [{ code: 'GENERAL', name: 'Tổng kết khóa học', credits: 3 }];
    setSubjects(subs);
    setSelectedSubjectKey((prev) => (prev === 'ALL' || subs.some((s) => s.code === prev) ? prev : subs[0].code));
    setStudents(data.students);

    const nextCells: Record<string, Record<string, EditableGradeCell>> = {};
    for (const st of data.students) {
      nextCells[st.id] = {};
      const stuMap = data.matrix[st.id] || {};
      for (const sub of subs) {
        const g = stuMap[sub.code];
        nextCells[st.id][sub.code] = {
          attendance_score: g?.attendance_score != null ? String(g.attendance_score) : '',
          assignment_score: g?.assignment_score != null ? String(g.assignment_score) : '',
          midterm_score: g?.midterm_score != null ? String(g.midterm_score) : '',
          final_score: g?.final_score != null ? String(g.final_score) : '',
          feedback: g?.feedback || '',
        };
      }
    }
    setCells(nextCells);
    setDirtyKeys(new Set());
  }, []);

  useEffect(() => {
    if (!isOpen || !activeClassId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRequest<GradebookMatrixPayload>(`/education/classes/${activeClassId}/gradebook-matrix`, { token, tenantSlug });
        if (!cancelled) {
          applyMatrixPayload(data);
          setLoadedClassId(activeClassId);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(getErrorMessage(err, 'Không thể tải Ma trận Bảng điểm lớp'));
          setLoadedClassId(activeClassId);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, activeClassId, token, tenantSlug, applyMatrixPayload]);

  const isMatrixLoading = Boolean(isOpen && activeClassId && loadedClassId !== activeClassId);
  const activeSubject = useMemo<CurriculumSubject>(
    () => subjects.find((s) => s.code === selectedSubjectKey) || subjects[0] || { code: 'GENERAL', name: 'Tổng kết', credits: 3 },
    [subjects, selectedSubjectKey]
  );

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.student_name.toLowerCase().includes(q) || (s.student_email || '').toLowerCase().includes(q) || (s.student_phone || '').toLowerCase().includes(q));
  }, [students, searchQuery]);

  const updateCell = (studentId: string, subCode: string, field: keyof EditableGradeCell, val: string) => {
    setCells((prev) => {
      const stuRow = { ...(prev[studentId] || {}) };
      const cur = stuRow[subCode] || { attendance_score: '', assignment_score: '', midterm_score: '', final_score: '', feedback: '' };
      stuRow[subCode] = { ...cur, [field]: val };
      return { ...prev, [studentId]: stuRow };
    });
    setDirtyKeys((prev) => new Set(prev).add(`${studentId}::${subCode}`));
  };

  const handleSaveMatrix = async () => {
    if (!activeClassId || saving) return;
    setSaving(true);
    try {
      const rows = students.map((st) => {
        if (selectedSubjectKey === 'ALL') return { enrollment_id: st.id, grades: cells[st.id] || {} };
        const c = cells[st.id]?.[activeSubject.code];
        return {
          enrollment_id: st.id,
          subject_key: activeSubject.code,
          subject_name: activeSubject.name,
          attendance_score: c?.attendance_score || null,
          assignment_score: c?.assignment_score || null,
          midterm_score: c?.midterm_score || null,
          final_score: c?.final_score || null,
          feedback: c?.feedback || null,
        };
      });
      await apiRequest(`/education/classes/${activeClassId}/gradebook-batch`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { subject_key: activeSubject.code, subject_name: activeSubject.name, grading_scale: gradingScale, rows },
      });
      toast.success('Đã lưu Ma trận Bảng điểm & quy đổi thang điểm thành công!');
      const fresh = await apiRequest<GradebookMatrixPayload>(`/education/classes/${activeClassId}/gradebook-matrix`, { token, tenantSlug });
      applyMatrixPayload(fresh);
      onSaved?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu bảng điểm lớp'));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!activeClassId || importRows.length === 0 || saving) return;
    setSaving(true);
    try {
      const res = await apiRequest<{ total_processed: number }>(`/education/classes/${activeClassId}/gradebook-batch`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          subject_key: activeSubject.code,
          subject_name: activeSubject.name,
          grading_scale: gradingScale,
          rows: importRows.map((r) => ({
            enrollment_id: r.enrollment_id,
            student_name: r.student_name,
            student_email: r.student_email || undefined,
            student_phone: r.student_phone || undefined,
            attendance_score: r.attendance_score || null,
            assignment_score: r.assignment_score || null,
            midterm_score: r.midterm_score || null,
            final_score: r.final_score || null,
            feedback: r.feedback || null,
          })),
        },
      });
      toast.success(`Đã import ${res.total_processed} bản ghi điểm vào môn ${activeSubject.code}!`);
      setImportRows([]);
      setImportText('');
      setMode('grid');
      const fresh = await apiRequest<GradebookMatrixPayload>(`/education/classes/${activeClassId}/gradebook-matrix`, { token, tenantSlug });
      applyMatrixPayload(fresh);
      onSaved?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Import bảng điểm thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const activeScaleMeta = GRADING_SCALE_OPTIONS.find((o) => o.key === gradingScale) || GRADING_SCALE_OPTIONS[0];
  const currentClassCode = classesList.find((c) => c.id === activeClassId)?.code || 'CLASS';

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Ma Trận Bảng Điểm Lớp & Import Excel / CSV Hàng Loạt" width="min(1160px, 96vw)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <PillTabs<ModalTabMode>
            activeKey={mode}
            onChange={setMode}
            tabs={[
              { key: 'grid', label: 'Ma trận Điểm Học viên', icon: <Users size={14} />, count: students.length },
              { key: 'import', label: 'Import Excel (.xlsx/.csv) / Dán TSV', icon: <FileSpreadsheet size={14} />, count: importRows.length },
            ]}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {dirtyKeys.size > 0 && <Badge tone="warning">{dirtyKeys.size} ô thay đổi chưa lưu</Badge>}
            <Badge tone="primary" icon={<Award size={13} />}>{activeScaleMeta.shortLabel}</Badge>
            <button
              type="button"
              onClick={() => {
                const cellsForSub: Record<string, EditableGradeCell | undefined> = {};
                students.forEach((st) => { cellsForSub[st.id] = cells[st.id]?.[activeSubject.code]; });
                downloadGradebookCsvTemplate({ classCode: currentClassCode, subject: activeSubject, scale: gradingScale, students, cellsByStudent: cellsForSub });
                toast.success('Đã tải file mẫu CSV theo danh sách lớp!');
              }}
              className="btn secondary"
              style={{ height: 38, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} /> Tải Mẫu CSV
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: 10, padding: 12, borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
          <select value={activeClassId} onChange={(e) => setClassOverrideId(e.target.value)} style={{ height: 40, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 10px', background: '#FFFFFF' }}>
            {classesList.map((cl) => <option key={cl.id} value={cl.id}>{cl.code} — {cl.name}</option>)}
          </select>
          <select value={selectedSubjectKey} onChange={(e) => setSelectedSubjectKey(e.target.value)} style={{ height: 40, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 10px', background: '#FFFFFF' }}>
            {subjects.map((sub) => <option key={sub.code} value={sub.code}>{sub.code} — {sub.name} ({sub.credits} TC)</option>)}
            {subjects.length > 1 && <option value="ALL">Tất cả môn học ({subjects.length} môn)</option>}
          </select>
          <select value={gradingScale} onChange={(e) => setGradingScale(e.target.value as GradingScaleKey)} style={{ height: 40, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 10px', background: '#FFFFFF' }}>
            {GRADING_SCALE_OPTIONS.map((opt) => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
          </select>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: 13, color: '#64748B' }} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm tên, email, SĐT..." style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 10px 0 32px', background: '#FFFFFF' }} />
          </div>
        </div>

        <div style={{ fontSize: '0.76rem', color: '#475569', padding: '6px 12px', borderRadius: 10, background: '#EEF2FF', border: '1px solid #DBEAFE' }}>
          Chuẩn quy đổi đang bật (<strong>{activeScaleMeta.shortLabel}</strong>): {activeScaleMeta.passingHint}
        </div>

        {isMatrixLoading ? (
          <ModalBodySkeleton rows={5} />
        ) : mode === 'import' ? (
          <GradebookImportTab
            activeSubject={activeSubject}
            gradingScale={gradingScale}
            scaleShortLabel={activeScaleMeta.shortLabel}
            students={students}
            importText={importText}
            importRows={importRows}
            saving={saving}
            onChangeText={(txt, rows) => { setImportText(txt); setImportRows(rows); }}
            onLoadedRows={setImportRows}
            onConfirmImport={() => void handleConfirmImport()}
          />
        ) : filteredStudents.length === 0 ? (
          <EmptyState title="Chưa có học viên trong lớp này" description="Ghi danh học viên hoặc chuyển sang tab Import Excel để tự động ghi danh kèm điểm số." />
        ) : (
          <>
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 14, background: '#FFFFFF' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Học viên</th>
                    {selectedSubjectKey === 'ALL' ? (
                      subjects.map((s) => <th key={s.code} style={{ padding: '10px 8px', minWidth: 125 }}>{s.code}<div style={{ fontSize: '0.68rem', fontWeight: 500 }}>{s.name}</div></th>)
                    ) : (
                      <>
                        <th style={{ padding: '10px 8px', width: 90 }}>Chuyên cần</th>
                        <th style={{ padding: '10px 8px', width: 90 }}>Bài tập</th>
                        <th style={{ padding: '10px 8px', width: 90 }}>Giữa kỳ</th>
                        <th style={{ padding: '10px 8px', width: 94 }}>Cuối kỳ</th>
                        <th style={{ padding: '10px 8px', width: 175 }}>Quy đổi (ECTS / GPA / 10)</th>
                        <th style={{ padding: '10px 8px', width: 95 }}>Xếp loại</th>
                        <th style={{ padding: '10px 12px' }}>Nhận xét</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st) => {
                    const sc = cells[st.id]?.[activeSubject.code] || { attendance_score: '', assignment_score: '', midterm_score: '', final_score: '', feedback: '' };
                    const conv = convertGradeByScale({ scale: gradingScale, attendanceScore: sc.attendance_score, assignmentScore: sc.assignment_score, midtermScore: sc.midterm_score, finalScore: sc.final_score });
                    return (
                      <tr key={st.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{st.student_name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{st.student_email || st.student_phone || '—'}</div>
                        </td>
                        {selectedSubjectKey === 'ALL' ? (
                          subjects.map((sub) => {
                            const mc = cells[st.id]?.[sub.code];
                            const mConv = convertGradeByScale({ scale: gradingScale, finalScore: mc?.final_score });
                            return (
                              <td key={sub.code} style={{ padding: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <input type="number" step="0.05" value={mc?.final_score || ''} onChange={(e) => updateCell(st.id, sub.code, 'final_score', e.target.value)} placeholder="Điểm" style={{ width: 68, height: 34, borderRadius: 8, border: '1px solid #CBD5E1', padding: '0 6px' }} />
                                  {mConv.hasScore && <Badge tone={mConv.passStatus === 'passed' ? 'success' : 'danger'}>{mConv.letter}</Badge>}
                                </div>
                              </td>
                            );
                          })
                        ) : (
                          <>
                            {(['attendance_score', 'assignment_score', 'midterm_score', 'final_score'] as const).map((fKey) => (
                              <td key={fKey} style={{ padding: '8px' }}>
                                <input type="number" step="0.05" value={sc[fKey]} onChange={(e) => updateCell(st.id, activeSubject.code, fKey, e.target.value)} style={{ width: 76, height: 34, borderRadius: 8, border: '1px solid #CBD5E1', padding: '0 8px' }} />
                              </td>
                            ))}
                            <td style={{ padding: '8px', fontSize: '0.74rem', color: '#334155' }}>
                              {conv.hasScore ? <span>ECTS <strong>{conv.ects6}</strong> • GPA <strong>{conv.gpa4}</strong> • Hệ 10: <strong>{conv.scale10}</strong></span> : '—'}
                            </td>
                            <td style={{ padding: '8px' }}>
                              <Badge tone={conv.passStatus === 'passed' ? 'success' : conv.passStatus === 'failed' ? 'danger' : 'neutral'}>{conv.letterLabel}</Badge>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input value={sc.feedback} onChange={(e) => updateCell(st.id, activeSubject.code, 'feedback', e.target.value)} placeholder="Nhận xét..." style={{ width: '100%', minWidth: 120, height: 34, borderRadius: 8, border: '1px solid #CBD5E1', padding: '0 8px' }} />
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" disabled={saving} onClick={handleSaveMatrix} className="btn-inkica-primary" style={{ height: 42, padding: '0 1.25rem', borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Save size={15} /> {saving ? 'Đang lưu sổ điểm...' : 'Lưu Bảng Điểm Lớp'}
              </button>
            </div>
          </>
        )}
      </div>
    </CustomModal>
  );
};
