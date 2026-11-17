export type ErpCardEntityType =
  | 'lead'
  | 'deal'
  | 'task'
  | 'approval'
  | 'payslip'
  | 'cooperation_slip';

export interface WorkChatAttachmentItem {
  kind: 'file' | 'image' | 'link' | 'erp_card' | 'voucher' | 'task_card';
  entity_type?: ErpCardEntityType | string;
  entity_id?: string | number;
  title: string;
  code?: string;
  subtitle?: string;
  status?: string;
  amount_label?: string;
  url?: string;
  file_size?: number;
}

export interface WorkChatMessageDto {
  id: string;
  channel_id: string;
  channel_name?: string;
  sender_user_id?: string | null;
  sender_name: string;
  parent_message_id?: string | null;
  parent_sender_name?: string | null;
  parent_content?: string | null;
  message_type: 'text' | 'sticker' | 'work_badge' | 'attachment' | 'card_link';
  content: string;
  sticker_pack_id?: string | null;
  sticker_id?: string | null;
  attachments: WorkChatAttachmentItem[];
  reactions: Record<string, string[]>;
  is_pinned: boolean;
  created_at: string;
}

export interface WorkChatChannelDto {
  id: string;
  name: string;
  channel_type: 'direct' | 'group' | 'department' | 'project' | 'announcement' | string;
  topic?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  wallpaper_preset?: string | null;
  last_message_preview?: string | null;
  last_message_at?: string | null;
  message_count: number;
  unread_count?: number;
}

export interface WorkChatPresenceDto {
  user_id: string;
  full_name: string;
  role: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  status_text?: string | null;
  last_seen_at?: string | null;
}

export interface WorkChatStaffDto {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department_id?: string | null;
  branch_id?: string | null;
}

export interface WorkChatDepartmentDto {
  id: string;
  name: string;
  code: string;
}

export interface WorkChatBootstrapDto {
  enable_ideas_mascot: boolean;
  channels: WorkChatChannelDto[];
  presence: WorkChatPresenceDto[];
  staff: WorkChatStaffDto[];
  departments: WorkChatDepartmentDto[];
}

export interface ChatWallpaperTheme {
  id: string;
  name: string;
  subtitle: string;
  cssBackground: string;
  swatchGradient: string;
  accentColor: string;
}

export interface ChannelWallpaperConfig {
  preset_id: string;
  name: string;
  cssBackground: string;
  overlayOpacity: number;
}

export const ROYAL_WALLPAPER_PRESETS: ChatWallpaperTheme[] = [
  {
    id: 'sapphire_pure',
    name: 'Trắng Tinh Khiết (Mặc định)',
    subtitle: 'Sáng rõ tuyệt đối • Chuẩn văn phòng hiện đại',
    cssBackground: '#F8F9FA',
    swatchGradient: 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)',
    accentColor: '#1E40FF',
  },
  {
    id: 'sapphire_mist',
    name: 'Sương Sớm Royal Sapphire',
    subtitle: 'Ánh xanh ngọc bích dịu mắt cho phiên họp dài',
    cssBackground: 'linear-gradient(145deg, #EFF6FF 0%, #F8FAFC 52%, #E0F2FE 100%)',
    swatchGradient: 'linear-gradient(135deg, #DBEAFE 0%, #BAE6FD 100%)',
    accentColor: '#1E40FF',
  },
  {
    id: 'arctic_cyan',
    name: 'Băng Dương Cyan',
    subtitle: 'Tươi mát, khơi gợi năng lượng sáng tạo',
    cssBackground: 'linear-gradient(145deg, #ECFEFF 0%, #F8FAFC 50%, #EFF6FF 100%)',
    swatchGradient: 'linear-gradient(135deg, #A5F3FC 0%, #BFDBFE 100%)',
    accentColor: '#0284C7',
  },
  {
    id: 'cloud_grid',
    name: 'Lưới Kỹ Thuật Số',
    subtitle: 'Họa tiết chấm bi mảnh trên nền sáng #F8FAFF',
    cssBackground:
      'radial-gradient(rgba(30, 64, 255, 0.08) 1.2px, transparent 1.2px), #F8FAFF',
    swatchGradient: 'linear-gradient(135deg, #E0E7FF 0%, #F8FAFF 100%)',
    accentColor: '#1E40FF',
  },
  {
    id: 'emerald_breeze',
    name: 'Lá Ngọc Ban Mai',
    subtitle: 'Sắc xanh lục bảo nhẹ nhàng, cân bằng thị giác',
    cssBackground: 'linear-gradient(145deg, #ECFDF5 0%, #F8FAFC 55%, #F0FDFA 100%)',
    swatchGradient: 'linear-gradient(135deg, #A7F3D0 0%, #99F6E4 100%)',
    accentColor: '#059669',
  },
  {
    id: 'lavender_crystal',
    name: 'Pha Lê Tím Nhạt',
    subtitle: 'Tinh tế cho nhóm chiến lược & thiết kế',
    cssBackground: 'linear-gradient(145deg, #F5F3FF 0%, #FFFFFF 55%, #EEF2FF 100%)',
    swatchGradient: 'linear-gradient(135deg, #DDD6FE 0%, #C7D2FE 100%)',
    accentColor: '#6D28D9',
  },
  {
    id: 'amber_sunlight',
    name: 'Nắng Sớm Minh Bạch',
    subtitle: 'Ấm áp, truyền cảm hứng chốt mục tiêu doanh số',
    cssBackground: 'linear-gradient(145deg, #FFFBEB 0%, #FFFFFF 55%, #FEF3C7 100%)',
    swatchGradient: 'linear-gradient(135deg, #FDE68A 0%, #FEF3C7 100%)',
    accentColor: '#D97706',
  },
  {
    id: 'sky_horizon',
    name: 'Chân Trời Bắc Âu',
    subtitle: ' Chuyển sắc trắng mây sang lam nhạt thanh lịch',
    cssBackground: 'linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 60%, #E0E7FF 100%)',
    swatchGradient: 'linear-gradient(135deg, #E0F2FE 0%, #C7D2FE 100%)',
    accentColor: '#2563EB',
  },
];

const WALLPAPER_STORAGE_PREFIX = 'domation_workchat_wallpaper_v1';

export function loadChannelWallpaperLocal(
  tenantSlug: string,
  channelId: string
): ChannelWallpaperConfig {
  const fallback: ChannelWallpaperConfig = {
    preset_id: ROYAL_WALLPAPER_PRESETS[0].id,
    name: ROYAL_WALLPAPER_PRESETS[0].name,
    cssBackground: ROYAL_WALLPAPER_PRESETS[0].cssBackground,
    overlayOpacity: 1,
  };
  if (typeof window === 'undefined' || !channelId) return fallback;
  try {
    const raw = localStorage.getItem(`${WALLPAPER_STORAGE_PREFIX}:${tenantSlug || 'default'}:${channelId}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ChannelWallpaperConfig>;
    const preset = ROYAL_WALLPAPER_PRESETS.find((p) => p.id === parsed.preset_id) || ROYAL_WALLPAPER_PRESETS[0];
    return {
      preset_id: preset.id,
      name: preset.name,
      cssBackground: preset.cssBackground,
      overlayOpacity:
        typeof parsed.overlayOpacity === 'number'
          ? Math.min(1, Math.max(0.25, parsed.overlayOpacity))
          : 1,
    };
  } catch {
    return fallback;
  }
}

export function saveChannelWallpaperLocal(
  tenantSlug: string,
  channelId: string,
  config: ChannelWallpaperConfig
): void {
  if (typeof window === 'undefined' || !channelId) return;
  try {
    localStorage.setItem(
      `${WALLPAPER_STORAGE_PREFIX}:${tenantSlug || 'default'}:${channelId}`,
      JSON.stringify(config)
    );
  } catch {
    // ignore storage quota errors
  }
}

export function extractUrlsFromContent(content: string): string[] {
  if (!content) return [];
  const matches = content.match(/https?:\/\/[^\s<>"')]+/gi);
  if (!matches) return [];
  return Array.from(new Set(matches));
}

export async function copyPlainText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }
  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export const ERP_CARD_CATEGORY_META: Record<
  ErpCardEntityType,
  { label: string; badgeBg: string; badgeColor: string; route: string }
> = {
  lead: {
    label: 'Lead / Khách hàng',
    badgeBg: 'rgba(30, 64, 255, 0.10)',
    badgeColor: '#1E40FF',
    route: '/contacts',
  },
  deal: {
    label: 'Cơ hội Deal',
    badgeBg: 'rgba(2, 132, 199, 0.10)',
    badgeColor: '#0284C7',
    route: '/deals',
  },
  task: {
    label: 'Công việc Task',
    badgeBg: 'rgba(217, 119, 6, 0.12)',
    badgeColor: '#D97706',
    route: '/erp/projects',
  },
  approval: {
    label: 'Đơn Phê duyệt',
    badgeBg: 'rgba(124, 58, 237, 0.10)',
    badgeColor: '#7C3AED',
    route: '/erp/approvals',
  },
  payslip: {
    label: 'Phiếu Lương',
    badgeBg: 'rgba(5, 150, 105, 0.10)',
    badgeColor: '#059669',
    route: '/my-payslips',
  },
  cooperation_slip: {
    label: 'Phiếu Hợp Tác',
    badgeBg: 'rgba(236, 72, 153, 0.10)',
    badgeColor: '#DB2777',
    route: '/cooperation-slips',
  },
};
