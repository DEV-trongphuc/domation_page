import type { AnnouncementTypeKey } from './educationTypes';

export function applyAcademicMergeTags(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [k, v] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'gi');
    result = result.replace(pattern, v);
  }
  return result;
}

export function buildDefaultAcademicTemplate(params: {
  type: AnnouncementTypeKey;
  academyName: string;
  courseName: string;
  classCode: string;
  subjectName: string;
  instructorName: string;
  studentName: string;
  zoomLink: string;
  domAgentLink: string;
  deadlineStr: string;
  selectedSlots: ReadonlyArray<string>;
}): { title: string; html: string; zaloText: string } {
  const {
    type,
    academyName,
    courseName,
    classCode,
    subjectName,
    instructorName,
    studentName,
    zoomLink,
    domAgentLink,
    deadlineStr,
    selectedSlots,
  } = params;

  if (type === 'lecturer_invitation') {
    const slotsBadges =
      selectedSlots.length > 0
        ? selectedSlots
            .map((s) => `<li style="margin-bottom:4px;">Khung giờ cố vấn 1-1: <strong>${s}</strong> (30 phút/ca)</li>`)
            .join('')
        : '<li>Linh hoạt theo lịch đăng ký hướng dẫn 1-1 của Học viên</li>';
    return {
      title: `[${academyName}] Thư Mời Giảng & Lịch Hướng Dẫn 1-on-1 — ${subjectName} (${classCode})`,
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;color:#0F172A;line-height:1.6;">
  <div style="background:linear-gradient(135deg,#1E40FF 0%,#0284C7 100%);padding:20px 24px;color:#FFFFFF;">
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;opacity:0.9;">${academyName} • Ban Học Vụ</div>
    <div style="font-size:18px;font-weight:800;margin-top:4px;">Thư Mời Giảng Chuyên Đề: {{subject_name}}</div>
  </div>
  <div style="padding:22px 24px;font-size:14px;">
    <p>Kính gửi Giảng viên <strong>{{instructor_name}}</strong>,</p>
    <p><strong>${academyName}</strong> trân trọng kính mời Thầy/Cô tham gia giảng dạy và hướng dẫn chuyên môn học phần <strong>{{subject_name}}</strong> thuộc chương trình <strong>{{course_name}}</strong> (Lớp <strong>{{class_code}}</strong>).</p>
    <div style="padding:14px 16px;border-radius:12px;background:#F8FAFF;border:1px solid #DBEAFE;margin:14px 0;">
      <div style="font-weight:700;color:#1E40FF;margin-bottom:6px;">Thông tin Lớp học & Khung giờ 1-on-1:</div>
      <ul style="margin:0;padding-left:18px;">
        <li>Phòng học trực tuyến: <a href="{{zoom_link}}" style="color:#1E40FF;font-weight:700;">{{zoom_link}}</a></li>
        <li>Hạn gửi Đề cương bài giảng (Teaching Plan): <strong>${deadlineStr || 'Trước ngày khai giảng 05 ngày'}</strong></li>
        ${slotsBadges}
      </ul>
    </div>
    <p>Trợ lý học thuật số <strong>DOM Agent</strong> đã được kích hoạt tại <a href="{{dom_agent_link}}" style="color:#1E40FF;font-weight:700;">{{dom_agent_link}}</a> để hỗ trợ tổng hợp câu hỏi của học viên trước buổi học.</p>
    <p style="margin-bottom:0;">Trân trọng cảm ơn sự đồng hành của Quý Thầy/Cô,<br/><strong>Ban Học Vụ — ${academyName}</strong></p>
  </div>
</div>`,
      zaloText: `[${academyName}] Kính gửi GV ${instructorName}, Ban Học vụ xin gửi Thư mời giảng môn ${subjectName} (${classCode}). Link lớp: ${zoomLink}`,
    };
  }

  if (type === 'onboarding') {
    return {
      title: `[${academyName}] Thư Tiếp Nhận Học Viên & Hướng Dẫn Nhập Học — ${courseName}`,
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;color:#0F172A;line-height:1.6;">
  <div style="background:linear-gradient(135deg,#1E40FF 0%,#06B6D4 100%);padding:20px 24px;color:#FFFFFF;">
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;opacity:0.9;">Chào mừng Tân Học Viên • ${academyName}</div>
    <div style="font-size:18px;font-weight:800;margin-top:4px;">Xác Nhận Nhập Học Chính Thức — Lớp {{class_code}}</div>
  </div>
  <div style="padding:22px 24px;font-size:14px;">
    <p>Thân gửi Học viên <strong>{{student_name}}</strong>,</p>
    <p>Chúc mừng Anh/Chị đã hoàn tất thủ tục ghi danh chương trình <strong>{{course_name}}</strong> tại <strong>${academyName}</strong>!</p>
    <div style="padding:14px 16px;border-radius:12px;background:#F8FAFF;border:1px solid #DBEAFE;margin:14px 0;">
      <div>• Mã lớp theo học: <strong>{{class_code}}</strong></div>
      <div>• Phòng học trực tuyến: <a href="{{zoom_link}}" style="color:#1E40FF;font-weight:700;">{{zoom_link}}</a></div>
      <div>• Trợ lý học tập AI 24/7 (<strong>DOM Agent</strong>): <a href="{{dom_agent_link}}" style="color:#1E40FF;font-weight:700;">{{dom_agent_link}}</a></div>
    </div>
    <p style="margin-bottom:0;">Chúc Anh/Chị một hành trình học tập bứt phá!<br/><strong>Phòng Công Tác Học Viên — ${academyName}</strong></p>
  </div>
</div>`,
      zaloText: `[${academyName}] Chào mừng HV ${studentName || '{{student_name}}'} gia nhập lớp ${classCode} (${courseName})! Link lớp học: ${zoomLink} | Trợ lý DOM Agent: ${domAgentLink}`,
    };
  }

  return {
    title: `[${academyName}] Thông Báo Lịch Học Chuyên Đề: ${subjectName} (${classCode})`,
    html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;color:#0F172A;line-height:1.6;">
  <div style="background:linear-gradient(135deg,#1E40FF 0%,#2563EB 100%);padding:20px 24px;color:#FFFFFF;">
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;opacity:0.9;">Thông Báo Chuyên Đề Môn Học • ${classCode}</div>
    <div style="font-size:18px;font-weight:800;margin-top:4px;">{{subject_name}} — {{course_name}}</div>
  </div>
  <div style="padding:22px 24px;font-size:14px;">
    <p>Thân gửi Anh/Chị Học viên lớp <strong>{{class_code}}</strong>,</p>
    <p>Ban Học vụ <strong>${academyName}</strong> trân trọng thông báo lịch học chuyên đề môn <strong>{{subject_name}}</strong> do Giảng viên <strong>{{instructor_name}}</strong> phụ trách:</p>
    <div style="padding:14px 16px;border-radius:12px;background:#F8FAFF;border:1px solid #DBEAFE;margin:14px 0;">
      <div>• Giảng viên hướng dẫn: <strong>{{instructor_name}}</strong></div>
      <div>• Link vào lớp trực tuyến: <a href="{{zoom_link}}" style="color:#1E40FF;font-weight:700;">{{zoom_link}}</a></div>
      <div>• Ôn tập & Hỏi đáp cùng <strong>DOM Agent</strong>: <a href="{{dom_agent_link}}" style="color:#1E40FF;font-weight:700;">{{dom_agent_link}}</a></div>
    </div>
    <p style="margin-bottom:0;">Anh/Chị vui lòng đăng nhập trước 10 phút để ổn định kết nối.<br/><strong>Ban Học Vụ — ${academyName}</strong></p>
  </div>
</div>`,
    zaloText: `[${academyName}] Thông báo lịch học môn ${subjectName} (Lớp ${classCode}) cùng GV ${instructorName}. Link vào lớp: ${zoomLink}`,
  };
}
