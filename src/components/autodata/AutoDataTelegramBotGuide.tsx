import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Loader2,
  Send,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import type { TelegramIntegrationState } from './autodataTypes';

interface AutoDataTelegramBotGuideProps {
  accessToken: string;
  tenantSlug: string;
  savedTelegram: TelegramIntegrationState | null;
  onUpdated: (next: TelegramIntegrationState) => void;
  onFeedback: (msg: string, isError?: boolean) => void;
}

export function AutoDataTelegramBotGuide({
  accessToken,
  tenantSlug,
  savedTelegram,
  onUpdated,
  onFeedback,
}: AutoDataTelegramBotGuideProps) {
  const [botTokenDraft, setBotTokenDraft] = useState<string | null>(null);
  const [chatIdDraft, setChatIdDraft] = useState<string | null>(null);
  const [enabledDraft, setEnabledDraft] = useState<boolean | null>(null);
  const [silentModeDraft, setSilentModeDraft] = useState<boolean | null>(null);

  const botToken = botTokenDraft ?? savedTelegram?.bot_token_masked ?? '';
  const chatId = chatIdDraft ?? savedTelegram?.chat_id ?? '';
  const enabled = enabledDraft ?? savedTelegram?.enabled ?? false;
  const silentMode = silentModeDraft ?? savedTelegram?.silent_mode ?? true;

  const setBotToken = (v: string) => setBotTokenDraft(v);
  const setChatId = (v: string) => setChatIdDraft(v);
  const setEnabled = (v: boolean | ((prev: boolean) => boolean)) =>
    setEnabledDraft((prev) => {
      const cur = prev ?? savedTelegram?.enabled ?? false;
      return typeof v === 'function' ? v(cur) : v;
    });
  const setSilentMode = (v: boolean | ((prev: boolean) => boolean)) =>
    setSilentModeDraft((prev) => {
      const cur = prev ?? savedTelegram?.silent_mode ?? true;
      return typeof v === 'function' ? v(cur) : v;
    });

  const [saving, setSaving] = useState(false);
  const [showAdvancedCode, setShowAdvancedCode] = useState(false);

  const [testCommand, setTestCommand] = useState('/chatid');
  const [testingCmd, setTestingCmd] = useState(false);
  const [testReply, setTestReply] = useState<{
    silent: boolean;
    mocked: boolean;
    replyText: string;
  } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const webhookEndpoint =
    savedTelegram?.webhook_url || 'http://localhost:3100/api/v1/integrations/telegram/webhook';

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/autodata?action=telegram-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-Tenant-Slug': tenantSlug,
        },
        body: JSON.stringify({
          bot_token: botToken.trim(),
          chat_id: chatId.trim(),
          silent_mode: silentMode,
          enabled,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          telegram_config?: {
            bot_token_masked?: string;
            chat_id?: string;
            silent_mode?: boolean;
            enabled?: boolean;
            updated_at?: string;
          };
        };
        error?: { message?: string };
      };
      if (!res.ok || !json.success) {
        onFeedback(json.error?.message || 'Không thể lưu cấu hình Telegram Bot.', true);
        return;
      }
      const saved = json.data?.telegram_config;
      onUpdated({
        status: 'active',
        enabled: saved?.enabled ?? enabled,
        silent_mode: saved?.silent_mode ?? silentMode,
        server_silent_enforced: savedTelegram?.server_silent_enforced ?? true,
        chat_id: saved?.chat_id ?? chatId.trim(),
        bot_token_masked: saved?.bot_token_masked ?? botToken.trim(),
        webhook_url: webhookEndpoint,
        updated_at: saved?.updated_at || new Date().toISOString(),
      });
      setBotTokenDraft(null);
      setChatIdDraft(null);
      setEnabledDraft(null);
      setSilentModeDraft(null);
      onFeedback(
        silentMode
          ? 'Đã lưu cấu hình Telegram Bot (Chế độ Silent đang BẬT — không gửi thông báo thật).'
          : 'Đã lưu cấu hình Telegram Bot vào kho mã hóa AES-256.'
      );
    } catch (err: unknown) {
      onFeedback(err instanceof Error ? err.message : 'Lỗi kết nối lưu cấu hình Telegram.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async (testType: 'silent_dry_run' | 'webhook_command') => {
    setTestingCmd(true);
    try {
      const res = await fetch('/api/autodata?action=telegram-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-Tenant-Slug': tenantSlug,
        },
        body: JSON.stringify({
          test_type: testType,
          command_text: testCommand,
          chat_id: chatId.trim() || '-100987654321',
          silent_mode: true,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { replyText?: string; silent?: boolean; mocked?: boolean };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        onFeedback(json.error?.message || 'Không thể chạy thử Telegram.', true);
        return;
      }
      setTestReply({
        silent: json.data.silent ?? true,
        mocked: json.data.mocked ?? true,
        replyText: json.data.replyText || 'Đã kiểm tra thành công ở chế độ Silent.',
      });
    } catch (err: unknown) {
      onFeedback(err instanceof Error ? err.message : 'Lỗi khi test lệnh Telegram.', true);
    } finally {
      setTestingCmd(false);
    }
  };

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookEndpoint);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="inkica-glass-card rounded-[28px] p-5 sm:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200/75">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10.5" fill="#229ED9" />
              <path
                d="M16.95 7.42c.24-.88-.32-1.26-1.08-.95L6.52 10.18c-.75.29-.74.73-.13.92l2.39.75 5.55-3.48c.26-.16.5-.07.3.1l-4.5 4.08-.17 2.48c.25 0 .36-.11.5-.25l1.21-1.17 2.51 1.85c.46.26.8.12.91-.43l1.86-7.61z"
                fill="#FFFFFF"
              />
            </svg>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                Kết nối Telegram Bot báo Lead cho Sale
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
                  silentMode || savedTelegram?.server_silent_enforced
                    ? 'bg-amber-50/65 border-amber-200/75 text-amber-800'
                    : 'bg-emerald-50/65 border-emerald-200/75 text-emerald-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    silentMode || savedTelegram?.server_silent_enforced ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                <span>
                  {silentMode || savedTelegram?.server_silent_enforced
                    ? 'Đang ở chế độ Chạy thử an toàn'
                    : 'Sẵn sàng gửi tin thật'}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tự động nhắn thông tin khách mới về nhóm/cá nhân Telegram ngay khi chia vòng. Sale bấm/gõ{' '}
              <code>/tiepnhan</code> để nhận khách hoặc <code>/baoloi</code> để báo số sai.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          { label: 'Bước 1 ✓ Dán Bot Token', done: botToken.trim().length >= 8 },
          { label: 'Bước 2 ✓ Điền Chat ID nhóm', done: chatId.trim().length >= 3 },
          { label: 'Test thành công ✓', done: Boolean(testReply) || Boolean(savedTelegram?.enabled) },
        ].map((pill, idx) => (
          <div
            key={pill.label}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
              pill.done
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white/90 text-slate-600'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${pill.done ? 'text-emerald-600' : 'text-slate-300'}`} />
            <span className="truncate">{idx === 2 && !pill.done ? 'Bước 3: Chạy thử Dry-Run' : pill.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Vault Settings + Silent Mode Control */}
        <div className="lg:col-span-6 space-y-4">
          <form onSubmit={handleSaveTelegram} className="rounded-2xl bg-white/95 border border-slate-200/80 p-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cấu hình kết nối &amp; Kho Vault bảo mật
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Telegram Bot Token (từ @BotFather)
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Group / Channel Chat ID
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="-100987654321"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={silentMode}
                  onChange={(e) => setSilentMode(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#1E40FF]"
                />
                <span>
                  <strong className="text-slate-900">Chế độ Chạy thử an toàn (Silent)</strong> — Mô phỏng gửi tin để kiểm tra trước, không làm phiền nhóm Sale thật.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#1E40FF]"
                />
                <span>
                  Tự động nhắn Telegram ngay khi hệ thống phân bổ Lead mới cho Sale.
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="btn-inkica-primary min-h-[44px] rounded-full px-4 py-2 text-xs cursor-pointer disabled:opacity-60 whitespace-nowrap justify-center"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>Lưu Cấu Hình (AES-256)</span>
              </button>
              <button
                type="button"
                disabled={testingCmd}
                onClick={() => void handleTestTelegram('silent_dry_run')}
                className="ql-btn-outline min-h-[44px] rounded-full px-4 py-2 text-xs cursor-pointer disabled:opacity-60 whitespace-nowrap justify-center"
              >
                <Send className="w-3.5 h-3.5 text-[#1E40FF]" />
                <span>Chạy Thử Dry-Run (Silent)</span>
              </button>
            </div>
          </form>

          {/* Collapsible Advanced Slash Command Tester */}
          <div className="rounded-2xl bg-white/95 border border-slate-200/80 p-4 sm:p-5 space-y-3">
            <button
              type="button"
              onClick={() => setShowAdvancedCode((v) => !v)}
              className="min-h-[44px] w-full flex items-center justify-between gap-2 text-xs font-bold text-slate-700 cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#1E40FF]" />
                <span>Chế độ Nâng cao (Kỹ thuật: Slash Command &amp; Webhook)</span>
              </span>
              {showAdvancedCode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvancedCode && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Terminal className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>Kiểm thử Slash Command Webhook</span>
                </div>
                <div className="grid grid-cols-2 sm:flex flex-wrap gap-2">
                  {['/chatid', '/tiepnhan', '/baoloi Sai số'].map((cmd) => (
                    <button
                      key={cmd}
                      type="button"
                      onClick={() => setTestCommand(cmd)}
                      className={`min-h-[36px] rounded-full px-3 py-1 text-[11px] font-mono cursor-pointer transition-colors ${
                        testCommand === cmd
                          ? 'bg-[#1E40FF] text-white font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={testCommand}
                    onChange={(e) => setTestCommand(e.target.value)}
                    className="w-full sm:flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono min-h-[44px]"
                  />
                  <button
                    type="button"
                    disabled={testingCmd}
                    onClick={() => void handleTestTelegram('webhook_command')}
                    className="btn-inkica-primary min-h-[44px] rounded-xl px-4 py-2 text-xs cursor-pointer whitespace-nowrap justify-center"
                  >
                    {testingCmd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Thử lệnh</span>}
                  </button>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500">
                    <span>TELEGRAM WEBHOOK ENDPOINT</span>
                    <button
                      type="button"
                      onClick={() => void handleCopyWebhook()}
                      className="inline-flex items-center gap-1 text-[#1E40FF] hover:underline cursor-pointer"
                    >
                      {copiedWebhook ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedWebhook ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-slate-800 break-all">{webhookEndpoint}</div>
                </div>
              </div>
            )}
            {testReply && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Phản hồi (silent: {String(testReply.silent)}, mocked: {String(testReply.mocked)})
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{testReply.replyText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Standardized A-Z Setup & Logic Guide */}
        <div className="lg:col-span-6 rounded-2xl bg-white/95 border border-slate-200/80 p-5 sm:p-6 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Hướng dẫn Setup Telegram Bot chuẩn A–Z
          </div>

          <ol className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <div className="font-bold text-slate-900">Tạo Bot qua @BotFather</div>
                <p>
                  Mở Telegram tìm <strong>@BotFather</strong> → gửi <code>/newbot</code> → đặt tên và username (kết thúc bằng{' '}
                  <code>bot</code>) để lấy chuỗi <strong>HTTP API Token</strong> và dán vào ô bên trái.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <div className="font-bold text-slate-900">Thêm Bot vào nhóm Sale &amp; lấy Chat ID</div>
                <p>
                  Tạo nhóm Sales (hoặc kênh thông báo), thêm Bot vào và cấp quyền Admin, sau đó dùng{' '}
                  <code>@userinfobot</code> hoặc gõ lệnh <code>/chatid</code> để lấy mã nhóm dạng <code>-100...</code>.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <div className="font-bold text-slate-900">Logic nhận số &amp; SLA trên Telegram</div>
                <p>
                  • <code>/tiepnhan [mã_lead]</code>: xác nhận đã nhận khách &amp; dừng đồng hồ thu hồi SLA.<br />
                  • <code>/baoloi [mã_lead] [lý do]</code>: tự động tạo phiếu khiếu nại chờ Admin duyệt bù số 1:1.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <div>
                <div className="font-bold text-slate-900">Bật gửi thật sau khi test xong</div>
                <p>
                  Mở <strong>Chế độ Nâng cao</strong> ở cột trái nếu cần lấy link Webhook 2 chiều, rồi tắt <strong>Chế độ Chạy thử an toàn</strong> để gửi tin thật cho Sale.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
