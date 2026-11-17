import React from 'react';
import { Flame } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import type { CrmContactRecord } from '../../drawers/crmTypes';
import {
  formatCurrencyVnd,
  formatRelativeTimeVi,
  getHeatTier,
  maskClientPiiFallback,
} from '../../drawers/crm360Api';

export interface ContactsListViewTableProps {
  items: CrmContactRecord[];
  selectedIds: string[];
  onChangeSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  effectiveUnmask: boolean;
  onSelectContact: (contact: CrmContactRecord) => void;
}

export const ContactsListViewTable: React.FC<ContactsListViewTableProps> = ({
  items,
  selectedIds,
  onChangeSelectedIds,
  effectiveUnmask,
  onSelectContact,
}) => (
  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
      <thead>
        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
          <th style={{ padding: '12px 14px', width: 38 }}>
            <input
              type="checkbox"
              checked={items.length > 0 && selectedIds.length === items.length}
              onChange={(e) =>
                onChangeSelectedIds(e.target.checked ? items.map((x) => x.id) : [])
              }
            />
          </th>
          <th style={{ padding: '12px 14px' }}>Khách hàng & Công ty</th>
          <th style={{ padding: '12px 14px' }}>Liên hệ (SĐT / Email)</th>
          <th style={{ padding: '12px 14px' }}>Bước Phễu & Vòng đời</th>
          <th style={{ padding: '12px 14px' }}>Lead Score</th>
          <th style={{ padding: '12px 14px' }}>Tags</th>
          <th style={{ padding: '12px 14px' }}>Doanh thu / Tương tác</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
              Không tìm thấy hồ sơ khách hàng phù hợp với bộ lọc hiện tại.
            </td>
          </tr>
        ) : (
          items.map((c) => {
            const heat = getHeatTier(c.lead_score);
            return (
              <tr
                key={c.id}
                style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                onClick={() => onSelectContact(c)}
              >
                <td style={{ padding: '12px 14px' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={(e) =>
                      onChangeSelectedIds((prev) =>
                        e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                      )
                    }
                  />
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={c.name} size="sm" />
                    <div>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {c.company_name || c.product_interest || c.source || 'Master Contact'}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>
                    {maskClientPiiFallback(c.phone, effectiveUnmask, 'phone')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {maskClientPiiFallback(c.email, effectiveUnmask, 'email')}
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF' }}>
                    {c.stage_name || c.lifecycle_stage || 'lead'}
                  </span>
                  <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: 3 }}>
                    PT: {c.owner_name || 'Chưa giao'}
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: heat.bg, color: heat.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Flame size={12} /> {c.lead_score}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(c.tags || []).slice(0, 2).map((tg) => (
                      <span key={tg.id} style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#F1F5F9', color: '#334155' }}>
                        #{tg.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 800, color: '#059669' }}>
                    {formatCurrencyVnd(c.total_revenue_vnd)}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#94A3B8' }}>
                    {formatRelativeTimeVi(c.last_engaged_at || c.created_at)}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);
