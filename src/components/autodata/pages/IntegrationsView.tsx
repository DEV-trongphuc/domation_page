import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Link2, Mail, Plug, Plus, RefreshCw, Send, ShieldCheck, Trash2 } from 'lucide-react';
import { apiRequest, getErrorMessage } from '../autodataApi';
import { AutoDataTelegramBotGuide } from '../AutoDataTelegramBotGuide';
import { AutoDataZaloBotGuide } from '../AutoDataZaloBotGuide';
import {
  buildGoogleAppsScriptSnippet,
  type TelegramIntegrationState,
  type ZaloBotSavedState,
} from '../autodataTypes';

interface WebhookRow {
  id: string;
  name: string;
  webhook_type: 'inbound' | 'outbound';
  token?: string;
  url?: string;
}

interface CapiLogRow {
  id: string;
  event_name: string;
  event_id: string;
  response_status: number;
  sent_at: string;
}

interface IntegrationsOverview {
  webhooks?: WebhookRow[];
  integrations?: Record<
    string,
    {
      status?: string;
      updated_at?: string;
      config_preview?: Record<string, unknown>;
    }
  >;
  capi_logs?: CapiLogRow[];
}

interface IntegrationsViewProps {
  token: string;
  tenantSlug: string;
  adminEmail: string;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ token, tenantSlug, adminEmail }) => {
  const [subTab, setSubTab] = useState<'webhooks' | 'telegram' | 'zalo' | 'capi' | 'smtp' | 'appscript'>('webhooks');
  const [overview, setOverview] = useState<IntegrationsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [whName, setWhName] = useState('');
  const [whType, setWhType] = useState<'inbound' | 'outbound'>('inbound');
  const [whUrl, setWhUrl] = useState('');

  const [pixelId, setPixelId] = useState('');
  const [capiToken, setCapiToken] = useState('');
  const [testCode, setTestCode] = useState('');

  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');

  const fetchOverview = useCallback(async () => {
    return apiRequest<IntegrationsOverview>('/integrations/overview', { token, tenantSlug });
  }, [token, tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchOverview();
        if (!cancelled) {
          setOverview(res);
          const capiPrev = res?.integrations?.meta_capi?.config_preview;
          if (capiPrev) {
            if (capiPrev.pixel_id) setPixelId(String(capiPrev.pixel_id));
            if (capiPrev.test_event_code) setTestCode(String(capiPrev.test_event_code));
          }
          const smtpPrev = res?.integrations?.smtp?.config_preview;
          if (smtpPrev) {
            if (smtpPrev.host) setSmtpHost(String(smtpPrev.host));
            if (smtpPrev.port) setSmtpPort(String(smtpPrev.port));
            if (smtpPrev.username) setSmtpUser(String(smtpPrev.username));
            if (smtpPrev.from_email) setSmtpFrom(String(smtpPrev.from_email));
          }
        }
      } catch {
        if (!cancelled) setOverview(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchOverview]);

  const reload = async () => {
    setLoading(true);
    try {
      setOverview(await fetchOverview());
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim()) return;
    try {
      await apiRequest('/integrations/webhooks', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: whName.trim(),
          webhook_type: whType,
          url: whType === 'outbound' ? whUrl.trim() : undefined,
          subscribed_events: ['lead.created', 'lead.stage_changed'],
        },
      });
      setWhName('');
      setWhUrl('');
      setToast('Đã tạo Webhook kết nối mới.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể tạo Webhook.'));
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await apiRequest(`/integrations/webhooks/${id}`, { method: 'DELETE', token, tenantSlug });
      void reload();
    } catch {
      // ignore
    }
  };

  const handleSaveCapi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/integrations/vault/meta_capi', {
        method: 'PUT',
        token,
        tenantSlug,
        body: {
          pixel_id: pixelId.trim(),
          access_token: capiToken.trim() || undefined,
          test_event_code: testCode.trim() || undefined,
          is_enabled: true,
        },
      });
      setToast('Đã mã hóa AES-256 & lưu cấu hình Meta CAPI v21.0.');
      void reload();
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Không thể lưu Meta CAPI.'));
    }
  };

  const handleTestCapi = async () => {
    try {
      await apiRequest('/integrations/capi/test-event', {
        method: 'POST',
        token,
        tenantSlug,
        body: { event_name: 'Lead' },
      });
      setToast('Đã kiểm thử Meta CAPI (Chế độ Outbound Silent Guard an toàn).');
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Kiểm thử CAPI không thành công.'));
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/integrations/vault/smtp', {
        method: 'PUT',
        token,
        tenantSlug,
        body: {
          host: smtpHost.trim(),
          port: Number(smtpPort || 587),
          username: smtpUser.trim(),
          password: smtpPass.trim() || undefined,
          from_email: smtpFrom.trim(),
          is_enabled: true,
        },
      });
      setToast('Đã mã hóa & lưu cấu hình SMTP.');
    } catch (err: unknown) {
      setToast(getErrorMessage(err, 'Lỗi lưu SMTP.'));
    }
  };

  const webhooks = overview?.webhooks || [];
  const firstInbound = webhooks.find((w) => w.webhook_type === 'inbound');
  const inboundUrl = firstInbound
    ? `${window.location.origin}/api/v1/webhooks/${tenantSlug}/${firstInbound.token}`
    : `${window.location.origin}/api/v1/webhooks/${tenantSlug}/<token>`;
  const appsScriptCode = buildGoogleAppsScriptSnippet(inboundUrl, adminEmail);

  const tgEntry = overview?.integrations?.telegram_bot || overview?.integrations?.telegram;
  const savedTelegram: TelegramIntegrationState | null = tgEntry
    ? {
        status: tgEntry.status || 'active',
        enabled: Boolean(tgEntry.config_preview?.enabled),
        silent_mode: tgEntry.config_preview?.silent_mode !== false,
        server_silent_enforced: true,
        chat_id: String(tgEntry.config_preview?.chat_id || ''),
        bot_token_masked: String(tgEntry.config_preview?.bot_token || ''),
        webhook_url: `${window.location.origin}/api/v1/integrations/telegram/webhook`,
        updated_at: tgEntry.updated_at || new Date().toISOString(),
      }
    : null;

  const zaloEntry = overview?.integrations?.zalo_bot || overview?.integrations?.zalo_oa;
  const savedZaloBot: ZaloBotSavedState | null = zaloEntry?.config_preview
    ? {
        verified: zaloEntry.status === 'active',
        verification_mode: zaloEntry.config_preview.verification_mode === 'sandbox_bridge_verified' ? 'sandbox_bridge_verified' : 'live_zalo_api',
        bot_name: String(zaloEntry.config_preview.bot_name || 'Zalo Bot OA'),
        chat_id: String(zaloEntry.config_preview.chat_id || zaloEntry.config_preview.group_chat_id || ''),
        verified_at: zaloEntry.updated_at || new Date().toISOString(),
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="inkica-glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <Plug className="h-5 w-5 text-[#1E40FF]" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Trung Tâm Kết Nối & Vault Bảo Mật AES-256</h1>
            <p className="text-xs text-slate-500">Webhook đa kênh, Telegram Bot, Zalo OA 2 Chiều, Meta CAPI v21.0, SMTP & Apps Script</p>
          </div>
        </div>
        <button type="button" onClick={() => void reload()} className="rounded-xl border border-slate-200 p-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {toast && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-[#1E40FF]">
          {toast}
        </div>
      )}

      <div data-tour="integrations-tabs" className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-100 p-1.5 text-xs font-semibold">
        {[
          { key: 'webhooks', label: '1. Webhooks Inbound / Outbound' },
          { key: 'telegram', label: '2. Telegram Bot' },
          { key: 'zalo', label: '3. Zalo Bot OA 2 Chiều' },
          { key: 'capi', label: '4. Meta CAPI v21.0' },
          { key: 'smtp', label: '5. Email SMTP' },
          { key: 'appscript', label: '6. Google Apps Script' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSubTab(t.key as typeof subTab)}
            className={`rounded-xl px-3.5 py-2 transition ${
              subTab === t.key ? 'bg-white text-[#1E40FF] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'webhooks' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateWebhook} className="inkica-glass-card flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-700">Tên kết nối</label>
              <input
                type="text"
                required
                value={whName}
                onChange={(e) => setWhName(e.target.value)}
                placeholder="vd: Landing Page Doanh nghiệp"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>
            <select
              value={whType}
              onChange={(e) => setWhType(e.target.value as 'inbound' | 'outbound')}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
            >
              <option value="inbound">Inbound (Nhận Lead)</option>
              <option value="outbound">Outbound (Đẩy sự kiện CRM)</option>
            </select>
            {whType === 'outbound' && (
              <input
                type="url"
                required
                value={whUrl}
                onChange={(e) => setWhUrl(e.target.value)}
                placeholder="https://crm.company.vn/webhook"
                className="min-w-[240px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            )}
            <button type="submit" className="btn-inkica-primary inline-flex items-center gap-1 rounded-xl px-4 py-2 text-xs font-semibold text-white">
              <Plus className="h-4 w-4" /> Thêm Webhook
            </button>
          </form>

          <div className="space-y-2.5">
            {webhooks.map((w) => (
              <div key={w.id} className="inkica-glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-[#1E40FF]" />
                    <span className="font-bold text-slate-900">{w.name}</span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#1E40FF]">
                      {w.webhook_type}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[11px] text-slate-500">
                    {w.webhook_type === 'inbound'
                      ? `${window.location.origin}/api/v1/webhooks/${tenantSlug}/${w.token}`
                      : w.url}
                  </p>
                </div>
                <button type="button" onClick={() => void handleDeleteWebhook(w.id)} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'telegram' && (
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
          <AutoDataTelegramBotGuide
            accessToken={token}
            tenantSlug={tenantSlug}
            savedTelegram={savedTelegram}
            onUpdated={() => void reload()}
            onFeedback={(msg) => setToast(msg)}
          />
        </div>
      )}

      {subTab === 'zalo' && (
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5">
          <AutoDataZaloBotGuide
            accessToken={token}
            tenantSlug={tenantSlug}
            savedZaloBot={savedZaloBot}
            onVerified={() => {
              setToast('Đã xác thực Zalo Bot thành công.');
              void reload();
            }}
          />
        </div>
      )}

      {subTab === 'capi' && (
        <div className="space-y-4">
          <form onSubmit={handleSaveCapi} className="inkica-glass-card space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-[#1E40FF]" /> Cấu Hình Meta Conversions API v21.0
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input type="text" value={pixelId} onChange={(e) => setPixelId(e.target.value)} placeholder="Dataset / Pixel ID" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
              <input type="password" value={capiToken} onChange={(e) => setCapiToken(e.target.value)} placeholder="System User Access Token" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
              <input type="text" value={testCode} onChange={(e) => setTestCode(e.target.value)} placeholder="Test Event Code (vd: TEST12345)" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-inkica-primary rounded-xl px-4 py-2 text-xs font-semibold text-white">
                Lưu Cấu Hình CAPI
              </button>
              <button
                type="button"
                onClick={() => void handleTestCapi()}
                className="ql-btn-outline inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                <Send className="h-3.5 w-3.5" /> Test Event
              </button>
            </div>
          </form>

          {(overview?.capi_logs || []).length > 0 && (
            <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-5 text-xs">
              <h3 className="mb-2.5 font-bold text-slate-900">Nhật ký Meta CAPI gần nhất</h3>
              <div className="space-y-1.5">
                {(overview?.capi_logs || []).slice(0, 10).map((lg) => (
                  <div key={lg.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="font-mono font-semibold text-slate-800">{lg.event_name} ({lg.event_id})</span>
                    <span className={`rounded-full px-2 py-0.5 font-bold ${lg.response_status === 200 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      HTTP {lg.response_status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'smtp' && (
        <form onSubmit={handleSaveSmtp} className="inkica-glass-card space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Mail className="h-4 w-4 text-[#1E40FF]" /> Cấu Hình Email SMTP / Amazon SES
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="SMTP Host" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
            <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
            <input type="email" value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} placeholder="From Email" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
            <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="Username" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
            <input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="Password" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
          </div>
          <button type="submit" className="btn-inkica-primary rounded-xl px-4 py-2 text-xs font-semibold text-white">
            Lưu SMTP Vault
          </button>
        </form>
      )}

      {subTab === 'appscript' && (
        <div className="inkica-glass-card space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Mã Google Apps Script Đồng Bộ 2 Chiều</h2>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(appsScriptCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Đã copy' : 'Copy Code'}
            </button>
          </div>
          <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-[11px] text-slate-100">
            {appsScriptCode}
          </pre>
        </div>
      )}
    </div>
  );
};
