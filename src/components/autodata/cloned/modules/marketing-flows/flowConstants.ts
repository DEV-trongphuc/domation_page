export type FlowNodeType11 =
  | 'send_email'
  | 'send_zns'
  | 'wait_delay'
  | 'if_else_condition'
  | 'ab_split'
  | 'add_remove_tag'
  | 'update_lead_score'
  | 'issue_voucher'
  | 'webhook_http'
  | 'notify_internal'
  | 'push_to_autodata_sale_round';

export interface FlowStepNode {
  id: string;
  type: FlowNodeType11;
  label?: string;
  config?: Record<string, unknown>;
  nextStepId?: string | null;
  yesStepId?: string | null;
  noStepId?: string | null;
  pathAStepId?: string | null;
  pathBStepId?: string | null;
}

export interface FlowDefinitionDto {
  id: string;
  name: string;
  description: string;
  status: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  steps: FlowStepNode[];
  version: number;
  enrolled_count: number;
  completed_count: number;
  pushed_to_sale_count: number;
  attributed_revenue_vnd: number;
  updated_at?: string;
}

export interface FlowTraceItem {
  step_id: string;
  node_type: string;
  label: string;
  outcome: string;
  branch?: string;
  timestamp: string;
}

export interface FlowSnapshotItem {
  id: string;
  version: number;
  trigger_type: string;
  review_score: number;
  created_at: string;
}

export const FLOW_TRIGGERS_15: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'form_submitted', label: '1. Điền Biểu mẫu đăng ký (Form Submitted)' },
  { key: 'tag_added', label: '2. Được gắn Nhãn phân loại (Tag Added)' },
  { key: 'audience_joined', label: '3. Đi vào Tệp Data / Tệp Logic (Audience Joined)' },
  { key: 'stage_changed', label: '4. Chuyển bước Pipeline CRM (Stage Changed)' },
  { key: 'email_opened', label: '5. Mở Email chiến dịch (Email Opened)' },
  { key: 'link_clicked', label: '6. Nhấn liên kết Email / Shortlink (Link Clicked)' },
  { key: 'survey_completed', label: '7. Hoàn thành Khảo sát / Quiz (Survey Completed)' },
  { key: 'page_visited', label: '8. Truy cập Website / Trang bảng giá (Page Visited)' },
  { key: 'voucher_redeemed', label: '9. Nhận hoặc Đổi mã Voucher (Voucher Redeemed)' },
  { key: 'purchase_event', label: '10. Phát sinh Mua hàng (Purchase Event)' },
  { key: 'score_threshold', label: '11. Đạt ngưỡng Điểm nóng (Lead Score Threshold)' },
  { key: 'birthday', label: '12. Ngày Sinh nhật / Kỷ niệm (Birthday)' },
  { key: 'inactivity', label: '13. Ngủ đông không tương tác (Inactivity)' },
  { key: 'webhook_received', label: '14. Nhận sự kiện Custom Webhook (Webhook Received)' },
  { key: 'manual_enroll', label: '15. Đưa vào kịch bản thủ công / 1 chạm (Manual Enroll)' },
];

export const FLOW_NODES_11: ReadonlyArray<{
  type: FlowNodeType11;
  label: string;
  desc: string;
  tone: 'primary' | 'info' | 'success' | 'warning' | 'purple';
}> = [
  { type: 'send_email', label: 'Gửi Email tự động', desc: 'Kết xuất mẫu HTML 15 khối qua SES/SMTP Vault', tone: 'primary' },
  { type: 'send_zns', label: 'Gửi tin nhắn Zalo ZNS', desc: 'Gửi thông báo ZNS cá nhân hóa qua Zalo OA', tone: 'info' },
  { type: 'wait_delay', label: 'Chờ theo thời gian', desc: 'Đặt khoảng trễ giờ/ngày trước bước kế tiếp', tone: 'warning' },
  { type: 'if_else_condition', label: 'Rẽ nhánh Điều kiện (If / Else)', desc: 'Kiểm tra Lead Score, Tag, Mở mail -> Đúng / Sai', tone: 'purple' },
  { type: 'ab_split', label: 'Phân luồng A/B Split', desc: 'Tách ngẫu nhiên theo tỉ lệ % sang 2 nhánh A / B', tone: 'purple' },
  { type: 'add_remove_tag', label: 'Gắn / Gỡ Nhãn (Tag)', desc: 'Phân loại tự động trên Hồ sơ 360°', tone: 'info' },
  { type: 'update_lead_score', label: 'Cộng / Trừ Điểm nóng', desc: 'Tăng/giảm Lead Score theo mức độ quan tâm', tone: 'primary' },
  { type: 'issue_voucher', label: 'Cấp Mã Ưu Đãi Voucher', desc: 'Sinh mã ưu đãi độc nhất gắn vào Timeline khách', tone: 'success' },
  { type: 'webhook_http', label: 'Bắn Outbound HTTP Webhook', desc: 'Đồng bộ dữ liệu sang hệ thống bên thứ 3', tone: 'info' },
  { type: 'notify_internal', label: 'Thông báo Nội bộ', desc: 'Báo tin cho Quản lý / Chuyên viên phụ trách', tone: 'warning' },
  {
    type: 'push_to_autodata_sale_round',
    label: 'Đẩy vào Vòng chia Sale Auto Data',
    desc: 'Chuyển marketing_nurture -> unassigned_pending chia số Sale ngay!',
    tone: 'success',
  },
];
