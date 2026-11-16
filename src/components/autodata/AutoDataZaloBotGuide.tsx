import React, { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Send,
  Zap,
} from 'lucide-react';
import { AutoDataHelpTrigger } from './AutoDataHelpTour';
import type { HelpTopicKey, ZaloBotSavedState, ZaloVerifyResult } from './autodataTypes';

interface AutoDataZaloBotGuideProps {
  accessToken?: string;
  tenantSlug?: string;
  savedZaloBot?: ZaloBotSavedState | null;
  onVerified?: (saved: ZaloBotSavedState) => void;
  onFastSkip?: () => void;
  fastSkipLabel?: string;
  onOpenTour?: (topic?: HelpTopicKey) => void;
  compact?: boolean;
}

export function AutoDataZaloBotGuide({
  accessToken,
  tenantSlug,
  savedZaloBot,
  onVerified,
  onFastSkip,
  fastSkipLabel = 'Tùy chọn — Tạm bỏ qua & vào setup ngay',
  onOpenTour,
  compact = false,
}: AutoDataZaloBotGuideProps) {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState(savedZaloBot?.chat_id || '');
  const [verifyingMode, setVerifyingMode] = useState<'live' | 'sandbox' | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<ZaloVerifyResult | null>(
    savedZaloBot
      ? {
          verified: true,
          verification_mode: savedZaloBot.verification_mode,
          bot_name: savedZaloBot.bot_name,
          chat_id: savedZaloBot.chat_id,
          message_sent: true,
          preview_message: `Đã xác thực kết nối Zalo Bot (${savedZaloBot.bot_name}) tới Chat ID ${savedZaloBot.chat_id}.`,
          latency_ms: 8,
        }
      : null
  );
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [fetchingChatId, setFetchingChatId] = useState(false);

  const handleFetchChatId = async () => {
    if (botToken.trim().length < 10) {
      setVerifyError('Vui lòng dán Bot Token từ bot.zaloplatforms.com vào ô bên trái trước khi lấy Chat ID.');
      return;
    }
    setFetchingChatId(true);
    setVerifyError(null);
    try {
      const res = await fetch('/api/autodata?action=zalo-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: botToken.trim() }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { chat_id?: string; sender_label?: string };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data?.chat_id) {
        setVerifyError(
          json.error?.message ||
            'Chưa tìm thấy tin nhắn gửi tới Bot. Hãy nhắn 1 tin bất kỳ cho Bot trên Zalo rồi thử lại.'
        );
        return;
      }
      setChatId(json.data.chat_id);
      setVerifyResult({
        verified: false,
        verification_mode: 'live_zalo_api',
        bot_name: json.data.sender_label || 'Zalo Chat',
        chat_id: json.data.chat_id,
        message_sent: false,
        preview_message: `Đã tự động điền Chat ID từ "${json.data.sender_label || 'Zalo'}". Bấm "Xác thực Zalo Bot Thật" để gửi tin test!`,
        latency_ms: 0,
      });
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : 'Lỗi mạng khi đọc tin nhắn từ Zalo Bot Platform.');
    } finally {
      setFetchingChatId(false);
    }
  };

  const handleCopyChatIdCmd = async () => {
    try {
      await navigator.clipboard.writeText('/chatid');
      setCopiedCmd(true);
      window.setTimeout(() => setCopiedCmd(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const runVerification = async (mode: 'live' | 'sandbox') => {
    setVerifyingMode(mode);
    setVerifyError(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      if (tenantSlug) {
        headers['X-Tenant-Slug'] = tenantSlug;
      }

      const res = await fetch('/api/autodata?action=zalo-verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode,
          bot_token: mode === 'sandbox' ? 'demo_zalobot_token' : botToken.trim(),
          chat_id: chatId.trim() || (mode === 'sandbox' ? 'sale_internal_01' : ''),
          send_test_message: true,
          tenant_slug: tenantSlug,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: ZaloVerifyResult;
        error?: { message?: string };
      };

      if (!res.ok || !json.success || !json.data) {
        setVerifyError(
          json.error?.message || 'Không thể xác thực kết nối Zalo Bot. Vui lòng kiểm tra lại Token và Chat ID.'
        );
        return;
      }

      setVerifyResult(json.data);
      if (onVerified) {
        onVerified({
          verified: true,
          verification_mode: json.data.verification_mode,
          bot_name: json.data.bot_name,
          chat_id: json.data.chat_id,
          verified_at: new Date().toISOString(),
        });
      }
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : 'Lỗi mạng khi gọi cầu nối xác thực Zalo Bot.');
    } finally {
      setVerifyingMode(null);
    }
  };

  return (
    <div className="inkica-glass-card rounded-3xl p-4 sm:p-7 space-y-6">
      {/* Header with explicit Optional badge + Fast Skip CTA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-bold text-amber-800 whitespace-nowrap">
              TÙY CHỌN • CÓ THỂ CÀI ĐẶT SAU
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-[#1E40FF] whitespace-nowrap">
              <Bot className="w-3.5 h-3.5 shrink-0" />
              <span>Zalo Bot A–Z &amp; Live Test</span>
            </span>
            {onOpenTour && (
              <AutoDataHelpTrigger topic="zalobot_chatid" onOpenTour={onOpenTour} />
            )}
          </div>
          <h3 className={`${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-bold text-slate-900 leading-snug`}>
            Hướng dẫn kết nối Zalo Bot từ A–Z &amp; Kiểm tra kết nối trực tiếp
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Giúp từng nhân viên Sale nội bộ nhận thông báo Lead mới ngay trên điện thoại Zalo tức thì. Chưa có Bot? Bạn hoàn toàn có thể bỏ qua bước này để vào dùng hệ thống ngay.
          </p>
        </div>

        {onFastSkip && (
          <button
            type="button"
            onClick={onFastSkip}
            className="ql-btn-outline self-start lg:self-center px-3.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 max-w-full"
          >
            <span>{fastSkipLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[#1E40FF]" />
          </button>
        )}
      </div>

      {/* 4-Step A-Z Visual Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
              BƯỚC 1 • TẠO BOT
            </span>
            <a
              href="https://bot.zaloplatforms.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E40FF] hover:underline whitespace-nowrap"
            >
              <span>bot.zaloplatforms.com</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-900">Tạo Bot &amp; Lấy Bot Token</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Đăng nhập Zalo tại <strong>Zalo Bot Creator</strong>, chọn <strong>Tạo Bot mới</strong>, đặt tên (VD: <em>Sale Lead Bot</em>) và sao chép mã <strong>Bot Token</strong>.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
              BƯỚC 2 • MỞ ZALO NHẮN TIN
            </span>
            <button
              type="button"
              onClick={() => void handleCopyChatIdCmd()}
              className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-800 hover:border-[#1E40FF] cursor-pointer whitespace-nowrap"
            >
              {copiedCmd ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCmd ? 'Đã chép' : '/chatid'}</span>
            </button>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-900">Nhắn 1 tin mở luồng cho Bot</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Quét QR hoặc tìm tên Bot trên Zalo (nhắn 1-1 hoặc mời Bot vào <strong>nhóm Sale</strong>) rồi gửi 1 tin bất kỳ (VD: <code className="font-mono font-bold text-[#1E40FF]">/chatid</code>).
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 space-y-2">
          <span className="inline-block rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
            BƯỚC 3 • LẤY CHAT ID
          </span>
          <div className="text-xs sm:text-sm font-bold text-slate-900">Dán Token &amp; Lấy Chat ID</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Dán <strong>Bot Token</strong> vào ô bên dưới, bấm nút <strong>Lấy Chat ID tự động</strong> để hệ thống tự đọc mã nhận tin từ Zalo Bot Platform.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/90 to-cyan-50/70 p-4 space-y-2">
          <span className="inline-block rounded-full bg-gradient-to-r from-[#1E40FF] to-[#0284C7] text-white px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
            BƯỚC 4 • LIVE VERIFY
          </span>
          <div className="text-xs sm:text-sm font-bold text-slate-900">Xác Thực &amp; Gửi Tin Test</div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Bấm <strong>Xác thực Zalo Bot Thật</strong> để kiểm tra quyền Bot (<code>getMe</code>) và nhận tin test thật về Zalo ngay lập tức.
          </p>
        </div>
      </div>

      {/* Live Connection Verification Test Inputs & Buttons */}
      <div className="rounded-2xl border border-slate-200/90 bg-white/85 p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between gap-2">
              <span>Zalo Bot Access Token (Tùy chọn)</span>
              <span className="text-[11px] font-normal text-slate-400">Từ bot.zaloplatforms.com</span>
            </label>
            <input
              type="text"
              name="zalo_bot_token_field"
              autoComplete="off"
              spellCheck={false}
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="Dán chuỗi Bot Access Token từ bot.zaloplatforms.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between gap-2">
              <span>Mã Zalo Chat ID nhận tin</span>
              <button
                type="button"
                disabled={fetchingChatId || verifyingMode !== null}
                onClick={() => void handleFetchChatId()}
                className="text-[11px] font-semibold text-[#1E40FF] hover:underline cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {fetchingChatId ? 'Đang đọc getUpdates...' : 'Lấy Chat ID tự động'}
              </button>
            </label>
            <input
              type="text"
              name="zalo_chat_id_field"
              autoComplete="off"
              spellCheck={false}
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Bấm 'Lấy Chat ID tự động' hoặc nhập thủ công"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono focus:border-[#1E40FF] focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
          <button
            type="button"
            disabled={verifyingMode !== null}
            onClick={() => void runVerification('live')}
            className="btn-inkica-primary px-5 py-2.5 text-xs sm:text-sm cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            {verifyingMode === 'live' ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <Send className="w-4 h-4 shrink-0" />
            )}
            <span>Xác thực Zalo Bot Thật (Live API)</span>
          </button>

          <button
            type="button"
            disabled={verifyingMode !== null}
            onClick={() => void runVerification('sandbox')}
            className="ql-btn-outline px-5 py-2.5 text-xs sm:text-sm cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            {verifyingMode === 'sandbox' ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <span>Test thử luồng Bridge (Sandbox)</span>
          </button>
        </div>

        {verifyError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm text-rose-800 leading-relaxed">
            {verifyError}
          </div>
        )}

        {verifyResult && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Kết nối thành công: {verifyResult.bot_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white border border-emerald-200 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-700 whitespace-nowrap">
                  {verifyResult.latency_ms} ms
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 whitespace-nowrap">
                  {verifyResult.verification_mode === 'live_zalo_api' ? 'Zalo Live API' : 'Bridge Verified'}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-700 leading-relaxed">
              Chat ID đích: <code className="font-mono font-bold text-slate-900">{verifyResult.chat_id}</code> —{' '}
              {verifyResult.preview_message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
