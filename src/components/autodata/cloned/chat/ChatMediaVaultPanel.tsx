import React, { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  Palette,
  Pin,
  Search,
  X,
} from 'lucide-react';
import { Badge, EmptyState } from '../components/ui/AutoDataLoadingModal';
import { Skeleton } from '../components/ui/Skeleton';
import { apiRequest, formatShortDate } from '../../autodataApi';
import {
  extractUrlsFromContent,
  type WorkChatChannelDto,
  type WorkChatMessageDto,
} from './workchatTypes';

type VaultTabKey = 'media' | 'documents' | 'links' | 'erp_pins';

interface ServerVaultItem {
  id: string;
  category: 'media' | 'document' | 'link' | 'erp_card' | 'pin' | string;
  title: string;
  url?: string | null;
  code?: string | null;
  sender_name?: string | null;
  created_at?: string | null;
}

export interface ChatMediaVaultPanelProps {
  channel: WorkChatChannelDto;
  messages: WorkChatMessageDto[];
  token?: string | null;
  tenantSlug?: string | null;
  onClose: () => void;
  onOpenWallpaper?: () => void;
  onJumpToMessage?: (messageId: string) => void;
}

export const ChatMediaVaultPanel: React.FC<ChatMediaVaultPanelProps> = ({
  channel,
  messages,
  token,
  tenantSlug,
  onClose,
  onOpenWallpaper,
  onJumpToMessage,
}) => {
  const [activeTab, setActiveTab] = useState<VaultTabKey>('media');
  const [filterQuery, setFilterQuery] = useState('');
  const [loadingVault, setLoadingVault] = useState(false);
  const [serverItems, setServerItems] = useState<ServerVaultItem[]>([]);

  useEffect(() => {
    if (!channel.id) return;
    let cancelled = false;

    (async () => {
      setLoadingVault(true);
      try {
        const res = await apiRequest<{ items?: ServerVaultItem[] }>(
          `/workchat/channels/${channel.id}/vault`,
          { token, tenantSlug }
        );
        if (!cancelled) {
          setServerItems(Array.isArray(res?.items) ? res.items : []);
        }
      } catch {
        if (!cancelled) {
          setServerItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingVault(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [channel.id, token, tenantSlug]);

  const extracted = useMemo(() => {
    const mediaList: Array<{
      id: string;
      messageId: string;
      title: string;
      url: string;
      sender: string;
      createdAt: string;
    }> = [];
    const docList: Array<{
      id: string;
      messageId: string;
      title: string;
      code?: string;
      url?: string;
      sender: string;
      createdAt: string;
    }> = [];
    const linkList: Array<{
      id: string;
      messageId: string;
      url: string;
      sender: string;
      createdAt: string;
    }> = [];
    const erpAndPinList: Array<{
      id: string;
      messageId: string;
      isPinned: boolean;
      title: string;
      code?: string;
      subtitle?: string;
      sender: string;
      createdAt: string;
    }> = [];

    for (const m of messages) {
      const urls = extractUrlsFromContent(m.content);
      for (const u of urls) {
        if (/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(u)) {
          mediaList.push({
            id: `msg_img_${m.id}_${u}`,
            messageId: m.id,
            title: 'Hình ảnh chia sẻ',
            url: u,
            sender: m.sender_name,
            createdAt: m.created_at,
          });
        } else {
          linkList.push({
            id: `msg_lnk_${m.id}_${u}`,
            messageId: m.id,
            url: u,
            sender: m.sender_name,
            createdAt: m.created_at,
          });
        }
      }

      for (const att of m.attachments || []) {
        if (att.kind === 'image' && att.url) {
          mediaList.push({
            id: `att_img_${m.id}_${att.title}`,
            messageId: m.id,
            title: att.title,
            url: att.url,
            sender: m.sender_name,
            createdAt: m.created_at,
          });
        } else if (att.kind === 'file') {
          docList.push({
            id: `att_doc_${m.id}_${att.title}`,
            messageId: m.id,
            title: att.title,
            code: att.code,
            url: att.url,
            sender: m.sender_name,
            createdAt: m.created_at,
          });
        } else if (att.kind === 'link' && att.url) {
          linkList.push({
            id: `att_lnk_${m.id}_${att.url}`,
            messageId: m.id,
            url: att.url,
            sender: m.sender_name,
            createdAt: m.created_at,
          });
        } else {
          erpAndPinList.push({
            id: `att_erp_${m.id}_${att.title}`,
            messageId: m.id,
            isPinned: m.is_pinned,
            title: att.title,
            code: att.code,
            subtitle: att.subtitle || att.entity_type,
            sender: m.sender_name,
            createdAt: m.created_at,
          });
        }
      }

      if (m.is_pinned) {
        erpAndPinList.push({
          id: `pin_${m.id}`,
          messageId: m.id,
          isPinned: true,
          title: m.content,
          code: 'ĐÃ GHIM',
          subtitle: `Tin nhắn ghim bởi ${m.sender_name}`,
          sender: m.sender_name,
          createdAt: m.created_at,
        });
      }
    }

    // Merge server vault items if not duplicated
    for (const s of serverItems) {
      if (s.category === 'media' && s.url) {
        if (!mediaList.some((x) => x.url === s.url)) {
          mediaList.push({
            id: `srv_${s.id}`,
            messageId: s.id,
            title: s.title || 'Ảnh đính kèm',
            url: s.url,
            sender: s.sender_name || 'Thành viên',
            createdAt: s.created_at || '',
          });
        }
      } else if (s.category === 'document') {
        docList.push({
          id: `srv_doc_${s.id}`,
          messageId: s.id,
          title: s.title,
          code: s.code || undefined,
          url: s.url || undefined,
          sender: s.sender_name || 'Thành viên',
          createdAt: s.created_at || '',
        });
      } else if (s.category === 'link' && s.url) {
        if (!linkList.some((x) => x.url === s.url)) {
          linkList.push({
            id: `srv_lnk_${s.id}`,
            messageId: s.id,
            url: s.url,
            sender: s.sender_name || 'Thành viên',
            createdAt: s.created_at || '',
          });
        }
      } else if (s.category === 'erp_card' || s.category === 'pin') {
        erpAndPinList.push({
          id: `srv_erp_${s.id}`,
          messageId: s.id,
          isPinned: s.category === 'pin',
          title: s.title,
          code: s.code || undefined,
          sender: s.sender_name || 'Thành viên',
          createdAt: s.created_at || '',
        });
      }
    }

    const q = filterQuery.trim().toLowerCase();
    return {
      media: q
        ? mediaList.filter((i) => `${i.title} ${i.sender}`.toLowerCase().includes(q))
        : mediaList,
      documents: q
        ? docList.filter((i) => `${i.title} ${i.code || ''} ${i.sender}`.toLowerCase().includes(q))
        : docList,
      links: q
        ? linkList.filter((i) => `${i.url} ${i.sender}`.toLowerCase().includes(q))
        : linkList,
      erpPins: q
        ? erpAndPinList.filter((i) =>
            `${i.title} ${i.code || ''} ${i.sender}`.toLowerCase().includes(q)
          )
        : erpAndPinList,
    };
  }, [messages, serverItems, filterQuery]);

  const tabs: ReadonlyArray<{
    key: VaultTabKey;
    label: string;
    count: number;
    icon: React.ReactNode;
  }> = [
    { key: 'media', label: 'Ảnh & Media', count: extracted.media.length, icon: <ImageIcon size={13} /> },
    { key: 'documents', label: 'Tài liệu', count: extracted.documents.length, icon: <FileText size={13} /> },
    { key: 'links', label: 'Liên kết', count: extracted.links.length, icon: <Link2 size={13} /> },
    { key: 'erp_pins', label: 'Thẻ ERP & Ghim', count: extracted.erpPins.length, icon: <Pin size={13} /> },
  ];

  return (
    <div
      style={{
        width: 320,
        maxWidth: '100%',
        borderLeft: '1px solid #E2E8F0',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #E2E8F0',
          background: '#F8FAFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A' }}>
            Kho Lưu Trữ Kênh (Media Vault)
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              color: '#64748B',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            #{channel.name}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {onOpenWallpaper && (
            <button
              type="button"
              onClick={onOpenWallpaper}
              title="Đổi hình nền kênh"
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                border: '1px solid #DBEAFE',
                background: '#EFF6FF',
                color: '#1E40FF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Palette size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng Kho Lưu Trữ"
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#64748B',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '0 10px',
            minHeight: 36,
            borderRadius: 10,
            background: '#F8F9FA',
            border: '1px solid #E2E8F0',
          }}
        >
          <Search size={14} color="#64748B" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Lọc ảnh, tài liệu, liên kết, thẻ..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.78rem',
              color: '#0F172A',
            }}
          />
        </div>

        {/* 4 Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 5,
            marginTop: 9,
          }}
        >
          {tabs.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 9,
                  border: active ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                  background: active ? '#EEF2FF' : '#FFFFFF',
                  color: active ? '#1E40FF' : '#475569',
                  fontSize: '0.71rem',
                  fontWeight: active ? 800 : 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                  {t.icon}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.label}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: 999,
                    background: active ? 'rgba(30, 64, 255, 0.14)' : '#F1F5F9',
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {loadingVault ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton height={58} borderRadius={12} />
            <Skeleton height={58} borderRadius={12} />
            <Skeleton height={58} borderRadius={12} />
          </div>
        ) : activeTab === 'media' ? (
          extracted.media.length === 0 ? (
            <EmptyState
              icon={<ImageIcon size={20} />}
              title="Chưa có Ảnh & Media"
              description="Hình ảnh chia sẻ trong kênh sẽ tự động lưu trữ tại đây."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              {extracted.media.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    background: '#F8F9FA',
                    textDecoration: 'none',
                    color: '#0F172A',
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    style={{ width: '100%', height: 92, objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ padding: '6px 8px', fontSize: '0.68rem', color: '#475569' }}>
                    {item.sender} • {formatShortDate(item.createdAt)}
                  </div>
                </a>
              ))}
            </div>
          )
        ) : activeTab === 'documents' ? (
          extracted.documents.length === 0 ? (
            <EmptyState
              icon={<FileText size={20} />}
              title="Chưa có Tài liệu"
              description="Hợp đồng, báo giá và file đính kèm trong kênh sẽ hiển thị tại đây."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {extracted.documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onJumpToMessage?.(doc.messageId)}
                  style={{
                    padding: '9px 11px',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    cursor: onJumpToMessage ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ fontSize: '0.79rem', fontWeight: 700, color: '#0F172A' }}>{doc.title}</div>
                  <div style={{ fontSize: '0.69rem', color: '#64748B', marginTop: 2 }}>
                    {doc.sender} • {formatShortDate(doc.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'links' ? (
          extracted.links.length === 0 ? (
            <EmptyState
              icon={<Link2 size={20} />}
              title="Chưa có Liên kết"
              description="Các đường dẫn URL gửi trong hội thoại sẽ được gom nhóm tại đây."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {extracted.links.map((lnk) => (
                <a
                  key={lnk.id}
                  href={lnk.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '9px 11px',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFF',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: '#1E40FF',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {lnk.url}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: 2 }}>
                      {lnk.sender} • {formatShortDate(lnk.createdAt)}
                    </div>
                  </div>
                  <ExternalLink size={13} color="#1E40FF" />
                </a>
              ))}
            </div>
          )
        ) : extracted.erpPins.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={20} />}
            title="Chưa có Thẻ ERP & Tin ghim"
            description="Đính kèm Thẻ ERP hoặc ghim tin nhắn quan trọng để truy xuất tức thì."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {extracted.erpPins.map((item) => (
              <div
                key={item.id}
                onClick={() => onJumpToMessage?.(item.messageId)}
                style={{
                  padding: '10px 11px',
                  borderRadius: 12,
                  border: item.isPinned ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                  background: item.isPinned ? '#EFF6FF' : '#FFFFFF',
                  cursor: onJumpToMessage ? 'pointer' : 'default',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Badge tone={item.isPinned ? 'warning' : 'primary'}>
                    {item.code || (item.isPinned ? 'GHIM' : 'ERP CARD')}
                  </Badge>
                  <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                    {formatShortDate(item.createdAt)}
                  </span>
                </div>
                <div style={{ fontSize: '0.79rem', fontWeight: 700, color: '#0F172A' }}>{item.title}</div>
                {item.subtitle && (
                  <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: 2 }}>{item.subtitle}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMediaVaultPanel;
