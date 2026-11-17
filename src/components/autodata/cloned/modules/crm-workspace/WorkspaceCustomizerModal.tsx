import React, { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { CustomModal } from '../../components/ui/CustomModal';

export interface WorkspacePreferencesState {
  wallpaper_url: string;
  grid_columns: number;
  overlay_opacity: number;
  hide_completed: boolean;
}

export interface WorkspaceCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: WorkspacePreferencesState;
  onSave: (next: WorkspacePreferencesState) => Promise<void> | void;
}

const BRIGHT_SAPPHIRE_SURFACES = [
  { id: 'pure', name: 'Mặc định Sáng Phẳng (#F8F9FA)', value: '' },
  {
    id: 'sapphire_glow',
    name: 'Ánh Lam Royal Sapphire Dịu',
    value: 'linear-gradient(135deg, #F8F9FA 0%, #EFF6FF 60%, #E0F2FE 100%)',
  },
  {
    id: 'mint_breeze',
    name: 'Sương Sớm Ngọc Bích',
    value: 'linear-gradient(135deg, #F8F9FA 0%, #ECFDF5 65%, #F0FDF4 100%)',
  },
  {
    id: 'violet_cloud',
    name: 'Mây Tím Sáng Tinh Tế',
    value: 'linear-gradient(135deg, #F8F9FA 0%, #F5F3FF 65%, #EFF6FF 100%)',
  },
];

export const WorkspaceCustomizerModal: React.FC<WorkspaceCustomizerModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSave,
}) => {
  const [wallpaper, setWallpaper] = useState(preferences.wallpaper_url || '');
  const [cols, setCols] = useState(preferences.grid_columns || 3);
  const [opacity, setOpacity] = useState(preferences.overlay_opacity ?? 15);
  const [hideCompleted, setHideCompleted] = useState(preferences.hide_completed);

  const handleApply = async () => {
    await onSave({
      wallpaper_url: wallpaper,
      grid_columns: cols,
      overlay_opacity: opacity,
      hide_completed: hideCompleted,
    });
    onClose();
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Tùy biến Không gian Bàn làm việc Cá nhân">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Palette size={15} color="#1E40FF" /> Phông nền Bright Royal Sapphire:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {BRIGHT_SAPPHIRE_SURFACES.map((sf) => {
              const selected = wallpaper === sf.value;
              return (
                <button
                  key={sf.id}
                  type="button"
                  onClick={() => setWallpaper(sf.value)}
                  style={{
                    height: 54,
                    padding: '0 12px',
                    borderRadius: 12,
                    border: selected ? '2px solid #1E40FF' : '1px solid #E2E8F0',
                    background: sf.value || '#F8F9FA',
                    color: '#0F172A',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <span>{sf.name}</span>
                  {selected && <Check size={15} color="#1E40FF" />}
                </button>
              );
            })}
          </div>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
            Số cột hiển thị thẻ công việc: {cols} cột
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCols(n)}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 10,
                  border: cols === n ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                  background: cols === n ? '#EFF6FF' : '#FFFFFF',
                  color: cols === n ? '#1E40FF' : '#475569',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {n} Cột
              </button>
            ))}
          </div>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
            Độ dịu lớp phủ nền ({opacity}%)
          </span>
          <input
            type="range"
            min={0}
            max={60}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            style={{ accentColor: '#1E40FF' }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, color: '#0F172A' }}>
          <input
            type="checkbox"
            checked={hideCompleted}
            onChange={(e) => setHideCompleted(e.target.checked)}
            style={{ width: 17, height: 17, accentColor: '#1E40FF' }}
          />
          Tự động ẩn các công việc đã hoàn thành (Done)
        </label>

        <button
          type="button"
          onClick={() => void handleApply()}
          style={{ height: 44, borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
        >
          Lưu Thiết lập Bàn làm việc
        </button>
      </div>
    </CustomModal>
  );
};
