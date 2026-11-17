import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Loader2,
  ShieldAlert,
  Sparkles,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AutodataApiError, apiRequest, getErrorMessage } from '../../autodataApi';
import { useOptionalAuth } from '../contexts/AuthContext';
import { Badge } from '../components/ui/AutoDataLoadingModal';
import type { ActionProposalSpec } from './actionProposalUtils';

export interface ActionProposalCardProps {
  proposal: ActionProposalSpec;
  messageId: string | number;
  token?: string | null;
  tenantSlug?: string | null;
  onExecuted?: (actionType: string, result: unknown) => void;
}

const ACTION_TYPE_LABELS: Record<string, { label: string; tone: 'primary' | 'success' | 'warning' | 'info' | 'purple' }> = {
  leave: { label: 'Đơn nghỉ phép', tone: 'info' },
  expense: { label: 'Đề xuất chi phí', tone: 'warning' },
  advance_payment: { label: 'Đề nghị tạm ứng', tone: 'warning' },
  task: { label: 'Giao việc ERP Task', tone: 'primary' },
  lead: { label: 'Tạo Lead CRM', tone: 'success' },
  deal: { label: 'Tạo Cơ hội Deal', tone: 'primary' },
  sales_order: { label: 'Đơn hàng (SO)', tone: 'success' },
  deposit: { label: 'Phiếu đặt cọc', tone: 'success' },
  approval: { label: 'Trình phê duyệt', tone: 'purple' },
};

function stringifyParamValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const ActionProposalCard: React.FC<ActionProposalCardProps> = ({
  proposal,
  messageId,
  token,
  tenantSlug,
  onExecuted,
}) => {
  const optionalAuth = useOptionalAuth();
  const resolvedToken = token ?? optionalAuth?.token ?? null;
  const resolvedTenantSlug = tenantSlug ?? optionalAuth?.tenantSlug ?? null;

  const [status, setStatus] = useState<'idle' | 'executing' | 'executed' | 'cancelled' | 'forbidden' | 'error'>('idle');
  const [isEditingParams, setIsEditingParams] = useState(false);
  const [editedParams, setEditedParams] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const [key, val] of Object.entries(proposal.params || {})) {
      map[key] = stringifyParamValue(val);
    }
    return map;
  });
  const [statusNote, setStatusNote] = useState<string>('');

  const meta = useMemo(
    () =>
      ACTION_TYPE_LABELS[proposal.action_type] || {
        label: `Tác vụ: ${proposal.action_type}`,
        tone: 'primary' as const,
      },
    [proposal.action_type]
  );

  const paramEntries = useMemo(() => Object.entries(editedParams), [editedParams]);

  const buildMergedParams = (): Record<string, unknown> => {
    const merged: Record<string, unknown> = { ...(proposal.params || {}) };
    for (const [k, strVal] of Object.entries(editedParams)) {
      const original = proposal.params?.[k];
      if (typeof original === 'number') {
        const num = Number(strVal);
        merged[k] = Number.isNaN(num) ? strVal : num;
      } else if (typeof original === 'boolean') {
        merged[k] = strVal === 'true';
      } else {
        merged[k] = strVal;
      }
    }
    return merged;
  };

  const handleConfirmExecute = async () => {
    if (status === 'executing' || status === 'executed' || status === 'cancelled') return;
    setStatus('executing');
    setStatusNote('');

    const payloadProposal: ActionProposalSpec = {
      action_type: proposal.action_type,
      title: proposal.title,
      summary: proposal.summary,
      params: buildMergedParams(),
    };

    try {
      const res = await apiRequest<Record<string, unknown>>('/dom-agent/proposals/execute', {
        method: 'POST',
        token: resolvedToken,
        tenantSlug: resolvedTenantSlug,
        body: {
          ...payloadProposal,
          message_id: messageId,
        },
      });
      setStatus('executed');
      const resultMsg =
        typeof res?.message === 'string' && res.message
          ? res.message
          : 'Đã xác nhận và thực thi thành công trên phân hệ ERP.';
      setStatusNote(resultMsg);
      toast.success('Đã thực thi đề xuất từ DOM Agent!');
      if (onExecuted) {
        onExecuted(proposal.action_type, res);
      }
    } catch (err) {
      if (err instanceof AutodataApiError && err.status === 403) {
        setStatus('forbidden');
        setStatusNote(err.message || 'Tài khoản hiện tại chưa có quyền RBAC thực thi hành động này.');
        toast.error(err.message || 'Không đủ quyền RBAC thực thi đề xuất');
      } else {
        setStatus('error');
        const msg = getErrorMessage(err, 'Không thể thực thi đề xuất hành động.');
        setStatusNote(msg);
        toast.error(msg);
      }
    }
  };

  const handleCancel = () => {
    if (status === 'executing' || status === 'executed') return;
    setStatus('cancelled');
    setStatusNote('Bạn đã hủy bỏ đề xuất ghi dữ liệu này.');
  };

  return (
    <div
      style={{
        marginTop: 10,
        borderRadius: 16,
        border:
          status === 'executed'
            ? '1.5px solid rgba(16, 185, 129, 0.35)'
            : status === 'forbidden' || status === 'error'
              ? '1.5px solid rgba(220, 38, 38, 0.32)'
              : '1.5px solid rgba(30, 64, 255, 0.24)',
        background: '#FFFFFF',
        padding: '13px 15px',
        boxShadow: '0 6px 20px -6px rgba(30, 64, 255, 0.12)',
        color: '#0F172A',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1E40FF 0%, #06B6D4 100%)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={13} />
          </span>
          <Badge tone={meta.tone}>{meta.label}</Badge>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>
            Confirm-Before-Write • DOM Agent
          </span>
        </div>

        {status === 'idle' && paramEntries.length > 0 && (
          <button
            type="button"
            onClick={() => setIsEditingParams((prev) => !prev)}
            style={{
              padding: '3px 8px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: isEditingParams ? '#EEF2FF' : '#F8FAFC',
              color: isEditingParams ? '#1E40FF' : '#475569',
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            <Edit3 size={11} />
            <span>{isEditingParams ? 'Xong chỉnh sửa' : 'Chỉnh tham số'}</span>
          </button>
        )}
      </div>

      {/* Title & Summary */}
      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
        {proposal.title}
      </div>
      <div style={{ fontSize: '0.79rem', color: '#475569', lineHeight: 1.45, marginBottom: 10 }}>
        {proposal.summary}
      </div>

      {/* Key-Value Params Preview / Editor */}
      {paramEntries.length > 0 && (
        <div
          style={{
            borderRadius: 12,
            background: '#F8F9FA',
            border: '1px solid #E2E8F0',
            padding: '9px 11px',
            marginBottom: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 8,
          }}
        >
          {paramEntries.map(([key, val]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#64748B',
                }}
              >
                {key.replace(/_/g, ' ')}
              </label>
              {isEditingParams && status === 'idle' ? (
                <input
                  type="text"
                  value={val}
                  onChange={(e) =>
                    setEditedParams((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  style={{
                    padding: '5px 8px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.76rem',
                    color: '#0F172A',
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    wordBreak: 'break-word',
                  }}
                >
                  {val || '—'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Result / Action Footer */}
      {status === 'executed' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 11px',
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.10)',
            color: '#059669',
            fontSize: '0.78rem',
            fontWeight: 700,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{statusNote}</span>
        </div>
      ) : status === 'cancelled' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 11px',
            borderRadius: 10,
            background: '#F1F5F9',
            color: '#64748B',
            fontSize: '0.78rem',
            fontWeight: 600,
          }}
        >
          <XCircle size={15} />
          <span>{statusNote}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(status === 'forbidden' || status === 'error') && statusNote && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 10px',
                borderRadius: 10,
                background: 'rgba(220, 38, 38, 0.08)',
                color: '#DC2626',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {status === 'forbidden' ? <ShieldAlert size={15} /> : <AlertCircle size={15} />}
              <span>{statusNote}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={status === 'executing'}
              onClick={handleConfirmExecute}
              style={{
                minHeight: 38,
                padding: '0 14px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: status === 'executing' ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(30, 64, 255, 0.24)',
              }}
            >
              {status === 'executing' ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Đang thực thi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Xác nhận thực thi</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={status === 'executing'}
              onClick={handleCancel}
              style={{
                minHeight: 38,
                padding: '0 13px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionProposalCard;
