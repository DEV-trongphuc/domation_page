export interface ChatSticker {
  id: string;
  name: string;
  category: 'work' | 'mood' | 'celebrate';
  icon: string;
  badgeText: string;
  color: string;
  bgGradient: string;
}

export interface CommercialStickerPack {
  id: string;
  name: string;
  count: number;
  ext: 'png' | 'gif' | 'jpg' | 'webp';
  isGif?: boolean;
  isMascotPack?: boolean;
  sampleEmojis: string[];
  icon: string;
  badge?: string;
}

export const CHAT_STICKERS: ChatSticker[] = [
  {
    id: 'stk_approved',
    name: 'Đã Duyệt',
    category: 'work',
    icon: '✅',
    badgeText: 'ĐÃ PHÊ DUYỆT',
    color: '#059669',
    bgGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  },
  {
    id: 'stk_deal_closed',
    name: 'Chốt Đơn',
    category: 'work',
    icon: '🎯',
    badgeText: 'CHỐT DEAL THÀNH CÔNG',
    color: '#D97706',
    bgGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  },
  {
    id: 'stk_urgent_meeting',
    name: 'Họp Gấp',
    category: 'work',
    icon: '🚨',
    badgeText: 'HỌP KHẨN CẤP',
    color: '#DC2626',
    bgGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  },
  {
    id: 'stk_deadline',
    name: 'Deadline Tới',
    category: 'work',
    icon: '⏳',
    badgeText: 'NHẮC HẠN DEADLINE',
    color: '#EA580C',
    bgGradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
  },
  {
    id: 'stk_excellent',
    name: 'Xuất Sắc',
    category: 'celebrate',
    icon: '🌟',
    badgeText: 'QUÁ XUẤT SẮC',
    color: '#7C3AED',
    bgGradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
  },
  {
    id: 'stk_heart_thanks',
    name: 'Cảm Ơn',
    category: 'mood',
    icon: '💖',
    badgeText: 'CẢM ƠN ĐỒNG ĐỘI',
    color: '#DB2777',
    bgGradient: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
  },
  {
    id: 'stk_ok_chot',
    name: 'OK Nhất Trí',
    category: 'work',
    icon: '👍',
    badgeText: 'OK CHỐT TRIỂN KHAI',
    color: '#1E40FF',
    bgGradient: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
  },
  {
    id: 'stk_fighting',
    name: 'Cố Lên Nào',
    category: 'mood',
    icon: '💪',
    badgeText: 'CỐ LÊN ĐỘI NGŨ',
    color: '#0891B2',
    bgGradient: 'linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)',
  },
  {
    id: 'stk_coffee_break',
    name: 'Cafe Đi',
    category: 'mood',
    icon: '☕',
    badgeText: 'LÀM TÁCH CAFE NHÉ',
    color: '#92400E',
    bgGradient: 'linear-gradient(135deg, #B45309 0%, #78350F 100%)',
  },
  {
    id: 'stk_party',
    name: 'Ăn Mừng',
    category: 'celebrate',
    icon: '🎉',
    badgeText: 'ĂN MỪNG THÀNH TÍCH',
    color: '#4F46E5',
    bgGradient: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
  },
  {
    id: 'stk_checkin_done',
    name: 'Đã Check-in',
    category: 'work',
    icon: '⏰',
    badgeText: 'ĐÃ VÀO CA LÀM',
    color: '#059669',
    bgGradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
  },
  {
    id: 'stk_on_leave',
    name: 'Xin Nghỉ',
    category: 'work',
    icon: '🌴',
    badgeText: 'NGHỈ PHÉP HÔM NAY',
    color: '#475569',
    bgGradient: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
  },
];

export const GENERAL_STICKER_PACKS: CommercialStickerPack[] = [
  {
    id: 'ghost',
    name: 'Ghost Cute',
    count: 14,
    ext: 'gif',
    isGif: true,
    icon: '/stickers/ghost/ghost_1.gif',
    sampleEmojis: ['👻', '✨', '💫', '🥳', '🎉', '🙌', '💙', '🌟', '😄', '🫶', '🎈', '⚡', '🎶', '🤗'],
  },
  {
    id: 'maruko',
    name: 'Maruko',
    count: 20,
    ext: 'png',
    icon: '/stickers/maruko/maruko_1.png',
    sampleEmojis: ['😊', '🌸', '🍵', '🎶', '📚', '🌞', '🍡', '🎀', '😆', '🍀', '🌈', '💌', '🥰', '🎵', '🌺', '🍰', '🙋‍♀️', '💫', '🎁', '🌻'],
  },
  {
    id: 'smalldog',
    name: 'Cún Con',
    count: 16,
    ext: 'gif',
    isGif: true,
    icon: '/stickers/smalldog/smalldog_1.gif',
    sampleEmojis: ['🐶', '🐾', '🦴', '💛', '🏃', '🎾', '🥰', '🐕', '🌟', '🎉', '💤', '🍖', '🤗', '✨', '🏅', '❤️'],
  },
  {
    id: 'girl',
    name: 'Office Girl',
    count: 14,
    ext: 'gif',
    isGif: true,
    icon: '/stickers/girl/girl_1.gif',
    sampleEmojis: ['👩‍💻', '☕', '📝', '💼', '💡', '🌟', '📊', '🎯', '🙌', '💖', '📱', '✅', '🚀', '🥳'],
  },
  {
    id: 'seal',
    name: 'Hải Cẩu',
    count: 8,
    ext: 'gif',
    isGif: true,
    icon: '/stickers/seal/seal_1.gif',
    sampleEmojis: ['🦭', '🌊', '👏', '🐟', '💙', '😴', '🫧', '🎉'],
  },
  {
    id: 'meep',
    name: 'Meep',
    count: 16,
    ext: 'png',
    icon: '/stickers/meep/meep_3.png',
    sampleEmojis: ['😎', '🤔', '🔥', '🚀', '👍', '🎯', '💎', '⚡', '🏆', '🤝', '📈', '💡', '🫡', '🥳', '💯', '✨'],
  },
  {
    id: 'foxlove',
    name: 'Fox Love',
    count: 16,
    ext: 'png',
    icon: '/stickers/foxlove/foxlove_1.png',
    sampleEmojis: ['🦊', '🧡', '🍀', '🎁', '💌', '🌈', '✨', '🍂', '🫶', '🌟', '🎶', '☕', '💐', '🤗', '🎈', '💛'],
  },
  {
    id: 'buffalo',
    name: 'Trâu Chăm Chỉ',
    count: 11,
    ext: 'gif',
    isGif: true,
    icon: '/stickers/buffalo/buffalo_1.gif',
    sampleEmojis: ['🐃', '💪', '⚡', '🏆', '📈', '🌾', '🔥', '🎯', '🚀', '👍', '🥇'],
  },
  {
    id: 'minion',
    name: 'Minions',
    count: 20,
    ext: 'png',
    icon: '/stickers/minion/minion_1.png',
    sampleEmojis: ['🤩', '🍌', '🎊', '🤝', '🔔', '👑', '🎉', '😄', '🎸', '🚀', '🥳', '💛', '🏆', '👏', '🔥', '😎', '🎈', '📣', '🌟', '💯'],
  },
];

export const IDEAS_MASCOT_PACK: CommercialStickerPack = {
  id: 'ideas',
  name: 'Brand Mascot Pack',
  count: 48,
  ext: 'webp',
  isMascotPack: true,
  icon: '/stickers/ideas/ideas_1.webp',
  badge: 'Mascot',
  sampleEmojis: ['🤖', '💙', '🚀', '✨', '🎯', '🏆', '💡', '🔥', '📈', '🤝', '🌟', '💎'],
};

/**
 * Strictly enforces the Mascot visibility rule:
 * - Returns [IDEAS_MASCOT_PACK, ...GENERAL_STICKER_PACKS] ONLY when enableIdeasMascot === true
 * - Returns strictly GENERAL_STICKER_PACKS (9 packs, 0 'ideas') when enableIdeasMascot === false
 */
export function getVisibleStickerPacks(enableIdeasMascot: boolean): CommercialStickerPack[] {
  if (enableIdeasMascot === true) {
    return [IDEAS_MASCOT_PACK, ...GENERAL_STICKER_PACKS];
  }
  return [...GENERAL_STICKER_PACKS];
}

export const POPULAR_EMOJIS: string[] = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇',
  '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪', '🤗', '🤔', '🤨', '😐', '😏',
  '🥳', '😎', '🤓', '🧐', '🥺', '😮', '😴', '🤯', '❤️', '🧡', '💛', '💚',
  '💙', '💜', '💖', '💯', '✨', '🔥', '⭐', '🌟', '👍', '👏', '🙌', '🤝',
  '👊', '✌️', '👌', '👋', '💪', '🙏', '🎉', '🎊', '🏆', '🥇', '👑', '💎',
  '💡', '🎯', '🚀', '🎁', '☕', '💰', '📊', '📈', '📅', '⏰', '💼', '📌',
];

export function findWorkStickerById(stickerId?: string | null): ChatSticker | undefined {
  if (!stickerId) return undefined;
  return CHAT_STICKERS.find((s) => s.id === stickerId);
}
