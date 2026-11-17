import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import {
  Badge,
  Card,
  FormCard,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import {
  AutodataApiError,
  apiRequest,
  formatShortDate,
  getErrorMessage,
} from '../../../autodataApi';
import {
  TOOL_GROUP_OPTIONS,
  type DomToolAuditLogItem,
  type DomToolCatalogItem,
  type DomToolExecutionRecord,
  type DomToolGroupKey,
} from './domAgentTypes';

interface DomAgentToolsAuditTabProps {
  tools: DomToolCatalogItem[];
  auditLogs: DomToolAuditLogItem[];
  onRefreshAuditLogs: () => Promise<void>;
  token?: string | null;
  tenantSlug?: string | null;
}

export const DomAgentToolsAuditTab: React.FC<DomAgentToolsAuditTabProps> = ({
  tools,
  auditLogs,
  onRefreshAuditLogs,
  token,
  tenantSlug,
}) => {
  const [groupFilter, setGroupFilter] = useState<'all' | DomToolGroupKey>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'allowed' | 'locked_package' | 'locked_rbac'
  >('all');
  const [searchKw, setSearchKw] = useState('');
  const [refreshingAudits, setRefreshingAudits] = useState(false);

  // Interactive Tool Runner Modal State
  const [runnerTool, setRunnerTool] = useState<DomToolCatalogItem | null>(null);
  const [runnerArgs, setRunnerArgs] = useState<Record<string, string>>({});
  const [runningTool, setRunningTool] = useState(false);
  const [runnerOutput, setRunnerOutput] = useState<{
    allowed: boolean;
    code?: string;
    message?: string;
    payload?: DomToolExecutionRecord;
  } | null>(null);

  const summary = useMemo(() => {
    const total = tools.length;
    const entitled = tools.filter((t) => t.entitled).length;
    const allowed = tools.filter((t) => t.allowed).length;
    const blockedAudits = auditLogs.filter((a) => !a.allowed).length;
    return { total, entitled, allowed, blockedAudits };
  }, [tools, auditLogs]);

  const filteredTools = useMemo(() => {
    const kw = searchKw.trim().toLowerCase();
    return tools.filter((t) => {
      if (groupFilter !== 'all' && t.group !== groupFilter) return false;
      if (statusFilter === 'allowed' && !t.allowed) return false;
      if (statusFilter === 'locked_package' && t.locked_reason !== 'MODULE_NOT_ENTITLED') {
        return false;
      }
      if (statusFilter === 'locked_rbac' && t.locked_reason !== 'FORBIDDEN_RBAC_PERMISSION') {
        return false;
      }
      if (kw) {
        const hay = `${t.name} ${t.title} ${t.description} ${t.module_key}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [tools, groupFilter, statusFilter, searchKw]);

  const openRunner = (tool: DomToolCatalogItem) => {
    setRunnerTool(tool);
    setRunnerArgs({});
    setRunnerOutput(null);
  };

  const handleExecuteRunner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runnerTool) return;

    setRunningTool(true);
    setRunnerOutput(null);
    try {
      const parsedArgs: Record<string, unknown> = {};
      for (const [paramKey, paramSpec] of Object.entries(runnerTool.parameters || {})) {
        const rawVal = runnerArgs[paramKey];
        if (rawVal === undefined || rawVal === '') continue;
        if (paramSpec.type === 'INTEGER' || paramSpec.type === 'NUMBER') {
          parsedArgs[paramKey] = Number(rawVal);
        } else if (paramSpec.type === 'BOOLEAN') {
          parsedArgs[paramKey] = rawVal === 'true';
        } else {
          parsedArgs[paramKey] = rawVal;
        }
      }

      const res = await apiRequest<DomToolExecutionRecord>('/dom-agent/tools/execute', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          tool_name: runnerTool.name,
          args: parsedArgs,
        },
      });

      setRunnerOutput({ allowed: true, payload: res });
      toast.success(`Đã thực thi công cụ "${runnerTool.name}"!`);
      await onRefreshAuditLogs();
    } catch (err: unknown) {
      if (err instanceof AutodataApiError) {
        setRunnerOutput({
          allowed: false,
          code: err.code,
          message: err.message,
        });
      } else {
        setRunnerOutput({
          allowed: false,
          code: 'EXECUTION_BLOCKED',
          message: getErrorMessage(err, 'Công cụ bị từ chối thực thi.'),
        });
      }
      await onRefreshAuditLogs();
    } finally {
      setRunningTool(false);
    }
  };

  const handleManualRefreshAudits = async () => {
    setRefreshingAudits(true);
    try {
      await onRefreshAuditLogs();
      toast.success('Đã làm mới Nhật ký Kiểm toán Công cụ AI.');
    } finally {
      setRefreshingAudits(false);
    }
  };

  const auditColumns: TableColumn<DomToolAuditLogItem>[] = [
    {
      key: 'time',
      header: 'Thời điểm',
      render: (row) => (
        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
          {formatShortDate(row.created_at)}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Người gọi',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A' }}>
            {row.user_name || 'Nhân sự'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            {row.user_email || row.user_id.slice(0, 8)}
          </div>
        </div>
      ),
    },
    {
      key: 'tool',
      header: 'Công cụ Function Tool',
      render: (row) => (
        <div>
          <code
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#1E40FF',
              background: '#F8FAFF',
              padding: '2px 6px',
              borderRadius: 6,
            }}
          >
            {row.tool_name}
          </code>
          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>
            Module: {row.module_key} • Action: {row.required_action}
          </div>
        </div>
      ),
    },
    {
      key: 'scope',
      header: 'RBAC Scope',
      render: (row) => <Badge tone="neutral">{row.data_scope}</Badge>,
    },
    {
      key: 'decision',
      header: 'Kết quả Bảo mật',
      render: (row) => (
        <div>
          <Badge
            tone={row.allowed ? 'success' : 'danger'}
            icon={row.allowed ? <CheckCircle2 size={11} /> : <ShieldAlert size={11} />}
          >
            {row.allowed ? 'ALLOWED' : 'DENIED'}
          </Badge>
          {!row.allowed && row.denial_reason && (
            <div style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 3, maxWidth: 320 }}>
              {row.denial_reason}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'latency',
      header: 'Độ trễ',
      numeric: true,
      render: (row) => (
        <span className="autodata-tabular-nums" style={{ fontSize: '0.78rem', color: '#475569' }}>
          {row.latency_ms} ms
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Summary KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '0.85rem',
        }}
      >
        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
            TỔNG SỐ CÔNG CỤ ĐĂNG KÝ
          </div>
          <div
            className="autodata-tabular-nums"
            style={{ fontSize: '1.55rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}
          >
            {summary.total}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: 2 }}>
            Phủ trọn 5 nhóm phân hệ SaaS
          </div>
        </Card>

        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
            MỞ KHÓA THEO GÓI CƯỚC
          </div>
          <div
            className="autodata-tabular-nums"
            style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}
          >
            {summary.entitled} / {summary.total}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: 2 }}>
            Kiểm tra qua Entitlement Engine
          </div>
        </Card>

        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
            ĐƯỢC PHÉP CHẠY VỚI VAI TRÒ BẠN
          </div>
          <div
            className="autodata-tabular-nums"
            style={{ fontSize: '1.55rem', fontWeight: 800, color: '#059669', marginTop: 4 }}
          >
            {summary.allowed}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: 2 }}>
            Khớp cả Gói cước + Quyền RBAC
          </div>
        </Card>

        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
            LỆNH VI PHẠM BỊ CHẶN TRONG LOG
          </div>
          <div
            className="autodata-tabular-nums"
            style={{ fontSize: '1.55rem', fontWeight: 800, color: '#DC2626', marginTop: 4 }}
          >
            {summary.blockedAudits}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: 2 }}>
            Ghi vết bất biến vào Audit Log
          </div>
        </Card>
      </div>

      {/* Filterable 72 Tools Catalog */}
      <Card
        title={`Danh Mục ${summary.total} Công Cụ Tự Hành & Kiểm Thử Tương Tác Trực Tiếp`}
        subtitle="Bấm Chạy thử trên bất kỳ công cụ nào để kiểm chứng hàng rào Gói cước, Phạm vi RBAC và Che giấu SĐT/Email từ phía Server"
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: '1rem',
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search
              size={15}
              color="#94A3B8"
              style={{ position: 'absolute', left: 12, top: 12 }}
            />
            <input
              type="text"
              value={searchKw}
              onChange={(e) => setSearchKw(e.target.value)}
              placeholder="Tìm tên hàm, tiêu đề hoặc module (ví dụ: crm_search_leads, payroll, roas...)"
              style={{
                width: '100%',
                height: 40,
                padding: '0 0.85rem 0 2.2rem',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                color: '#0F172A',
              }}
            />
          </div>

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value as 'all' | DomToolGroupKey)}
            style={{
              height: 40,
              padding: '0 0.8rem',
              borderRadius: 12,
              border: '1px solid #CBD5E1',
              fontSize: '0.82rem',
              color: '#0F172A',
              background: '#FFFFFF',
            }}
          >
            {TOOL_GROUP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as 'all' | 'allowed' | 'locked_package' | 'locked_rbac'
              )
            }
            style={{
              height: 40,
              padding: '0 0.8rem',
              borderRadius: 12,
              border: '1px solid #CBD5E1',
              fontSize: '0.82rem',
              color: '#0F172A',
              background: '#FFFFFF',
            }}
          >
            <option value="all">Tất cả trạng thái ({tools.length})</option>
            <option value="allowed">Được phép thực thi ({summary.allowed})</option>
            <option value="locked_package">Khóa theo Gói cước</option>
            <option value="locked_rbac">Khóa theo Quyền RBAC</option>
          </select>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(305px, 1fr))',
            gap: '0.85rem',
            maxHeight: 560,
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          {filteredTools.map((tool) => (
            <FormCard
              key={tool.name}
              icon={<Wrench size={17} />}
              title={tool.title}
              description={tool.description}
              badge={
                tool.allowed ? (
                  <Badge tone="success" icon={<ShieldCheck size={10} />}>
                    Allowed
                  </Badge>
                ) : tool.locked_reason === 'MODULE_NOT_ENTITLED' ? (
                  <Badge tone="warning" icon={<Lock size={10} />}>
                    Gói cước khóa
                  </Badge>
                ) : (
                  <Badge tone="danger" icon={<Lock size={10} />}>
                    RBAC khóa
                  </Badge>
                )
              }
              footer={
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <code
                      style={{
                        fontSize: '0.7rem',
                        color: '#1E40FF',
                        background: '#F8FAFF',
                        padding: '2px 6px',
                        borderRadius: 6,
                      }}
                    >
                      {tool.name}
                    </code>
                    <Badge tone="neutral">
                      {tool.module_key}.{tool.required_action} ({tool.effective_scope})
                    </Badge>
                  </div>

                  <button
                    type="button"
                    onClick={() => openRunner(tool)}
                    style={{
                      height: 28,
                      padding: '0 0.65rem',
                      borderRadius: 8,
                      border: '1px solid #DBEAFE',
                      background: '#F8FAFF',
                      color: '#1E40FF',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Play size={11} /> Chạy thử
                  </button>
                </>
              }
            />
          ))}
        </div>
      </Card>

      {/* Security Audit Log Viewer */}
      <Card
        title="Nhật Ký Kiểm Toán Bảo Mật Công Cụ AI (tenant_ai_tool_audit_logs)"
        subtitle="Ghi nhận 100% lệnh gọi công cụ được phép và bị từ chối thực thi để phục vụ kiểm toán tuân thủ doanh nghiệp"
        actions={
          <button
            type="button"
            disabled={refreshingAudits}
            onClick={() => void handleManualRefreshAudits()}
            style={{
              height: 36,
              padding: '0 0.9rem',
              borderRadius: 10,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: refreshingAudits ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={13} />
            Làm mới Log
          </button>
        }
      >
        <Table
          columns={auditColumns}
          rows={auditLogs}
          rowKey={(r) => r.id}
          emptyTitle="Chưa phát sinh nhật ký thực thi công cụ nào"
          emptyDescription="Khi bạn trò chuyện hoặc bấm Chạy thử công cụ ở trên, kết quả kiểm tra gói cước và phân quyền RBAC sẽ hiển thị tại đây."
        />
      </Card>

      {/* Interactive Safe Tool Runner Modal */}
      <CustomModal
        isOpen={Boolean(runnerTool)}
        onClose={() => setRunnerTool(null)}
        title={runnerTool ? `Chạy thử Công cụ: ${runnerTool.title}` : 'Chạy thử Công cụ'}
        width="660px"
      >
        {runnerTool && (
          <form
            onSubmit={(e) => void handleExecuteRunner(e)}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}
          >
            <div
              style={{
                padding: '0.75rem 0.95rem',
                borderRadius: 12,
                background: '#F8FAFF',
                border: '1px solid #DBEAFE',
                fontSize: '0.8rem',
                color: '#334155',
              }}
            >
              <div>
                Mã hàm: <strong>{runnerTool.name}</strong> • Phân hệ:{' '}
                <strong>{runnerTool.module_key}</strong> • Quyền yêu cầu:{' '}
                <strong>{runnerTool.required_action}</strong> • Phạm vi hiệu lực:{' '}
                <strong>{runnerTool.effective_scope}</strong>
              </div>
              {runnerTool.upgrade_hint && (
                <div style={{ color: '#D97706', marginTop: 4, fontWeight: 600 }}>
                  💡 {runnerTool.upgrade_hint}
                </div>
              )}
            </div>

            {Object.keys(runnerTool.parameters || {}).length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Công cụ này không yêu cầu tham số đầu vào — bấm Thực thi để truy xuất dữ liệu ngay.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(runnerTool.parameters).map(([pKey, pSpec]) => (
                  <div key={pKey}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.77rem',
                        fontWeight: 700,
                        color: '#334155',
                        marginBottom: 4,
                      }}
                    >
                      {pKey} ({pSpec.type}) —{' '}
                      <span style={{ fontWeight: 500, color: '#64748B' }}>
                        {pSpec.description}
                      </span>
                    </label>
                    {pSpec.enum && pSpec.enum.length > 0 ? (
                      <select
                        value={runnerArgs[pKey] || ''}
                        onChange={(e) =>
                          setRunnerArgs((prev) => ({ ...prev, [pKey]: e.target.value }))
                        }
                        style={{
                          width: '100%',
                          height: 38,
                          padding: '0 0.75rem',
                          borderRadius: 10,
                          border: '1px solid #CBD5E1',
                          fontSize: '0.82rem',
                          background: '#FFFFFF',
                        }}
                      >
                        <option value="">-- Mặc định --</option>
                        {pSpec.enum.map((ev) => (
                          <option key={ev} value={ev}>
                            {ev}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={
                          pSpec.type === 'INTEGER' || pSpec.type === 'NUMBER'
                            ? 'number'
                            : 'text'
                        }
                        value={runnerArgs[pKey] || ''}
                        onChange={(e) =>
                          setRunnerArgs((prev) => ({ ...prev, [pKey]: e.target.value }))
                        }
                        placeholder={`Nhập ${pKey} (tùy chọn)`}
                        style={{
                          width: '100%',
                          height: 38,
                          padding: '0 0.85rem',
                          borderRadius: 10,
                          border: '1px solid #CBD5E1',
                          fontSize: '0.82rem',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {runnerOutput && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 12,
                  background: runnerOutput.allowed ? '#F0FDF4' : '#FEF2F2',
                  border: runnerOutput.allowed
                    ? '1px solid #BBF7D0'
                    : '1px solid #FECACA',
                }}
              >
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: runnerOutput.allowed ? '#15803D' : '#DC2626',
                    marginBottom: 6,
                  }}
                >
                  {runnerOutput.allowed
                    ? `✅ Thực thi thành công (${runnerOutput.payload?.latency_ms ?? 0}ms • Scope: ${runnerOutput.payload?.effective_scope ?? ''})`
                    : `🔒 Đã chặn bởi Hàng rào Bảo mật (${runnerOutput.code}): ${runnerOutput.message}`}
                </div>
                {runnerOutput.payload?.output && (
                  <pre
                    style={{
                      margin: 0,
                      padding: '0.65rem',
                      borderRadius: 8,
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.74rem',
                      color: '#0F172A',
                      overflowX: 'auto',
                      maxHeight: 220,
                    }}
                  >
                    {JSON.stringify(runnerOutput.payload.output, null, 2)}
                  </pre>
                )}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                paddingTop: '0.5rem',
                borderTop: '1px solid #F1F5F9',
              }}
            >
              <button
                type="button"
                onClick={() => setRunnerTool(null)}
                style={{
                  height: 38,
                  padding: '0 1rem',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={runningTool}
                style={{
                  height: 38,
                  padding: '0 1.15rem',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: runningTool ? 'wait' : 'pointer',
                }}
              >
                <Play size={14} />
                {runningTool ? 'Đang thực thi...' : 'Thực thi Công cụ'}
              </button>
            </div>
          </form>
        )}
      </CustomModal>
    </div>
  );
};
