import React, { useEffect, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  KeyRound,
  Loader2,
  Mail,
  Save,
  Send,
  Server,
  Sparkles,
} from 'lucide-react';
import { apiRequest, getErrorMessage } from './autodataApi';

export const EMAIL_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'system', label: 'Kiểm tra kết nối Hệ thống (System)' },
  { value: 'assignment', label: 'Giao Lead mới cho Sale (Assignment)' },
  { value: 'zalo_sale', label: 'Chào mừng & Hướng dẫn Bot (Sale)' },
  { value: 'zalo_admin', label: 'Chào mừng & Kích hoạt Bot (Admin)' },
  { value: 'ticket_admin', label: 'Thông báo Ticket báo lỗi mới (Admin)' },
  { value: 'ticket_sale_success', label: 'Duyệt Ticket & Cộng bù lượt (Sale)' },
  { value: 'ticket_sale_fail', label: 'Từ chối Ticket báo lỗi (Sale)' },
  { value: 'admin_confirm', label: 'Xác nhận Email Quản trị (Admin)' },
  { value: 'daily_report', label: 'Báo cáo hiệu suất cuối ngày (Report)' },
];

export const STANDARD_GOOGLE_SHEET_APPSCRIPT_CODE = `/**
 * =========================================================================
 * DOMATION AutoData — Google Sheets + Apps Script Email Relay (Chuan All-in-One)
 * -------------------------------------------------------------------------
 * Huong dan nhanh (khuyen dung tao tu Google Sheets de tu dong ghi log):
 * 1. Mo Google Sheets bat ky -> Menu: Tien ich mo rong (Extensions) -> Apps Script
 * 2. Xoa toan bo code cu, dan toan bo doan ma nay vao -> Bam Luu (Ctrl+S)
 * 3. Bam Trien khai (Deploy) -> Tuy chon trien khai moi (New deployment)
 *    - Loai: Ung dung web (Web app)
 *    - Thuc thi duoi dang (Execute as): Toi (Me)
 *    - Ai co quyen truy cap (Who has access): Bat ky ai (Anyone)  <-- BAT BUOC
 * 4. Cap quyen Gmail & Sheets -> Copy link ".../exec" dan vao DOMATION AutoData
 * =========================================================================
 */

// Tuy chon: Dien ma bi mat trung voi o "Apps Script Secret" trong DOMATION de bao mat
var SECRET_KEY = "";

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function logToGoogleSheet(entry) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return false; // Neu chay standalone tai script.google.com thi bo qua ghi Sheet
    var sheet = ss.getSheetByName("Email_Logs");
    if (!sheet) {
      sheet = ss.insertSheet("Email_Logs");
      sheet.appendRow([
        "Thoi gian",
        "The loai Email",
        "Trang thai",
        "Nguoi nhan (To)",
        "CC",
        "Tieu de",
        "Workspace",
        "Quota con lai / Ghi chu"
      ]);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#EFF6FF");
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([
      Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss"),
      entry.category || "system",
      entry.status || "SENT",
      entry.to || "",
      entry.cc || "",
      entry.subject || "",
      entry.tenant || "",
      entry.note || ""
    ]);
    return true;
  } catch (err) {
    return false;
  }
}

function doGet(e) {
  var hasSheet = false;
  try { hasSheet = Boolean(SpreadsheetApp.getActiveSpreadsheet()); } catch (err) {}
  return jsonResponse({
    ok: true,
    service: "DOMATION AutoData Email Relay",
    version: "2.0",
    has_google_sheet_log: hasSheet,
    remaining_daily_quota: MailApp.getRemainingDailyQuota()
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: "Empty POST body" });
    }

    var data = JSON.parse(e.postData.contents);
    if (SECRET_KEY && String(data.secret || "") !== SECRET_KEY) {
      return jsonResponse({ success: false, error: "Unauthorized: Invalid Apps Script secret key" });
    }

    var to = String(data.to || data.email || "").trim();
    if (!to || to.indexOf("@") === -1) {
      return jsonResponse({ success: false, error: "Thieu dia chi email nguoi nhan hop le (to/email)" });
    }

    var category = String(data.category || data.type || "system").trim();
    var senderName = String(data.from_name || data.tenant_name || "DOMATION AutoData").trim();
    var subject = String(data.subject || ("[AutoData] Thong bao he thong (" + category + ")")).trim();
    var plainText = String(data.text || ("Thong bao tu he thong " + senderName)).trim();
    var htmlBody = String(data.htmlBody || data.html || "").trim();

    if (!htmlBody) {
      htmlBody =
        "<div style='font-family:Arial,sans-serif;padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0'>" +
        "<h3 style='margin:0 0 10px;color:#1e40ff'>" + subject + "</h3>" +
        "<p style='white-space:pre-line;color:#334155;font-size:14px'>" + plainText + "</p>" +
        "<hr style='border:none;border-top:1px solid #e2e8f0;margin:16px 0'/>" +
        "<small style='color:#64748b'>" + senderName + " • Category: " + category + "</small>" +
        "</div>";
    }

    var mailOptions = {
      to: to,
      subject: subject,
      body: plainText,
      htmlBody: htmlBody,
      name: senderName
    };
    if (data.cc && String(data.cc).trim()) {
      mailOptions.cc = String(data.cc).trim();
    }

    MailApp.sendEmail(mailOptions);
    var remainingQuota = MailApp.getRemainingDailyQuota();
    var sheetLogged = logToGoogleSheet({
      category: category,
      status: "SENT",
      to: to,
      cc: data.cc || "",
      subject: subject,
      tenant: data.tenant_name || data.tenant_slug || "",
      note: "Quota con lai: " + remainingQuota
    });

    return jsonResponse({
      success: true,
      category: category,
      to: to,
      remaining_quota: remainingQuota,
      sheet_logged: sheetLogged,
      message: "Email sent successfully via Google Apps Script"
    });
  } catch (error) {
    logToGoogleSheet({
      category: "error",
      status: "FAILED",
      to: "",
      subject: "Apps Script Error",
      note: String(error)
    });
    return jsonResponse({
      success: false,
      error: error && error.toString ? error.toString() : String(error)
    });
  }
}`;

interface AutoDataEmailGuideProps {
  tenantSlug: string;
  accessToken?: string;
  currentProvider?: 'appscript' | 'smtp' | 'ses' | 'none';
  initialWebhookUrl?: string;
  initialSecret?: string;
  onClose?: () => void;
  onSaved?: (config: { appscript_webhook_url: string; appscript_secret: string; email_provider: string }) => void;
  onSaveConfig?: (config: {
    provider: 'appscript' | 'smtp';
    appscript_url?: string;
    appscript_secret?: string;
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_pass?: string;
    smtp_from?: string;
  }) => void;
}

export const AutoDataEmailGuide: React.FC<AutoDataEmailGuideProps> = ({
  tenantSlug,
  accessToken,
  currentProvider = 'appscript',
  initialWebhookUrl = '',
  initialSecret = '',
  onClose,
  onSaved,
  onSaveConfig,
}) => {
  const [providerTab, setProviderTab] = useState<'appscript' | 'smtp'>(
    currentProvider === 'smtp' || currentProvider === 'ses' ? 'smtp' : 'appscript'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl);
  const [appscriptSecret, setAppscriptSecret] = useState(initialSecret);
  const [savingCfg, setSavingCfg] = useState(false);

  // Test Email state
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testType, setTestType] = useState('system');
  const [sendingTest, setSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (initialWebhookUrl) setWebhookUrl(initialWebhookUrl);
  }, [initialWebhookUrl]);

  useEffect(() => {
    if (initialSecret) setAppscriptSecret(initialSecret);
  }, [initialSecret]);

  useEffect(() => {
    if (!accessToken || initialWebhookUrl) return;
    let active = true;
    void apiRequest<{ success: boolean; data?: any }>('/integrations/email/config', {
      token: accessToken,
      tenantSlug,
    })
      .then((res) => {
        if (!active || !res?.data) return;
        if (res.data.appscript_webhook_url) setWebhookUrl(res.data.appscript_webhook_url);
        if (res.data.appscript_secret) setAppscriptSecret(res.data.appscript_secret);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [accessToken, tenantSlug, initialWebhookUrl]);

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleSaveAppscriptConfig = async () => {
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl || !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/i.test(cleanUrl)) {
      if (!cleanUrl.startsWith('https://')) {
        setTestStatus({
          success: false,
          message: 'URL Web App Google Apps Script phải bắt đầu bằng https://script.google.com/macros/s/.../exec',
        });
        return;
      }
    }

    setSavingCfg(true);
    setTestStatus(null);
    try {
      await apiRequest('/integrations/email/config', {
        method: 'POST',
        token: accessToken,
        tenantSlug,
        body: {
          email_provider: 'appscript',
          appscript_webhook_url: cleanUrl,
          appscript_secret: appscriptSecret.trim(),
        },
      });
      onSaved?.({
        email_provider: 'appscript',
        appscript_webhook_url: cleanUrl,
        appscript_secret: appscriptSecret.trim(),
      });
      onSaveConfig?.({
        provider: 'appscript',
        appscript_url: cleanUrl,
        appscript_secret: appscriptSecret.trim(),
      });
      setTestStatus({
        success: true,
        message: 'Đã lưu Google Apps Script Web App URL vào hệ thống. Bạn có thể gửi thử email bên dưới để kiểm tra!',
      });
    } catch (err: unknown) {
      setTestStatus({
        success: false,
        message: getErrorMessage(err, 'Không thể lưu cấu hình Google Apps Script.'),
      });
    } finally {
      setSavingCfg(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo.trim() || !testEmailTo.includes('@')) {
      setTestStatus({
        success: false,
        message: 'Vui lòng nhập địa chỉ Email nhận hợp lệ.',
      });
      return;
    }

    setSendingTest(true);
    setTestStatus(null);
    try {
      const res = await apiRequest<{
        success: boolean;
        data?: { remainingQuota?: number | null; sheetLogged?: boolean; provider?: string; category?: string };
      }>('/integrations/email/test', {
        method: 'POST',
        token: accessToken,
        tenantSlug,
        body: {
          to_email: testEmailTo.trim(),
          type: testType,
          provider: providerTab,
          appscript_webhook_url: webhookUrl.trim() || undefined,
          appscript_secret: appscriptSecret.trim() || undefined,
          save_config: Boolean(webhookUrl.trim()),
        },
      });

      if (webhookUrl.trim()) {
        onSaved?.({
          email_provider: providerTab,
          appscript_webhook_url: webhookUrl.trim(),
          appscript_secret: appscriptSecret.trim(),
        });
      }

      const d = res?.data;
      const quotaNote =
        typeof d?.remainingQuota === 'number' ? ` • Quota Google còn hôm nay: ${d.remainingQuota} email` : '';
      const sheetNote = d?.sheetLogged ? ' • Đã ghi log tab Email_Logs trên Google Sheet' : '';

      setTestStatus({
        success: true,
        message: `Đã gửi email test [${testType}] thành công tới ${testEmailTo.trim()}!${quotaNote}${sheetNote}`,
      });
    } catch (err: unknown) {
      setTestStatus({
        success: false,
        message: getErrorMessage(
          err,
          'Gửi thử thất bại. Hãy chắc chắn đã dán đúng URL .../exec và Deploy với quyền "Who has access: Anyone".'
        ),
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-slate-800">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0284C7] text-white shadow-md">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Thiết Lập Email Thông Báo Chuẩn (Google Sheets + Apps Script)
            </h2>
            <p className="text-xs text-slate-600">
              Gửi tất cả loại email (Giao Lead, Chào mừng Zalo/Telegram, Duyệt/Từ chối Ticket, Báo cáo ngày) và tự động ghi nhật ký về Google Sheets.
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

      {/* Provider Selector Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => setProviderTab('appscript')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
            providerTab === 'appscript' ? 'bg-white text-[#1E40FF] shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          <Code2 className="h-4 w-4" /> Google Sheets + Apps Script Web App (0₫ - Khuyên Dùng)
        </button>
        <button
          type="button"
          onClick={() => setProviderTab('smtp')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
            providerTab === 'smtp' ? 'bg-white text-[#1E40FF] shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          <Server className="h-4 w-4" /> AWS SES / SMTP Server Doanh Nghiệp
        </button>
      </div>

      {/* Method 1: Google Sheets + Apps Script */}
      {providerTab === 'appscript' && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Quy Trình Chuẩn 4 Bước Với Google Sheets &amp; Apps Script
            </h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              Miễn Phí 100-1500 Email/ngày • Auto Log Email_Logs
            </span>
          </div>

          <ol className="space-y-2.5 text-xs text-slate-600 list-decimal pl-5 leading-relaxed">
            <li>
              Mở hoặc tạo mới 1 file{' '}
              <a
                href="https://sheets.google.com"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#1E40FF] hover:underline inline-flex items-center gap-0.5"
              >
                Google Sheets <ExternalLink className="h-3 w-3" />
              </a>{' '}
              để lưu nhật ký gửi email tự động (tab <code>Email_Logs</code>), sau đó chọn menu{' '}
              <strong>Tiện ích mở rộng (Extensions) &gt; Apps Script</strong>.
            </li>
            <li>
              Xóa hết code mặc định (<code>myFunction</code>), sao chép và dán toàn bộ đoạn mã chuẩn bên dưới rồi bấm{' '}
              <strong>Lưu (Ctrl+S)</strong>.
            </li>
            <li>
              Nhấn <strong>Triển khai (Deploy) &gt; Tùy chọn triển khai mới (New deployment)</strong> &gt; Chọn loại{' '}
              <strong>Ứng dụng web (Web app)</strong>.
            </li>
            <li>
              Thiết lập bắt buộc: <strong>Execute as:</strong> <code>Me (Tôi)</code> và{' '}
              <strong>Who has access:</strong> <code className="text-rose-600 font-bold">Anyone (Bất kỳ ai)</code>.
              Cấp quyền Gmail &amp; Google Sheets, copy link <code>.../exec</code> dán vào ô bên dưới.
            </li>
          </ol>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#1E40FF]" /> Mã nguồn Google Apps Script chuẩn (Hỗ trợ tất cả loại Email + Log Sheet):
              </label>
              <button
                type="button"
                onClick={() => copyToClipboard(STANDARD_GOOGLE_SHEET_APPSCRIPT_CODE, 'appscript')}
                className="inline-flex items-center gap-1 rounded-lg bg-[#1E40FF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                {copiedKey === 'appscript' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedKey === 'appscript' ? 'Đã sao chép Code' : 'Sao chép Code chuẩn'}
              </button>
            </div>
            <pre className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-3.5 font-mono text-[11px] text-emerald-400">
              {STANDARD_GOOGLE_SHEET_APPSCRIPT_CODE}
            </pre>
          </div>

          {/* Direct Paste & Save Config */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Web App URL (https://script.google.com/macros/s/.../exec) *
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-[#1E40FF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <KeyRound className="h-3 w-3 text-slate-500" /> Apps Script Secret (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={appscriptSecret}
                  onChange={(e) => setAppscriptSecret(e.target.value)}
                  placeholder="Khớp SECRET_KEY nếu có"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-[#1E40FF] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={savingCfg}
                onClick={() => void handleSaveAppscriptConfig()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {savingCfg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {savingCfg ? 'Đang lưu...' : 'Lưu URL Apps Script'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Method 2: AWS SES / SMTP */}
      {providerTab === 'smtp' && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" /> Cấu Hình AWS SES &amp; Máy Chủ SMTP Doanh Nghiệp
            </h3>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#1E40FF]">
              Tỷ Lệ Inbox 99.8% • TLS Chống Spam
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-bold text-slate-900">Máy chủ SMTP (Host):</p>
              <p className="font-mono text-slate-700 mt-0.5">email-smtp.ap-southeast-1.amazonaws.com</p>
              <p className="text-[11px] text-slate-500 mt-1">Hoặc smtp.gmail.com (với App Password 16 ký tự)</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-bold text-slate-900">Cổng kết nối (Port &amp; Security):</p>
              <p className="font-mono text-slate-700 mt-0.5">Port 587 (Bảo mật STARTTLS) hoặc 465 (SSL)</p>
              <p className="text-[11px] text-slate-500 mt-1">Khuyên dùng Port 587 để đảm bảo độ trễ thấp nhất</p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-slate-900">Bản Ghi DNS Cần Thiết Cho Tên Miền (SPF &amp; DMARC):</h4>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                <span className="font-bold text-[#1E40FF] shrink-0">1. SPF:</span>
                <span className="font-mono text-[11px] text-slate-800 break-all">
                  TXT @ v=spf1 include:amazonses.com ~all
                </span>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                <span className="font-bold text-[#1E40FF] shrink-0">2. DMARC:</span>
                <span className="font-mono text-[11px] text-slate-800 break-all">
                  TXT _dmarc v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Test Email Section */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Send className="h-4 w-4 text-[#1E40FF]" /> Kiểm Tra Gửi Thử Từng Loại Email (Live Test)
        </h3>
        <p className="text-xs text-slate-600">
          Chọn mẫu thông báo cần test (Giao Lead, Zalo Bot, Duyệt/Từ chối Ticket, Báo cáo ngày...) để kiểm tra giao diện &amp; log Google Sheets thực tế.
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-[#1E40FF] focus:outline-none"
          >
            {EMAIL_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <input
            type="email"
            value={testEmailTo}
            onChange={(e) => setTestEmailTo(e.target.value)}
            placeholder="nhap.email.nhan@gmail.com"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium focus:border-[#1E40FF] focus:outline-none"
          />
          <button
            type="button"
            disabled={sendingTest}
            onClick={() => void handleSendTestEmail()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1E40FF] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition shrink-0"
          >
            {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sendingTest ? 'Đang gửi...' : 'Gửi Thử Email Ngay'}
          </button>
        </div>

        {testStatus && (
          <div
            className={`rounded-xl border p-3 text-xs font-semibold ${
              testStatus.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {testStatus.message}
          </div>
        )}
      </div>
    </div>
  );
};
