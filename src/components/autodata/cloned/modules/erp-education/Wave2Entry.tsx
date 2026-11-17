import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CalendarClock,
  CreditCard,
  FileSpreadsheet,
  GraduationCap,
  Lock,
  Mail,
  PauseCircle,
  Plus,
  RefreshCw,
  UserPlus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { CardSkeleton, KpiCardSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import {
  Badge,
  Card,
  FormCard,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import type {
  AnnouncementRow,
  AnnouncementTypeKey,
  ClassRow,
  CourseRow,
  EduOverviewPayload,
  EduTabKey,
  EnrollmentRow,
  GradebookRow,
  ScheduleRow,
} from './educationTypes';
import { ClassGradebookModal } from './ClassGradebookModal';
import { StudentAcademicWorkspaceModal } from './StudentAcademicWorkspaceModal';
import { BatchAcademicCommsModal } from './BatchAcademicCommsModal';
import { CourseCurriculumModal } from './CourseCurriculumModal';
import { TimetablePanel } from './TimetablePanel';
import { CoursesAndClassesPanel } from './CoursesAndClassesPanel';
import { CreateClassModal, EnrollStudentModal } from './EduQuickModals';

export const ErpEducationWave2Entry: React.FC = () => {
  const navigate = useNavigate();
  const { token, tenantSlug } = useAuth();
  const { educationAddon, hasModule, switchPackage, isTenantOwner, packageMeta, scope, can } = useEntitlement();

  const isEntitled = educationAddon && hasModule('education_addon');
  const canCreate = can('education_addon', 'create');
  const canEdit = can('education_addon', 'edit') || canCreate;
  const canDelete = can('education_addon', 'delete');

  const [activeTab, setActiveTab] = useState<EduTabKey>('courses_classes');
  const [loading, setLoading] = useState<boolean>(true);
  const [enrollFilter, setEnrollFilter] = useState<'all' | 'requested' | 'deferred'>('all');

  const [overview, setOverview] = useState<EduOverviewPayload | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [grades, setGrades] = useState<GradebookRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);

  const [courseModalState, setCourseModalState] = useState<{ open: boolean; course: CourseRow | null }>({ open: false, course: null });
  const [classModalOpen, setClassModalOpen] = useState<boolean>(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState<boolean>(false);
  const [gradebookModal, setGradebookModal] = useState<{ open: boolean; classId: string; mode: 'grid' | 'import' }>({ open: false, classId: '', mode: 'grid' });
  const [studentWorkspaceModal, setStudentWorkspaceModal] = useState<{ open: boolean; enrollmentId: string; section: 'transcript' | 'postpone' }>({ open: false, enrollmentId: '', section: 'transcript' });
  const [commsModal, setCommsModal] = useState<{ open: boolean; type: AnnouncementTypeKey; classId: string; enrollmentId: string }>({ open: false, type: 'subject_announcement', classId: '', enrollmentId: '' });

  const fetchAll = useCallback(async () => {
    const [ov, crs, cls, sch, enr, grd, ann] = await Promise.all([
      apiRequest<EduOverviewPayload>('/education/overview', { token, tenantSlug }),
      apiRequest<{ items: CourseRow[] }>('/education/courses', { token, tenantSlug }),
      apiRequest<{ items: ClassRow[] }>('/education/classes', { token, tenantSlug }),
      apiRequest<{ items: ScheduleRow[] }>('/education/schedules', { token, tenantSlug }),
      apiRequest<{ items: EnrollmentRow[] }>('/education/enrollments', { token, tenantSlug }),
      apiRequest<{ items: GradebookRow[] }>('/education/gradebook', { token, tenantSlug }),
      apiRequest<{ items: AnnouncementRow[] }>('/education/announcements', { token, tenantSlug }),
    ]);
    return { ov, crs: crs.items || [], cls: cls.items || [], sch: sch.items || [], enr: enr.items || [], grd: grd.items || [], ann: ann.items || [] };
  }, [token, tenantSlug]);

  const applyBundle = useCallback((b: Awaited<ReturnType<typeof fetchAll>>) => {
    setOverview(b.ov);
    setCourses(b.crs);
    setClasses(b.cls);
    setSchedules(b.sch);
    setEnrollments(b.enr);
    setGrades(b.grd);
    setAnnouncements(b.ann);
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
    return () => { cancelled = true; };
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

  const filteredEnrollments = useMemo(() => {
    if (enrollFilter === 'requested') return enrollments.filter((e) => e.postpone_status === 'requested');
    if (enrollFilter === 'deferred') return enrollments.filter((e) => e.status === 'deferred' || e.postpone_status === 'approved');
    return enrollments;
  }, [enrollments, enrollFilter]);

  if (!isEntitled) {
    return (
      <Card padding="2.5rem 1.75rem" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, margin: '0 auto 1rem', borderRadius: 18, background: '#EEF2FF', color: '#1E40FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={28} />
        </div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
          Phân Hệ Chuyên Ngành Đào Tạo & Học Vụ (Education Vertical Add-on)
        </h2>
        <p style={{ fontSize: '0.86rem', color: '#64748B', maxWidth: 580, margin: '0 auto 1.35rem', lineHeight: 1.55 }}>
          Mặc định <strong>Education Add-on</strong> ở trạng thái tắt (<code>education_addon = false</code>) nhằm giữ gọn giao diện cho doanh nghiệp thương mại & sản xuất. Quản trị viên Tenant có thể mở khóa tại <strong>Settings &rarr; Billing</strong> để kích hoạt Chương trình Tín chỉ ECTS 6.0 / GPA 4.0, Bảng điểm Excel, Bảo lưu OCR và Truyền thông Học vụ.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => navigate('/billing')} className="btn secondary" style={{ height: 44, padding: '0 1.25rem', borderRadius: 14, color: '#1E40FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <CreditCard size={16} /> Đi tới Settings &rarr; Billing
          </button>
          {isTenantOwner && (
            <button type="button" onClick={() => void switchPackage('domation_promax', { educationAddon: true, industryKey: 'education' })} className="btn-inkica-primary" style={{ height: 44, padding: '0 1.35rem', borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>
              Kích Hoạt Ngay Education Add-on
            </button>
          )}
        </div>
      </Card>
    );
  }

  const enrollColumns: ReadonlyArray<TableColumn<EnrollmentRow>> = [
    { key: 'stu', header: 'Học viên', render: (r) => <strong>{r.student_name}</strong> },
    { key: 'cls', header: 'Lớp & Chương trình', render: (r) => `${r.class_code} — ${r.course_name || r.class_name}` },
    { key: 'fee', header: 'Học phí đã thu', numeric: true, render: (r) => formatVnd(r.tuition_paid_vnd) },
    {
      key: 'st',
      header: 'Trạng thái / Bảo lưu',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge tone={r.status === 'deferred' ? 'warning' : 'success'}>{r.status}</Badge>
          {r.postpone_status && r.postpone_status !== 'none' && <Badge tone="info">OCR: {r.postpone_status}</Badge>}
        </div>
      ),
    },
    {
      key: 'act',
      header: 'Thao tác Học vụ',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setStudentWorkspaceModal({ open: true, enrollmentId: r.id, section: 'transcript' })} className="btn secondary" style={{ height: 32, padding: '0 10px', fontSize: '0.75rem', color: '#1E40FF' }}>Hồ sơ 360°</button>
          <button type="button" onClick={() => setStudentWorkspaceModal({ open: true, enrollmentId: r.id, section: 'postpone' })} className="btn secondary" style={{ height: 32, padding: '0 10px', fontSize: '0.75rem' }}>Bảo lưu OCR</button>
          <button type="button" onClick={() => setCommsModal({ open: true, type: 'onboarding', classId: r.class_id, enrollmentId: r.id })} className="btn secondary" style={{ height: 32, padding: '0 10px', fontSize: '0.75rem' }}>Onboarding</button>
        </div>
      ),
    },
  ];

  const gradeColumns: ReadonlyArray<TableColumn<GradebookRow>> = [
    { key: 'stu', header: 'Học viên', render: (r) => <strong>{r.student_name}</strong> },
    { key: 'sub', header: 'Lớp / Môn học', render: (r) => `${r.class_code} • ${r.subject_key || 'GENERAL'}` },
    { key: 'mid', header: 'Giữa kỳ', numeric: true, render: (r) => r.midterm_score ?? '—' },
    { key: 'fin', header: 'Cuối kỳ', numeric: true, render: (r) => r.final_score ?? '—' },
    { key: 'ects', header: 'ECTS 6 / GPA', numeric: true, render: (r) => `${r.ects_score_6 ?? '—'} / ${r.gpa_score ?? '—'}` },
    { key: 'let', header: 'Xếp loại', render: (r) => <Badge tone={r.pass_status === 'failed' ? 'danger' : 'primary'}>{r.letter_grade || r.gpa_score || '—'}</Badge> },
  ];

  const annColumns: ReadonlyArray<TableColumn<AnnouncementRow>> = [
    { key: 'title', header: 'Tiêu đề phát hành', render: (r) => <strong>{r.title}</strong> },
    { key: 'type', header: 'Loại thông báo', render: (r) => <Badge tone="info">{r.announcement_type}</Badge> },
    { key: 'ch', header: 'Kênh gửi', render: (r) => (r.channels || []).join(', ').toUpperCase() },
    { key: 'cnt', header: 'Đã gửi', numeric: true, render: (r) => `${r.sent_count} người` },
    { key: 'dt', header: 'Thời gian', render: (r) => formatShortDate(r.created_at) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#F8F9FA' }}>
      <Card padding="1.25rem 1.5rem" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: '#EEF2FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E40FF' }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.16rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Đào Tạo & Quản Lý Học Vụ Chuyên Sâu (Học Viện / Trung Tâm Đào Tạo)
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="purple">Education Add-on Active</Badge>
                <Badge tone="info">Scope: {scope('education_addon')}</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>
                Khung chương trình Tín chỉ (ECTS 6.0 / GPA 4.0 / Hệ 10), Ma trận Điểm Excel, Bảo lưu OCR & Truyền thông Học vụ cùng DOM Agent
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {canCreate && (
              <button type="button" onClick={() => setCommsModal({ open: true, type: 'subject_announcement', classId: classes[0]?.id || '', enrollmentId: '' })} className="btn secondary" style={{ height: 42, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Mail size={15} /> Truyền thông Học vụ
              </button>
            )}
            <button type="button" onClick={() => void reloadAll()} className="btn secondary" style={{ height: 42 }}>
              <RefreshCw size={15} />
            </button>
            <ScreenHelpButton screenKey="erp_education" />
          </div>
        </div>
      </Card>

      {loading && !overview ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.9rem' }}>
          <KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.9rem' }}>
          <FormCard icon={<BookOpen size={18} />} title={`${overview?.summary.courses_count ?? 0} Chương trình`} description={`${overview?.summary.active_classes ?? 0} lớp đang giảng dạy`} badge={<Badge tone="primary">Curriculums</Badge>} />
          <FormCard icon={<Users size={18} />} title={`${overview?.summary.students_count ?? 0} Học viên`} description={`Thực thu: ${formatVnd(overview?.summary.tuition_collected_vnd ?? 0)}`} badge={<Badge tone="success">Enrolled</Badge>} />
          <FormCard icon={<CalendarClock size={18} />} title={`${overview?.summary.weekly_slots_count ?? 0} Ca học / tuần`} description="Chống trùng phòng & giảng viên" badge={<Badge tone="info">Conflict Safe</Badge>} />
          <FormCard icon={<PauseCircle size={18} />} title={`${overview?.summary.requested_postpones_count ?? 0} Chờ duyệt bảo lưu`} description={`${overview?.summary.deferred_students_count ?? 0} HV bảo lưu • ${announcements.length} thông báo`} badge={<Badge tone="warning">OCR Queue</Badge>} />
        </div>
      )}

      <PillTabs<EduTabKey>
        activeKey={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'courses_classes', label: 'Chương Trình & Lớp Học', icon: <BookOpen size={15} />, count: classes.length },
          { key: 'timetable', label: 'Thời Khóa Biểu Tuần', icon: <CalendarClock size={15} />, count: schedules.length },
          { key: 'enrollments', label: 'Học Viên & Bảo Lưu OCR', icon: <UserPlus size={15} />, count: enrollments.length },
          { key: 'gradebook', label: 'Ma Trận Điểm & Import Excel', icon: <Award size={15} />, count: grades.length },
          { key: 'announcements', label: 'Thông Báo & Mời Giảng 1-on-1', icon: <Mail size={15} />, count: announcements.length },
        ]}
      />

      {loading && !overview ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <CardSkeleton height={220} /><TableSkeleton rows={5} cols={4} />
        </div>
      ) : (
        <>
          {activeTab === 'courses_classes' && (
            <CoursesAndClassesPanel
              courses={courses}
              classes={classes}
              canCreate={canCreate}
              canEdit={canEdit}
              onNewCourse={() => setCourseModalState({ open: true, course: null })}
              onEditCourse={(c) => setCourseModalState({ open: true, course: c })}
              onNewClass={() => setClassModalOpen(true)}
              onOpenGradebook={(classId, mode) => setGradebookModal({ open: true, classId, mode })}
              onAnnounceClass={(classId) => setCommsModal({ open: true, type: 'subject_announcement', classId, enrollmentId: '' })}
            />
          )}

          {activeTab === 'timetable' && (
            <TimetablePanel classes={classes} instructors={overview?.instructors || []} schedules={schedules} canCreate={canCreate} canDelete={canDelete} onReload={reloadAll} />
          )}

          {activeTab === 'enrollments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <PillTabs<'all' | 'requested' | 'deferred'>
                  activeKey={enrollFilter}
                  onChange={setEnrollFilter}
                  tabs={[
                    { key: 'all', label: 'Tất cả Học viên', count: enrollments.length },
                    { key: 'requested', label: 'Chờ duyệt Bảo lưu (OCR)', count: enrollments.filter((e) => e.postpone_status === 'requested').length },
                    { key: 'deferred', label: 'Đang Bảo lưu', count: enrollments.filter((e) => e.status === 'deferred').length },
                  ]}
                />
                {canCreate && (
                  <button type="button" onClick={() => setEnrollModalOpen(true)} className="btn-inkica-primary" style={{ height: 40, padding: '0 1.1rem', borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={15} /> Ghi Danh Học Viên Từ CRM
                  </button>
                )}
              </div>
              <Table columns={enrollColumns} rows={filteredEnrollments} rowKey={(r) => r.id} emptyTitle="Chưa có học viên phù hợp bộ lọc" />
            </div>
          )}

          {activeTab === 'gradebook' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" disabled={classes.length === 0} onClick={() => setGradebookModal({ open: true, classId: classes[0]?.id || '', mode: 'import' })} className="btn secondary" style={{ height: 40, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FileSpreadsheet size={15} /> Import Điểm Excel / CSV
                </button>
                <button type="button" disabled={classes.length === 0} onClick={() => setGradebookModal({ open: true, classId: classes[0]?.id || '', mode: 'grid' })} className="btn-inkica-primary" style={{ height: 40, padding: '0 1.15rem', borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Award size={15} /> Mở Ma Trận Bảng Điểm Lớp
                </button>
              </div>
              <Table columns={gradeColumns} rows={grades} rowKey={(r) => r.id} emptyTitle="Sổ điểm đang trống" emptyDescription="Mở Ma trận Bảng điểm lớp hoặc Import Excel (.xlsx/.csv) để quy đổi tự động ECTS 6.0 / GPA 4.0 / Hệ 10." />
            </div>
          )}

          {activeTab === 'announcements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {canCreate && (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" onClick={() => setCommsModal({ open: true, type: 'subject_announcement', classId: classes[0]?.id || '', enrollmentId: '' })} className="btn secondary" style={{ height: 38, color: '#1E40FF' }}>+ Thông báo Chuyên đề Lớp</button>
                  <button type="button" onClick={() => setCommsModal({ open: true, type: 'lecturer_invitation', classId: classes[0]?.id || '', enrollmentId: '' })} className="btn secondary" style={{ height: 38, color: '#1E40FF' }}>+ Thư Mời Giảng & 1-on-1</button>
                  <button type="button" onClick={() => setCommsModal({ open: true, type: 'onboarding', classId: classes[0]?.id || '', enrollmentId: '' })} className="btn-inkica-primary" style={{ height: 38, padding: '0 1rem', borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>+ Thư Tiếp Nhận Tân Học Viên</button>
                </div>
              )}
              <Table columns={annColumns} rows={announcements} rowKey={(r) => r.id} emptyTitle="Chưa có thông báo học vụ nào được phát hành" />
            </div>
          )}
        </>
      )}

      {courseModalState.open && (
        <CourseCurriculumModal key={courseModalState.course?.id || 'new-course'} isOpen={courseModalState.open} onClose={() => setCourseModalState({ open: false, course: null })} editingCourse={courseModalState.course} onSaved={() => void reloadAll()} />
      )}
      {gradebookModal.open && (
        <ClassGradebookModal key={`${gradebookModal.classId}-${gradebookModal.mode}`} isOpen={gradebookModal.open} onClose={() => setGradebookModal((p) => ({ ...p, open: false }))} initialClassId={gradebookModal.classId} initialMode={gradebookModal.mode} classesList={classes} onSaved={() => void reloadAll()} />
      )}
      {studentWorkspaceModal.open && (
        <StudentAcademicWorkspaceModal key={`${studentWorkspaceModal.enrollmentId}-${studentWorkspaceModal.section}`} isOpen={studentWorkspaceModal.open} onClose={() => setStudentWorkspaceModal((p) => ({ ...p, open: false }))} enrollmentId={studentWorkspaceModal.enrollmentId} initialSection={studentWorkspaceModal.section} onUpdated={() => void reloadAll()} />
      )}
      {commsModal.open && (
        <BatchAcademicCommsModal key={`${commsModal.type}-${commsModal.classId}-${commsModal.enrollmentId}`} isOpen={commsModal.open} onClose={() => setCommsModal((p) => ({ ...p, open: false }))} initialType={commsModal.type} initialClassId={commsModal.classId} initialEnrollmentId={commsModal.enrollmentId} courses={courses} classes={classes} instructors={overview?.instructors || []} enrollments={enrollments} onSent={() => void reloadAll()} />
      )}
      <CreateClassModal isOpen={classModalOpen} onClose={() => setClassModalOpen(false)} courses={courses} instructors={overview?.instructors || []} onSaved={reloadAll} />
      <EnrollStudentModal isOpen={enrollModalOpen} onClose={() => setEnrollModalOpen(false)} classes={classes} leads={overview?.leads || []} onSaved={reloadAll} />
    </div>
  );
};

export default ErpEducationWave2Entry;
