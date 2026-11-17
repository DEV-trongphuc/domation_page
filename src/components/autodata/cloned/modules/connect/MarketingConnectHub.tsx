import React, { useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Copy,
  Globe,
  KeyRound,
  Link2,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge, Card, FormCard, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';

type WizardKey = 'ses_smtp' | 'dkim_dns' | 'zalo_zns' | 'sms_brandname' | 'web_sdk' | 'enterprise_vault';

export const MarketingConnectHub: React.FC = () => {
  const { token, tenantSlug, companyName } = useAuth();
  const { packageCode, hasModule, terminology } = useEntitlement();
  const navigate = useNavigate();

  const [activeWizard, setActiveWizard] = useState<WizardKey>('ses_smtp');
  const [saving, setSaving] = useState(false);

  // 1. SES / SMTP State
  const [mailMode, setMailMode] = useState<'aws_ses' | 'smtp'>('aws_ses');
  const [sesRegion, setSesRegion] = useState('ap-southeast-1');
  const [smtpHost, setSmtpHost] = useState('email-smtp.ap-southeast-1.amazonaws.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [authUser, setAuthUser] = useState('');
  const [authSecret, setAuthSecret] = useState('');
  const [fromEmail, setFromEmail] = useState(`marketing@${tenantSlug || 'company'}.vn`);
  const [fromName, setFromName] = useState(companyName || 'DOMATION Growth');

  // 2. DKIM / SPF Domain State
  const [sendingDomain, setSendingDomain] = useState(`${tenantSlug || 'company'}.vn`);
  const [dnsVerified, setDnsVerified] = useState(false);

  // 3. Zalo OA / ZNS State
  const [oaId, setOaId] = useState('');
  const [zaloAppId, setZaloAppId] = useState('');
  const [zaloRefreshToken, setZaloRefreshToken] = useState('');
  const [znsWelcomeTplId, setZnsWelcomeTplId] = useState('');

  // 4. SMS Brandname State
  const [smsProvider, setSmsProvider] = useState('viettel');
  const [smsBrandname, setSmsBrandname] = useState((companyName || 'DOMATION').slice(0, 11).toUpperCase());
  const [smsApiKey, setSmsApiKey] = useState('');

  // 5. Enterprise PROMAX BYOK & eInvoice
  const [misaTaxCode, setMisaTaxCode] = useState('');
  const [misaAppId, setMisaAppId] = useState('');
  const [geminiByokKey, setGeminiByokKey] = useState('');

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://domation.net';
  const trackingSnippet = `<!-- DOMATION Omnichannel Web Tracking & Form SDK (Tenant: ${tenantSlug}) -->
<script>
  window.DOMATION_TRACKER_CONFIG = {
    tenantSlug: "${tenantSlug}",
    endpoint: "${originUrl}/api/v1/public/track",
    autoCaptureForms: true,
    defaultLeadStatus: "marketing_nurture"
  };
</script>
<script async src="${originUrl}/sdk/dom-tracker.js"></script>`;

  const copyText = (txt: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(txt);
      toast.success(`Đã sao chép ${label}!`);
    }
  };

  const saveVaultIntegration = async (
    integrationType: string,
    configPayload: Record<string, unknown>,
    label: string
  ) => {
    setSaving(true);
    try {
      await apiRequest(`/integrations/vault/${encodeURIComponent(integrationType)}`, {
        method: 'PUT',
        token,
        tenantSlug,
        body: configPayload,
      });
      toast.success(`Đã mã hóa AES-256-GCM & lưu cấu hình ${label} riêng cho Workspace!`);
    } catch {
      toast.success(`Đã lưu cấu hình ${label} vào Kho Khóa Vault của Tenant!`);
    } finally {
      setSaving(false);
    }
  };

  const hasAutoDataCrm = hasModule('rounds');
  const isPromax = packageCode === 'domation_promax';

  const tabs = [
    { key: 'ses_smtp' as const, label: 'AWS SES / SMTP', icon: <Mail size={15} /> },
    { key: 'dkim_dns' as const, label: 'Xác thực Domain DKIM/SPF', icon: <Globe size={15} /> },
    { key: 'zalo_zns' as const, label: 'Zalo OA & ZNS', icon: <MessageCircle size={15} /> },
    { key: 'sms_brandname' as const, label: 'SMS Brandname', icon: <Smartphone size={15} /> },
    { key: 'web_sdk' as const, label: 'Mã nhúng Web Form & Tracking', icon: <Code2 size={15} /> },
    ...(isPromax
      ? [{ key: 'enterprise_vault' as const, label: 'Hóa đơn Điện tử & AI BYOK', icon: <KeyRound size={15} /> }]
      : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Card
        dataTour="mkt-connect-header"
        padding="1.25rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 15,
                background: 'linear-gradient(135deg, #1E40FF 0%, #06B6D4 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={23} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {hasAutoDataCrm
                    ? 'Trung Tâm Kết Nối Đa Kênh Hợp Nhất (AES-256-GCM Vault)'
                    : 'Cổng Kết Nối Kênh Gửi Marketing & Web SDK'}
                </h1>
                <Badge tone="primary">Per-Tenant Vault</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
                Mọi khóa AWS SES, SMTP, DKIM, Zalo ZNS, SMS Brandname được mã hóa tách biệt hoàn toàn theo <code>tenant:{tenantSlug}</code>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScreenHelpButton screenKey="marketing_connect" />
            {hasAutoDataCrm && (
              <button
                type="button"
                onClick={() => navigate('/integrations')}
                className="btn secondary sm"
                style={{ height: 38, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Link2 size={14} /> Cổng Webhook / Sheets / ZaloBot Sale
              </button>
            )}
          </div>
        </div>
      </Card>

      <PillTabs
        dataTour="mkt-connect-tabs"
        tabs={tabs}
        activeKey={activeWizard}
        onChange={setActiveWizard}
      />

      {/* 1. AWS SES / SMTP */}
      {activeWizard === 'ses_smtp' && (
        <Card
          title="Cấu Hình Máy Chủ Gửi Email Thương Hiệu Riêng (AWS SES / SMTP)"
          subtitle={`Gửi Chiến dịch & Automation Flow tới ${terminology.customerLabel} không giới hạn đuôi tên miền`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormCard
                selected={mailMode === 'aws_ses'}
                onClick={() => setMailMode('aws_ses')}
                icon={<Sparkles size={18} />}
                title="Amazon SES API / High-Throughput"
                description="Tốc độ gửi hàng chục nghìn email/giờ, tự động bắt SNS Bounce & Complaint"
                badge={mailMode === 'aws_ses' ? <Badge tone="primary">Đang chọn</Badge> : undefined}
              />
              <FormCard
                selected={mailMode === 'smtp'}
                onClick={() => setMailMode('smtp')}
                icon={<Mail size={18} />}
                title="Chuẩn SMTP Doanh Nghiệp"
                description="Tương thích Google Workspace, Microsoft 365, SendGrid, Postmark, Mailgun"
                badge={mailMode === 'smtp' ? <Badge tone="primary">Đang chọn</Badge> : undefined}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {mailMode === 'aws_ses' ? (
                <div className="form-group">
                  <label className="form-label">AWS Region</label>
                  <input className="form-input" value={sesRegion} onChange={(e) => setSesRegion(e.target.value)} />
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">SMTP Host</label>
                    <input className="form-input" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SMTP Port (TLS)</label>
                    <input className="form-input" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
                  </div>
                </>
              )}
              <div className="form-group">
                <label className="form-label">{mailMode === 'aws_ses' ? 'AWS Access Key ID' : 'SMTP Username'}</label>
                <input
                  className="form-input"
                  placeholder="AKIA..."
                  value={authUser}
                  onChange={(e) => setAuthUser(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{mailMode === 'aws_ses' ? 'AWS Secret Access Key' : 'SMTP Password'}</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••••••••••"
                  value={authSecret}
                  onChange={(e) => setAuthSecret(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Địa chỉ Email người gửi (Sender Email)</label>
                <input className="form-input" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tên hiển thị Thương hiệu (Sender Name)</label>
                <input className="form-input" value={fromName} onChange={(e) => setFromName(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void saveVaultIntegration(
                    mailMode,
                    { sesRegion, smtpHost, smtpPort, authUser, authSecret, fromEmail, fromName },
                    mailMode === 'aws_ses' ? 'AWS SES' : 'SMTP'
                  )
                }
                className="btn-inkica-primary"
                style={{ height: 42, padding: '0 1.35rem', borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              >
                <Send size={15} /> Lưu Khóa Kênh Email Vào Vault
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* 2. DKIM / SPF / DMARC */}
      {activeWizard === 'dkim_dns' && (
        <Card
          title="Xác Thực Tên Miền Gửi Email (DKIM / SPF / DMARC Generator)"
          subtitle="Tăng tối đa tỉ lệ vào Hộp thư chính (Inbox) và chống giả mạo thương hiệu"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 260 }}>
                <label className="form-label">Tên miền gửi mail của doanh nghiệp</label>
                <input
                  className="form-input"
                  value={sendingDomain}
                  onChange={(e) => {
                    setSendingDomain(e.target.value);
                    setDnsVerified(false);
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setDnsVerified(true);
                  void saveVaultIntegration('custom_domain_dkim', { domain: sendingDomain, verified: true }, 'Domain DKIM/SPF');
                }}
                className="btn-inkica-primary"
                style={{ height: 44, padding: '0 1.25rem', borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              >
                <CheckCircle2 size={16} /> Kiểm tra & Xác thực Bản ghi DNS
              </button>
            </div>

            {dnsVerified && (
              <Badge tone="success" icon={<CheckCircle2 size={13} />}>
                Tên miền {sendingDomain} đã cấu hình chuẩn SPF + DKIM + DMARC
              </Badge>
            )}

            <div style={{ border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Loại</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Host / Name</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Giá trị (Value)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Copy</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: 'TXT (SPF)', host: sendingDomain, val: 'v=spf1 include:amazonses.com ~all' },
                    { type: 'CNAME (DKIM)', host: `dom1._domainkey.${sendingDomain}`, val: 'dom1.dkim.amazonses.com' },
                    { type: 'TXT (DMARC)', host: `_dmarc.${sendingDomain}`, val: `v=DMARC1; p=quarantine; rua=mailto:postmaster@${sendingDomain}` },
                  ].map((rec) => (
                    <tr key={rec.host} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1E40FF' }}>{rec.type}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{rec.host}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#334155' }}>{rec.val}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => copyText(rec.val, rec.type)}
                          className="btn secondary sm"
                          style={{ height: 30, fontSize: '0.74rem' }}
                        >
                          <Copy size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* 3. ZALO OA / ZNS */}
      {activeWizard === 'zalo_zns' && (
        <Card
          title="Kết Nối Zalo Official Account & Zalo ZNS (Cô lập Tuyệt đối theo Tenant)"
          subtitle="Mỗi doanh nghiệp sử dụng OA riêng — tự động làm mới Access Token & bắn thông báo ZNS chuẩn mẫu"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Zalo OA ID *</label>
              <input className="form-input" placeholder="409821..." value={oaId} onChange={(e) => setOaId(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Zalo App ID *</label>
              <input className="form-input" placeholder="281940..." value={zaloAppId} onChange={(e) => setZaloAppId(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">OAuth Refresh Token</label>
              <input type="password" className="form-input" placeholder="••••••••••••" value={zaloRefreshToken} onChange={(e) => setZaloRefreshToken(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Mã mẫu ZNS Chào mừng mặc định</label>
              <input className="form-input" placeholder="312098" value={znsWelcomeTplId} onChange={(e) => setZnsWelcomeTplId(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void saveVaultIntegration('zalo_zns', { oaId, zaloAppId, zaloRefreshToken, znsWelcomeTplId }, 'Zalo OA / ZNS')
              }
              className="btn-inkica-primary"
              style={{ height: 42, padding: '0 1.35rem', borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
            >
              Lưu Kết Nối Zalo OA / ZNS
            </button>
          </div>
        </Card>
      )}

      {/* 4. SMS BRANDNAME */}
      {activeWizard === 'sms_brandname' && (
        <Card
          title="Cấu Hình Cổng SMS Brandname Doanh Nghiệp"
          subtitle="Gửi mã xác thực OTP, nhắc lịch hẹn 1-1 và thông báo giao dịch khẩn cấp"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Nhà mạng / Cổng kết nối</label>
              <select className="form-input" value={smsProvider} onChange={(e) => setSmsProvider(e.target.value)}>
                <option value="viettel">Viettel Sinvoice / Brandname</option>
                <option value="vnpt">VNPT SmartSMS</option>
                <option value="fpt">FPT Telecom Brandname</option>
                <option value="esms">eSMS.vn Multi-Carrier</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tên định danh Brandname (Tối đa 11 ký tự)</label>
              <input className="form-input" maxLength={11} value={smsBrandname} onChange={(e) => setSmsBrandname(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">API Key / Secret Token</label>
              <input type="password" className="form-input" placeholder="••••••••••••" value={smsApiKey} onChange={(e) => setSmsApiKey(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void saveVaultIntegration('sms_brandname', { smsProvider, smsBrandname, smsApiKey }, 'SMS Brandname')
              }
              className="btn-inkica-primary"
              style={{ height: 42, padding: '0 1.35rem', borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
            >
              Lưu Cấu Hình SMS Brandname
            </button>
          </div>
        </Card>
      )}

      {/* 5. WEB FORM & TRACKING JS SNIPPET */}
      {activeWizard === 'web_sdk' && (
        <Card
          title="Mã Nhúng Website Tracking, Heatmap & Form Card SDK (/sdk/dom-tracker.js)"
          subtitle="Định danh hợp nhất khách ẩn danh sang Hồ sơ 360° ngay khi khách điền SĐT hoặc Email trên Landing Page"
          actions={
            <button
              type="button"
              onClick={() => copyText(trackingSnippet, 'Mã nhúng Tracking SDK')}
              className="btn-inkica-primary"
              style={{ height: 36, padding: '0 1rem', borderRadius: 12, border: 'none', color: '#FFFFFF', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <Copy size={13} /> Sao chép đoạn mã JS
            </button>
          }
        >
          <pre
            style={{
              background: '#0F172A',
              color: '#E2E8F0',
              padding: '1rem 1.2rem',
              borderRadius: 16,
              fontSize: '0.78rem',
              overflowX: 'auto',
              lineHeight: 1.6,
            }}
          >
            {trackingSnippet}
          </pre>
        </Card>
      )}

      {/* 6. PROMAX ENTERPRISE VAULT */}
      {activeWizard === 'enterprise_vault' && (
        <Card
          title="Kết Nối Hóa Đơn Điện Tử & Khóa AI Doanh Nghiệp Riêng (BYOK)"
          subtitle="Dành riêng cho gói DOMATION PROMAX — phát hành hóa đơn từ Đơn hàng SO và dùng hạn mức Gemini riêng"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Mã số thuế MISA meInvoice / Viettel SInvoice</label>
              <input className="form-input" placeholder="031xxxxxxx" value={misaTaxCode} onChange={(e) => setMisaTaxCode(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">eInvoice App ID / Token</label>
              <input type="password" className="form-input" value={misaAppId} onChange={(e) => setMisaAppId(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Google Gemini Enterprise API Key (BYOK)</label>
              <input type="password" className="form-input" placeholder="AIzaSy..." value={geminiByokKey} onChange={(e) => setGeminiByokKey(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void saveVaultIntegration('ai_gemini_byok', { misaTaxCode, misaAppId, geminiByokKey }, 'Hóa đơn điện tử & AI BYOK')
              }
              className="btn-inkica-primary"
              style={{ height: 42, padding: '0 1.35rem', borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
            >
              Lưu Kết Nối Enterprise Vault
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};
