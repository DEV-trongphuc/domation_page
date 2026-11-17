import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Bot,
  Lock,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sun,
  Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  PillTabs,
  type PillTabItem,
} from '../../components/ui/AutoDataLoadingModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { DomAgentChatTab } from './DomAgentChatTab';
import { DomAgentBriefingTab } from './DomAgentBriefingTab';
import { DomAgentKnowledgeTab } from './DomAgentKnowledgeTab';
import { DomAgentToolsAuditTab } from './DomAgentToolsAuditTab';
import { DomAgentPersonaModal } from './DomAgentPersonaModal';
import {
  DEFAULT_ROBOT_AVATAR,
  type DomAgentBootstrapPayload,
  type DomAgentConfigDto,
  type DomAgentTabKey,
  type DomDepartmentOption,
  type DomKnowledgeDocItem,
  type DomSpecialistItem,
  type DomThreadItem,
  type DomToolAuditLogItem,
  type DomToolCatalogItem,
} from './domAgentTypes';

const DEFAULT_CONFIG_FALLBACK: DomAgentConfigDto = {
  id: 'default',
  tenant_id: '',
  agent_name: 'DOM Agent',
  avatar_url: DEFAULT_ROBOT_AVATAR,
  greeting_message:
    'Xin chào! Tôi là DOM Agent — Trợ lý AI điều hành doanh nghiệp thông minh, tuân thủ nghiêm ngặt phân quyền RBAC và kho tri thức nội bộ của tổ chức bạn.',
  persona_tone: 'executive_concise',
  preferred_model: 'gemini-2.5-flash',
  temperature: 0.25,
  enable_morning_briefing: true,
  guardrail_rules: [],
  has_byok_gemini: false,
  gemini_key_hint: null,
};

const Wave2Entry: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { packageCode, packageMeta, educationAddon, scope, can, isTenantOwner } =
    useEntitlement();

  const [activeTab, setActiveTab] = useState<DomAgentTabKey>('council_chat');
  const [loading, setLoading] = useState(true);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [headerLogoFailed, setHeaderLogoFailed] = useState(false);

  const [config, setConfig] = useState<DomAgentConfigDto>(DEFAULT_CONFIG_FALLBACK);
  const [canManageAgent, setCanManageAgent] = useState<boolean>(
    () => isTenantOwner || can('settings', 'manage_config')
  );
  const [callerDepartmentId, setCallerDepartmentId] = useState<string | null>(null);
  const [specialists, setSpecialists] = useState<DomSpecialistItem[]>([]);
  const [tools, setTools] = useState<DomToolCatalogItem[]>([]);
  const [threads, setThreads] = useState<DomThreadItem[]>([]);
  const [departments, setDepartments] = useState<DomDepartmentOption[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<DomKnowledgeDocItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<DomToolAuditLogItem[]>([]);

  const [prefilledChatPrompt, setPrefilledChatPrompt] = useState<string>('');

  const loadBootstrap = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await apiRequest<DomAgentBootstrapPayload>('/dom-agent/bootstrap', {
          token,
          tenantSlug,
        });
        setConfig(res.config || DEFAULT_CONFIG_FALLBACK);
        setCanManageAgent(Boolean(res.can_manage_agent));
        setCallerDepartmentId(res.caller_department_id || null);
        setSpecialists(Array.isArray(res.specialists) ? res.specialists : []);
        setTools(Array.isArray(res.tools) ? res.tools : []);
        setThreads(Array.isArray(res.threads) ? res.threads : []);
        setDepartments(Array.isArray(res.departments) ? res.departments : []);
        setKnowledgeDocs(Array.isArray(res.knowledge_docs) ? res.knowledge_docs : []);
        setAuditLogs(Array.isArray(res.audit_logs) ? res.audit_logs : []);
      } catch (err: unknown) {
        if (!silent) {
          toast.error(getErrorMessage(err, 'Không thể tải không gian làm việc DOM Agent.'));
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [tenantSlug, token]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest<DomAgentBootstrapPayload>('/dom-agent/bootstrap', {
          token,
          tenantSlug,
        });
        if (cancelled) return;
        setConfig(res.config || DEFAULT_CONFIG_FALLBACK);
        setCanManageAgent(Boolean(res.can_manage_agent));
        setCallerDepartmentId(res.caller_department_id || null);
        setSpecialists(Array.isArray(res.specialists) ? res.specialists : []);
        setTools(Array.isArray(res.tools) ? res.tools : []);
        setThreads(Array.isArray(res.threads) ? res.threads : []);
        setDepartments(Array.isArray(res.departments) ? res.departments : []);
        setKnowledgeDocs(Array.isArray(res.knowledge_docs) ? res.knowledge_docs : []);
        setAuditLogs(Array.isArray(res.audit_logs) ? res.audit_logs : []);
      } catch {
        // Fallback state preserved if server unreachable
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tenantSlug, packageCode, educationAddon]);

  const refreshAuditLogsOnly = useCallback(async () => {
    try {
      const logs = await apiRequest<DomToolAuditLogItem[]>('/dom-agent/audit-logs?limit=40', {
        token,
        tenantSlug,
      });
      if (Array.isArray(logs)) {
        setAuditLogs(logs);
      }
    } catch {
      // ignore background refresh error
    }
  }, [tenantSlug, token]);

  const handleJumpToChatWithPrompt = useCallback((prompt: string) => {
    setPrefilledChatPrompt(prompt);
    setActiveTab('council_chat');
  }, []);

  if (loading) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        brandLogoUrl={config.avatar_url}
        message={`Đang khởi tạo Hội đồng Trợ lý ${config.agent_name}...`}
        subMessage="Đồng bộ 72 Công cụ RBAC • Kho Tri thức RAG Cô lập Doanh nghiệp"
      />
    );
  }

  const resolvedAvatar =
    !headerLogoFailed && config.avatar_url ? config.avatar_url : DEFAULT_ROBOT_AVATAR;
  const activeScope = scope('dom_agent') !== 'none' ? scope('dom_agent') : scope('leads');

  const tabs: ReadonlyArray<PillTabItem<DomAgentTabKey>> = [
    {
      key: 'council_chat',
      label: 'Hội Đồng AI & Trò Chuyện',
      icon: <Bot size={15} />,
      count: threads.length,
    },
    {
      key: 'morning_briefing',
      label: 'Bản Tin Điều Hành Sáng',
      icon: <Sun size={15} />,
    },
    {
      key: 'rag_studio',
      label: 'RAG Knowledge Studio',
      icon: <BookOpen size={15} />,
      count: knowledgeDocs.length,
    },
    {
      key: 'tools_audit',
      label: '72 Công Cụ & Nhật Ký RBAC',
      icon: <Wrench size={15} />,
      count: tools.length || 72,
    },
  ];

  return (
    <div
      data-tour="dom-agent"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.15rem',
        background: '#F8F9FA',
      }}
    >
      {/* Top Royal Sapphire Identity & Governance Header */}
      <Card
        padding="1.25rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                background: '#FFFFFF',
                border: '1px solid #DBEAFE',
                boxShadow: '0 8px 22px rgba(30, 64, 255, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 7,
                flexShrink: 0,
              }}
            >
              <img
                src={resolvedAvatar}
                alt={config.agent_name}
                onError={() => setHeaderLogoFailed(true)}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.22rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {config.agent_name} — Hội Đồng Trợ Lý AI Điều Hành Doanh Nghiệp
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="success" icon={<Lock size={11} />}>
                  RBAC Scope: {activeScope}
                </Badge>
                <Badge
                  tone={config.has_byok_gemini ? 'purple' : 'info'}
                  icon={<ShieldCheck size={11} />}
                >
                  {config.has_byok_gemini ? 'Gemini BYOK Vault' : 'Intelligent Local SQL/RAG'}
                </Badge>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 4, marginBottom: 0 }}>
                {tools.length || 72} công cụ tự hành kiểm soát nghiêm ngặt theo Gói cước + Quyền RBAC cá nhân • Kho tri thức RAG cô lập tuyệt đối theo doanh nghiệp & phòng ban
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => void loadBootstrap(false)}
              title="Đồng bộ lại dữ liệu DOM Agent"
              style={{
                height: 36,
                padding: '0 0.8rem',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} /> Đồng bộ
            </button>

            <button
              type="button"
              onClick={() => setPersonaModalOpen(true)}
              style={{
                height: 36,
                padding: '0 0.95rem',
                borderRadius: 12,
                border: '1px solid #DBEAFE',
                background: '#F8FAFF',
                color: '#1E40FF',
                fontSize: '0.79rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Settings size={14} /> Nhân cách & White-Label
            </button>

            <ScreenHelpButton screenKey="dom_agent" />
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <PillTabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
        </div>
      </Card>

      {/* Active Tab Content */}
      {activeTab === 'council_chat' && (
        <DomAgentChatTab
          key={prefilledChatPrompt ? `prefill_${prefilledChatPrompt}` : 'default_chat'}
          config={config}
          specialists={specialists}
          threads={threads}
          setThreads={setThreads}
          token={token}
          tenantSlug={tenantSlug}
          initialPrompt={prefilledChatPrompt}
          onClearInitialPrompt={() => setPrefilledChatPrompt('')}
          onRefreshAuditLogs={() => void refreshAuditLogsOnly()}
        />
      )}

      {activeTab === 'morning_briefing' && (
        <DomAgentBriefingTab
          agentName={config.agent_name}
          token={token}
          tenantSlug={tenantSlug}
          onJumpToChatWithPrompt={handleJumpToChatWithPrompt}
        />
      )}

      {activeTab === 'rag_studio' && (
        <DomAgentKnowledgeTab
          docs={knowledgeDocs}
          setDocs={setKnowledgeDocs}
          departments={departments}
          canManage={canManageAgent}
          callerDepartmentId={callerDepartmentId}
          token={token}
          tenantSlug={tenantSlug}
        />
      )}

      {activeTab === 'tools_audit' && (
        <DomAgentToolsAuditTab
          tools={tools}
          auditLogs={auditLogs}
          onRefreshAuditLogs={refreshAuditLogsOnly}
          token={token}
          tenantSlug={tenantSlug}
        />
      )}

      {/* White-Label Persona & BYOK Vault Modal */}
      {personaModalOpen && (
        <DomAgentPersonaModal
          key={`${config.id}_${config.updated_at || ''}`}
          isOpen={personaModalOpen}
          onClose={() => setPersonaModalOpen(false)}
          config={config}
          canManage={canManageAgent}
          token={token}
          tenantSlug={tenantSlug}
          onSaved={(nextCfg) => {
            setHeaderLogoFailed(false);
            setConfig(nextCfg);
          }}
        />
      )}
    </div>
  );
};

export default Wave2Entry;
