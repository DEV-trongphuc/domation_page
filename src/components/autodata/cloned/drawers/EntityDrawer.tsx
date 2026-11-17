import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FileBadge, FileText, History, Settings, Tag, User } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { DrawerShell, type DrawerTabDef } from './DrawerShell';
import { formatCurrencyVnd } from './crm360Api';

export interface EntityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Record<string, unknown> | null;
  onSave?: (updated: Record<string, unknown>) => void;
  zIndex?: number;
}

const TABS: DrawerTabDef[] = [
  { id: 'info', label: 'Thông tin chung', icon: <User size={15} /> },
  { id: 'activities', label: 'Lịch sử & Ghi chú', icon: <History size={15} /> },
  { id: 'docs', label: 'Hồ sơ & Tài liệu', icon: <FileBadge size={15} /> },
  { id: 'invoices', label: 'Biểu đồ Giao dịch', icon: <FileText size={15} /> },
  { id: 'settings', label: 'Thiết lập & Cổng TT', icon: <Settings size={15} /> },
  { id: 'tags', label: 'Tags & Thuộc tính', icon: <Tag size={15} /> },
];

const SAMPLE_TX_SERIES = [
  { period: 'T1', value: 12000000 },
  { period: 'T2', value: 18500000 },
  { period: 'T3', value: 15000000 },
  { period: 'T4', value: 28000000 },
  { period: 'T5', value: 34000000 },
  { period: 'T6', value: 42000000 },
];

export const EntityDrawer: React.FC<EntityDrawerProps> = ({
  isOpen,
  onClose,
  entity,
  onSave,
  zIndex = 1250,
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [draft, setDraft] = useState<Record<string, unknown>>(entity || {});
  const merged = { ...(entity || {}), ...draft };
  const displayName = String(
    merged.full_name || merged.name || merged.title || 'Thực thể Doanh nghiệp'
  );

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={zIndex}
      avatarNode={<Avatar name={displayName} size="lg" />}
      title={displayName}
      subtitle={String(merged.code || merged.email || merged.phone || 'Hồ sơ Thực thể 360°')}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={
        onSave ? (
          <button
            type="button"
            onClick={() => onSave(merged)}
            style={{
              height: 44,
              padding: '0 1.4rem',
              borderRadius: 10,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Lưu thay đổi
          </button>
        ) : undefined
      }
    >
      {activeTab === 'info' && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '1.35rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {(['name', 'phone', 'email', 'company_name', 'job_title', 'status'] as const).map(
            (field) => (
              <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  {field.replace(/_/g, ' ')}
                </span>
                <input
                  value={String(merged[field] ?? '')}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [field]: e.target.value }))}
                  style={{
                    height: 44,
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    padding: '0 12px',
                    fontSize: '0.84rem',
                  }}
                />
              </label>
            )
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '1.35rem',
          }}
        >
          <strong style={{ display: 'block', marginBottom: 12, fontSize: '0.92rem', color: '#0F172A' }}>
            Xu hướng Giá trị Giao dịch 6 kỳ gần nhất
          </strong>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SAMPLE_TX_SERIES}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="period" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip formatter={(v) => formatCurrencyVnd(v)} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#1E40FF"
                  fill="#DBEAFE"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab !== 'info' && activeTab !== 'invoices' && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '1.5rem',
            fontSize: '0.84rem',
            color: '#475569',
          }}
        >
          Dữ liệu phân mục <strong>{activeTab.toUpperCase()}</strong> đang đồng bộ trực tiếp với lõi Multi-Tenant CRM 360°.
        </div>
      )}
    </DrawerShell>
  );
};

export default EntityDrawer;
