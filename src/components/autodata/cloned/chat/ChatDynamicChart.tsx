import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlignLeft,
  BarChart3,
  Check,
  Copy,
  Filter,
  Maximize2,
  Minimize2,
  PieChart as PieIcon,
  Table as TableIcon,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  normalizeChartViewType,
  type DynamicChartSpec,
  type DynamicChartViewType,
} from './actionProposalUtils';
import { copyPlainText } from './workchatTypes';

const SAPPHIRE_PALETTE = [
  '#1E40FF',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#0284C7',
  '#14B8A6',
];

const VIEW_SWITCHER_OPTIONS: ReadonlyArray<{ id: DynamicChartViewType; label: string }> = [
  { id: 'bar', label: 'Cột' },
  { id: 'hbar', label: 'Ngang' },
  { id: 'line', label: 'Đường' },
  { id: 'area', label: 'Miền' },
  { id: 'pie', label: 'Tròn' },
  { id: 'funnel', label: 'Phễu' },
  { id: 'table', label: 'Bảng' },
];

function formatCompactValue(value: unknown): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return String(value ?? '');
  }
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} Tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tr`;
  }
  return value.toLocaleString('vi-VN');
}

export interface ChatDynamicChartProps {
  chart: DynamicChartSpec;
}

export const ChatDynamicChart: React.FC<ChatDynamicChartProps> = ({ chart }) => {
  const [activeDatasetIdx, setActiveDatasetIdx] = useState(0);
  const [viewOverride, setViewOverride] = useState<DynamicChartViewType | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const datasets = useMemo(
    () => (Array.isArray(chart.datasets) && chart.datasets.length > 0 ? chart.datasets : null),
    [chart.datasets]
  );

  const activeDataset = useMemo(
    () => (datasets ? datasets[activeDatasetIdx] || datasets[0] || null : null),
    [datasets, activeDatasetIdx]
  );

  const activeView: DynamicChartViewType =
    viewOverride ?? normalizeChartViewType(activeDataset?.type || chart.type);

  const activeRows = useMemo(() => {
    const candidate =
      activeDataset?.data && activeDataset.data.length > 0 ? activeDataset.data : chart.data;
    return Array.isArray(candidate) ? candidate : [];
  }, [activeDataset, chart.data]);

  const xAxisKey = activeDataset?.xAxisKey || chart.xAxisKey || 'name';

  const seriesList = useMemo(() => {
    if (activeDataset?.series && activeDataset.series.length > 0) return activeDataset.series;
    if (chart.series && chart.series.length > 0) return chart.series;
    return [{ dataKey: 'value', name: 'Giá trị' }];
  }, [activeDataset, chart.series]);

  const primaryKey = seriesList[0]?.dataKey || 'value';

  const totalPrimary = useMemo(
    () => activeRows.reduce((sum, row) => sum + (Number(row[primaryKey]) || 0), 0),
    [activeRows, primaryKey]
  );

  const maxPrimary = useMemo(
    () => activeRows.reduce((max, row) => Math.max(max, Number(row[primaryKey]) || 0), 0),
    [activeRows, primaryKey]
  );

  if (activeRows.length === 0) return null;

  const displayTitle = activeDataset?.title || chart.title || 'Biểu đồ phân tích số liệu';
  const displaySubtitle = activeDataset?.subtitle || chart.subtitle || chart.description || '';
  const chartHeight = isExpanded ? 340 : 230;

  const HeaderIcon =
    activeView === 'pie'
      ? PieIcon
      : activeView === 'line'
        ? TrendingUp
        : activeView === 'area'
          ? Activity
          : activeView === 'hbar'
            ? AlignLeft
            : activeView === 'funnel'
              ? Filter
              : activeView === 'table'
                ? TableIcon
                : BarChart3;

  const handleCopyTsv = async () => {
    const headers = ['STT', 'Danh mục', ...seriesList.map((s) => s.name || s.dataKey), 'Tỷ trọng (%)'];
    const lines = activeRows.map((row, idx) => {
      const primaryVal = Number(row[primaryKey]) || 0;
      const share = totalPrimary > 0 ? `${((primaryVal / totalPrimary) * 100).toFixed(1)}%` : '0%';
      return [
        String(idx + 1),
        String(row[xAxisKey] ?? `#${idx + 1}`),
        ...seriesList.map((s) => String(row[s.dataKey] ?? 0)),
        share,
      ].join('\t');
    });
    const tsv = [headers.join('\t'), ...lines].join('\n');
    const ok = await copyPlainText(tsv);
    if (ok) {
      setCopied(true);
      toast.success('Đã sao chép bảng số liệu TSV (dán trực tiếp vào Excel)');
      setTimeout(() => setCopied(false), 1800);
    } else {
      toast.error('Không thể sao chép vào bộ nhớ tạm');
    }
  };

  return (
    <div
      style={{
        marginTop: 10,
        marginBottom: 6,
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        padding: '12px 14px',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
        color: '#0F172A',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: '1 1 180px' }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #1E40FF 0%, #06B6D4 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <HeaderIcon size={15} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
              {displayTitle}
            </div>
            {displaySubtitle && (
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 2 }}>{displaySubtitle}</div>
            )}
          </div>
        </div>

        {/* View Switcher + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#F1F5F9',
              padding: 2,
              borderRadius: 9,
              border: '1px solid #E2E8F0',
              gap: 2,
            }}
          >
            {VIEW_SWITCHER_OPTIONS.map((opt) => {
              const selected = activeView === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setViewOverride(opt.id)}
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: selected ? 800 : 600,
                    padding: '3px 7px',
                    borderRadius: 7,
                    border: 'none',
                    background: selected ? '#FFFFFF' : 'transparent',
                    color: selected ? '#1E40FF' : '#64748B',
                    boxShadow: selected ? '0 1px 3px rgba(30, 64, 255, 0.12)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleCopyTsv}
            title="Sao chép TSV / Excel"
            style={{
              padding: '5px 8px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: copied ? '#059669' : '#475569',
              fontSize: '0.68rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? 'Thu gọn biểu đồ' : 'Mở rộng biểu đồ'}
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Multi-Dataset Tabs */}
      {datasets && datasets.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 8,
            marginBottom: 8,
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          {datasets.map((ds, idx) => {
            const isSelected = idx === activeDatasetIdx;
            return (
              <button
                key={ds.key || `${ds.label}_${idx}`}
                type="button"
                onClick={() => {
                  setActiveDatasetIdx(idx);
                  setViewOverride(null);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: isSelected ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                  background: isSelected ? '#EEF2FF' : '#F8FAFC',
                  color: isSelected ? '#1E40FF' : '#475569',
                  fontSize: '0.7rem',
                  fontWeight: isSelected ? 700 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {ds.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Chart / Funnel / Table Body */}
      {activeView === 'funnel' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: chartHeight + 40, overflowY: 'auto' }}>
          {activeRows.map((row, idx) => {
            const label = String(row[xAxisKey] ?? `Bước ${idx + 1}`);
            const val = Number(row[primaryKey]) || 0;
            const prevVal = idx > 0 ? Number(activeRows[idx - 1]?.[primaryKey]) || 0 : val;
            const conv = idx > 0 && prevVal > 0 ? `${((val / prevVal) * 100).toFixed(1)}%` : null;
            const widthPct = maxPrimary > 0 ? Math.max(8, Math.round((val / maxPrimary) * 100)) : 8;
            const color = SAPPHIRE_PALETTE[idx % SAPPHIRE_PALETTE.length];

            return (
              <div
                key={`${label}_${idx}`}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 5 }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>
                    {idx + 1}. {label}
                  </span>
                  <span style={{ fontWeight: 800, color }}>
                    {formatCompactValue(val)}
                    {conv ? ` • Chuyển đổi ${conv}` : ''}
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: '#E2E8F0', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${widthPct}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: color,
                      transition: 'width 0.25s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : activeView === 'table' ? (
        <div style={{ overflowX: 'auto', maxHeight: chartHeight + 50 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '7px 10px', textAlign: 'left', color: '#64748B' }}>#</th>
                <th style={{ padding: '7px 10px', textAlign: 'left', color: '#64748B' }}>Danh mục</th>
                {seriesList.map((s) => (
                  <th key={s.dataKey} style={{ padding: '7px 10px', textAlign: 'right', color: '#64748B' }}>
                    {s.name}
                  </th>
                ))}
                <th style={{ padding: '7px 10px', textAlign: 'right', color: '#64748B' }}>Tỷ trọng</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.map((row, idx) => {
                const primaryVal = Number(row[primaryKey]) || 0;
                const pct = totalPrimary > 0 ? `${((primaryVal / totalPrimary) * 100).toFixed(1)}%` : '0%';
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '7px 10px', color: '#64748B' }}>{idx + 1}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: '#0F172A' }}>
                      {String(row[xAxisKey] ?? `#${idx + 1}`)}
                    </td>
                    {seriesList.map((s) => (
                      <td
                        key={s.dataKey}
                        className="autodata-tabular-nums"
                        style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}
                      >
                        {formatCompactValue(row[s.dataKey])}
                      </td>
                    ))}
                    <td
                      className="autodata-tabular-nums"
                      style={{ padding: '7px 10px', textAlign: 'right', color: '#1E40FF', fontWeight: 700 }}
                    >
                      {pct}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ width: '100%', height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            {activeView === 'pie' ? (
              <PieChart>
                <Pie
                  data={activeRows}
                  dataKey={primaryKey}
                  nameKey={xAxisKey}
                  cx="50%"
                  cy="50%"
                  innerRadius={isExpanded ? 58 : 42}
                  outerRadius={isExpanded ? 105 : 78}
                  paddingAngle={2}
                >
                  {activeRows.map((_, idx) => (
                    <Cell key={idx} fill={SAPPHIRE_PALETTE[idx % SAPPHIRE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCompactValue(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            ) : activeView === 'hbar' ? (
              <BarChart data={activeRows} layout="vertical" margin={{ top: 6, right: 18, left: 16, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tickFormatter={(v) => formatCompactValue(Number(v))} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey={xAxisKey} width={96} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCompactValue(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {seriesList.map((s, idx) => (
                  <Bar
                    key={s.dataKey}
                    dataKey={s.dataKey}
                    name={s.name}
                    fill={s.color || SAPPHIRE_PALETTE[idx % SAPPHIRE_PALETTE.length]}
                    radius={[0, 6, 6, 0]}
                  />
                ))}
              </BarChart>
            ) : activeView === 'line' ? (
              <LineChart data={activeRows} margin={{ top: 8, right: 14, left: 4, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatCompactValue(Number(v))} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCompactValue(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {seriesList.map((s, idx) => (
                  <Line
                    key={s.dataKey}
                    type="monotone"
                    dataKey={s.dataKey}
                    name={s.name}
                    stroke={s.color || SAPPHIRE_PALETTE[idx % SAPPHIRE_PALETTE.length]}
                    strokeWidth={2.4}
                    dot={{ r: 3.5 }}
                  />
                ))}
              </LineChart>
            ) : activeView === 'area' ? (
              <AreaChart data={activeRows} margin={{ top: 8, right: 14, left: 4, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatCompactValue(Number(v))} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCompactValue(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {seriesList.map((s, idx) => {
                  const color = s.color || SAPPHIRE_PALETTE[idx % SAPPHIRE_PALETTE.length];
                  return (
                    <Area
                      key={s.dataKey}
                      type="monotone"
                      dataKey={s.dataKey}
                      name={s.name}
                      stroke={color}
                      fill={color}
                      fillOpacity={0.16}
                      strokeWidth={2.2}
                    />
                  );
                })}
              </AreaChart>
            ) : (
              <BarChart data={activeRows} margin={{ top: 8, right: 14, left: 4, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatCompactValue(Number(v))} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCompactValue(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {seriesList.map((s, idx) => (
                  <Bar
                    key={s.dataKey}
                    dataKey={s.dataKey}
                    name={s.name}
                    fill={s.color || SAPPHIRE_PALETTE[idx % SAPPHIRE_PALETTE.length]}
                    radius={[6, 6, 0, 0]}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ChatDynamicChart;
