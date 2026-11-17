import React, { useMemo, useState } from 'react';
import { BookOpen, CalendarClock, Copy, Eye, GraduationCap, Mail, Pencil, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type {
  AnnouncementTypeKey,
  ClassRow,
  CommChannelKey,
  CourseRow,
  EduInstructorItem,
  EnrollmentRow,
} from './educationTypes';
import { ONE_ON_ONE_SLOTS } from './educationTypes';
import { applyAcademicMergeTags, buildDefaultAcademicTemplate } from './academicCommsTemplates';

export interface BatchAcademicCommsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: AnnouncementTypeKey;
  initialClassId?: string;
  initialEnrollmentId?: string;
  courses: ReadonlyArray<CourseRow>;
  classes: ReadonlyArray<ClassRow>;
  instructors: ReadonlyArray<EduInstructorItem>;
  enrollments: ReadonlyArray<EnrollmentRow>;
  onSent?: () => void;
}

const MERGE_TAGS: ReadonlyArray<string> = [
  '{{student_name}}',
  '{{class_code}}',
  '{{course_name}}',
  '{{subject_name}}',
  '{{instructor_name}}',
  '{{zoom_link}}',
  '{{dom_agent_link}}',
];

export const BatchAcademicCommsModal: React.FC<BatchAcademicCommsModalProps> = ({
  isOpen,
  onClose,
  initialType = 'subject_announcement',
  initialClassId = '',
  initialEnrollmentId = '',
  courses,
  classes,
  instructors,
  enrollments,
  onSent,
}) => {
  const { token, tenantSlug, tenantSettings } = useAuth();
  const academyName =
    typeof tenantSettings?.company_name === 'string' && tenantSettings.company_name.trim()
      ? tenantSettings.company_name.trim()
      : 'Học viện / Trung tâm Đào tạo';

  const [annType, setAnnType] = useState<AnnouncementTypeKey>(initialType);
  const [classIdOverride, setClassIdOverride] = useState<string>('');
  const [enrollmentIdOverride, setEnrollmentIdOverride] = useState<string>('');
  const [lecturerId, setLecturerId] = useState<string>('');
  const [subjectKey, setSubjectKey] = useState<string>('');

  const [zoomLink, setZoomLink] = useState<string>('https://meet.academy.vn/live-cohort');
  const [domAgentLink, setDomAgentLink] = useState<string>('https://workspace.academy.vn/dom-agent');
  const [deadlineStr, setDeadlineStr] = useState<string>('Trước ngày khai giảng 05 ngày');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([ONE_ON_ONE_SLOTS[0], ONE_ON_ONE_SLOTS[2]]);
  const [channels, setChannels] = useState<CommChannelKey[]>(['email', 'workchat']);

  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customHtml, setCustomHtml] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  const selectedClassId = classIdOverride || initialClassId || classes[0]?.id || '';
  const selectedClass = useMemo(() => classes.find((c) => c.id === selectedClassId) || classes[0] || null, [classes, selectedClassId]);
  const selectedCourse = useMemo(() => courses.find((c) => c.id === selectedClass?.course_id) || courses[0] || null, [courses, selectedClass]);
  const courseSubjects = useMemo(
    () =>
      selectedCourse?.subjects_json && selectedCourse.subjects_json.length > 0
        ? selectedCourse.subjects_json
        : [{ code: 'GENERAL', name: selectedCourse?.name || 'Chuyên đề chính khóa', credits: 3 }],
    [selectedCourse]
  );
  const activeSubject = useMemo(() => courseSubjects.find((s) => s.code === subjectKey) || courseSubjects[0], [courseSubjects, subjectKey]);
  const selectedLecturer = useMemo(
    () => instructors.find((i) => i.id === (lecturerId || selectedClass?.instructor_user_id || '')) || instructors[0] || null,
    [instructors, lecturerId, selectedClass]
  );
  const activeEnrollmentId = enrollmentIdOverride || initialEnrollmentId;
  const selectedEnrollment = useMemo(() => enrollments.find((e) => e.id === activeEnrollmentId) || null, [enrollments, activeEnrollmentId]);

  const generated = useMemo(
    () =>
      buildDefaultAcademicTemplate({
        type: annType,
        academyName,
        courseName: selectedCourse?.name || 'Chương trình Đào tạo',
        classCode: selectedClass?.code || 'COHORT-01',
        subjectName: activeSubject?.name || 'Chuyên đề môn học',
        instructorName: selectedLecturer?.full_name || selectedClass?.instructor_name || 'Ban Giảng huấn',
        studentName: selectedEnrollment?.student_name || 'Anh/Chị Học viên',
        zoomLink,
        domAgentLink,
        deadlineStr,
        selectedSlots,
      }),
    [annType, academyName, selectedCourse, selectedClass, activeSubject, selectedLecturer, selectedEnrollment, zoomLink, domAgentLink, deadlineStr, selectedSlots]
  );

  const mergeVars = useMemo<Record<string, string>>(
    () => ({
      student_name: selectedEnrollment?.student_name || 'Anh/Chị Học viên',
      class_code: selectedClass?.code || 'COHORT-01',
      course_name: selectedCourse?.name || 'Chương trình Đào tạo',
      subject_name: activeSubject?.name || 'Chuyên đề môn học',
      instructor_name: selectedLecturer?.full_name || selectedClass?.instructor_name || 'Ban Giảng huấn',
      zoom_link: zoomLink,
      dom_agent_link: domAgentLink,
    }),
    [selectedEnrollment, selectedClass, selectedCourse, activeSubject, selectedLecturer, zoomLink, domAgentLink]
  );

  const effectiveTitle = applyAcademicMergeTags(customTitle.trim() || generated.title, mergeVars);
  const renderedHtml = applyAcademicMergeTags(customHtml.trim() || generated.html, mergeVars);

  const toggleChannel = (ch: CommChannelKey) => {
    setChannels((prev) => (prev.includes(ch) ? (prev.length > 1 ? prev.filter((x) => x !== ch) : prev) : [...prev, ch]));
  };

  const handleCopyZalo = async () => {
    try {
      await navigator.clipboard.writeText(applyAcademicMergeTags(generated.zaloText, mergeVars));
      toast.success('Đã sao chép nội dung tin nhắn Zalo CTSV!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể sao chép vào clipboard'));
    }
  };

  const handleSend = async () => {
    if (sending) return;
    setSending(true);
    try {
      const res = await apiRequest<{ sent_count: number }>('/education/announcements', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          announcement_type: annType,
          course_id: selectedCourse?.id || null,
          class_id: selectedClass?.id || null,
          subject_key: activeSubject?.code || null,
          lecturer_user_id: annType === 'lecturer_invitation' ? selectedLecturer?.id || null : null,
          enrollment_id: annType === 'onboarding' && activeEnrollmentId ? activeEnrollmentId : null,
          title: effectiveTitle,
          content_html: renderedHtml,
          channels,
        },
      });
      toast.success(`Đã phát hành thông báo qua ${channels.join(', ').toUpperCase()} (${res.sent_count} người nhận)!`);
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi thông báo học vụ'));
    } finally {
      setSending(false);
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Truyền Thông Học Vụ Đa Kênh (Thông Báo Môn • Mời Giảng 1-on-1 • Onboarding)" width="min(980px, 96vw)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <PillTabs<AnnouncementTypeKey>
            activeKey={annType}
            onChange={(next) => { setAnnType(next); setCustomTitle(''); setCustomHtml(''); }}
            tabs={[
              { key: 'subject_announcement', label: 'Thông báo Chuyên đề Lớp', icon: <BookOpen size={14} /> },
              { key: 'lecturer_invitation', label: 'Thư Mời Giảng & Lịch 1-on-1', icon: <CalendarClock size={14} /> },
              { key: 'onboarding', label: 'Email Nhập học Tân Học viên', icon: <GraduationCap size={14} /> },
            ]}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['email', 'zns', 'workchat'] as const).map((ch) => {
              const active = channels.includes(ch);
              return (
                <button key={ch} type="button" onClick={() => toggleChannel(ch)} style={{ height: 34, padding: '0 12px', borderRadius: 999, border: active ? '1.5px solid #1E40FF' : '1px solid #CBD5E1', background: active ? '#EEF2FF' : '#FFFFFF', color: active ? '#1E40FF' : '#475569', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>
                  {ch === 'email' ? 'Email HTML' : ch === 'zns' ? 'Zalo ZNS' : 'WorkChat Nội bộ'}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, padding: 12, borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
          <select value={selectedClassId} onChange={(e) => setClassIdOverride(e.target.value)} style={{ height: 40, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 10px', background: '#FFFFFF' }}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name} ({c.enrolled_count} HV)</option>)}
          </select>
          <select value={activeSubject?.code || ''} onChange={(e) => setSubjectKey(e.target.value)} style={{ height: 40, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 10px', background: '#FFFFFF' }}>
            {courseSubjects.map((s) => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
          </select>
          {annType === 'lecturer_invitation' && (
            <select value={selectedLecturer?.id || ''} onChange={(e) => setLecturerId(e.target.value)} style={{ height: 40, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 10px', background: '#FFFFFF' }}>
              {instructors.map((inst) => <option key={inst.id} value={inst.id}>{inst.full_name} ({inst.email})</option>)}
            </select>
          )}
          {annType === 'onboarding' && (
            <select value={activeEnrollmentId} onChange={(e) => setEnrollmentIdOverride(e.target.value)} style={{ height: 40, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 10px', background: '#FFFFFF' }}>
              <option value="">Toàn bộ học viên lớp ({selectedClass?.enrolled_count ?? 0} HV)</option>
              {enrollments.filter((en) => !selectedClassId || en.class_id === selectedClassId).map((en) => (
                <option key={en.id} value={en.id}>{en.student_name} ({en.class_code})</option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <input value={zoomLink} onChange={(e) => setZoomLink(e.target.value)} placeholder="Link phòng học trực tuyến..." style={{ height: 40, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px' }} />
          <input value={domAgentLink} onChange={(e) => setDomAgentLink(e.target.value)} placeholder="Link Trợ lý DOM Agent..." style={{ height: 40, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px' }} />
          {annType === 'lecturer_invitation' && (
            <input value={deadlineStr} onChange={(e) => setDeadlineStr(e.target.value)} placeholder="Hạn nộp Đề cương (Teaching Plan)..." style={{ height: 40, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px' }} />
          )}
        </div>

        {annType === 'lecturer_invitation' && (
          <div style={{ padding: '10px 12px', borderRadius: 12, background: '#F8FAFF', border: '1px solid #DBEAFE', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1E40FF', marginRight: 4 }}>Slot 1-on-1 (30p):</span>
            {ONE_ON_ONE_SLOTS.map((slot) => {
              const on = selectedSlots.includes(slot);
              return (
                <button key={slot} type="button" onClick={() => setSelectedSlots((p) => (p.includes(slot) ? p.filter((s) => s !== slot) : [...p, slot]))} style={{ padding: '4px 10px', borderRadius: 8, border: on ? '1px solid #1E40FF' : '1px solid #CBD5E1', background: on ? '#1E40FF' : '#FFFFFF', color: on ? '#FFFFFF' : '#334155', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}>
                  {slot}
                </button>
              );
            })}
          </div>
        )}

        <input value={customTitle || generated.title} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Tiêu đề thông báo / email..." style={{ height: 42, borderRadius: 12, border: '1px solid #CBD5E1', padding: '0 12px', fontWeight: 700, color: '#0F172A' }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Merge tags:</span>
            {MERGE_TAGS.map((tok) => (
              <button key={tok} type="button" onClick={() => { setViewMode('html'); setCustomHtml((prev) => `${prev || generated.html}\n${tok}`); }} style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid #DBEAFE', background: '#EEF2FF', color: '#1E40FF', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                {tok}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => setViewMode(viewMode === 'preview' ? 'html' : 'preview')} className="btn secondary" style={{ height: 34, fontSize: '0.78rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {viewMode === 'preview' ? <><Pencil size={13} /> Sửa HTML</> : <><Eye size={13} /> Xem Trước</>}
            </button>
            <button type="button" onClick={() => void handleCopyZalo()} className="btn secondary" style={{ height: 34, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Copy size={13} /> Copy Mẫu Zalo
            </button>
          </div>
        </div>

        {viewMode === 'html' ? (
          <textarea rows={8} value={customHtml || generated.html} onChange={(e) => setCustomHtml(e.target.value)} style={{ width: '100%', borderRadius: 12, border: '1px solid #CBD5E1', padding: 12, fontSize: '0.8rem', fontFamily: 'monospace' }} />
        ) : (
          <div style={{ maxHeight: 280, overflowY: 'auto', padding: 14, borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0' }} dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Badge tone="info" icon={<Mail size={13} />}>Tự động giải quyết người nhận & ghi nhận sent_count</Badge>
          <button type="button" disabled={sending} onClick={() => void handleSend()} className="btn-inkica-primary" style={{ height: 42, padding: '0 1.35rem', borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Send size={15} /> {sending ? 'Đang phát hành...' : 'Gửi & Lưu Nhật Ký Học Vụ'}
          </button>
        </div>
      </div>
    </CustomModal>
  );
};
