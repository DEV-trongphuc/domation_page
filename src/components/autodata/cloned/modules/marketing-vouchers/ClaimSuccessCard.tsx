import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCircle2, Copy, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  CELEBRATION_CONFETTI_SPECS,
  type PublicVoucherClaimResponseDto,
} from './voucherTypes';

export interface ClaimSuccessCardProps {
  claimed: PublicVoucherClaimResponseDto;
  campaignName: string;
  rewardSummary: string;
  qrSvgMarkup: string;
}

export const ClaimSuccessCard: React.FC<ClaimSuccessCardProps> = ({
  claimed,
  campaignName,
  rewardSummary,
  qrSvgMarkup,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!claimed.code) return;
    void navigator.clipboard?.writeText(claimed.code);
    setCopied(true);
    toast.success('Đã sao chép mã ưu đãi!');
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <motion.div
      key="claimed-view"
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ textAlign: 'center', position: 'relative' }}
    >
      <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 38, pointerEvents: 'none' }}>
        {CELEBRATION_CONFETTI_SPECS.map((p) => (
          <motion.span
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
            animate={{
              x: p.dx,
              y: p.dy,
              opacity: [1, 1, 0],
              scale: [0.5, 1.15, 0.8],
              rotate: p.rotate,
            }}
            transition={{ duration: 1.15, delay: p.delay, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: 3,
              background: p.color,
            }}
          />
        ))}
      </div>

      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#059669',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 0.9rem',
        }}
      >
        <CheckCircle2 size={32} />
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: 999,
          background: '#EFF6FF',
          color: '#1E40FF',
          fontSize: '0.72rem',
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        <Sparkles size={12} /> Chúc mừng bạn đã nhận ưu đãi!
      </div>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
        {claimed.pool_name || campaignName}
      </h2>
      <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 1.15rem' }}>
        Xuất trình mã ưu đãi hoặc mã QR bên dưới tại quầy thanh toán để áp dụng {rewardSummary}.
      </p>

      <div
        onClick={handleCopyCode}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleCopyCode();
        }}
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 16,
          background: '#F8FAFF',
          border: '1.5px dashed #1E40FF',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            MÃ VOUCHER ĐỘC QUYỀN CỦA BẠN
          </div>
          <div
            style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              fontFamily: 'monospace',
              color: '#1E40FF',
              letterSpacing: '0.06em',
              marginTop: 2,
            }}
          >
            {claimed.code}
          </div>
        </div>
        <span
          style={{
            height: 38,
            padding: '0 0.9rem',
            borderRadius: 10,
            background: copied ? '#059669' : '#1E40FF',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.78rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Đã chép' : 'Sao chép'}
        </span>
      </div>

      {qrSvgMarkup && (
        <div style={{ display: 'flex', justifyContent: 'center', transform: 'scale(0.66)', margin: '-36px 0' }}>
          <div dangerouslySetInnerHTML={{ __html: qrSvgMarkup }} />
        </div>
      )}
    </motion.div>
  );
};

export default ClaimSuccessCard;
