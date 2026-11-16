import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ExternalLink,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { DomationLogoMark } from './DomationLogoMark';

export interface RetrievedSource {
  id: string;
  category: string;
  title: string;
  score: number;
  sectionId: string | null;
  url: string | null;
  urlLabel: string | null;
  image: string | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: RetrievedSource[];
  error?: string;
  isStreaming?: boolean;
}

interface StarterSuggestion {
  label: string;
  prompt: string;
}

const STARTER_SUGGESTIONS: StarterSuggestion[] = [
  {
    label: 'Bảng giá SaaS & Web 3D',
    prompt: 'Cho tôi xem bảng giá các gói DOMATION SaaS (Starter, Growth, Enterprise) và chi phí thiết kế Web 3D?',
  },
  {
    label: 'Auto Chia Data < 5s & CAPI',
    prompt: 'Hệ thống phân bổ Lead < 5 giây, lọc trùng và tự động bắn Meta CAPI hoạt động như thế nào?',
  },
  {
    label: 'ERP 5.0 & CRM 360°',
    prompt: 'DOMATION ERP 5.0 gồm những phân hệ nào và CRM có hỗ trợ quản trị bán hàng, hóa đơn không?',
  },
  {
    label: 'Case Study & Tư vấn Zalo',
    prompt: 'DOMATION đã triển khai thực tế cho Capital House EcoLife Signature và IDEAS như thế nào? Muốn đặt lịch demo qua đâu?',
  },
];

const ZALO_LINK = 'https://zalo.me/0378859736';
const ZALO_FAVICON_URL = 'https://stc-zpl.zdn.vn/favicon.ico';

function createMsgId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isSafeHref(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('/') || trimmed.toLowerCase().startsWith('mailto:')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={`b-${keyIdx++}`} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={`c-${keyIdx++}`}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 text-[#1E40FF] font-mono text-[12px] border border-slate-200/80"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch && isSafeHref(linkMatch[2])) {
        const external = /^https?:\/\//i.test(linkMatch[2]);
        tokens.push(
          <a
            key={`a-${keyIdx++}`}
            href={linkMatch[2]}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="text-[#1E40FF] underline decoration-[#1E40FF]/35 hover:decoration-[#1E40FF] font-medium inline-flex items-center gap-0.5"
          >
            {linkMatch[1]}
            {external && <ArrowUpRight size={11} className="inline shrink-0" />}
          </a>
        );
      } else {
        tokens.push(token);
      }
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}

function renderSafeMarkdown(raw: string): React.ReactNode {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (!normalized) return null;

  const lines = normalized.split('\n');
  const blocks: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[] = [];
  let keyIdx = 0;

  const flushList = () => {
    if (!listType || listItems.length === 0) return;
    if (listType === 'ul') {
      blocks.push(
        <ul key={`ul-${keyIdx++}`} className="list-disc pl-4 space-y-1 my-1.5 text-slate-700">
          {listItems}
        </ul>
      );
    } else {
      blocks.push(
        <ol key={`ol-${keyIdx++}`} className="list-decimal pl-4 space-y-1 my-1.5 text-slate-700">
          {listItems}
        </ol>
      );
    }
    listType = null;
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    const bulletMatch = /^[-*•]\s+(.+)$/.exec(trimmed);
    if (bulletMatch) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(
        <li key={`li-${keyIdx++}`} className="leading-relaxed">
          {renderInlineMarkdown(bulletMatch[1])}
        </li>
      );
      continue;
    }

    const orderedMatch = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (orderedMatch) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(
        <li key={`li-${keyIdx++}`} className="leading-relaxed">
          {renderInlineMarkdown(orderedMatch[1])}
        </li>
      );
      continue;
    }

    flushList();

    const headingMatch = /^#{1,4}\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      blocks.push(
        <p key={`h-${keyIdx++}`} className="font-bold text-slate-900 text-[13.5px] mt-2 first:mt-0">
          {renderInlineMarkdown(headingMatch[1])}
        </p>
      );
      continue;
    }

    blocks.push(
      <p key={`p-${keyIdx++}`} className="leading-relaxed text-slate-700">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  }

  flushList();
  return <div className="space-y-1.5 text-[13.5px]">{blocks}</div>;
}

export const AiDomationChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [zaloImgError, setZaloImgError] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const targetContentRef = useRef<string>('');
  const shownLenRef = useRef<number>(0);
  const streamEndedRef = useRef<boolean>(false);
  const activeAssistantIdRef = useRef<string | null>(null);

  const clearTypingTimer = useCallback(() => {
    if (typingTimerRef.current !== null) {
      window.clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      clearTypingTimer();
      abortRef.current?.abort();
    };
  }, [clearTypingTimer]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(false);
    }
  }, [messages.length, isOpen, scrollToBottom]);

  const stopGeneration = useCallback(() => {
    clearTypingTimer();
    abortRef.current?.abort();
    abortRef.current = null;
    streamEndedRef.current = true;
    setIsStreaming(false);
    const activeId = activeAssistantIdRef.current;
    const partialOrFull = targetContentRef.current;
    activeAssistantIdRef.current = null;
    setMessages((prev) =>
      prev.map((m) =>
        m.isStreaming
          ? {
              ...m,
              content:
                m.id === activeId && partialOrFull.length > m.content.length
                  ? partialOrFull.slice(0, Math.max(m.content.length, shownLenRef.current))
                  : m.content,
              isStreaming: false,
            }
          : m
      )
    );
  }, [clearTypingTimer]);

  const resetChat = useCallback(() => {
    clearTypingTimer();
    abortRef.current?.abort();
    abortRef.current = null;
    activeAssistantIdRef.current = null;
    targetContentRef.current = '';
    shownLenRef.current = 0;
    streamEndedRef.current = false;
    setIsStreaming(false);
    setLastFailedPrompt(null);
    setMessages([]);
    setInput('');
  }, [clearTypingTimer]);

  const sendMessage = useCallback(
    async (rawText: string, options?: { isRetry?: boolean }) => {
      const prompt = rawText.trim();
      if (!prompt || isStreaming) return;

      setLastFailedPrompt(null);
      if (!options?.isRetry) {
        setInput('');
      }

      const userMsg: ChatMessage = {
        id: createMsgId(),
        role: 'user',
        content: prompt,
      };
      const assistantId = createMsgId();
      const assistantPlaceholder: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        isStreaming: true,
      };

      const baseHistory = options?.isRetry
        ? messages.filter(
            (m, idx) => !(idx === messages.length - 1 && m.role === 'assistant' && m.error)
          )
        : messages;

      const apiHistory = [
        ...baseHistory
          .filter((m) => m.content.trim().length > 0 && !m.error)
          .map((m) => ({ role: m.role, content: m.content })),
        ...(options?.isRetry ? [] : [{ role: 'user' as const, content: prompt }]),
      ];

      setMessages((prev) => {
        const cleaned = options?.isRetry
          ? prev.filter(
              (m, idx) => !(idx === prev.length - 1 && m.role === 'assistant' && m.error)
            )
          : [...prev, userMsg];
        return [...cleaned, assistantPlaceholder];
      });

      clearTypingTimer();
      activeAssistantIdRef.current = assistantId;
      targetContentRef.current = '';
      shownLenRef.current = 0;
      streamEndedRef.current = false;

      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      const startTypingLoop = () => {
        if (typingTimerRef.current !== null) return;
        typingTimerRef.current = window.setInterval(() => {
          const full = targetContentRef.current;
          const shown = shownLenRef.current;
          if (shown < full.length) {
            const remaining = full.length - shown;
            const step = Math.max(2, Math.min(8, Math.ceil(remaining / 10)));
            const nextLen = Math.min(full.length, shown + step);
            shownLenRef.current = nextLen;
            const nextSlice = full.slice(0, nextLen);
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: nextSlice } : m))
            );
            scrollToBottom(false);
            return;
          }

          if (streamEndedRef.current) {
            clearTypingTimer();
            activeAssistantIdRef.current = null;
            setIsStreaming(false);
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantId) return m;
                if (!full.trim() && !m.error) {
                  return {
                    ...m,
                    isStreaming: false,
                    error: 'Chưa nhận được phản hồi từ hệ thống. Vui lòng thử lại.',
                  };
                }
                return { ...m, content: full, isStreaming: false };
              })
            );
            scrollToBottom(true);
          }
        }, 16);
      };

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({ messages: apiHistory }),
          signal: controller.signal,
        });

        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('text/event-stream')) {
          let errMsg = `Không thể kết nối DOMATION AI (HTTP ${response.status}).`;
          try {
            const payload = (await response.json()) as { error?: string };
            if (payload?.error) errMsg = payload.error;
          } catch {
            // Keep fallback message
          }
          throw new Error(errMsg);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Trình duyệt không hỗ trợ đọc luồng phản hồi.');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let streamError: string | null = null;

        const processBlock = (rawBlock: string) => {
          const normalized = rawBlock.replace(/\r\n/g, '\n').trim();
          if (!normalized) return;

          let eventName = 'message';
          const dataLines: string[] = [];

          for (const line of normalized.split('\n')) {
            if (line.startsWith(':')) continue;
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataLines.push(line.slice(5).trim());
            }
          }

          if (dataLines.length === 0) return;
          const rawJson = dataLines.join('\n');

          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(rawJson) as Record<string, unknown>;
          } catch {
            return;
          }

          if (eventName === 'sources') {
            const sources = Array.isArray(parsed.sources)
              ? (parsed.sources as RetrievedSource[])
              : [];
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, sources } : m))
            );
          } else if (eventName === 'delta') {
            const deltaText = typeof parsed.text === 'string' ? parsed.text : '';
            if (!deltaText) return;
            targetContentRef.current += deltaText;
            startTypingLoop();
          } else if (eventName === 'error') {
            const errText =
              typeof parsed.error === 'string'
                ? parsed.error
                : 'Lỗi kết nối máy chủ DOMATION AI. Vui lòng thử lại.';
            streamError = errText;
            clearTypingTimer();
            streamEndedRef.current = true;
            activeAssistantIdRef.current = null;
            setIsStreaming(false);
            setLastFailedPrompt(prompt);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, error: errText, isStreaming: false } : m
              )
            );
          } else if (eventName === 'done') {
            streamEndedRef.current = true;
            startTypingLoop();
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

          let separatorIdx = buffer.indexOf('\n\n');
          while (separatorIdx !== -1) {
            const block = buffer.slice(0, separatorIdx);
            buffer = buffer.slice(separatorIdx + 2);
            processBlock(block);
            separatorIdx = buffer.indexOf('\n\n');
          }
        }

        if (buffer.trim()) {
          processBlock(buffer);
        }

        if (!streamError) {
          streamEndedRef.current = true;
          if (!targetContentRef.current.trim()) {
            clearTypingTimer();
            activeAssistantIdRef.current = null;
            setIsStreaming(false);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      isStreaming: false,
                      error: 'Chưa nhận được phản hồi từ hệ thống. Vui lòng thử lại.',
                    }
                  : m
              )
            );
          } else {
            startTypingLoop();
          }
        }
      } catch (err) {
        clearTypingTimer();
        streamEndedRef.current = true;
        activeAssistantIdRef.current = null;
        setIsStreaming(false);
        if ((err as Error)?.name === 'AbortError') {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
          );
          return;
        }
        const errMessage =
          err instanceof Error && err.message
            ? err.message
            : 'Không thể kết nối máy chủ DOMATION AI lúc này.';
        setLastFailedPrompt(prompt);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, error: errMessage, isStreaming: false } : m
          )
        );
      } finally {
        abortRef.current = null;
      }
    },
    [clearTypingTimer, isStreaming, messages, scrollToBottom]
  );

  const handleSourceNavigate = useCallback(
    (src: RetrievedSource) => {
      if (src.url && src.url.startsWith('/') && !src.url.startsWith('/#')) {
        window.location.href = src.url;
        return;
      }
      if (src.url && src.url.startsWith('/#')) {
        if (window.location.pathname !== '/') {
          window.location.href = src.url;
          return;
        }
        const targetId = src.url.slice(2);
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        if (isMobile) setIsOpen(false);
        return;
      }
      if (src.sectionId) {
        const el = document.getElementById(src.sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          if (isMobile) setIsOpen(false);
          return;
        }
      }
      if (src.url) {
        window.open(src.url, '_blank', 'noopener,noreferrer');
      }
    },
    [isMobile]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating Bottom-Right Vertical Dock: Zalo Icon on Top + Circular DOMATION Logo AI Launcher Below */}
      {!isOpen && (
        <div
          className="fixed bottom-4 right-3.5 sm:bottom-6 sm:right-6 z-[60] flex flex-col items-center gap-2.5 sm:gap-3"
          aria-label="Tư vấn nhanh DOMATION AI và Zalo"
        >
          {/* Round Zalo Quick Connect Button (Stacked Vertically ON TOP) */}
          <a
            href={ZALO_LINK}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat qua Zalo chính thức DOMATION"
            title="Nhắn Zalo 0378.859.736"
            data-testid="zalo-floating-btn"
            className="group relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-slate-200/90 shadow-[0_10px_28px_-6px_rgba(2,132,199,0.28)] hover:shadow-[0_14px_34px_-4px_rgba(2,132,199,0.42)] hover:scale-[1.06] active:scale-[0.97] transition-all"
          >
            {!zaloImgError ? (
              <img
                src={ZALO_FAVICON_URL}
                alt="Zalo"
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-contain"
                onError={() => setZaloImgError(true)}
              />
            ) : (
              <span className="text-[11px] font-bold tracking-tight text-[#0068FF]">Zalo</span>
            )}
            <span className="pointer-events-none hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              Chat Zalo 0378.859.736
            </span>
          </a>

          {/* Round DOMATION Logo AI Launcher Button (Stacked BELOW Zalo) */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 120);
            }}
            aria-label="Mở trợ lý AI tư vấn dịch vụ DOMATION"
            title="DOMATION AI — Tư vấn Dịch vụ 24/7"
            data-testid="ai-chatbot-launcher"
            className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-[#1E40FF] via-[#0284C7] to-[#06B6D4] shadow-[0_14px_34px_-6px_rgba(30,64,255,0.45)] hover:shadow-[0_18px_42px_-4px_rgba(30,64,255,0.62)] hover:scale-[1.06] active:scale-[0.97] transition-all cursor-pointer"
          >
            <div className="relative w-full h-full rounded-full overflow-hidden bg-white border border-white flex items-center justify-center">
              <DomationLogoMark size={30} />
            </div>
            {/* Online emerald pulse dot */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
            {/* Small AI spark pill on top-left edge */}
            <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[#1E40FF] border-2 border-white flex items-center justify-center shadow-sm">
              <Sparkles size={10} color="#FFFFFF" />
            </span>
            <span className="pointer-events-none hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              Hỏi Trợ Lý AI DOMATION
            </span>
          </button>
        </div>
      )}

      {/* Chatbot Panel: Light Frosted Window (>= sm) / Full-screen Mobile */}
      {isOpen && (
        <aside
          aria-label="Trợ lý AI Tư vấn Dịch vụ DOMATION"
          data-testid="ai-chatbot-panel"
          className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-[70] flex flex-col w-full h-[100dvh] sm:w-[480px] md:w-[520px] sm:max-w-[calc(100vw-2.5rem)] sm:h-[min(670px,calc(100dvh-2.5rem))] sm:max-h-[calc(100dvh-2.5rem)] rounded-none sm:rounded-[24px] bg-white sm:bg-white/95 backdrop-blur-2xl border-0 sm:border sm:border-slate-200/90 shadow-[0_28px_72px_-12px_rgba(30,64,255,0.22),0_10px_28px_-6px_rgba(15,23,42,0.12)] overflow-hidden"
        >
          {/* High-contrast Header */}
          <header className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 pt-[max(0.9rem,env(safe-area-inset-top))] pb-3.5 bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0284C7] border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0 w-10 h-10 rounded-full bg-white border border-white/80 shadow-sm flex items-center justify-center">
                <DomationLogoMark size={26} />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#1E3A8A]" />
              </div>
              <div className="min-w-0">
                <p
                  role="heading"
                  aria-level={2}
                  style={{ color: '#FFFFFF' }}
                  className="text-[15px] font-semibold tracking-tight truncate m-0 leading-snug"
                >
                  DOMATION AI
                </p>
                <p
                  style={{ color: '#DBEAFE' }}
                  className="text-[11.5px] truncate m-0 leading-snug"
                >
                  Tư vấn Giải pháp & Báo giá Doanh nghiệp 24/7
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <a
                href={ZALO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                title="Chuyển sang chat Zalo 0378.859.736"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-[11px] font-bold text-white mr-1"
              >
                {!zaloImgError && (
                  <img src={ZALO_FAVICON_URL} alt="Zalo" className="w-3.5 h-3.5 rounded-sm" />
                )}
                <span>Zalo</span>
              </a>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={resetChat}
                  title="Tạo cuộc trò chuyện mới"
                  aria-label="Tạo cuộc trò chuyện mới"
                  style={{ color: '#FFFFFF' }}
                  className="p-2 rounded-xl hover:bg-white/15 transition-colors cursor-pointer"
                >
                  <RotateCcw size={16} color="#FFFFFF" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng trợ lý AI"
                aria-label="Đóng trợ lý AI"
                data-testid="ai-chatbot-close"
                style={{ color: '#FFFFFF' }}
                className="p-2 rounded-xl hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X size={18} color="#FFFFFF" />
              </button>
            </div>
          </header>

          {/* Messages Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 flex flex-col bg-slate-50/70"
          >
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col justify-between gap-6">
                <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-white border border-slate-200/90 px-4 py-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
                  <p className="text-[13.5px] leading-relaxed text-slate-700 m-0">
                    Chào bạn! Tôi là <strong className="text-slate-900">DOMATION AI</strong> — trợ lý chuyên trách tư vấn hệ sinh thái giải pháp <strong className="text-slate-900">Auto Data CAPI, ERP 5.0, CRM 360°, AI Automation & Thiết kế Web 3D</strong> của DOMATION.NET. Bạn cần tư vấn phân hệ hay báo giá nào hôm nay?
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-0.5 m-0">
                    Gợi ý câu hỏi nhanh
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STARTER_SUGGESTIONS.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => void sendMessage(item.prompt)}
                        className="px-3.5 py-2 rounded-full bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-[#1E40FF]/45 text-[12.5px] font-medium text-slate-700 hover:text-[#1E40FF] transition-all shadow-[0_1px_4px_rgba(15,23,42,0.03)] cursor-pointer text-left"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  if (msg.role === 'user') {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div
                          style={{ color: '#FFFFFF' }}
                          className="max-w-[84%] px-4 py-2.5 rounded-2xl rounded-br-md bg-[#1E40FF] text-[13.5px] leading-relaxed shadow-[0_6px_16px_-4px_rgba(30,64,255,0.32)]"
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex flex-col items-start gap-2">
                      <div className="max-w-[94%] rounded-2xl rounded-tl-md bg-white border border-slate-200/90 px-4 py-3 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
                        {msg.error ? (
                          <div className="space-y-2">
                            <p className="text-[13px] text-rose-600 font-medium leading-relaxed m-0">
                              {msg.error}
                            </p>
                            {lastFailedPrompt && (
                              <button
                                type="button"
                                onClick={() =>
                                  void sendMessage(lastFailedPrompt, { isRetry: true })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[12px] font-semibold border border-rose-200 transition-colors cursor-pointer"
                              >
                                <RotateCcw size={12} />
                                <span>Thử lại câu hỏi</span>
                              </button>
                            )}
                          </div>
                        ) : msg.content ? (
                          <>
                            {renderSafeMarkdown(msg.content)}
                            {msg.isStreaming && (
                              <div className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-[#1E40FF]">
                                <span className="inline-block w-1.5 h-3.5 bg-[#1E40FF] animate-pulse rounded-sm" />
                                <span>Đang gõ...</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2.5 text-[12.5px] text-slate-500 py-0.5">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1E40FF] animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-bounce" />
                            </span>
                            <span>DOMATION AI đang phân tích...</span>
                          </div>
                        )}
                      </div>

                      {msg.sources && msg.sources.length > 0 && !msg.isStreaming && !msg.error && (
                        <div className="w-full flex gap-2 overflow-x-auto pb-0.5">
                          {msg.sources.map((src) => (
                            <button
                              key={src.id}
                              type="button"
                              onClick={() => handleSourceNavigate(src)}
                              className="shrink-0 max-w-[240px] rounded-xl bg-white hover:bg-blue-50/40 border border-slate-200/90 hover:border-[#1E40FF]/40 px-2.5 py-2 flex items-center gap-2.5 shadow-[0_1px_4px_rgba(15,23,42,0.03)] text-left transition-colors cursor-pointer"
                            >
                              {src.image && (
                                <img
                                  src={src.image}
                                  alt={src.title}
                                  loading="lazy"
                                  className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-100"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-[11.5px] font-semibold text-slate-800 truncate leading-snug m-0">
                                  {src.title}
                                </p>
                                <span className="inline-flex items-center gap-1 mt-0.5 text-[10.5px] font-semibold text-[#1E40FF]">
                                  <span>{src.urlLabel || 'Xem giải pháp'}</span>
                                  <ExternalLink size={9.5} />
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="shrink-0 px-3.5 sm:px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-slate-200/85"
          >
            <div className="flex items-end gap-2 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-[#1E40FF]/55 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1E40FF]/10 px-3.5 py-2 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                rows={1}
                placeholder="Hỏi về giải pháp, giá SaaS hoặc dịch vụ DOMATION..."
                aria-label="Nhập câu hỏi cho DOMATION AI"
                data-testid="ai-chatbot-input"
                className="flex-1 resize-none bg-transparent text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none max-h-28 leading-5 py-1"
              />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  aria-label="Dừng trả lời"
                  style={{ color: '#FFFFFF' }}
                  className="shrink-0 w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Square size={14} color="#FFFFFF" fill="#FFFFFF" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Gửi tin nhắn"
                  data-testid="ai-chatbot-send"
                  style={{ color: input.trim() ? '#FFFFFF' : '#94A3B8' }}
                  className="shrink-0 w-9 h-9 rounded-xl bg-[#1E40FF] hover:bg-[#1733CC] disabled:bg-slate-200 flex items-center justify-center transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send size={15} />
                </button>
              )}
            </div>
          </form>
        </aside>
      )}
    </>
  );
};
