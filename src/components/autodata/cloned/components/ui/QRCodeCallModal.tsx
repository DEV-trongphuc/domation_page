import React, { useEffect, useMemo, useState } from 'react';
import { Phone, Copy, Check, QrCode, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from './CustomModal';
import { generateBrandedQrSvg } from '../../modules/marketing-vouchers/qrGenerator';

export interface QRCodeCallModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  phone?: string;
  contactName?: string;
  leadName?: string;
}

interface QrCallEventDetail {
  phone?: string;
  contactName?: string;
  leadName?: string;
  name?: string;
}

function sanitizeTelValue(rawPhone: string): string {
  const cleaned = (rawPhone || '').trim().replace(/[^0-9+]/g, '');
  return cleaned;
}

export const QRCodeCallModal: React.FC<QRCodeCallModalProps> = ({
  isOpen: controlledOpen,
  onClose: controlledOnClose,
  phone: propPhone,
  contactName: propContactName,
  leadName: propLeadName,
}) => {
  const [eventOpen, setEventOpen] = useState(false);
  const [eventPayload, setEventPayload] = useState<QrCallEventDetail>({});
  const [copied, setCopied] = useState(false);

  const isControlled = typeof controlledOpen === 'boolean';
  const isOpen = isControlled ? Boolean(controlledOpen) : eventOpen;

  const phone = isControlled
    ? (propPhone ?? '')
    : (eventPayload.phone ?? propPhone ?? '');
  const displayName = isControlled
    ? (propContactName || propLeadName || 'Khách hàng')
    : (eventPayload.contactName ||
      eventPayload.leadName ||
      eventPayload.name ||
      propContactName ||
      propLeadName ||
      'Khách hàng');

  useEffect(() => {
    if (isControlled) return undefined;

    const handleOpen = (evt: Event) => {
      const detail = (evt as CustomEvent<QrCallEventDetail>)?.detail || {};
      setEventPayload(detail);
      setCopied(false);
      setEventOpen(true);
    };

    window.addEventListener('open-qr-call-modal', handleOpen);
    return () => {
      window.removeEventListener('open-qr-call-modal', handleOpen);
    };
  }, [isControlled]);

  const handleClose = () => {
    setCopied(false);
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setEventOpen(false);
    }
  };

  const telDigits = useMemo(() => sanitizeTelValue(phone), [phone]);
  const telUri = telDigits ? `tel:${telDigits}` : '';

  const qrSvgMarkup = useMemo(() => {
    if (!telUri) return '';
    return generateBrandedQrSvg({
      value: telUri,
      fgColor: '#1E40FF',
      bgColor: '#FFFFFF',
      cornerRadius: 8,
      logoUrl: '/imgs/autodata/ICON.png',
    });
  }, [telUri]);

  const handleCopyPhone = async () => {
    if (!phone.trim()) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(phone.trim());
      } else {
        const input = document.createElement('input');
        input.value = phone.trim();
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      toast.success('Đã sao chép số điện thoại');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép số điện thoại');
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Quét QR để gọi nhanh"
      width="440px"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '4px 0 8px',
        }}
      >
        {/* Header Contact Badge */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '12px',
            backgroundColor: '#F8FAFF',
            border: '1px solid #BFDBFE',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#1E40FF',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Smartphone size={20} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                color: '#0F172A',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#1E40FF',
                marginTop: '2px',
              }}
            >
              {phone.trim() || 'Chưa có số điện thoại'}
            </div>
          </div>
        </div>

        {/* Branded Sapphire QR Surface */}
        <div
          style={{
            width: '232px',
            height: '232px',
            padding: '12px',
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 8px 24px -6px rgba(30, 64, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {qrSvgMarkup ? (
            <div
              className="qr-call-svg-host"
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              dangerouslySetInnerHTML={{ __html: qrSvgMarkup }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                color: '#64748B',
                textAlign: 'center',
              }}
            >
              <QrCode size={42} color="#94A3B8" />
              <span style={{ fontSize: '0.82rem' }}>
                Số điện thoại không hợp lệ để tạo mã QR
              </span>
            </div>
          )}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: '0.82rem',
            color: '#64748B',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Mở camera điện thoại hoặc Zalo để quét mã và quay số trực tiếp tới khách hàng.
        </p>

        {/* Actions - 44px Controls */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: telUri ? '1fr 1fr' : '1fr',
            gap: '10px',
            marginTop: '4px',
          }}
        >
          <button
            type="button"
            onClick={handleCopyPhone}
            disabled={!phone.trim()}
            style={{
              height: '44px',
              minHeight: '44px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              fontWeight: 600,
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: phone.trim() ? 'pointer' : 'not-allowed',
              opacity: phone.trim() ? 1 : 0.55,
            }}
          >
            {copied ? <Check size={16} color="#16A34A" /> : <Copy size={16} color="#475569" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép SĐT'}</span>
          </button>

          {telUri && (
            <a
              href={telUri}
              style={{
                height: '44px',
                minHeight: '44px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.86rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(30, 64, 255, 0.24)',
              }}
            >
              <Phone size={16} />
              <span>Gọi ngay</span>
            </a>
          )}
        </div>
      </div>
    </CustomModal>
  );
};

export default QRCodeCallModal;
