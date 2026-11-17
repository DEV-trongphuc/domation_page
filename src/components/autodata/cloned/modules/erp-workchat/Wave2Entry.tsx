import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ExternalLink,
  Megaphone,
  MessageCircle,
  User,
} from 'lucide-react';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { Badge, Card, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { CHAT_STICKERS, getVisibleStickerPacks } from '../../chat/ChatStickers';
import { WorkChatModal } from '../../chat/WorkChatModal';
import { EnterpriseFeedView } from './EnterpriseFeedView';
import { PersonalAccountView } from './PersonalAccountView';

type WorkChatHubTab = 'messenger' | 'feed' | 'account';

export const ErpWorkChatWave2Entry: React.FC = () => {
  const location = useLocation();
  const { enableIdeasMascot, packageMeta, scope } = useEntitlement();
  const [activeTab, setActiveTab] = useState<WorkChatHubTab>('messenger');

  const visiblePacks = useMemo(
    () => getVisibleStickerPacks(enableIdeasMascot),
    [enableIdeasMascot]
  );

  const normalizedPath = useMemo(() => {
    const clean = (location.pathname || '').split('?')[0].replace(/\/+$/, '');
    return clean || '/';
  }, [location.pathname]);

  if (normalizedPath === '/feed') {
    return <EnterpriseFeedView />;
  }

  if (normalizedPath === '/account') {
    return <PersonalAccountView />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Workspace Header */}
      <Card
        padding="1.2rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: '#EEF2FF',
                border: '1px solid #DBEAFE',
                color: '#1E40FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MessageCircle size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.16rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  WorkChat Doanh Nghiệp, Bảng Tin Nội Bộ & Kudos Wall
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="success">
                  {visiblePacks.length} Bộ Sticker • {CHAT_STICKERS.length} Nhãn công việc
                </Badge>
                <Badge tone="info">Phạm vi: {scope('erp_workchat')}</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>
                Hội thoại đa kênh gắn Thẻ ERP thông minh, Kho lưu trữ Media Vault, Bảng tin nội bộ 6 biểu cảm & Chữ ký số cá nhân.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ScreenHelpButton screenKey="erp_workchat" />
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('domation:open-chat'));
              }}
              style={{
                minHeight: 40,
                padding: '0 14px',
                borderRadius: 11,
                border: '1px solid #DBEAFE',
                background: '#EFF6FF',
                color: '#1E40FF',
                fontSize: '0.79rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <ExternalLink size={14} />
              <span>Mở Cửa Sổ Chat Nổi</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <PillTabs<WorkChatHubTab>
            activeKey={activeTab}
            onChange={setActiveTab}
            tabs={[
              {
                key: 'messenger',
                label: 'Tin nhắn WorkChat & Kênh Phòng ban',
                icon: <MessageCircle size={15} />,
              },
              {
                key: 'feed',
                label: 'Bảng tin Doanh nghiệp & Kudos Wall',
                icon: <Megaphone size={15} />,
              },
              {
                key: 'account',
                label: 'Hồ sơ Cá nhân & Chữ ký số',
                icon: <User size={15} />,
              },
            ]}
          />
        </div>
      </Card>

      {/* Active Workspace Tab */}
      {activeTab === 'messenger' && <WorkChatModal docked isOpen />}
      {activeTab === 'feed' && <EnterpriseFeedView embedded />}
      {activeTab === 'account' && <PersonalAccountView embedded />}
    </div>
  );
};

export const Wave2Entry = ErpWorkChatWave2Entry;

export default ErpWorkChatWave2Entry;
