import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyRound,
  MousePointerClick,
  RefreshCw,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { StudioBuilderSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { CustomEventsTab } from './CustomEventsTab';
import { FormsTab } from './FormsTab';
import { OTPTriggersTab } from './OTPTriggersTab';
import { PurchasesTab } from './PurchasesTab';
import type {
  AudienceRef,
  CustomEventDto,
  FormsOverviewResponse,
  FormsTabKey,
  MktFormDto,
  RoundRef,
} from './types';

export const MarketingFormsPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FormsTabKey>('forms');
  const [forms, setForms] = useState<MktFormDto[]>([]);
  const [audiences, setAudiences] = useState<AudienceRef[]>([]);
  const [rounds, setRounds] = useState<RoundRef[]>([]);
  const [events, setEvents] = useState<CustomEventDto[]>([]);
  const [otpSummary, setOtpSummary] = useState({ total_sent: 0, verified_count: 0 });

  const fetchOverview = useCallback(async () => {
    return apiRequest<FormsOverviewResponse>('/marketing/forms', {
      token,
      tenantSlug,
    });
  }, [token, tenantSlug]);

  const reload = useCallback(async () => {
    try {
      const res = await fetchOverview();
      setForms(res.items || []);
      setAudiences(res.audiences || []);
      setRounds(res.rounds || []);
      setEvents(res.events || []);
      if (res.otp_summary) setOtpSummary(res.otp_summary);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách Biểu mẫu & Triggers.'));
    }
  }, [fetchOverview]);

  useEffect(() => {
    let cancelled = false;
    fetchOverview()
      .then((res) => {
        if (cancelled) return;
        setForms(res.items || []);
        setAudiences(res.audiences || []);
        setRounds(res.rounds || []);
        setEvents(res.events || []);
        if (res.otp_summary) setOtpSummary(res.otp_summary);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(getErrorMessage(err, 'Không thể tải danh sách Biểu mẫu & Triggers.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchOverview]);

  const customEventsCount = useMemo(
    () => events.filter((e) => e.event_category !== 'purchase').length,
    [events]
  );
  const purchaseEventsCount = useMemo(
    () => events.filter((e) => e.event_category === 'purchase').length,
    [events]
  );

  if (loading) {
    return <StudioBuilderSkeleton />;
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
                  Form Builder Kéo Thả, Webhook Events & Cổng Xác Thực OTP
                </h1>
                <Badge tone="primary">2-Mode Smart Routing</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3, marginBottom: 0 }}>
                Thiết kế Form kéo thả (chỉ SĐT hoặc chỉ Email), nhúng 4 giao diện, đồng bộ doanh thu Purchase Webhook & kiểm soát OTP.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ScreenHelpButton screenKey="mkt_forms" />
            <button
              type="button"
              onClick={() => void reload()}
              className="btn secondary"
              style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={15} /> Làm mới
            </button>
          </div>
        </div>
      </Card>

      <PillTabs
        tabs={[
          { key: 'forms', label: 'Biểu mẫu & Mã nhúng', icon: <MousePointerClick size={15} />, count: forms.length },
          { key: 'custom_events', label: 'Custom Events & Webhook', icon: <Zap size={15} />, count: customEventsCount },
          { key: 'purchases', label: 'Purchase Events & Doanh thu', icon: <ShoppingBag size={15} />, count: purchaseEventsCount },
          { key: 'otp', label: 'Cổng Xác thực OTP & Audit', icon: <KeyRound size={15} />, count: otpSummary.verified_count },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'forms' && (
        <FormsTab forms={forms} audiences={audiences} rounds={rounds} onReload={reload} />
      )}

      {activeTab === 'custom_events' && (
        <CustomEventsTab events={events} onReload={reload} />
      )}

      {activeTab === 'purchases' && (
        <PurchasesTab events={events} onReload={reload} />
      )}

      {activeTab === 'otp' && (
        <OTPTriggersTab fallbackSummary={otpSummary} onParentReload={reload} />
      )}
    </div>
  );
};

export default MarketingFormsPage;
