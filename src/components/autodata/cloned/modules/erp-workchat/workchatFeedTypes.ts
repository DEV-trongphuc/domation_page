export type FeedReactionType = 'like' | 'love' | 'haha' | 'rocket' | 'clap' | 'flex';

export interface FeedReactionMeta {
  type: FeedReactionType;
  emoji: string;
  label: string;
  color: string;
  bg: string;
}

export const FEED_REACTION_TYPES: ReadonlyArray<FeedReactionMeta> = [
  { type: 'like', emoji: '👍', label: 'Thích', color: '#1E40FF', bg: 'rgba(30, 64, 255, 0.10)' },
  { type: 'love', emoji: '❤️', label: 'Yêu thích', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.10)' },
  { type: 'haha', emoji: '😂', label: 'Vui vẻ', color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)' },
  { type: 'rocket', emoji: '🚀', label: 'Đẩy tiến độ', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.10)' },
  { type: 'clap', emoji: '👏', label: 'Tuyệt vời', color: '#DB2777', bg: 'rgba(219, 39, 119, 0.10)' },
  { type: 'flex', emoji: '💪', label: 'Đồng lòng', color: '#059669', bg: 'rgba(5, 150, 105, 0.10)' },
];

export type FeedPostCategory = 'announcement' | 'update' | 'policy' | 'celebration';

export const FEED_POST_CATEGORIES: ReadonlyArray<{
  key: FeedPostCategory;
  label: string;
  tone: 'primary' | 'info' | 'warning' | 'success';
}> = [
  { key: 'announcement', label: 'Thông báo điều hành', tone: 'primary' },
  { key: 'update', label: 'Cập nhật tiến độ', tone: 'info' },
  { key: 'policy', label: 'Chính sách & Quy định', tone: 'warning' },
  { key: 'celebration', label: 'Chào mừng & Tin vui', tone: 'success' },
];

export const KUDOS_BADGE_PRESETS: ReadonlyArray<{
  key: string;
  title: string;
  points: number;
  icon: string;
}> = [
  { key: 'deal_closer', title: 'Chiến binh Chốt Deal Xuất sắc', points: 30, icon: '🎯' },
  { key: 'team_player', title: 'Tinh thần Đồng đội Tuyệt vời', points: 20, icon: '🤝' },
  { key: 'innovator', title: 'Sáng kiến Tối ưu Đột phá', points: 25, icon: '💡' },
  { key: 'customer_hero', title: 'Tận tâm Phục vụ Khách hàng', points: 20, icon: '💖' },
  { key: 'speed_kpi', title: 'Vượt KPI Thần tốc', points: 35, icon: '🚀' },
];

export interface FeedAttachmentCard {
  kind: 'link' | 'document' | 'erp_ref';
  title: string;
  url?: string;
  code?: string;
}

export interface FeedPostRecord {
  id: string;
  author_user_id?: string | null;
  author_name: string;
  title?: string | null;
  content: string;
  post_type: FeedPostCategory | string;
  branch_id?: string | null;
  branch_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  attachments?: FeedAttachmentCard[];
  reactions?: Record<string, string[]>;
  created_at: string;
}

export interface FeedCommentRecord {
  id: string;
  post_id: string;
  parent_id?: string | null;
  parent_comment_id?: string | null;
  author_user_id?: string | null;
  author_name: string;
  content: string;
  created_at: string;
}

export interface KudosRecognitionRecord {
  id: string;
  sender_user_id?: string | null;
  sender_name: string;
  recipient_user_id: string;
  recipient_name: string;
  badge_key?: string | null;
  badge_title: string;
  points: number;
  message: string;
  created_at: string;
}

export interface KudosLeaderboardRecord {
  rank: number;
  user_id: string;
  full_name: string;
  kudos_count: number;
  total_points: number;
}

export interface MyAccountProfileDto {
  id?: string;
  full_name: string;
  email: string;
  role?: string;
  phone: string;
  dob: string;
  gender: string;
  citizen_id: string;
  address: string;
  bank_name: string;
  bank_account: string;
  bio: string;
  avatar_url: string;
  signature_url: string;
  department_name?: string;
  branch_name?: string;
}

export interface HandoverAssetRecord {
  id: string;
  employee_id?: string | null;
  employee_name?: string | null;
  user_id?: string | null;
  asset_code: string;
  asset_name: string;
  category?: string | null;
  serial_number?: string | null;
  assigned_at?: string | null;
  returned_at?: string | null;
  condition_status?: string | null;
  status: string;
  acknowledged_by_employee?: boolean;
  notes?: string | null;
}

export interface AccountActivityLogRecord {
  id: string;
  action: string;
  module_key?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}
