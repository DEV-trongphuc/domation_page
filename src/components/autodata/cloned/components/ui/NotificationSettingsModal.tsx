import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Check,
  Copy,
  RefreshCw,
  ArrowLeft,
  Save,
  Sliders,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from './CustomModal';
import { ModalBodySkeleton } from './Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { apiRequest } from '../../../autodataApi';
import { fetchAPI } from '../../utils/api';
import { generateBrandedQrSvg } from '../../modules/marketing-vouchers/qrGenerator';

export interface NotificationSettingsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onBack?: () => void;
}

export interface NotificationChannelConfig {
  in_app: boolean;
  web_push: boolean;
  email: boolean;
  zalo_bot: boolean;
}

export type NotificationMatrixConfig = Record<string, NotificationChannelConfig>;

interface NotificationEventDescriptor {
  key: string;
  title: string;
  description: string;
  category: 'crm' | 'sla' | 'erp' | 'system';
  audience: 'all' | 'sale' | 'admin_manager';
  defaults: NotificationChannelConfig;
}

const NOTIFICATION_EVENTS: NotificationEventDescriptor[] = [
  {
    key: 'lead_assigned',
    title: 'Nhận Data / Lead mới được phân bổ',
    description: 'Thông báo tức thì khi vòng phân bổ giao Lead mới cho bạn hoặc đội nhóm.',
    category: 'crm',
    audience: 'sale',
    defaults: { in_app: true, web_push: true, email: false, zalo_bot: true },
  },
  {
    key: 'lead_sla_warning',
    title: 'Cảnh báo SLA & Quá hạn liên hệ',
    description: 'Nhắc nhở trước khi Data vượt ngưỡng thời gian phản hồi đầu tiên.',
    category: 'sla',
    audience: 'all',
    defaults: { in_app: true, web_push: true, email: true, zalo_bot: true },
  },
  {
    key: 'appointment_reminder',
    title: 'Nhắc lịch hẹn & Lịch gọi khách hàng',
    description: 'Cảnh báo 15 phút trước lịch hẹn tư vấn 1-1 hoặc cuộc gọi follow-up.',
    category: 'crm',
    audience: 'all',
    defaults: { in_app: true, web_push: true, email: true, zalo_bot: false },
  },
  {
    key: 'deal_stage_changed',
    title: 'Chuyển giai đoạn Deal / Chốt đơn',
    description: 'Cập nhật khi Deal tiến triển, cần duyệt báo giá hoặc phát sinh đặt cọc.',
    category: 'crm',
    audience: 'all',
    defaults: { in_app: true, web_push: false, email: true, zalo_bot: false },
  },
  {
    key: 'ticket_gatekeeper_alert',
    title: 'Ticket lỗi Data & Gatekeeper bất thường',
    description: 'Gửi cảnh báo khi có yêu cầu hoàn tác/báo lỗi Data hoặc lead rò rỉ cần duyệt.',
    category: 'sla',
    audience: 'admin_manager',
    defaults: { in_app: true, web_push: true, email: true, zalo_bot: true },
  },
  {
    key: 'approval_pending',
    title: 'Đề xuất Phê duyệt Đa cấp (Nghỉ phép / Chi phí)',
    description: 'Thông báo ngay khi có phiếu chờ duyệt hoặc đề xuất của bạn được xử lý.',
    category: 'erp',
    audience: 'all',
    defaults: { in_app: true, web_push: true, email: true, zalo_bot: false },
  },
  {
    key: 'workchat_mention',
    title: 'WorkChat @mention & Tin nhắn quan trọng',
    description: 'Nhận chuông khi đồng nghiệp nhắc tên bạn trong kênh hoặc luồng công việc.',
    category: 'erp',
    audience: 'all',
    defaults: { in_app: true, web_push: true, email: false, zalo_bot: false },
  },
  {
    key: 'daily_digest_report',
    title: 'Báo cáo Tổng hợp cuối ngày (Daily Digest)',
    description: 'Tóm tắt KPI cuộc gọi, tỷ lệ chuyển đổi và dòng tiền gửi lúc 18:00 hàng ngày.',
    category: 'system',
    audience: 'admin_manager',
    defaults: { in_app: true, web_push: false, email: true, zalo_bot: false },
  },
];

function buildDefaultMatrix(): NotificationMatrixConfig {
  const initial: NotificationMatrixConfig = {};
  for (const evt of NOTIFICATION_EVENTS) {
    initial[evt.key] = { ...evt.defaults };
  }
  return initial;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen: controlledOpen,
  onClose: controlledOnClose,
  onBack,
}) => {
  const { user, token, tenantSlug } = useAuth();
  const { can, canScreen, isTenantOwner } = useEntitlement();

  const [eventOpen, setEventOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'email' | 'zalo'>('matrix');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [matrixConfig, setMatrixConfig] = useState<NotificationMatrixConfig>(buildDefaultMatrix);
  const [zaloConnected, setZaloConnected] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const isControlled = typeof controlledOpen === 'boolean';
  const isOpen = isControlled ? Boolean(controlledOpen) : eventOpen;

  const isAdminOrManager = useMemo(
    () =>
      isTenantOwner ||
      can('org_rbac', 'approve') ||
      can('tickets_data', 'approve') ||
      can('erp_approvals', 'approve') ||
      canScreen('settings'),
    [isTenantOwner, can, canScreen]
  );

  const isSaleUser = useMemo(
    () => Boolean(user?.consultant_id) || canScreen('sale_portal'),
    [user?.consultant_id, canScreen]
  );

  const visibleEvents = useMemo(
    () =>
      NOTIFICATION_EVENTS.filter((evt) => {
        if (evt.audience === 'admin_manager') return isAdminOrManager;
        if (evt.audience === 'sale') return isSaleUser || isAdminOrManager;
        return true;
      }),
    [isAdminOrManager, isSaleUser]
  );

  useEffect(() => {
    if (isControlled) return undefined;
    const handleOpen = () => {
      setEventOpen(true);
    };
    window.addEventListener('open-notification-settings', handleOpen);
    return () => {
      window.removeEventListener('open-notification-settings', handleOpen);
    };
  }, [isControlled]);

  const fetchSettingsSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      let data: Record<string, unknown> | null = null;
      try {
        data = await apiRequest<Record<string, unknown>>('/notifications/settings', {
          token: token || undefined,
          tenantSlug: tenantSlug || undefined,
        });
      } catch {
        data = (await fetchAPI('notifications/settings')) as Record<string, unknown> | null;
      }

      const rawMatrix = (data?.matrix_config ?? data?.matrixConfig ?? data?.settings) as
        | Record<string, Partial<NotificationChannelConfig>>
        | undefined;
      if (rawMatrix && typeof rawMatrix === 'object') {
        setMatrixConfig((prev) => {
          const next: NotificationMatrixConfig = { ...prev };
          for (const evt of NOTIFICATION_EVENTS) {
            const incoming = rawMatrix[evt.key];
            if (incoming && typeof incoming === 'object') {
              next[evt.key] = {
                in_app: incoming.in_app ?? evt.defaults.in_app,
                web_push: incoming.web_push ?? evt.defaults.web_push,
                email: incoming.email ?? evt.defaults.email,
                zalo_bot: incoming.zalo_bot ?? evt.defaults.zalo_bot,
              };
            }
          }
          return next;
        });
      }
      if (typeof data?.zalo_connected === 'boolean') {
        setZaloConnected(data.zalo_connected);
      }
    } catch {
      // Fall back silently to defaults if workspace endpoint is not yet provisioned
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    queueMicrotask(() => {
      if (active) {
        void fetchSettingsSnapshot();
      }
    });
    return () => {
      active = false;
    };
  }, [isOpen, fetchSettingsSnapshot]);

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setEventOpen(false);
    }
  };

  const toggleChannel = (eventKey: string, channel: keyof NotificationChannelConfig) => {
    setMatrixConfig((prev) => {
      const current = prev[eventKey] || {
        in_app: true,
        web_push: false,
        email: false,
        zalo_bot: false,
      };
      return {
        ...prev,
        [eventKey]: {
          ...current,
          [channel]: !current[channel],
        },
      };
    });
  };

  const toggleColumnAll = (channel: keyof NotificationChannelConfig) => {
    const allEnabled = visibleEvents.every((evt) => Boolean(matrixConfig[evt.key]?.[channel]));
    setMatrixConfig((prev) => {
      const next = { ...prev };
      for (const evt of visibleEvents) {
        const cur = next[evt.key] || { ...evt.defaults };
        next[evt.key] = { ...cur, [channel]: !allEnabled };
      }
      return next;
    });
  };

  const handleResetDefaults = () => {
    setMatrixConfig(buildDefaultMatrix());
    toast.success('Đã khôi phục cấu hình thông báo mặc định');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      try {
        await apiRequest('/notifications/settings', {
          method: 'POST',
          token: token || undefined,
          tenantSlug: tenantSlug || undefined,
          body: { matrix_config: matrixConfig },
        });
      } catch {
        await fetchAPI('notifications/settings', {
          method: 'POST',
          body: JSON.stringify({ matrix_config: matrixConfig }),
        });
      }
      toast.success('Đã lưu cấu hình thông báo DOMATION');
      handleClose();
    } catch {
      toast.error('Không thể lưu lên máy chủ lúc này, thay đổi chỉ giữ tạm trong phiên');
    } finally {
      setSaving(false);
    }
  };

  const verificationToken = useMemo(() => {
    const slug = (tenantSlug || 'workspace').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const uid = user?.id ?? 1;
    return `/verify_domation ${slug}:${uid}`;
  }, [tenantSlug, user?.id]);

  const zaloBotQrSvg = useMemo(() => {
    const encoded = encodeURIComponent(verificationToken);
    return generateBrandedQrSvg({
      value: `https://zalo.me/s/domation-notify?code=${encoded}`,
      fgColor: '#1E40FF',
      bgColor: '#FFFFFF',
      cornerRadius: 8,
      logoUrl: '/imgs/autodata/ICON.png',
    });
  }, [verificationToken]);

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(verificationToken);
      setCopiedCode(true);
      toast.success('Đã sao chép lệnh liên kết Zalo Bot');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error('Không thể sao chép lệnh');
    }
  };

  const tabButtonStyle = (active: boolean): React.CSSProperties => ({
    height: '44px',
    minHeight: '44px',
    padding: '0 16px',
    borderRadius: '10px',
    border: active ? '1px solid #BFDBFE' : '1px solid transparent',
    backgroundColor: active ? '#EFF6FF' : 'transparent',
    color: active ? '#1E40FF' : '#475569',
    fontWeight: active ? 700 : 600,
    fontSize: '0.86rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  const renderToggleCell = (checked: boolean, onClick: () => void, label: string) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
      style={{
        width: '44px',
        height: '26px',
        borderRadius: '999px',
        border: 'none',
        padding: '3px',
        backgroundColor: checked ? '#1E40FF' : '#CBD5E1',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        cursor: 'pointer',
        transition: 'background-color 0.18s ease',
      }}
    >
      <span
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.25)',
        }}
      />
    </button>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Trung tâm Cấu hình Thông báo & Cảnh báo"
      width="820px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header Bar with Tabs & Back */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '12px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                style={{
                  height: '44px',
                  minHeight: '44px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  marginRight: '4px',
                }}
              >
                <ArrowLeft size={16} />
                <span>Quay lại</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              style={tabButtonStyle(activeTab === 'matrix')}
            >
              <Sliders size={16} />
              <span>Ma trận Kênh nhận</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              style={tabButtonStyle(activeTab === 'email')}
            >
              <Mail size={16} />
              <span>Email & Gmail Alert</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('zalo')}
              style={tabButtonStyle(activeTab === 'zalo')}
            >
              <MessageSquare size={16} />
              <span>Zalo Bot & QR Liên kết</span>
            </button>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#1E40FF',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={14} />
            {isAdminOrManager ? 'Quyền Quản trị / Trưởng nhóm' : 'Thông báo Cá nhân'}
          </span>
        </div>

        {/* Body */}
        {loading ? (
          <ModalBodySkeleton rows={6} />
        ) : activeTab === 'matrix' ? (
          <div
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: '#F8FAFF',
                      borderBottom: '1px solid #E2E8F0',
                    }}
                  >
                    <th
                      style={{
                        padding: '12px 16px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Sự kiện kích hoạt
                    </th>
                    {(
                      [
                        { key: 'in_app', label: 'In-App', icon: Bell },
                        { key: 'web_push', label: 'Web Push', icon: Smartphone },
                        { key: 'email', label: 'Email', icon: Mail },
                        { key: 'zalo_bot', label: 'Zalo Bot', icon: MessageSquare },
                      ] as const
                    ).map((col) => {
                      const Icon = col.icon;
                      return (
                        <th
                          key={col.key}
                          style={{
                            padding: '12px 12px',
                            textAlign: 'center',
                            width: '96px',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleColumnAll(col.key)}
                            title={`Bật / tắt tất cả ${col.label}`}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#1E3A8A',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            <Icon size={15} color="#1E40FF" />
                            <span>{col.label}</span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {visibleEvents.map((evt, idx) => {
                    const rowCfg = matrixConfig[evt.key] || evt.defaults;
                    return (
                      <tr
                        key={evt.key}
                        style={{
                          borderBottom:
                            idx < visibleEvents.length - 1 ? '1px solid #F1F5F9' : 'none',
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0F172A' }}>
                            {evt.title}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                            {evt.description}
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {renderToggleCell(
                            Boolean(rowCfg.in_app),
                            () => toggleChannel(evt.key, 'in_app'),
                            `${evt.title} - In-App`
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {renderToggleCell(
                            Boolean(rowCfg.web_push),
                            () => toggleChannel(evt.key, 'web_push'),
                            `${evt.title} - Web Push`
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {renderToggleCell(
                            Boolean(rowCfg.email),
                            () => toggleChannel(evt.key, 'email'),
                            `${evt.title} - Email`
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {renderToggleCell(
                            Boolean(rowCfg.zalo_bot),
                            () => toggleChannel(evt.key, 'zalo_bot'),
                            `${evt.title} - Zalo Bot`
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'email' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              padding: '18px',
              borderRadius: '14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <img
                  src="/imgs/autodata/gmail-icon-free-png.webp"
                  alt="Gmail"
                  style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>
                  Cảnh báo qua Email Doanh nghiệp & Gmail Digest
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                  Thông báo quan trọng được gửi tới địa chỉ:{' '}
                  <strong style={{ color: '#1E40FF' }}>
                    {user?.email || 'Chưa cập nhật email tài khoản'}
                  </strong>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: '#F8FAFF',
                border: '1px solid #BFDBFE',
                color: '#1E3A8A',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.82rem',
                lineHeight: 1.6,
              }}
            >
              <div>[DOMATION Alert] Subject: Cảnh báo SLA Data #LD-2048 sắp quá hạn</div>
              <div>Recipient: {user?.email || 'member@company.vn'}</div>
              <div>Trigger: CRM Gatekeeper &gt; 15 phút chưa ghi nhận cuộc gọi đầu</div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                color: '#475569',
              }}
            >
              <Sparkles size={15} color="#1E40FF" />
              <span>
                Bật cột <strong>Email</strong> trong Ma trận Kênh nhận để nhận tóm tắt tự động.
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 230px',
              gap: '18px',
              padding: '18px',
              borderRadius: '14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: zaloConnected ? '#DCFCE7' : '#EFF6FF',
                    color: zaloConnected ? '#15803D' : '#1E40FF',
                    border: zaloConnected ? '1px solid #BBF7D0' : '1px solid #BFDBFE',
                  }}
                >
                  {zaloConnected ? 'Đã liên kết Zalo Bot' : 'Chờ quét liên kết Zalo Bot'}
                </span>
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#0F172A' }}>
                Kết nối Zalo OA / Bot nhận thông báo tức thì
              </div>
              <p style={{ margin: 0, fontSize: '0.83rem', color: '#64748B', lineHeight: 1.55 }}>
                Quét mã QR bên cạnh bằng Zalo hoặc gửi lệnh xác thực bên dưới vào khung chat
                của DOMATION Official Bot để đồng bộ thông báo thời gian thực.
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFF',
                  border: '1px solid #BFDBFE',
                  color: '#1E3A8A',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '0.82rem',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {verificationToken}
                </span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  style={{
                    height: '36px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid #BFDBFE',
                    backgroundColor: '#FFFFFF',
                    color: '#1E40FF',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>

            <div
              style={{
                width: '216px',
                height: '216px',
                padding: '10px',
                borderRadius: '14px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #BFDBFE',
                boxShadow: '0 8px 20px -6px rgba(30, 64, 255, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <div
                style={{ width: '100%', height: '100%' }}
                dangerouslySetInnerHTML={{ __html: zaloBotQrSvg }}
              />
            </div>
          </div>
        )}

        {/* Footer CTA Bar - 44px controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            paddingTop: '10px',
            borderTop: '1px solid #E2E8F0',
          }}
        >
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              height: '44px',
              minHeight: '44px',
              padding: '0 14px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.84rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} />
            <span>Khôi phục mặc định</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                height: '44px',
                minHeight: '44px',
                padding: '0 16px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                height: '44px',
                minHeight: '44px',
                padding: '0 20px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.86rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: saving ? 'wait' : 'pointer',
                opacity: saving ? 0.75 : 1,
                boxShadow: '0 4px 12px rgba(30, 64, 255, 0.24)',
              }}
            >
              <Save size={16} />
              <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
            </button>
          </div>
        </div>
      </div>
    </CustomModal>
  );
};

export default NotificationSettingsModal;
