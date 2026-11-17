import React, { useCallback, useEffect, useState } from 'react';
import { Edit3, GitBranch, Plus, RefreshCw, Save, Trash2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState, FormCard } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { ScenarioCanvas } from './ScenarioCanvas';
import {
  DEFAULT_SCENARIO_NODES,
  buildEdgesFromScenarioNodes,
  type AutomationScenarioDto,
  type ScenarioNodeDto,
  type ScenarioTriggerType,
} from './socialBotTypes';

export interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingScenario?: AutomationScenarioDto | null;
  onSaved: () => void;
}

const ScenarioModalInner: React.FC<{
  editingScenario?: AutomationScenarioDto | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ editingScenario, onClose, onSaved }) => {
  const { token, tenantSlug } = useAuth();
  const isEdit = Boolean(editingScenario?.id);

  const [name, setName] = useState(editingScenario?.name || '');
  const [channel, setChannel] = useState<AutomationScenarioDto['channel']>(
    editingScenario?.channel || 'messenger'
  );
  const [triggerType, setTriggerType] = useState<ScenarioTriggerType>(
    editingScenario?.trigger_type || 'keyword'
  );
  const [keywordsStr, setKeywordsStr] = useState(
    (editingScenario?.keywords || ['báo giá', 'tư vấn']).join(', ')
  );
  const [isActive, setIsActive] = useState(editingScenario?.is_active ?? true);
  const [nodes, setNodes] = useState<ScenarioNodeDto[]>(
    editingScenario?.nodes && editingScenario.nodes.length > 0
      ? editingScenario.nodes
      : DEFAULT_SCENARIO_NODES
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên Kịch bản tự động.');
      return;
    }
    setSaving(true);
    try {
      const keywords = keywordsStr.split(',').map((s) => s.trim()).filter(Boolean);
      const edges = buildEdgesFromScenarioNodes(nodes);
      const body = {
        name: name.trim(),
        channel,
        trigger_type: triggerType,
        keywords,
        nodes,
        edges,
        is_active: isActive,
      };

      if (isEdit && editingScenario) {
        await apiRequest(`/marketing/social-bot/scenarios/${editingScenario.id}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body,
        });
        toast.success('Đã cập nhật kịch bản tự động hóa!');
      } else {
        await apiRequest('/marketing/social-bot/scenarios', {
          method: 'POST',
          token,
          tenantSlug,
          body,
        });
        toast.success('Đã tạo kịch bản Chatbot mới trên `mkt_automation_scenarios`!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu kịch bản Chatbot.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSave(e)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 10 }}>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Tên kịch bản tự động *</label>
          <input className="form-input" style={{ height: 42 }} placeholder="VD: Kịch bản Bình luận Bài viết -> Nhắn Inbox Báo Giá" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Kênh áp dụng</label>
          <select className="form-input" style={{ height: 42 }} value={channel} onChange={(e) => setChannel(e.target.value as AutomationScenarioDto['channel'])}>
            <option value="messenger">Facebook Messenger</option>
            <option value="zalo_oa">Zalo Official Account</option>
            <option value="web_chat">Website LiveChat</option>
            <option value="omnichannel">Đa kênh (Omnichannel)</option>
          </select>
        </div>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Sự kiện kích hoạt (Trigger)</label>
          <select className="form-input" style={{ height: 42 }} value={triggerType} onChange={(e) => setTriggerType(e.target.value as ScenarioTriggerType)}>
            <option value="keyword">keyword — Khớp từ khóa tin nhắn</option>
            <option value="comment_to_inbox">comment_to_inbox — Bình luận bài viết</option>
            <option value="welcome">welcome — Lời chào mở đầu</option>
            <option value="ice_breaker">ice_breaker — Câu hỏi gợi ý nhanh</option>
            <option value="postback">postback — Nút bấm Payload</option>
          </select>
        </div>
      </div>

      {(triggerType === 'keyword' || triggerType === 'comment_to_inbox' || triggerType === 'postback') && (
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Danh sách từ khóa / Mã Postback (phân tách bằng dấu phẩy)</label>
          <input className="form-input" style={{ height: 42 }} value={keywordsStr} onChange={(e) => setKeywordsStr(e.target.value)} placeholder="báo giá, học phí, ưu đãi, VIP2026..." />
        </div>
      )}

      <ScenarioCanvas nodes={nodes} onChange={setNodes} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Kích hoạt chạy tự động ngay sau khi lưu
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>Hủy</button>
          <button
            type="submit"
            disabled={saving}
            style={{
              height: 44,
              padding: '0 1.35rem',
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
            <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu Kịch Bản Node-Edge'}
          </button>
        </div>
      </div>
    </form>
  );
};

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  editingScenario,
  onSaved,
}) => (
  <CustomModal
    isOpen={isOpen}
    onClose={onClose}
    title={editingScenario?.id ? `Thiết Kế Kịch Bản — ${editingScenario.name}` : 'Trình Thiết Kế Kịch Bản Chatbot Trực Quan (Visual Scenario Builder)'}
    width={1060}
  >
    <ScenarioModalInner
      key={editingScenario?.id || 'new-scenario'}
      editingScenario={editingScenario}
      onClose={onClose}
      onSaved={onSaved}
    />
  </CustomModal>
);

export const ScenarioManagerTab: React.FC<{ onCountChange?: (cnt: number) => void }> = ({
  onCountChange,
}) => {
  const { token, tenantSlug } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState<AutomationScenarioDto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AutomationScenarioDto | null>(null);

  const loadScenarios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ items?: AutomationScenarioDto[] }>(
        '/marketing/social-bot/scenarios',
        { token, tenantSlug }
      );
      const list = res.items || [];
      setScenarios(list);
      onCountChange?.(list.length);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách kịch bản Chatbot.'));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, onCountChange]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest<{ items?: AutomationScenarioDto[] }>(
          '/marketing/social-bot/scenarios',
          { token, tenantSlug }
        );
        if (!cancelled) {
          const list = res.items || [];
          setScenarios(list);
          onCountChange?.(list.length);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tenantSlug, onCountChange]);

  const handleToggleActive = async (sc: AutomationScenarioDto) => {
    try {
      await apiRequest(`/marketing/social-bot/scenarios/${sc.id}`, {
        method: 'PUT',
        token,
        tenantSlug,
        body: { is_active: !sc.is_active },
      });
      await loadScenarios();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đổi trạng thái kịch bản.'));
    }
  };

  const handleDelete = async (sc: AutomationScenarioDto) => {
    try {
      await apiRequest(`/marketing/social-bot/scenarios/${sc.id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã xóa kịch bản tự động.');
      await loadScenarios();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa kịch bản.'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card
        title="Kịch Bản Tự Động Hóa Tin Nhắn & Bình Luận (`mkt_automation_scenarios`)"
        subtitle="Hỗ trợ Keyword, Comment-to-Inbox, Welcome, Ice Breaker & Postback cho Messenger / Zalo OA / WebChat"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => void loadScenarios()} className="btn secondary sm" style={{ height: 40 }}>
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              style={{
                height: 40,
                padding: '0 1.1rem',
                borderRadius: 10,
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
              <Plus size={15} /> Tạo Kịch Bản Mới
            </button>
          </div>
        }
      >
        {loading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : scenarios.length === 0 ? (
          <EmptyState
            icon={<GitBranch size={24} />}
            title="Chưa có kịch bản tự động nào"
            description="Khởi tạo luồng kịch bản rẽ nhánh để tự động trả lời bình luận, thu thập SĐT và chuyển chuyên viên CSKH."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {scenarios.map((sc) => (
              <FormCard
                key={sc.id}
                icon={<Zap size={18} />}
                title={sc.name}
                description={`Kênh: ${sc.channel.toUpperCase()} • Trigger: ${sc.trigger_type} • ${(sc.nodes || []).length} nodes`}
                badge={<Badge tone={sc.is_active ? 'success' : 'neutral'}>{sc.is_active ? 'Đang chạy' : 'Tạm dừng'}</Badge>}
                footer={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.73rem', color: '#64748B' }}>
                      Khớp: <b>{sc.matched_count}</b> • Chuyển đổi: <b>{sc.converted_count}</b>
                    </span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button type="button" onClick={() => void handleToggleActive(sc)} className="btn secondary sm" style={{ height: 32 }}>
                        {sc.is_active ? 'Tắt' : 'Bật'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(sc);
                          setModalOpen(true);
                        }}
                        className="btn secondary sm"
                        style={{ height: 32, color: '#1E40FF' }}
                      >
                        <Edit3 size={13} /> Sửa Flow
                      </button>
                      <button type="button" onClick={() => void handleDelete(sc)} className="btn secondary sm" style={{ height: 32, color: '#DC2626' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </Card>

      <ScenarioModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingScenario={editing}
        onSaved={() => void loadScenarios()}
      />
    </div>
  );
};

export default ScenarioModal;
