import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Activity,
  ClipboardCheck,
  GitBranch,
  Globe,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Ticket,
} from 'lucide-react';
import { TimelineSkeleton } from '../../components/ui/Skeleton';
import type { CrmOmnichannelJourneyData, DomJourneyAiAnalysis } from '../crmTypes';
import { crmGet, crmMutate, formatDateTimeVi, type CrmAuthCreds } from '../crm360Api';
import {
  DomJourneyPredictionCard,
  OmnichannelJourneyModals,
} from './OmnichannelJourneySubparts';

export interface OmnichannelJourneyTabProps {
  contactId: string;
  contactName: string;
  canEdit: boolean;
  creds: CrmAuthCreds;
}

export const OmnichannelJourneyTab: React.FC<OmnichannelJourneyTabProps> = ({
  contactId,
  contactName,
  canEdit,
  creds,
}) => {
  const [journey, setJourney] = useState<CrmOmnichannelJourneyData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<DomJourneyAiAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [subView, setSubView] = useState<'timeline' | 'flows' | 'surveys' | 'web' | 'conversations'>('timeline');
  const [channelFilter, setChannelFilter] = useState<'all' | 'web' | 'email' | 'flow' | 'survey' | 'voucher'>('all');

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedFlowName, setSelectedFlowName] = useState('');
  const [enrollNote, setEnrollNote] = useState('');

  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(200000);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [jData, aiData] = await Promise.all([
        crmGet<CrmOmnichannelJourneyData>(`/contacts/${contactId}/omnichannel-journey`, creds),
        crmGet<DomJourneyAiAnalysis>(`/contacts/${contactId}/journey-ai-summary`, creds),
      ]);
      setJourney(jData);
      setAiAnalysis(aiData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải Hành trình Đa kênh 360°');
    } finally {
      setLoading(false);
    }
  }, [contactId, creds]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAll]);

  const handleRunDomAgentAnalysis = async () => {
    setAnalyzingAi(true);
    try {
      const res = await crmMutate<DomJourneyAiAnalysis>(
        `/contacts/${contactId}/journey-ai-summary`,
        'POST',
        creds
      );
      setAiAnalysis(res);
      toast.success('DOM Agent đã cập nhật dự báo hành trình khách hàng!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'DOM Agent phân tích thất bại');
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleEnrollFlow = async () => {
    try {
      await crmMutate(`/contacts/${contactId}/enroll-flow`, 'POST', creds, {
        flow_name: selectedFlowName || 'Kịch bản Nuôi dưỡng Khách hàng 360°',
        note: enrollNote,
      });
      toast.success('Đã đưa khách hàng vào Automation Flow');
      setShowEnrollModal(false);
      setEnrollNote('');
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể kích hoạt Flow');
    }
  };

  const handleIssueVoucher = async () => {
    try {
      await crmMutate(`/contacts/${contactId}/issue-voucher`, 'POST', creds, {
        code: voucherCode.trim() || undefined,
        discount_value: voucherDiscount,
      });
      toast.success('Đã phát hành mã Voucher cá nhân hóa');
      setShowVoucherModal(false);
      setVoucherCode('');
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cấp Voucher');
    }
  };

  if (loading || !journey) {
    return <TimelineSkeleton count={4} />;
  }

  const filteredTouchpoints = journey.touchpoints.filter(
    (tp) => channelFilter === 'all' || tp.channel === channelFilter
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      <DomJourneyPredictionCard
        contactName={contactName}
        journey={journey}
        aiAnalysis={aiAnalysis}
        analyzingAi={analyzingAi}
        onRunAnalysis={() => void handleRunDomAgentAnalysis()}
      />

      {/* Omnichannel Sub-Tabs & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(
            [
              { id: 'timeline', label: `Điểm chạm (${journey.touchpoints.length})`, icon: <Activity size={14} /> },
              { id: 'flows', label: `Flows (${journey.flow_enrollments.length})`, icon: <GitBranch size={14} /> },
              { id: 'surveys', label: `Survey (${journey.survey_responses.length})`, icon: <ClipboardCheck size={14} /> },
              { id: 'web', label: `Web/UTM (${journey.web_sessions.length})`, icon: <Globe size={14} /> },
              { id: 'conversations', label: `Hộp thư (${journey.conversations.length})`, icon: <MessageSquare size={14} /> },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setSubView(st.id)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 10,
                border: subView === st.id ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                background: subView === st.id ? '#1E40FF' : '#FFFFFF',
                color: subView === st.id ? '#FFFFFF' : '#475569',
                fontSize: '0.79rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              {st.icon} {st.label}
            </button>
          ))}
        </div>

        {canEdit && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowEnrollModal(true)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid #DBEAFE',
                background: '#EFF6FF',
                color: '#1E40FF',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Đưa vào Flow
            </button>
            <button
              type="button"
              onClick={() => setShowVoucherModal(true)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#0F172A',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <Ticket size={14} color="#1E40FF" /> Cấp Voucher
            </button>
          </div>
        )}
      </div>

      {subView === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'web', 'email', 'flow', 'survey', 'voucher'] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannelFilter(ch)}
                style={{
                  height: 32,
                  padding: '0 10px',
                  borderRadius: 999,
                  border: '1px solid #E2E8F0',
                  background: channelFilter === ch ? '#EFF6FF' : '#FFFFFF',
                  color: channelFilter === ch ? '#1E40FF' : '#64748B',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {ch === 'all' ? 'Mọi kênh' : ch.toUpperCase()}
              </button>
            ))}
          </div>

          {filteredTouchpoints.length === 0 ? (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '2rem',
                textAlign: 'center',
                color: '#64748B',
                fontSize: '0.84rem',
              }}
            >
              Chưa ghi nhận điểm chạm đa kênh ở bộ lọc hiện tại.
            </div>
          ) : (
            filteredTouchpoints.map((tp) => (
              <div
                key={tp.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Mail size={16} color="#1E40FF" />
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{tp.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{tp.detail}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  {formatDateTimeVi(tp.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {subView !== 'timeline' && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>
              Chi tiết phân lớp: {subView.toUpperCase()}
            </strong>
            <button
              type="button"
              onClick={() => void loadAll()}
              style={{ border: 'none', background: 'transparent', color: '#1E40FF', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
            >
              <RefreshCw size={13} /> Đồng bộ
            </button>
          </div>
          <div style={{ fontSize: '0.83rem', color: '#475569' }}>
            Email/ZNS đã gửi: <strong>{journey.email_claims.length}</strong> • Flow đang tham gia:{' '}
            <strong>{journey.flow_enrollments.length}</strong> • Phản hồi Survey:{' '}
            <strong>{journey.survey_responses.length}</strong> • Phiên Web:{' '}
            <strong>{journey.web_sessions.length}</strong> • Hội thoại Social:{' '}
            <strong>{journey.conversations.length}</strong>.
          </div>
        </div>
      )}

      <OmnichannelJourneyModals
        availableFlows={journey.available_flows}
        showEnrollModal={showEnrollModal}
        onCloseEnrollModal={() => setShowEnrollModal(false)}
        selectedFlowName={selectedFlowName}
        onChangeFlowName={setSelectedFlowName}
        enrollNote={enrollNote}
        onChangeEnrollNote={setEnrollNote}
        onConfirmEnroll={() => void handleEnrollFlow()}
        showVoucherModal={showVoucherModal}
        onCloseVoucherModal={() => setShowVoucherModal(false)}
        voucherCode={voucherCode}
        onChangeVoucherCode={setVoucherCode}
        voucherDiscount={voucherDiscount}
        onChangeVoucherDiscount={setVoucherDiscount}
        onConfirmVoucher={() => void handleIssueVoucher()}
      />
    </div>
  );
};

export default OmnichannelJourneyTab;
