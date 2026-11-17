import React, { useState } from 'react';
import { Check, Palette, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../components/ui/CustomModal';
import { AutodataApiError, apiRequest, getErrorMessage } from '../../autodataApi';
import {
  ROYAL_WALLPAPER_PRESETS,
  saveChannelWallpaperLocal,
  type ChannelWallpaperConfig,
} from './workchatTypes';

export interface ChatWallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  channelName: string;
  tenantSlug: string;
  token?: string | null;
  currentWallpaper: ChannelWallpaperConfig;
  onWallpaperApplied: (next: ChannelWallpaperConfig) => void;
}

interface WallpaperInnerProps {
  channelId: string;
  channelName: string;
  tenantSlug: string;
  token?: string | null;
  currentWallpaper: ChannelWallpaperConfig;
  onWallpaperApplied: (next: ChannelWallpaperConfig) => void;
  onClose: () => void;
}

const WallpaperInnerBody: React.FC<WallpaperInnerProps> = ({
  channelId,
  channelName,
  tenantSlug,
  token,
  currentWallpaper,
  onWallpaperApplied,
  onClose,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    currentWallpaper.preset_id || ROYAL_WALLPAPER_PRESETS[0].id
  );
  const [overlayOpacity, setOverlayOpacity] = useState<number>(
    currentWallpaper.overlayOpacity ?? 1
  );
  const [saving, setSaving] = useState(false);

  const activePreset =
    ROYAL_WALLPAPER_PRESETS.find((p) => p.id === selectedPresetId) || ROYAL_WALLPAPER_PRESETS[0];

  const persistWallpaper = async (presetId: string, opacity: number) => {
    const preset =
      ROYAL_WALLPAPER_PRESETS.find((p) => p.id === presetId) || ROYAL_WALLPAPER_PRESETS[0];
    const nextConfig: ChannelWallpaperConfig = {
      preset_id: preset.id,
      name: preset.name,
      cssBackground: preset.cssBackground,
      overlayOpacity: opacity,
    };

    setSaving(true);
    try {
      saveChannelWallpaperLocal(tenantSlug, channelId, nextConfig);
      onWallpaperApplied(nextConfig);

      if (channelId) {
        try {
          await apiRequest(`/workchat/channels/${channelId}/wallpaper`, {
            method: 'PATCH',
            token,
            tenantSlug,
            body: {
              wallpaper_preset: preset.id,
              overlay_opacity: opacity,
            },
          });
        } catch (apiErr) {
          if (apiErr instanceof AutodataApiError && apiErr.status === 403) {
            toast.error(apiErr.message || 'Không đủ quyền đổi hình nền chung của kênh.');
            return;
          }
          // If backend route is optional or offline, local preference is already persisted cleanly.
        }
      }

      toast.success(`Đã áp dụng chủ đề nền "${preset.name}"`);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu chủ đề hình nền'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Live Preview */}
      <div
        style={{
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div
          style={{
            padding: '9px 14px',
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>
            Xem trước: #{channelName}
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#1E40FF',
              background: '#EEF2FF',
              padding: '2px 8px',
              borderRadius: 999,
            }}
          >
            {activePreset.name}
          </span>
        </div>

        <div
          style={{
            position: 'relative',
            padding: 16,
            minHeight: 132,
            background: activePreset.cssBackground,
            backgroundSize: activePreset.id === 'cloud_grid' ? '18px 18px' : 'cover',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: '#FFFFFF',
              opacity: 1 - overlayOpacity,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'relative',
              alignSelf: 'flex-start',
              maxWidth: '78%',
              padding: '8px 12px',
              borderRadius: '14px 14px 14px 4px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              fontSize: '0.79rem',
              fontWeight: 600,
              color: '#0F172A',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
            }}
          >
            Giao diện Royal Sapphire sáng rõ, tương phản cao cho đội ngũ!
          </div>
          <div
            style={{
              position: 'relative',
              alignSelf: 'flex-end',
              maxWidth: '78%',
              padding: '8px 12px',
              borderRadius: '14px 14px 4px 14px',
              background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
              fontSize: '0.79rem',
              fontWeight: 600,
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(30, 64, 255, 0.22)',
            }}
          >
            Đã đồng bộ chủ đề kênh tức thì ✨
          </div>
        </div>
      </div>

      {/* 8 Presets Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 10,
        }}
      >
        {ROYAL_WALLPAPER_PRESETS.map((preset) => {
          const isSelected = preset.id === selectedPresetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelectedPresetId(preset.id)}
              style={{
                padding: 10,
                borderRadius: 14,
                border: isSelected ? '2px solid #1E40FF' : '1px solid #E2E8F0',
                background: '#FFFFFF',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                boxShadow: isSelected ? '0 4px 14px rgba(30, 64, 255, 0.14)' : 'none',
              }}
            >
              <div
                style={{
                  height: 52,
                  borderRadius: 10,
                  background: preset.swatchGradient,
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-end',
                  padding: 6,
                }}
              >
                {isSelected && (
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#1E40FF',
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={12} />
                  </span>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A' }}>
                  {preset.name}
                </div>
                <div style={{ fontSize: '0.66rem', color: '#64748B', marginTop: 2, lineHeight: 1.35 }}>
                  {preset.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Opacity Slider */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 12,
          background: '#F8F9FA',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
          Độ đậm sắc thái nền ({Math.round(overlayOpacity * 100)}%)
        </span>
        <input
          type="range"
          min={0.3}
          max={1}
          step={0.05}
          value={overlayOpacity}
          onChange={(e) => setOverlayOpacity(Number(e.target.value))}
          style={{ width: 180, accentColor: '#1E40FF' }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          disabled={saving}
          onClick={() => persistWallpaper(ROYAL_WALLPAPER_PRESETS[0].id, 1)}
          style={{
            minHeight: 40,
            padding: '0 14px',
            borderRadius: 11,
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            color: '#475569',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={14} />
          <span>Mặc định sáng</span>
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              minHeight: 40,
              padding: '0 14px',
              borderRadius: 11,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => persistWallpaper(selectedPresetId, overlayOpacity)}
            style={{
              minHeight: 40,
              padding: '0 18px',
              borderRadius: 11,
              border: 'none',
              background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(30, 64, 255, 0.24)',
            }}
          >
            <Palette size={14} />
            <span>{saving ? 'Đang lưu...' : 'Lưu hình nền'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const ChatWallpaperModal: React.FC<ChatWallpaperModalProps> = (props) => {
  const { isOpen, onClose, channelId, currentWallpaper } = props;
  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Tùy chỉnh Chủ đề Nền Kênh Trò chuyện" width={680}>
      {isOpen && (
        <WallpaperInnerBody
          key={`${channelId}_${currentWallpaper.preset_id}`}
          {...props}
        />
      )}
    </CustomModal>
  );
};

export default ChatWallpaperModal;
