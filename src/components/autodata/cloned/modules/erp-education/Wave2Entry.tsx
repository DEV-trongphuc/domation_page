import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  EmptyState,
  FormCard,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import {
  apiRequest,
  formatShortDate,
  formatVnd,
  getErrorMessage,
} from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';

type EduTabKey = 'courses_classes' | 'timetable' | 'enrollments' | 'gradebook';

interface EduOverviewPayload {
  summary: {
    courses_count: number;
    total_classes: number;
    active_classes: number;
    students_count: number;
    tuition_collected_vnd: number;
    weekly_slots_count: number;
  };
  instructors: Array<{ id: string; full_name: string; email: string; role: string }>;
  leads: Array<{ id: string; name: string; phone?: string | null; email?: string | null }>;
}

interface CourseRow {
  id: string;
  code: string;
  name: string;
  category: string;
  duration_sessions: number;
  tuition_fee_vnd: number;
  classes_count: number;
}

interface ClassRow {
  id: string;
  course_id: string;
  course_name: string;
  code: string;
  name: string;
  instructor_name?: string | null;
  room_name?: string | null;
  max_capacity: number;
  enrolled_count: number;
  status: string;
}

interface ScheduleRow {
  id: string;
  class_id: string;
  class_code: string;
  class_name: string;
  course_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_name: string;
  instructor_name?: string | null;
  topic?: string | null;
}

interface EnrollmentRow {
  id: string;
  class_id: string;
  class_code: string;
  class_name: string;
  lead_id?: string | null;
  student_name: string;
  student_phone?: string | null;
  student_email?: string | null;
  status: string;
  tuition_paid_vnd: number;
  enrolled_at: string;
}

interface GradebookRow {
  id: string;
  enrollment_id: string;
  student_name: string;
  class_code: string;
  session_date: string;
  attendance_status: string;
  midterm_score: number | null;
  final_score: number | null;
  gpa_score: number | null;
  feedback?: string | null;
}

const DAY_LABELS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export const ErpEducationWave2Entry: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { hasModule, switchPackage, isTenantOwner, packageMeta, scope, can } = useEntitlement();

  const isEntitled = hasModule('education_addon');
  const canCreate = can('education_addon', 'create');
  const canDelete = can('education_addon', 'delete');

  const [activeTab, setActiveTab] = useState<EduTabKey>('courses_classes');
  const [loading, setLoading] = useState(false);

  const [overview, setOverview] = useState<EduOverviewPayload | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [grades, setGrades] = useState<GradebookRow[]>([]);

  // Course & Class Modals
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseSessions, setCourseSessions] = useState('16');
  const [courseTuition, setCourseTuition] = useState('12000000');

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [clsCourseId, setClsCourseId] = useState('');
  const [clsName, setClsName] = useState('');
  const [clsInstructorId, setClsInstructorId] = useState('');
  const [clsRoom, setClsRoom] = useState('Phòng 201');
  const [clsCapacity, setClsCapacity] = useState('30');

  // Timetable + Conflict Checker Form
  const [schClassId, setSchClassId] = useState('');
  const [schDay, setSchDay] = useState('1');
  const [schStart, setSchStart] = useState('18:30');
  const [schEnd, setSchEnd] = useState('20:30');
  const [schRoom, setSchRoom] = useState('Phòng 201');
  const [schInstructorId, setSchInstructorId] = useState('');
  const [conflictPreview, setConflictPreview] = useState<{
    checked: boolean;
    has_conflict: boolean;
    messages: string[];
  } | null>(null);

  // Enrollment & Gradebook Modals
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrClassId, setEnrClassId] = useState('');
  const [enrLeadId, setEnrLeadId] = useState('');
  const [enrStudentName, setEnrStudentName] = useState('');
  const [enrTuition, setEnrTuition] = useState('12000000');

  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [grEnrollmentId, setGrEnrollmentId] = useState('');
  const [grAttendance, setGrAttendance] = useState('present');
  const [grMidterm, setGrMidterm] = useState('8.5');
  const [grFinal, setGrFinal] = useState('9.0');
  const [grFeedback, setGrFeedback] = useState('');

  const fetchAll = useCallback(async () => {
    const [ov, crs, cls, sch, enr, grd] = await Promise.all([
      apiRequest<EduOverviewPayload>('/education/overview', { token, tenantSlug }),
      apiRequest<{ items: CourseRow[] }>('/education/courses', { token, tenantSlug }),
      apiRequest<{ items: ClassRow[] }>('/education/classes', { token, tenantSlug }),
      apiRequest<{ items: ScheduleRow[] }>('/education/schedules', { token, tenantSlug }),
      apiRequest<{ items: EnrollmentRow[] }>('/education/enrollments', { token, tenantSlug }),
      apiRequest<{ items: GradebookRow[] }>('/education/gradebook', { token, tenantSlug }),
    ]);
    return {
      ov,
      crs: crs.items || [],
      cls: cls.items || [],
      sch: sch.items || [],
      enr: enr.items || [],
      grd: grd.items || [],
    };
  }, [token, tenantSlug]);

  const applyBundle = useCallback((b: Awaited<ReturnType<typeof fetchAll>>) => {
    setOverview(b.ov);
    setCourses(b.crs);
    setClasses(b.cls);
    setSchedules(b.sch);
    setEnrollments(b.enr);
    setGrades(b.grd);
    if (b.crs[0]) setClsCourseId((prev) => prev || b.crs[0].id);
    if (b.cls[0]) {
      setSchClassId((prev) => prev || b.cls[0].id);
      setEnrClassId((prev) => prev || b.cls[0].id);
    }
    if (b.enr[0]) setGrEnrollmentId((prev) => prev || b.enr[0].id);
  }, []);

  useEffect(() => {
    if (!isEntitled) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const bundle = await fetchAll();
        if (!cancelled) applyBundle(bundle);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải phân hệ Đào tạo & Học vụ'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEntitled, fetchAll, applyBundle]);

  const reloadAll = useCallback(async () => {
    if (!isEntitled) return;
    setLoading(true);
    try {
      const bundle = await fetchAll();
      applyBundle(bundle);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Làm mới dữ liệu thất bại'));
    } finally {
      setLoading(false);
    }
  }, [isEntitled, fetchAll, applyBundle]);

  // Strict Frontend Entitlement Gate when `hasModule('education_addon')` is false
  if (!isEntitled) {
    return (
      <Card
        padding="2.25rem 1.75rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)', textAlign: 'center' }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            margin: '0 auto 1rem',
            borderRadius: 18,
            background: '#EEF2FF',
            color: '#1E40FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Lock size={28} />
        </div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
          Phân Hệ Chuyên Ngành Đào Tạo & Học Vụ (Education Vertical Add-on)
        </h2>
        <p style={{ fontSize: '0.86rem', color: '#64748B', maxWidth: 560, margin: '0 auto 1.25rem', lineHeight: 1.55 }}>
          Theo kiến trúc đa ngành tinh gọn, các tính năng Chương trình học, Lớp/Khóa, Thời khóa biểu kiểm tra trùng Phòng & Giảng viên, Điểm danh và Sổ điểm được đóng gói riêng trong <strong>Education Add-on</strong> để không làm rối các doanh nghiệp thương mại / BĐS / sản xuất.
        </p>
        {isTenantOwner && (
          <button
            type="button"
            onClick={() => void switchPackage('domation_promax', { educationAddon: true, industryKey: 'education' })}
            className="btn-inkica-primary"
            style={{
              height: 44,
              padding: '0 1.35rem',
              borderRadius: 14,
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Kích Hoạt Ngay Education Add-on (0 Giây Migrate)
          </button>
        )}
      </Card>
    );
  }

  if (loading && !overview) {
    return <AutoDataLoadingModal inline isOpen message="Đang đồng bộ Phân hệ Đào tạo & Học vụ..." />;
  }

  const handleCreateCourse = async () => {
    if (!courseName.trim()) return;
    try {
      await apiRequest('/education/courses', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: courseName.trim(),
          duration_sessions: Number(courseSessions || 12),
          tuition_fee_vnd: Number(courseTuition || 0),
        },
      });
      toast.success('Đã tạo Chương trình đào tạo');
      setCourseName('');
      setCourseModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Khóa học'));
    }
  };

  const handleCreateClass = async () => {
    if (!clsCourseId || !clsName.trim()) return;
    try {
      await apiRequest('/education/classes', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          course_id: clsCourseId,
          name: clsName.trim(),
          instructor_user_id: clsInstructorId || null,
          room_name: clsRoom.trim(),
          max_capacity: Number(clsCapacity || 30),
        },
      });
      toast.success('Đã mở Lớp học mới');
      setClsName('');
      setClassModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể mở Lớp học'));
    }
  };

  const handleCheckTimetableConflict = async () => {
    try {
      const res = await apiRequest<{
        has_conflict: boolean;
        conflicts: Array<{ detail: string }>;
      }>('/education/schedules/check-conflict', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          day_of_week: Number(schDay),
          start_time: schStart,
          end_time: schEnd,
          room_name: schRoom.trim(),
          instructor_user_id: schInstructorId || null,
        },
      });
      setConflictPreview({
        checked: true,
        has_conflict: res.has_conflict,
        messages: res.conflicts.map((c) => c.detail),
      });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể kiểm tra lịch trùng'));
    }
  };

  const handleCreateSchedule = async () => {
    if (!schClassId || !schRoom.trim()) {
      toast.error('Vui lòng chọn Lớp học và Phòng học');
      return;
    }
    try {
      await apiRequest('/education/schedules', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          class_id: schClassId,
          day_of_week: Number(schDay),
          start_time: schStart,
          end_time: schEnd,
          room_name: schRoom.trim(),
          instructor_user_id: schInstructorId || null,
        },
      });
      toast.success('Đã xếp ca học vào Thời khóa biểu tuần');
      setConflictPreview(null);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Trùng phòng học hoặc trùng lịch giảng viên!'));
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await apiRequest(`/education/schedules/${id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã xóa ca học');
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa ca học'));
    }
  };

  const handleEnrollStudent = async () => {
    if (!enrClassId) return;
    try {
      await apiRequest('/education/enrollments', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          class_id: enrClassId,
          lead_id: enrLeadId || null,
          student_name: enrStudentName.trim() || undefined,
          tuition_paid_vnd: Number(enrTuition || 0),
        },
      });
      toast.success('Đã ghi danh Học viên & đồng bộ Học phí vào Hồ sơ 360°');
      setEnrStudentName('');
      setEnrollModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ghi danh Học viên'));
    }
  };

  const handleRecordGrade = async () => {
    if (!grEnrollmentId) return;
    try {
      await apiRequest('/education/gradebook', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          enrollment_id: grEnrollmentId,
          attendance_status: grAttendance,
          midterm_score: Number(grMidterm),
          final_score: Number(grFinal),
          feedback: grFeedback.trim() || undefined,
        },
      });
      toast.success('Đã lưu Điểm danh & Bảng điểm GPA');
      setGrFeedback('');
      setGradeModalOpen(false);
      await reloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu điểm số'));
    }
  };

  const enrollColumns: ReadonlyArray<TableColumn<EnrollmentRow>> = [
    { key: 'student', header: 'Học viên', render: (r) => <strong>{r.student_name}</strong> },
    { key: 'contact', header: 'Liên hệ (PII Safe)', render: (r) => r.student_phone || r.student_email || '—' },
    { key: 'cls', header: 'Lớp theo học', render: (r) => `${r.class_code} — ${r.class_name}` },
    { key: 'fee', header: 'Học phí đã đóng', numeric: true, render: (r) => formatVnd(r.tuition_paid_vnd) },
    { key: 'status', header: 'Trạng thái', render: (r) => <Badge tone="success">{r.status}</Badge> },
    { key: 'date', header: 'Ngày nhập học', render: (r) => formatShortDate(r.enrolled_at) },
  ];

  const gradeColumns: ReadonlyArray<TableColumn<GradebookRow>> = [
    { key: 'stu', header: 'Học viên', render: (r) => <strong>{r.student_name}</strong> },
    { key: 'cls', header: 'Mã Lớp', render: (r) => r.class_code },
    {
      key: 'att',
      header: 'Chuyên cần',
      render: (r) => (
        <Badge tone={r.attendance_status === 'present' ? 'success' : r.attendance_status === 'absent' ? 'danger' : 'warning'}>
          {r.attendance_status}
        </Badge>
      ),
    },
    { key: 'mid', header: 'Giữa kỳ (40%)', numeric: true, render: (r) => r.midterm_score ?? '—' },
    { key: 'fin', header: 'Cuối kỳ (60%)', numeric: true, render: (r) => r.final_score ?? '—' },
    {
      key: 'gpa',
      header: 'Điểm Tổng Kết',
      numeric: true,
      render: (r) => <Badge tone="primary">{r.gpa_score ?? '—'}</Badge>,
    },
    { key: 'fb', header: 'Nhận xét giảng viên', render: (r) => r.feedback || '—' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <Card
        padding="1.25rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: '#EEF2FF',
                border: '1px solid #DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1E40FF',
              }}
            >
              <GraduationCap size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Đào Tạo & Quản Lý Học Vụ (Education Vertical Add-on)
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="purple">Education Add-on Active</Badge>
                <Badge tone="info">Scope: {scope('education_addon')}</Badge>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
                Quản lý Chương trình, Lớp học, Kiểm tra xung đột Thời khóa biểu Phòng / Giảng viên, Ghi danh CRM & Bảng điểm
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" onClick={reloadAll} className="btn secondary" style={{ height: 44 }}>
              <RefreshCw size={15} />
            </button>
            <ScreenHelpButton screenKey="erp_education" />
          </div>
        </div>
      </Card>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.9rem' }}>
        <FormCard
          icon={<BookOpen size={18} />}
          title={`${overview?.summary.courses_count ?? 0} Chương trình`}
          description={`${overview?.summary.active_classes ?? 0} lớp đang tuyển sinh & giảng dạy`}
          badge={<Badge tone="primary">Programs</Badge>}
        />
        <FormCard
          icon={<Users size={18} />}
          title={`${overview?.summary.students_count ?? 0} Học viên`}
          description={`Thực thu học phí: ${formatVnd(overview?.summary.tuition_collected_vnd ?? 0)}`}
          badge={<Badge tone="success">Enrolled</Badge>}
        />
        <FormCard
          icon={<CalendarClock size={18} />}
          title={`${overview?.summary.weekly_slots_count ?? 0} Ca học / tuần`}
          description="Chống trùng phòng & trùng lịch giảng viên tự động"
          badge={<Badge tone="info">Conflict Safe</Badge>}
        />
      </div>

      {/* Navigation Tabs */}
      <PillTabs<EduTabKey>
        activeKey={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'courses_classes', label: 'Chương Trình & Lớp Học', icon: <BookOpen size={15} />, count: classes.length },
          { key: 'timetable', label: 'Thời Khóa Biểu & Chống Trùng Lịch', icon: <CalendarClock size={15} />, count: schedules.length },
          { key: 'enrollments', label: 'Học Viên Ghi Danh (Liên kết CRM)', icon: <UserPlus size={15} />, count: enrollments.length },
          { key: 'gradebook', label: 'Điểm Danh & Bảng Điểm GPA', icon: <Award size={15} />, count: grades.length },
        ]}
      />

      {/* TAB 1: COURSES & CLASSES */}
      {activeTab === 'courses_classes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
          <Card
            title="Danh Mục Chương Trình / Khóa Học"
            actions={
              canCreate && (
                <button type="button" onClick={() => setCourseModalOpen(true)} className="btn secondary" style={{ height: 38, color: '#1E40FF' }}>
                  + Tạo Khóa học
                </button>
              )
            }
          >
            {courses.length === 0 ? (
              <EmptyState title="Chưa có chương trình đào tạo" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {courses.map((c) => (
                  <FormCard
                    key={c.id}
                    icon={<BookOpen size={18} />}
                    title={`${c.name} (${c.code})`}
                    description={`${c.duration_sessions} buổi • Học phí chuẩn: ${formatVnd(c.tuition_fee_vnd)}`}
                    badge={<Badge tone="info">{c.classes_count} lớp</Badge>}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Các Lớp Học / Khóa Khai Giảng (Cohorts)"
            actions={
              canCreate && (
                <button
                  type="button"
                  onClick={() => setClassModalOpen(true)}
                  className="btn-inkica-primary"
                  style={{ height: 38, padding: '0 1rem', borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Mở Lớp mới
                </button>
              )
            }
          >
            {classes.length === 0 ? (
              <EmptyState title="Chưa mở lớp học nào" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {classes.map((cl) => (
                  <FormCard
                    key={cl.id}
                    icon={<GraduationCap size={18} />}
                    title={`${cl.code} — ${cl.name}`}
                    description={`${cl.course_name} • Phòng: ${cl.room_name || '—'} • GV: ${cl.instructor_name || '—'}`}
                    badge={<Badge tone="success">{cl.enrolled_count}/{cl.max_capacity} HV</Badge>}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: TIMETABLE + CONFLICT CHECKER */}
      {activeTab === 'timetable' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
          <Card
            title="Xếp Lịch Giảng Dạy & Kiểm Tra Xung Đột Phòng / Giảng Viên"
            subtitle="Tự động chặn xếp trùng phòng học hoặc trùng ca dạy của cùng 1 giảng viên"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select
                value={schClassId}
                onChange={(e) => setSchClassId(e.target.value)}
                className="form-input"
                style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
              >
                <option value="">-- Chọn Lớp học --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <select
                  value={schDay}
                  onChange={(e) => setSchDay(e.target.value)}
                  className="form-input"
                  style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 10px' }}
                >
                  {DAY_LABELS.map((lbl, idx) => (
                    <option key={lbl} value={idx}>{lbl}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={schStart}
                  onChange={(e) => setSchStart(e.target.value)}
                  className="form-input"
                  style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 10px' }}
                />
                <input
                  type="time"
                  value={schEnd}
                  onChange={(e) => setSchEnd(e.target.value)}
                  className="form-input"
                  style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 10px' }}
                />
              </div>

              <input
                value={schRoom}
                onChange={(e) => setSchRoom(e.target.value)}
                placeholder="Tên Phòng học (VD: Phòng Lab 301)..."
                className="form-input"
                style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
              />

              <select
                value={schInstructorId}
                onChange={(e) => setSchInstructorId(e.target.value)}
                className="form-input"
                style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
              >
                <option value="">-- Giảng viên phụ trách ca (Tùy chọn) --</option>
                {(overview?.instructors || []).map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.full_name}</option>
                ))}
              </select>

              {conflictPreview && (
                <div
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: 12,
                    background: conflictPreview.has_conflict ? '#FEF2F2' : '#F0FDF4',
                    border: `1px solid ${conflictPreview.has_conflict ? '#FECACA' : '#BBF7D0'}`,
                    fontSize: '0.82rem',
                    color: conflictPreview.has_conflict ? '#DC2626' : '#15803D',
                  }}
                >
                  {conflictPreview.has_conflict ? (
                    <>
                      <AlertTriangle size={14} style={{ display: 'inline', marginRight: 5 }} />
                      <strong>Phát hiện xung đột lịch:</strong> {conflictPreview.messages.join(' | ')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 5 }} />
                      Khung giờ & Phòng học hoàn toàn trống, sẵn sàng xếp lịch!
                    </>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleCheckTimetableConflict}
                  className="btn secondary"
                  style={{ height: 44, color: '#1E40FF' }}
                >
                  Kiểm tra trùng lịch
                </button>
                {canCreate && (
                  <button
                    type="button"
                    onClick={handleCreateSchedule}
                    className="btn-inkica-primary"
                    style={{ flex: 1, height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Lưu vào Thời khóa biểu
                  </button>
                )}
              </div>
            </div>
          </Card>

          <Card title="Thời Khóa Biểu Tuần Đang Áp Dụng" subtitle={`${schedules.length} ca học đã xếp`}>
            {schedules.length === 0 ? (
              <EmptyState title="Chưa có lịch học trong tuần" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {schedules.map((sc) => (
                  <div
                    key={sc.id}
                    style={{
                      padding: '0.8rem 1rem',
                      borderRadius: 14,
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A' }}>
                        {DAY_LABELS[sc.day_of_week]} ({sc.start_time} - {sc.end_time}) • {sc.room_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {sc.class_code} — {sc.class_name} {sc.instructor_name ? `• GV: ${sc.instructor_name}` : ''}
                      </div>
                    </div>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSchedule(sc.id)}
                        style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: ENROLLMENTS */}
      {activeTab === 'enrollments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {canCreate && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setEnrollModalOpen(true)}
                className="btn-inkica-primary"
                style={{
                  height: 42,
                  padding: '0 1.1rem',
                  borderRadius: 12,
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus size={16} /> Ghi Danh Học Viên Từ CRM
              </button>
            </div>
          )}
          <Table
            columns={enrollColumns}
            rows={enrollments}
            rowKey={(r) => r.id}
            emptyTitle="Chưa có học viên ghi danh"
            emptyDescription="Ghi danh trực tiếp từ Hồ sơ Khách hàng 360° để liên thông lịch sử tư vấn & thực thu học phí."
          />
        </div>
      )}

      {/* TAB 4: ATTENDANCE & GRADEBOOK */}
      {activeTab === 'gradebook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {canCreate && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setGradeModalOpen(true)}
                className="btn-inkica-primary"
                style={{
                  height: 42,
                  padding: '0 1.1rem',
                  borderRadius: 12,
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus size={16} /> Điểm danh & Nhập điểm Học viên
              </button>
            </div>
          )}
          <Table
            columns={gradeColumns}
            rows={grades}
            rowKey={(r) => r.id}
            emptyTitle="Sổ điểm & Điểm danh đang trống"
            emptyDescription="Hệ thống tự động tính điểm GPA tổng kết theo trọng số 40% giữa kỳ + 60% cuối kỳ."
          />
        </div>
      )}

      {/* MODALS */}
      <CustomModal isOpen={courseModalOpen} onClose={() => setCourseModalOpen(false)} title="Tạo Chương Trình / Khóa Học">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Tên chương trình đào tạo..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            type="number"
            value={courseSessions}
            onChange={(e) => setCourseSessions(e.target.value)}
            placeholder="Tổng thời lượng (số buổi)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            type="number"
            value={courseTuition}
            onChange={(e) => setCourseTuition(e.target.value)}
            placeholder="Học phí tiêu chuẩn (VNĐ)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <button
            type="button"
            onClick={handleCreateCourse}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Lưu Khóa học
          </button>
        </div>
      </CustomModal>

      <CustomModal isOpen={classModalOpen} onClose={() => setClassModalOpen(false)} title="Mở Lớp Học Khai Giảng Mới">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select
            value={clsCourseId}
            onChange={(e) => setClsCourseId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">-- Chọn Khóa học --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            value={clsName}
            onChange={(e) => setClsName(e.target.value)}
            placeholder="Tên lớp (VD: K26 Tối Thứ 2-4-6)..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <select
            value={clsInstructorId}
            onChange={(e) => setClsInstructorId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">-- Chọn Giảng viên chủ nhiệm --</option>
            {(overview?.instructors || []).map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.full_name}</option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <input
              value={clsRoom}
              onChange={(e) => setClsRoom(e.target.value)}
              placeholder="Phòng học mặc định"
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
            <input
              type="number"
              value={clsCapacity}
              onChange={(e) => setClsCapacity(e.target.value)}
              placeholder="Sĩ số tối đa"
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
          </div>
          <button
            type="button"
            onClick={handleCreateClass}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Mở Lớp Học
          </button>
        </div>
      </CustomModal>

      <CustomModal isOpen={enrollModalOpen} onClose={() => setEnrollModalOpen(false)} title="Ghi Danh Học Viên Vào Lớp">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select
            value={enrClassId}
            onChange={(e) => setEnrClassId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">-- Chọn Lớp học --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
          <select
            value={enrLeadId}
            onChange={(e) => setEnrLeadId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">-- Chọn từ Hồ sơ Khách hàng CRM 360° (Tùy chọn) --</option>
            {(overview?.leads || []).map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <input
            value={enrStudentName}
            onChange={(e) => setEnrStudentName(e.target.value)}
            placeholder="Hoặc nhập tên học viên trực tiếp..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            type="number"
            value={enrTuition}
            onChange={(e) => setEnrTuition(e.target.value)}
            placeholder="Học phí thực đóng (VNĐ)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <button
            type="button"
            onClick={handleEnrollStudent}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Xác nhận Ghi danh
          </button>
        </div>
      </CustomModal>

      <CustomModal isOpen={gradeModalOpen} onClose={() => setGradeModalOpen(false)} title="Điểm Danh & Nhập Điểm Học Viên">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select
            value={grEnrollmentId}
            onChange={(e) => setGrEnrollmentId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">-- Chọn Học viên --</option>
            {enrollments.map((en) => (
              <option key={en.id} value={en.id}>{en.student_name} ({en.class_code})</option>
            ))}
          </select>
          <select
            value={grAttendance}
            onChange={(e) => setGrAttendance(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="present">Có mặt đúng giờ (Present)</option>
            <option value="late">Đi trễ (Late)</option>
            <option value="excused">Nghỉ có phép (Excused)</option>
            <option value="absent">Vắng không phép (Absent)</option>
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              type="number"
              step="0.1"
              value={grMidterm}
              onChange={(e) => setGrMidterm(e.target.value)}
              placeholder="Điểm giữa kỳ (0-10)"
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
            <input
              type="number"
              step="0.1"
              value={grFinal}
              onChange={(e) => setGrFinal(e.target.value)}
              placeholder="Điểm cuối kỳ (0-10)"
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
          </div>
          <textarea
            value={grFeedback}
            onChange={(e) => setGrFeedback(e.target.value)}
            rows={3}
            placeholder="Nhận xét học lực & chuyên cần..."
            style={{ borderRadius: 14, border: '1px solid #E2E8F0', padding: '10px 12px', fontSize: '0.84rem' }}
          />
          <button
            type="button"
            onClick={handleRecordGrade}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Lưu Điểm Danh & GPA
          </button>
        </div>
      </CustomModal>
    </div>
  );
};

export default ErpEducationWave2Entry;
