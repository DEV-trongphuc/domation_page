import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Copy,
  Edit2,
  KeyRound,
  MousePointerClick,
  Play,
  Plus,
  RefreshCw,
  Send,
  ShoppingBag,
  Trash2,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  EmptyState,
  FormCard,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';

type FormsTabKey = 'gallery' | 'builder' | 'events' | 'otp';

interface FormFieldItem {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'phone' | 'email' | 'select' | 'textarea' | 'number' | 'checkbox';
  required?: boolean;
  placeholder?: string;
}

interface MktFormDto {
  id: string;
  name: string;
  description: string;
  public_token: string;
  status: string;
  routing_mode: 'marketing_nurture' | 'sale_round';
  target_audience_id: string | null;
  target_audience_name?: string | null;
  distribution_round_id: string | null;
  distribution_round_name?: string | null;
  require_otp: boolean;
  otp_channel: 'email' | 'sms';
  fields: FormFieldItem[];
  submission_count: number;
  created_at?: string;
}

interface CustomEventDto {
  id: string;
  event_key: string;
  event_name: string;
  event_category: 'custom' | 'purchase' | 'otp';
  trigger_count: number;
  total_revenue_vnd: number;
}

interface AudienceRef {
  id: string;
  name: string;
}

interface RoundRef {
  id: string;
  name: string;
}

interface FormsOverviewResponse {
  items?: MktFormDto[];
  audiences?: AudienceRef[];
  rounds?: RoundRef[];
  events?: CustomEventDto[];
  otp_summary?: { total_sent: number; verified_count: number };
}

export const MarketingFormsPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology, hasModule, can } = useEntitlement();
  const hasSaleRoundEntitlement = hasModule('rounds');

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FormsTabKey>('gallery');
  const [forms, setForms] = useState<MktFormDto[]>([]);
  const [audiences, setAudiences] = useState<AudienceRef[]>([]);
  const [rounds, setRounds] = useState<RoundRef[]>([]);
  const [events, setEvents] = useState<CustomEventDto[]>([]);
  const [otpSummary, setOtpSummary] = useState({ total_sent: 0, verified_count: 0 });

  // Form Builder State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('Form Đăng Ký Nhận Báo Giá & Ưu Đãi');
  const [formDesc, setFormDesc] = useState('Điền thông tin để nhận tài liệu và ưu đãi ngay lập tức.');
  const [routingMode, setRoutingMode] = useState<'marketing_nurture' | 'sale_round'>('marketing_nurture');
  const [targetAudienceId, setTargetAudienceId] = useState('');
  const [distributionRoundId, setDistributionRoundId] = useState('');
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpChannel, setOtpChannel] = useState<'email' | 'sms'>('email');
  const [fields, setFields] = useState<FormFieldItem[]>([
    { id: 'f_name', key: 'name', label: 'Họ và tên', type: 'text', required: true },
    { id: 'f_phone', key: 'phone', label: 'Số điện thoại', type: 'phone', required: true },
  ]);
  const [saving, setSaving] = useState(false);

  // Embed & Live Public Sandbox Modal
  const [embedForm, setEmbedForm] = useState<MktFormDto | null>(null);
  const [simName, setSimName] = useState('');
  const [simPhone, setSimPhone] = useState('');
  const [simEmail, setSimEmail] = useState('');
  const [simOtpCode, setSimOtpCode] = useState('');
  const [simOtpId, setSimOtpId] = useState('');

  // Custom / Purchase Event State
  const [newEventName, setNewEventName] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<'custom' | 'purchase'>('purchase');
  const [triggerModalEvent, setTriggerModalEvent] = useState<CustomEventDto | null>(null);
  const [trigPhone, setTrigPhone] = useState('');
  const [trigAmount, setTrigAmount] = useState('5000000');

  const fetchAll = useCallback(async () => {
    return apiRequest<FormsOverviewResponse>('/marketing/forms', {
      token,
      tenantSlug,
    });
  }, [token, tenantSlug]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAll();
      setForms(res.items || []);
      setAudiences(res.audiences || []);
      setRounds(res.rounds || []);
      setEvents(res.events || []);
      if (res.otp_summary) setOtpSummary(res.otp_summary);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách Biểu mẫu & Triggers.'));
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAll();
        if (cancelled) return;
        setForms(res.items || []);
        setAudiences(res.audiences || []);
        setRounds(res.rounds || []);
        setEvents(res.events || []);
        if (res.otp_summary) setOtpSummary(res.otp_summary);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  const startCreateForm = (preset: 'phone_only' | 'email_only' | 'full') => {
    setEditingId(null);
    setFormName(
      preset === 'phone_only'
        ? 'Form Thu SĐT Nhanh (Không ép nhập Email)'
        : preset === 'email_only'
          ? 'Form Đăng Ký Bản Tin Email'
          : `Form Tư Vấn ${terminology.customerLabel} Đa Trường`
    );
    setRoutingMode('marketing_nurture');
    setRequireOtp(false);
    if (preset === 'phone_only') {
      setFields([
        { id: crypto.randomUUID(), key: 'name', label: 'Họ tên', type: 'text', required: true },
        { id: crypto.randomUUID(), key: 'phone', label: 'Số điện thoại / Zalo', type: 'phone', required: true },
      ]);
    } else if (preset === 'email_only') {
      setFields([
        { id: crypto.randomUUID(), key: 'name', label: 'Họ tên', type: 'text', required: false },
        { id: crypto.randomUUID(), key: 'email', label: 'Địa chỉ Email', type: 'email', required: true },
      ]);
    } else {
      setFields([
        { id: crypto.randomUUID(), key: 'name', label: 'Họ tên', type: 'text', required: true },
        { id: crypto.randomUUID(), key: 'phone', label: 'Số điện thoại', type: 'phone', required: true },
        { id: crypto.randomUUID(), key: 'email', label: 'Email công việc', type: 'email', required: false },
        { id: crypto.randomUUID(), key: 'product_interest', label: 'Nhu cầu quan tâm', type: 'textarea', required: false },
      ]);
    }
    setActiveTab('builder');
  };

  const openEditForm = (f: MktFormDto) => {
    setEditingId(f.id);
    setFormName(f.name);
    setFormDesc(f.description || '');
    setRoutingMode(f.routing_mode);
    setTargetAudienceId(f.target_audience_id || '');
    setDistributionRoundId(f.distribution_round_id || '');
    setRequireOtp(f.require_otp);
    setOtpChannel(f.otp_channel);
    setFields(f.fields || []);
    setActiveTab('builder');
  };

  const addCustomField = (type: FormFieldItem['type'], key: string, label: string) => {
    setFields((prev) => [
      ...prev,
      { id: crypto.randomUUID(), key, label, type, required: type === 'phone' },
    ]);
  };

  const handleSaveForm = async () => {
    if (!formName.trim()) {
      toast.error('Vui lòng nhập tên Biểu mẫu.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDesc.trim(),
        routing_mode: routingMode,
        target_audience_id: targetAudienceId || null,
        distribution_round_id: routingMode === 'sale_round' ? distributionRoundId || null : null,
        require_otp: requireOtp,
        otp_channel: otpChannel,
        fields,
      };
      if (editingId) {
        await apiRequest(`/marketing/forms/${editingId}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã cập nhật Biểu mẫu thành công!');
      } else {
        await apiRequest('/marketing/forms', {
          method: 'POST',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã phát hành Biểu mẫu mới!');
      }
      await reload();
      setActiveTab('gallery');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Biểu mẫu.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteForm = async (id: string) => {
    try {
      await apiRequest(`/marketing/forms/${id}`, { method: 'DELETE', token, tenantSlug });
      toast.success('Đã xóa Biểu mẫu.');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa Biểu mẫu.'));
    }
  };

  const handleSendPublicOtp = async () => {
    if (!embedForm) return;
    const recipient = embedForm.otp_channel === 'sms' ? simPhone : simEmail || simPhone;
    if (!recipient) {
      toast.error('Vui lòng nhập SĐT hoặc Email trước khi nhận mã OTP.');
      return;
    }
    try {
      const res = await apiRequest<{ otp_id: string; sandbox_otp_code?: string }>(
        '/public/marketing/otp/send',
        {
          method: 'POST',
          body: {
            form_token: embedForm.public_token,
            recipient,
            channel: embedForm.otp_channel,
          },
        }
      );
      setSimOtpId(res.otp_id);
      if (res.sandbox_otp_code) {
        setSimOtpCode(res.sandbox_otp_code);
        toast.success(`Đã sinh mã OTP giao dịch: ${res.sandbox_otp_code}`);
      } else {
        toast.success('Đã gửi mã xác thực OTP tới khách hàng!');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi mã OTP.'));
    }
  };

  const handleTestPublicSubmit = async () => {
    if (!embedForm) return;
    try {
      if (embedForm.require_otp && simOtpId && simOtpCode) {
        await apiRequest('/public/marketing/otp/verify', {
          method: 'POST',
          body: { otp_id: simOtpId, code: simOtpCode },
        });
      }
      const res = await apiRequest<{ routing_mode: string; status: string }>(
        `/public/marketing/forms/${embedForm.public_token}/submit`,
        {
          method: 'POST',
          body: {
            name: simName || 'Khách Thử Nghiệm',
            phone: simPhone || undefined,
            email: simEmail || undefined,
            otp_id: simOtpId || undefined,
            otp_code: simOtpCode || undefined,
          },
        }
      );
      toast.success(
        res.routing_mode === 'sale_round'
          ? 'Đã gửi thành công & đẩy thẳng vào Vòng chia Sale Auto Data!'
          : 'Đã lưu hồ sơ vào kho Marketing Nurture & Tệp khách hàng!'
      );
      setEmbedForm(null);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gửi thử Biểu mẫu thất bại.'));
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventName.trim()) return;
    try {
      await apiRequest('/marketing/forms/events', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          event_name: newEventName.trim(),
          event_category: newEventCategory,
        },
      });
      setNewEventName('');
      toast.success('Đã tạo sự kiện Trigger mới!');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo sự kiện.'));
    }
  };

  const handleFireEvent = async () => {
    if (!triggerModalEvent) return;
    try {
      await apiRequest(`/marketing/forms/events/${triggerModalEvent.id}/trigger`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          phone: trigPhone,
          amount_vnd: Number(trigAmount || 0),
        },
      });
      toast.success('Đã bắn sự kiện & cập nhật Doanh thu / Flow thực tế!');
      setTriggerModalEvent(null);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể bắn sự kiện.'));
    }
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://domation.net';

  const eventColumns: Array<TableColumn<CustomEventDto>> = [
    {
      key: 'name',
      header: 'Tên Sự Kiện & Mã API',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.event_name}</div>
          <code style={{ fontSize: '0.74rem', color: '#1E40FF' }}>{r.event_key}</code>
        </div>
      ),
    },
    {
      key: 'cat',
      header: 'Loại Trigger',
      render: (r) => (
        <Badge tone={r.event_category === 'purchase' ? 'success' : 'primary'}>
          {r.event_category === 'purchase' ? 'Purchase Event (Doanh thu)' : 'Custom Event'}
        </Badge>
      ),
    },
    {
      key: 'cnt',
      header: 'Lượt Kích Hoạt',
      numeric: true,
      render: (r) => r.trigger_count.toLocaleString('vi-VN'),
    },
    {
      key: 'rev',
      header: 'Tổng Doanh Thu Ghi Nhận',
      numeric: true,
      render: (r) => <strong style={{ color: '#059669' }}>{formatVnd(r.total_revenue_vnd)}</strong>,
    },
    {
      key: 'act',
      header: 'Thao tác',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          onClick={() => setTriggerModalEvent(r)}
          className="btn secondary sm"
          style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <Play size={13} /> Giả lập bắn Event
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang tải Form Builder, Form Cards & Cổng OTP..."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#F8F9FA' }}>
      <Card padding="1.25rem 1.5rem" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 15,
                background: '#EEF2FF',
                border: '1px solid #DBEAFE',
                color: '#1E40FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MousePointerClick size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Form Builder, Form Cards & Cổng OTP Giao Dịch
                </h1>
                <Badge tone="primary">2-Mode Smart Routing</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
                Hỗ trợ Form chỉ thu SĐT hoặc chỉ thu Email — linh hoạt chọn <strong>Nuôi dưỡng Tệp</strong> hoặc <strong>Chia Sale Auto Data ngay</strong>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ScreenHelpButton screenKey="mkt_forms" />
            <button type="button" onClick={() => void reload()} className="btn secondary" style={{ height: 44 }}>
              <RefreshCw size={15} />
            </button>
            {can('forms_triggers', 'create') && (
              <button
                type="button"
                onClick={() => startCreateForm('phone_only')}
                style={{
                  height: 44,
                  padding: '0 1.2rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} /> Tạo Form Card Mới
              </button>
            )}
          </div>
        </div>
      </Card>

      <PillTabs
        tabs={[
          { key: 'gallery', label: 'Thư viện Form Cards', icon: <MousePointerClick size={15} />, count: forms.length },
          { key: 'builder', label: 'Trình Thiết Kế Biểu Mẫu', icon: <Edit2 size={15} /> },
          { key: 'events', label: 'Custom & Purchase Events', icon: <ShoppingBag size={15} />, count: events.length },
          { key: 'otp', label: 'Cổng Xác Thực OTP', icon: <KeyRound size={15} />, count: otpSummary.verified_count },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'gallery' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
            <FormCard
              icon={<Zap size={18} />}
              title="Mẫu Nhanh: Form Chỉ Thu SĐT"
              description="Tối đa tỉ lệ chuyển đổi Landing Page — không bắt buộc khách nhập Email."
              onClick={() => startCreateForm('phone_only')}
              badge={<Badge tone="primary">1 Chạm</Badge>}
            />
            <FormCard
              icon={<Send size={18} />}
              title="Mẫu Nhanh: Form Đăng Ký Email"
              description="Thu thập độc giả nhận Ebook / Newsletter vào Tệp Marketing Nurture."
              onClick={() => startCreateForm('email_only')}
              badge={<Badge tone="info">Newsletter</Badge>}
            />
            <FormCard
              icon={<CheckCircle2 size={18} />}
              title="Mẫu Nhanh: Form Tư Vấn B2B Đầy Đủ"
              description="Thu Họ tên, SĐT, Email, Nhu cầu và định tuyến thẳng vào Vòng chia Sale."
              onClick={() => startCreateForm('full')}
              badge={<Badge tone="success">High-Intent</Badge>}
            />
          </div>

          {forms.length === 0 ? (
            <EmptyState
              title="Chưa có Biểu mẫu nào được tạo"
              description="Hãy chọn một mẫu nhanh phía trên để tạo Form nhúng Website ngay lập tức."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1rem' }}>
              {forms.map((f) => (
                <FormCard
                  key={f.id}
                  icon={<MousePointerClick size={18} />}
                  title={f.name}
                  description={f.description || `${f.fields.length} trường dữ liệu`}
                  badge={
                    f.routing_mode === 'sale_round' ? (
                      <Badge tone="success">Mode B: Chia Sale Ngay</Badge>
                    ) : (
                      <Badge tone="primary">Mode A: Marketing Nurture</Badge>
                    )
                  }
                  footer={
                    <>
                      <span style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600 }}>
                        {f.submission_count.toLocaleString('vi-VN')} lượt điền • {formatShortDate(f.created_at)}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setEmbedForm(f)}
                          className="btn secondary sm"
                          style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        >
                          <Code2 size={13} /> Mã nhúng & Test
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditForm(f)}
                          className="btn secondary sm"
                          style={{ height: 36 }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteForm(f.id)}
                          className="btn secondary sm"
                          style={{ height: 36, color: '#DC2626' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  }
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {f.require_otp && <Badge tone="warning">Yêu cầu OTP ({f.otp_channel.toUpperCase()})</Badge>}
                    {f.target_audience_name && <Badge tone="info">Tệp: {f.target_audience_name}</Badge>}
                    {f.distribution_round_name && <Badge tone="purple">Vòng chia: {f.distribution_round_name}</Badge>}
                  </div>
                </FormCard>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'builder' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1rem', alignItems: 'start' }}>
          <Card title="Cấu Hình Trường Dữ Liệu & Luồng Định Tuyến 2 Chế Độ">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Tên Biểu mẫu</label>
                  <input
                    className="form-input"
                    style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Mô tả hiển thị dưới tiêu đề</label>
                  <input
                    className="form-input"
                    style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                  />
                </div>
              </div>

              {/* 2-Mode Routing Switch */}
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Chế độ xử lý {terminology.customerLabel} sau khi điền Form</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 6 }}>
                  <FormCard
                    selected={routingMode === 'marketing_nurture'}
                    onClick={() => setRoutingMode('marketing_nurture')}
                    title="Mode A: Nuôi Dưỡng Marketing (Nurture)"
                    description="Lưu status='marketing_nurture', đưa vào Tệp Data & kích hoạt Automation Flow (không làm phiền đội Sale)."
                    badge={<Badge tone="primary">Chuẩn Gói 2 & 3</Badge>}
                  />
                  <FormCard
                    selected={routingMode === 'sale_round'}
                    onClick={() => setRoutingMode('sale_round')}
                    title="Mode B: Chia Sale Auto Data Ngay"
                    description={
                      hasSaleRoundEntitlement
                        ? "Chuyển thẳng status='unassigned_pending' vào Vòng chia Fair-Share để Sale gọi ngay lập tức!"
                        : 'Định tuyến vào hàng đợi Kinh doanh (Mở đầy đủ Vòng chia ở Growth Suite).'
                    }
                    badge={<Badge tone="success">Chốt Nóng</Badge>}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Tự động thêm vào Tệp Khách hàng (Tùy chọn)</label>
                  <select
                    className="form-input"
                    style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                    value={targetAudienceId}
                    onChange={(e) => setTargetAudienceId(e.target.value)}
                  >
                    <option value="">— Không gắn cố định —</option>
                    {audiences.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                {routingMode === 'sale_round' && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 700 }}>Chọn Vòng chia Sale Auto Data đích</label>
                    <select
                      className="form-input"
                      style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                      value={distributionRoundId}
                      onChange={(e) => setDistributionRoundId(e.target.value)}
                    >
                      <option value="">— Tự động chọn Vòng chia ưu tiên —</option>
                      {rounds.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0.85rem 1rem', borderRadius: 14, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={requireOtp}
                    onChange={(e) => setRequireOtp(e.target.checked)}
                  />
                  Bật xác thực mã OTP chống số rác trước khi gửi Form
                </label>
                {requireOtp && (
                  <select
                    className="form-input"
                    style={{ height: 38, width: 180, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                    value={otpChannel}
                    onChange={(e) => setOtpChannel(e.target.value as 'email' | 'sms')}
                  >
                    <option value="email">Gửi OTP qua Email</option>
                    <option value="sms">Gửi OTP qua SMS</option>
                  </select>
                )}
              </div>

              {/* Fields Builder */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Danh sách Trường Biểu Mẫu</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => addCustomField('phone', 'phone', 'Số điện thoại')} className="btn secondary sm" style={{ height: 34 }}>+ SĐT</button>
                    <button type="button" onClick={() => addCustomField('email', 'email', 'Email')} className="btn secondary sm" style={{ height: 34 }}>+ Email</button>
                    <button type="button" onClick={() => addCustomField('text', `cf_${fields.length + 1}`, 'Trường tùy chỉnh')} className="btn secondary sm" style={{ height: 34 }}>+ Văn bản</button>
                    <button type="button" onClick={() => addCustomField('textarea', 'note', 'Ghi chú nhu cầu')} className="btn secondary sm" style={{ height: 34 }}>+ Đoạn văn</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {fields.map((fld, idx) => (
                    <div
                      key={fld.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 130px 110px 40px',
                        gap: 8,
                        alignItems: 'center',
                        padding: '0.6rem 0.75rem',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 12,
                      }}
                    >
                      <input
                        className="form-input"
                        style={{ height: 38 }}
                        value={fld.label}
                        onChange={(e) =>
                          setFields((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                        }
                      />
                      <Badge tone="neutral">{fld.type} ({fld.key})</Badge>
                      <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(fld.required)}
                          onChange={(e) =>
                            setFields((prev) => prev.map((x, i) => (i === idx ? { ...x, required: e.target.checked } : x)))
                          }
                        />
                        Bắt buộc
                      </label>
                      <button
                        type="button"
                        onClick={() => setFields((prev) => prev.filter((_, i) => i !== idx))}
                        className="btn secondary sm"
                        style={{ height: 34, color: '#DC2626' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setActiveTab('gallery')} className="btn secondary" style={{ height: 44 }}>
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveForm()}
                  style={{
                    height: 44,
                    padding: '0 1.4rem',
                    borderRadius: 12,
                    border: 'none',
                    background: '#1E40FF',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {saving ? 'Đang lưu...' : 'Lưu & Xuất Bản Form'}
                </button>
              </div>
            </div>
          </Card>

          {/* Live Form Card Preview */}
          <Card title="Xem Trước Biểu Mẫu (Bright Royal Sapphire)">
            <div style={{ padding: '1.25rem', borderRadius: 18, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>{formName}</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4, marginBottom: 14 }}>{formDesc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {fields.map((fld) => (
                  <div key={fld.id}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      {fld.label} {fld.required && <span style={{ color: '#DC2626' }}>*</span>}
                    </label>
                    <input
                      disabled
                      placeholder={`Nhập ${fld.label.toLowerCase()}...`}
                      style={{
                        width: '100%',
                        height: 44,
                        borderRadius: 12,
                        border: '1px solid #E2E8F0',
                        background: '#F8F9FA',
                        padding: '0 12px',
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>
                ))}
                {requireOtp && (
                  <Badge tone="info">Bước xác thực OTP {otpChannel.toUpperCase()} tự động hiển thị khi khách bấm gửi</Badge>
                )}
                <button
                  type="button"
                  style={{
                    marginTop: 6,
                    height: 44,
                    width: '100%',
                    borderRadius: 12,
                    border: 'none',
                    background: '#1E40FF',
                    color: '#FFFFFF',
                    fontWeight: 700,
                  }}
                >
                  Đăng ký ngay
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card title="Định Nghĩa Custom Events & Purchase Events (Ghi nhận Doanh thu & Kích hoạt Flow)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px auto', gap: 10 }}>
              <input
                className="form-input"
                style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                placeholder="Tên sự kiện (VD: Thanh toán thành công đơn hàng Website)..."
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
              />
              <select
                className="form-input"
                style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                value={newEventCategory}
                onChange={(e) => setNewEventCategory(e.target.value as 'custom' | 'purchase')}
              >
                <option value="purchase">Purchase Event (Cộng Doanh thu)</option>
                <option value="custom">Custom Behavioral Event</option>
              </select>
              <button
                type="button"
                onClick={() => void handleCreateEvent()}
                style={{
                  height: 44,
                  padding: '0 1.2rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Tạo Event
              </button>
            </div>
          </Card>

          <Table
            columns={eventColumns}
            rows={events}
            rowKey={(r) => r.id}
            emptyTitle="Chưa có Custom / Purchase Event nào"
            emptyDescription="Tạo sự kiện mua hàng hoặc hành vi tùy chỉnh để đồng bộ doanh thu thực từ Website/POS vào Hồ sơ 360°."
          />
        </div>
      )}

      {activeTab === 'otp' && (
        <Card
          title="Cổng Sinh & Xác Thực Mã OTP Giao Dịch (Email / SMS Brandname)"
          subtitle="Bảo vệ Biểu mẫu công khai khỏi Bot spam và xác thực danh tính khách hàng thời gian thực"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <FormCard
              icon={<Send size={18} />}
              title="Tổng lượt phát hành OTP"
              description="Mã 6 số băm HMAC-SHA256 hiệu lực 5 phút"
              badge={<Badge tone="primary">{otpSummary.total_sent} mã</Badge>}
            />
            <FormCard
              icon={<CheckCircle2 size={18} />}
              title="Lượt xác thực thành công"
              description="Khách hàng nhập đúng mã OTP hợp lệ"
              badge={<Badge tone="success">{otpSummary.verified_count} lượt</Badge>}
            />
          </div>
          <div style={{ padding: '1rem', borderRadius: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#334155' }}>
            <div><strong>Public Endpoint Gửi OTP:</strong> <code>POST {originUrl}/api/v1/public/marketing/otp/send</code></div>
            <div style={{ marginTop: 4 }}><strong>Public Endpoint Xác thực OTP:</strong> <code>POST {originUrl}/api/v1/public/marketing/otp/verify</code></div>
          </div>
        </Card>
      )}

      {/* Embed Snippet + Live Public Form Sandbox Modal */}
      <CustomModal
        isOpen={Boolean(embedForm)}
        onClose={() => setEmbedForm(null)}
        title={`Mã Nhúng Website & Kiểm Thử Thực Tế — ${embedForm?.name || ''}`}
        width={640}
      >
        {embedForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>1. Mã nhúng Iframe & JS SDK</span>
                <button
                  type="button"
                  onClick={() => {
                    const code = `<iframe src="${originUrl}/api/v1/public/marketing/forms/${embedForm.public_token}" width="100%" height="460" style="border:0;border-radius:16px;"></iframe>`;
                    void navigator.clipboard?.writeText(code);
                    toast.success('Đã sao chép mã nhúng!');
                  }}
                  className="btn secondary sm"
                  style={{ height: 34, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Copy size={13} /> Sao chép mã nhúng
                </button>
              </div>
              <pre
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '0.75rem',
                  fontSize: '0.74rem',
                  overflowX: 'auto',
                  color: '#0F172A',
                }}
              >{`<!-- Nhúng Form DOMATION (${embedForm.routing_mode}) -->
<iframe src="${originUrl}/api/v1/public/marketing/forms/${embedForm.public_token}" width="100%" height="460" style="border:0;border-radius:16px;"></iframe>
<!-- Hoặc gọi REST API trực tiếp: POST ${originUrl}/api/v1/public/marketing/forms/${embedForm.public_token}/submit -->`}</pre>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 8 }}>
                2. Gửi Thử Trực Tiếp Vào Cổng Public (Kiểm chứng {embedForm.routing_mode === 'sale_round' ? 'Chia Sale Auto Data' : 'Marketing Nurture'})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input
                  className="form-input"
                  style={{ height: 44 }}
                  placeholder="Họ và tên..."
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                />
                <input
                  className="form-input"
                  style={{ height: 44 }}
                  placeholder="Số điện thoại (Tùy chọn nếu có Email)..."
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                />
                <input
                  className="form-input"
                  style={{ height: 44 }}
                  placeholder="Email (Tùy chọn nếu có SĐT)..."
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                />
                {embedForm.require_otp && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      className="form-input"
                      style={{ height: 44 }}
                      placeholder="Mã OTP 6 số..."
                      value={simOtpCode}
                      onChange={(e) => setSimOtpCode(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => void handleSendPublicOtp()}
                      className="btn secondary"
                      style={{ height: 44, whiteSpace: 'nowrap', color: '#1E40FF' }}
                    >
                      Lấy OTP
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" onClick={() => setEmbedForm(null)} className="btn secondary" style={{ height: 44 }}>
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => void handleTestPublicSubmit()}
                  style={{
                    height: 44,
                    padding: '0 1.25rem',
                    borderRadius: 12,
                    border: 'none',
                    background: '#1E40FF',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Gửi Dữ Liệu Thử Nghiệm
                </button>
              </div>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Trigger Event Modal */}
      <CustomModal
        isOpen={Boolean(triggerModalEvent)}
        onClose={() => setTriggerModalEvent(null)}
        title={`Giả lập bắn Sự kiện: ${triggerModalEvent?.event_name || ''}`}
        width={440}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            className="form-input"
            style={{ height: 44 }}
            placeholder="Số điện thoại khách hàng (VD: 0909123456)..."
            value={trigPhone}
            onChange={(e) => setTrigPhone(e.target.value)}
          />
          {triggerModalEvent?.event_category === 'purchase' && (
            <input
              type="number"
              className="form-input"
              style={{ height: 44 }}
              placeholder="Giá trị đơn hàng VNĐ..."
              value={trigAmount}
              onChange={(e) => setTrigAmount(e.target.value)}
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setTriggerModalEvent(null)} className="btn secondary" style={{ height: 44 }}>
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleFireEvent()}
              style={{
                height: 44,
                padding: '0 1.2rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Kích hoạt ngay
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default MarketingFormsPage;
