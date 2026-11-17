import React from 'react';
import { BookOpen, GraduationCap, Pencil } from 'lucide-react';
import { Badge, Card, EmptyState, FormCard } from '../../components/ui/AutoDataLoadingModal';
import { formatVnd } from '../../../autodataApi';
import type { ClassRow, CourseRow } from './educationTypes';

export interface CoursesAndClassesPanelProps {
  courses: ReadonlyArray<CourseRow>;
  classes: ReadonlyArray<ClassRow>;
  canCreate: boolean;
  canEdit: boolean;
  onNewCourse: () => void;
  onEditCourse: (course: CourseRow) => void;
  onNewClass: () => void;
  onOpenGradebook: (classId: string, mode: 'grid' | 'import') => void;
  onAnnounceClass: (classId: string) => void;
}

export const CoursesAndClassesPanel: React.FC<CoursesAndClassesPanelProps> = ({
  courses,
  classes,
  canCreate,
  canEdit,
  onNewCourse,
  onEditCourse,
  onNewClass,
  onOpenGradebook,
  onAnnounceClass,
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
    <Card
      title="Chương Trình Đào Tạo & Thang Điểm Tín Chỉ"
      actions={
        canCreate && (
          <button type="button" onClick={onNewCourse} className="btn secondary" style={{ height: 36, color: '#1E40FF' }}>
            + Thiết kế Khóa học
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
              description={`${c.subjects_json?.length || 0} học phần • ${c.credits} tín chỉ • Học phí: ${formatVnd(c.tuition_fee_vnd)}`}
              badge={<Badge tone="primary">{c.grading_scale.toUpperCase()}</Badge>}
              footer={
                canEdit && (
                  <button
                    type="button"
                    onClick={() => onEditCourse(c)}
                    className="btn secondary"
                    style={{ height: 30, fontSize: '0.75rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Pencil size={12} /> Sửa Môn & Thang Điểm
                  </button>
                )
              }
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
            onClick={onNewClass}
            className="btn-inkica-primary"
            style={{ height: 36, padding: '0 1rem', borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
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
              footer={
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => onOpenGradebook(cl.id, 'grid')} className="btn secondary" style={{ height: 30, fontSize: '0.74rem', color: '#1E40FF' }}>
                    Bảng điểm Ma trận
                  </button>
                  <button type="button" onClick={() => onOpenGradebook(cl.id, 'import')} className="btn secondary" style={{ height: 30, fontSize: '0.74rem' }}>
                    Import Excel
                  </button>
                  <button type="button" onClick={() => onAnnounceClass(cl.id)} className="btn secondary" style={{ height: 30, fontSize: '0.74rem' }}>
                    Thông báo Lớp
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}
    </Card>
  </div>
);
