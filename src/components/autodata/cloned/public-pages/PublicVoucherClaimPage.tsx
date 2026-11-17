import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowRight, Gift, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../autodataApi';
import { PublicRouteSkeleton } from '../components/ui/Skeleton';
import { ClaimSuccessCard } from '../modules/marketing-vouchers/ClaimSuccessCard';
import { generateBrandedQrSvg } from '../modules/marketing-vouchers/qrGenerator';
import {
  formatVoucherRewardLabel,
  type PublicVoucherClaimResponseDto,
  type PublicVoucherInfoDto,
} from '../modules/marketing-vouchers/voucherTypes';

export interface PublicVoucherClaimPageProps {
  id?: string;
  slug?: string;
}

export const PublicVoucherClaimPage: React.FC<PublicVoucherClaimPageProps> = (props) => {
  const params = useParams<{ id?: string; slug?: string; tenant?: string }>();

  const resolvedIdentifier = useMemo(() => {
    if (props.id) return props.id;
    if (props.slug) return props.slug;
    if (params.id) return params.id;
    if (params.slug) return params.slug;
    if (typeof window !== 'undefined') {
      const m = window.location.pathname.match(/\/(?:claim|vouchers)\/(?:([^/]+)\/)?([^/?#]+)/i);
      if (m) return decodeURIComponent(m[2] || m[1] || '');
    }
    return '';
  }, [props.id, props.slug, params.id, params.slug]);

  const tenantHint = useMemo(() => {
    if (params.tenant) return params.tenant;
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('tenant_slug') || sp.get('tenant') || '';
    }
    return '';
  }, [params.tenant]);

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<PublicVoucherInfoDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [claimed, setClaimed] = useState<PublicVoucherClaimResponseDto | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!resolvedIdentifier) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const qs = tenantHint ? `?tenant_slug=${encodeURIComponent(tenantHint)}` : '';
        const info = await apiRequest<PublicVoucherInfoDto>(
          `/api/v1/public/marketing/vouchers/${encodeURIComponent(resolvedIdentifier)}${qs}`,
          { tenantSlug: tenantHint || undefined }
        );
        if (!cancelled) setCampaign(info);
      } catch {
        if (!cancelled) setCampaign(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedIdentifier, tenantHint]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    if (!cleanPhone && !cleanEmail) {
      toast.error('Vui lòng nhập Số điện thoại hoặc Email để nhận mã ưu đãi.');
      return;
    }
    const claimKey = campaign?.slug || resolvedIdentifier;
    if (!claimKey) return;

    setSubmitting(true);
    try {
      const res = await apiRequest<PublicVoucherClaimResponseDto>(
        `/api/v1/public/marketing/vouchers/${encodeURIComponent(claimKey)}/claim`,
        {
          method: 'POST',
          tenantSlug: tenantHint || undefined,
          body: {
            name: name.trim() || undefined,
            phone: cleanPhone || undefined,
            email: cleanEmail || undefined,
            tenant_slug: tenantHint || undefined,
          },
        }
      );
      setClaimed(res);
      toast.success('Nhận mã ưu đãi thành công!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cấp phát mã ưu đãi lúc này.'));
    } finally {
      setSubmitting(false);
    }
  };

  const claimedCodeValue = claimed?.code || '';
  const claimedQrSvg = useMemo(() => {
    if (!claimedCodeValue) return '';
    return generateBrandedQrSvg({
      value: claimedCodeValue,
      fgColor: '#1E40FF',
      bgColor: '#FFFFFF',
      cornerRadius: 14,
      logoUrl: '/imgs/autodata/ICON.png',
      moduleShape: 'rounded',
      eyeFrameShape: 'rounded',
      eyeBallShape: 'rounded',
      gradientMode: 'linear',
      gradientEndColor: '#0284C7',
      frameStyle: 'none',
    });
  }, [claimedCodeValue]);

  if (resolvedIdentifier && loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '2rem 1rem' }}>
        <PublicRouteSkeleton />
      </div>
    );
  }

  if (!resolvedIdentifier || !campaign) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: 440, width: '100%', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 22, padding: '2.25rem 1.75rem', textAlign: 'center', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <AlertCircle size={28} />
          </div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Không Tìm Thấy Chiến Dịch Ưu Đãi</h1>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: 8, lineHeight: 1.5 }}>
            Đường dẫn nhận mã không hợp lệ hoặc chương trình khuyến mãi đã tạm ngưng phát hành.
          </p>
        </div>
      </div>
    );
  }

  const rewardSummary = formatVoucherRewardLabel(campaign.discount_type, campaign.discount_value, formatVnd);

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 480, width: '100%', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: '2rem 1.85rem', boxShadow: '0 20px 50px -12px rgba(30, 64, 255, 0.12), 0 4px 16px rgba(15, 23, 42, 0.04)', position: 'relative', zIndex: 2 }}>
        <AnimatePresence mode="wait">
          {claimed ? (
            <ClaimSuccessCard
              claimed={claimed}
              campaignName={campaign.name}
              rewardSummary={rewardSummary}
              qrSvgMarkup={claimedQrSvg}
            />
          ) : (
            <motion.div key="claim-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div style={{ textAlign: 'center', marginBottom: '1.35rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: '#EEF2FF', border: '1px solid #DBEAFE', color: '#1E40FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem' }}>
                  <Gift size={26} />
                </div>
                {campaign.company_name && (
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1E40FF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    {campaign.company_name}
                  </div>
                )}
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>{campaign.name}</h1>
                {campaign.description && (
                  <p style={{ fontSize: '0.83rem', color: '#64748B', marginTop: 6, lineHeight: 1.5 }}>{campaign.description}</p>
                )}
                <div style={{ marginTop: 12, padding: '0.65rem 1rem', borderRadius: 12, background: '#EFF6FF', border: '1px solid #DBEAFE', display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, fontSize: '0.8rem', fontWeight: 700, color: '#1E40FF' }}>
                  <span>Ưu đãi: {rewardSummary}</span>
                  {campaign.min_order_vnd > 0 && <span>• Đơn tối thiểu {formatVnd(campaign.min_order_vnd)}</span>}
                  {campaign.expires_at && <span>• HSD: {formatShortDate(campaign.expires_at)}</span>}
                </div>
              </div>

              <form onSubmit={(e) => void handleClaim(e)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>Họ và tên của bạn</label>
                  <input className="form-input" style={{ height: 44 }} placeholder="Nhập họ tên..." value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>Số điện thoại nhận mã (Hoặc nhập Email bên dưới)</label>
                  <input type="tel" className="form-input" style={{ height: 44 }} placeholder="0909 123 456" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>Địa chỉ Email</label>
                  <input type="email" className="form-input" style={{ height: 44 }} placeholder="ban@congty.vn" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ marginTop: 6, height: 46, width: '100%', borderRadius: 14, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 800, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 8px 20px -4px rgba(30, 64, 255, 0.35)' }}
                >
                  {submitting ? 'Đang xác thực & cấp mã...' : 'Nhận Mã Ưu Đãi Ngay'}
                  {!submitting && <ArrowRight size={17} />}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>
        <ShieldCheck size={14} color="#1E40FF" />
        <span>Secured by DOMATION Anti-Fraud™</span>
      </div>
    </div>
  );
};

export default PublicVoucherClaimPage;
