import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  ShieldCheck,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { apiRequest, getErrorMessage } from '../../autodataApi';
import { PublicRouteSkeleton } from '../components/ui/Skeleton';
import { PublicSurveyBlockRenderer } from '../modules/marketing-surveys/PublicSurveyBlockRenderer';
import {
  CoverCountdownBadge,
  PublicSurveyThankYouCard,
} from '../modules/marketing-surveys/PublicSurveyWidgets';
import {
  evaluateBranchingNextStep,
  splitSurveyIntoPages,
} from '../modules/marketing-surveys/surveyLogicHelpers';
import {
  LAYOUT_BLOCK_TYPES,
  normalizeSurveyDto,
  type PublicSurveySubmitResponse,
  type SurveyItemDto,
} from '../modules/marketing-surveys/surveyTypes';

interface PublicSurveyPageProps {
  slug?: string;
  tenantSlug?: string;
}

function parseSurveyPath(pathname: string): { slug: string; tenant: string } {
  const twoSeg = pathname.match(/^\/s\/([^/?#]+)\/([^/?#]+)/);
  if (twoSeg) {
    return {
      tenant: decodeURIComponent(twoSeg[1]),
      slug: decodeURIComponent(twoSeg[2]),
    };
  }
  const oneSeg = pathname.match(/^\/s\/([^/?#]+)/);
  if (oneSeg) {
    return {
      tenant: '',
      slug: decodeURIComponent(oneSeg[1]),
    };
  }
  return { tenant: '', slug: '' };
}

export const PublicSurveyPage: React.FC<PublicSurveyPageProps> = (props) => {
  const params = useParams<{ slug?: string; tenant?: string }>();
  const location = useLocation();

  const resolvedRoute = useMemo(() => {
    const fromRouter = parseSurveyPath(location.pathname || '');
    const fromWindow =
      typeof window !== 'undefined' ? parseSurveyPath(window.location.pathname || '') : { slug: '', tenant: '' };
    const searchStr =
      location.search || (typeof window !== 'undefined' ? window.location.search : '');
    const qs = new URLSearchParams(searchStr);

    const slug =
      props.slug ||
      params.slug ||
      fromRouter.slug ||
      fromWindow.slug ||
      qs.get('slug') ||
      '';
    const tenant =
      props.tenantSlug ||
      params.tenant ||
      fromRouter.tenant ||
      fromWindow.tenant ||
      qs.get('tenant_slug') ||
      '';

    return {
      slug: slug.trim(),
      tenant: tenant.trim(),
      prefillName: qs.get('name') || '',
      prefillPhone: qs.get('phone') || '',
      prefillEmail: qs.get('email') || qs.get('uid') || '',
      utmSource: qs.get('utm_source') || qs.get('src') || 'public_link',
      utmMedium: qs.get('utm_medium') || '',
      utmCampaign: qs.get('utm_campaign') || '',
    };
  }, [props.slug, props.tenantSlug, params.slug, params.tenant, location.pathname, location.search]);

  const [loading, setLoading] = useState(() => Boolean(resolvedRoute.slug));
  const [errorMsg, setErrorMsg] = useState<string | null>(() =>
    resolvedRoute.slug ? null : 'Không tìm thấy mã định danh khảo sát (/s/:slug).'
  );
  const [survey, setSurvey] = useState<SurveyItemDto | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageHistory, setPageHistory] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [contactName, setContactName] = useState(() => resolvedRoute.prefillName);
  const [contactPhone, setContactPhone] = useState(() => resolvedRoute.prefillPhone);
  const [contactEmail, setContactEmail] = useState(() => resolvedRoute.prefillEmail);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<PublicSurveySubmitResponse | null>(null);

  useEffect(() => {
    if (!resolvedRoute.slug) return;

    let cancelled = false;
    const querySuffix = resolvedRoute.tenant
      ? `?tenant_slug=${encodeURIComponent(resolvedRoute.tenant)}`
      : '';

    apiRequest<Record<string, unknown>>(
      `/api/v1/public/marketing/surveys/${encodeURIComponent(resolvedRoute.slug)}${querySuffix}`,
      { tenantSlug: resolvedRoute.tenant || undefined }
    )
      .then((raw) => {
        if (cancelled) return;
        const normalized = normalizeSurveyDto(raw);
        setSurvey(normalized);
        setErrorMsg(null);

        const prefilled: Record<string, unknown> = {};
        for (const blk of normalized.blocks) {
          if (blk.type === 'email' && resolvedRoute.prefillEmail) {
            prefilled[blk.id] = resolvedRoute.prefillEmail;
          } else if (blk.type === 'phone' && resolvedRoute.prefillPhone) {
            prefilled[blk.id] = resolvedRoute.prefillPhone;
          } else if (blk.type === 'short_text' && resolvedRoute.prefillName && /tên|name/i.test(blk.label)) {
            prefilled[blk.id] = resolvedRoute.prefillName;
          }
        }
        if (Object.keys(prefilled).length > 0) {
          setAnswers((prev) => ({ ...prefilled, ...prev }));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(getErrorMessage(err, 'Khảo sát không tồn tại hoặc đã tạm đóng.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedRoute.slug, resolvedRoute.tenant, resolvedRoute.prefillEmail, resolvedRoute.prefillPhone, resolvedRoute.prefillName]);

  const pages = useMemo(() => splitSurveyIntoPages(survey?.blocks || []), [survey?.blocks]);
  const activeBlocks = pages[currentPage] || [];
  const primaryColor = survey?.theme.primaryColor || '#1E40FF';

  const hasDedicatedIdentityBlock = useMemo(
    () => (survey?.blocks || []).some((b) => b.type === 'phone' || b.type === 'email'),
    [survey?.blocks]
  );

  const validateCurrentStep = (): boolean => {
    const nextErrs: Record<string, string> = {};
    for (const blk of activeBlocks) {
      if (LAYOUT_BLOCK_TYPES.has(blk.type)) continue;
      const val = answers[blk.id];
      const isEmpty =
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0) ||
        (typeof val === 'object' && !Array.isArray(val) && Object.keys(val as Record<string, unknown>).length === 0);

      if (blk.required && isEmpty) {
        nextErrs[blk.id] = 'Vui lòng trả lời câu hỏi bắt buộc này.';
      } else if (blk.type === 'email' && typeof val === 'string' && val.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
          nextErrs[blk.id] = 'Địa chỉ Email chưa đúng định dạng.';
        }
      }
    }
    setErrors(nextErrs);
    if (Object.keys(nextErrs).length > 0) {
      toast.error('Vui lòng hoàn thành các câu hỏi bắt buộc trước khi tiếp tục.');
      return false;
    }
    return true;
  };

  const executeSubmit = async () => {
    if (!survey) return;
    setSubmitting(true);
    try {
      const res = await apiRequest<PublicSurveySubmitResponse>(
        `/api/v1/public/marketing/surveys/${encodeURIComponent(resolvedRoute.slug)}`,
        {
          method: 'POST',
          tenantSlug: resolvedRoute.tenant || undefined,
          body: {
            tenant_slug: resolvedRoute.tenant || undefined,
            name: contactName.trim() || undefined,
            phone: contactPhone.trim() || undefined,
            email: contactEmail.trim() || undefined,
            answers,
            utm_source: resolvedRoute.utmSource,
            utm_medium: resolvedRoute.utmMedium || undefined,
            utm_campaign: resolvedRoute.utmCampaign || undefined,
          },
        }
      );
      setSubmitResult(res);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi phản hồi khảo sát.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextOrSubmit = () => {
    if (!validateCurrentStep()) return;
    const stepOutcome = evaluateBranchingNextStep(activeBlocks, answers, pages, currentPage);
    if (stepOutcome.action === 'end') {
      void executeSubmit();
      return;
    }
    setPageHistory((prev) => [...prev, currentPage]);
    setCurrentPage(stepOutcome.pageIndex);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (pageHistory.length === 0) return;
    const prevIdx = pageHistory[pageHistory.length - 1];
    setPageHistory((h) => h.slice(0, -1));
    setCurrentPage(prevIdx);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '1rem 0' }}>
        <PublicRouteSkeleton />
      </div>
    );
  }

  if (errorMsg || !survey) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ maxWidth: 460, width: '100%', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: '2rem', textAlign: 'center', boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>Không thể mở Khảo sát</div>
          <p style={{ fontSize: '0.86rem', color: '#64748B', marginTop: 8 }}>{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (submitResult) {
    return (
      <PublicSurveyThankYouCard
        survey={survey}
        submitResult={submitResult}
        primaryColor={primaryColor}
      />
    );
  }

  const progressPct = Math.round(((currentPage + 1) / Math.max(1, pages.length)) * 100);
  const isLastStep = currentPage >= pages.length - 1;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '1.5rem 1rem 3rem' }}>
      <Toaster position="top-center" />
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {pages.length > 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: 5 }}>
              <span>Bước {currentPage + 1} / {pages.length}</span>
              <span style={{ color: primaryColor }}>{progressPct}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: '#E2E8F0', overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', background: primaryColor, transition: 'width 0.25s ease' }} />
            </div>
          </div>
        )}

        <div
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            background:
              survey.theme.coverStyle === 'image' && survey.theme.coverImageUrl
                ? `linear-gradient(rgba(15,23,42,0.6), rgba(15,23,42,0.6)), url(${survey.theme.coverImageUrl}) center/cover`
                : survey.theme.coverStyle === 'minimal'
                  ? '#FFFFFF'
                  : `linear-gradient(135deg, ${primaryColor} 0%, #0284C7 100%)`,
            color: survey.theme.coverStyle === 'minimal' ? '#0F172A' : '#FFFFFF',
            border: '1px solid #DBEAFE',
            padding: '1.5rem 1.6rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999, background: survey.theme.coverStyle === 'minimal' ? '#EEF2FF' : 'rgba(255,255,255,0.18)', color: survey.theme.coverStyle === 'minimal' ? primaryColor : '#FFFFFF' }}>
              {survey.company_name || survey.theme.coverBadge || 'DOMATION SURVEY'}
            </span>
            <CoverCountdownBadge targetIso={survey.theme.coverCountdown} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>{survey.title}</h1>
          {survey.description && (
            <p style={{ margin: '6px 0 0', fontSize: '0.86rem', opacity: 0.92, lineHeight: 1.5 }}>{survey.description}</p>
          )}
        </div>

        {currentPage === 0 && !hasDedicatedIdentityBlock && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1rem 1.15rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Họ và tên (Tùy chọn)..."
              style={{ height: 42, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.84rem' }}
            />
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Số điện thoại nhận kết quả..."
              style={{ height: 42, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.84rem' }}
            />
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Hoặc Email (Tùy chọn)..."
              style={{ height: 42, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.84rem' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeBlocks.map((blk) => (
            <PublicSurveyBlockRenderer
              key={blk.id}
              block={blk}
              primaryColor={primaryColor}
              value={answers[blk.id]}
              errorMessage={errors[blk.id]}
              onChange={(val) => {
                setAnswers((prev) => ({ ...prev, [blk.id]: val }));
                if (errors[blk.id]) {
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy[blk.id];
                    return copy;
                  });
                }
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          {pageHistory.length > 0 && (
            <button
              type="button"
              onClick={handleBack}
              style={{ height: 48, padding: '0 18px', borderRadius: 14, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <ChevronLeft size={16} /> Quay lại
            </button>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={handleNextOrSubmit}
            style={{ flex: 1, height: 48, borderRadius: 14, border: 'none', background: primaryColor, color: '#FFFFFF', fontWeight: 800, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 6px 18px rgba(30,64,255,0.22)' }}
          >
            {isLastStep ? (
              <>
                <Send size={16} /> {submitting ? 'Đang gửi phản hồi...' : 'Hoàn Tất & Nộp Khảo Sát'}
              </>
            ) : (
              <>
                Tiếp theo <ChevronRight size={17} />
              </>
            )}
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.73rem', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 6 }}>
          <ShieldCheck size={14} color="#1E40FF" /> Bảo mật dữ liệu đa tầng bởi <strong>DOMATION Survey Studio</strong>
        </div>
      </div>
    </div>
  );
};

export default PublicSurveyPage;
