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
import type { ZaloBotSavedState, ZaloVerifyResult } from './autodataTypes';

interface AutoDataZaloBotGuideProps {
  accessToken?: string;
  tenantSlug?: string;
  savedZaloBot?: ZaloBotSavedState | null;
  onVerified?: (saved: ZaloBotSavedState) => void;
  onFastSkip?: () => void;
  fastSkipLabel?: string;
  onOpenTour?: () => void;
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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 space-y-6 shadow-sm">
      {/* Header with explicit Optional badge + Fast Skip CTA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-bold text-amber-800 whitespace-nowrap">
              TÙY CHỌN • CÓ THỂ CÀI ĐẶT SAU
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-700 whitespace-nowrap">
              <Bot className="w-3.5 h-3.5 shrink-0" />
              <span>Zalo Bot A–Z &amp; Live Test</span>
            </span>
            <AutoDataHelpTrigger topic="zalobot_chatid" onOpenTour={onOpenTour} />
          </div>
          <h3 className={`${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-bold text-slate-950 leading-snug`}>
            Hướng dẫn kết nối Zalo Bot từ A–Z &amp; Kiểm tra kết nối trực tiếp
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Giúp từng nhân viên Sale nội bộ nhận thông báo Lead mới ngay trên điện thoại Zalo dưới 4 giây. Chưa có Bot? Bạn hoàn toàn có thể bỏ qua bước này để vào dùng hệ thống ngay.
          </p>
        </div>

        {onFastSkip && (
          <button
            type="button"
            onClick={onFastSkip}
            className="self-start lg:self-center inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>{fastSkipLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        )}
      </div>

      {/* 4-Step A-Z Visual Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-slate-900 text-white px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
              BƯỚC A • TẠO BOT
            </span>
            <a
              href="https://bot.zaloplatforms.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline whitespace-nowrap"
            >
              <span>Mở Zalo Bot</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-900">Lấy Bot Access Token</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Đăng nhập <strong>bot.zaloplatforms.com</strong> bằng Zalo, tạo Bot thông báo nội bộ và sao chép mã <strong>Bot Token</strong>.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-slate-900 text-white px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
              BƯỚC B • LẤY CHAT ID
            </span>
            <button
              type="button"
              onClick={() => void handleCopyChatIdCmd()}
              className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-800 hover:border-blue-400 cursor-pointer whitespace-nowrap"
            >
              {copiedCmd ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCmd ? 'Đã chép' : '/chatid'}</span>
            </button>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-900">Sale gõ lệnh /chatid</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nhân viên Sale mở Zalo tìm tên Bot, bấm <strong>Quan tâm</strong> và gửi tin nhắn <code className="font-mono font-bold text-blue-700">/chatid</code> để lấy mã nhận tin riêng.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2">
          <span className="inline-block rounded-full bg-slate-900 text-white px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
            BƯỚC C • DÁN THÔNG SỐ
          </span>
          <div className="text-xs sm:text-sm font-bold text-slate-900">Điền Token &amp; Chat ID</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Dán mã <strong>Bot Access Token</strong> và <strong>Chat ID</strong> của Sale hoặc Trưởng nhóm vào biểu mẫu xác thực bên dưới.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-2">
          <span className="inline-block rounded-full bg-blue-600 text-white px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
            BƯỚC D • LIVE VERIFY
          </span>
          <div className="text-xs sm:text-sm font-bold text-slate-900">Bấm Kiểm Tra Trực Tiếp</div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Hệ thống gọi trực tiếp qua <strong>/api/autodata</strong> để kiểm chứng Token và bắn tin xác nhận thật về Zalo tức thì!
          </p>
        </div>
      </div>

      {/* Live Connection Verification Test Inputs & Buttons */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between gap-2">
              <span>Zalo Bot Access Token (Tùy chọn)</span>
              <span className="text-[11px] font-normal text-slate-400">Từ bot.zaloplatforms.com</span>
            </label>
            <input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="VD: 1234567890:AAHxyz_ZaloBotSecretToken..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between gap-2">
              <span>Mã Zalo Chat ID nhận tin (/chatid)</span>
              <span className="text-[11px] font-normal text-slate-400">Cá nhân Sale hoặc Nhóm</span>
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="VD: 84912888678_chatid"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
          <button
            type="button"
            disabled={verifyingMode !== null}
            onClick={() => void runVerification('live')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
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
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 px-5 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
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
