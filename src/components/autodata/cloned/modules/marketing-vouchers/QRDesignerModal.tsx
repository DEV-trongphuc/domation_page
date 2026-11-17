import React, { useMemo, useRef, useState } from 'react';
import {
  Circle,
  Diamond,
  Frame,
  Image as ImageIcon,
  Palette,
  QrCode,
  RotateCcw,
  Square,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { generateBrandedQrSvg } from './qrGenerator';
import { QRPreviewSaveCard } from './QRPreviewSaveCard';
import {
  DEFAULT_QR_DESIGN,
  type BrandedQrOptions,
  type QrEyeShape,
  type QrFrameStyle,
  type QrGradientMode,
  type QrModuleShape,
  type ShortlinkItemDto,
  type VoucherPoolDto,
} from './voucherTypes';

export interface QRDesignerStudioProps {
  initialDesign?: Partial<BrandedQrOptions>;
  defaultValue?: string;
  pools?: VoucherPoolDto[];
  shortlinks?: ShortlinkItemDto[];
  preselectedTarget?: { kind: 'voucher' | 'shortlink'; id: string } | null;
  onSaved?: () => void;
}

const MODULE_SHAPES: Array<{ id: QrModuleShape; label: string }> = [
  { id: 'square', label: 'Vuông chuẩn' },
  { id: 'dots', label: 'Chấm tròn' },
  { id: 'rounded', label: 'Bo góc mềm' },
  { id: 'diamond', label: 'Kim cương' },
];

const EYE_SHAPES: Array<{ id: QrEyeShape; label: string }> = [
  { id: 'square', label: 'Vuông' },
  { id: 'rounded', label: 'Bo tròn' },
  { id: 'circle', label: 'Tròn đồng tâm' },
];

const FRAME_STYLES: Array<{ id: QrFrameStyle; label: string }> = [
  { id: 'none', label: 'Không khung' },
  { id: 'bottom_pill', label: 'Nút Pill CTA dưới' },
  { id: 'card_badge', label: 'Thẻ Huy Hiệu Đầy Đủ' },
];

export const QRDesignerStudio: React.FC<QRDesignerStudioProps> = ({
  initialDesign,
  defaultValue,
  pools = [],
  shortlinks = [],
  preselectedTarget = null,
  onSaved,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cfg, setCfg] = useState<BrandedQrOptions>(() => ({
    ...DEFAULT_QR_DESIGN,
    ...initialDesign,
    value: defaultValue || initialDesign?.value || DEFAULT_QR_DESIGN.value,
  }));

  const svgMarkup = useMemo(() => generateBrandedQrSvg(cfg), [cfg]);

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ảnh Logo vượt quá giới hạn 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCfg((prev) => ({ ...prev, logoUrl: reader.result as string }));
        toast.success('Đã nạp Logo trung tâm lên bản xem trước!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const selectBtnStyle = (active: boolean): React.CSSProperties => ({
    height: 40,
    padding: '0 0.75rem',
    borderRadius: 10,
    border: active ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
    background: active ? '#EFF6FF' : '#FFFFFF',
    color: active ? '#1E40FF' : '#334155',
    fontWeight: active ? 700 : 600,
    fontSize: '0.78rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '1.15rem', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Card
          title="1. Nội Dung Mã Hóa & Hình Dạng Điểm Ảnh (Module & Finder Eyes)"
          actions={
            <button
              type="button"
              onClick={() => setCfg({ ...DEFAULT_QR_DESIGN, value: cfg.value })}
              className="btn secondary sm"
              style={{ height: 34, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <RotateCcw size={13} /> Mặc định Sapphire
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>
                URL Đích / Link Nhận Voucher (`/claim/:slug` hoặc Shortlink)
              </label>
              <input
                className="form-input"
                style={{ height: 44 }}
                value={cfg.value}
                onChange={(e) => setCfg((p) => ({ ...p, value: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <QrCode size={14} color="#1E40FF" /> Kiểu hạt dữ liệu (Module Dot Shape)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {MODULE_SHAPES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCfg((p) => ({ ...p, moduleShape: m.id }))}
                    style={selectBtnStyle(cfg.moduleShape === m.id)}
                  >
                    {m.id === 'dots' ? <Circle size={13} /> : m.id === 'diamond' ? <Diamond size={13} /> : <Square size={13} />}
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Khung mắt định vị (Finder Frame)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {EYE_SHAPES.map((s) => (
                    <button key={s.id} type="button" onClick={() => setCfg((p) => ({ ...p, eyeFrameShape: s.id }))} style={selectBtnStyle(cfg.eyeFrameShape === s.id)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Tâm mắt định vị (Finder Eyeball)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {EYE_SHAPES.map((s) => (
                    <button key={s.id} type="button" onClick={() => setCfg((p) => ({ ...p, eyeBallShape: s.id }))} style={selectBtnStyle(cfg.eyeBallShape === s.id)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="2. Phối Màu Thương Hiệu (Solid / Linear / Radial Gradient)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(
                [
                  { id: 'solid', label: 'Màu đơn sắc (Solid)' },
                  { id: 'linear', label: 'Chuyển sắc tuyến tính (Linear)' },
                  { id: 'radial', label: 'Chuyển sắc tâm (Radial)' },
                ] as Array<{ id: QrGradientMode; label: string }>
              ).map((g) => (
                <button key={g.id} type="button" onClick={() => setCfg((p) => ({ ...p, gradientMode: g.id }))} style={selectBtnStyle(cfg.gradientMode === g.id)}>
                  <Palette size={13} /> {g.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Màu chính</label>
                <input type="color" className="form-input" style={{ height: 44, padding: 4 }} value={cfg.fgColor} onChange={(e) => setCfg((p) => ({ ...p, fgColor: e.target.value, eyeColor: e.target.value }))} />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Màu chuyển cuối</label>
                <input type="color" className="form-input" style={{ height: 44, padding: 4, opacity: cfg.gradientMode === 'solid' ? 0.45 : 1 }} disabled={cfg.gradientMode === 'solid'} value={cfg.gradientEndColor || '#0284C7'} onChange={(e) => setCfg((p) => ({ ...p, gradientEndColor: e.target.value }))} />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Màu nền</label>
                <input type="color" className="form-input" style={{ height: 44, padding: 4 }} value={cfg.bgColor} onChange={(e) => setCfg((p) => ({ ...p, bgColor: e.target.value }))} />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Bo góc ({cfg.cornerRadius}px)</label>
                <input type="range" min={0} max={28} value={cfg.cornerRadius} onChange={(e) => setCfg((p) => ({ ...p, cornerRadius: Number(e.target.value) }))} style={{ width: '100%', marginTop: 12 }} />
              </div>
            </div>
          </div>
        </Card>

        <Card title="3. Logo Trung Tâm & Khung Kêu Gọi Hành Động (Branded CTA Frame)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  <ImageIcon size={13} style={{ display: 'inline', marginRight: 5 }} />
                  URL Logo trung tâm (Mặc định `/imgs/autodata/ICON.png`)
                </label>
                <input className="form-input" style={{ height: 44 }} value={cfg.logoUrl} onChange={(e) => setCfg((p) => ({ ...p, logoUrl: e.target.value }))} placeholder="/imgs/autodata/ICON.png hoặc dán URL..." />
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadLogo} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn secondary" style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Upload size={15} /> Tải Logo
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Kích thước Logo ({cfg.logoSizePct ?? 22}%)</label>
                <input type="range" min={14} max={30} value={cfg.logoSizePct ?? 22} onChange={(e) => setCfg((p) => ({ ...p, logoSizePct: Number(e.target.value) }))} style={{ width: '100%' }} />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Đệm viền Logo ({cfg.logoPadding ?? 6}px)</label>
                <input type="range" min={2} max={14} value={cfg.logoPadding ?? 6} onChange={(e) => setCfg((p) => ({ ...p, logoPadding: Number(e.target.value) }))} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
              <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Frame size={14} color="#1E40FF" /> Khung CTA (Frame Style)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                {FRAME_STYLES.map((f) => (
                  <button key={f.id} type="button" onClick={() => setCfg((p) => ({ ...p, frameStyle: f.id }))} style={selectBtnStyle(cfg.frameStyle === f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
              {cfg.frameStyle !== 'none' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 10 }}>
                  <input className="form-input" style={{ height: 44 }} value={cfg.frameText || ''} onChange={(e) => setCfg((p) => ({ ...p, frameText: e.target.value }))} placeholder="QUÉT NHẬN ƯU ĐÃI" />
                  <input type="color" className="form-input" style={{ height: 44, padding: 4 }} value={cfg.frameColor || '#1E40FF'} onChange={(e) => setCfg((p) => ({ ...p, frameColor: e.target.value }))} />
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <QRPreviewSaveCard
        cfg={cfg}
        svgMarkup={svgMarkup}
        pools={pools}
        shortlinks={shortlinks}
        preselectedTarget={preselectedTarget}
        onSaved={onSaved}
      />
    </div>
  );
};

export interface QRDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  initialDesign?: Partial<BrandedQrOptions>;
  defaultValue?: string;
  pools?: VoucherPoolDto[];
  shortlinks?: ShortlinkItemDto[];
  preselectedTarget?: { kind: 'voucher' | 'shortlink'; id: string } | null;
  onSaved?: () => void;
}

export const QRDesignerModal: React.FC<QRDesignerModalProps> = ({
  isOpen,
  onClose,
  title = 'Branded QR Studio — Thiết Kế Mã QR Thương Hiệu',
  initialDesign,
  defaultValue,
  pools,
  shortlinks,
  preselectedTarget,
  onSaved,
}) => (
  <CustomModal isOpen={isOpen} onClose={onClose} title={title} width={1040}>
    <QRDesignerStudio
      key={`${preselectedTarget?.kind || 'none'}:${preselectedTarget?.id || 'default'}:${defaultValue || ''}`}
      initialDesign={initialDesign}
      defaultValue={defaultValue}
      pools={pools}
      shortlinks={shortlinks}
      preselectedTarget={preselectedTarget}
      onSaved={() => {
        onSaved?.();
        onClose();
      }}
    />
  </CustomModal>
);

export default QRDesignerModal;
