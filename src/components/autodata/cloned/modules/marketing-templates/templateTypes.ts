export type EmailBlockType15 =
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'columns'
  | 'product_card'
  | 'voucher_box'
  | 'countdown_timer'
  | 'social_links'
  | 'hero_banner'
  | 'testimonial'
  | 'video_thumbnail'
  | 'pricing_card'
  | 'table'
  | 'custom_html';

export type ColumnLayoutPreset = '1' | '2' | '3' | '4' | '50/50' | '33/67' | '67/33';

export interface EmailColumnItem {
  heading?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  widthPct?: number;
  imageUrl?: string;
}

export interface EmailBlockSpacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface EmailBlockBorder {
  width: number;
  style: 'none' | 'solid' | 'dashed' | 'dotted';
  color: string;
  radius: number;
}

export interface EmailBlockTypography {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | '600' | '700' | '800';
  lineHeight?: number;
  letterSpacing?: number;
}

export interface SocialLinkItem {
  network: string;
  url: string;
}

export interface EmailBlockItem {
  id: string;
  type: EmailBlockType15;
  title?: string;
  subtitle?: string;
  content?: string;
  url?: string;
  fallbackUrl?: string;
  imageUrl?: string;
  altText?: string;
  imageWidthPct?: number;
  buttonLabel?: string;
  voucherCode?: string;
  voucherExpiry?: string;
  priceText?: string;
  originalPriceText?: string;
  countdownIso?: string;
  columnLayout?: ColumnLayoutPreset;
  columnGap?: number;
  stackOnMobile?: boolean;
  columns?: EmailColumnItem[];
  rows?: string[][];
  tableHeaderBg?: string;
  tableHeaderColor?: string;
  tableStriped?: boolean;
  socialLinks?: SocialLinkItem[];
  align?: 'left' | 'center' | 'right';
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  spacing?: EmailBlockSpacing;
  borderRadius?: number;
  border?: EmailBlockBorder;
  typography?: EmailBlockTypography;
}

export interface EmailBodyStyle {
  canvasColor?: string;
  cardColor?: string;
  primaryColor?: string;
  textColor?: string;
  fontFamily?: string;
  maxWidth?: number;
}

export interface MergeTagDefinition {
  key: string;
  label: string;
  sample: string;
}

export interface SpamCheckFinding {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface SpamCheckReport {
  score: number;
  deliverabilityGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  issues: SpamCheckFinding[];
}

export type ValidationIssueCategory =
  | 'missing_unsubscribe'
  | 'broken_link'
  | 'missing_alt'
  | 'spam_keyword'
  | 'subject_issue'
  | 'duplicate_cta'
  | 'missing_fallback_url';

export interface EmailValidationIssue {
  id: string;
  blockId: string | null;
  category: ValidationIssueCategory;
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
}

export interface SenderVaultStatus {
  configured: boolean;
  provider: string | null;
  from_email: string;
  from_name: string;
  spf_verified?: boolean;
  dkim_verified?: boolean;
}

export interface ValidationResultPayload {
  score: number;
  deliverabilityGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  hasUnsubscribe: boolean;
  brokenLinksCount: number;
  missingAltCount: number;
  issues: EmailValidationIssue[];
  senderVault?: SenderVaultStatus;
}

export interface SavedReusableBlock {
  id: string;
  name: string;
  createdAt: string;
  block: EmailBlockItem;
}

export interface MediaAssetItem {
  id: string;
  name: string;
  url: string;
  folder: string;
  alt_text?: string;
  width?: number;
  height?: number;
  size_bytes?: number;
  mime_type?: string;
  created_at?: string;
}

export type TemplateVisibility = 'private' | 'team' | 'department' | 'company';

export interface TemplateAclEntry {
  target_type: 'team' | 'department' | 'role' | 'user';
  target_id: string;
  target_label?: string;
  permission: 'view' | 'use' | 'edit';
}

export interface TemplateAclConfig {
  visibility: TemplateVisibility;
  entries: TemplateAclEntry[];
}

export interface TemplateGroupDto {
  id: string;
  name: string;
  description?: string;
  color_hex?: string;
}

export interface EmailTemplateDto {
  id: string;
  group_id: string | null;
  group_name?: string | null;
  name: string;
  subject: string;
  preheader: string;
  category: string;
  blocks: EmailBlockItem[];
  body_style: EmailBodyStyle;
  compiled_html: string;
  spam_score: number;
  merge_tags: string[];
  visibility?: TemplateVisibility;
  created_by?: string | null;
  updated_at?: string;
}

export interface TemplatesListResponse {
  items?: EmailTemplateDto[];
  groups?: TemplateGroupDto[];
  merge_tags?: MergeTagDefinition[];
  sender_vault?: SenderVaultStatus;
}

export interface DomStudioGenerateResponse {
  generator?: string;
  subject: string;
  preheader: string;
  blocks: EmailBlockItem[];
  compiled_html: string;
  spam_analysis?: {
    score?: number;
    grade?: string;
  };
}
