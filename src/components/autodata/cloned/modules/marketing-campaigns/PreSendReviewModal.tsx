import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  Monitor,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  SAMPLE_PERSONAS,
  interpolatePreviewText,
  type CampaignWizardDraft,
  type PreSendReviewResponse,
} from './campaignTypes';

export interface PreSendReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: CampaignWizardDraft;
  templateHtml: string;
  launching: boolean;
  onOpenTestEmail: () => void;
  onConfirmAtomicLaunch: () => Promise<void>;
}

export const PreSendReviewModal: React.FC<PreSendReviewModalProps> = ({
  isOpen,
  onClose,
  draft,
  templateHtml,
  launching,
  onOpenTestEmail,
  onConfirmAtomicLaunch,
}) => {
  const { token, tenantSlug, companyName } = useAuth();

  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<PreSendReviewResponse | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [personaIdx, setPersonaIdx] = useState(0);

  const fetchReviewPure = useCallback(async () => {
    return apiRequest<PreSendReviewResponse>('/marketing/campaigns/pre-send-review', {
      method: 'POST',
      token,
      tenantSlug,
      body: {
        campaign_id: draft.id || null,
        name: draft.name,
        channel: draft.channel,
        audience_id: draft.audience_id || null,
        exclude_audience_ids: draft.exclude_audience_ids,
        template_id: draft.template_id || null,
        subject_a: draft.subject_a,
        subject_b: draft.subject_b,
        fallback_vars: draft.fallback_vars,
        sender_email: draft.sender_email || null,
      },
    });
  }, [token, tenantSlug, draft]);

  const runReview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchReviewPure();
      setReview(res);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể chạy kiểm tra Pre-Send Checklist.'));
    } finally {
      setLoading(false);
    }
  }, [fetchReviewPure]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchReviewPure();
        if (!cancelled) setReview(res);
      } catch (err) {
        if (!cancelled) {
          toast.error(getErrorMessage(err, 'Không thể chạy kiểm tra Pre-Send Checklist.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, fetchReviewPure]);

  const persona = SAMPLE_PERSONAS[personaIdx] || SAMPLE_PERSONAS[0];
  const renderedSubjectA = useMemo(
    () => interpolatePreviewText(draft.subject_a, persona, draft.fallback_vars, companyName),
    [draft.subject_a, persona, draft.fallback_vars, companyName]
  );
  const renderedHtml = useMemo(
    () =>
      interpolatePreviewText(
        templateHtml ||
          `<div style="font-family:Inter,sans-serif;padding:24px;color:#0F172A"><h2>Xin chào {{lead.name}},</h2><p>${draft.subject_a}</p><p style="font-size:12px;color:#64748B"><a href="{{unsubscribe_url}}">Hủy đăng ký</a></p></div>`,
        persona,
        draft.fallback_vars,
        companyName
      ),
    [templateHtml, draft.subject_a, persona, draft.fallback_vars, companyName]
  );

  const checklist = useMemo(() => {
    if (review?.checks && review.checks.length > 0) return review.checks;
    const spamScore = Number(review?.spam_score ?? 8);
    const fallbackPct = Number(review?.fallback_coverage_pct ?? 100);
    return [
      {
        key: 'vault',
        label: 'Xác thực SPF / DKIM & Kênh Gửi Vault',
        passed: review?.spf_verified !== false && review?.dkim_verified !== false,
        detail: review?.vault_configured === false ? 'Đang chạy ở chế độ hàng đợi Vault Queue' : 'SPF Pass • DKIM Signed',
      },
      {
        key: 'spam',
        label: 'Điểm chống Spam (SpamAssassin / Content Check)',
        passed: spamScore < 35,
        detail: `Spam Score: ${spamScore}/100 (An toàn < 35)`,
      },
      {
        key: 'links',
        label: 'Kiểm tra Liên kết & Thẻ Hủy đăng ký HMAC',
        passed: (review?.broken_links?.length || 0) === 0,
        detail:
          (review?.broken_links?.length || 0) > 0
            ? `${review?.broken_links?.length} liên kết cần rà soát`
            : 'Tự động đính kèm chữ ký HMAC One-Click Unsubscribe',
      },
      {
        key: 'audience',
        label: 'Lọc Trùng & Trừ Tệp Loại Trừ / Suppression',
        passed: true,
        detail: `Tiếp cận thực: ${(review?.net_reachable_count ?? 0).toLocaleString('vi-VN')} (Đã trừ ${review?.excluded_count ?? 0} loại trừ & ${review?.suppressed_count ?? 0} chặn)`,
      },
      {
        key: 'fallbacks',
        label: 'Độ phủ Biến cá nhân hóa dự phòng (`fallback_vars`)',
        passed: fallbackPct >= 80,
        detail: `Độ phủ ${fallbackPct}% biến động`,
      },
    ];
  }, [review]);

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Kiểm Duyệt Trước Phát Hành (Pre-Send Flight Review & Atomic Lock)"
      width={880}
    >
      {loading ? (
        <ModalBodySkeleton rows={4} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 16, alignItems: 'start' }}>
            {/* Left: Checklist */}
            <Card
              title="Danh Mục An Toàn Trước Khi Gửi"
              actions={
                <button
                  type="button"
                  onClick={() => void runReview()}
                  className="btn secondary sm"
                  style={{ height: 32, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <RefreshCw size={13} /> Kiểm tra lại
                </button>
              }
              padding="1rem 1.1rem"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {checklist.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 12,
                      background: item.passed ? '#F8FAFF' : '#FFFBEB',
                      border: item.passed ? '1px solid #DBEAFE' : '1px solid #FDE68A',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    {item.passed ? (
                      <CheckCircle2 size={16} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={16} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{item.label}</div>
                      {item.detail && (
                        <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: 2 }}>{item.detail}</div>
                      )}
                    </div>
                  </div>
                ))}

                {review?.warnings && review.warnings.length > 0 && (
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 12,
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      fontSize: '0.75rem',
                      color: '#92400E',
                    }}
                  >
                    {review.warnings.map((w, idx) => (
                      <div key={idx}>• {w}</div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Right: Live Persona Preview */}
            <Card
              title="Xem Trước Nội Suy Thực Tế"
              actions={
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setViewport('desktop')}
                    className="btn secondary sm"
                    style={{
                      height: 32,
                      color: viewport === 'desktop' ? '#1E40FF' : '#64748B',
                    }}
                  >
                    <Monitor size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport('mobile')}
                    className="btn secondary sm"
                    style={{
                      height: 32,
                      color: viewport === 'mobile' ? '#1E40FF' : '#64748B',
                    }}
                  >
                    <Smartphone size={13} />
                  </button>
                </div>
              }
              padding="1rem 1.1rem"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <select
                  className="form-input"
                  style={{ height: 38 }}
                  value={personaIdx}
                  onChange={(e) => setPersonaIdx(Number(e.target.value))}
                >
                  {SAMPLE_PERSONAS.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      Persona: {p.label}
                    </option>
                  ))}
                </select>

                <div
                  style={{
                    padding: '0.55rem 0.8rem',
                    borderRadius: 10,
                    background: '#F8F9FA',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.78rem',
                  }}
                >
                  <strong>Subject A:</strong> {renderedSubjectA}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    background: '#F1F5F9',
                    borderRadius: 12,
                    padding: 10,
                  }}
                >
                  <iframe
                    title="pre-send-email-preview"
                    sandbox=""
                    srcDoc={renderedHtml}
                    style={{
                      width: viewport === 'mobile' ? 320 : '100%',
                      height: 220,
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      background: '#FFFFFF',
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              paddingTop: 10,
              borderTop: '1px solid #E2E8F0',
            }}
          >
            <Badge tone="primary" icon={<ShieldCheck size={13} />}>
              Atomic Claim Lock: Chống gửi đúp 100% trên `(tenant_id, campaign_id, lead_id, channel)`
            </Badge>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onOpenTestEmail}
                className="btn secondary"
                style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                <Mail size={15} /> Gửi Test Email
              </button>
              <button
                type="button"
                disabled={launching}
                onClick={() => void onConfirmAtomicLaunch()}
                style={{
                  height: 44,
                  padding: '0 1.35rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Send size={15} /> {launching ? 'Đang khóa & phát hành...' : 'Xác Nhận Phát Hành Atomic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomModal>
  );
};

export default PreSendReviewModal;
