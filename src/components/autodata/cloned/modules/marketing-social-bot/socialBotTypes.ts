export type SocialChannelKey = 'messenger' | 'zalo_oa' | 'web_chat';
export type SocialChannelFilter = 'all' | SocialChannelKey;

export interface FaqRuleDto {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
}

export interface BotConfigDto {
  id?: string;
  bot_name: string;
  brand_persona: string;
  welcome_message: string;
  channels?: string[];
  faq_rules: FaqRuleDto[];
  auto_extract_contact: boolean;
  routing_mode: 'none' | 'audience' | 'sale_round';
  target_audience_id: string | null;
  distribution_round_id: string | null;
  is_active: boolean;
}

export interface ConversationSummaryDto {
  id: string;
  channel: SocialChannelKey;
  external_thread_id?: string;
  customer_name: string;
  extracted_phone: string | null;
  extracted_email: string | null;
  lead_id: string | null;
  lead_name?: string | null;
  lead_score?: number;
  bot_paused?: boolean;
  unread_count?: number;
  status: string;
  last_message_preview: string;
  last_message_at?: string;
}

export interface MessageItemDto {
  id: string;
  sender_type: 'customer' | 'bot' | 'agent';
  sender_name: string;
  content: string;
  extracted_entities?: {
    phone?: string | null;
    email?: string | null;
  };
  created_at?: string;
}

export interface Customer360TagDto {
  name: string;
  color_hex?: string;
}

export interface Customer360Dto {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status: string;
  lead_score: number;
  stage_name?: string;
  tags?: Customer360TagDto[];
}

export interface ConversationTimelineItemDto {
  id: string;
  event_type?: string;
  title: string;
  content?: string;
  created_at?: string;
}

export interface ConversationDetailResponse {
  conversation: ConversationSummaryDto;
  messages: MessageItemDto[];
  customer_360: Customer360Dto | null;
  timeline: ConversationTimelineItemDto[];
}

export type ScenarioTriggerType =
  | 'keyword'
  | 'comment_to_inbox'
  | 'welcome'
  | 'ice_breaker'
  | 'postback';

export type ScenarioNodeKind =
  | 'message'
  | 'button'
  | 'tag'
  | 'collect_phone'
  | 'handoff';

export interface ScenarioNodeButtonDto {
  id: string;
  label: string;
  action_type: 'next_node' | 'url';
  next_node_id?: string;
  url?: string;
}

export interface ScenarioNodeDto {
  id: string;
  kind: ScenarioNodeKind;
  title: string;
  content: string;
  tag_name?: string;
  next_node_id?: string;
  buttons?: ScenarioNodeButtonDto[];
}

export interface ScenarioEdgeDto {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface AutomationScenarioDto {
  id: string;
  name: string;
  channel: 'messenger' | 'zalo_oa' | 'web_chat' | 'omnichannel';
  trigger_type: ScenarioTriggerType;
  keywords: string[];
  nodes: ScenarioNodeDto[];
  edges: ScenarioEdgeDto[];
  is_active: boolean;
  matched_count: number;
  converted_count: number;
  updated_at?: string;
}

export interface ZaloOaConfigDto {
  id?: string | null;
  oa_id: string;
  oa_name: string;
  app_id: string;
  status: string;
  daily_quota: number;
  sent_today: number;
  quality_rating: string;
  webhook_secret?: string | null;
}

export interface ZaloTemplateParamDto {
  key: string;
  crm_field: 'name' | 'phone' | 'email' | 'custom';
  sample_value: string;
}

export interface ZaloTemplateButtonDto {
  title: string;
  url: string;
}

export interface ZaloTemplateDto {
  id: string;
  oa_id?: string | null;
  template_code: string;
  name: string;
  template_type: 'zns_transaction' | 'zns_otp' | 'zns_promotion' | 'zbs_broadcast';
  status: string;
  price_vnd: number;
  content_body: string;
  params_schema: ZaloTemplateParamDto[];
  buttons: ZaloTemplateButtonDto[];
  sent_count: number;
  delivered_count: number;
  updated_at?: string;
}

export type TrainingDocType = 'faq' | 'policy' | 'url' | 'pdf' | 'product';

export interface TrainingDocDto {
  id: string;
  title: string;
  doc_type: TrainingDocType;
  source_url?: string | null;
  content_text: string;
  chunk_count: number;
  token_count: number;
  status: string;
  updated_at?: string;
}

export interface BotTestResultDto {
  bot_name: string;
  extracted_entities: {
    phone: string | null;
    email: string | null;
  };
  matched_question: string | null;
  reply: string;
}

export const FAST_REPLY_SNIPPETS: ReadonlyArray<{ label: string; text: string }> = [
  {
    label: 'Xin SĐT báo giá',
    text: 'Dạ anh/chị vui lòng cho DOM Agent xin Số điện thoại hoặc Zalo để chuyên viên gửi bảng giá ưu đãi chi tiết ngay ạ!',
  },
  {
    label: 'Xác nhận lịch Demo',
    text: 'Cảm ơn anh/chị! Đội ngũ đã ghi nhận lịch hẹn Demo 1-1 và sẽ liên hệ xác nhận trước 15 phút ạ.',
  },
  {
    label: 'Gửi mã Voucher',
    text: 'DOM Agent xin gửi tặng anh/chị mã ưu đãi đặc biệt áp dụng trực tiếp cho đơn hàng trong tuần này nhé!',
  },
];

export const DEFAULT_SCENARIO_NODES: ScenarioNodeDto[] = [
  {
    id: 'node_welcome',
    kind: 'button',
    title: 'Lời chào & Menu chọn nhu cầu',
    content: 'Xin chào! DOM Agent có thể hỗ trợ thông tin nào cho bạn hôm nay?',
    buttons: [
      { id: 'btn_price', label: 'Nhận Bảng Giá', action_type: 'next_node', next_node_id: 'node_collect' },
      { id: 'btn_agent', label: 'Gặp Chuyên Viên', action_type: 'next_node', next_node_id: 'node_handoff' },
    ],
  },
  {
    id: 'node_collect',
    kind: 'collect_phone',
    title: 'Thu thập SĐT & Khâu Hồ sơ 360°',
    content: 'Bạn vui lòng để lại Số điện thoại hoặc Email để hệ thống gửi báo giá PDF ngay nhé!',
    next_node_id: 'node_tag_vip',
  },
  {
    id: 'node_tag_vip',
    kind: 'tag',
    title: 'Gắn nhãn Quan tâm Bảng giá',
    content: 'Tự động gắn nhãn CRM cho khách hàng tiềm năng.',
    tag_name: 'Quan tâm Báo giá Social',
  },
  {
    id: 'node_handoff',
    kind: 'handoff',
    title: 'Tạm dừng AI & Chuyển Nhân viên CSKH',
    content: 'Đang kết nối bạn với chuyên viên tư vấn trực tuyến...',
  },
];

export function buildEdgesFromScenarioNodes(nodes: ScenarioNodeDto[]): ScenarioEdgeDto[] {
  const edges: ScenarioEdgeDto[] = [];
  for (const n of nodes) {
    if (n.next_node_id) {
      edges.push({
        id: `e_${n.id}_${n.next_node_id}`,
        source: n.id,
        target: n.next_node_id,
      });
    }
    for (const b of n.buttons || []) {
      if (b.action_type === 'next_node' && b.next_node_id) {
        edges.push({
          id: `eb_${n.id}_${b.id}_${b.next_node_id}`,
          source: n.id,
          target: b.next_node_id,
          label: b.label,
        });
      }
    }
  }
  return edges;
}

export function interpolateZaloTemplateBody(
  body: string,
  params: ZaloTemplateParamDto[]
): string {
  let out = body || '';
  for (const p of params) {
    if (!p.key) continue;
    const tokenRegex = new RegExp(`\\{\\{\\s*${p.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g');
    out = out.replace(tokenRegex, p.sample_value || `[${p.key}]`);
  }
  return out;
}
