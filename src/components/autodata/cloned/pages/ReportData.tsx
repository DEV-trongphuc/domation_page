import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  CheckCircle, 
  Send, 
  Loader2, 
  Shield, 
  XCircle, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Layers, 
  FileText, 
  Copy, 
  Check, 
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowLeft,
  Lock,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { fetchAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LuxuryBackgroundDecor } from '../components/ui/LuxuryBackgroundDecor';
import { ScreenHelpButton } from '../components/ui/ScreenHelpButton';
const logoHorizontal = '/imgs/autodata/domation_ai_icon.svg';
const logoIcon = '/imgs/autodata/domation_ai_icon.svg';

interface ReportReason {
  reason: string;
  note: string;
}

const DEFAULT_REPORT_REASONS: ReportReason[] = [
  { reason: 'Số sai định dạng', note: 'Số điện thoại sai định dạng, thiếu số hoặc thừa số (không đúng chuẩn số điện thoại).' },
  { reason: 'Sai nhu cầu dự án', note: 'Khách hàng không quan tâm hoặc nhầm lẫn dự án DOMATION AutoData.' },
  { reason: 'Trùng lặp với Data cũ', note: 'Data đã có trong hệ thống và đang được xử lý trong vòng {n} tháng.' },
  { reason: 'Lý do khác', note: 'Vui lòng cung cấp chi tiết giải trình ở phần ghi chú bên dưới.' }
];

const TEST_MOCK_CONTEXT = {
  lead_id: 999,
  sale_id: 1,
  round_id: 1,
  lead_name: 'Trần Thị Mai Anh',
  lead_phone: '0912 345 678',
  lead_email: 'maianh.tran@gmail.com',
  lead_source: 'Facebook Ads — Chiến dịch DOMATION AutoData',
  lead_type: 'Căn hộ 2 Phòng Ngủ',
  lead_note: 'Quan tâm: Căn hộ 2PN tầng cao view biển\nNgân sách: 3.5 – 5 tỷ\nKhung giờ gọi: 14:00 - 17:00 hàng ngày',
  consultant_name: 'Phúc (Đại lý Test)',
  consultant_email: 'turniodev@gmail.com',
  round_name: 'DOMATION AutoData - Meta Form Inbound',
  assigned_at: new Date().toISOString(),
  existing_report: null as string | null,
  duplicate_check_months: 6,
  is_allowed_to_report: true
};

interface ReportContext {
  lead_id?: number;
  sale_id?: number;
  round_id?: number;
  lead_name: string; 
  lead_phone: string; 
  lead_email?: string; 
  lead_source: string; 
  lead_type?: string; 
  lead_note: string;
  consultant_name: string; 
  consultant_email: string; 
  round_name: string;
  assigned_at: string; 
  existing_report: string | null;
  duplicate_check_months?: number;
  is_allowed_to_report?: boolean;
}

export const ReportData: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, token, logout, tenantSettings } = useAuth();

  const [, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const handleThemeChange = () => {
      const nextTheme = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
      setTheme(nextTheme);
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  const [searchParams] = useSearchParams();
  const [params] = useState({
    leadId: searchParams.get('lead_id') || '',
    saleId: searchParams.get('sale_id') || '',
    roundId: searchParams.get('round_id') ?? '0',
    isTest: import.meta.env.DEV && searchParams.get('test') === '1',
  });

  const [reasons, setReasons] = useState<ReportReason[]>(DEFAULT_REPORT_REASONS);
  const [context, setContext] = useState<ReportContext | null>(null);
  const [loadingCtx, setLoadingCtx] = useState(true);
  const [ctxError, setCtxError] = useState('');
  const [isForbidden, setIsForbidden] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState(false);

  // Check login and fetch report context
  useEffect(() => {
    if (params.isTest) {
      setContext(TEST_MOCK_CONTEXT);
      setReasons(DEFAULT_REPORT_REASONS);
      setReason(DEFAULT_REPORT_REASONS[0].reason);
      setLoadingCtx(false);
      return;
    }

    // Must be logged in to inspect and report lead
    if (!token || !user) {
      setLoadingCtx(false);
      return;
    }

    const isValidId = (v: string) => v.trim().length > 0;
    const isValidRoundId = (v: string) => v.trim().length >= 0;

    if (!isValidId(params.leadId) || !isValidId(params.saleId) || !isValidRoundId(params.roundId)) {
      setCtxError(t('Đường dẫn không hợp lệ hoặc thiếu tham số. Vui lòng mở lại từ tin nhắn Zalo Bot hoặc Email.'));
      setLoadingCtx(false);
      return;
    }

    setLoadingCtx(true);
    fetchAPI(`get_report_context&lead_id=${params.leadId}&sale_id=${params.saleId}&round_id=${params.roundId}`)
      .then(res => {
        if (res.success && res.data) {
          const data = res.data;
          setContext(data);

          // Front-end verify lead ownership
          const isSale = user?.role === 'sale';
          const userEmail = (user?.email || '').toLowerCase().trim();
          const consEmail = (data?.consultant_email || '').toLowerCase().trim();
          
          if (isSale && userEmail !== consEmail && String(user?.consultant_id) !== String(data?.sale_id)) {
            setIsForbidden(true);
            setCtxError(t(`Data này được phân bổ độc quyền cho: ${data?.consultant_name || '-'} (${data?.consultant_email || '-'}). Tài khoản đang đăng nhập (${user?.email || '-'}) không có quyền báo cáo dữ liệu này.`));
            return;
          }

          if (data.is_allowed_to_report === false) {
            setCtxError(t('Tài khoản của bạn hiện không có quyền gửi báo cáo lỗi data.'));
          } else {
            const settingsReasons = Array.isArray(tenantSettings?.ticket_reasons)
              ? tenantSettings!.ticket_reasons.map((r: any) => ({
                  reason: r.label || r.value,
                  note: r.value || r.label,
                }))
              : [];
            const list = (data.report_error_reasons && data.report_error_reasons.length > 0)
              ? data.report_error_reasons
              : settingsReasons.length > 0
                ? settingsReasons
                : DEFAULT_REPORT_REASONS;
            setReasons(list);
            if (list.length > 0) {
              setReason(list[0].reason);
            }
          }
        } else {
          if (res.forbidden) {
            setIsForbidden(true);
          }
          setCtxError(t(res.message) || t('Không tìm thấy thông tin lượt phân bổ hoặc đường dẫn đã hết hiệu lực.'));
        }
      })
      .catch(e => setCtxError(t(e.message) || t('Lỗi kết nối tới máy chủ. Vui lòng thử lại sau.')))
      .finally(() => setLoadingCtx(false));
  }, [params, token, user, t]);

  const handleCopyPhone = (phone: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const isOtherReason = reason.toLowerCase().includes('khác') || reason.toLowerCase().includes('other');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (params.isTest) {
      setSubmitError(t('Đây là chế độ xem thử nghiệm (Mock) — không gửi báo cáo thực tế.'));
      setSubmitStatus('error');
      return;
    }
    if (submitting || submitStatus === 'success') return;

    setSubmitting(true);
    setSubmitError('');

    const finalReason = isOtherReason
      ? `${reason}: ${customReason.trim()}`
      : (customReason.trim() ? `${reason} (Ghi chú: ${customReason.trim()})` : reason);

    const payload = {
      lead_id: context?.lead_id || Number(params.leadId),
      sale_id: context?.sale_id || Number(params.saleId),
      round_id: (context?.round_id !== undefined && context?.round_id !== null) ? Number(context.round_id) : Number(params.roundId),
      reason: finalReason
    };

    try {
      const res = await fetchAPI('submit_report', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        setSubmitStatus('success');
      } else {
        setSubmitStatus('error');
        setSubmitError(t(res.message) || t('Không thể gửi báo cáo. Vui lòng liên hệ Admin.'));
      }
    } catch (err: any) {
      setSubmitStatus('error');
      setSubmitError(t(err.message) || t('Lỗi kết nối mạng khi gửi báo cáo.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getRelativeReturnUrl = () => {
    const rawPath = window.location.pathname.replace(/^\/data(?=\/|$)/, '') || '/report-data';
    return rawPath + window.location.search;
  };

  const handleGoToLogin = () => {
    navigate(`/login?redirect=${encodeURIComponent(getRelativeReturnUrl())}`);
  };

  const handleSwitchAccount = () => {
    logout();
    navigate(`/login?redirect=${encodeURIComponent(getRelativeReturnUrl())}`);
  };

  return (
    <div className="report-page-root">
      {/* ── LANDING PAGE LUXURY BACKGROUND DECOR, GOLD FRAME & SILK WAVE LINES ── */}
      <LuxuryBackgroundDecor variant="report" />
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />
      <div className="ambient-glow glow-3" />

      <div data-tour="reportdata-form" className="report-main-container">
        {/* ── LUXURY BRAND HEADER ── */}
        <header className="report-header">
          <div className="brand-logo-container" style={{ position: 'relative' }}>
            {/* Official Horizontal Brand Logo (synced with Landing Page) */}
            <img 
              src={logoHorizontal} 
              alt="DOMATION AutoData" 
              className="brand-logo-full"
            />
            <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
              <ScreenHelpButton screenKey="report_data" />
            </div>
          </div>

          <div className="header-badge-pill">
            <img src={logoIcon} alt="" style={{ width: 15, height: 15, objectFit: 'contain' }} />
            <span className="badge-pulse-dot" />
            <span className="badge-text">{t("BÁO CÁO DỮ LIỆU DƯỚI CHUẨN")}{params.isTest ? ` [TEST]` : ''}</span>
          </div>

          <h1 className="header-title">{t("Yêu Cầu Thẩm Định & Bù Data")}</h1>
          <p className="header-desc">
            {t("Báo cáo thông tin data không đạt chuẩn để Quản trị viên xét duyệt phân bổ bù data mới")}
          </p>

          {user && (
            <div className="logged-in-user-chip">
              <span className="user-dot-online" />
              <span>{t("Đang đăng nhập:")} <strong>{user.email}</strong> ({user.name || user.role})</span>
            </div>
          )}
        </header>

        {/* ── CARD CONTENT AREA ── */}
        <div className="report-content-wrapper">
          {/* ── CASE 1: NOT LOGGED IN ── */}
          {!params.isTest && (!token || !user) ? (
            <div className="state-card auth-required-card">
              <div className="state-icon-circle auth-circle">
                <Lock size={36} className="state-icon" />
              </div>
              <div className="badge-security-tag">
                <Shield size={13} />
                <span>{t("BẢO MẬT DỮ LIỆU ĐẠI LÝ")}</span>
              </div>
              <h2 className="state-card-title">{t("Yêu Cầu Đăng Nhập Xác Thực")}</h2>
              <p className="state-card-desc">
                {t("Dữ liệu khách hàng được mã hóa bảo mật. Vui lòng đăng nhập tài khoản Đại lý được phân bổ để xác thực quyền hạn và thực hiện báo cáo.")}
              </p>
              
              <div className="state-card-actions">
                <button 
                  type="button" 
                  onClick={handleGoToLogin} 
                  className="btn-state-action primary-gold"
                >
                  <Lock size={16} />
                  <span>{t("Đăng Nhập Tài Khoản Đại Lý")}</span>
                </button>
              </div>
            </div>
          ) : loadingCtx ? (
            /* ── CASE 2: LOADING ── */
            <div className="state-card loading-card">
              <div className="luxury-spinner-wrap">
                <Loader2 size={44} className="luxury-spin" />
              </div>
              <p className="loading-text">{t("Đang xác thực thông tin lượt phân bổ...")}</p>
              <span className="loading-sub">{t("Vui lòng chờ trong giây lát")}</span>
            </div>
          ) : isForbidden ? (
            /* ── CASE 3: FORBIDDEN / OWNERSHIP MISMATCH ── */
            <div className="state-card error-card">
              <div className="state-icon-circle warning-circle">
                <AlertTriangle size={38} className="state-icon" />
              </div>
              <div className="badge-danger-tag">
                <Shield size={13} />
                <span>{t("KHÔNG ĐÚNG CHỦ SỞ HỮU")}</span>
              </div>
              <h2 className="state-card-title">{t("Tài Khoản Không Phải Người Phụ Trách")}</h2>
              <p className="state-card-desc">{ctxError}</p>
              
              <div className="state-card-actions">
                <button 
                  type="button" 
                  onClick={handleSwitchAccount} 
                  className="btn-state-action primary-gold"
                >
                  <LogOut size={16} />
                  <span>{t("Đổi Tài Khoản / Đăng Nhập Lại")}</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => navigate('/sale-portal')} 
                  className="btn-state-action"
                >
                  <ArrowLeft size={16} />
                  <span>{t("Về Portal Nhận Data")}</span>
                </button>
              </div>
            </div>
          ) : ctxError ? (
            /* ── CASE 4: OTHER CONTEXT ERROR ── */
            <div className="state-card error-card">
              <div className="state-icon-circle error-circle">
                <XCircle size={38} className="state-icon" />
              </div>
              <h2 className="state-card-title">{t("Liên Kết Không Khả Dụng")}</h2>
              <p className="state-card-desc">{ctxError}</p>
              
              <div className="state-card-actions">
                <button 
                  type="button" 
                  onClick={() => navigate('/sale-portal')} 
                  className="btn-state-action"
                >
                  <ArrowLeft size={16} />
                  <span>{t("Về Trang Quản Lý Đại Lý")}</span>
                </button>
              </div>
            </div>
          ) : submitStatus === 'success' ? (
            /* ── CASE 5: SUCCESS ── */
            <div className="state-card success-card">
              <div className="state-icon-circle success-circle">
                <CheckCircle size={40} className="state-icon" />
              </div>
              <div className="badge-success-tag">
                <Sparkles size={14} />
                <span>{t("TIẾP NHẬN THÀNH CÔNG")}</span>
              </div>
              <h2 className="state-card-title">{t("Báo Cáo Đã Được Gửi Tới Admin")}</h2>
              <p className="state-card-desc">
                {t("Hệ thống đã ghi nhận yêu cầu báo cáo lỗi data của bạn. Sau khi Quản trị viên duyệt, hệ thống sẽ tự động kích hoạt lượt chia bù data ưu tiên cho bạn.")}
              </p>
              
              <div className="state-card-actions">
                <button 
                  type="button" 
                  onClick={() => navigate('/sale-portal')} 
                  className="btn-state-action primary-gold"
                >
                  <ArrowLeft size={16} />
                  <span>{t("Về Portal Nhận Data")}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ── CASE 6: FULL REPORT FORM (AUTHENTICATED & MATCHING OWNER) ── */
            <div className="master-report-grid">
              {/* ── LEFT COLUMN: CUSTOMER & LEAD INFORMATION ── */}
              <aside className="lead-dossier-panel">
                <img src={logoIcon} alt="" className="ql-brief-panel-decor" aria-hidden="true" />
                <div className="panel-section-title">
                  <div className="panel-title-pill">
                    <User size={13} className="text-gold" />
                    <span>{t("THÔNG TIN DATA ĐƯỢC CHIA")}</span>
                  </div>
                  <span className="lead-id-tag">ID #{context?.lead_id || params.leadId}</span>
                </div>

                {context && (
                  <>
                    {/* Customer Main Identity Box */}
                    <div className="customer-hero-card">
                      <div className="customer-avatar-badge">
                        {context.lead_name ? context.lead_name.trim().charAt(0).toUpperCase() : 'K'}
                      </div>
                      <div className="customer-meta-info">
                        <span className="customer-role-label">{t("KHÁCH HÀNG")}</span>
                        <h3 className="customer-name-heading">{context.lead_name || t('Chưa cập nhật tên')}</h3>
                        
                        <div className="customer-phone-row">
                          <Phone size={14} className="phone-icon" />
                          <span className="phone-number-text">{context.lead_phone || t('Chưa có SĐT')}</span>
                          {context.lead_phone && (
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(context.lead_phone)}
                              className="btn-copy-mini"
                              title={t("Sao chép số điện thoại")}
                            >
                              {copiedPhone ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Consultant in charge */}
                    <div className="consultant-pill-card">
                      <div className="consultant-avatar-mini">
                        <Shield size={14} className="text-gold" />
                      </div>
                      <div className="consultant-text-wrap">
                        <span className="field-micro-label">{t("ĐẠI LÝ PHỤ TRÁCH")}</span>
                        <div className="consultant-fullname">{context.consultant_name}</div>
                        <div className="consultant-email-sub">{context.consultant_email}</div>
                      </div>
                    </div>

                    {/* Key Attributes */}
                    <div className="attributes-list">
                      <div className="attr-item">
                        <div className="attr-icon-wrap"><Layers size={13} /></div>
                        <div className="attr-content">
                          <span className="attr-label">{t("Vòng phân bổ")}</span>
                          <span className="attr-value gold-text">{context.round_name || t('Phân bổ trực tiếp')}</span>
                        </div>
                      </div>

                      <div className="attr-item">
                        <div className="attr-icon-wrap"><FileText size={13} /></div>
                        <div className="attr-content">
                          <span className="attr-label">{t("Nguồn dữ liệu")}</span>
                          <span className="attr-value">{context.lead_source || t('Quảng cáo / Biểu mẫu')}</span>
                        </div>
                      </div>

                      <div className="attr-item">
                        <div className="attr-icon-wrap"><Calendar size={13} /></div>
                        <div className="attr-content">
                          <span className="attr-label">{t("Thời gian nhận")}</span>
                          <span className="attr-value">
                            {context.assigned_at 
                              ? new Date(context.assigned_at).toLocaleString('vi-VN', { 
                                  dateStyle: 'short', 
                                  timeStyle: 'short' 
                                }) 
                              : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Accordion Toggle */}
                      <button
                        type="button"
                        className="mobile-accordion-toggle"
                        onClick={() => setExpandedMobile(!expandedMobile)}
                      >
                        <span>{expandedMobile ? t('Thu gọn chi tiết') : t('Xem thêm thông tin chi tiết')}</span>
                        {expandedMobile ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {/* Expandable details on mobile */}
                      <div className={`collapsible-details ${expandedMobile ? 'is-open' : ''}`}>
                        {context.lead_email && (
                          <div className="attr-item">
                            <div className="attr-icon-wrap"><Mail size={13} /></div>
                            <div className="attr-content">
                              <span className="attr-label">{t("Email khách")}</span>
                              <span className="attr-value">{context.lead_email}</span>
                            </div>
                          </div>
                        )}

                        {context.lead_type && (
                          <div className="attr-item">
                            <div className="attr-icon-wrap"><Sparkles size={13} /></div>
                            <div className="attr-content">
                              <span className="attr-label">{t("Nhu cầu")}</span>
                              <span className="attr-value">{context.lead_type}</span>
                            </div>
                          </div>
                        )}

                        {context.lead_note && (
                          <div className="lead-note-box">
                            <div className="note-box-header">
                              <FileText size={12} className="text-gold" />
                              <span>{t("Ghi chú chi tiết từ nguồn")}</span>
                            </div>
                            <div className="note-box-body">
                              {context.lead_note}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </aside>

              {/* ── RIGHT COLUMN: REPORT FORM ── */}
              <main className="report-form-panel">
                <img src={logoIcon} alt="" className="ql-form-panel-decor" aria-hidden="true" />
                {/* Test Mode Notification */}
                {params.isTest && (
                  <div className="test-mode-alert">
                    <AlertCircle size={16} className="text-amber" />
                    <span>{t("Chế độ xem trước (Mock Data) — Không lưu vào dữ liệu thực tế.")}</span>
                  </div>
                )}

                {/* Existing report: Pending */}
                {context?.existing_report === 'pending' && (
                  <div className="status-notice-block pending-notice">
                    <div className="status-notice-icon">
                      <Shield size={28} />
                    </div>
                    <div className="status-notice-body">
                      <h3>{t("Đang Chờ Quản Trị Viên Phê Duyệt")}</h3>
                      <p>{t("Bạn đã gửi báo cáo cho data này trước đó. Vui lòng chờ Admin thẩm duyệt để được nhận data bù ưu tiên.")}</p>
                    </div>
                  </div>
                )}

                {/* Existing report: Approved */}
                {context?.existing_report === 'approved' && (
                  <div className="status-notice-block approved-notice">
                    <div className="status-notice-icon">
                      <CheckCircle size={28} />
                    </div>
                    <div className="status-notice-body">
                      <h3>{t("Báo Cáo Đã Được Phê Duyệt ✅")}</h3>
                      <p>{t("Yêu cầu báo cáo đã được chấp thuận. Lượt bù data đã được cộng vào thứ tự phân bổ ưu tiên của bạn.")}</p>
                    </div>
                  </div>
                )}

                {/* Existing report: Approved No Comp */}
                {context?.existing_report === 'approved_no_comp' && (
                  <div className="status-notice-block approved-notice">
                    <div className="status-notice-icon">
                      <CheckCircle size={28} />
                    </div>
                    <div className="status-notice-body">
                      <h3>{t("Báo Cáo Đã Được Duyệt (Không Bù)")}</h3>
                      <p>{t("Báo cáo lỗi data này đã được Quản trị viên ghi nhận và xử lý hoàn tất.")}</p>
                    </div>
                  </div>
                )}

                {/* Existing report: Rejected (Allow re-submission) */}
                {context?.existing_report === 'rejected' && (
                  <div className="form-error-banner" style={{ marginBottom: '12px' }}>
                    <AlertCircle size={16} />
                    <span>{t("Báo cáo trước đó đã bị từ chối. Bạn có thể cập nhật lý do và gửi lại báo cáo bên dưới.")}</span>
                  </div>
                )}

                {/* Main Interactive Form */}
                {(!context?.existing_report || context?.existing_report === 'rejected') && (
                  <form onSubmit={handleSubmit} className="report-action-form">
                    {submitStatus === 'error' && (
                      <div className="form-error-banner">
                        <AlertCircle size={16} />
                        <span>{submitError}</span>
                      </div>
                    )}

                    <div className="form-section-header">
                      <span className="step-badge">1</span>
                      <div>
                        <h4 className="section-title">{t("Chọn Lý Do Báo Cáo Không Đạt Chuẩn")}</h4>
                        <p className="section-subtitle">{t("Lựa chọn chính xác tình trạng thực tế khi bạn liên hệ với khách hàng")}</p>
                      </div>
                    </div>

                    <div className="reason-options-group">
                      {reasons.map((r, idx) => {
                        const isSelected = reason === r.reason;
                        return (
                          <label 
                            key={r.reason || idx} 
                            className={`reason-option-card ${isSelected ? 'is-selected' : ''}`}
                          >
                            <div className="reason-card-head">
                              <input 
                                type="radio" 
                                name="reason" 
                                value={r.reason} 
                                checked={isSelected}
                                onChange={() => setReason(r.reason)}
                                className="reason-radio-input"
                              />
                              <span className="reason-label-text">{t(r.reason)}</span>
                              {isSelected && <span className="selected-check-dot" />}
                            </div>

                            {r.note && (
                              <div className="reason-note-text">
                                {t(r.note.replace(/{n}/g, String(context?.duplicate_check_months || 6)))}
                              </div>
                            )}
                          </label>
                        );
                      })}
                    </div>

                    <div className="form-section-header" style={{ marginTop: '1rem' }}>
                      <span className="step-badge">2</span>
                      <div>
                        <h4 className="section-title">
                          {t("Ghi Chú Giải Trình Bổ Sung")}
                          {isOtherReason && <span className="required-star">*</span>}
                        </h4>
                        <p className="section-subtitle">{t("Cung cấp thêm bằng chứng, thời điểm gọi hoặc lịch sử liên lạc (nếu có)")}</p>
                      </div>
                    </div>

                    <div className="textarea-container">
                      <textarea
                        required={isOtherReason}
                        value={customReason}
                        onChange={e => setCustomReason(e.target.value)}
                        placeholder={
                          isOtherReason 
                            ? t('Vui lòng mô tả chi tiết lý do lỗi data (bắt buộc)...') 
                            : t('Số sai định dạng, spam phá...')
                        }
                        className="luxury-textarea"
                        rows={3}
                      />
                    </div>

                    <div className="form-footer-action">
                      <button 
                        type="submit" 
                        disabled={submitting}
                        className="btn-submit-report"
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={18} className="luxury-spin" />
                            <span>{t("Đang gửi báo cáo thẩm định...")}</span>
                          </>
                        ) : params.isTest ? (
                          <span>{t("Chế độ thử nghiệm (Gửi bị vô hiệu)")}</span>
                        ) : (
                          <>
                            <Send size={18} />
                            <span>{t("GỬI BÁO CÁO DUYỆT BÙ DATA")}</span>
                          </>
                        )}
                      </button>
                      <p className="footer-disclaimer">
                        🔒 {t("Báo cáo sẽ được ghi nhận vào nhật ký phân bổ và chuyển trực tiếp tới Ban Quản Trị.")}
                      </p>
                    </div>
                  </form>
                )}
              </main>
            </div>
          )}
        </div>

        {/* ── FOOTER SIGNATURE ── */}
        <footer className="report-footer">
          <span>© {new Date().getFullYear()} DOMATION AUTO DATA ĐÀ NẴNG · DỮ LIỆU ĐẠI LÝ BẢO MẬT</span>
        </footer>
      </div>

      <LuxuryReportStyles />
    </div>
  );
};

// ── LUXURY STYLESHEET ──────────────────────────────────────────────────────────
const LuxuryReportStyles = () => (
  <style>{`
    /* Root Page Container */
    .report-page-root {
      width: 100%;
      min-height: 100vh;
      background:
        radial-gradient(circle at 8% 15%, rgba(30, 64, 255, 0.14) 0%, rgba(248, 249, 250, 0) 45%),
        radial-gradient(circle at 88% 12%, rgba(2, 132, 199, 0.10) 0%, rgba(248, 249, 250, 0) 48%),
        radial-gradient(circle at 92% 85%, rgba(30, 64, 255, 0.10) 0%, rgba(248, 249, 250, 0) 45%),
        #F8F9FA;
      color: var(--color-text, #0F172A);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px 48px;
      box-sizing: border-box;
    }

    html[data-autodata-workspace="active"][data-theme='dark'] .report-page-root {
      background: radial-gradient(ellipse at 50% 0%, #131C31 0%, #0B1120 60%, #090E1A 100%);
      color: var(--color-text, #F8FAFC);
    }

    /* Ambient Gold Light Accents */
    .ambient-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(85px);
      pointer-events: none;
      z-index: 0;
    }
    .glow-1 {
      top: -120px;
      left: 10%;
      width: 460px;
      height: 460px;
      background: radial-gradient(circle, rgba(30, 64, 255, 0.18) 0%, rgba(30, 64, 255, 0) 70%);
    }
    .glow-2 {
      top: 35%;
      right: -80px;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(30, 64, 255, 0.14) 0%, rgba(30, 64, 255, 0) 70%);
    }
    .glow-3 {
      bottom: -60px;
      left: 20%;
      width: 340px;
      height: 340px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0) 70%);
    }

    /* Luxury Botanical & Geometric SVG Watermarks in Background */
    .bg-decor-svg {
      position: absolute;
      pointer-events: none;
      z-index: 0;
    }
    .decor-left {
      top: 40px;
      left: 20px;
      width: 220px;
      height: 220px;
      opacity: 0.7;
    }
    .decor-right {
      bottom: 80px;
      right: 30px;
      width: 260px;
      height: 260px;
      opacity: 0.65;
    }

    /* Main Container */
    .report-main-container {
      width: 100%;
      max-width: 980px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* ── HEADER STYLING ── */
    .report-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 10px;
    }

    .brand-logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }
    .brand-logo-full {
      height: 56px;
      max-width: 320px;
      object-fit: contain;
      filter: drop-shadow(0 4px 12px rgba(30, 64, 255, 0.15));
    }

    .header-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(30, 64, 255, 0.08);
      border: 1px solid rgba(30, 64, 255, 0.25);
      padding: 5px 16px;
      border-radius: 999px;
      backdrop-filter: blur(8px);
    }
    .badge-pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #D97706;
      box-shadow: 0 0 8px #D97706;
      animation: pulseGlow 2s infinite;
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }
    .badge-text {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: var(--color-primary, #1E40FF);
      text-transform: uppercase;
    }

    .header-title {
      font-size: 1.75rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      margin: 2px 0 0;
      color: var(--color-text, #0F172A);
      line-height: 1.25;
    }
    [data-theme='dark'] .header-title {
      color: #F8F9FA;
    }

    .header-desc {
      font-size: 0.9rem;
      color: var(--color-text-muted, #64748B);
      margin: 0;
      max-width: 540px;
      line-height: 1.5;
    }

    .logged-in-user-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--color-text-muted, #64748B);
      background: rgba(30, 64, 255, 0.06);
      border: 1px solid rgba(30, 64, 255, 0.18);
      padding: 3px 12px;
      border-radius: 999px;
      margin-top: 4px;
    }
    .user-dot-online {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10B981;
    }

    /* ── MASTER CARD LAYOUT ── */
    .report-content-wrapper {
      width: 100%;
    }

    .master-report-grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      background: var(--color-surface, #FFFFFF);
      border-radius: 24px;
      border: 1px solid var(--color-border, #E2E8F0);
      box-shadow: 0 20px 50px -10px rgba(36, 28, 20, 0.08), 0 0 0 1px rgba(30, 64, 255, 0.08);
      overflow: hidden;
      min-height: 580px;
    }
    [data-theme='dark'] .master-report-grid {
      background: #181512;
      border-color: rgba(30, 64, 255, 0.22);
      box-shadow: 0 24px 60px -10px rgba(0, 0, 0, 0.6);
    }

    /* ── LEFT PANEL: LEAD DOSSIER (Synced with Landing Page .ql-brief-panel) ── */
    .lead-dossier-panel {
      background: linear-gradient(155deg, #FFFFFF 0%, #FCF8EE 60%, #F3EAD8 100%);
      border-right: 1.5px solid rgba(197, 160, 89, 0.36);
      padding: 26px 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }
    .ql-brief-panel-decor {
      position: absolute;
      bottom: -36px;
      right: -36px;
      width: 185px;
      height: 185px;
      opacity: 0.095;
      pointer-events: none !important;
      user-select: none !important;
      z-index: 0;
      object-fit: contain;
    }
    .report-form-panel {
      position: relative;
      overflow: hidden;
    }
    .ql-form-panel-decor {
      position: absolute;
      top: -36px;
      right: -36px;
      width: 190px;
      height: 190px;
      opacity: 0.055;
      pointer-events: none !important;
      user-select: none !important;
      z-index: 0;
      object-fit: contain;
    }
    [data-theme='dark'] .lead-dossier-panel {
      background: #13110e;
      border-right-color: rgba(30, 64, 255, 0.16);
    }

    .panel-section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .panel-title-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-muted, #64748B);
    }
    .text-gold {
      color: var(--color-primary, #1E40FF);
    }
    .lead-id-tag {
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--color-primary, #1E40FF);
      background: rgba(30, 64, 255, 0.1);
      padding: 2px 8px;
      border-radius: 6px;
      font-family: monospace;
    }

    /* Customer Hero Card */
    .customer-hero-card {
      background: var(--color-surface, #FFFFFF);
      border: 1px solid var(--color-border, #E2E8F0);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 4px 12px rgba(36, 28, 20, 0.03);
    }
    [data-theme='dark'] .customer-hero-card {
      background: #1e1a16;
      border-color: rgba(30, 64, 255, 0.18);
    }

    .customer-avatar-badge {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1E40FF 0%, #D4AF37 100%);
      color: #FFFFFF;
      font-size: 1.25rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(30, 64, 255, 0.25);
    }

    .customer-meta-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .customer-role-label {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: var(--color-text-muted, #64748B);
      text-transform: uppercase;
    }
    .customer-name-heading {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--color-text, #0F172A);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    [data-theme='dark'] .customer-name-heading {
      color: #F8F9FA;
    }

    .customer-phone-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
    }
    .phone-icon {
      color: #D97706;
      flex-shrink: 0;
    }
    .phone-number-text {
      font-size: 0.92rem;
      font-weight: 800;
      color: #D97706;
      letter-spacing: 0.5px;
    }
    .btn-copy-mini {
      background: rgba(30, 64, 255, 0.08);
      border: 1px solid rgba(30, 64, 255, 0.2);
      border-radius: 6px;
      padding: 3px 6px;
      cursor: pointer;
      color: var(--color-text-muted, #64748B);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-copy-mini:hover {
      background: rgba(30, 64, 255, 0.16);
      color: var(--color-primary, #1E40FF);
    }
    .text-success {
      color: #10B981;
    }

    /* Consultant Card */
    .consultant-pill-card {
      background: rgba(16, 185, 129, 0.06);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 14px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    [data-theme='dark'] .consultant-pill-card {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.25);
    }
    .consultant-avatar-mini {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .consultant-text-wrap {
      flex: 1;
      min-width: 0;
    }
    .field-micro-label {
      font-size: 0.62rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: #059669;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
    }
    [data-theme='dark'] .field-micro-label {
      color: #34D399;
    }
    .consultant-fullname {
      font-size: 0.88rem;
      font-weight: 800;
      color: var(--color-text, #0F172A);
    }
    [data-theme='dark'] .consultant-fullname {
      color: #F8F9FA;
    }
    .consultant-email-sub {
      font-size: 0.75rem;
      color: var(--color-text-muted, #64748B);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Attributes List */
    .attributes-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .attr-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .attr-icon-wrap {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      background: var(--color-surface, #FFFFFF);
      border: 1px solid var(--color-border, #E2E8F0);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary, #1E40FF);
      flex-shrink: 0;
      margin-top: 2px;
    }
    [data-theme='dark'] .attr-icon-wrap {
      background: #1e1a16;
      border-color: rgba(30, 64, 255, 0.18);
    }
    .attr-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
    .attr-label {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: var(--color-text-muted, #64748B);
      text-transform: uppercase;
    }
    .attr-value {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text, #0F172A);
      word-break: break-word;
    }
    [data-theme='dark'] .attr-value {
      color: #F8F9FA;
    }
    .gold-text {
      color: var(--color-primary, #1E40FF) !important;
      font-weight: 700 !important;
    }

    /* Note Box */
    .lead-note-box {
      background: var(--color-surface, #FFFFFF);
      border: 1px solid var(--color-border, #E2E8F0);
      border-radius: 12px;
      padding: 12px;
      margin-top: 4px;
    }
    [data-theme='dark'] .lead-note-box {
      background: #1e1a16;
      border-color: rgba(30, 64, 255, 0.18);
    }
    .note-box-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--color-text-muted, #64748B);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 6px;
    }
    .note-box-body {
      font-size: 0.8rem;
      color: var(--color-text-light, #334155);
      line-height: 1.5;
      white-space: pre-wrap;
      max-height: 140px;
      overflow-y: auto;
    }
    [data-theme='dark'] .note-box-body {
      color: #CBD5E1;
    }

    .mobile-accordion-toggle {
      display: none;
    }

    /* ── RIGHT PANEL: FORM ACTION ── */
    .report-form-panel {
      padding: 30px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow-y: auto;
    }

    .report-action-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
    }

    .form-section-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 2px;
    }
    .step-badge {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--color-primary, #1E40FF);
      color: #FFFFFF;
      font-size: 0.75rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .section-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--color-text, #0F172A);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    [data-theme='dark'] .section-title {
      color: #F8F9FA;
    }
    .required-star {
      color: #DC2626;
    }
    .section-subtitle {
      margin: 2px 0 0;
      font-size: 0.78rem;
      color: var(--color-text-muted, #64748B);
    }

    /* Reasons List */
    .reason-options-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .reason-option-card {
      border: 1.5px solid var(--color-border, #E2E8F0);
      background: var(--color-surface, #FFFFFF);
      border-radius: 14px;
      padding: 14px 16px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    [data-theme='dark'] .reason-option-card {
      background: #1d1915;
      border-color: rgba(30, 64, 255, 0.16);
    }
    .reason-option-card:hover {
      border-color: var(--color-primary, #1E40FF);
      background: rgba(30, 64, 255, 0.03);
    }
    .reason-option-card.is-selected {
      border-color: var(--color-primary, #1E40FF);
      background: rgba(30, 64, 255, 0.08);
      box-shadow: 0 4px 16px rgba(30, 64, 255, 0.12);
    }
    [data-theme='dark'] .reason-option-card.is-selected {
      background: rgba(59, 130, 246, 0.14);
      border-color: #3B82F6;
    }

    .reason-card-head {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .reason-radio-input {
      width: 17px;
      height: 17px;
      accent-color: #1E40FF;
      cursor: pointer;
    }
    .reason-label-text {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--color-text, #0F172A);
      flex: 1;
    }
    [data-theme='dark'] .reason-label-text {
      color: #F8F9FA;
    }
    .is-selected .reason-label-text {
      color: var(--color-primary, #1E40FF);
    }
    [data-theme='dark'] .is-selected .reason-label-text {
      color: #3B82F6;
    }

    .selected-check-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-primary, #1E40FF);
      box-shadow: 0 0 6px var(--color-primary, #1E40FF);
    }

    .reason-note-text {
      font-size: 0.78rem;
      color: var(--color-text-muted, #64748B);
      line-height: 1.45;
      padding-left: 27px;
    }

    /* Textarea */
    .textarea-container {
      width: 100%;
    }
    .luxury-textarea {
      width: 100%;
      background: var(--color-surface, #FFFFFF);
      border: 1.5px solid var(--color-border, #E2E8F0);
      border-radius: 14px;
      padding: 12px 14px;
      font-size: 0.88rem;
      color: var(--color-text, #0F172A);
      font-family: inherit;
      outline: none;
      resize: vertical;
      min-height: 85px;
      box-sizing: border-box;
      transition: all 0.2s;
    }
    [data-theme='dark'] .luxury-textarea {
      background: #1d1915;
      border-color: rgba(30, 64, 255, 0.2);
      color: #F8F9FA;
    }
    .luxury-textarea:focus {
      border-color: var(--color-primary, #1E40FF);
      box-shadow: 0 0 0 3px rgba(30, 64, 255, 0.15);
    }

    /* Submit Button */
    .form-footer-action {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .btn-submit-report {
      width: 100%;
      padding: 15px 24px;
      border-radius: 14px;
      border: none;
      background: linear-gradient(135deg, #2563EB 0%, #1E40FF 50%, #1D4ED8 100%);
      color: #FFFFFF;
      font-size: 0.95rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: 0 8px 24px rgba(30, 64, 255, 0.35);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-submit-report:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 28px rgba(30, 64, 255, 0.45);
      filter: brightness(1.05);
    }
    .btn-submit-report:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      box-shadow: none;
    }
    .footer-disclaimer {
      margin: 0;
      font-size: 0.75rem;
      color: var(--color-text-muted, #64748B);
      text-align: center;
    }

    /* ── STATE CARDS (Loading, Auth, Error, Success) ── */
    .state-card {
      background: var(--color-surface, #FFFFFF);
      border-radius: 24px;
      border: 1px solid var(--color-border, #E2E8F0);
      padding: 48px 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 20px 50px -10px rgba(36, 28, 20, 0.08);
      max-width: 520px;
      margin: 20px auto;
    }
    [data-theme='dark'] .state-card {
      background: #181512;
      border-color: rgba(30, 64, 255, 0.22);
    }

    .state-icon-circle {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .auth-circle {
      background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
      color: #B45309;
      box-shadow: 0 8px 24px rgba(217, 119, 6, 0.2);
    }
    .error-circle {
      background: linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%);
      color: #DC2626;
      box-shadow: 0 8px 24px rgba(220, 38, 38, 0.2);
    }
    .warning-circle {
      background: linear-gradient(135deg, #FFEDD5 0%, #FDBA74 100%);
      color: #C2410C;
      box-shadow: 0 8px 24px rgba(234, 88, 12, 0.2);
    }
    .success-circle {
      background: linear-gradient(135deg, #D1FAE5 0%, #6EE7B7 100%);
      color: #059669;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
    }
    .luxury-spinner-wrap {
      color: var(--color-primary, #1E40FF);
      margin-bottom: 16px;
    }
    .luxury-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .state-card-title {
      font-size: 1.35rem;
      font-weight: 800;
      margin: 0 0 10px;
      color: var(--color-text, #0F172A);
    }
    [data-theme='dark'] .state-card-title {
      color: #F8F9FA;
    }
    .state-card-desc {
      font-size: 0.92rem;
      color: var(--color-text-muted, #64748B);
      line-height: 1.6;
      margin: 0 0 24px;
      max-width: 420px;
    }

    .badge-security-tag,
    .badge-success-tag,
    .badge-danger-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 12px;
    }
    .badge-security-tag {
      background: rgba(30, 64, 255, 0.12);
      color: #B45309;
    }
    .badge-success-tag {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
    }
    .badge-danger-tag {
      background: rgba(220, 38, 38, 0.12);
      color: #DC2626;
    }

    .state-card-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
    }
    .btn-state-action {
      background: var(--color-bg, #F8F9FA);
      border: 1px solid var(--color-border, #E2E8F0);
      color: var(--color-text, #0F172A);
      padding: 12px 22px;
      border-radius: 12px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    [data-theme='dark'] .btn-state-action {
      background: #25201b;
      border-color: rgba(30, 64, 255, 0.2);
      color: #F8F9FA;
    }
    .btn-state-action:hover {
      background: rgba(30, 64, 255, 0.12);
      border-color: var(--color-primary, #1E40FF);
    }
    .btn-state-action.primary-gold {
      background: linear-gradient(135deg, #1E40FF 0%, #8C6B1C 100%);
      color: #FFFFFF;
      border: none;
      box-shadow: 0 4px 14px rgba(30, 64, 255, 0.35);
    }

    /* Existing Report Banners */
    .status-notice-block {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 24px;
      border-radius: 16px;
      margin: auto 0;
    }
    .pending-notice {
      background: rgba(217, 119, 6, 0.08);
      border: 1.5px solid rgba(217, 119, 6, 0.25);
      color: #D97706;
    }
    .approved-notice {
      background: rgba(16, 185, 129, 0.08);
      border: 1.5px solid rgba(16, 185, 129, 0.25);
      color: #059669;
    }
    .status-notice-body h3 {
      margin: 0 0 6px;
      font-size: 1.05rem;
      font-weight: 800;
    }
    .status-notice-body p {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.55;
    }

    /* Alerts */
    .test-mode-alert {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #D97706;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 0.82rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .form-error-banner {
      background: rgba(220, 38, 38, 0.08);
      border: 1px solid rgba(220, 38, 38, 0.25);
      color: #DC2626;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 0.84rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* ── FOOTER ── */
    .report-footer {
      text-align: center;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: var(--color-text-muted, #64748B);
      opacity: 0.7;
      padding: 12px 0;
    }

    /* ── MOBILE RESPONSIVE ── */
    @media (max-width: 860px) {
      .report-page-root {
        padding: 20px 12px 32px;
      }
      .master-report-grid {
        grid-template-columns: 1fr;
        border-radius: 18px;
      }
      .lead-dossier-panel {
        border-right: none;
        border-bottom: 1px solid var(--color-border, #E2E8F0);
        padding: 20px 16px;
      }
      .report-form-panel {
        padding: 20px 16px;
      }
      .header-title {
        font-size: 1.35rem;
      }
      .mobile-accordion-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        background: var(--color-surface, #FFFFFF);
        border: 1px dashed var(--color-border, #E2E8F0);
        border-radius: 10px;
        padding: 8px;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--color-primary, #1E40FF);
        cursor: pointer;
        margin-top: 4px;
      }
      [data-theme='dark'] .mobile-accordion-toggle {
        background: #1e1a16;
        border-color: rgba(30, 64, 255, 0.2);
      }
      .collapsible-details {
        display: none;
        flex-direction: column;
        gap: 12px;
      }
      .collapsible-details.is-open {
        display: flex;
      }
    }
  `}</style>
);
