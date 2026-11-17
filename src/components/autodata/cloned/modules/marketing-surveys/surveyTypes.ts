export type SurveyBlockType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'single_choice'
  | 'multi_choice'
  | 'dropdown'
  | 'yes_no'
  | 'quiz_scored'
  | 'branch_jump'
  | 'nps'
  | 'csat_stars'
  | 'likert_matrix'
  | 'slider'
  | 'emoji_rating'
  | 'ranking'
  | 'matrix_multi'
  | 'file_upload'
  | 'section_header'
  | 'image_block'
  | 'banner_block'
  | 'divider'
  | 'page_break';

export const END_SURVEY_TARGET = '__END_SURVEY__';

export interface BlockCatalogEntry {
  type: SurveyBlockType;
  group: string;
  label: string;
  hint: string;
  isLayout?: boolean;
}

export const SURVEY_25_BLOCKS: ReadonlyArray<BlockCatalogEntry> = [
  { type: 'short_text', group: 'Cơ bản', label: 'Văn bản ngắn (1 dòng)', hint: 'Họ tên, Chức danh, Công ty' },
  { type: 'long_text', group: 'Cơ bản', label: 'Văn bản dài (Đoạn văn)', hint: 'Ý kiến góp ý chi tiết' },
  { type: 'email', group: 'Cơ bản', label: 'Địa chỉ Email', hint: 'Kiểm tra định dạng Email' },
  { type: 'phone', group: 'Cơ bản', label: 'Số điện thoại', hint: 'Định danh SĐT / Zalo' },
  { type: 'number', group: 'Cơ bản', label: 'Con số định lượng', hint: 'Quy mô, Ngân sách, Số lượng' },
  { type: 'date', group: 'Cơ bản', label: 'Ngày tháng', hint: 'Chọn ngày triển khai / hẹn' },
  { type: 'single_choice', group: 'Lựa chọn', label: 'Chọn 1 đáp án (Radio)', hint: 'Hỗ trợ rẽ nhánh theo đáp án' },
  { type: 'multi_choice', group: 'Lựa chọn', label: 'Chọn nhiều đáp án (Checkbox)', hint: 'Chọn đa tiêu chí' },
  { type: 'dropdown', group: 'Lựa chọn', label: 'Danh sách thả xuống (Dropdown)', hint: 'Gọn gàng cho nhiều phương án' },
  { type: 'yes_no', group: 'Lựa chọn', label: 'Có / Không', hint: '2 nút quyết định nhanh + Rẽ nhánh' },
  { type: 'quiz_scored', group: 'Chấm điểm & Rẽ nhánh', label: 'Trắc nghiệm tính điểm (Quiz)', hint: 'Đáp án đúng & Điểm từng phương án' },
  { type: 'branch_jump', group: 'Chấm điểm & Rẽ nhánh', label: 'Điều hướng Rẽ nhánh (Branch Jump)', hint: 'Phân luồng kịch bản theo nhu cầu' },
  { type: 'nps', group: 'Đánh giá', label: 'Chỉ số NPS (0–10)', hint: 'Promoters / Passives / Detractors' },
  { type: 'csat_stars', group: 'Đánh giá', label: 'Đánh giá CSAT Sao (1–5)', hint: 'Thang 1 đến 5 sao hài lòng' },
  { type: 'likert_matrix', group: 'Đánh giá', label: 'Ma trận Thang đo Likert', hint: 'Đánh giá mức độ đồng ý theo hàng' },
  { type: 'slider', group: 'Đánh giá', label: 'Thanh kéo Giá trị (Slider)', hint: 'Kéo chọn giá trị trong khoảng' },
  { type: 'emoji_rating', group: 'Đánh giá', label: 'Biểu tượng Cảm xúc (Emoji)', hint: '5 mức biểu cảm trực quan' },
  { type: 'ranking', group: 'Nâng cao', label: 'Xếp hạng Ưu tiên (Ranking)', hint: 'Sắp xếp thứ tự ưu tiên 1..N' },
  { type: 'matrix_multi', group: 'Nâng cao', label: 'Ma trận Đa lựa chọn', hint: 'Chọn nhiều ô trên mỗi hàng' },
  { type: 'file_upload', group: 'Nâng cao', label: 'Tải tệp đính kèm', hint: 'Đính kèm hình ảnh / tài liệu PDF' },
  { type: 'section_header', group: 'Bố cục', label: 'Tiêu đề Phân đoạn', hint: 'Phân nhóm nội dung câu hỏi', isLayout: true },
  { type: 'image_block', group: 'Bố cục', label: 'Hình ảnh Minh họa', hint: 'Hiển thị ảnh sản phẩm / sơ đồ', isLayout: true },
  { type: 'banner_block', group: 'Bố cục', label: 'Banner Thương hiệu', hint: 'Khối Hero phủ màu & thông điệp', isLayout: true },
  { type: 'divider', group: 'Bố cục', label: 'Đường kẻ Phân cách', hint: 'Tách biệt các vùng câu hỏi', isLayout: true },
  { type: 'page_break', group: 'Bố cục', label: 'Ngắt Trang (Multi-Step)', hint: 'Chia khảo sát nhiều bước + Rẽ nhánh', isLayout: true },
];

export const LAYOUT_BLOCK_TYPES: ReadonlySet<string> = new Set([
  'section_header',
  'image_block',
  'banner_block',
  'divider',
  'page_break',
]);

export const CHOICE_CAPABLE_TYPES: ReadonlySet<string> = new Set([
  'single_choice',
  'multi_choice',
  'dropdown',
  'yes_no',
  'quiz_scored',
  'branch_jump',
  'ranking',
]);

export const BRANCHING_CAPABLE_TYPES: ReadonlySet<string> = new Set([
  'single_choice',
  'dropdown',
  'yes_no',
  'quiz_scored',
  'branch_jump',
]);

export interface SurveyOptionItem {
  id: string;
  label: string;
  value: string;
  points?: number;
  jumpToBlockId?: string;
}

export interface SurveyAxisItem {
  id: string;
  label: string;
}

export interface SurveyBlockDto {
  id: string;
  type: SurveyBlockType | string;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  points?: number;
  correctValue?: string;
  tagOnAnswer?: string;
  options?: SurveyOptionItem[];
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  step?: number;
  emojis?: string[];
  matrixRows?: SurveyAxisItem[];
  matrixCols?: SurveyAxisItem[];
  acceptedTypes?: string[];
  maxFileSizeMB?: number;
  imageUrl?: string;
  imageWidth?: '50%' | '75%' | '100%';
  bannerImageUrl?: string;
  bannerHeight?: number;
  defaultJumpToBlockId?: string;
}

export interface ScoreRedirectRule {
  id: string;
  minScore: number;
  maxScore: number;
  thankYouTitle: string;
  thankYouMessage?: string;
  redirectUrl?: string;
  assignTag?: string;
  voucherCampaignId?: string;
}

export interface SurveyThemeDto {
  primaryColor: string;
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  borderRadius: string;
  coverStyle: 'minimal' | 'gradient' | 'image';
  coverBadge?: string;
  coverImageUrl?: string;
  coverCountdown?: string;
}

export interface SurveySettingsDto {
  auto_tag?: string;
  base_lead_score?: number;
  target_audience_id?: string | null;
  show_progress_bar?: boolean;
  time_limit_minutes?: number | null;
  thank_you_title?: string;
  thank_you_message?: string;
  thank_you_cta_label?: string;
  thank_you_cta_url?: string;
  redirect_rules?: ScoreRedirectRule[];
}

export interface SurveyItemDto {
  id: string;
  tenant_id?: string;
  title: string;
  slug: string;
  description: string;
  survey_type: 'survey' | 'quiz' | 'nps';
  status: string;
  company_name?: string;
  blocks: SurveyBlockDto[];
  theme: SurveyThemeDto;
  settings: SurveySettingsDto;
  redirect_rules?: ScoreRedirectRule[];
  response_count: number;
  avg_score: number;
  created_at?: string;
  updated_at?: string;
}

export interface AudienceRefDto {
  id: string;
  name: string;
}

export interface VoucherCampaignRefDto {
  id: string;
  name: string;
  code_prefix?: string;
  discount_type?: string;
  discount_value?: number;
  status?: string;
}

export interface SurveysOverviewResponse {
  items?: Array<Record<string, unknown>>;
  block_catalog?: BlockCatalogEntry[];
  audiences?: AudienceRefDto[];
  voucher_campaigns?: VoucherCampaignRefDto[];
}

export interface SurveyRespondentDto {
  id: string;
  lead_id?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  lead_score?: number;
  quiz_score: number;
  nps_score: number | null;
  tags_applied: string[];
  voucher_code?: string | null;
  answers: Record<string, unknown>;
  created_at?: string;
}

export interface QuestionOptionStat {
  label: string;
  value: string;
  count: number;
  percentage: number;
}

export interface QuestionCrossTabStat {
  blockId: string;
  label: string;
  type: string;
  totalAnswered: number;
  avgNumber?: number;
  options: QuestionOptionStat[];
  sampleTexts: string[];
}

export interface SurveyAnalyticsPayload {
  survey: Record<string, unknown>;
  summary: {
    total_responses: number;
    avg_quiz_score: number;
    nps_index: number;
    promoters: number;
    passives: number;
    detractors: number;
  };
  question_stats?: Array<Record<string, unknown>>;
  score_distribution?: Array<{ bucket: string; count: number }>;
  responses: SurveyRespondentDto[];
}

export interface PublicSurveySubmitResponse {
  response_id: string;
  survey_id: string;
  lead_id?: string | null;
  quiz_score: number;
  max_score?: number;
  nps_score: number | null;
  tags_applied: string[];
  voucher_code?: string | null;
  reward_voucher_code?: string | null;
  redirect_url?: string | null;
  thank_you_title?: string | null;
  thank_you_message?: string | null;
}

export const DEFAULT_SURVEY_THEME: SurveyThemeDto = {
  primaryColor: '#1E40FF',
  backgroundColor: '#F8F9FA',
  cardBackground: '#FFFFFF',
  textColor: '#0F172A',
  borderRadius: '16px',
  coverStyle: 'gradient',
  coverBadge: 'DOMATION SURVEY STUDIO',
  coverImageUrl: '',
  coverCountdown: '',
};

export const DEFAULT_SURVEY_SETTINGS: SurveySettingsDto = {
  auto_tag: 'Đã Khảo Sát',
  base_lead_score: 10,
  target_audience_id: null,
  show_progress_bar: true,
  time_limit_minutes: null,
  thank_you_title: 'Cảm ơn bạn đã hoàn thành khảo sát!',
  thank_you_message: 'Phản hồi của bạn đã được ghi nhận thành công.',
  thank_you_cta_label: '',
  thank_you_cta_url: '',
  redirect_rules: [],
};

export {
  createDefaultSurveyBlock,
  normalizeBlockType,
  normalizeSurveyDto,
} from './surveyFactory';
