import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type {
  ClassRow,
  CourseRow,
  EduInstructorItem,
  EduLeadOption,
} from './educationTypes';

export interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: ReadonlyArray<CourseRow>;
  instructors: ReadonlyArray<EduInstructorItem>;
  onSaved: () => Promise<void>;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  courses,
  instructors,
  onSaved,
}) => {
  const { token, tenantSlug } = useAuth();
  const [clsCourseId, setClsCourseId] = useState<string>('');
  const [clsName, setClsName] = useState<string>('');
  const [clsInstructorId, setClsInstructorId] = useState<string>('');
  const [clsRoom, setClsRoom] = useState<string>('Phòng 201');
  const [clsCapacity, setClsCapacity] = useState<string>('30');

  const handleCreateClass = async () => {
    const targetCourseId = clsCourseId || courses[0]?.id || '';
    if (!targetCourseId || !clsName.trim()) {
      toast.error('Vui lòng chọn Khóa học và nhập tên Lớp học');
      return;
    }
    try {
      await apiRequest('/education/classes', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          course_id: targetCourseId,
          name: clsName.trim(),
          instructor_user_id: clsInstructorId || null,
          room_name: clsRoom.trim(),
          max_capacity: Number(clsCapacity || 30),
        },
      });
      toast.success('Đã mở Lớp học mới');
      setClsName('');
      onClose();
      await onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể mở Lớp học'));
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Mở Lớp Học Khai Giảng Mới">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <select value={clsCourseId || courses[0]?.id || ''} onChange={(e) => setClsCourseId(e.target.value)} style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.grading_scale})</option>)}
        </select>
        <input value={clsName} onChange={(e) => setClsName(e.target.value)} placeholder="Tên lớp (VD: K26 Tối Thứ 2-4-6)..." style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
        <select value={clsInstructorId} onChange={(e) => setClsInstructorId(e.target.value)} style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
          <option value="">-- Chọn Giảng viên chủ nhiệm --</option>
          {instructors.map((inst) => <option key={inst.id} value={inst.id}>{inst.full_name}</option>)}
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <input value={clsRoom} onChange={(e) => setClsRoom(e.target.value)} placeholder="Phòng học" style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          <input type="number" value={clsCapacity} onChange={(e) => setClsCapacity(e.target.value)} placeholder="Sĩ số" style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
        </div>
        <button type="button" onClick={() => void handleCreateClass()} className="btn-inkica-primary" style={{ height: 42, borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>
          Mở Lớp Học
        </button>
      </div>
    </CustomModal>
  );
};

export interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ReadonlyArray<ClassRow>;
  leads: ReadonlyArray<EduLeadOption>;
  onSaved: () => Promise<void>;
}

export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({
  isOpen,
  onClose,
  classes,
  leads,
  onSaved,
}) => {
  const { token, tenantSlug } = useAuth();
  const [enrClassId, setEnrClassId] = useState<string>('');
  const [enrLeadId, setEnrLeadId] = useState<string>('');
  const [enrStudentName, setEnrStudentName] = useState<string>('');
  const [enrTuition, setEnrTuition] = useState<string>('12000000');

  const handleEnrollStudent = async () => {
    const targetClassId = enrClassId || classes[0]?.id || '';
    if (!targetClassId) {
      toast.error('Vui lòng chọn Lớp học ghi danh');
      return;
    }
    try {
      await apiRequest('/education/enrollments', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          class_id: targetClassId,
          lead_id: enrLeadId || null,
          student_name: enrStudentName.trim() || undefined,
          tuition_paid_vnd: Number(enrTuition || 0),
        },
      });
      toast.success('Đã ghi danh Học viên & đồng bộ thực thu học phí vào CRM 360°');
      setEnrStudentName('');
      onClose();
      await onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ghi danh Học viên'));
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Ghi Danh Học Viên Vào Lớp">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <select value={enrClassId || classes[0]?.id || ''} onChange={(e) => setEnrClassId(e.target.value)} style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
        </select>
        <select value={enrLeadId} onChange={(e) => setEnrLeadId(e.target.value)} style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
          <option value="">-- Chọn từ Hồ sơ Khách hàng CRM 360° (Tùy chọn) --</option>
          {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <input value={enrStudentName} onChange={(e) => setEnrStudentName(e.target.value)} placeholder="Hoặc nhập tên học viên trực tiếp..." style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
        <input type="number" value={enrTuition} onChange={(e) => setEnrTuition(e.target.value)} placeholder="Học phí thực đóng (VNĐ)" style={{ height: 42, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
        <button type="button" onClick={() => void handleEnrollStudent()} className="btn-inkica-primary" style={{ height: 42, borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>
          Xác Nhận Ghi Danh
        </button>
      </div>
    </CustomModal>
  );
};
