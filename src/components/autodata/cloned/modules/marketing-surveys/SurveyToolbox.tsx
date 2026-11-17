import React, { useMemo, useState } from 'react';
import { Layers, Plus, Search } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import {
  SURVEY_25_BLOCKS,
  type BlockCatalogEntry,
  type SurveyBlockType,
} from './surveyTypes';

interface SurveyToolboxProps {
  catalog?: ReadonlyArray<BlockCatalogEntry>;
  onAddBlock: (type: SurveyBlockType) => void;
}

export const SurveyToolbox: React.FC<SurveyToolboxProps> = ({
  catalog = SURVEY_25_BLOCKS,
  onAddBlock,
}) => {
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const source = catalog.length === 25 ? catalog : SURVEY_25_BLOCKS;
    const filtered = source.filter(
      (b) =>
        !q ||
        b.label.toLowerCase().includes(q) ||
        b.group.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q)
    );
    const map = new Map<string, BlockCatalogEntry[]>();
    for (const item of filtered) {
      const arr = map.get(item.group) || [];
      arr.push(item);
      map.set(item.group, arr);
    }
    return Array.from(map.entries());
  }, [catalog, search]);

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 18,
        padding: '0.9rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxHeight: 'calc(100vh - 170px)',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.84rem', color: '#0F172A' }}>
          <Layers size={16} color="#1E40FF" /> Thư Viện 25 Khối
        </div>
        <Badge tone="primary">25 Blocks</Badge>
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
        <input
          className="form-input"
          style={{ height: 36, paddingLeft: 30, fontSize: '0.76rem', background: '#F8F9FA', border: '1px solid #E2E8F0' }}
          placeholder="Tìm khối câu hỏi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {grouped.map(([groupName, entries]) => (
        <div key={groupName} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#1E40FF',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              padding: '4px 2px 0',
            }}
          >
            {groupName} ({entries.length})
          </div>
          {entries.map((entry) => (
            <button
              key={entry.type}
              type="button"
              onClick={() => onAddBlock(entry.type)}
              style={{
                textAlign: 'left',
                padding: '0.5rem 0.65rem',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.79rem', fontWeight: 700, color: '#0F172A' }}>
                  {entry.label}
                </div>
                {entry.hint && (
                  <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: 1 }}>
                    {entry.hint}
                  </div>
                )}
              </div>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  background: '#EEF2FF',
                  color: '#1E40FF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Plus size={13} />
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default SurveyToolbox;
