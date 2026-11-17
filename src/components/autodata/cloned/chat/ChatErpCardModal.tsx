import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  CheckSquare,
  FileCheck2,
  Handshake,
  Plus,
  Receipt,
  Search,
  Send,
  TrendingUp,
  Users,
} from 'lucide-react';
import { CustomModal } from '../components/ui/CustomModal';
import { Badge, EmptyState } from '../components/ui/AutoDataLoadingModal';
import { ModalBodySkeleton } from '../components/ui/Skeleton';
import { apiRequest, formatVnd } from '../../autodataApi';
import {
  ERP_CARD_CATEGORY_META,
  type ErpCardEntityType,
  type WorkChatAttachmentItem,
} from './workchatTypes';

export interface ChatErpCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (card: WorkChatAttachmentItem) => void;
  token?: string | null;
  tenantSlug?: string | null;
}

interface RawErpRecord {
  id: string;
  title: string;
  code: string;
  subtitle: string;
  status: string;
  amount_label?: string;
}

const CATEGORY_TABS: ReadonlyArray<{
  key: ErpCardEntityType;
  label: string;
  icon: React.ReactNode;
}> = [
  { key: 'lead', label: 'Lead CRM', icon: <Users size={14} /> },
  { key: 'deal', label: 'Cơ hội Deal', icon: <TrendingUp size={14} /> },
  { key: 'task', label: 'Công việc Task', icon: <CheckSquare size={14} /> },
  { key: 'approval', label: 'Đơn Phê duyệt', icon: <FileCheck2 size={14} /> },
  { key: 'payslip', label: 'Phiếu Lương', icon: <Receipt size={14} /> },
  { key: 'cooperation_slip', label: 'Phiếu Hợp Tác', icon: <Handshake size={14} /> },
];

function extractRowsFromResponse(res: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(res)) return res as Array<Record<string, unknown>>;
  if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as Array<Record<string, unknown>>;
    if (Array.isArray(obj.rows)) return obj.rows as Array<Record<string, unknown>>;
    if (Array.isArray(obj.slips)) return obj.slips as Array<Record<string, unknown>>;
    if (Array.isArray(obj.requests)) return obj.requests as Array<Record<string, unknown>>;
    if (Array.isArray(obj.tasks)) return obj.tasks as Array<Record<string, unknown>>;
  }
  return [];
}

function normalizeErpRow(row: Record<string, unknown>, category: ErpCardEntityType): RawErpRecord {
  const id = String(row.id ?? row.entity_id ?? '');
  const title = String(
    row.title ??
      row.full_name ??
      row.customer_name ??
      row.employee_name ??
      row.subject ??
      row.name ??
      `Bản ghi ${ERP_CARD_CATEGORY_META[category].label}`
  );
  const code = String(
    row.code ??
      row.request_code ??
      row.slip_code ??
      row.unit_code ??
      row.employee_code ??
      (id ? `#${id.slice(0, 8).toUpperCase()}` : '#ERP')
  );
  const subtitle = String(
    row.subtitle ??
      row.project_name ??
      row.department_name ??
      row.phone ??
      row.email ??
      row.period_key ??
      ''
  );
  const status = String(row.status ?? row.stage_name ?? 'active');
  const numericAmount = Number(
    row.net_salary ?? row.expected_commission ?? row.amount ?? row.deal_value ?? row.expected_revenue ?? 0
  );
  const amountLabel = numericAmount > 0 ? formatVnd(numericAmount) : undefined;

  return {
    id,
    title,
    code,
    subtitle,
    status,
    amount_label: amountLabel,
  };
}

function getEndpointForCategory(category: ErpCardEntityType): string {
  switch (category) {
    case 'lead':
      return '/leads?limit=25';
    case 'deal':
      return '/deals?limit=25';
    case 'task':
      return '/projects/tasks?limit=25';
    case 'approval':
      return '/approvals/requests?limit=25';
    case 'payslip':
      return '/payroll/slips?limit=25';
    case 'cooperation_slip':
      return '/payroll/cooperation-slips?limit=25';
  }
}

export const ChatErpCardModal: React.FC<ChatErpCardModalProps> = ({
  isOpen,
  onClose,
  onSelectCard,
  token,
  tenantSlug,
}) => {
  const [category, setCategory] = useState<ErpCardEntityType>('lead');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<RawErpRecord[]>([]);
  const [manualTitle, setManualTitle] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        let rows: Array<Record<string, unknown>> = [];
        try {
          const searchRes = await apiRequest<unknown>(
            `/workchat/erp-cards?type=${encodeURIComponent(category)}&q=${encodeURIComponent(query.trim())}`,
            { token, tenantSlug }
          );
          rows = extractRowsFromResponse(searchRes);
        } catch {
          const fallbackRes = await apiRequest<unknown>(getEndpointForCategory(category), {
            token,
            tenantSlug,
          });
          rows = extractRowsFromResponse(fallbackRes);
        }

        if (!cancelled) {
          const mapped = rows.map((r) => normalizeErpRow(r, category));
          const kw = query.trim().toLowerCase();
          const filtered = kw
            ? mapped.filter((item) =>
                `${item.title} ${item.code} ${item.subtitle}`.toLowerCase().includes(kw)
              )
            : mapped;
          setRecords(filtered);
        }
      } catch {
        if (!cancelled) {
          setRecords([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, category, query, token, tenantSlug]);

  const handleChoose = (rec: RawErpRecord) => {
    const meta = ERP_CARD_CATEGORY_META[category];
    onSelectCard({
      kind: 'erp_card',
      entity_type: category,
      entity_id: rec.id,
      title: rec.title,
      code: rec.code,
      subtitle: rec.subtitle || meta.label,
      status: rec.status,
      amount_label: rec.amount_label,
      url: meta.route,
    });
    onClose();
  };

  const handleSendManual = () => {
    if (!manualTitle.trim()) return;
    const meta = ERP_CARD_CATEGORY_META[category];
    onSelectCard({
      kind: 'erp_card',
      entity_type: category,
      title: manualTitle.trim(),
      code: manualCode.trim() || `#${category.toUpperCase()}`,
      subtitle: meta.label,
      status: 'active',
      url: meta.route,
    });
    setManualTitle('');
    setManualCode('');
    setShowManualForm(false);
    onClose();
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Đính kèm Thẻ Nghiệp Vụ Thông Minh (Smart ERP Card)"
      width={720}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Category Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CATEGORY_TABS.map((tab) => {
            const active = tab.key === category;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategory(tab.key)}
                style={{
                  minHeight: 38,
                  padding: '0 12px',
                  borderRadius: 11,
                  border: active ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                  background: active ? '#EEF2FF' : '#FFFFFF',
                  color: active ? '#1E40FF' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: active ? 800 : 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search + Quick Custom Card Toggle */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div
            style={{
              flex: 1,
              minWidth: 220,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 12px',
              minHeight: 42,
              borderRadius: 12,
              border: '1px solid #CBD5E1',
              background: '#F8F9FA',
            }}
          >
            <Search size={16} color="#64748B" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Tìm kiếm ${ERP_CARD_CATEGORY_META[category].label.toLowerCase()} theo mã, tiêu đề...`}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.84rem',
                color: '#0F172A',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowManualForm((prev) => !prev)}
            style={{
              minHeight: 42,
              padding: '0 13px',
              borderRadius: 12,
              border: '1px solid #DBEAFE',
              background: '#EFF6FF',
              color: '#1E40FF',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            <span>Tạo thẻ nhanh</span>
          </button>
        </div>

        {showManualForm && (
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              background: '#F8FAFF',
              border: '1px solid #DBEAFE',
              display: 'grid',
              gridTemplateColumns: '1fr 150px auto',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="Tiêu đề thẻ nghiệp vụ..."
              style={{
                minHeight: 40,
                padding: '0 11px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '0.82rem',
              }}
            />
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Mã tham chiếu (#SO-01)"
              style={{
                minHeight: 40,
                padding: '0 11px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '0.82rem',
              }}
            />
            <button
              type="button"
              onClick={handleSendManual}
              style={{
                minHeight: 40,
                padding: '0 14px',
                borderRadius: 10,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Đính kèm
            </button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <ModalBodySkeleton rows={4} />
        ) : records.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={22} />}
            title={`Chưa tìm thấy ${ERP_CARD_CATEGORY_META[category].label}`}
            description="Bạn có thể đổi từ khóa tìm kiếm hoặc bấm 'Tạo thẻ nhanh' để gắn thẻ tham chiếu trực tiếp vào kênh chat."
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: 360,
              overflowY: 'auto',
              paddingRight: 2,
            }}
          >
            {records.map((rec) => (
              <div
                key={`${category}_${rec.id}_${rec.code}`}
                onClick={() => handleChoose(rec)}
                style={{
                  padding: '11px 14px',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <Badge tone="primary">{rec.code}</Badge>
                    <span
                      style={{
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {rec.title}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 3 }}>
                    {rec.subtitle || ERP_CARD_CATEGORY_META[category].label} • Trạng thái: {rec.status}
                    {rec.amount_label ? ` • ${rec.amount_label}` : ''}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChoose(rec);
                  }}
                  style={{
                    minHeight: 34,
                    padding: '0 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Send size={12} />
                  <span>Gửi thẻ</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomModal>
  );
};

export default ChatErpCardModal;
