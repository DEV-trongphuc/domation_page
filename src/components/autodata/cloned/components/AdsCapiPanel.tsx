import React, { useState, useEffect, useMemo } from 'react';
import {
  Send, CheckCircle2, AlertTriangle, RefreshCw,
  Settings2, Database, RotateCcw, Eye, ShieldAlert,
  Plus, Search, ChevronLeft, ChevronRight, Check,
  Play, ShieldCheck, Sliders, Upload, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAPI } from '../utils/api';
import { apiRequest, getErrorMessage } from '../../autodataApi';
import { useAuth } from '../contexts/AuthContext';
import { CustomSelect } from './ui/CustomSelect';
import { CustomModal } from './ui/CustomModal';
import { Avatar } from './ui/Avatar';
import { Skeleton, KpiCardSkeleton } from './ui/Skeleton';
import { ScreenHelpButton } from './ui/ScreenHelpButton';

interface CapiCustomEvent {
  name: string;
  label: string;
  description?: string;
  category?: string;
}

interface CapiLogItem {
  id: number;
  lead_id: number;
  dataset_id: string;
  event_name: string;
  event_id: string;
  action_source: string;
  trigger_source: string;
  quality_status: string;
  match_keys: string;
  sent_payload: string;
  response_status: number;
  response_body: string;
  is_test: number;
  sent_at: string;
  lead_name?: string;
  lead_phone?: string;
  lead_ad_name?: string;
  lead_campaign_name?: string;
  lead_meta_id?: string;
}

interface AvailablePixel {
  id: string;
  name: string;
  last_fired_time?: string;
  is_crm?: boolean;
  owner_business?: { id?: string; name?: string };
}

interface AdsCapiPanelProps {
  dateFilter: string;
  onSyncCompleted?: () => void;
}

const PIPELINE_CAPI_STAGES: Array<{
  key: string;
  label: string;
  group: 'positive' | 'neutral' | 'negative';
  recommended: string;
  hint: string;
}> = [
  {
    key: 'Qualified',
    label: 'Thiện chí (Qualified)',
    group: 'positive',
    recommended: 'Lead',
    hint: 'Mốc quan trọng nhất để Meta học sớm đúng khách có nhu cầu BĐS'
  },
  {
    key: 'Booked',
    label: 'Hẹn gặp (Booked)',
    group: 'positive',
    recommended: 'Schedule',
    hint: 'Khách đồng ý gặp tư vấn / xem dự án trực tiếp'
  },
  {
    key: 'Booking',
    label: 'Booking / Giữ chỗ',
    group: 'positive',
    recommended: 'InitiateCheckout',
    hint: 'Khách đã vào tiền giữ chỗ thiện chí'
  },
  {
    key: 'Deposited',
    label: 'Đặt cọc (Deposited)',
    group: 'positive',
    recommended: 'AddPaymentInfo',
    hint: 'Khách đã xuống tiền đặt cọc sản phẩm'
  },
  {
    key: 'Closed',
    label: 'Đã chốt (Closed)',
    group: 'positive',
    recommended: 'Purchase',
    hint: 'Giao dịch thành công, gửi kèm giá trị VND'
  },
  {
    key: 'Badtiming',
    label: 'Hẹn gọi lại (Badtiming)',
    group: 'neutral',
    recommended: 'Skip',
    hint: 'Mặc định bỏ qua để giữ phễu Qualified+ tinh khiết'
  },
  {
    key: 'NoAnswer',
    label: 'KNM / Thuê bao (NoAnswer)',
    group: 'neutral',
    recommended: 'Skip',
    hint: 'Chưa liên lạc được, không nên gửi dương hay loại trừ sớm'
  },
  {
    key: 'Notlead',
    label: 'Sai đối tượng (Notlead)',
    group: 'negative',
    recommended: 'DisqualifiedLead',
    hint: 'Sale đánh dấu sai tệp / không nhu cầu để Meta loại trừ tệp rác'
  },
  {
    key: 'Spam',
    label: 'Spam / Ticket Lỗi / Gatekeeper',
    group: 'negative',
    recommended: 'DisqualifiedLead',
    hint: 'Số ảo, duyệt ticket lỗi hoặc bị Gatekeeper chặn blacklist'
  }
];

const DEFAULT_PRESET_TRIGGERS: Record<string, string> = {
  Qualified: 'Lead',
  Booked: 'Schedule',
  Booking: 'InitiateCheckout',
  Deposited: 'AddPaymentInfo',
  Closed: 'Purchase',
  Badtiming: 'Skip',
  NoAnswer: 'Skip',
  Notlead: 'DisqualifiedLead',
  Spam: 'DisqualifiedLead'
};

const TRIGGER_SOURCE_LABELS: Record<string, string> = {
  sale_portal: 'SalePortal',
  admin_quality: 'Admin ĐG',
  ticket_approved: 'Duyệt Ticket',
  gatekeeper_spam: 'Gatekeeper',
  gatekeeper_blacklist: 'Blacklist AI',
  backfill_sale_feedback: 'SalePortal',
  backfill_ticket: 'Duyệt Ticket',
  backfill_gatekeeper: 'Gatekeeper AI',
  manual_backfill: 'Đồng bộ thủ công',
  backfill: 'Đồng bộ dữ liệu'
};

const LOG_PAGE_SIZE = 12;

const buildCapiPageNumbers = (current: number, total: number): Array<number | 'ellipsis'> => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: Array<number | 'ellipsis'> = [1];
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
};

export const AdsCapiPanel: React.FC<AdsCapiPanelProps> = ({ onSyncCompleted }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [syncingCapi, setSyncingCapi] = useState<boolean>(false);
  const [syncingIds, setSyncingIds] = useState<boolean>(false);
  const [retryingLogId, setRetryingLogId] = useState<number | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);

  const { tenantSettings, token, tenantSlug } = useAuth();
  const defaultClosedDealVnd = Number(tenantSettings?.default_closed_deal_value_vnd || 50000000);

  // +5 Wave A CAPI Growth Modules State
  const [capiSubTab, setCapiSubTab] = useState<'logs' | 'backfill_audiences' | 'adsets_phone_farm'>('logs');
  const [bfFromDate, setBfFromDate] = useState(() => {
    const d = new Date(Date.now() - 7 * 86400_000);
    return d.toISOString().slice(0, 10);
  });
  const [bfToDate, setBfToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bfPreview, setBfPreview] = useState<{
    from_date: string;
    to_date: string;
    total_eligible: number;
    within_7d_count: number;
    by_event: Record<string, number>;
    sample_leads: Array<{
      lead_id: string;
      name: string;
      stage_name: string | null;
      event_name: string;
      within_7d: boolean;
      created_at: string;
    }>;
  } | null>(null);
  const [loadingBf, setLoadingBf] = useState(false);
  const [runningBfRun, setRunningBfRun] = useState(false);

  const [audPreview, setAudPreview] = useState<{
    total_contacts: number;
    valid_phone_count: number;
    valid_email_count: number;
    schema: string[];
    estimated_match_rate_pct: number;
  } | null>(null);
  const [audName, setAudName] = useState('DOMATION Qualified Audience');
  const [syncingAud, setSyncingAud] = useState(false);
  const [audSyncResult, setAudSyncResult] = useState<{
    custom_audience_id: string;
    audience_name: string;
    synced_count: number;
  } | null>(null);

  const [adsetList, setAdsetList] = useState<Array<{ id: string; name: string; campaign_name?: string; status?: string }>>([]);
  const [manualAdsetId, setManualAdsetId] = useState('');
  const [optimizeBudgetVnd, setOptimizeBudgetVnd] = useState('500000');
  const [optimizeReason, setOptimizeReason] = useState('Tối ưu ROAS theo tín hiệu CAPI');
  const [optimizingAdsetId, setOptimizingAdsetId] = useState<string | null>(null);

  const [pfStats, setPfStats] = useState<{
    total_blocked: number;
    synced_count: number;
    pending_sync_count: number;
    matched_leads_count: number;
  } | null>(null);
  const [pfPhonesInput, setPfPhonesInput] = useState('');
  const [pfReasonInput, setPfReasonInput] = useState('Phone Farm / Virtual SIM Spam Exclusion');
  const [importingPf, setImportingPf] = useState(false);
  const [syncingPfMeta, setSyncingPfMeta] = useState(false);

  // Settings State (Single Active Primary Pixel only)
  const [capiEnabled, setCapiEnabled] = useState<boolean>(true);
  const [pixelId, setPixelId] = useState<string>('');
  const [onlyMetaLeads, setOnlyMetaLeads] = useState<boolean>(true);
  const [capiTokenInput, setCapiTokenInput] = useState<string>('');
  const [hasCustomToken, setHasCustomToken] = useState<boolean>(false);
  const [maskedToken, setMaskedToken] = useState<string>('');
  const [hasMetaAdsToken, setHasMetaAdsToken] = useState<boolean>(false);
  const [closedValueVnd, setClosedValueVnd] = useState<string>(String(defaultClosedDealVnd));
  const [eventTriggers, setEventTriggers] = useState<Record<string, string>>(DEFAULT_PRESET_TRIGGERS);
  const [customEvents, setCustomEvents] = useState<CapiCustomEvent[]>([]);

  // Discovery & Metrics
  const [availablePixels, setAvailablePixels] = useState<AvailablePixel[]>([]);
  const [stats, setStats] = useState<{
    total_sent_ok?: number;
    positive_sent_ok?: number;
    spam_sent_ok?: number;
    pending_backfill_total?: number;
    pending_backfill_positive?: number;
    pending_backfill_spam?: number;
    leads_with_meta_id?: number;
    leads_with_fbclid?: number;
    leads_with_ad_id?: number;
    failed_count?: number;
  } | null>(null);
  const [logs, setLogs] = useState<CapiLogItem[]>([]);

  // Add Custom Event Inline (inside Settings Modal)
  const [newEventName, setNewEventName] = useState<string>('');
  const [newEventLabel, setNewEventLabel] = useState<string>('');

  // Log Filter & Modal
  const [logFilter, setLogFilter] = useState<'all' | 'ok' | 'error' | 'positive' | 'spam'>('all');
  const [logSearch, setLogSearch] = useState<string>('');
  const [logPage, setLogPage] = useState<number>(1);
  const [inspectLog, setInspectLog] = useState<CapiLogItem | null>(null);

  const loadCapiDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetchAPI('get_capi_dashboard');
      if (res.success && res.config) {
        const cfg = res.config;
        setCapiEnabled(!!cfg.capi_enabled);
        setPixelId(cfg.capi_pixel_id || '');
        setOnlyMetaLeads(!!cfg.capi_only_meta_leads);
        setHasCustomToken(!!cfg.has_custom_capi_token);
        setMaskedToken(cfg.capi_access_token_masked || '');
        setHasMetaAdsToken(!!cfg.has_meta_ads_token);
        setClosedValueVnd(String(cfg.capi_closed_value_vnd || 50000000));
        setEventTriggers(cfg.capi_event_triggers || DEFAULT_PRESET_TRIGGERS);
        setCustomEvents(Array.isArray(cfg.capi_custom_events) ? cfg.capi_custom_events : []);
        setAvailablePixels(Array.isArray(res.available_pixels) ? res.available_pixels : []);
        setStats(res.stats || null);
        setLogs(Array.isArray(res.logs) ? res.logs : []);
      } else {
        toast.error(res.message || 'Không tải được dữ liệu CAPI');
      }
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, 'Lỗi kết nối máy chủ'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchAPI('get_capi_dashboard');
        if (!active) return;
        if (res.success && res.config) {
          const cfg = res.config;
          setCapiEnabled(!!cfg.capi_enabled);
          setPixelId(cfg.capi_pixel_id || '');
          setOnlyMetaLeads(!!cfg.capi_only_meta_leads);
          setHasCustomToken(!!cfg.has_custom_capi_token);
          setMaskedToken(cfg.capi_access_token_masked || '');
          setHasMetaAdsToken(!!cfg.has_meta_ads_token);
          setClosedValueVnd(String(cfg.capi_closed_value_vnd || defaultClosedDealVnd));
          setEventTriggers(cfg.capi_event_triggers || DEFAULT_PRESET_TRIGGERS);
          setCustomEvents(Array.isArray(cfg.capi_custom_events) ? cfg.capi_custom_events : []);
          setAvailablePixels(Array.isArray(res.available_pixels) ? res.available_pixels : []);
          setStats(res.stats || null);
          setLogs(Array.isArray(res.logs) ? res.logs : []);
        }
      } catch (e: unknown) {
        if (active) toast.error(getErrorMessage(e, 'Lỗi kết nối máy chủ'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveSettings = async (
    overrideTriggers?: Record<string, string>,
    overrideEvents?: CapiCustomEvent[],
    closeAfter = false
  ) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        capi_enabled: capiEnabled,
        capi_pixel_id: pixelId.trim(),
        capi_secondary_pixel_id: '',
        capi_dual_send: false,
        capi_only_meta_leads: onlyMetaLeads,
        capi_test_event_code: '',
        capi_closed_value_vnd: Number(closedValueVnd) || 50000000,
        capi_event_triggers: overrideTriggers || eventTriggers,
        capi_custom_events: overrideEvents || customEvents
      };
      if (capiTokenInput.trim() !== '') {
        payload.capi_access_token = capiTokenInput.trim();
      } else if (hasCustomToken) {
        payload.capi_access_token = '__KEEP_EXISTING__';
      }

      const res = await fetchAPI('save_capi_settings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        toast.success(res.message || 'Đã lưu cấu hình Meta CAPI');
        setCapiTokenInput('');
        if (closeAfter) {
          setSettingsModalOpen(false);
        }
        await loadCapiDashboard(true);
      } else {
        toast.error(res.message || 'Lỗi lưu cấu hình CAPI');
      }
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, 'Lỗi kết nối'));
    } finally {
      setSaving(false);
    }
  };

  const handleClearCustomToken = async () => {
    setSaving(true);
    try {
      const res = await fetchAPI('save_capi_settings', {
        method: 'POST',
        body: JSON.stringify({ capi_access_token: '' })
      });
      if (res.success) {
        toast.success('Đã xóa CAPI Token riêng, quay về dùng chung Meta Ads Token');
        setCapiTokenInput('');
        await loadCapiDashboard(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetPreset = () => {
    setEventTriggers({ ...DEFAULT_PRESET_TRIGGERS });
    handleSaveSettings({ ...DEFAULT_PRESET_TRIGGERS }, customEvents, false);
  };

  const handleAddCustomEvent = () => {
    const cleanName = newEventName.trim().replace(/\s+/g, '');
    if (!cleanName) {
      toast.error('Vui lòng nhập tên Event chuẩn Meta (không dấu cách)');
      return;
    }
    if (customEvents.some(e => e.name.toLowerCase() === cleanName.toLowerCase())) {
      toast.error('Tên Event này đã tồn tại trong danh sách');
      return;
    }
    const updated: CapiCustomEvent[] = [
      ...customEvents,
      {
        name: cleanName,
        label: newEventLabel.trim() ? `${cleanName} (${newEventLabel.trim()})` : cleanName,
        category: 'custom'
      }
    ];
    setCustomEvents(updated);
    setNewEventName('');
    setNewEventLabel('');
    handleSaveSettings(eventTriggers, updated, false);
  };

  const handleSyncSheetIds = async () => {
    setSyncingIds(true);
    try {
      const res = await fetchAPI('sync_capi_sheet_ids', { method: 'POST' });
      if (res.success) {
        toast.success(res.message || 'Đã đồng bộ định danh từ Sheets');
        await loadCapiDashboard(true);
        if (onSyncCompleted) onSyncCompleted();
      } else {
        toast.error(res.message || 'Đồng bộ định danh thất bại');
      }
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, 'Lỗi kết nối'));
    } finally {
      setSyncingIds(false);
    }
  };

  const handleSyncPendingCapi = async () => {
    setSyncingCapi(true);
    try {
      const res = await fetchAPI('backfill_capi_events', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'all',
          date: 'all',
          limit: 200
        })
      });
      if (res.success) {
        toast.success(res.message || 'Đã đồng bộ tín hiệu CAPI về Meta');
      } else {
        toast.error(res.message || 'Đồng bộ CAPI có lỗi từ Meta Graph API');
      }
      await loadCapiDashboard(true);
      if (onSyncCompleted) onSyncCompleted();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, 'Lỗi đồng bộ CAPI'));
    } finally {
      setSyncingCapi(false);
    }
  };

  const handleRetryLog = async (log: CapiLogItem) => {
    setRetryingLogId(log.id);
    try {
      await apiRequest(`/integrations/capi/retry/${log.id}`, {
        method: 'POST',
        token,
        tenantSlug,
      });
      toast.success(`Đã gửi lại sự kiện ${log.event_name} cho Lead #${log.lead_id}`);
      await loadCapiDashboard(true);
      if (onSyncCompleted) onSyncCompleted();
    } catch (apiErr) {
      // Fallback to legacy single retry by lead_id if numeric legacy row ID differs
      if (log.lead_id) {
        try {
          const res = await fetchAPI('send_single_lead_capi', {
            method: 'POST',
            body: JSON.stringify({
              lead_id: log.lead_id,
              stage: log.quality_status || undefined,
              force_retry: true
            })
          });
          if (res.success) {
            toast.success(`Đã gửi lại sự kiện ${res.event_name} cho Lead #${log.lead_id}`);
            await loadCapiDashboard(true);
            if (onSyncCompleted) onSyncCompleted();
            return;
          }
          toast.error(res.reason || res.message || getErrorMessage(apiErr, 'Gửi lại CAPI thất bại'));
        } catch (err) {
          toast.error(getErrorMessage(err, 'Lỗi kết nối khi gửi lại CAPI'));
        }
      } else {
        toast.error(getErrorMessage(apiErr, 'Không thể gửi lại sự kiện CAPI'));
      }
    } finally {
      setRetryingLogId(null);
    }
  };

  const loadBackfillAndAudiencePreview = async () => {
    setLoadingBf(true);
    try {
      const [bfRes, audRes] = await Promise.all([
        apiRequest<typeof bfPreview>(
          `/integrations/capi/backfill/preview?from_date=${encodeURIComponent(bfFromDate)}&to_date=${encodeURIComponent(bfToDate)}`,
          { token, tenantSlug }
        ),
        apiRequest<typeof audPreview>('/integrations/capi/audiences/preview', { token, tenantSlug }),
      ]);
      if (bfRes) setBfPreview(bfRes);
      if (audRes) setAudPreview(audRes);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải dữ liệu Backfill & Custom Audience Preview'));
    } finally {
      setLoadingBf(false);
    }
  };

  const handleRunCapiBackfill = async () => {
    setRunningBfRun(true);
    try {
      const res = await apiRequest<{ processed: number; succeeded: number; failed: number }>(
        '/integrations/capi/backfill/run',
        {
          method: 'POST',
          token,
          tenantSlug,
          body: { from_date: bfFromDate, to_date: bfToDate, limit: 200 },
        }
      );
      toast.success(
        `Đã chạy Backfill CAPI: xử lý ${res?.processed ?? 0} lead (thành công ${res?.succeeded ?? 0}, lỗi ${res?.failed ?? 0})`
      );
      await Promise.all([loadBackfillAndAudiencePreview(), loadCapiDashboard(true)]);
      if (onSyncCompleted) onSyncCompleted();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Chạy Backfill CAPI thất bại'));
    } finally {
      setRunningBfRun(false);
    }
  };

  const handleSyncCustomAudience = async () => {
    if (!audName.trim()) {
      toast.error('Vui lòng nhập Tên Custom Audience');
      return;
    }
    setSyncingAud(true);
    try {
      const res = await apiRequest<{ custom_audience_id: string; audience_name: string; synced_count: number }>(
        '/integrations/capi/audiences/sync',
        {
          method: 'POST',
          token,
          tenantSlug,
          body: { audience_name: audName.trim() },
        }
      );
      setAudSyncResult(res);
      toast.success(`Đã đồng bộ ${res?.synced_count ?? 0} hồ sơ lên Audience "${res?.audience_name || audName}"`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đồng bộ Custom Audience lên Meta'));
    } finally {
      setSyncingAud(false);
    }
  };

  const loadAdsetsAndPhoneFarm = async () => {
    try {
      const [pfRes, perfRes] = await Promise.all([
        apiRequest<typeof pfStats>('/integrations/capi/phone-farm/stats', { token, tenantSlug }),
        apiRequest<{ ads?: Array<{ adset_id?: string; adset_name?: string; campaign_name?: string; effective_status?: string }> }>(
          '/analytics/ads-performance',
          { token, tenantSlug }
        ).catch(() => null),
      ]);
      if (pfRes) setPfStats(pfRes);
      if (perfRes && Array.isArray(perfRes.ads)) {
        const seen = new Set<string>();
        const extracted: Array<{ id: string; name: string; campaign_name?: string; status?: string }> = [];
        for (const ad of perfRes.ads) {
          const aid = String(ad.adset_id || '').trim();
          if (!aid || seen.has(aid)) continue;
          seen.add(aid);
          extracted.push({
            id: aid,
            name: ad.adset_name || aid,
            campaign_name: ad.campaign_name,
            status: ad.effective_status || 'ACTIVE',
          });
        }
        setAdsetList(extracted);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải dữ liệu AdSet Optimizer & Phone Farm'));
    }
  };

  const handleOptimizeAdset = async (adsetId: string, action: 'adjust_budget' | 'pause' | 'enable') => {
    if (!adsetId.trim()) {
      toast.error('Vui lòng chọn hoặc nhập AdSet ID');
      return;
    }
    setOptimizingAdsetId(adsetId);
    try {
      await apiRequest(`/integrations/capi/adsets/${encodeURIComponent(adsetId.trim())}/optimize`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          action,
          daily_budget_vnd: action === 'adjust_budget' ? Number(optimizeBudgetVnd || 500000) : undefined,
          reason: optimizeReason.trim() || undefined,
        },
      });
      toast.success(`Đã áp dụng tối ưu "${action}" cho AdSet ${adsetId}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Tối ưu AdSet thất bại'));
    } finally {
      setOptimizingAdsetId(null);
    }
  };

  const handleImportPhoneFarm = async () => {
    const phones = pfPhonesInput
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (phones.length === 0) {
      toast.error('Vui lòng nhập hoặc dán ít nhất 1 số điện thoại cần chặn');
      return;
    }
    setImportingPf(true);
    try {
      const res = await apiRequest<{ imported: number; matched_leads_count: number }>(
        '/integrations/capi/phone-farm/import',
        {
          method: 'POST',
          token,
          tenantSlug,
          body: { phones, reason: pfReasonInput.trim() || 'Phone Farm Anti-Spam', source: 'manual_import' },
        }
      );
      toast.success(`Đã nạp ${res?.imported ?? phones.length} SĐT chặn Phone Farm (khớp ${res?.matched_leads_count ?? 0} Lead)!`);
      setPfPhonesInput('');
      await loadAdsetsAndPhoneFarm();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể nạp danh sách Phone Farm'));
    } finally {
      setImportingPf(false);
    }
  };

  const handleSyncPhoneFarmMeta = async () => {
    setSyncingPfMeta(true);
    try {
      const res = await apiRequest<{ synced_count: number; exclusion_audience_id: string }>(
        '/integrations/capi/phone-farm/sync-meta',
        { method: 'POST', token, tenantSlug, body: {} }
      );
      toast.success(`Đã đẩy ${res?.synced_count ?? 0} số chặn lên Exclusion Audience ${res?.exclusion_audience_id || ''}`);
      await loadAdsetsAndPhoneFarm();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đồng bộ loại trừ Phone Farm lên Meta'));
    } finally {
      setSyncingPfMeta(false);
    }
  };

  const eventSelectOptions = useMemo(() => {
    const base = customEvents.length > 0 ? customEvents : [
      { name: 'Skip', label: 'Skip (Không gửi CAPI)' },
      { name: 'Lead', label: 'Lead (Khách tiềm năng)' },
      { name: 'Schedule', label: 'Schedule (Đặt lịch hẹn)' },
      { name: 'InitiateCheckout', label: 'InitiateCheckout (Giữ chỗ)' },
      { name: 'AddPaymentInfo', label: 'AddPaymentInfo (Đặt cọc)' },
      { name: 'Purchase', label: 'Purchase (Chốt deal)' },
      { name: 'DisqualifiedLead', label: 'DisqualifiedLead (Tệp rác / Notlead)' }
    ];
    return base.map(ev => ({ value: ev.name, label: ev.label }));
  }, [customEvents]);

  const pixelSelectOptions = useMemo(() => {
    const opts = availablePixels.map(p => ({
      value: String(p.id),
      label: `${p.id} - ${p.name}${p.owner_business?.name ? ` (${p.owner_business.name})` : ''}`
    }));
    if (pixelId && !opts.some(o => o.value === pixelId)) {
      opts.unshift({ value: pixelId, label: `${pixelId} (Đã cấu hình)` });
    }
    return opts;
  }, [availablePixels, pixelId]);

  const activePixelInfo = useMemo(() => {
    return availablePixels.find(p => String(p.id) === String(pixelId)) || null;
  }, [availablePixels, pixelId]);

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    return logs.filter(item => {
      const isOk = item.response_status >= 200 && item.response_status < 300;
      const isSpam = ['Notlead', 'Spam'].includes(item.quality_status);
      const isPositive = ['Qualified', 'Booked', 'Booking', 'Deposited', 'Closed'].includes(item.quality_status);

      if (logFilter === 'ok' && !isOk) return false;
      if (logFilter === 'error' && isOk) return false;
      if (logFilter === 'positive' && !isPositive) return false;
      if (logFilter === 'spam' && !isSpam) return false;

      if (q) {
        const hay = `${item.lead_name || ''} ${item.lead_phone || ''} ${item.lead_ad_name || ''} ${item.lead_campaign_name || ''} ${item.event_name} ${item.dataset_id} ${item.quality_status || ''} #${item.lead_id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, logFilter, logSearch]);

  const totalLogPages = Math.max(1, Math.ceil(filteredLogs.length / LOG_PAGE_SIZE));
  const safeLogPage = Math.min(Math.max(1, logPage), totalLogPages);
  const visibleLogs = filteredLogs.slice((safeLogPage - 1) * LOG_PAGE_SIZE, safeLogPage * LOG_PAGE_SIZE);
  const startIdx = filteredLogs.length === 0 ? 0 : (safeLogPage - 1) * LOG_PAGE_SIZE + 1;
  const endIdx = Math.min(filteredLogs.length, safeLogPage * LOG_PAGE_SIZE);
  const pageNumbers = buildCapiPageNumbers(safeLogPage, totalLogPages);

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.75rem' }}>
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 13, padding: '1rem' }}>
          <Skeleton width={260} height={24} borderRadius={6} />
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={42} borderRadius={8} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Top 4 KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '0.75rem'
      }}>
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid rgba(22, 163, 74, 0.25)',
          borderRadius: 13,
          padding: '0.85rem 1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
              Đã Gửi Meta Thành Công
            </span>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(22, 163, 74, 0.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a', lineHeight: 1.2 }}>
            {stats?.total_sent_ok ?? 0} <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>sự kiện</span>
          </div>
          <div style={{ fontSize: '0.71rem', color: 'var(--color-text-muted)', marginTop: 3 }}>
            Chất lượng: <strong style={{ color: '#15803d' }}>{stats?.positive_sent_ok ?? 0}</strong> • Notlead/Spam: <strong style={{ color: '#1E40FF' }}>{stats?.spam_sent_ok ?? 0}</strong>
          </div>
        </div>

        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 13,
          padding: '0.85rem 1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1E40FF', textTransform: 'uppercase' }}>
              Chờ Đồng Bộ CAPI
            </span>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(30, 64, 255, 0.14)', color: '#1E40FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={14} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
            {stats?.pending_backfill_total ?? 0} <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Lead</span>
          </div>
          <div style={{ fontSize: '0.71rem', color: 'var(--color-text-muted)', marginTop: 3 }}>
            Chất lượng: <strong style={{ color: '#16a34a' }}>{stats?.pending_backfill_positive ?? 0}</strong> • Notlead/Spam: <strong style={{ color: '#1E40FF' }}>{stats?.pending_backfill_spam ?? 0}</strong>
          </div>
        </div>

        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 13,
          padding: '0.85rem 1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
              Độ Phủ Định Danh Meta
            </span>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={14} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
            {stats?.leads_with_meta_id ?? 0} <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Lead ID 16s</span>
          </div>
          <div style={{ fontSize: '0.71rem', color: 'var(--color-text-muted)', marginTop: 3 }}>
            fbclid Web: <strong>{stats?.leads_with_fbclid ?? 0}</strong> • Ad ID: <strong>{stats?.leads_with_ad_id ?? 0}</strong>
          </div>
        </div>

        <div style={{
          background: 'var(--color-surface)',
          border: (stats?.failed_count ?? 0) > 0 ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid var(--color-border)',
          borderRadius: 13,
          padding: '0.85rem 1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: (stats?.failed_count ?? 0) > 0 ? '#1E40FF' : 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Lỗi Graph API
            </span>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: (stats?.failed_count ?? 0) > 0 ? 'rgba(220, 38, 38, 0.12)' : 'var(--color-bg)',
              color: (stats?.failed_count ?? 0) > 0 ? '#1E40FF' : 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertTriangle size={14} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: (stats?.failed_count ?? 0) > 0 ? '#1E40FF' : 'var(--color-text)', lineHeight: 1.2 }}>
            {stats?.failed_count ?? 0} <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>lỗi</span>
          </div>
          <div style={{ fontSize: '0.71rem', color: 'var(--color-text-muted)', marginTop: 3 }}>
            Pixel chính: <strong style={{ color: 'var(--color-text)' }}>...{pixelId ? pixelId.slice(-6) : '-'}</strong>
          </div>
        </div>
      </div>

      {/* Unified Toolbar Bar: Active Primary Dataset + Sync + Settings Modal Trigger */}
      <div data-tour="capi-account-select" style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(30, 64, 255, 0.28)',
        borderRadius: 13,
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <ScreenHelpButton screenKey="ads_capi" size="sm" />
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 18,
            background: capiEnabled ? 'rgba(22, 163, 74, 0.1)' : 'var(--color-bg)',
            border: capiEnabled ? '1px solid rgba(22, 163, 74, 0.25)' : '1px solid var(--color-border)',
            fontSize: '0.73rem',
            fontWeight: 700,
            color: capiEnabled ? '#15803d' : 'var(--color-text-muted)'
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: capiEnabled ? '#16a34a' : '#94a3b8'
            }} />
            {capiEnabled ? 'Tự động gửi CAPI khi Sale/AI đánh giá' : 'CAPI tự động đang tắt'}
          </div>

          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
            Pixel / Dataset chính:{' '}
            <strong style={{ color: 'var(--color-text)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {pixelId || 'Chưa chọn'}
            </strong>
            {activePixelInfo?.name ? (
              <span style={{ color: '#1E3A8A', fontWeight: 600 }}> ({activePixelInfo.name})</span>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSyncSheetIds}
            disabled={syncingIds}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '0.45rem 0.85rem',
              borderRadius: 9,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: syncingIds ? 'not-allowed' : 'pointer'
            }}
          >
            <Database size={13} className={syncingIds ? 'spin' : ''} />
            {syncingIds ? 'Đang quét Sheets...' : 'Quét Lead ID Sheets'}
          </button>

          {(stats?.pending_backfill_total ?? 0) > 0 && (
            <button
              type="button"
              onClick={handleSyncPendingCapi}
              disabled={syncingCapi}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.45rem 0.9rem',
                borderRadius: 9,
                border: '1px solid rgba(30, 64, 255, 0.4)',
                background: 'rgba(30, 64, 255, 0.12)',
                color: '#1E3A8A',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: syncingCapi ? 'not-allowed' : 'pointer'
              }}
            >
              <Send size={13} />
              {syncingCapi ? 'Đang đồng bộ...' : `Đồng Bộ (${stats?.pending_backfill_total ?? 0} Lead)`}
            </button>
          )}

          <button
            type="button"
            data-tour="capi-stage-mapping"
            onClick={() => setSettingsModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '0.47rem 1rem',
              borderRadius: 9,
              border: 'none',
              background: 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)',
              color: '#fff',
              fontSize: '0.76rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(30, 64, 255, 0.24)'
            }}
          >
            <Settings2 size={14} />
            Thiết Lập CAPI & Phễu
          </button>
        </div>
      </div>

      {/* Wave A CAPI Growth Sub-Navigation (Royal Sapphire) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '6px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        {[
          { id: 'logs' as const, label: 'Nhật ký CAPI & Retry Từng Sự kiện', icon: <RotateCcw size={14} /> },
          { id: 'backfill_audiences' as const, label: 'Backfill Preview/Run & Custom Audience Sync', icon: <Users size={14} /> },
          { id: 'adsets_phone_farm' as const, label: 'AdSet Optimizer & Chặn Phone Farm Anti-Spam', icon: <ShieldCheck size={14} /> },
        ].map((item) => {
          const active = capiSubTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setCapiSubTab(item.id);
                if (item.id === 'backfill_audiences' && !bfPreview) {
                  void loadBackfillAndAudiencePreview();
                } else if (item.id === 'adsets_phone_farm' && !pfStats) {
                  void loadAdsetsAndPhoneFarm();
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 9,
                border: active ? '1px solid #1E40FF' : '1px solid transparent',
                background: active ? '#1E40FF' : 'transparent',
                color: active ? '#FFFFFF' : '#475569',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {item.icon} {item.label}
            </button>
          );
        })}
      </div>

      {/* SUBTAB 2: BACKFILL PREVIEW/RUN & CUSTOM AUDIENCE SYNC */}
      {capiSubTab === 'backfill_audiences' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '0.9rem' }}>
          {/* Module 1: Backfill Preview & Run */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0F172A' }}>
                  CAPI Backfill Preview & Run (≤ 7 Ngày Meta)
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                  Kiểm tra danh sách Lead đủ điều kiện trước khi bắn bù sự kiện lên Meta Conversions API.
                </p>
              </div>
              <button
                type="button"
                disabled={runningBfRun}
                onClick={() => void handleRunCapiBackfill()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10, border: 'none',
                  background: '#1E40FF', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Play size={13} /> {runningBfRun ? 'Đang chạy Backfill...' : 'Chạy Backfill ngay'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="date"
                value={bfFromDate}
                onChange={(e) => setBfFromDate(e.target.value)}
                className="form-input"
                style={{ height: 38, fontSize: '0.78rem' }}
              />
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>đến</span>
              <input
                type="date"
                value={bfToDate}
                onChange={(e) => setBfToDate(e.target.value)}
                className="form-input"
                style={{ height: 38, fontSize: '0.78rem' }}
              />
              <button
                type="button"
                disabled={loadingBf}
                onClick={() => void loadBackfillAndAudiencePreview()}
                className="btn outline"
                style={{ height: 38, padding: '0 12px', fontSize: '0.76rem' }}
              >
                <RefreshCw size={13} className={loadingBf ? 'spin' : ''} /> Xem trước
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Tổng Lead hợp lệ
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1E40FF', fontVariantNumeric: 'tabular-nums' }}>
                  {bfPreview?.total_eligible ?? 0}
                </div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Trong cửa sổ ≤ 7 ngày
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                  {bfPreview?.within_7d_count ?? 0}
                </div>
              </div>
            </div>

            {bfPreview?.sample_leads && bfPreview.sample_leads.length > 0 && (
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '7px 10px' }}>Khách hàng</th>
                      <th style={{ padding: '7px 10px' }}>Bước</th>
                      <th style={{ padding: '7px 10px' }}>Sự kiện CAPI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bfPreview.sample_leads.slice(0, 15).map((item) => (
                      <tr key={item.lead_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>{item.name}</td>
                        <td style={{ padding: '7px 10px', color: '#64748B' }}>{item.stage_name || '—'}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: '#1E40FF' }}>{item.event_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Module 2: Custom Audience Preview & Push Sync */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0F172A' }}>
                Custom Audience Preview & Push Sync lên Meta
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                Chuẩn hóa & băm SHA-256 SĐT + Email thành tệp Seed / Exclusion đồng bộ trực tiếp sang Meta Custom Audience.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div style={{ padding: '10px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>TỔNG HỒ SƠ</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                  {audPreview?.total_contacts ?? 0}
                </div>
              </div>
              <div style={{ padding: '10px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>SĐT / EMAIL HỢP LỆ</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E40FF', fontVariantNumeric: 'tabular-nums' }}>
                  {audPreview?.valid_phone_count ?? 0} / {audPreview?.valid_email_count ?? 0}
                </div>
              </div>
              <div style={{ padding: '10px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>TỶ LỆ KHỚP DỰ KIẾN</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                  {audPreview?.estimated_match_rate_pct ?? 0}%
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={audName}
                onChange={(e) => setAudName(e.target.value)}
                placeholder="Tên tệp Meta Custom Audience..."
                className="form-input"
                style={{ flex: 1, height: 40, fontSize: '0.8rem' }}
              />
              <button
                type="button"
                disabled={syncingAud}
                onClick={() => void handleSyncCustomAudience()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '0 14px', height: 40, borderRadius: 10, border: 'none',
                  background: '#1E40FF', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Database size={13} /> {syncingAud ? 'Đang đẩy Meta...' : 'Push Sync lên Meta'}
              </button>
            </div>

            {audSyncResult && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: '0.78rem', color: '#1E3A8A' }}>
                Đã đồng bộ <strong>{audSyncResult.synced_count}</strong> khách hàng vào Audience{' '}
                <code>{audSyncResult.custom_audience_id}</code> ({audSyncResult.audience_name}).
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: ADSET OPTIMIZER & PHONE FARM ANTI-SPAM */}
      {capiSubTab === 'adsets_phone_farm' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '0.9rem' }}>
          {/* Module 3: AdSet Optimizer */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sliders size={15} color="#1E40FF" /> Tối Ưu AdSet Theo Tín hiệu CAPI
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                  Điều chỉnh ngân sách ngày, tạm dừng nhóm quảng cáo kém hiệu quả hoặc kích hoạt lại trực tiếp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadAdsetsAndPhoneFarm()}
                className="btn outline"
                style={{ height: 34, padding: '0 10px', fontSize: '0.75rem' }}
              >
                <RefreshCw size={12} /> Làm mới
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                value={manualAdsetId}
                onChange={(e) => setManualAdsetId(e.target.value)}
                placeholder="Nhập AdSet ID hoặc chọn bên dưới"
                className="form-input"
                style={{ height: 38, fontSize: '0.78rem', fontFamily: 'monospace' }}
              />
              <input
                type="number"
                min={0}
                value={optimizeBudgetVnd}
                onChange={(e) => setOptimizeBudgetVnd(e.target.value)}
                placeholder="Ngân sách ngày (VND)"
                className="form-input"
                style={{ height: 38, fontSize: '0.78rem' }}
              />
            </div>
            <input
              value={optimizeReason}
              onChange={(e) => setOptimizeReason(e.target.value)}
              placeholder="Ghi chú lý do tối ưu AdSet..."
              className="form-input"
              style={{ height: 38, fontSize: '0.78rem' }}
            />

            {manualAdsetId.trim() && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={optimizingAdsetId === manualAdsetId}
                  onClick={() => void handleOptimizeAdset(manualAdsetId, 'adjust_budget')}
                  style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cập nhật Ngân sách
                </button>
                <button
                  type="button"
                  onClick={() => void handleOptimizeAdset(manualAdsetId, 'pause')}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#1E40FF', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Tạm dừng AdSet
                </button>
                <button
                  type="button"
                  onClick={() => void handleOptimizeAdset(manualAdsetId, 'enable')}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#15803D', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Kích hoạt AdSet
                </button>
              </div>
            )}

            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
              {adsetList.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.78rem', color: '#64748B' }}>
                  Chưa phát hiện AdSet từ luồng Ads đồng bộ — nhập AdSet ID ở trên để tối ưu trực tiếp.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '7px 10px' }}>AdSet</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Tối ưu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adsetList.map((as) => (
                      <tr key={as.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ fontWeight: 700 }}>{as.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'monospace' }}>
                            {as.id} • {as.campaign_name || 'Meta Campaign'}
                          </div>
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            disabled={optimizingAdsetId === as.id}
                            onClick={() => void handleOptimizeAdset(as.id, 'adjust_budget')}
                            style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {optimizingAdsetId === as.id ? 'Đang chạy...' : 'Tối ưu'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Module 4: Phone Farm Anti-Spam Exclusion */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldAlert size={15} color="#1E40FF" /> Khiên Chặn Phone Farm & Loại trừ Quảng cáo
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                  Ngăn SIM rác / click ảo phá ngân sách quảng cáo và tránh bắn nhầm tín hiệu rác vào Pixel CAPI.
                </p>
              </div>
              <button
                type="button"
                disabled={syncingPfMeta}
                onClick={() => void handleSyncPhoneFarmMeta()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 9, border: 'none',
                  background: '#1E40FF', color: '#FFFFFF', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <ShieldCheck size={13} /> {syncingPfMeta ? 'Đang đẩy Meta...' : 'Sync Exclusion lên Meta'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div style={{ padding: '10px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>SĐT ĐÃ CHẶN</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E40FF', fontVariantNumeric: 'tabular-nums' }}>
                  {pfStats?.total_blocked ?? 0}
                </div>
              </div>
              <div style={{ padding: '10px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>ĐÃ SYNC META</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                  {pfStats?.synced_count ?? 0}
                </div>
              </div>
              <div style={{ padding: '10px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>CHỜ ĐỒNG BỘ</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#D97706', fontVariantNumeric: 'tabular-nums' }}>
                  {pfStats?.pending_sync_count ?? 0}
                </div>
              </div>
            </div>

            <textarea
              rows={3}
              value={pfPhonesInput}
              onChange={(e) => setPfPhonesInput(e.target.value)}
              placeholder="Dán danh sách số điện thoại rác / Phone Farm (mỗi dòng 1 số hoặc cách nhau bằng dấu phẩy)..."
              className="form-input"
              style={{ width: '100%', padding: '10px', fontSize: '0.78rem', fontFamily: 'monospace' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={pfReasonInput}
                onChange={(e) => setPfReasonInput(e.target.value)}
                placeholder="Lý do chặn"
                className="form-input"
                style={{ flex: 1, height: 38, fontSize: '0.78rem' }}
              />
              <button
                type="button"
                disabled={importingPf}
                onClick={() => void handleImportPhoneFarm()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '0 14px', height: 38, borderRadius: 9, border: '1px solid #1E40FF',
                  background: '#FFFFFF', color: '#1E40FF', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Upload size={13} /> {importingPf ? 'Đang nạp...' : 'Import Số Chặn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-WIDTH CAPI AUDIT LOGS PANEL (Matches AdsPerformance.tsx Style & Pagination) */}
      {capiSubTab === 'logs' && (
      <div data-tour="capi-live-logs" style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 13,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Card Header + Search & Refresh */}
        <div style={{
          padding: '0.9rem 1.15rem',
          borderBottom: '1px solid var(--color-border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <ShieldAlert size={16} style={{ color: '#1E40FF' }} />
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text)' }}>
                Nhật Ký Tín Hiệu CAPI ({filteredLogs.length})
              </span>
            </div>

            {/* Clean Filter Pills */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'ok', label: 'Thành công (200)' },
                { id: 'error', label: 'Lỗi Meta' },
                { id: 'positive', label: 'Chất lượng (Qualified+)' },
                { id: 'spam', label: 'Notlead / Spam' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setLogFilter(tab.id as 'all' | 'ok' | 'error' | 'positive' | 'spam');
                    setLogPage(1);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 16,
                    border: logFilter === tab.id ? '1px solid #1E40FF' : '1px solid var(--color-border)',
                    background: logFilter === tab.id ? 'rgba(30, 64, 255, 0.14)' : 'var(--color-bg)',
                    color: logFilter === tab.id ? '#1E3A8A' : 'var(--color-text-muted)',
                    fontSize: '0.71rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ position: 'relative', width: 225 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => {
                  setLogSearch(e.target.value);
                  setLogPage(1);
                }}
                placeholder="Tìm khách, SĐT, bài QC, event..."
                style={{
                  width: '100%', padding: '5px 10px 5px 29px', borderRadius: 8,
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                  color: 'var(--color-text)', fontSize: '0.74rem', boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => loadCapiDashboard(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 8,
                border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                color: 'var(--color-text)', fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <RefreshCw size={12} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Full-Width Synchronized Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '0.76rem' }}>
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '19%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
                <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: '0.67rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.03em' }}>
                  KHÁCH HÀNG
                </th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: '0.67rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.03em' }}>
                  BÀI QC / NGUỒN
                </th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: '0.67rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.03em' }}>
                  SỰ KIỆN META
                </th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: '0.67rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.03em' }}>
                  KHỚP DỮ LIỆU
                </th>
                <th style={{ padding: '9px 10px', textAlign: 'center', fontSize: '0.67rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.03em' }}>
                  HTTP
                </th>
                <th style={{ padding: '9px 14px', textAlign: 'right', fontSize: '0.67rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.03em' }}>
                  THAO TÁC
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                    Chưa có tín hiệu CAPI nào khớp bộ lọc. Hệ thống sẽ tự động gửi khi Sale hoặc Gatekeeper đánh giá chất lượng Lead.
                  </td>
                </tr>
              ) : (
                visibleLogs.map(log => {
                  const isOk = log.response_status >= 200 && log.response_status < 300;
                  const isSpam = ['Notlead', 'Spam'].includes(log.quality_status);
                  const displayName = log.lead_name || `Lead #${log.lead_id}`;
                  const sourceLabel = TRIGGER_SOURCE_LABELS[log.trigger_source] || log.trigger_source || 'Hệ thống';

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                      <td style={{ padding: '10px 14px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <Avatar name={displayName} size={30} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontWeight: 700,
                              color: 'var(--color-text)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {displayName}
                            </div>
                            <div style={{
                              fontSize: '0.68rem',
                              color: 'var(--color-text-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {log.lead_phone || '-'} • {sourceLabel}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '10px 10px', overflow: 'hidden' }}>
                        <div
                          title={log.lead_ad_name || ''}
                          style={{
                            fontWeight: 600,
                            color: 'var(--color-text)',
                            fontSize: '0.73rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {log.lead_ad_name || log.lead_campaign_name || (log.lead_meta_id ? 'Meta Lead Form' : 'Website / Direct')}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                          {log.action_source === 'system_generated' ? 'CRM Lead Form' : 'Website Pixel'}
                          {log.lead_meta_id ? ` • ID ...${log.lead_meta_id.slice(-6)}` : ''}
                        </div>
                      </td>

                      <td style={{ padding: '10px 10px', overflow: 'hidden' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          background: isSpam ? 'rgba(220, 38, 38, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                          color: isSpam ? '#1E40FF' : '#15803d'
                        }}>
                          {log.event_name}
                        </span>
                        <div style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)', marginTop: 3 }}>
                          Stage: <strong style={{ color: 'var(--color-text)' }}>{log.quality_status || '-'}</strong> • Dataset ...{log.dataset_id.slice(-6)}
                        </div>
                      </td>

                      <td style={{ padding: '10px 10px', overflow: 'hidden' }}>
                        <div style={{
                          fontSize: '0.69rem',
                          color: 'var(--color-text-muted)',
                          fontFamily: 'monospace',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {log.match_keys || '-'}
                        </div>
                      </td>

                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontSize: '0.69rem',
                          fontWeight: 800,
                          background: isOk ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                          color: isOk ? '#15803d' : '#1E40FF'
                        }}>
                          {log.response_status || 0}
                        </span>
                        <div style={{ fontSize: '0.64rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                          {log.sent_at ? log.sent_at.slice(5, 16) : ''}
                        </div>
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <button
                            type="button"
                            onClick={() => setInspectLog(log)}
                            title="Xem JSON Payload & Phản hồi Meta"
                            style={{
                              width: 27, height: 27, borderRadius: 7,
                              border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                              color: 'var(--color-text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={13} />
                          </button>
                          {log.lead_id > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRetryLog(log)}
                              disabled={retryingLogId === log.id}
                              title="Gửi lại CAPI cho Lead này"
                              style={{
                                width: 27, height: 27, borderRadius: 7,
                                border: '1px solid rgba(30, 64, 255, 0.35)', background: 'rgba(30, 64, 255, 0.1)',
                                color: '#1E3A8A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                cursor: retryingLogId === log.id ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <RotateCcw size={12} className={retryingLogId === log.id ? 'spin' : ''} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Synchronized Pagination Bar (Matches AdsPerformance.tsx CompactPaginationBar) */}
        {filteredLogs.length > LOG_PAGE_SIZE && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            padding: '10px 14px',
            background: 'var(--color-bg)',
            borderTop: '1px solid var(--color-border-light)',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)'
          }}>
            <div>
              Hiển thị <strong style={{ color: 'var(--color-text)' }}>{startIdx}–{endIdx}</strong> / <strong style={{ color: '#1E40FF' }}>{filteredLogs.length}</strong> sự kiện
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                disabled={safeLogPage <= 1}
                onClick={() => setLogPage(safeLogPage - 1)}
                title="Trang trước"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: safeLogPage <= 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: safeLogPage <= 1 ? 'not-allowed' : 'pointer',
                  opacity: safeLogPage <= 1 ? 0.45 : 1
                }}
              >
                <ChevronLeft size={13} />
              </button>

              {pageNumbers.map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`el-${idx}`} style={{ padding: '0 3px', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLogPage(p)}
                    style={{
                      minWidth: 26,
                      height: 26,
                      padding: '0 6px',
                      borderRadius: 6,
                      border: p === safeLogPage ? '1px solid #1E40FF' : '1px solid var(--color-border)',
                      background: p === safeLogPage ? 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)' : 'var(--color-surface)',
                      color: p === safeLogPage ? '#fff' : 'var(--color-text)',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={safeLogPage >= totalLogPages}
                onClick={() => setLogPage(safeLogPage + 1)}
                title="Trang sau"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: safeLogPage >= totalLogPages ? 'var(--color-text-muted)' : 'var(--color-text)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: safeLogPage >= totalLogPages ? 'not-allowed' : 'pointer',
                  opacity: safeLogPage >= totalLogPages ? 0.45 : 1
                }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* CAPI CONNECTION & PIPELINE MAPPING POPUP MODAL */}
      <CustomModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title="Thiết Lập Kết Nối & Ánh Xạ Phễu CAPI"
        width={880}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Auto-fire Toggle + Primary Dataset */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '0.65rem 0.9rem',
            borderRadius: 10,
            background: capiEnabled ? 'rgba(22, 163, 74, 0.06)' : 'var(--color-bg)',
            border: capiEnabled ? '1px solid rgba(22, 163, 74, 0.25)' : '1px solid var(--color-border)'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text)' }}>
                Tự động gửi CAPI Real-time khi Sale hoặc Gatekeeper đánh giá Lead
              </div>
              <div style={{ fontSize: '0.71rem', color: 'var(--color-text-muted)' }}>
                Khi bật, mọi cập nhật chất lượng trên SalePortal và Ticket lỗi được duyệt sẽ gửi ngay về Dataset chính bên dưới.
              </div>
            </div>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              padding: '5px 12px', borderRadius: 18,
              background: capiEnabled ? '#16a34a' : '#94a3b8',
              color: '#fff', fontSize: '0.73rem', fontWeight: 700, flexShrink: 0
            }}>
              <input
                type="checkbox"
                checked={capiEnabled}
                onChange={(e) => setCapiEnabled(e.target.checked)}
                style={{ display: 'none' }}
              />
              {capiEnabled ? 'Đang Bật' : 'Đang Tắt'}
            </label>
          </div>

          {/* Primary Dataset Only + Token + Closed Value */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr 180px', gap: '0.75rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Dataset / Pixel Chính (CRM Quality Lead)
              </label>
              <CustomSelect
                value={pixelId}
                onChange={(val) => setPixelId(String(val))}
                options={pixelSelectOptions}
                placeholder="Chọn Dataset / Pixel chính..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                CAPI Access Token (Events Manager)
              </label>
              <div style={{ display: 'flex', gap: 5 }}>
                <input
                  type="password"
                  value={capiTokenInput}
                  onChange={(e) => setCapiTokenInput(e.target.value)}
                  placeholder={hasCustomToken ? `Token riêng (${maskedToken})` : (hasMetaAdsToken ? 'Dùng chung Meta Ads Token' : 'Nhập token CAPI...')}
                  style={{
                    flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: 8,
                    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                    color: 'var(--color-text)', fontSize: '0.75rem', boxSizing: 'border-box'
                  }}
                />
                {hasCustomToken && (
                  <button
                    type="button"
                    onClick={handleClearCustomToken}
                    title="Xóa token riêng để dùng chung Meta Ads Token"
                    style={{
                      padding: '0 8px', borderRadius: 8, border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)', fontSize: '0.7rem', fontWeight: 700,
                      color: '#1E40FF', cursor: 'pointer'
                    }}
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Giá trị Chốt (VND)
              </label>
              <input
                type="number"
                value={closedValueVnd}
                onChange={(e) => setClosedValueVnd(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                  color: 'var(--color-text)', fontSize: '0.76rem', fontWeight: 700, boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            padding: '0.55rem 0.75rem', borderRadius: 9,
            background: 'rgba(30, 64, 255, 0.08)', border: '1px solid rgba(30, 64, 255, 0.25)',
            fontSize: '0.75rem', fontWeight: 700, color: '#1E3A8A'
          }}>
            <input
              type="checkbox"
              checked={onlyMetaLeads}
              onChange={(e) => setOnlyMetaLeads(e.target.checked)}
              style={{ accentColor: '#1E40FF', width: 15, height: 15 }}
            />
            Chỉ gửi Lead thuộc nguồn Meta Ads (loại bỏ Google Ads gclid= để tránh học chéo tệp)
          </label>

          {/* 8-Stage + Spam Mapping */}
          <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text)' }}>
                Ánh Xạ 8 Trạng Thái SalePortal & Luồng Spam
              </span>
              <button
                type="button"
                onClick={handleResetPreset}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: '0.71rem', fontWeight: 700, color: '#1E3A8A',
                  background: 'rgba(30, 64, 255, 0.1)', border: '1px solid rgba(30, 64, 255, 0.3)',
                  borderRadius: 7, padding: '4px 9px', cursor: 'pointer'
                }}
              >
                <RotateCcw size={11} />
                Khôi phục mặc định
              </button>
            </div>

            <div data-tour="capi-stage-mapping" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              {PIPELINE_CAPI_STAGES.map(st => {
                const badgeColor = st.group === 'positive' ? '#16a34a' : (st.group === 'negative' ? '#1E40FF' : '#64748b');
                const currentEv = eventTriggers[st.key] || 'Skip';
                return (
                  <div key={st.key} style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) 175px',
                    gap: 8,
                    alignItems: 'center',
                    padding: '7px 10px',
                    borderRadius: 9,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border-light)'
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: badgeColor, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text)' }}>{st.label}</span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: badgeColor, background: `${badgeColor}14`, padding: '1px 6px', borderRadius: 5 }}>
                          Gợi ý: {st.recommended}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {st.hint}
                      </div>
                    </div>
                    <CustomSelect
                      value={currentEv}
                      onChange={(val) => setEventTriggers(prev => ({ ...prev, [st.key]: String(val) }))}
                      options={eventSelectOptions}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inline Custom Event + Footer Actions */}
          <div style={{
            borderTop: '1px solid var(--color-border-light)',
            paddingTop: '0.8rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                placeholder="Tên Event mới (VD: ViewProject)"
                style={{
                  width: 185, padding: '6px 9px', borderRadius: 7,
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                  color: 'var(--color-text)', fontSize: '0.73rem'
                }}
              />
              <input
                type="text"
                value={newEventLabel}
                onChange={(e) => setNewEventLabel(e.target.value)}
                placeholder="Mô tả ngắn"
                style={{
                  width: 150, padding: '6px 9px', borderRadius: 7,
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                  color: 'var(--color-text)', fontSize: '0.73rem'
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomEvent}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '6px 10px', borderRadius: 7,
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                  color: 'var(--color-text)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
                }}
              >
                <Plus size={13} />
                Thêm Event
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                style={{
                  padding: '0.5rem 0.95rem',
                  borderRadius: 9,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleSaveSettings(undefined, undefined, true)}
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.52rem 1.2rem',
                  borderRadius: 9,
                  border: 'none',
                  background: 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)',
                  color: '#fff',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 10px rgba(30, 64, 255, 0.25)',
                  opacity: saving ? 0.7 : 1
                }}
              >
                <Check size={14} />
                {saving ? 'Đang lưu...' : 'Lưu Cấu Hình CAPI'}
              </button>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* Payload & Meta Response Inspector Modal */}
      <CustomModal
        isOpen={!!inspectLog}
        onClose={() => setInspectLog(null)}
        title={inspectLog ? `Chi Tiết Sự Kiện CAPI #${inspectLog.id} (${inspectLog.event_name})` : 'Chi Tiết CAPI'}
        width={680}
      >
        {inspectLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
              <span>Dataset: <strong style={{ color: 'var(--color-text)' }}>{inspectLog.dataset_id}</strong></span>
              <span>HTTP: <strong style={{ color: inspectLog.response_status >= 200 && inspectLog.response_status < 300 ? '#16a34a' : '#1E40FF' }}>{inspectLog.response_status}</strong></span>
              <span>Thời gian: <strong style={{ color: 'var(--color-text)' }}>{inspectLog.sent_at}</strong></span>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                JSON Payload Đã Gửi Về Meta (PII đã băm SHA-256)
              </div>
              <pre style={{
                margin: 0, padding: '10px', borderRadius: 9,
                background: '#0f172a', color: '#e2e8f0', fontSize: '0.71rem',
                overflowX: 'auto', maxHeight: 220
              }}>
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(inspectLog.sent_payload || '{}'), null, 2);
                  } catch {
                    return inspectLog.sent_payload || '';
                  }
                })()}
              </pre>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                Phản Hồi Từ Meta Graph API
              </div>
              <pre style={{
                margin: 0, padding: '10px', borderRadius: 9,
                background: '#0f172a', color: inspectLog.response_status >= 200 && inspectLog.response_status < 300 ? '#86efac' : '#fca5a5',
                fontSize: '0.71rem', overflowX: 'auto', maxHeight: 160
              }}>
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(inspectLog.response_body || '{}'), null, 2);
                  } catch {
                    return inspectLog.response_body || '';
                  }
                })()}
              </pre>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
};

export default AdsCapiPanel;
