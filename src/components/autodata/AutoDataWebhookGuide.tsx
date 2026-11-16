import React, { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  ExternalLink,
  Globe,
  KeyRound,
  Link2,
  Loader2,
  Play,
  Send,
  ShieldCheck,
  Terminal,
  Webhook,
} from 'lucide-react';
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
        throw new Error('Dữ liệu JSON kiểm thử không đúng định dạng.');
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

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1E40FF] text-white shadow-md">
            <Webhook className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Hướng Dẫn Tích Hợp Inbound Webhook & Linkbot Tiếp Nhận Lead
            </h2>
            <p className="text-xs text-slate-600">
              Kết nối tức thì &lt;3s từ LadiPage, Website, CRM ngoài hoặc Linkbot cá nhân của từng Sale.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Đóng
          </button>
        )}
      </div>

      {/* Step Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`flex-1 rounded-lg py-2 transition ${
            activeStep === 1 ? 'bg-white text-[#1E40FF] shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          1. Cổng Webhook URL
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`flex-1 rounded-lg py-2 transition ${
            activeStep === 2 ? 'bg-white text-[#1E40FF] shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          2. Bảo Mật HMAC-SHA256
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(3)}
          className={`flex-1 rounded-lg py-2 transition ${
            activeStep === 3 ? 'bg-white text-[#1E40FF] shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          3. Mẫu JSON & Test cURL
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(4)}
          className={`flex-1 rounded-lg py-2 transition ${
            activeStep === 4 ? 'bg-white text-[#1E40FF] shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          4. Linkbot Cá Nhân Sale
        </button>
      </div>

      {/* Step 1: Webhook URL */}
      {activeStep === 1 && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#1E40FF]" />
            <h3 className="text-sm font-bold text-slate-900">
              Bước 1: Lấy Địa Chỉ URL Cổng Tiếp Nhận Dữ Liệu (Inbound Webhook)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Dán đường dẫn này vào mục <strong>Webhook / API Liên kết</strong> trên Landing Page (LadiPage, WordPress,
            Webflow, Shopify) hoặc Form đăng ký của bạn. Phương thức HTTP luôn là <code>POST</code> với header{' '}
            <code>Content-Type: application/json</code>.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Endpoint Webhook Chuẩn:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inboundWebhookUrl}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs font-semibold text-slate-800 selection:bg-blue-200"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(inboundWebhookUrl, 'endpoint')}
                className="inline-flex items-center gap-1 rounded-xl bg-[#1E40FF] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition shrink-0"
              >
                {copiedKey === 'endpoint' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedKey === 'endpoint' ? 'Đã sao chép' : 'Sao chép'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 leading-relaxed">
            <strong>Gợi ý nguồn (Source Tagging):</strong> Bạn có thể thêm tham số truy vấn vào URL để hệ thống tự động
            phân loại nguồn, ví dụ:{' '}
            <code className="rounded bg-white px-1.5 py-0.5 border border-amber-200">
              {inboundWebhookUrl}?source=ladipage_du_an_a
            </code>
          </div>
        </div>
      )}

      {/* Step 2: HMAC-SHA256 Signature */}
      {activeStep === 2 && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Bước 2: Mã Khóa Bí Mật & Xác Thực Chữ Ký HMAC-SHA256
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Để ngăn chặn spam hoặc đối thủ phá form, hệ thống hỗ trợ xác minh chữ ký qua header{' '}
            <code>X-Webhook-Signature</code>. Khi bật tùy chọn này, mọi yêu cầu không mang chữ ký hợp lệ sẽ bị từ chối
            ngay tại cổng.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Mã Webhook Secret:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookSecret}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs font-semibold text-slate-800"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(webhookSecret, 'secret')}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-black transition shrink-0"
              >
                {copiedKey === 'secret' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedKey === 'secret' ? 'Đã sao chép' : 'Sao chép'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
            <p className="font-bold text-slate-900 mb-1">Cách tính toán chữ ký HMAC-SHA256 (Node.js / Python / PHP):</p>
            <code className="block rounded-lg bg-slate-900 p-2.5 font-mono text-[11px] text-emerald-400">
              const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
            </code>
          </div>
        </div>
      )}

      {/* Step 3: Payload & Test */}
      {activeStep === 3 && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Bước 3: Cấu Trúc JSON Chuẩn & Trình Kiểm Thử Trực Tuyến
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Chỉnh sửa payload bên dưới và nhấn nút <strong>"Gửi Lead Thử Nghiệm"</strong> để kiểm tra xem hệ thống có
            nhận số, khử trùng và kích hoạt thông báo Zalo/Telegram tức thì hay không.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">JSON Payload Mẫu:</label>
            <textarea
              rows={8}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-900 p-3.5 font-mono text-xs text-emerald-400 focus:outline-none focus:ring-2 focus:ring-[#1E40FF]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(curlSnippet, 'curl')}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Terminal className="h-3.5 w-3.5" />
                {copiedKey === 'curl' ? 'Đã copy cURL' : 'Copy lệnh cURL'}
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(jsFetchSnippet, 'fetch')}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Code2 className="h-3.5 w-3.5" />
                {copiedKey === 'fetch' ? 'Đã copy JS' : 'Copy JS Fetch'}
              </button>
            </div>

            <button
              type="button"
              disabled={sendingTest}
              onClick={() => void handleSendTestWebhook()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {sendingTest ? 'Đang gửi...' : 'Gửi Lead Thử Nghiệm Ngay'}
            </button>
          </div>

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
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[#1E40FF]" />
            <h3 className="text-sm font-bold text-slate-900">
              Bước 4: Linkbot Cá Nhân Cho Từng Tư Vấn Viên (Sale Personal Link)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Mỗi tư vấn viên có một đường dẫn riêng biệt để đăng lên trang cá nhân (Zalo, Facebook, TikTok Bio, danh thiếp
            điện tử). Khi khách điền qua link này:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-5">
            <li>
              <strong>Khách tự động thuộc về Sale đó ngay lập tức</strong>, không bị chia ngẫu nhiên qua các Sale khác.
            </li>
            <li>
              <strong>Miễn thu hồi SLA:</strong> Vì đây là khách do Sale tự tìm kiếm, hệ thống không áp dụng cơ chế tự
              động thu hồi chuyển số.
            </li>
            <li>
              <strong>Không tính vào hạn mức (Quota impact = 0):</strong> Không làm trừ lượt phân bổ của vòng chung.
            </li>
          </ul>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-700">Định dạng URL Linkbot Cá Nhân:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={personalLinkbotUrl}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs font-semibold text-slate-800"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(personalLinkbotUrl, 'linkbot')}
                className="inline-flex items-center gap-1 rounded-xl bg-[#1E40FF] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition shrink-0"
              >
                {copiedKey === 'linkbot' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedKey === 'linkbot' ? 'Đã sao chép' : 'Sao chép'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Thay <code>consultant_id=1</code> bằng ID riêng của từng Sale (xem tại mục <strong>Đại lý &amp; Sale</strong>).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
