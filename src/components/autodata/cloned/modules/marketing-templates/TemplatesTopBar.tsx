import React from 'react';
import {
  ArrowLeft,
  Image as ImageIcon,
  Mail,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import type { SenderVaultStatus } from './templateTypes';

export interface TemplatesTopBarProps {
  mode: 'library' | 'editor';
  saving: boolean;
  canCreate: boolean;
  senderVault?: SenderVaultStatus;
  onOpenImageLibrary: () => void;
  onOpenStudio: () => void;
  onOpenNewEditor: () => void;
  onBackToLibrary: () => void;
  onOpenValidation: () => void;
  onOpenQuickSend: () => void;
  onSaveTemplate: () => void;
}

export const TemplatesTopBar: React.FC<TemplatesTopBarProps> = ({
  mode,
  saving,
  canCreate,
  senderVault,
  onOpenImageLibrary,
  onOpenStudio,
  onOpenNewEditor,
  onBackToLibrary,
  onOpenValidation,
  onOpenQuickSend,
  onSaveTemplate,
}) => (
  <Card padding="1.25rem 1.5rem" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 15,
            background: '#EEF2FF',
            border: '1px solid #DBEAFE',
            color: '#1E40FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Mail size={22} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Email Studio & Trình Kéo-Thả 15 Khối
            </h1>
            <Badge tone="primary">Bright Royal Sapphire Studio</Badge>
            <Badge tone={senderVault?.configured ? 'success' : 'info'} icon={<ShieldCheck size={12} />}>
              {senderVault?.configured ? `Vault: ${senderVault.provider}` : 'Sẵn sàng nối SES / SMTP Vault'}
            </Badge>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
            Thiết kế đa cột, bảng trực quan, đồng hồ SVG, phân quyền ACL & <strong>DOM Agent Email Studio</strong>.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <ScreenHelpButton screenKey="mkt_templates" />
        <button
          type="button"
          onClick={onOpenImageLibrary}
          className="btn secondary"
          style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ImageIcon size={15} /> Media Library
        </button>
        <button
          type="button"
          onClick={onOpenStudio}
          className="btn secondary"
          style={{ height: 44, color: '#1E40FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Sparkles size={16} /> DOM Agent Email Studio
        </button>
        {mode === 'library' ? (
          canCreate && (
            <button
              type="button"
              onClick={onOpenNewEditor}
              style={{
                height: 44,
                padding: '0 1.2rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Plus size={16} /> Tạo Mẫu Email Mới
            </button>
          )
        ) : (
          <>
            <button
              type="button"
              onClick={onBackToLibrary}
              className="btn secondary"
              style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <ArrowLeft size={15} /> Thư viện
            </button>
            <button
              type="button"
              onClick={onOpenValidation}
              className="btn secondary"
              style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <ShieldCheck size={15} color="#1E40FF" /> Kiểm định Spam
            </button>
            <button
              type="button"
              onClick={onOpenQuickSend}
              className="btn secondary"
              style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Send size={15} /> Gửi nhanh / Thử
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onSaveTemplate}
              style={{
                height: 44,
                padding: '0 1.25rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu & Biên dịch HTML'}
            </button>
          </>
        )}
      </div>
    </div>
  </Card>
);

export default TemplatesTopBar;
