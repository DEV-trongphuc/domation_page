import React, { useState, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Bot,
  MessageCircle,
  Send,
  Zap,
  ShieldCheck,
  Eye,
  EyeOff,
  QrCode,
  RefreshCw,
  Loader2,
  Activity,
  Clock,
  User,
  Users,
  Copy,
  ExternalLink,
  Lock,
  FileSpreadsheet,
  Mail,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from './ui/CustomModal';
import { BrandChannelLogo } from './ui/BrandChannelLogo';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchAPI } from '../utils/api';

export type BotChannelType = 'zalo' | 'telegram' | 'webhook' | 'email';

export interface UnifiedBotSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialChannel?: BotChannelType;
  onSuccess?: (channel: BotChannelType) => void;
}

interface ConsultantOption {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  zalo_chat_id: string | null;
  telegram_id: string | null;
  managers?: Array<{ id: number; name: string; email: string }>;
}

export const UnifiedBotSetupWizard: React.FC<UnifiedBotSetupWizardProps> = ({
  isOpen,
  onClose,
  initialChannel = 'zalo',
  onSuccess,
}) => {
  const { t } = useLanguage();
  const { token, tenantSlug, user, tenantSettings } = useAuth();
  const maxCoManagers = Math.max(0, Number(tenantSettings?.max_co_managers_per_consultant ?? 3));

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [channel, setChannel] = useState<BotChannelType>(initialChannel);

  // Step 2: Credentials & Vault
  const [botToken, setBotToken] = useState<string>('');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [isSavingVault, setIsSavingVault] = useState<boolean>(false);
  const [vaultSaved, setVaultSaved] = useState<boolean>(false);

  // Step 3: Chat ID Auto-Scan
  const [chatId, setChatId] = useState<string>('');
  const [senderLabel, setSenderLabel] = useState<string>('');
  const [isScanningUpdates, setIsScanningUpdates] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  // Step 4: Live Latency Test
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    httpStatus: number;
    previewMessage: string;
    verified: boolean;
    silentMode: boolean;
  } | null>(null);

  // Step 5: Rep & Co-Manager Assignment & Mode
  const [consultants, setConsultants] = useState<ConsultantOption[]>([]);
  const [loadingConsultants, setLoadingConsultants] = useState<boolean>(false);
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>('all');
  const [selectedCoManagers, setSelectedCoManagers] = useState<string[]>([]);
  const [isSilentMode, setIsSilentMode] = useState<boolean>(false);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);

  // Reset or initialize when modal opens or initialChannel changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setChannel(initialChannel);
      setBotToken('');
      setVaultSaved(false);
      setChatId('');
      setSenderLabel('');
      setScanMessage(null);
      setTestResult(null);
      setSelectedConsultantId('all');
      setSelectedCoManagers([]);
      setIsSilentMode(false);
      loadConsultants();
    }
  }, [isOpen, initialChannel]);

  const loadConsultants = async () => {
    setLoadingConsultants(true);
    try {
      const res = await fetchAPI('get_consultants');
      if (res && res.success && Array.isArray(res.data)) {
        setConsultants(res.data);
      }
    } catch {
      // Ignore consultant load error
    } finally {
      setLoadingConsultants(false);
    }
  };

  // Channel definitions for Step 1
  const CHANNELS: Array<{
    id: BotChannelType;
    title: string;
    badge: string;
    badgeColor: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
    recommendedFor: string;
  }> = [
    {
      id: 'zalo',
      title: 'Zalo OA Bot',
      badge: t('Khuyên dùng cho Sale VN'),
      badgeColor: '#0284c7',
      icon: <BrandChannelLogo brand="zalo" size={26} />,
      color: '#0284c7',
      bgColor: '#f0f9ff',
      borderColor: '#bae6fd',
      description: t('Bắn tin Lead mới trực tiếp về ứng dụng Zalo trên điện thoại cá nhân trong 1 giây. Dễ kích hoạt, hỗ trợ lệnh /chatid.'),
      recommendedFor: t('Nhân viên Sale, Đại lý phân phối F1'),
    },
    {
      id: 'telegram',
      title: 'Telegram Bot',
      badge: t('Tech Team & Group Chat'),
      badgeColor: '#2563eb',
      icon: <BrandChannelLogo brand="telegram" size={26} />,
      color: '#2563eb',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      description: t('Nhận thông báo nhóm Telegram, hỗ trợ phân quyền, mã hóa AES-256 Vault phần cứng và chế độ Silent / Live Test.'),
      recommendedFor: t('Nhóm kỹ thuật, Quản trị viên, Group chung'),
    },
    {
      id: 'webhook',
      title: 'Inbound Webhook API',
      badge: t('LadiPage & Web CRM'),
      badgeColor: '#7c3aed',
      icon: <BrandChannelLogo brand="webhook" size={26} />,
      color: '#7c3aed',
      bgColor: '#f5f3ff',
      borderColor: '#ddd6fe',
      description: t('Tiếp nhận dữ liệu thời gian thực từ Landing Page, Website WordPress, LadiPage với chữ ký bảo mật HMAC SHA-256.'),
      recommendedFor: t('Lập trình viên, Nhà phát triển Web, Lead Form'),
    },
    {
      id: 'email',
      title: 'Google Sheets & Email Relay',
      badge: t('Apps Script 0₫'),
      badgeColor: '#059669',
      icon: <BrandChannelLogo brand="sheets_email" size={24} />,
      color: '#059669',
      bgColor: '#ecfdf5',
      borderColor: '#a7f3d0',
      description: t('Đồng bộ 2 chiều dữ liệu bảng tính Google Sheets và gửi email cảnh báo SLA tự động qua Google Apps Script Web App 0₫.'),
      recommendedFor: t('Chiến dịch tiết kiệm chi phí, Lưu trữ backup'),
    },
  ];

  // Token Validation Logic (Step 2)
  const isTokenValid = (): boolean => {
    const trimmed = botToken.trim();
    if (channel === 'telegram') {
      // Telegram Bot Token regex format: e.g. 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
      return /^\d{8,12}:[A-Za-z0-9_-]{30,}$/.test(trimmed);
    }
    if (channel === 'zalo') {
      // Zalo Bot Token is minimum 10 non-space characters
      return /^\S{10,}$/.test(trimmed);
    }
    if (channel === 'email') {
      // Google Apps Script URL starts with https://
      return /^https:\/\/[a-z0-9.-]+/i.test(trimmed);
    }
    if (channel === 'webhook') {
      return trimmed.length >= 6;
    }
    return trimmed.length > 0;
  };

  const getTokenHint = (): string => {
    if (channel === 'telegram') {
      return t('Định dạng token từ @BotFather: 123456789:ABCdef... (tối thiểu 35 ký tự)');
    }
    if (channel === 'zalo') {
      return t('Dán Bot Secret Token từ bot.zaloplatforms.com (tối thiểu 10 ký tự)');
    }
    if (channel === 'email') {
      return t('Dán Web App URL Google Apps Script: https://script.google.com/macros/s/.../exec');
    }
    return t('Nhập HMAC Secret hoặc Webhook Key');
  };

  // Step 2: Save to Vault Action
  const handleSaveToVault = async () => {
    if (!isTokenValid()) {
      toast.error(t('Token chưa đúng định dạng. Vui lòng kiểm tra lại.'));
      return;
    }
    setIsSavingVault(true);
    try {
      if (channel === 'telegram') {
        const res = await fetch('/api/v1/integrations/telegram/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
          body: JSON.stringify({
            bot_token: botToken.trim(),
            chat_id: chatId.trim() || undefined,
            silent_mode: isSilentMode,
            enabled: true,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message || json.message || t('Không thể lưu Telegram Bot Token vào Vault.'));
        }
      } else if (channel === 'zalo') {
        const res = await fetch('/api/v1/integrations/vault/zalo_bot', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
          body: JSON.stringify({
            bot_token: botToken.trim(),
            chat_id: chatId.trim() || undefined,
            silent_mode: isSilentMode,
            enabled: true,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message || json.message || t('Không thể lưu Zalo Bot Token vào Vault AES-256.'));
        }
      } else if (channel === 'webhook') {
        const res = await fetch('/api/v1/integrations/webhooks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
          body: JSON.stringify({
            name: 'AutoData Webhook Ingress',
            webhook_type: botToken.trim().startsWith('http') ? 'outbound' : 'inbound',
            url: botToken.trim().startsWith('http') ? botToken.trim() : null,
            field_mappings: { secret_token: botToken.trim(), silent_mode: isSilentMode },
            is_active: true,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message || json.message || t('Không thể lưu cấu hình Webhook.'));
        }
      } else if (channel === 'email') {
        const res = await fetch('/api/v1/integrations/email/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
          body: JSON.stringify({
            email_provider: 'appscript',
            appscript_webhook_url: botToken.trim(),
            silent_mode: isSilentMode,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message || json.message || t('Không thể lưu Apps Script URL.'));
        }
      }
      setVaultSaved(true);
      if (channel === 'webhook') {
        toast.success(t('Đã lưu cấu hình Webhook thành công!'));
      } else {
        toast.success(t('Đã lưu mã bảo mật vào Vault AES-256-GCM an toàn!'));
      }
    } catch (err: any) {
      toast.error(err.message || t('Lỗi lưu Vault'));
    } finally {
      setIsSavingVault(false);
    }
  };

  // Step 3: Auto Scan Updates Action
  const handleScanUpdates = async () => {
    if (channel === 'zalo') {
      if (botToken.trim().length < 10) {
        toast.error(t('Vui lòng nhập Bot Token ở Bước 2 trước khi quét Chat ID.'));
        return;
      }
      setIsScanningUpdates(true);
      setScanMessage(null);
      try {
        const res = await fetch('/api/v1/integrations/zalo/updates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
          body: JSON.stringify({ bot_token: botToken.trim() }),
        });
        const json = (await res.json().catch(() => ({}))) as any;
        if (!res.ok || json.success === false || !json.data?.chat_id) {
          throw new Error(
            json.error?.message ||
              t('Chưa tìm thấy tin nhắn gửi tới Bot. Hãy mở Zalo, nhắn một tin bất kỳ cho Bot rồi bấm quét lại.')
          );
        }
        setChatId(json.data.chat_id);
        setSenderLabel(json.data.sender_label || 'Zalo User');
        setScanMessage(t(`Đã tìm thấy Chat ID từ "${json.data.sender_label || 'Zalo'}"!`));
        toast.success(t('Tự động nhận diện Chat ID thành công!'));
      } catch (err: any) {
        setScanMessage(err.message);
        toast.error(err.message);
      } finally {
        setIsScanningUpdates(false);
      }
    } else if (channel === 'telegram') {
      if (!chatId.trim()) {
        const promptMsg = t(
          'Chưa phát hiện Chat ID Telegram. Vui lòng mở Telegram, thêm Bot vào nhóm và gửi lệnh /chatid, sau đó nhập Chat ID vào ô bên dưới hoặc bấm quét lại.'
        );
        setScanMessage(promptMsg);
        toast.error(t('Vui lòng gửi lệnh /chatid tới Bot hoặc nhập Chat ID trước khi quét.'));
        return;
      }
      setIsScanningUpdates(true);
      setScanMessage(null);
      try {
        const res = await fetch('/api/v1/integrations/telegram/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
          body: JSON.stringify({
            test_type: 'webhook_command',
            command_text: '/chatid',
            chat_id: chatId.trim(),
          }),
        });
        const json = (await res.json().catch(() => ({}))) as any;
        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message || t('Chưa thể quét lệnh từ Telegram Bot.'));
        }
        setSenderLabel('Telegram Chat');
        setScanMessage(t(`Đã xác thực lệnh /chatid thành công cho Chat ID "${chatId.trim()}"!`));
        toast.success(t('Đã quét tín hiệu Telegram thành công!'));
      } catch (err: any) {
        setScanMessage(err.message);
        toast.error(err.message);
      } finally {
        setIsScanningUpdates(false);
      }
    } else {
      // Webhook / Email default
      setChatId('inbound_channel_ready');
      setScanMessage(t('Kênh đã sẵn sàng tiếp nhận!'));
    }
  };

  const handleCopyCmd = async () => {
    try {
      await navigator.clipboard.writeText('/chatid');
      setCopiedCmd(true);
      toast.success(t('Đã sao chép lệnh /chatid'));
      setTimeout(() => setCopiedCmd(false), 2000);
    } catch {
      // ignore
    }
  };

  // Step 4: Live Latency Test Action
  const handleRunLatencyTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const start = performance.now();

    try {
      if (channel === 'zalo') {
        if (!botToken.trim()) {
          toast.error(t('Vui lòng nhập Bot Token ở Bước 2 trước khi kiểm tra kết nối.'));
          setIsTesting(false);
          return;
        }
        if (!chatId.trim()) {
          toast.error(t('Vui lòng nhập hoặc quét Chat ID ở Bước 3 trước khi kiểm tra kết nối.'));
          setIsTesting(false);
          return;
        }
        const res = await fetch('/api/v1/integrations/zalo/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
          body: JSON.stringify({
            verify_mode: isSilentMode ? 'sandbox' : 'live',
            bot_token: botToken.trim(),
            chat_id: chatId.trim(),
            send_test_message: true,
          }),
        });
        const elapsed = Math.round(performance.now() - start);
        const json = (await res.json().catch(() => ({}))) as any;

        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message || t('Lỗi kiểm tra kết nối Zalo Bot.'));
        }

        setTestResult({
          success: true,
          latencyMs: json.data?.latency_ms || elapsed,
          httpStatus: res.status,
          previewMessage:
            json.data?.preview_message ||
            t(`✅ [DOMATION AutoData] Kết nối Zalo Bot thành công tới Chat ID ${chatId}!`),
          verified: Boolean(json.data?.verified),
          silentMode: isSilentMode,
        });
        toast.success(t(`Kết nối thành công! Độ trễ: ${json.data?.latency_ms || elapsed}ms`));
      } else if (channel === 'telegram') {
        if (!botToken.trim()) {
          toast.error(t('Vui lòng nhập Telegram Bot Token ở Bước 2 trước khi kiểm tra kết nối.'));
          setIsTesting(false);
          return;
        }
        if (!chatId.trim()) {
          toast.error(t('Vui lòng nhập hoặc quét Chat ID ở Bước 3 trước khi kiểm tra kết nối.'));
          setIsTesting(false);
          return;
        }
        const res = await fetch('/api/v1/integrations/telegram/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
          body: JSON.stringify({
            test_type: isSilentMode ? 'silent_dry_run' : 'webhook_command',
            command_text: '/chatid',
            chat_id: chatId.trim(),
          }),
        });
        const elapsed = Math.round(performance.now() - start);
        const json = (await res.json().catch(() => ({}))) as any;

        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message || t('Lỗi kiểm tra kết nối Telegram Bot.'));
        }

        setTestResult({
          success: true,
          latencyMs: elapsed,
          httpStatus: res.status,
          previewMessage:
            json.data?.replyText ||
            t(`✅ [DOMATION AutoData] Telegram Bot đã phản hồi thành công tới Chat ID ${chatId}!`),
          verified: true,
          silentMode: Boolean(json.data?.silent),
        });
        toast.success(t(`Kiểm thử Telegram hoàn tất! Độ trễ: ${elapsed}ms`));
      } else if (channel === 'email') {
        if (!botToken.trim()) {
          toast.error(t('Vui lòng nhập Apps Script Web App URL ở Bước 2 trước khi kiểm tra.'));
          setIsTesting(false);
          return;
        }
        const res = await fetch('/api/v1/integrations/email/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
          body: JSON.stringify({
            appscript_webhook_url: botToken.trim(),
            to_email: user?.email || 'admin@domation.net',
            save_config: true,
            type: 'system',
          }),
        });
        const elapsed = Math.round(performance.now() - start);
        const json = (await res.json().catch(() => ({}))) as any;

        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message || t('Lỗi gửi email kiểm thử qua Apps Script.'));
        }

        setTestResult({
          success: true,
          latencyMs: elapsed,
          httpStatus: res.status,
          previewMessage: t('Đã gửi email thử nghiệm thành công qua Google Apps Script Web App!'),
          verified: true,
          silentMode: isSilentMode,
        });
        toast.success(t(`Kiểm thử Email thành công! Độ trễ: ${elapsed}ms`));
      } else {
        // Webhook test: genuine check of integration overview and receiver readiness
        const res = await fetch('/api/v1/integrations/overview', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
        });
        const elapsed = Math.round(performance.now() - start);
        const json = (await res.json().catch(() => ({}))) as any;

        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message || t('Lỗi kiểm tra trạng thái máy chủ Webhook.'));
        }

        setTestResult({
          success: true,
          latencyMs: elapsed,
          httpStatus: res.status,
          previewMessage: t('Máy chủ Inbound Webhook sẵn sàng tiếp nhận payload lead thời gian thực (HMAC SHA-256).'),
          verified: true,
          silentMode: isSilentMode,
        });
        toast.success(t(`Kiểm tra Webhook thành công! Độ trễ: ${elapsed}ms`));
      }
    } catch (err: any) {
      toast.error(err.message || t('Kiểm thử kết nối thất bại'));
      setTestResult({
        success: false,
        latencyMs: Math.round(performance.now() - start),
        httpStatus: 500,
        previewMessage: err.message || t('Lỗi kết nối tới Bot Platform.'),
        verified: false,
        silentMode: isSilentMode,
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Step 5: Finalize and Save
  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      // 1. Channel & Token Vault Persistence
      if (channel === 'telegram') {
        const res = await fetch('/api/v1/integrations/telegram/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
          body: JSON.stringify({
            bot_token: botToken.trim(),
            chat_id: chatId.trim(),
            silent_mode: isSilentMode,
            enabled: true,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message || json.message || t('Không thể lưu cấu hình Telegram Bot.'));
        }
      } else if (channel === 'zalo') {
        const res = await fetch('/api/v1/integrations/vault/zalo_bot', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
          body: JSON.stringify({
            bot_token: botToken.trim(),
            chat_id: chatId.trim() || undefined,
            silent_mode: isSilentMode,
            enabled: true,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message || json.message || t('Không thể lưu Zalo Bot Token vào Vault AES-256.'));
        }
      } else if (channel === 'webhook') {
        const res = await fetch('/api/v1/integrations/webhooks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
          body: JSON.stringify({
            name: 'AutoData Webhook Ingress',
            webhook_type: botToken.trim().startsWith('http') ? 'outbound' : 'inbound',
            url: botToken.trim().startsWith('http') ? botToken.trim() : null,
            field_mappings: { secret_token: botToken.trim(), silent_mode: isSilentMode },
            is_active: true,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message || json.message || t('Không thể lưu cấu hình Webhook.'));
        }
      } else if (channel === 'email') {
        const res = await fetch('/api/v1/integrations/email/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
          },
          body: JSON.stringify({
            email_provider: 'appscript',
            appscript_webhook_url: botToken.trim(),
            silent_mode: isSilentMode,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) {
          throw new Error(json.error?.message || json.message || t('Không thể lưu cấu hình Email.'));
        }
      }

      // 2. If a specific consultant is selected, bind chat_id to that consultant
      if (selectedConsultantId !== 'all') {
        const cId = Number(selectedConsultantId);
        const target = consultants.find((c) => c.id === cId);
        if (target) {
          await fetchAPI('edit_consultant', {
            method: 'POST',
            body: JSON.stringify({
              id: cId,
              name: target.name,
              email: target.email,
              status: target.status,
              zalo_chat_id: channel === 'zalo' ? chatId.trim() : target.zalo_chat_id,
              telegram_id: channel === 'telegram' ? chatId.trim() : target.telegram_id,
            }),
          });
        }
      }

      // 3. Persist selected Co-Managers to the backend
      if (selectedConsultantId !== 'all' && selectedCoManagers.length > 0) {
        const cId = Number(selectedConsultantId);
        const target = consultants.find((c) => c.id === cId);
        const existingMgrEmails = new Set(
          (target?.managers || []).map((m) => m.email?.toLowerCase()).filter(Boolean)
        );

        for (const coId of selectedCoManagers) {
          const coConsultant = consultants.find((c) => String(c.id) === String(coId));
          if (coConsultant && !existingMgrEmails.has(coConsultant.email?.toLowerCase())) {
            try {
              await fetchAPI('add_consultant_manager', {
                method: 'POST',
                body: JSON.stringify({
                  consultant_id: selectedConsultantId,
                  name: coConsultant.name,
                  email: coConsultant.email,
                  phone: coConsultant.phone || null,
                  zalo_chat_id: channel === 'zalo' ? (chatId.trim() || coConsultant.zalo_chat_id) : coConsultant.zalo_chat_id,
                }),
              });
            } catch (err: any) {
              console.warn('Failed to add consultant manager:', err?.message || err);
            }
          }
        }
      }

      toast.success(
        t('Cấu hình Kênh & Bot hoàn tất thành công!') +
          (isSilentMode ? t(' (Chế độ Silent Mode đang bật)') : t(' (Chế độ Live Mode sẵn sàng nhận số)'))
      );

      if (onSuccess) {
        onSuccess(channel);
      }
      onClose();
    } catch (err: any) {
      toast.error(t('Lỗi khi hoàn tất cấu hình: ') + err.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  // Step Labels
  const STEP_LABELS = [
    { num: 1, title: t('Chọn Kênh'), desc: t('Nền tảng tiếp nhận') },
    { num: 2, title: t('Token & Vault'), desc: t('Bảo mật AES-256') },
    { num: 3, title: t('Quét Chat ID'), desc: t('/chatid hoặc QR') },
    { num: 4, title: t('Đo Độ Trễ'), desc: t('Live Latency Test') },
    { num: 5, title: t('Gán Nhân Sự'), desc: t('Phân bổ & Kích hoạt') },
  ];

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('Cấu hình Kênh Thông Báo & Bot Tự Động (Wizard 5 Bước)')}
      width="min(860px, 96vw)"
    >
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Step Indicator Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.5rem',
            background: 'var(--color-bg)',
            padding: '1rem',
            borderRadius: 14,
            border: '1px solid var(--color-border)',
          }}
        >
          {STEP_LABELS.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                onClick={() => {
                  // Only allow jumping back to earlier steps or to completed ones
                  if (s.num <= currentStep) setCurrentStep(s.num);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  cursor: s.num <= currentStep ? 'pointer' : 'default',
                  opacity: s.num > currentStep ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    background: isCompleted
                      ? '#10b981'
                      : isCurrent
                      ? 'var(--color-primary)'
                      : 'var(--color-surface)',
                    color: isCompleted || isCurrent ? '#fff' : 'var(--color-text-muted)',
                    border: isCompleted || isCurrent ? 'none' : '1px solid var(--color-border)',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(30, 64, 255, 0.15)' : 'none',
                  }}
                >
                  {isCompleted ? <Check size={16} /> : s.num}
                </div>
                <div style={{ overflow: 'hidden', minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: isCurrent ? 700 : 600,
                      color: isCurrent ? 'var(--color-primary)' : 'var(--color-text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {s.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* STEP 1: Select Channel */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {t('Bước 1: Chọn Kênh Tiếp Nhận & Gửi Thông Báo')}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                {t('Chọn nền tảng bạn muốn cấu hình để tự động bắn số hoặc tiếp nhận data từ chiến dịch marketing.')}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {CHANNELS.map((c) => {
                const isSelected = channel === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setChannel(c.id)}
                    style={{
                      padding: '1.125rem',
                      borderRadius: 14,
                      background: isSelected ? c.bgColor : 'var(--color-surface)',
                      border: `2px solid ${isSelected ? c.color : 'var(--color-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: isSelected ? '#fff' : c.bgColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${c.borderColor}`,
                        }}
                      >
                        {c.icon}
                      </div>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 20,
                          background: isSelected ? c.color : 'var(--color-bg)',
                          color: isSelected ? '#fff' : c.badgeColor,
                          border: isSelected ? 'none' : `1px solid ${c.borderColor}`,
                        }}
                      >
                        {c.badge}
                      </span>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)' }}>
                        {c.title}
                      </h4>
                      <p style={{ fontSize: '0.78125rem', color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                        {c.description}
                      </p>
                    </div>

                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--color-border)',
                        fontSize: '0.6875rem',
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        <strong>{t('Thích hợp:')}</strong> {c.recommendedFor}
                      </span>
                      {isSelected && <CheckCircle2 size={16} color={c.color} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Credentials & Token Vault */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  {t('Bước 2: Cấp Token & Lưu Vào Vault Mã Hóa AES-256')}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {t('Nhập mã khóa bí mật (Secret Key) để hệ thống kết nối an toàn với máy chủ Bot.')}
                </p>
              </div>

              {/* Direct Link to Bot Creation */}
              {channel === 'telegram' && (
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn outline sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                >
                  <ExternalLink size={14} /> {t('Mở @BotFather')}
                </a>
              )}
              {channel === 'zalo' && (
                <a
                  href="https://bot.zaloplatforms.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn outline sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                >
                  <ExternalLink size={14} /> {t('Mở Zalo Platform')}
                </a>
              )}
            </div>

            {/* Instruction Tip */}
            <div
              style={{
                background: 'var(--color-bg)',
                padding: '0.875rem 1rem',
                borderRadius: 12,
                border: '1px solid var(--color-border)',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
              }}
            >
              <Lock size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
                <strong>{t('Bảo mật Hardware-Grade:')}</strong>{' '}
                {t(
                  'Mọi token tích hợp được tự động mã hóa bằng thuật toán AES-256-GCM với khóa riêng biệt của từng Workspace trước khi ghi vào cơ sở dữ liệu. Ngay cả kỹ thuật viên hệ thống cũng không thể đọc được token thô.'
                )}
              </div>
            </div>

            {/* Token Input Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {channel === 'telegram'
                  ? t('Telegram Bot Token (từ @BotFather)')
                  : channel === 'zalo'
                  ? t('Zalo Bot Access Token (Secret Key)')
                  : channel === 'email'
                  ? t('Google Apps Script Web App URL')
                  : t('Webhook Token / Secret')}
                <span style={{ color: 'var(--color-danger)' }}> *</span>
              </label>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type={showToken ? 'text' : 'password'}
                    className="form-input"
                    value={botToken}
                    onChange={(e) => {
                      setBotToken(e.target.value);
                      setVaultSaved(false);
                    }}
                    placeholder={
                      channel === 'telegram'
                        ? '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ...'
                        : channel === 'zalo'
                        ? 'dán token từ bot.zaloplatforms.com...'
                        : channel === 'email'
                        ? 'https://script.google.com/macros/s/.../exec'
                        : 'nhập webhook secret...'
                    }
                    style={{
                      width: '100%',
                      paddingRight: 40,
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                    }}
                    title={showToken ? t('Ẩn mật khẩu') : t('Hiện mật khẩu')}
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="button"
                  className="btn outline"
                  onClick={handleSaveToVault}
                  disabled={!isTokenValid() || isSavingVault || vaultSaved}
                  style={{
                    whiteSpace: 'nowrap',
                    borderColor: vaultSaved ? '#10b981' : undefined,
                    color: vaultSaved ? '#10b981' : undefined,
                  }}
                >
                  {isSavingVault ? (
                    <>
                      <Loader2 size={15} className="spin" /> {t('Đang lưu...')}
                    </>
                  ) : vaultSaved ? (
                    <>
                      <ShieldCheck size={16} /> {t('Đã lưu Vault')}
                    </>
                  ) : (
                    <>
                      <Lock size={15} /> {t('Lưu vào Vault')}
                    </>
                  )}
                </button>
              </div>

              {/* Real-time regex validation pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 4 }}>
                {botToken.trim().length > 0 && (
                  isTokenValid() ? (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={13} /> {t('Token hợp lệ')}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={13} /> {getTokenHint()}
                    </span>
                  )
                )}
                {botToken.trim().length === 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {getTokenHint()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Auto Chat ID Scan */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {t('Bước 3: Mở Luồng Nhận Tin & Tự Động Quét Chat ID')}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                {t('Thực hiện 2 bước đơn giản để Bot nhận diện được cuộc trò chuyện cá nhân hoặc nhóm của bạn.')}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {/* QR & Deep link Column */}
              <div
                style={{
                  background: 'var(--color-bg)',
                  padding: '1.25rem',
                  borderRadius: 14,
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: 130,
                    height: 130,
                    background: '#fff',
                    borderRadius: 12,
                    padding: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <svg width="114" height="114" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="120" rx="8" fill="white" />
                    <rect x="10" y="10" width="35" height="35" rx="4" fill="#0F172A" />
                    <rect x="15" y="15" width="25" height="25" rx="2" fill="white" />
                    <rect x="20" y="20" width="15" height="15" rx="1" fill="#1E40FF" />
                    <rect x="75" y="10" width="35" height="35" rx="4" fill="#0F172A" />
                    <rect x="80" y="15" width="25" height="25" rx="2" fill="white" />
                    <rect x="85" y="20" width="15" height="15" rx="1" fill="#1E40FF" />
                    <rect x="10" y="75" width="35" height="35" rx="4" fill="#0F172A" />
                    <rect x="15" y="80" width="25" height="25" rx="2" fill="white" />
                    <rect x="20" y="85" width="15" height="15" rx="1" fill="#1E40FF" />
                    <rect x="52" y="12" width="16" height="6" rx="1" fill="#0F172A" />
                    <rect x="52" y="22" width="16" height="6" rx="1" fill="#0F172A" />
                    <rect x="12" y="52" width="6" height="16" rx="1" fill="#0F172A" />
                    <rect x="22" y="52" width="6" height="16" rx="1" fill="#0F172A" />
                    <rect x="50" y="50" width="20" height="20" rx="3" fill="#1E40FF" />
                    <rect x="75" y="52" width="35" height="6" rx="1" fill="#0F172A" />
                    <rect x="85" y="62" width="25" height="6" rx="1" fill="#0F172A" />
                    <rect x="52" y="75" width="16" height="6" rx="1" fill="#0F172A" />
                    <rect x="52" y="85" width="16" height="6" rx="1" fill="#0F172A" />
                    <rect x="75" y="75" width="16" height="35" rx="1" fill="#0F172A" />
                    <rect x="95" y="75" width="15" height="35" rx="1" fill="#0F172A" />
                  </svg>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)' }}>
                  {t('Quét QR mở Bot trên điện thoại')}
                </div>
              </div>

              {/* Instructions & Commands Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text)', lineHeight: 1.4 }}>
                      {channel === 'telegram'
                        ? t('Mở Bot trên Telegram, bấm START hoặc thêm Bot vào nhóm nhận tin.')
                        : t('Mở Zalo, tìm Bot vừa tạo và gửi 1 tin nhắn bất kỳ cho Bot.')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text)', lineHeight: 1.4 }}>
                      {t('Gõ lệnh')} <code style={{ background: 'var(--color-bg)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>/chatid</code>{' '}
                      {t('trong khung chat hoặc bấm nút sao chép bên dưới.')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn outline sm"
                    onClick={handleCopyCmd}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {copiedCmd ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    {copiedCmd ? t('Đã copy!') : t('Copy lệnh /chatid')}
                  </button>

                  <button
                    type="button"
                    className="btn primary sm"
                    onClick={handleScanUpdates}
                    disabled={isScanningUpdates}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-primary)' }}
                  >
                    {isScanningUpdates ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
                    {isScanningUpdates ? t('Đang quét tin...') : t('Tự động quét Chat ID mới nhất')}
                  </button>
                </div>
              </div>
            </div>

            {/* Chat ID Input Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {t('Chat ID / Group ID đã nhận diện')}
                <span style={{ color: 'var(--color-danger)' }}> *</span>
              </label>

              <input
                type="text"
                className="form-input"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder={t('e.g. 123456789 hoặc -100987654321')}
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                }}
              />

              {scanMessage && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: chatId ? '#10b981' : 'var(--color-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {chatId ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                  {scanMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Live Latency Test */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {t('Bước 4: Kiểm Tra Kết Nối Thời Gian Thực & Đo Độ Trễ (Health Check)')}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                {t('Hệ thống sẽ gửi một tin nhắn thử nghiệm tới Chat ID để đo thời gian phản hồi thực tế (SLA < 4.0s).')}
              </p>
            </div>

            {/* Summary target pill */}
            <div
              style={{
                background: 'var(--color-bg)',
                padding: '0.875rem 1rem',
                borderRadius: 12,
                border: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t('Kênh:')} </span>
                <strong style={{ fontSize: '0.8125rem', color: 'var(--color-text)' }}>{channel.toUpperCase()}</strong>
                <span style={{ margin: '0 8px', color: 'var(--color-border)' }}>•</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t('Đích đến:')} </span>
                <code style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                  {chatId || t('Mặc định')}
                </code>
              </div>

              <button
                type="button"
                className="btn primary"
                onClick={handleRunLatencyTest}
                disabled={isTesting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 38,
                  padding: '0 1rem',
                  background: 'var(--color-primary)',
                }}
              >
                {isTesting ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                {isTesting ? t('Đang phát tín hiệu test...') : t('Gửi Tin Nhắn Thử Nghiệm')}
              </button>
            </div>

            {/* Test Results Dashboard */}
            {testResult && (
              <div
                style={{
                  background: testResult.success ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: 14,
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    {testResult.success ? (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#10b981',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={18} />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--color-danger)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AlertCircle size={18} />
                      </div>
                    )}
                    <div>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: testResult.success ? '#15803d' : '#b91c1c' }}>
                        {testResult.success
                          ? t('Kết nối thành công — Máy chủ phản hồi chính xác!')
                          : t('Kiểm tra thất bại — Vui lòng xem chi tiết lỗi')}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: testResult.success ? '#166534' : '#991b1b', marginTop: 2 }}>
                        {testResult.success
                          ? t('Kênh đã được xác thực, sẵn sàng truyền tải Lead trong môi trường thực tế.')
                          : t('Không nhận được tín hiệu phản hồi từ Chat ID hoặc Token đã bị thu hồi.')}
                      </p>
                    </div>
                  </div>

                  {/* Real-time Latency & HTTP 200 Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: '#fff',
                        border: '1px solid #bbf7d0',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: testResult.latencyMs < 4000 ? '#15803d' : '#eab308',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Activity size={14} />
                      ⚡ {testResult.latencyMs} ms ({testResult.latencyMs < 4000 ? t('SLA Đạt chuẩn <4.0s') : t('Độ trễ cao')})
                    </span>

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: '#fff',
                        border: '1px solid #bbf7d0',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#15803d',
                      }}
                    >
                      HTTP {testResult.httpStatus} OK
                    </span>
                  </div>
                </div>

                {/* Simulated Chat Message Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                    {t('Tin nhắn xem trước trên Bot:')}
                  </span>
                  <div
                    style={{
                      background: '#fff',
                      padding: '0.75rem 1rem',
                      borderRadius: 10,
                      border: '1px solid #bbf7d0',
                      fontSize: '0.8125rem',
                      color: '#0f172a',
                      fontFamily: 'sans-serif',
                      lineHeight: 1.5,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {testResult.previewMessage}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Rep & Co-Manager Assignment & Finalize */}
        {currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {t('Bước 5: Phân Bổ Nhân Sự, Chế Độ Vận Hành & Hoàn Tất')}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                {t('Chỉ định Sale hoặc Đại lý phụ trách nhận thông báo từ kênh này và chọn chế độ chạy (Silent vs Live).')}
              </p>
            </div>

            {/* Rep Assignment Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {t('Gán thông báo cho Nhân sự / Đại lý')}
              </label>

              <select
                className="form-input"
                value={selectedConsultantId}
                onChange={(e) => setSelectedConsultantId(e.target.value)}
                style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}
              >
                <option value="all">{t('Thông báo chung toàn hệ thống (Admin & Kênh Broadcast)')}</option>
                {consultants.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name} ({c.email}) {c.zalo_chat_id ? `• Zalo: ${c.zalo_chat_id}` : ''}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {t('Khi có Lead mới được phân bổ cho nhân sự này, Bot sẽ tự động bắn tin trực tiếp tới họ.')}
              </span>
            </div>

            {/* Co-Managers Selection (Up to 3) */}
            {selectedConsultantId !== 'all' && (
              <div
                style={{
                  background: 'var(--color-bg)',
                  padding: '1rem',
                  borderRadius: 12,
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--color-text)' }}>
                    {t('Đồng quản lý (Co-Managers) nhận tin song song')}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {maxCoManagers === 0 ? t('Đã tắt đồng quản lý') : `${t('Tối đa')} ${maxCoManagers} ${t('người')}`}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {consultants
                    .filter((c) => String(c.id) !== selectedConsultantId)
                    .slice(0, 6)
                    .map((c) => {
                      const isChecked = selectedCoManagers.includes(String(c.id));
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedCoManagers(selectedCoManagers.filter((id) => id !== String(c.id)));
                            } else {
                              if (selectedCoManagers.length >= maxCoManagers) {
                                toast.error(`${t('Chỉ được chọn tối đa')} ${maxCoManagers} ${t('Đồng quản lý.')}`);
                                return;
                              }
                              setSelectedCoManagers([...selectedCoManagers, String(c.id)]);
                            }
                          }}
                          className={`btn ${isChecked ? 'primary' : 'outline'} sm`}
                          style={{ fontSize: '0.75rem', height: 32 }}
                        >
                          {isChecked ? <Check size={12} /> : <Users size={12} />}
                          {c.name}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Silent Mode vs Live Mode Toggle */}
            <div
              style={{
                background: isSilentMode ? '#fefce8' : 'var(--color-bg)',
                border: `1px solid ${isSilentMode ? '#fef08a' : 'var(--color-border)'}`,
                padding: '1rem',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.875rem' }}>
                  {isSilentMode ? t('Chế độ Thử nghiệm (Silent Mode)') : t('Chế độ Thực chiến (Live Mode)')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {isSilentMode
                    ? t('Chỉ kiểm tra logic nội bộ, không gửi tin nhắn thật ra thiết bị để tránh làm phiền.')
                    : t('Kích hoạt gửi thông báo Lead mới tức thì (<1 giây) tới điện thoại và ứng dụng của Sale.')}
                </div>
              </div>

              <ToggleSwitch
                checked={!isSilentMode}
                onChange={(val) => setIsSilentMode(!val)}
              />
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {currentStep > 1 ? (
            <button
              type="button"
              className="btn outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={16} /> {t('Quay lại')}
            </button>
          ) : (
            <button type="button" className="btn outline" onClick={onClose}>
              {t('Đóng')}
            </button>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {currentStep < 5 ? (
              <button
                type="button"
                className="btn primary"
                disabled={currentStep === 2 && !isTokenValid()}
                onClick={() => setCurrentStep(currentStep + 1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--color-primary)',
                  padding: '0 1.25rem',
                  height: 40,
                }}
              >
                {t('Tiếp tục')} <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="btn primary"
                disabled={isFinalizing}
                onClick={handleFinalize}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#10b981',
                  color: '#fff',
                  padding: '0 1.5rem',
                  height: 40,
                  fontWeight: 700,
                  border: 'none',
                }}
              >
                {isFinalizing ? (
                  <>
                    <Loader2 size={16} className="spin" /> {t('Đang lưu...')}
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> {t('Lưu Cấu Hình & Hoàn Tất')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </CustomModal>
  );
};
