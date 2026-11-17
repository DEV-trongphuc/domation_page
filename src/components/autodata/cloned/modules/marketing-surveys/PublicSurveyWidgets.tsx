import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Gift,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { matchScoreRedirectRule } from './surveyLogicHelpers';
import type { PublicSurveySubmitResponse, SurveyItemDto } from './surveyTypes';

export const PublicCelebrationCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth || 640;
    canvas.height = canvas.offsetHeight || 280;

    const palette = ['#1E40FF', '#06B6D4', '#10B981', '#F59E0B', '#6366F1'];
    const particles = Array.from({ length: 48 }).map((_, i) => ({
      x: (canvas.width / 48) * i + 6,
      y: -10 - (i % 6) * 18,
      vy: 1.8 + (i % 4) * 0.65,
      vx: ((i % 5) - 2) * 0.55,
      size: 5 + (i % 4) * 2,
      color: palette[i % palette.length],
      rot: i * 0.4,
    }));

    let raf = 0;
    let frames = 0;
    const draw = () => {
      frames += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += 0.06;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx.restore();
      }
      if (frames < 160) {
        raf = window.requestAnimationFrame(draw);
      }
    };
    raf = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
};

export const CoverCountdownBadge: React.FC<{ targetIso?: string }> = ({ targetIso }) => {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (!targetIso) return;
    const targetMs = new Date(targetIso).getTime();
    if (Number.isNaN(targetMs)) return;

    const update = () => {
      const diff = Math.max(0, targetMs - Date.now());
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      const pad = (n: number) => String(n).padStart(2, '0');
      setText(diff <= 0 ? 'Đã hết hạn ưu đãi' : `${d > 0 ? `${d}d ` : ''}${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [targetIso]);

  if (!text) return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 999,
        background: 'rgba(15, 23, 42, 0.32)',
        border: '1px solid rgba(255,255,255,0.25)',
        color: '#FFFFFF',
        fontSize: '0.75rem',
        fontWeight: 800,
        fontFamily: 'monospace',
      }}
    >
      <Clock size={13} /> {text}
    </div>
  );
};

interface ThankYouCardProps {
  survey: SurveyItemDto;
  submitResult: PublicSurveySubmitResponse;
  primaryColor: string;
}

export const PublicSurveyThankYouCard: React.FC<ThankYouCardProps> = ({
  survey,
  submitResult,
  primaryColor,
}) => {
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  const matchedRule = matchScoreRedirectRule(
    submitResult.quiz_score,
    survey.settings,
    survey.redirect_rules
  );
  const finalTitle =
    submitResult.thank_you_title ||
    matchedRule?.thankYouTitle ||
    survey.settings.thank_you_title ||
    'Cảm ơn bạn đã hoàn thành khảo sát!';
  const finalMessage =
    submitResult.thank_you_message ||
    matchedRule?.thankYouMessage ||
    survey.settings.thank_you_message ||
    'Phản hồi của bạn đã được hệ thống ghi nhận thành công.';
  const voucherCode = submitResult.voucher_code || submitResult.reward_voucher_code || '';
  const redirectUrl =
    submitResult.redirect_url ||
    matchedRule?.redirectUrl ||
    survey.settings.thank_you_cta_url ||
    '';

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <Toaster position="top-center" />
      <div style={{ position: 'relative', overflow: 'hidden', maxWidth: 540, width: '100%', background: '#FFFFFF', border: '1px solid #DBEAFE', borderRadius: 24, padding: '2.2rem 1.8rem', textAlign: 'center', boxShadow: '0 20px 50px rgba(30,64,255,0.10)' }}>
        <PublicCelebrationCanvas />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <CheckCircle2 size={50} color={primaryColor} style={{ margin: '0 auto 12px' }} />
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{finalTitle}</h1>
          <p style={{ margin: '8px 0 18px', fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>{finalMessage}</p>

          <div style={{ padding: '1rem', borderRadius: 16, background: '#F8FAFF', border: '1px solid #DBEAFE', marginBottom: 14 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Award size={14} color={primaryColor} /> Điểm Đánh Giá Của Bạn
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: primaryColor, marginTop: 2 }}>
              +{submitResult.quiz_score} điểm
            </div>
            {submitResult.tags_applied?.length > 0 && (
              <div style={{ fontSize: '0.76rem', color: '#334155', marginTop: 4 }}>
                Phân hạng: <strong>{submitResult.tags_applied.join(' • ')}</strong>
              </div>
            )}
          </div>

          {voucherCode && (
            <div style={{ padding: '1rem', borderRadius: 16, background: '#ECFDF5', border: '1.5px dashed #10B981', marginBottom: 14 }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 6 }}>
                <Gift size={15} /> MÃ VOUCHER THƯỞNG DÀNH CHO BẠN
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <code style={{ fontSize: '1.25rem', fontWeight: 900, color: '#065F46', background: '#FFFFFF', padding: '6px 14px', borderRadius: 10, border: '1px solid #A7F3D0' }}>
                  {voucherCode}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(voucherCode);
                    setCopiedVoucher(true);
                    toast.success('Đã sao chép mã Voucher!');
                    setTimeout(() => setCopiedVoucher(false), 2000);
                  }}
                  style={{ height: 40, padding: '0 12px', borderRadius: 10, border: 'none', background: '#059669', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  {copiedVoucher ? <Check size={14} /> : <Copy size={14} />} Copy
                </button>
              </div>
            </div>
          )}

          {redirectUrl && (
            <a
              href={redirectUrl}
              style={{
                height: 46,
                padding: '0 1.4rem',
                borderRadius: 12,
                background: primaryColor,
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                textDecoration: 'none',
                marginTop: 4,
              }}
            >
              {survey.settings.thank_you_cta_label || 'Tiếp tục nhận ưu đãi'} <ExternalLink size={15} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
