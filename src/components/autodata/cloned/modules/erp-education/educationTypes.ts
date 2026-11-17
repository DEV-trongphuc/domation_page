export type GradingScaleKey = 'scale_10' | 'ects_6' | 'gpa_4';
export type EduTabKey = 'courses_classes' | 'timetable' | 'enrollments' | 'gradebook' | 'announcements';
export type AnnouncementTypeKey = 'subject_announcement' | 'lecturer_invitation' | 'onboarding';
export type CommChannelKey = 'email' | 'zns' | 'workchat';

export interface CurriculumSubject {
  code: string;
  name: string;
  credits: number;
}

export interface EduInstructorItem {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface EduLeadOption {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

export interface EduOverviewPayload {
  summary: {
    courses_count: number;
    total_classes: number;
    active_classes: number;
    students_count: number;
    tuition_collected_vnd: number;
    deferred_students_count?: number;
    requested_postpones_count?: number;
    weekly_slots_count: number;
    announcements_count?: number;
  };
  instructors: EduInstructorItem[];
  leads: EduLeadOption[];
}

export interface CourseRow {
  id: string;
  code: string;
  name: string;
  category: string;
  duration_sessions: number;
  tuition_fee_vnd: number;
  grading_scale: GradingScaleKey;
  credits: number;
  subjects_json: CurriculumSubject[];
  subjects?: CurriculumSubject[];
  description?: string | null;
  is_active?: boolean;
  classes_count: number;
}

export interface ClassRow {
  id: string;
  course_id: string;
  course_code?: string;
  course_name: string;
  grading_scale?: GradingScaleKey;
  course_credits?: number;
  subjects?: CurriculumSubject[];
  code: string;
  name: string;
  instructor_user_id?: string | null;
  instructor_name?: string | null;
  room_name?: string | null;
  max_capacity: number;
  enrolled_count: number;
  tuition_fee_vnd?: number;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
}

export interface ScheduleRow {
  id: string;
  class_id: string;
  class_code: string;
  class_name: string;
  course_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_name: string;
  instructor_user_id?: string | null;
  instructor_name?: string | null;
  topic?: string | null;
}

export interface PostponeOcrSummary {
  extracted_student_name?: string;
  extracted_student_code?: string | null;
  extracted_reason?: string;
  extracted_from_date?: string | null;
  extracted_until_date?: string | null;
  detected_dates?: string[];
  remind_date?: string | null;
  remind_days_before?: number;
  name_matched?: boolean;
  confidence?: number;
  document_url?: string | null;
  raw_excerpt?: string | null;
  last_decision?: string;
  decision_note?: string | null;
  extracted_at?: string;
}

export interface PostponeHistoryItem {
  id: string;
  action: string;
  postpone_status: string;
  postpone_reason?: string | null;
  postpone_until?: string | null;
  note?: string | null;
  document_url?: string | null;
  created_at: string;
}

export interface EnrollmentRow {
  id: string;
  class_id: string;
  class_code: string;
  class_name: string;
  course_id?: string;
  course_code?: string;
  course_name?: string;
  grading_scale?: GradingScaleKey;
  lead_id?: string | null;
  student_name: string;
  student_phone?: string | null;
  student_email?: string | null;
  status: string;
  postpone_status?: string;
  postpone_reason?: string | null;
  postpone_until?: string | null;
  postpone_ocr_json?: PostponeOcrSummary;
  tuition_paid_vnd: number;
  enrolled_at: string;
}

export interface GradebookRow {
  id: string;
  enrollment_id: string;
  class_id?: string;
  student_name: string;
  class_code: string;
  class_name?: string;
  subject_key?: string;
  subject_name?: string | null;
  session_date: string;
  attendance_status: string;
  attendance_score?: number | null;
  assignment_score?: number | null;
  midterm_score: number | null;
  final_score: number | null;
  gpa_score: number | null;
  ects_score_6?: number | null;
  letter_grade?: string | null;
  pass_status?: string;
  feedback?: string | null;
}

export interface MatrixStudentItem {
  id: string;
  enrollment_id: string;
  lead_id: string | null;
  student_name: string;
  student_phone: string | null;
  student_email: string | null;
  status: string;
  postpone_status: string;
  tuition_paid_vnd: number;
}

export interface EditableGradeCell {
  attendance_score: string;
  assignment_score: string;
  midterm_score: string;
  final_score: string;
  feedback: string;
}

export interface GradebookMatrixPayload {
  class_info: {
    id: string;
    code: string;
    name: string;
    course_id: string;
    course_code: string;
    course_name: string;
    instructor_name: string | null;
    room_name: string | null;
    max_capacity: number;
    status: string;
  };
  course: {
    id: string;
    code: string;
    name: string;
    grading_scale: GradingScaleKey;
    credits: number;
    subjects: CurriculumSubject[];
  };
  grading_scale: GradingScaleKey;
  subjects: CurriculumSubject[];
  students: MatrixStudentItem[];
  matrix: Record<string, Record<string, GradebookRow>>;
  cells: GradebookRow[];
}

export interface ParsedGradeImportRow {
  row_index: number;
  enrollment_id?: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  matched: boolean;
  attendance_score: string;
  assignment_score: string;
  midterm_score: string;
  final_score: string;
  feedback: string;
}

export interface AnnouncementRecipient {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string;
}

export interface AnnouncementRow {
  id: string;
  announcement_type: AnnouncementTypeKey;
  course_id?: string | null;
  course_code?: string | null;
  course_name?: string | null;
  class_id?: string | null;
  class_code?: string | null;
  class_name?: string | null;
  subject_key?: string | null;
  title: string;
  content_html: string;
  channels: CommChannelKey[];
  recipients: AnnouncementRecipient[];
  sent_count: number;
  status: string;
  created_by_name?: string | null;
  created_at: string;
}

export interface StudentSubjectTranscriptItem {
  subject_code: string;
  subject_name: string;
  credits: number;
  status: 'passed' | 'failed' | 'deferred' | 'pending';
  attendance_score: number | null;
  assignment_score: number | null;
  midterm_score: number | null;
  final_score: number | null;
  gpa_score: number | null;
  ects_score_6: number | null;
  letter_grade: string | null;
  feedback: string | null;
  updated_at: string | null;
}

export interface StudentWorkspacePayload {
  enrollment: {
    id: string;
    class_id: string;
    class_code: string;
    class_name: string;
    room_name: string | null;
    instructor_name: string | null;
    course_id: string;
    course_code: string;
    course_name: string;
    grading_scale: GradingScaleKey;
    lead_id: string | null;
    student_name: string;
    student_phone: string | null;
    student_email: string | null;
    status: string;
    tuition_paid_vnd: number;
    tuition_fee_vnd: number;
    postpone_status: string;
    postpone_reason: string | null;
    postpone_until: string | null;
    postpone_ocr_json: PostponeOcrSummary;
    enrolled_at: string;
  };
  curriculum_progress: {
    grading_scale: GradingScaleKey;
    total_subjects: number;
    completed_subjects_count: number;
    pending_subjects_count: number;
    earned_credits: number;
    total_credits: number;
    progress_pct: number;
    cumulative_gpa: number | null;
    cumulative_scale_10: number | null;
    cumulative_ects_6: number | null;
    cumulative_gpa_4: number | null;
  };
  attendance: {
    attendance_rate: number;
    total_sessions: number;
    present_count: number;
    late_count: number;
    excused_count: number;
    absent_count: number;
  };
  subjects: StudentSubjectTranscriptItem[];
  completed_subjects: StudentSubjectTranscriptItem[];
  pending_subjects: StudentSubjectTranscriptItem[];
  postpone_history: PostponeHistoryItem[];
  announcements: AnnouncementRow[];
}

export const DAY_LABELS: ReadonlyArray<string> = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export const GRADING_SCALE_OPTIONS: ReadonlyArray<{
  key: GradingScaleKey;
  label: string;
  shortLabel: string;
  passingHint: string;
}> = [
  { key: 'scale_10', label: 'Hệ 10.0 (Chuẩn Đào tạo Việt Nam)', shortLabel: 'Hệ 10.0', passingHint: 'A >= 8.5 • B >= 7.0 • C >= 5.5 • D >= 4.0' },
  { key: 'ects_6', label: 'ECTS 6.0 (Chuẩn Tín chỉ Quốc tế)', shortLabel: 'ECTS 6.0', passingHint: 'A >= 5.25 • B >= 4.75 • C >= 4.50 • D >= 4.25 • E >= 4.00' },
  { key: 'gpa_4', label: 'GPA 4.0 (Chuẩn Đại học Quốc tế)', shortLabel: 'GPA 4.0', passingHint: 'A >= 3.6 • B >= 3.2 • C >= 2.5 • D >= 2.0' },
];

export const STANDARD_CURRICULUM_PRESETS: Record<
  string,
  { label: string; scale: GradingScaleKey; subjects: CurriculumSubject[] }
> = {
  mba_exec: {
    label: 'Quản trị Điều hành Cấp cao (Executive Program — ECTS 6.0)',
    scale: 'ects_6',
    subjects: [
      { code: 'MGT-01', name: 'Quản trị Chiến lược & Điều hành Doanh nghiệp', credits: 3 },
      { code: 'FIN-02', name: 'Tài chính Doanh nghiệp dành cho Lãnh đạo', credits: 3 },
      { code: 'MKT-03', name: 'Chiến lược Marketing Số & Tăng trưởng', credits: 3 },
      { code: 'AI-04', name: 'Ứng dụng AI trong Ra quyết định Kinh doanh', credits: 3 },
      { code: 'CAP-05', name: 'Đề án Tốt nghiệp Thực chiến (Capstone)', credits: 6 },
    ],
  },
  msc_data_ai: {
    label: 'Khoa học Dữ liệu & Trí tuệ Nhân tạo (Data & AI — GPA 4.0)',
    scale: 'gpa_4',
    subjects: [
      { code: 'DAI-01', name: 'Machine Learning & Mô hình Dự báo', credits: 3 },
      { code: 'DAI-02', name: 'Phân tích Dữ liệu lớn (Big Data Analytics)', credits: 3 },
      { code: 'DAI-03', name: 'Tự động hóa Quy trình với Generative AI', credits: 3 },
      { code: 'DAI-04', name: 'Đồ án Triển khai Hệ thống AI', credits: 6 },
    ],
  },
  bba_core: {
    label: 'Quản trị Kinh doanh Nền tảng (Business Core — Hệ 10.0)',
    scale: 'scale_10',
    subjects: [
      { code: 'BUS-01', name: 'Nguyên lý Quản trị Hiện đại', credits: 3 },
      { code: 'BUS-02', name: 'Kế toán Quản trị & Kiểm soát Chi phí', credits: 3 },
      { code: 'BUS-03', name: 'Quản lý Dự án Chuyên nghiệp', credits: 3 },
      { code: 'BUS-04', name: 'Quản trị Nhân sự & Văn hóa Tổ chức', credits: 3 },
    ],
  },
};

export const ONE_ON_ONE_SLOTS: ReadonlyArray<string> = [
  'Thứ 2 (13:30 - 14:00)',
  'Thứ 3 (14:00 - 14:30)',
  'Thứ 4 (19:00 - 19:30)',
  'Thứ 5 (19:30 - 20:00)',
  'Thứ 6 (20:00 - 20:30)',
  'Thứ 7 (09:00 - 09:30)',
];
