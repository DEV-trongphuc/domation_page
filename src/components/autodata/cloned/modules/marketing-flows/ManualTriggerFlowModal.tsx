import React, { useCallback, useEffect, useState } from 'react';
import { Layers, Play, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';

export interface ManualTriggerFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowId: string | null;
  flowName: string;
  audiences: Array<{ id: string; name: string; audience_type?: string }>;
  onTriggered: () => Promise<void>;
}

interface LeadCandidate {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export const ManualTriggerFlowModal: React.FC<ManualTriggerFlowModalProps> = ({
  isOpen,
  onClose,
  flowId,
  flowName,
  audiences,
  onTriggered,
}) => {
  const { token, tenantSlug } = useAuth();

  const [mode, setMode] = useState<'audience' | 'leads'>('audience');
  const [audienceId, setAudienceId] = useState('');
  const [leadCandidates, setLeadCandidates] = useState<LeadCandidate[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [manualIdsText, setManualIdsText] = useState('');
  const [skipWaitDelay, setSkipWaitDelay] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchRecentLeads = useCallback(async () => {
    const res = await apiRequest<{ items?: Array<Record<string, unknown>>; leads?: Array<Record<string, unknown>> }>(
      '/leads?limit=25',
      { token, tenantSlug }
    );
    const list = res?.items || res?.leads || [];
    return list.map((l) => ({
      id: String(l.id || ''),
      name: String(l.name || l.full_name || l.email || 'Khách hàng'),
      email: l.email ? String(l.email) : undefined,
      phone: l.phone ? String(l.phone) : undefined,
    })).filter((x) => Boolean(x.id));
  }, [token, tenantSlug]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetchRecentLeads()
      .then((rows) => {
        if (!cancelled) setLeadCandidates(rows);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, fetchRecentLeads]);

  const toggleLead = (id: string) => {
    setSelectedLeadIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDispatch = async () => {
    if (!flowId) {
      toast.error('Vui lòng lưu kịch bản trước khi kích hoạt thủ công.');
      return;
    }

    const extraIds = manualIdsText
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const mergedLeadIds = Array.from(new Set([...selectedLeadIds, ...extraIds]));

    if (mode === 'audience' && !audienceId) {
      toast.error('Vui lòng chọn Tệp khách hàng đích.');
      return;
    }
    if (mode === 'leads' && mergedLeadIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 Hồ sơ khách hàng (lead_ids).');
      return;
    }

    setRunning(true);
    try {
      const res = await apiRequest<{ enrolled_count?: number; processed?: number }>(
        `/marketing/flows/${flowId}/manual-trigger`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body:
            mode === 'audience'
              ? { audience_id: audienceId, skip_wait_delay: skipWaitDelay }
              : { lead_ids: mergedLeadIds, skip_wait_delay: skipWaitDelay },
        }
      );
      const count = res?.enrolled_count ?? res?.processed ?? (mode === 'leads' ? mergedLeadIds.length : 1);
      toast.success(`Đã kích hoạt kịch bản "${flowName}" cho ${count} khách hàng!`);
      await onTriggered();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể kích hoạt thủ công Automation Flow.'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Kích Hoạt Thủ Công 1 Chạm: ${flowName}`}
      width={600}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            type="button"
            onClick={() => setMode('audience')}
            style={{
              height: 40,
              borderRadius: 10,
              border: mode === 'audience' ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
              background: mode === 'audience' ? '#EEF2FF' : '#FFFFFF',
              color: mode === 'audience' ? '#1E40FF' : '#475569',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Layers size={15} /> Theo Tệp Khách Hàng (`audience_id`)
          </button>

          <button
            type="button"
            onClick={() => setMode('leads')}
            style={{
              height: 40,
              borderRadius: 10,
              border: mode === 'leads' ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
              background: mode === 'leads' ? '#EEF2FF' : '#FFFFFF',
              color: mode === 'leads' ? '#1E40FF' : '#475569',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Users size={15} /> Chọn Từng Hồ Sơ (`lead_ids`)
          </button>
        </div>

        {mode === 'audience' ? (
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Chọn Tệp Đích Đưa Vào Luồng</label>
            <select
              className="form-input"
              style={{ height: 44 }}
              value={audienceId}
              onChange={(e) => setAudienceId(e.target.value)}
            >
              <option value="">— Chọn Tệp Data / Tệp Logic —</option>
              {audiences.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.audience_type === 'dynamic_logic' ? 'Logic Động' : 'Data Tĩnh'})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leadCandidates.length > 0 && (
              <div style={{ maxHeight: 190, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, padding: 8, borderRadius: 12, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
                {leadCandidates.map((lead) => {
                  const checked = selectedLeadIds.includes(lead.id);
                  return (
                    <label
                      key={lead.id}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 8, background: checked ? '#EEF2FF' : '#FFFFFF', cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleLead(lead.id)}
                          style={{ marginRight: 8, accentColor: '#1E40FF' }}
                        />
                        {lead.name} {lead.email ? `(${lead.email})` : ''}
                      </span>
                      {checked && <Badge tone="primary">Đã chọn</Badge>}
                    </label>
                  );
                })}
              </div>
            )}

            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Hoặc dán danh sách `lead_id` (ngăn cách bằng dấu phẩy)</label>
              <input
                className="form-input"
                style={{ height: 40 }}
                placeholder="uuid-1, uuid-2..."
                value={manualIdsText}
                onChange={(e) => setManualIdsText(e.target.value)}
              />
            </div>
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={skipWaitDelay}
            onChange={(e) => setSkipWaitDelay(e.target.checked)}
            style={{ accentColor: '#1E40FF' }}
          />
          Thực thi xuyên suốt các bước tức thì (Bỏ qua độ trễ Wait khi test nhanh)
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>
            Hủy
          </button>
          <button
            type="button"
            disabled={running}
            onClick={() => void handleDispatch()}
            style={{
              height: 44,
              padding: '0 1.25rem',
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
            <Play size={15} /> {running ? 'Đang kích hoạt...' : 'Chạy Kịch Bản Ngay'}
          </button>
        </div>
      </div>
    </CustomModal>
  );
};

export default ManualTriggerFlowModal;
