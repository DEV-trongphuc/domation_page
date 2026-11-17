import {
  DEFAULT_SURVEY_SETTINGS,
  DEFAULT_SURVEY_THEME,
  END_SURVEY_TARGET,
  SURVEY_25_BLOCKS,
  type ScoreRedirectRule,
  type SurveyBlockDto,
  type SurveyBlockType,
  type SurveyItemDto,
  type SurveySettingsDto,
  type SurveyThemeDto,
} from './surveyTypes';

export function normalizeBlockType(rawType: string): SurveyBlockType {
  if (rawType === 'star_rating') return 'csat_stars';
  if (rawType === 'likert' || rawType === 'matrix_single') return 'likert_matrix';
  const found = SURVEY_25_BLOCKS.find((b) => b.type === rawType);
  return found ? found.type : 'short_text';
}

export function createDefaultSurveyBlock(type: SurveyBlockType): SurveyBlockDto {
  const meta = SURVEY_25_BLOCKS.find((b) => b.type === type);
  const base: SurveyBlockDto = {
    id: crypto.randomUUID(),
    type,
    label: meta?.label || 'Câu hỏi mới',
    required: false,
  };

  switch (type) {
    case 'single_choice':
    case 'multi_choice':
    case 'dropdown':
    case 'ranking':
      return {
        ...base,
        options: [
          { id: crypto.randomUUID(), label: 'Phương án A', value: 'phuong_an_a', points: 5 },
          { id: crypto.randomUUID(), label: 'Phương án B', value: 'phuong_an_b', points: 10 },
          { id: crypto.randomUUID(), label: 'Phương án C', value: 'phuong_an_c', points: 15 },
        ],
      };
    case 'yes_no':
      return {
        ...base,
        label: 'Bạn có muốn nhận tư vấn giải pháp 1-1 ngay trong tuần này?',
        options: [
          { id: crypto.randomUUID(), label: 'Có, liên hệ ngay', value: 'yes', points: 15 },
          { id: crypto.randomUUID(), label: 'Chưa cần lúc này', value: 'no', points: 0 },
        ],
      };
    case 'quiz_scored':
      return {
        ...base,
        label: 'Ngân sách dự kiến triển khai của doanh nghiệp trong quý này?',
        points: 20,
        correctValue: 'enterprise',
        options: [
          { id: crypto.randomUUID(), label: 'Dưới 20 triệu VNĐ', value: 'starter', points: 5 },
          { id: crypto.randomUUID(), label: 'Từ 20 – 100 triệu VNĐ', value: 'growth', points: 15 },
          { id: crypto.randomUUID(), label: 'Trên 100 triệu VNĐ (VIP)', value: 'enterprise', points: 30 },
        ],
      };
    case 'branch_jump':
      return {
        ...base,
        label: 'Vai trò hiện tại của bạn trong doanh nghiệp là gì?',
        options: [
          { id: crypto.randomUUID(), label: 'CEO / Chủ doanh nghiệp', value: 'ceo', points: 20 },
          { id: crypto.randomUUID(), label: 'Giám đốc Kinh doanh / Marketing', value: 'director', points: 15 },
          { id: crypto.randomUUID(), label: 'Chuyên viên tìm hiểu tài liệu', value: 'staff', points: 5, jumpToBlockId: END_SURVEY_TARGET },
        ],
      };
    case 'nps':
      return {
        ...base,
        label: 'Bạn sẵn sàng giới thiệu dịch vụ của chúng tôi cho đồng nghiệp ở mức nào (0–10)?',
        required: true,
        minValue: 0,
        maxValue: 10,
        minLabel: 'Rất không hài lòng',
        maxLabel: 'Chắc chắn giới thiệu',
      };
    case 'csat_stars':
      return { ...base, label: 'Bạn đánh giá mức độ hài lòng với chất lượng hỗ trợ như thế nào?', minValue: 1, maxValue: 5 };
    case 'likert_matrix':
    case 'matrix_multi':
      return {
        ...base,
        label: 'Vui lòng đánh giá các tiêu chí trải nghiệm dưới đây:',
        matrixRows: [
          { id: crypto.randomUUID(), label: 'Tốc độ phản hồi tư vấn' },
          { id: crypto.randomUUID(), label: 'Tính năng tự động hóa' },
        ],
        matrixCols: [
          { id: crypto.randomUUID(), label: 'Chưa tốt' },
          { id: crypto.randomUUID(), label: 'Bình thường' },
          { id: crypto.randomUUID(), label: 'Hài lòng' },
          { id: crypto.randomUUID(), label: 'Xuất sắc' },
        ],
      };
    case 'slider':
      return { ...base, label: 'Quy mô nhân sự dự kiến sử dụng hệ thống?', minValue: 5, maxValue: 200, step: 5, minLabel: '5 người', maxLabel: '200+ người' };
    case 'emoji_rating':
      return { ...base, label: 'Cảm nhận nhanh của bạn về buổi trải nghiệm hôm nay?', emojis: ['😠', '😕', '😐', '🙂', '🤩'] };
    case 'file_upload':
      return { ...base, label: 'Đính kèm tài liệu yêu cầu báo giá / RFP (Tùy chọn)', acceptedTypes: ['.pdf', '.png', '.jpg', '.docx'], maxFileSizeMB: 5 };
    case 'section_header':
      return { ...base, label: 'Phần II — Thông tin nhu cầu triển khai', description: 'Giúp đội ngũ chuyên gia chuẩn bị bản Demo sát nhất với bài toán của bạn.' };
    case 'image_block':
      return { ...base, label: 'Hình ảnh minh họa', imageUrl: '', imageWidth: '100%' };
    case 'banner_block':
      return { ...base, label: 'Ưu đãi dành riêng cho khách hàng hoàn thành khảo sát', description: 'Nhận ngay Voucher ưu đãi triển khai khi hoàn tất 2 phút khảo sát.', bannerHeight: 150 };
    default:
      return base;
  }
}

export function normalizeSurveyDto(raw: Record<string, unknown>): SurveyItemDto {
  const rawTheme = (raw.theme && typeof raw.theme === 'object' ? raw.theme : {}) as Record<string, unknown>;
  const rawSettings = (raw.settings && typeof raw.settings === 'object' ? raw.settings : {}) as Record<string, unknown>;
  const rawBlocks = Array.isArray(raw.blocks) ? raw.blocks : [];

  const primaryRaw = typeof rawTheme.primaryColor === 'string' && rawTheme.primaryColor ? rawTheme.primaryColor : '#1E40FF';
  const safePrimary = /^#bd1d/i.test(primaryRaw) ? '#1E40FF' : primaryRaw;

  const topRules = Array.isArray(raw.redirect_rules) ? (raw.redirect_rules as ScoreRedirectRule[]) : undefined;
  const settingsRules = Array.isArray(rawSettings.redirect_rules)
    ? (rawSettings.redirect_rules as ScoreRedirectRule[])
    : topRules || [];

  return {
    id: String(raw.id || ''),
    tenant_id: raw.tenant_id ? String(raw.tenant_id) : undefined,
    title: String(raw.title || raw.name || 'Khảo sát chưa đặt tên'),
    slug: String(raw.slug || ''),
    description: raw.description ? String(raw.description) : '',
    survey_type: raw.survey_type === 'quiz' ? 'quiz' : raw.survey_type === 'nps' ? 'nps' : 'survey',
    status: String(raw.status || 'active'),
    company_name: raw.company_name ? String(raw.company_name) : undefined,
    blocks: rawBlocks.map((b, idx) => {
      const obj = (b && typeof b === 'object' ? b : {}) as Record<string, unknown>;
      const normType = normalizeBlockType(String(obj.type || 'short_text'));
      return {
        ...(obj as unknown as SurveyBlockDto),
        id: String(obj.id || `blk_${idx + 1}`),
        type: normType,
        label: String(obj.label || `Câu hỏi #${idx + 1}`),
      };
    }),
    theme: {
      ...DEFAULT_SURVEY_THEME,
      ...(rawTheme as Partial<SurveyThemeDto>),
      primaryColor: safePrimary,
    },
    settings: {
      ...DEFAULT_SURVEY_SETTINGS,
      ...(rawSettings as Partial<SurveySettingsDto>),
      redirect_rules: settingsRules,
    },
    redirect_rules: settingsRules,
    response_count: Number(raw.response_count || 0),
    avg_score: Number(raw.avg_score || 0),
    created_at: raw.created_at ? String(raw.created_at) : undefined,
    updated_at: raw.updated_at ? String(raw.updated_at) : undefined,
  };
}
