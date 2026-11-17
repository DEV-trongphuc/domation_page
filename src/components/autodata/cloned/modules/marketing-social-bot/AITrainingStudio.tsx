import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Bot,
  FlaskConical,
  Plus,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { KnowledgeDocsTrainer } from './KnowledgeDocsTrainer';
import type {
  BotConfigDto,
  BotTestResultDto,
  TrainingDocDto,
} from './socialBotTypes';

export interface AITrainingStudioProps {
  botCfg: BotConfigDto;
  onChangeBotCfg: React.Dispatch<React.SetStateAction<BotConfigDto>>;
  audiences: Array<{ id: string; name: string }>;
  rounds: Array<{ id: string; name: string }>;
  onDocsCountChange?: (cnt: number) => void;
}

export const AITrainingStudio: React.FC<AITrainingStudioProps> = ({
  botCfg,
  onChangeBotCfg,
  audiences,
  rounds,
  onDocsCountChange,
}) => {
  const { token, tenantSlug } = useAuth();
  const [subTab, setSubTab] = useState<'persona_faq' | 'knowledge_docs'>('persona_faq');
  const [savingBot, setSavingBot] = useState(false);

  const [docsLoading, setDocsLoading] = useState(true);
  const [docs, setDocs] = useState<TrainingDocDto[]>([]);

  const [testInput, setTestInput] = useState(
    'Bảng giá gói dịch vụ như thế nào? SĐT mình là 0909888777'
  );
  const [testing, setTesting] = useState(false);
  const [sandboxHistory, setSandboxHistory] = useState<
    Array<{ query: string; result: BotTestResultDto }>
  >([]);

  const loadDocs = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await apiRequest<{ items?: TrainingDocDto[] }>(
        '/marketing/social-bot/training-docs',
        { token, tenantSlug }
      );
      const list = res.items || [];
      setDocs(list);
      onDocsCountChange?.(list.length);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải kho tài liệu tri thức RAG.'));
    } finally {
      setDocsLoading(false);
    }
  }, [token, tenantSlug, onDocsCountChange]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest<{ items?: TrainingDocDto[] }>(
          '/marketing/social-bot/training-docs',
          { token, tenantSlug }
        );
        if (!cancelled) {
          const list = res.items || [];
          setDocs(list);
          onDocsCountChange?.(list.length);
        }
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tenantSlug, onDocsCountChange]);

  const handleSaveBotConfig = async () => {
    setSavingBot(true);
    try {
      const updated = await apiRequest<BotConfigDto>('/marketing/social-bot/bot-config', {
        method: 'PUT',
        token,
        tenantSlug,
        body: botCfg,
      });
      onChangeBotCfg(updated);
      toast.success('Đã lưu cấu hình DOM Agent Persona, Guardrails & FAQ Rules!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu cấu hình DOM Agent.'));
    } finally {
      setSavingBot(false);
    }
  };

  const handleRunSandboxTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;
    setTesting(true);
    try {
      const q = testInput.trim();
      const res = await apiRequest<BotTestResultDto>('/marketing/social-bot/bot-test', {
        method: 'POST',
        token,
        tenantSlug,
        body: { message: q },
      });
      setSandboxHistory((prev) => [{ query: q, result: res }, ...prev.slice(0, 6)]);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể chạy thử phản hồi DOM Agent.'));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) 360px', gap: '1.15rem', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <PillTabs
          tabs={[
            {
              key: 'persona_faq',
              label: 'Persona, Guardrails & Cặp Hỏi Đáp FAQ',
              icon: <Bot size={14} />,
              count: botCfg.faq_rules.length,
            },
            {
              key: 'knowledge_docs',
              label: 'Tài Liệu Tri Thức RAG (`mkt_ai_training_docs`)',
              icon: <BookOpen size={14} />,
              count: docs.length,
            },
          ]}
          activeKey={subTab}
          onChange={setSubTab}
        />

        {subTab === 'persona_faq' ? (
          <Card
            title="Cấu Hình DOM Agent Persona, Guardrails & Định Tuyến SĐT Tự Động"
            actions={
              <button
                type="button"
                disabled={savingBot}
                onClick={() => void handleSaveBotConfig()}
                style={{
                  height: 40,
                  padding: '0 1.15rem',
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
                <Save size={14} /> {savingBot ? 'Đang lưu...' : 'Lưu Cấu Hình AI'}
              </button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 10 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Tên hiển thị DOM Agent</label>
                  <input className="form-input" style={{ height: 42 }} value={botCfg.bot_name} onChange={(e) => onChangeBotCfg((p) => ({ ...p, bot_name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Phong cách & Guardrails (Không bịa giá, chỉ trả lời theo tri thức doanh nghiệp)
                  </label>
                  <input className="form-input" style={{ height: 42 }} value={botCfg.brand_persona} onChange={(e) => onChangeBotCfg((p) => ({ ...p, brand_persona: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Lời chào mở đầu hội thoại</label>
                <input className="form-input" style={{ height: 42 }} value={botCfg.welcome_message} onChange={(e) => onChangeBotCfg((p) => ({ ...p, welcome_message: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Khi bóc tách được SĐT / Email</label>
                  <select className="form-input" style={{ height: 42 }} value={botCfg.routing_mode} onChange={(e) => onChangeBotCfg((p) => ({ ...p, routing_mode: e.target.value as BotConfigDto['routing_mode'] }))}>
                    <option value="audience">Đưa vào Tệp Khách hàng</option>
                    <option value="sale_round">Chia thẳng vào Vòng Sale Auto Data</option>
                    <option value="none">Chỉ lưu Hồ sơ 360°</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Tệp Khách hàng đích</label>
                  <select className="form-input" style={{ height: 42 }} value={botCfg.target_audience_id || ''} onChange={(e) => onChangeBotCfg((p) => ({ ...p, target_audience_id: e.target.value || null }))}>
                    <option value="">— Chọn Tệp —</option>
                    {audiences.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Vòng chia Sale đích</label>
                  <select className="form-input" style={{ height: 42 }} value={botCfg.distribution_round_id || ''} onChange={(e) => onChangeBotCfg((p) => ({ ...p, distribution_round_id: e.target.value || null }))}>
                    <option value="">— Vòng chia mặc định —</option>
                    {rounds.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0F172A' }}>
                    Bộ Quy Tắc Hỏi - Đáp Nhanh (FAQ Rules)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChangeBotCfg((p) => ({
                        ...p,
                        faq_rules: [
                          ...p.faq_rules,
                          {
                            id: crypto.randomUUID(),
                            keywords: ['ưu đãi', 'khuyến mãi'],
                            question: 'Chương trình ưu đãi hiện tại?',
                            answer: 'Doanh nghiệp đang áp dụng ưu đãi đặc biệt trong tháng này. Bạn để lại SĐT để nhận mã Voucher nhé!',
                          },
                        ],
                      }))
                    }
                    className="btn secondary sm"
                    style={{ height: 34, color: '#1E40FF' }}
                  >
                    <Plus size={14} /> Thêm Cặp FAQ
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {botCfg.faq_rules.map((rule, idx) => (
                    <div
                      key={rule.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 12,
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1.6fr 36px',
                        gap: 8,
                      }}
                    >
                      <input
                        className="form-input"
                        style={{ height: 38, background: '#FFFFFF' }}
                        placeholder="Từ khóa (phẩy cách)..."
                        value={(rule.keywords || []).join(', ')}
                        onChange={(e) =>
                          onChangeBotCfg((p) => ({
                            ...p,
                            faq_rules: p.faq_rules.map((r, i) =>
                              i === idx ? { ...r, keywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } : r
                            ),
                          }))
                        }
                      />
                      <input
                        className="form-input"
                        style={{ height: 38, background: '#FFFFFF' }}
                        placeholder="Câu trả lời chuẩn xác..."
                        value={rule.answer}
                        onChange={(e) =>
                          onChangeBotCfg((p) => ({
                            ...p,
                            faq_rules: p.faq_rules.map((r, i) => (i === idx ? { ...r, answer: e.target.value } : r)),
                          }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => onChangeBotCfg((p) => ({ ...p, faq_rules: p.faq_rules.filter((_, i) => i !== idx) }))}
                        className="btn secondary sm"
                        style={{ height: 38, color: '#DC2626' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <KnowledgeDocsTrainer docsLoading={docsLoading} docs={docs} onReloadDocs={loadDocs} />
        )}
      </div>

      <Card
        title="Live RAG Sandbox Tester"
        subtitle="Kiểm thử câu trả lời & bóc tách thực thể SĐT/Email tức thì"
        actions={<Badge tone="info" icon={<FlaskConical size={11} />}>Sandbox</Badge>}
      >
        <form onSubmit={(e) => void handleRunSandboxTest(e)} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea className="form-input" rows={3} style={{ padding: '0.6rem' }} placeholder="Nhập câu hỏi khách hàng để test DOM Agent..." value={testInput} onChange={(e) => setTestInput(e.target.value)} />
          <button
            type="submit"
            disabled={testing || !testInput.trim()}
            style={{
              height: 42,
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Send size={14} /> {testing ? 'Đang suy luận RAG...' : 'Chạy Thử Phản Hồi DOM Agent'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, maxHeight: 380, overflowY: 'auto' }}>
          {sandboxHistory.length === 0 ? (
            <div style={{ fontSize: '0.77rem', color: '#64748B', textAlign: 'center', padding: '1.25rem 0.5rem' }}>
              Nhấn nút bên trên để kiểm tra cách <b>{botCfg.bot_name}</b> khớp tri thức FAQ/RAG và tự động nhận diện SĐT/Email.
            </div>
          ) : (
            sandboxHistory.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.8rem',
                  borderRadius: 14,
                  background: '#F8FAFF',
                  border: '1px solid #DBEAFE',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                  <b>Khách hỏi:</b> {item.query}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 600, lineHeight: 1.45 }}>
                  <span style={{ color: '#1E40FF', fontWeight: 800 }}>{item.result.bot_name}: </span>
                  {item.result.reply}
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {item.result.matched_question && <Badge tone="primary">Nguồn: {item.result.matched_question}</Badge>}
                  {(item.result.extracted_entities.phone || item.result.extracted_entities.email) && (
                    <Badge tone="success">
                      Bóc tách: {[item.result.extracted_entities.phone, item.result.extracted_entities.email].filter(Boolean).join(' • ')}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default AITrainingStudio;
