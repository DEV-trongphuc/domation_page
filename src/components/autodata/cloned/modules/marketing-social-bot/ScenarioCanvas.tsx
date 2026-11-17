import React, { useState } from 'react';
import {
  ArrowDown,
  GitBranch,
  Headphones,
  MessageSquare,
  MousePointerClick,
  Phone,
  Plus,
  Tag,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import type {
  ScenarioNodeButtonDto,
  ScenarioNodeDto,
  ScenarioNodeKind,
} from './socialBotTypes';

export interface ScenarioCanvasProps {
  nodes: ScenarioNodeDto[];
  onChange: (nextNodes: ScenarioNodeDto[]) => void;
}

const NODE_KIND_META: Record<
  ScenarioNodeKind,
  { label: string; badgeTone: 'primary' | 'info' | 'purple' | 'success' | 'warning' }
> = {
  message: { label: 'Tin nhắn tự động', badgeTone: 'primary' },
  button: { label: 'Menu Nút bấm rẽ nhánh', badgeTone: 'info' },
  tag: { label: 'Gắn nhãn CRM Tag', badgeTone: 'purple' },
  collect_phone: { label: 'Thu thập SĐT / Email 360°', badgeTone: 'success' },
  handoff: { label: 'Chuyển Chuyên viên CSKH', badgeTone: 'warning' },
};

const renderNodeIcon = (kind: ScenarioNodeKind) => {
  if (kind === 'button') return <MousePointerClick size={15} />;
  if (kind === 'tag') return <Tag size={15} />;
  if (kind === 'collect_phone') return <Phone size={15} />;
  if (kind === 'handoff') return <Headphones size={15} />;
  return <MessageSquare size={15} />;
};

export const ScenarioCanvas: React.FC<ScenarioCanvasProps> = ({ nodes, onChange }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || '');
  const [zoomPct, setZoomPct] = useState<number>(100);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0] || null;

  const updateSelected = (patch: Partial<ScenarioNodeDto>) => {
    if (!selectedNode) return;
    onChange(nodes.map((n) => (n.id === selectedNode.id ? { ...n, ...patch } : n)));
  };

  const handleAddNode = (kind: ScenarioNodeKind) => {
    const newId = `node_${crypto.randomUUID().slice(0, 6)}`;
    const newNode: ScenarioNodeDto = {
      id: newId,
      kind,
      title: `${NODE_KIND_META[kind].label} #${nodes.length + 1}`,
      content:
        kind === 'collect_phone'
          ? 'Bạn vui lòng để lại Số điện thoại hoặc Email để nhận ưu đãi nhé!'
          : kind === 'handoff'
            ? 'Đang chuyển hội thoại tới chuyên viên tư vấn trực tiếp...'
            : 'Nhập nội dung phản hồi tự động tại đây...',
      tag_name: kind === 'tag' ? 'Quan tâm Social' : undefined,
      buttons:
        kind === 'button'
          ? [{ id: `btn_${crypto.randomUUID().slice(0, 4)}`, label: 'Tư vấn ngay', action_type: 'next_node' }]
          : undefined,
    };
    onChange([...nodes, newNode]);
    setSelectedNodeId(newId);
  };

  const handleDeleteNode = (id: string) => {
    if (nodes.length <= 1) return;
    const remaining = nodes
      .filter((n) => n.id !== id)
      .map((n) => ({
        ...n,
        next_node_id: n.next_node_id === id ? undefined : n.next_node_id,
        buttons: n.buttons?.map((b) => (b.next_node_id === id ? { ...b, next_node_id: undefined } : b)),
      }));
    onChange(remaining);
    if (selectedNode?.id === id) setSelectedNodeId(remaining[0]?.id || '');
  };

  const handleAddButton = () => {
    if (!selectedNode) return;
    const nextButtons: ScenarioNodeButtonDto[] = [
      ...(selectedNode.buttons || []),
      {
        id: `btn_${crypto.randomUUID().slice(0, 5)}`,
        label: `Lựa chọn ${(selectedNode.buttons?.length || 0) + 1}`,
        action_type: 'next_node',
      },
    ];
    updateSelected({ buttons: nextButtons });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) 330px', gap: 14, alignItems: 'start' }}>
      <div style={{ borderRadius: 16, border: '1px solid #E2E8F0', background: '#F8F9FA', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {(Object.keys(NODE_KIND_META) as ScenarioNodeKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleAddNode(k)}
                style={{
                  height: 32,
                  padding: '0 0.65rem',
                  borderRadius: 8,
                  border: '1px solid #DBEAFE',
                  background: '#FFFFFF',
                  color: '#1E40FF',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <Plus size={12} /> {NODE_KIND_META[k].label.split(' ')[0]} {k === 'collect_phone' ? 'SĐT' : k}
              </button>
            ))}
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FFFFFF', padding: '2px 6px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <button type="button" onClick={() => setZoomPct((z) => Math.max(80, z - 10))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>{zoomPct}%</span>
            <button type="button" onClick={() => setZoomPct((z) => Math.min(115, z + 10))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
              <ZoomIn size={13} />
            </button>
          </div>
        </div>

        <div style={{ maxHeight: 420, overflowY: 'auto', padding: '0.5rem' }}>
          <div
            style={{
              transform: `scale(${zoomPct / 100})`,
              transformOrigin: 'top center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {nodes.map((node, idx) => {
              const isSel = selectedNode?.id === node.id;
              const meta = NODE_KIND_META[node.kind] || NODE_KIND_META.message;
              const targetTitle = node.next_node_id ? nodes.find((x) => x.id === node.next_node_id)?.title : null;

              return (
                <React.Fragment key={node.id}>
                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    style={{
                      width: 'min(360px, 100%)',
                      padding: '0.85rem 1rem',
                      borderRadius: 16,
                      background: '#FFFFFF',
                      border: isSel ? '2px solid #1E40FF' : '1px solid #E2E8F0',
                      boxShadow: isSel ? '0 10px 24px -6px rgba(30, 64, 255, 0.22)' : '0 2px 8px rgba(15, 23, 42, 0.04)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {renderNodeIcon(node.kind)}
                        </span>
                        <Badge tone={meta.badgeTone}>Bước {idx + 1} • {meta.label}</Badge>
                      </div>
                      {nodes.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNode(node.id);
                          }}
                          style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0F172A' }}>{node.title}</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 3 }}>{node.content}</div>

                    {node.kind === 'tag' && node.tag_name && (
                      <div style={{ marginTop: 6 }}><Badge tone="purple">+{node.tag_name}</Badge></div>
                    )}

                    {(node.buttons || []).length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                        {(node.buttons || []).map((b) => {
                          const dest = nodes.find((x) => x.id === b.next_node_id);
                          return (
                            <div key={b.id} style={{ padding: '4px 8px', borderRadius: 8, background: '#F8FAFF', border: '1px solid #DBEAFE', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, color: '#1E40FF' }}>
                                <GitBranch size={11} style={{ display: 'inline', marginRight: 4 }} />
                                {b.label}
                              </span>
                              <span style={{ color: '#64748B' }}>→ {dest ? dest.title : b.url || 'Kết thúc'}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {targetTitle && (
                      <div style={{ marginTop: 6, fontSize: '0.71rem', color: '#1E40FF', fontWeight: 700 }}>
                        Chuyển tiếp → {targetTitle}
                      </div>
                    )}
                  </div>

                  {idx < nodes.length - 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94A3B8', padding: '2px 0' }}>
                      <ArrowDown size={15} color="#1E40FF" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ borderRadius: 16, border: '1px solid #E2E8F0', background: '#FFFFFF', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>Thuộc Tính Node Đang Chọn</div>

        {selectedNode ? (
          <>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Loại hành động (Node Kind)</label>
              <select className="form-input" style={{ height: 40 }} value={selectedNode.kind} onChange={(e) => updateSelected({ kind: e.target.value as ScenarioNodeKind })}>
                <option value="message">message — Gửi tin nhắn</option>
                <option value="button">button — Menu nút bấm rẽ nhánh</option>
                <option value="collect_phone">collect_phone — Thu thập SĐT/Email</option>
                <option value="tag">tag — Gắn nhãn CRM Tag</option>
                <option value="handoff">handoff — Chuyển nhân viên CSKH</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Tiêu đề bước</label>
              <input className="form-input" style={{ height: 40 }} value={selectedNode.title} onChange={(e) => updateSelected({ title: e.target.value })} />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Nội dung tin nhắn / Ghi chú</label>
              <textarea className="form-input" rows={3} style={{ padding: '0.55rem' }} value={selectedNode.content} onChange={(e) => updateSelected({ content: e.target.value })} />
            </div>

            {selectedNode.kind === 'tag' && (
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Tên nhãn CRM tự động gắn</label>
                <input className="form-input" style={{ height: 40 }} value={selectedNode.tag_name || ''} onChange={(e) => updateSelected({ tag_name: e.target.value })} placeholder="VD: VIP Zalo OA" />
              </div>
            )}

            {selectedNode.kind === 'button' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155' }}>Danh sách Nút rẽ nhánh</span>
                  <button type="button" onClick={handleAddButton} className="btn secondary sm" style={{ height: 28, fontSize: '0.72rem', color: '#1E40FF' }}>
                    + Thêm nút
                  </button>
                </div>
                {(selectedNode.buttons || []).map((btn, bIdx) => (
                  <div key={btn.id} style={{ padding: '0.55rem', borderRadius: 10, background: '#F8F9FA', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <input
                        className="form-input"
                        style={{ height: 34, fontSize: '0.76rem', flex: 1 }}
                        value={btn.label}
                        onChange={(e) => updateSelected({ buttons: (selectedNode.buttons || []).map((x, i) => (i === bIdx ? { ...x, label: e.target.value } : x)) })}
                      />
                      <button type="button" onClick={() => updateSelected({ buttons: (selectedNode.buttons || []).filter((_, i) => i !== bIdx) })} style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <select
                      className="form-input"
                      style={{ height: 34, fontSize: '0.75rem' }}
                      value={btn.next_node_id || ''}
                      onChange={(e) => updateSelected({ buttons: (selectedNode.buttons || []).map((x, i) => (i === bIdx ? { ...x, next_node_id: e.target.value || undefined } : x)) })}
                    >
                      <option value="">— Nhảy tới Node khi bấm —</option>
                      {nodes.filter((n) => n.id !== selectedNode.id).map((n) => (
                        <option key={n.id} value={n.id}>{n.title}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Node tiếp theo (Next Edge)</label>
                <select className="form-input" style={{ height: 40 }} value={selectedNode.next_node_id || ''} onChange={(e) => updateSelected({ next_node_id: e.target.value || undefined })}>
                  <option value="">— Kết thúc nhánh tại đây —</option>
                  {nodes.filter((n) => n.id !== selectedNode.id).map((n) => (
                    <option key={n.id} value={n.id}>{n.title}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ScenarioCanvas;
