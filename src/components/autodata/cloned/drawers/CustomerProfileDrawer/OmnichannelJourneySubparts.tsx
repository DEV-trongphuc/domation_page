import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { CustomModal } from '../../components/ui/CustomModal';
import type { CrmOmnichannelJourneyData, DomJourneyAiAnalysis } from '../crmTypes';

export interface DomJourneyPredictionCardProps {
  contactName: string;
  journey: CrmOmnichannelJourneyData;
  aiAnalysis: DomJourneyAiAnalysis | null;
  analyzingAi: boolean;
  onRunAnalysis: () => void;
}

export const DomJourneyPredictionCard: React.FC<DomJourneyPredictionCardProps> = ({
  contactName,
  journey,
  aiAnalysis,
  analyzingAi,
  onRunAnalysis,
}) => (
  <div
    style={{
      background: 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)',
      border: '1px solid #DBEAFE',
      borderRadius: 16,
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: '#1E40FF',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bot size={18} />
        </div>
        <div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            DOM Agent — Dự báo Hành trình & Tiềm năng Chốt
            {aiAnalysis && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#1E40FF',
                  color: '#FFFFFF',
                }}
              >
                {aiAnalysis.potential_level} ({aiAnalysis.potential_score}/100)
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
            Độ hoàn thiện hồ sơ {contactName}: <strong>{journey.completeness_pct}%</strong> • Nguồn chạm đầu:{' '}
            <strong>{journey.first_touch_source}</strong>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRunAnalysis}
        disabled={analyzingAi}
        style={{
          height: 40,
          padding: '0 14px',
          borderRadius: 10,
          border: '1px solid #1E40FF',
          background: '#FFFFFF',
          color: '#1E40FF',
          fontWeight: 700,
          fontSize: '0.8rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
        }}
      >
        <Sparkles size={14} /> {analyzingAi ? 'DOM Agent đang phân tích...' : 'Phân tích lại bằng DOM Agent'}
      </button>
    </div>

    {aiAnalysis && (
      <>
        <p style={{ margin: 0, fontSize: '0.84rem', color: '#1E293B', lineHeight: 1.55 }}>
          {aiAnalysis.summary}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '0.75rem' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1E40FF', marginBottom: 4 }}>
              HÀNH ĐỘNG KẾ TIẾP ĐỀ XUẤT (NEXT BEST ACTIONS)
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8rem', color: '#334155' }}>
              {aiAnalysis.next_best_actions.map((act, idx) => (
                <li key={idx} style={{ marginBottom: 3 }}>
                  {act}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '0.75rem' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#059669', marginBottom: 4 }}>
              NĂNG LỰC TÀI CHÍNH & NHU CẦU
            </div>
            <div style={{ fontSize: '0.8rem', color: '#334155', marginBottom: 4 }}>
              {aiAnalysis.financial_status}
            </div>
            {aiAnalysis.key_needs.map((kn, idx) => (
              <div key={idx} style={{ fontSize: '0.76rem', color: '#64748B' }}>
                • {kn}
              </div>
            ))}
          </div>
        </div>
      </>
    )}
  </div>
);

export interface OmnichannelJourneyModalsProps {
  availableFlows: Array<{ id: string; name: string }>;
  showEnrollModal: boolean;
  onCloseEnrollModal: () => void;
  selectedFlowName: string;
  onChangeFlowName: (v: string) => void;
  enrollNote: string;
  onChangeEnrollNote: (v: string) => void;
  onConfirmEnroll: () => void;
  showVoucherModal: boolean;
  onCloseVoucherModal: () => void;
  voucherCode: string;
  onChangeVoucherCode: (v: string) => void;
  voucherDiscount: number;
  onChangeVoucherDiscount: (v: number) => void;
  onConfirmVoucher: () => void;
}

export const OmnichannelJourneyModals: React.FC<OmnichannelJourneyModalsProps> = ({
  availableFlows,
  showEnrollModal,
  onCloseEnrollModal,
  selectedFlowName,
  onChangeFlowName,
  enrollNote,
  onChangeEnrollNote,
  onConfirmEnroll,
  showVoucherModal,
  onCloseVoucherModal,
  voucherCode,
  onChangeVoucherCode,
  voucherDiscount,
  onChangeVoucherDiscount,
  onConfirmVoucher,
}) => (
  <>
    <CustomModal
      isOpen={showEnrollModal}
      onClose={onCloseEnrollModal}
      title="Đưa khách hàng vào Kịch bản Tự động (Automation Flow)"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="Tên kịch bản hoặc chọn Flow..."
          value={selectedFlowName}
          onChange={(e) => onChangeFlowName(e.target.value)}
          list="crm-available-flows"
          style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }}
        />
        <datalist id="crm-available-flows">
          {availableFlows.map((f) => (
            <option key={f.id} value={f.name} />
          ))}
        </datalist>
        <textarea
          rows={3}
          placeholder="Ghi chú lý do kích hoạt..."
          value={enrollNote}
          onChange={(e) => onChangeEnrollNote(e.target.value)}
          style={{ borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 12px' }}
        />
        <button
          type="button"
          onClick={onConfirmEnroll}
          style={{ height: 44, borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
        >
          Xác nhận đưa vào Flow
        </button>
      </div>
    </CustomModal>

    <CustomModal
      isOpen={showVoucherModal}
      onClose={onCloseVoucherModal}
      title="Phát hành Mã Ưu đãi Cá nhân hóa"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="Mã ưu đãi (bỏ trống để tự sinh DOM-...)"
          value={voucherCode}
          onChange={(e) => onChangeVoucherCode(e.target.value)}
          style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }}
        />
        <input
          type="number"
          placeholder="Giá trị ưu đãi (VNĐ)"
          value={voucherDiscount}
          onChange={(e) => onChangeVoucherDiscount(Number(e.target.value || 0))}
          style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }}
        />
        <button
          type="button"
          onClick={onConfirmVoucher}
          style={{ height: 44, borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
        >
          Cấp mã Voucher ngay
        </button>
      </div>
    </CustomModal>
  </>
);
