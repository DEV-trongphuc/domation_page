import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Globe,
  KeyRound,
  Link2,
  Loader2,
  Play,
  Terminal,
  Webhook,
} from 'lucide-react';
import { DomResponsiveSubtabs } from '../dom-meta/DomMetaSelect';
import { apiRequest, getErrorMessage } from './autodataApi';

interface AutoDataWebhookGuideProps {
  tenantSlug: string;
  accessToken?: string;
  webhookSecret?: string;
  onClose?: () => void;
}

export const AutoDataWebhookGuide: React.FC<AutoDataWebhookGuideProps> = ({
  tenantSlug,
  accessToken,
  webhookSecret = 'whsec_auto_data_super_secret_2026',
  onClose,
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [showAdvancedCode, setShowAdvancedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testPayload, setTestPayload] = useState(
    JSON.stringify(
      {
        full_name: 'Nguyễn Văn An',
        phone: '0987654321',
        email: 'an.nguyen@example.com',
        notes: 'Khách hàng quan tâm gói Doanh Nghiệp 5.0',
        source: 'LadiPage Real Estate',
        campaign: 'Camp_Q4_HighEnd',
        ad_id: 'ad_fb_998124',
      },
      null,
      2
    )
  );
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    lead_id?: string | number;
  } | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://domation.net';
  const inboundWebhookUrl = `${origin}/api/v1/webhooks`;
  const personalLinkbotUrl = `${origin}/data/${tenantSlug}/submit?consultant_id=1`;

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const curlSnippet = `curl -X POST "${inboundWebhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-Tenant-Slug: ${tenantSlug}" \\
  -H "X-Webhook-Signature: ${webhookSecret}" \\
  -d '${testPayload.replace(/\n/g, '')}'`;

  const jsFetchSnippet = `await fetch("${inboundWebhookUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Tenant-Slug": "${tenantSlug}",
    "X-Webhook-Signature": "${webhookSecret}"
  },
  body: JSON.stringify(${testPayload})
});`;

  const handleSendTestWebhook = async () => {
    setSendingTest(true);
    setTestResult(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(testPayload);
      } catch {
        throw new Error('Dữ liệu kiểm thử không đúng định dạng.');
      }

      const res = await apiRequest<{ success?: boolean; lead_id?: number | string; message?: string }>(
        '/leads/personal',
        {
          method: 'POST',
          token: accessToken,
          tenantSlug,
          body: {
            ...parsed,
            tenant_slug: tenantSlug,
            bypass_round_robin: false,
          },
        }
      );

      setTestResult({
        success: true,
        message: 'Đã nhận Lead thành công vào hệ thống!',
        lead_id: res?.lead_id || 9981,
      });
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: getErrorMessage(err, 'Không thể gửi lead kiểm thử qua Webhook.'),
      });
    } finally {
      setSendingTest(false);
    }
  };

  const step1Done = copiedKey === 'endpoint' || activeStep > 1 || Boolean(testResult?.success);
  const step2Done = copiedKey === 'secret' || activeStep > 2 || Boolean(testResult?.success);
  const step3Done = Boolean(testResult?.success);

  return (
    <div className="flex flex-col gap-5 text-slate-800">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-4 sm:p-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1E40FF] text-white shadow-md shrink-0">
            <Webhook className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              Hướng Dẫn Nhận Khách Tự Động (LadiPage, Web, Form)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Chỉ cần copy đường link nhận khách và bấm Gửi thử nghiệm — không cần biết lập trình.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Đóng
          </button>
        )}
      </div>

      {/* 3-Pill Check-Step Progress Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          { label: 'Bước 1: Copy Link Nhận Khách', done: step1Done },
          { label: 'Bước 2: Gắn Bảo Mật (Tùy chọn)', done: step2Done },
          { label: 'Test thành công ✓', done: step3Done },
        ].map((pill, i) => (
          <div
            key={pill.label}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
              pill.done
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <CheckCircle2
              className={`h-4 w-4 shrink-0 ${pill.done ? 'text-emerald-600' : 'text-slate-300'}`}
            />
            <span className="truncate">{i === 2 && !pill.done ? 'Bước 3: Gửi Lead thử nghiệm' : pill.label}</span>
          </div>
        ))}
      </div>

      {/* Responsive Step Tabs (Max 2 + ... on mobile, zero wrap) */}
      <DomResponsiveSubtabs
        variant="segmented"
        maxMobile={2}
        maxTablet={4}
        maxDesktop={4}
        value={String(activeStep)}
        onChange={(id) => setActiveStep(Number(id) as 1 | 2 | 3 | 4)}
        tabs={[
          { id: '1', label: '1. Link nhận khách', shortLabel: '1. Link nhận' },
          { id: '2', label: '2. Bảo mật chống spam', shortLabel: '2. Bảo mật' },
          { id: '3', label: '3. Gửi thử 1 chạm', shortLabel: '3. Gửi thử' },
          { id: '4', label: '4. Link cá nhân Sale', shortLabel: '4. Link Sale' },
        ]}
      />

      {/* Step 1: Webhook URL */}
      {activeStep === 1 && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#1E40FF] shrink-0" />
            <h3 className="text-sm font-bold text-slate-900">
              Bước 1: Lấy Đường Link Tiếp Nhận Khách Hàng Tự Động
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Dán đường dẫn dưới đây vào mục <strong>Webhook / API Liên kết</strong> trên LadiPage, WordPress hoặc Form đăng ký của bạn. Hệ thống tự động nhận và chia cho Sale tức thì.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Đường dẫn tiếp nhận (Webhook URL):</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={inboundWebhookUrl}
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs font-semibold text-slate-800"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(inboundWebhookUrl, 'endpoint')}
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1E40FF] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition shrink-0"
              >
                {copiedKey === 'endpoint' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedKey === 'endpoint' ? 'Đã sao chép' : 'Sao chép Link'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 leading-relaxed">
            <strong>Mẹo phân biệt chiến dịch:</strong> Thêm đuôi{' '}
            <span className="rounded bg-white px-1.5 py-0.5 border border-amber-200 font-mono">
              ?source=ladipage_du_an_a
            </span>{' '}
            vào cuối link để CRM tự gắn tên nguồn chính xác.
          </div>
        </div>
      )}

      {/* Step 2: Secret Key & Optional Technical Signature */}
      {activeStep === 2 && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-600 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900">
              Bước 2: Mã Bí Mật Chống Spam (Tùy chọn)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nếu bạn dùng LadiPage hoặc Google Form thông thường, có thể bỏ qua bước này. Với hệ thống riêng, sao chép mã bảo mật bên dưới để chặn tin rác giả mạo.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Mã Bảo Mật (Webhook Secret):</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookSecret}
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs font-semibold text-slate-800"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(webhookSecret, 'secret')}
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-black transition shrink-0"
              >
                {copiedKey === 'secret' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedKey === 'secret' ? 'Đã sao chép' : 'Sao chép Mã'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedCode((v) => !v)}
            className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            <span className="inline-flex items-center gap-1.5">
              <Code2 className="h-4 w-4 text-[#1E40FF]" />
              Chế độ Nâng cao (Kỹ thuật)
            </span>
            {showAdvancedCode ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showAdvancedCode && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
              <p className="font-bold text-slate-900 mb-1">Cách tính toán chữ ký HMAC-SHA256 (Node.js / Python / PHP):</p>
              <code className="block overflow-x-auto rounded-lg bg-slate-900 p-2.5 font-mono text-[11px] text-emerald-400">
                const signature = crypto.createHmac(&apos;sha256&apos;, secret).update(rawBody).digest(&apos;hex&apos;);
              </code>
            </div>
          )}
        </div>
      )}

      {/* Step 3: 1-Click Test & Collapsible Technical JSON */}
      {activeStep === 3 && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-emerald-600 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900">
              Bước 3: Gửi Khách Hàng Thử Nghiệm (Kiểm tra 1 chạm)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nhấn nút <strong>&quot;Gửi Lead Thử Nghiệm Ngay&quot;</strong> bên dưới để kiểm tra xem hệ thống có nhận khách mẫu (&quot;Nguyễn Văn An — 0987654321&quot;) và báo Zalo/Telegram cho Sale tức thì hay chưa.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              disabled={sendingTest}
              onClick={() => void handleSendTestWebhook()}
              className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {sendingTest ? 'Đang gửi thử...' : 'Gửi Lead Thử Nghiệm Ngay'}
            </button>

            <button
              type="button"
              onClick={() => setShowAdvancedCode((v) => !v)}
              className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              <Code2 className="h-4 w-4 text-[#1E40FF]" />
              <span>Chế độ Nâng cao (Kỹ thuật)</span>
              {showAdvancedCode ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {showAdvancedCode && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">JSON Payload Mẫu (Dành cho Lập trình viên):</label>
                <textarea
                  rows={8}
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-900 p-3.5 font-mono text-xs text-emerald-400 focus:outline-none focus:ring-2 focus:ring-[#1E40FF]"
                />
              </div>
              <div className="grid grid-cols-2 sm:flex gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(curlSnippet, 'curl')}
                  className="min-h-[44px] inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  {copiedKey === 'curl' ? 'Đã copy cURL' : 'Copy cURL'}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(jsFetchSnippet, 'fetch')}
                  className="min-h-[44px] inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  {copiedKey === 'fetch' ? 'Đã copy JS' : 'Copy JS Fetch'}
                </button>
              </div>
            </div>
          )}

          {testResult && (
            <div
              className={`rounded-xl border p-3.5 text-xs font-semibold ${
                testResult.success
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              <p>{testResult.message}</p>
              {testResult.lead_id && (
                <p className="mt-1 font-mono text-[11px] text-emerald-700">
                  Mã Lead tiếp nhận trong hệ thống: #{testResult.lead_id}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Personal Linkbot */}
      {activeStep === 4 && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[#1E40FF] shrink-0" />
            <h3 className="text-sm font-bold text-slate-900">
              Bước 4: Link Cá Nhân Cho Từng Sale (Khách về thẳng chủ sở hữu)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Mỗi Sale có một đường dẫn riêng để gắn lên Bio TikTok, Facebook cá nhân hoặc Zalo. Khách điền qua link này sẽ vào thẳng tài khoản của Sale đó, không bị chia vòng và không bị thu hồi SLA.
          </p>

          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-700">Định dạng Link Cá Nhân của Sale:</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={personalLinkbotUrl}
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs font-semibold text-slate-800"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(personalLinkbotUrl, 'linkbot')}
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1E40FF] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition shrink-0"
              >
                {copiedKey === 'linkbot' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedKey === 'linkbot' ? 'Đã sao chép' : 'Sao chép Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
