import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  MessageSquarePlus,
  Pin,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Card,
  EmptyState,
} from '../../components/ui/AutoDataLoadingModal';
import { Skeleton } from '../../components/ui/Skeleton';
import { ChatDynamicChart } from '../../chat/ChatDynamicChart';
import { ActionProposalCard } from '../../chat/ActionProposalCard';
import {
  parseActionProposal,
  parseChartDataTag,
  type ActionProposalSpec,
  type DynamicChartSpec,
} from '../../chat/actionProposalUtils';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useEntitlement } from '../../contexts/EntitlementContext';
import {
  DEFAULT_ROBOT_AVATAR,
  type DomAgentConfigDto,
  type DomMessageItem,
  type DomRagCitationItem,
  type DomSpecialistItem,
  type DomThreadItem,
  type DomToolExecutionRecord,
} from './domAgentTypes';

interface DomAgentChatTabProps {
  config: DomAgentConfigDto;
  specialists: DomSpecialistItem[];
  threads: DomThreadItem[];
  setThreads: React.Dispatch<React.SetStateAction<DomThreadItem[]>>;
  token?: string | null;
  tenantSlug?: string | null;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onRefreshAuditLogs: () => void;
}

interface ChatTurnApiPayload {
  thread: DomThreadItem;
  user_message: DomMessageItem;
  assistant_message: DomMessageItem;
  tool_executions: DomToolExecutionRecord[];
  citations: DomRagCitationItem[];
  chart_data?: DynamicChartSpec | null;
  action_proposal?: ActionProposalSpec | null;
  engine_mode: string;
}

interface ThreadMessagesApiPayload {
  thread: DomThreadItem;
  messages: DomMessageItem[];
}

function renderSimpleMarkdownLines(content: string): React.ReactNode {
  const lines = String(content || '').split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={i} style={{ height: 8 }} />;
    }
    if (trimmed.startsWith('### ')) {
      return (
        <div
          key={i}
          style={{ fontSize: '0.93rem', fontWeight: 800, color: '#0F172A', marginBottom: 4 }}
        >
          {trimmed.slice(4)}
        </div>
      );
    }
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <div key={i} style={{ lineHeight: 1.6, fontSize: '0.85rem' }}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} style={{ fontWeight: 700 }}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code
                key={pIdx}
                style={{
                  padding: '1px 6px',
                  borderRadius: 6,
                  background: '#F1F5F9',
                  color: '#1E40FF',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                }}
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          return <React.Fragment key={pIdx}>{part}</React.Fragment>;
        })}
      </div>
    );
  });
}

export const DomAgentChatTab: React.FC<DomAgentChatTabProps> = ({
  config,
  specialists,
  threads,
  setThreads,
  token,
  tenantSlug,
  initialPrompt,
  onClearInitialPrompt,
  onRefreshAuditLogs,
}) => {
  const { switchPackage } = useEntitlement();

  const [selectedSpecialistKey, setSelectedSpecialistKey] = useState<string>('orchestrator');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => threads[0]?.id || null);
  const [messages, setMessages] = useState<DomMessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [threadFilter, setThreadFilter] = useState('');
  const [draftInput, setDraftInput] = useState(() => initialPrompt || '');
  const [expandedToolIds, setExpandedToolIds] = useState<Record<string, boolean>>({});
  const [avatarFailed, setAvatarFailed] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeSpecialist = useMemo(() => {
    return (
      specialists.find((s) => s.key === selectedSpecialistKey) ||
      specialists[0] || {
        key: 'orchestrator',
        name: 'DOM Orchestrator',
        badge: 'Core AI',
        description: '',
        required_module: 'leads',
        unlocked: true,
        upgrade_package: null,
        quick_prompts: [],
      }
    );
  }, [specialists, selectedSpecialistKey]);

  const filteredThreads = useMemo(() => {
    const kw = threadFilter.trim().toLowerCase();
    if (!kw) return threads;
    return threads.filter((t) => t.title.toLowerCase().includes(kw));
  }, [threads, threadFilter]);

  useEffect(() => {
    if (!activeThreadId) return;
    let cancelled = false;
    (async () => {
      setLoadingMessages(true);
      try {
        const res = await apiRequest<ThreadMessagesApiPayload>(
          `/dom-agent/threads/${activeThreadId}/messages`,
          { token, tenantSlug }
        );
        if (!cancelled) {
          setMessages((res.messages || []).filter((m) => m.role !== 'tool'));
        }
      } catch {
        if (!cancelled) {
          setMessages([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeThreadId, token, tenantSlug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sending]);

  const sendPrompt = useCallback(
    async (promptText: string) => {
      const clean = promptText.trim();
      if (!clean || sending) return;

      if (!activeSpecialist.unlocked) {
        toast.error(
          `Chuyên gia "${activeSpecialist.name}" yêu cầu nâng cấp gói cước để mở khóa.`
        );
        return;
      }

      setSending(true);
      setDraftInput('');
      if (onClearInitialPrompt) onClearInitialPrompt();

      const nowTs = Date.now();
      const optimisticId = `temp_user_${nowTs}`;
      const streamAssistantId = `temp_stream_${nowTs}`;
      const optimisticUserMsg: DomMessageItem = {
        id: optimisticId,
        thread_id: activeThreadId || '',
        role: 'user',
        content: clean,
        tool_calls: [],
        citations: [],
        latency_ms: 0,
        created_at: new Date(nowTs).toISOString(),
      };
      const streamingAssistantMsg: DomMessageItem = {
        id: streamAssistantId,
        thread_id: activeThreadId || '',
        role: 'assistant',
        content: '',
        tool_calls: [],
        citations: [],
        chart_data: null,
        action_proposal: null,
        latency_ms: 0,
        created_at: new Date(nowTs).toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUserMsg, streamingAssistantMsg]);

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (tenantSlug) headers['X-Tenant-Slug'] = tenantSlug;

        const streamResp = await fetch('/api/v1/dom-agent/chat/stream', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            thread_id: activeThreadId,
            specialist_key: activeSpecialist.key,
            message: clean,
          }),
        });

        const contentType = streamResp.headers.get('content-type') || '';
        if (streamResp.ok && contentType.includes('text/event-stream') && streamResp.body) {
          const reader = streamResp.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let finalDonePayload: ChatTurnApiPayload | null = null;

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const blocks = buffer.split('\n\n');
            buffer = blocks.pop() || '';

            for (const block of blocks) {
              const lines = block.split('\n');
              let evtName = 'message';
              let dataRaw = '';
              for (const l of lines) {
                if (l.startsWith('event:')) evtName = l.slice(6).trim();
                else if (l.startsWith('data:')) dataRaw += l.slice(5).trim();
              }
              if (!dataRaw) continue;
              try {
                const parsed = JSON.parse(dataRaw) as Record<string, unknown>;
                if (evtName === 'delta' && typeof parsed.delta === 'string') {
                  const chunkText = parsed.delta;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === streamAssistantId ? { ...m, content: m.content + chunkText } : m
                    )
                  );
                } else if (evtName === 'tool') {
                  const toolRec = parsed as unknown as DomToolExecutionRecord;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === streamAssistantId
                        ? { ...m, tool_calls: [...m.tool_calls, toolRec] }
                        : m
                    )
                  );
                } else if (evtName === 'chart') {
                  const chartSpec = parsed as unknown as DynamicChartSpec;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === streamAssistantId ? { ...m, chart_data: chartSpec } : m
                    )
                  );
                } else if (evtName === 'proposal') {
                  const propSpec = parsed as unknown as ActionProposalSpec;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === streamAssistantId ? { ...m, action_proposal: propSpec } : m
                    )
                  );
                } else if (evtName === 'done') {
                  finalDonePayload = parsed as unknown as ChatTurnApiPayload;
                }
              } catch {
                // ignore malformed SSE frame
              }
            }
          }

          if (finalDonePayload) {
            const doneOut = finalDonePayload;
            setActiveThreadId(doneOut.thread.id);
            setThreads((prev) => {
              const others = prev.filter((t) => t.id !== doneOut.thread.id);
              return [doneOut.thread, ...others];
            });
            setMessages((prev) => [
              ...prev.filter((m) => m.id !== optimisticId && m.id !== streamAssistantId),
              doneOut.user_message,
              {
                ...doneOut.assistant_message,
                chart_data: doneOut.chart_data ?? doneOut.assistant_message.chart_data ?? null,
                action_proposal:
                  doneOut.action_proposal ?? doneOut.assistant_message.action_proposal ?? null,
              },
            ]);
            onRefreshAuditLogs();
            return;
          }
        }

        // Fallback to standard JSON turn if SSE stream endpoint returned JSON error or wasn't streamed
        const out = await apiRequest<ChatTurnApiPayload>('/dom-agent/chat', {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            thread_id: activeThreadId,
            specialist_key: activeSpecialist.key,
            message: clean,
          },
        });

        setActiveThreadId(out.thread.id);
        setThreads((prev) => {
          const others = prev.filter((t) => t.id !== out.thread.id);
          return [out.thread, ...others];
        });
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimisticId && m.id !== streamAssistantId),
          out.user_message,
          {
            ...out.assistant_message,
            chart_data: out.chart_data ?? out.assistant_message.chart_data ?? null,
            action_proposal:
              out.action_proposal ?? out.assistant_message.action_proposal ?? null,
          },
        ]);
        onRefreshAuditLogs();
      } catch (err: unknown) {
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticId && m.id !== streamAssistantId)
        );
        setDraftInput(clean);
        toast.error(getErrorMessage(err, 'Không thể gửi câu hỏi cho DOM Agent.'));
      } finally {
        setSending(false);
      }
    },
    [
      activeSpecialist,
      activeThreadId,
      onClearInitialPrompt,
      onRefreshAuditLogs,
      sending,
      setThreads,
      tenantSlug,
      token,
    ]
  );

  const handleStartNewThread = () => {
    setActiveThreadId(null);
    setMessages([]);
    setDraftInput('');
  };

  const handleTogglePin = async (thread: DomThreadItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await apiRequest<DomThreadItem>(`/dom-agent/threads/${thread.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { is_pinned: !thread.is_pinned },
      });
      setThreads((prev) =>
        prev
          .map((t) => (t.id === updated.id ? updated : t))
          .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned))
      );
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể ghim hội thoại.'));
    }
  };

  const handleDeleteThread = async (thread: DomThreadItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest(`/dom-agent/threads/${thread.id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      setThreads((prev) => prev.filter((t) => t.id !== thread.id));
      if (activeThreadId === thread.id) {
        setActiveThreadId(null);
        setMessages([]);
      }
      toast.success('Đã xóa cuộc hội thoại.');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể xóa cuộc hội thoại.'));
    }
  };

  const agentLogo =
    !avatarFailed && config.avatar_url ? config.avatar_url : DEFAULT_ROBOT_AVATAR;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Executive Sub-Agent Council Selector */}
      <Card
        title="Hội Đồng Chuyên Gia Điều Hành (Executive Sub-Agent Council)"
        subtitle="Mỗi chuyên gia tự động mở khóa theo Gói cước SaaS của doanh nghiệp và thực thi trong phạm vi quyền RBAC của bạn"
        padding="1rem 1.25rem"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(225px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {specialists.map((spec) => {
            const isSelected = spec.key === activeSpecialist.key;
            return (
              <div
                key={spec.key}
                onClick={() => {
                  if (spec.unlocked) {
                    setSelectedSpecialistKey(spec.key);
                  } else if (spec.upgrade_package) {
                    toast(
                      `Chuyên gia "${spec.name}" thuộc gói cao hơn — bấm Mở khóa để nâng cấp tức thì 0 giây migrate!`
                    );
                    setSelectedSpecialistKey(spec.key);
                  }
                }}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 16,
                  background: isSelected ? '#F8FAFF' : '#FFFFFF',
                  border: isSelected ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                  boxShadow: isSelected
                    ? '0 6px 18px -4px rgba(30, 64, 255, 0.16)'
                    : '0 1px 4px rgba(15, 23, 42, 0.03)',
                  cursor: 'pointer',
                  opacity: spec.unlocked ? 1 : 0.82,
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 6,
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <Badge
                      tone={spec.unlocked ? (isSelected ? 'primary' : 'success') : 'warning'}
                      icon={spec.unlocked ? <Sparkles size={10} /> : <Lock size={10} />}
                    >
                      {spec.unlocked ? spec.badge : 'Khóa theo Gói'}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                    {spec.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      color: '#64748B',
                      marginTop: 3,
                      lineHeight: 1.4,
                    }}
                  >
                    {spec.description}
                  </div>
                </div>
                {!spec.unlocked && spec.upgrade_package && (
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      if (spec.upgrade_package) {
                        void switchPackage(spec.upgrade_package);
                      }
                    }}
                    style={{
                      marginTop: 4,
                      height: 30,
                      padding: '0 0.65rem',
                      borderRadius: 8,
                      border: '1px solid rgba(30, 64, 255, 0.25)',
                      background: 'rgba(30, 64, 255, 0.06)',
                      color: '#1E40FF',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Mở khóa 1 chạm ({spec.upgrade_package})
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Split Workspace: Thread Sidebar + Main Chat Stream */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 280px) minmax(0, 1fr)',
          gap: '1rem',
          alignItems: 'stretch',
        }}
      >
        {/* Left Thread Sidebar */}
        <Card padding="1rem" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 540 }}>
          <button
            type="button"
            onClick={handleStartNewThread}
            style={{
              width: '100%',
              height: 40,
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(30, 64, 255, 0.2)',
            }}
          >
            <MessageSquarePlus size={15} />
            Cuộc hội thoại mới
          </button>

          <input
            type="text"
            value={threadFilter}
            onChange={(e) => setThreadFilter(e.target.value)}
            placeholder="Tìm lịch sử hội thoại..."
            style={{
              width: '100%',
              height: 36,
              padding: '0 0.75rem',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              background: '#F8F9FA',
              fontSize: '0.78rem',
              color: '#0F172A',
            }}
          />

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxHeight: 440,
            }}
          >
            {filteredThreads.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', textAlign: 'center', padding: '1.5rem 0.5rem' }}>
                Chưa có lịch sử phiên chat. Hãy đặt câu hỏi đầu tiên!
              </div>
            ) : (
              filteredThreads.map((th) => {
                const isActive = th.id === activeThreadId;
                return (
                  <div
                    key={th.id}
                    onClick={() => setActiveThreadId(th.id)}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: 12,
                      background: isActive ? 'rgba(30, 64, 255, 0.08)' : '#FFFFFF',
                      border: isActive ? '1px solid rgba(30, 64, 255, 0.25)' : '1px solid #F1F5F9',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 6,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: isActive ? 700 : 600,
                          color: isActive ? '#1E40FF' : '#0F172A',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {th.is_pinned ? '📌 ' : ''}
                        {th.title}
                      </div>
                      <div style={{ fontSize: '0.69rem', color: '#94A3B8', marginTop: 2 }}>
                        {formatShortDate(th.last_message_at)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      <button
                        type="button"
                        title={th.is_pinned ? 'Bỏ ghim' : 'Ghim hội thoại'}
                        onClick={(e) => void handleTogglePin(th, e)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: 'none',
                          background: 'transparent',
                          color: th.is_pinned ? '#1E40FF' : '#94A3B8',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Pin size={12} />
                      </button>
                      <button
                        type="button"
                        title="Xóa hội thoại"
                        onClick={(e) => void handleDeleteThread(th, e)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: 'none',
                          background: 'transparent',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Main Chat Stream */}
        <Card
          padding="1.15rem 1.25rem"
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 540 }}
        >
          {/* Active Specialist Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              paddingBottom: '0.85rem',
              borderBottom: '1px solid #F1F5F9',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: '#F8FAFF',
                  border: '1px solid #DBEAFE',
                  padding: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={agentLogo}
                  alt={config.agent_name}
                  onError={() => setAvatarFailed(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                    {config.agent_name}
                  </span>
                  <Badge tone="primary">{activeSpecialist.name}</Badge>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Bảo vệ 3 lớp: Package Entitlement • Zero-Short-Circuit RBAC • Server PII Masking
                </div>
              </div>
            </div>
          </div>

          {/* Messages Viewport */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem 0.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem',
              maxHeight: 420,
            }}
          >
            {loadingMessages ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0.5rem' }}>
                <Skeleton width="45%" height={42} borderRadius={16} style={{ alignSelf: 'flex-end' }} />
                <Skeleton width="78%" height={84} borderRadius={16} />
                <Skeleton width="62%" height={56} borderRadius={16} />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ margin: 'auto 0' }}>
                <EmptyState
                  icon={<Bot size={26} />}
                  title={`Xin chào! Tôi là ${config.agent_name}`}
                  description={config.greeting_message}
                  action={
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 8,
                        maxWidth: 640,
                      }}
                    >
                      {activeSpecialist.quick_prompts.map((qp) => (
                        <button
                          key={qp}
                          type="button"
                          onClick={() => void sendPrompt(qp)}
                          disabled={!activeSpecialist.unlocked || sending}
                          style={{
                            padding: '0.5rem 0.85rem',
                            borderRadius: 9999,
                            border: '1px solid #DBEAFE',
                            background: '#F8FAFF',
                            color: '#1E40FF',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: activeSpecialist.unlocked ? 'pointer' : 'not-allowed',
                          }}
                        >
                          ✨ {qp}
                        </button>
                      ))}
                    </div>
                  }
                />
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '88%',
                        padding: '0.85rem 1.05rem',
                        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isUser
                          ? 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)'
                          : '#F8F9FA',
                        border: isUser ? 'none' : '1px solid #E2E8F0',
                        color: isUser ? '#FFFFFF' : '#0F172A',
                        boxShadow: isUser
                          ? '0 4px 14px rgba(30, 64, 255, 0.18)'
                          : '0 1px 4px rgba(15, 23, 42, 0.04)',
                      }}
                    >
                      {isUser ? (
                        <div style={{ fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {msg.content}
                        </div>
                      ) : (
                        (() => {
                          const parsedProp = parseActionProposal(msg.content);
                          const parsedChart = parseChartDataTag(parsedProp.cleanContent);
                          const cleanMarkdown = parsedChart.cleanContent;
                          const resolvedChart = msg.chart_data || parsedChart.chart;
                          const resolvedProposal = msg.action_proposal || parsedProp.proposal;

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {cleanMarkdown ? (
                                <div>{renderSimpleMarkdownLines(cleanMarkdown)}</div>
                              ) : sending ? (
                                <Skeleton width={220} height={18} borderRadius={8} />
                              ) : null}

                              {resolvedChart && <ChatDynamicChart chart={resolvedChart} />}

                              {resolvedProposal && (
                                <ActionProposalCard
                                  proposal={resolvedProposal}
                                  messageId={msg.id}
                                  token={token}
                                  tenantSlug={tenantSlug}
                                  onExecuted={() => onRefreshAuditLogs()}
                                />
                              )}

                              {/* Rich Tool Execution Cards */}
                          {Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {msg.tool_calls.map((tc, tIdx) => {
                                const cardKey = `${msg.id}_tc_${tIdx}`;
                                const isExpanded = Boolean(expandedToolIds[cardKey]);
                                return (
                                  <div
                                    key={cardKey}
                                    style={{
                                      padding: '0.65rem 0.8rem',
                                      borderRadius: 12,
                                      background: '#FFFFFF',
                                      border: tc.allowed
                                        ? '1px solid #DBEAFE'
                                        : '1px solid rgba(220, 38, 38, 0.28)',
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 8,
                                        flexWrap: 'wrap',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <Wrench size={13} color="#1E40FF" />
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                                          {tc.tool_title || tc.tool_name}
                                        </span>
                                        <Badge
                                          tone={tc.allowed ? 'success' : 'danger'}
                                          icon={
                                            tc.allowed ? (
                                              <CheckCircle2 size={10} />
                                            ) : (
                                              <ShieldAlert size={10} />
                                            )
                                          }
                                        >
                                          {tc.allowed ? `Allowed • Scope: ${tc.effective_scope}` : 'Blocked'}
                                        </Badge>
                                        {tc.pii_masked && (
                                          <Badge tone="info">PII Masked</Badge>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedToolIds((prev) => ({
                                            ...prev,
                                            [cardKey]: !prev[cardKey],
                                          }))
                                        }
                                        style={{
                                          border: 'none',
                                          background: 'transparent',
                                          color: '#64748B',
                                          fontSize: '0.72rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 3,
                                        }}
                                      >
                                        <Clock size={11} /> {tc.latency_ms}ms
                                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                      </button>
                                    </div>

                                    {!tc.allowed && tc.denial_reason && (
                                      <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: 4 }}>
                                        {tc.denial_reason}
                                      </div>
                                    )}

                                    {isExpanded && tc.output && (
                                      <pre
                                        style={{
                                          marginTop: 6,
                                          padding: '0.55rem 0.7rem',
                                          borderRadius: 8,
                                          background: '#F8F9FA',
                                          border: '1px solid #E2E8F0',
                                          fontSize: '0.72rem',
                                          color: '#334155',
                                          overflowX: 'auto',
                                          maxHeight: 180,
                                        }}
                                      >
                                        {JSON.stringify(tc.output, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Rich RAG Citations */}
                          {Array.isArray(msg.citations) && msg.citations.length > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 5,
                                paddingTop: 6,
                                borderTop: '1px dashed #CBD5E1',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: '#1E40FF',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}
                              >
                                <BookOpen size={12} /> Nguồn Tri Thức Nội Bộ (RAG Citations):
                              </div>
                              {msg.citations.map((cit) => (
                                <div
                                  key={cit.chunk_id}
                                  style={{
                                    padding: '0.5rem 0.7rem',
                                    borderRadius: 10,
                                    background: '#FFFFFF',
                                    border: '1px solid #E2E8F0',
                                    fontSize: '0.75rem',
                                    color: '#334155',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                    <strong style={{ color: '#0F172A' }}>{cit.title}</strong>
                                    <Badge tone="neutral">Score: {cit.score}</Badge>
                                  </div>
                                  <div style={{ color: '#64748B', marginTop: 2 }}>{cit.snippet}</div>
                                </div>
                              ))}
                            </div>
                          )}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div style={{ fontSize: '0.8rem', color: '#1E40FF', fontWeight: 600, padding: '0.25rem 0.5rem' }}>
                ⚡ {config.agent_name} đang đối chiếu quyền RBAC & truy xuất dữ liệu doanh nghiệp...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Prompt Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendPrompt(draftInput);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingTop: '0.85rem',
              borderTop: '1px solid #F1F5F9',
            }}
          >
            <input
              type="text"
              value={draftInput}
              onChange={(e) => setDraftInput(e.target.value)}
              disabled={!activeSpecialist.unlocked || sending}
              placeholder={
                activeSpecialist.unlocked
                  ? `Nhập yêu cầu điều hành cho ${config.agent_name} (ví dụ: Kiểm tra khách nóng, quy định công ty, tính lương...)`
                  : `Vui lòng nâng cấp gói cước để trò chuyện với ${activeSpecialist.name}`
              }
              style={{
                flex: 1,
                height: 44,
                padding: '0 1rem',
                borderRadius: 14,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '0.85rem',
                color: '#0F172A',
              }}
            />
            <button
              type="submit"
              disabled={!activeSpecialist.unlocked || sending || !draftInput.trim()}
              style={{
                height: 44,
                padding: '0 1.2rem',
                borderRadius: 14,
                border: 'none',
                background:
                  !activeSpecialist.unlocked || sending || !draftInput.trim()
                    ? '#CBD5E1'
                    : 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.84rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor:
                  !activeSpecialist.unlocked || sending || !draftInput.trim()
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              <Send size={15} />
              Gửi
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
};
