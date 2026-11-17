import React, { useMemo, useState } from 'react';
import { Ban, CheckCircle2, Filter, Layers, Search, ShieldCheck, Users } from 'lucide-react';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import type { AudienceOptionDto } from './campaignTypes';

export interface AudienceSelectorProps {
  audiences: AudienceOptionDto[];
  selectedAudienceId: string;
  excludeAudienceIds: string[];
  suppressionCount: number;
  customerLabel: string;
  onSelectAudience: (audienceId: string) => void;
  onChangeExclusions: (excludeIds: string[]) => void;
}

export const AudienceSelector: React.FC<AudienceSelectorProps> = ({
  audiences,
  selectedAudienceId,
  excludeAudienceIds,
  suppressionCount,
  customerLabel,
  onSelectAudience,
  onChangeExclusions,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'static' | 'dynamic_logic'>('all');

  const filteredAudiences = useMemo(() => {
    const q = search.trim().toLowerCase();
    return audiences.filter((aud) => {
      if (typeFilter === 'dynamic_logic' && aud.audience_type !== 'dynamic_logic') return false;
      if (typeFilter === 'static' && aud.audience_type === 'dynamic_logic') return false;
      if (!q) return true;
      return aud.name.toLowerCase().includes(q);
    });
  }, [audiences, search, typeFilter]);

  const totalCatalogMembers = useMemo(
    () => audiences.reduce((sum, a) => sum + Number(a.cached_member_count || 0), 0),
    [audiences]
  );

  const selectedAudience = useMemo(
    () => audiences.find((a) => a.id === selectedAudienceId) || null,
    [audiences, selectedAudienceId]
  );

  const rawTargetCount = selectedAudience
    ? Number(selectedAudience.cached_member_count || 0)
    : Math.max(totalCatalogMembers, 120);

  const excludedCount = useMemo(() => {
    return excludeAudienceIds.reduce((acc, exId) => {
      if (exId === selectedAudienceId) return acc;
      const found = audiences.find((a) => a.id === exId);
      return acc + Number(found?.cached_member_count || 0);
    }, 0);
  }, [audiences, excludeAudienceIds, selectedAudienceId]);

  const netReachable = Math.max(0, rawTargetCount - Math.min(rawTargetCount, excludedCount + suppressionCount));

  const toggleExclude = (id: string) => {
    if (id === selectedAudienceId) return;
    if (excludeAudienceIds.includes(id)) {
      onChangeExclusions(excludeAudienceIds.filter((item) => item !== id));
    } else {
      onChangeExclusions([...excludeAudienceIds, id]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Net Reachable Live Calculator Banner */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFF 100%)',
          border: '1px solid #BFDBFE',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748B' }}>Tệp Đích Đã Chọn</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
            {rawTargetCount.toLocaleString('vi-VN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#475569' }}>
            {selectedAudience ? selectedAudience.name : `Toàn bộ ${customerLabel} đủ điều kiện`}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748B' }}>Tệp Loại Trừ (Exclusions)</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#D97706', marginTop: 2 }}>
            -{excludedCount.toLocaleString('vi-VN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#475569' }}>{excludeAudienceIds.length} tệp loại trừ</div>
        </div>

        <div>
          <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748B' }}>Suppression List</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#DC2626', marginTop: 2 }}>
            -{suppressionCount.toLocaleString('vi-VN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#475569' }}>Bounce & Unsubscribed</div>
        </div>

        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 14,
            background: '#FFFFFF',
            border: '1.5px solid #1E40FF',
            boxShadow: '0 4px 12px rgba(30, 64, 255, 0.10)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 800, color: '#1E40FF' }}>
            <ShieldCheck size={14} /> ƯỚC TÍNH TIẾP CẬN THỰC (NET)
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1E40FF', marginTop: 2 }}>
            {netReachable.toLocaleString('vi-VN')} {customerLabel}
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(
            [
              { key: 'all', label: 'Tất cả tệp' },
              { key: 'static', label: 'Tệp Data Tĩnh' },
              { key: 'dynamic_logic', label: 'Tệp Logic Động' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTypeFilter(item.key)}
              style={{
                height: 36,
                padding: '0 0.9rem',
                borderRadius: 10,
                border: typeFilter === item.key ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                background: typeFilter === item.key ? '#EEF2FF' : '#FFFFFF',
                color: typeFilter === item.key ? '#1E40FF' : '#475569',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
          <input
            className="form-input"
            style={{ height: 38, paddingLeft: 34 }}
            placeholder="Tìm tệp khách hàng (tenant_audiences)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 14 }}>
        {/* Target Audience Picker */}
        <Card
          title="1. Chọn Tệp Khách Hàng Đích (Target Audience)"
          subtitle="Tệp Logic Động sẽ tự động đánh giá lại thành viên theo thời gian thực ngay trước khi gửi"
          padding="1rem 1.15rem"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
            <button
              type="button"
              onClick={() => onSelectAudience('')}
              style={{
                padding: '0.75rem 0.95rem',
                borderRadius: 12,
                border: selectedAudienceId === '' ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                background: selectedAudienceId === '' ? '#F8FAFF' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} color="#1E40FF" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>
                    Toàn bộ {customerLabel} đủ điều kiện nhận tin
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
                    Tự động lọc subscribed & trừ Suppression List
                  </div>
                </div>
              </div>
              {selectedAudienceId === '' && <CheckCircle2 size={17} color="#1E40FF" />}
            </button>

            {filteredAudiences.map((aud) => {
              const isSelected = selectedAudienceId === aud.id;
              const isDynamic = aud.audience_type === 'dynamic_logic';
              return (
                <button
                  key={aud.id}
                  type="button"
                  onClick={() => {
                    onSelectAudience(aud.id);
                    if (excludeAudienceIds.includes(aud.id)) {
                      onChangeExclusions(excludeAudienceIds.filter((x) => x !== aud.id));
                    }
                  }}
                  style={{
                    padding: '0.75rem 0.95rem',
                    borderRadius: 12,
                    border: isSelected ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                    background: isSelected ? '#F8FAFF' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isDynamic ? <Filter size={15} color="#7E22CE" /> : <Layers size={15} color="#0284C7" />}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>{aud.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Badge tone={isDynamic ? 'purple' : 'info'}>
                          {isDynamic ? 'Tệp Logic Động' : 'Tệp Data Tĩnh'}
                        </Badge>
                        <span style={{ fontSize: '0.73rem', color: '#64748B', fontWeight: 600 }}>
                          {Number(aud.cached_member_count || 0).toLocaleString('vi-VN')} liên hệ
                        </span>
                      </div>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 size={17} color="#1E40FF" />}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Multi-select Exclusions */}
        <Card
          title="2. Loại Trừ Tệp Chéo (Exclude Audiences)"
          subtitle="Không gửi tới thành viên nằm trong các tệp bên dưới"
          padding="1rem 1.15rem"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
            {audiences.filter((a) => a.id !== selectedAudienceId).length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#64748B', padding: '1rem 0' }}>
                Chưa có tệp phụ nào khác để chọn loại trừ.
              </div>
            ) : (
              audiences
                .filter((a) => a.id !== selectedAudienceId)
                .map((aud) => {
                  const checked = excludeAudienceIds.includes(aud.id);
                  return (
                    <label
                      key={aud.id}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 12,
                        border: checked ? '1.5px solid #D97706' : '1px solid #E2E8F0',
                        background: checked ? '#FFFBEB' : '#F8F9FA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleExclude(aud.id)}
                          style={{ width: 16, height: 16, accentColor: '#D97706' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{aud.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            Loại trừ ~{Number(aud.cached_member_count || 0).toLocaleString('vi-VN')} người
                          </div>
                        </div>
                      </div>
                      {checked && (
                        <Badge tone="warning" icon={<Ban size={11} />}>
                          Loại trừ
                        </Badge>
                      )}
                    </label>
                  );
                })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AudienceSelector;
