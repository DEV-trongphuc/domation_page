import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import type { ArticleChartSpec } from '../../data/boostTypes';

interface ArticleChartDashboardProps {
  id: string;
  heading: string;
  subtitle?: string;
  chart: ArticleChartSpec;
  insightSummary: string;
}

interface CustomTooltipPayloadItem {
  name?: string;
  value?: string | number;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  label?: string;
  unit?: string;
}

const ChartCustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, unit }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl bg-white/95 text-slate-900 border border-slate-200/90 px-3.5 py-2.5 shadow-[0_14px_34px_-8px_rgba(15,23,42,0.16)] text-xs space-y-1.5 backdrop-blur-md">
      {label !== undefined && (
        <div className="font-bold text-slate-900 border-b border-slate-200/80 pb-1">{label}</div>
      )}
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color || '#1E40FF' }}
            />
            <span>{entry.name}</span>
          </span>
          <span className="font-mono font-bold text-[#1E40FF]">
            {entry.value}
            {unit ? ` ${unit}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ArticleChartDashboard: React.FC<ArticleChartDashboardProps> = ({
  id,
  heading,
  subtitle,
  chart,
  insightSummary,
}) => {
  const unit = chart.yUnit || '';

  const renderChartBody = () => {
    if (chart.chartType === 'donut') {
      const valueKey = chart.series[0]?.key || 'value';
      const colors = chart.series.map((s) => s.color);
      const fallbackPalette = ['#1E40FF', '#0284C7', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chart.data}
              dataKey={valueKey}
              nameKey={chart.xKey}
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={106}
              paddingAngle={3}
              strokeWidth={2}
              stroke="#FFFFFF"
            >
              {chart.data.map((_, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={colors[idx] || fallbackPalette[idx % fallbackPalette.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartCustomTooltip unit={unit} />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chart.chartType === 'radar') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={chart.data} cx="50%" cy="50%" outerRadius="72%">
            <PolarGrid stroke="#CBD5E1" />
            <PolarAngleAxis
              dataKey={chart.xKey}
              tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis tick={{ fill: '#64748B', fontSize: 10 }} />
            {chart.series.map((s) => (
              <Radar
                key={s.key}
                name={s.label}
                dataKey={s.key}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.22}
                strokeWidth={2}
              />
            ))}
            <Tooltip content={<ChartCustomTooltip unit={unit} />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          </RadarChart>
        </ResponsiveContainer>
      );
    }

    if (chart.chartType === 'horizontal-bar') {
      return (
        <ResponsiveContainer width="100%" height={Math.max(280, chart.data.length * 44)}>
          <BarChart
            data={chart.data}
            layout="vertical"
            margin={{ top: 8, right: 24, left: 20, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey={chart.xKey}
              width={130}
              tick={{ fill: '#1E293B', fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip content={<ChartCustomTooltip unit={unit} />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            {chart.series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                radius={[0, 6, 6, 0]}
                barSize={16}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chart.chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chart.data} margin={{ top: 10, right: 20, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey={chart.xKey} tick={{ fill: '#475569', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
            <Tooltip content={<ChartCustomTooltip unit={unit} />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            {chart.series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.5}
                dot={{ r: 3.5, strokeWidth: 2 }}
                activeDot={{ r: 5.5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chart.chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chart.data} margin={{ top: 10, right: 20, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey={chart.xKey} tick={{ fill: '#475569', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
            <Tooltip content={<ChartCustomTooltip unit={unit} />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            {chart.series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.18}
                strokeWidth={2.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (chart.chartType === 'composed') {
      return (
        <ResponsiveContainer width="100%" height={310}>
          <ComposedChart data={chart.data} margin={{ top: 10, right: 20, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey={chart.xKey} tick={{ fill: '#475569', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
            <Tooltip content={<ChartCustomTooltip unit={unit} />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            {chart.series.map((s, idx) => {
              const kind = s.type || (idx === 0 ? 'bar' : 'line');
              if (kind === 'line') {
                return (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2.5}
                    dot={{ r: 3.5 }}
                  />
                );
              }
              if (kind === 'area') {
                return (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    fill={s.color}
                    fillOpacity={0.18}
                  />
                );
              }
              return (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color}
                  radius={[6, 6, 0, 0]}
                  barSize={26}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chart.data} margin={{ top: 10, right: 20, left: 4, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey={chart.xKey} tick={{ fill: '#475569', fontSize: 11 }} />
          <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
          <Tooltip content={<ChartCustomTooltip unit={unit} />} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          {chart.series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              radius={[6, 6, 0, 0]}
              barSize={24}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <section
      id={id}
      className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 border-t-2 border-t-[#1E40FF]/40 p-6 sm:p-8 shadow-xs space-y-5 scroll-mt-24"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1E40FF]">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Biểu đồ số liệu</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{heading}</h2>
          {(subtitle || chart.subtitle) && (
            <p className="text-xs sm:text-sm text-slate-500">{subtitle || chart.subtitle}</p>
          )}
        </div>
        {chart.yUnit && (
          <span className="px-3 py-1 rounded-full bg-blue-50/70 border border-blue-200/80 text-[11px] font-mono font-semibold text-[#1E40FF]">
            Đơn vị: {chart.yUnit}
          </span>
        )}
      </div>

      {chart.kpis && chart.kpis.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {chart.kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl bg-gradient-to-br from-slate-50/90 to-blue-50/40 border border-slate-200/85 p-3.5 space-y-1"
            >
              <div className="text-[11px] font-semibold text-slate-500 line-clamp-1">
                {kpi.label}
              </div>
              <div className="text-lg font-extrabold text-slate-900">{kpi.value}</div>
              {kpi.delta && (
                <div
                  className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                    kpi.positive === false ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {kpi.positive === false ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <TrendingUp className="w-3 h-3" />
                  )}
                  <span>{kpi.delta}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-slate-50/70 border border-slate-200/80 p-3 sm:p-5">
        <div className="text-xs font-bold text-slate-700 mb-3">{chart.title}</div>
        {renderChartBody()}
        {chart.sourceNote && (
          <div className="mt-2 pt-2 border-t border-slate-200/70 text-[11px] text-slate-500 italic">
            Nguồn &amp; phương pháp đo: {chart.sourceNote}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-blue-50/75 border border-blue-200/80 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <strong className="text-[#1E40FF]">Phân tích số liệu: </strong>
        {insightSummary}
      </div>
    </section>
  );
};

export default ArticleChartDashboard;
