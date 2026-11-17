export type DynamicChartViewType = 'bar' | 'hbar' | 'line' | 'area' | 'pie' | 'funnel' | 'table';

export interface DynamicChartSeriesSpec {
  dataKey: string;
  name: string;
  color?: string;
}

export interface DynamicChartDatasetSpec {
  label: string;
  key?: string;
  title?: string;
  subtitle?: string;
  type?: string;
  xAxisKey?: string;
  data: Array<Record<string, string | number>>;
  series?: DynamicChartSeriesSpec[];
}

export interface DynamicChartSpec {
  title?: string;
  subtitle?: string;
  description?: string;
  type?: DynamicChartViewType;
  xAxisKey?: string;
  data: Array<Record<string, string | number>>;
  series?: DynamicChartSeriesSpec[];
  datasets?: DynamicChartDatasetSpec[];
}

export interface ActionProposalSpec {
  action_type: string;
  title: string;
  summary: string;
  params: Record<string, unknown>;
}

const VALID_CHART_TYPES: ReadonlySet<string> = new Set([
  'bar',
  'hbar',
  'line',
  'area',
  'pie',
  'funnel',
  'table',
]);

export function normalizeChartViewType(raw?: string | null): DynamicChartViewType {
  if (raw && VALID_CHART_TYPES.has(raw)) {
    return raw as DynamicChartViewType;
  }
  return 'bar';
}

function safeParseJsonObject(raw: string): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    try {
      const cleaned = raw
        .replace(/\\u(?![0-9a-fA-F]{4})/g, '')
        .replace(/,\s*([}\]])/g, '$1');
      const parsed: unknown = JSON.parse(cleaned);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }
}

function coerceChartRows(raw: unknown): Array<Record<string, string | number>> {
  if (!Array.isArray(raw)) return [];
  const rows: Array<Record<string, string | number>> = [];
  for (const item of raw) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const row: Record<string, string | number> = {};
      for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
        if (typeof v === 'number' && Number.isFinite(v)) {
          row[k] = v;
        } else if (typeof v === 'string') {
          const maybeNum = Number(v);
          row[k] = v.trim() !== '' && !Number.isNaN(maybeNum) && /^-?\d+(\.\d+)?$/.test(v.trim()) ? maybeNum : v;
        } else if (v !== null && v !== undefined) {
          row[k] = String(v);
        }
      }
      if (Object.keys(row).length > 0) {
        rows.push(row);
      }
    }
  }
  return rows;
}

function coerceChartSeries(
  raw: unknown,
  sampleRows: Array<Record<string, string | number>>,
  xAxisKey: string
): DynamicChartSeriesSpec[] {
  if (Array.isArray(raw) && raw.length > 0) {
    const parsed: DynamicChartSeriesSpec[] = [];
    for (const item of raw) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const rec = item as Record<string, unknown>;
        const dataKey = typeof rec.dataKey === 'string' && rec.dataKey.trim() ? rec.dataKey.trim() : '';
        if (dataKey) {
          parsed.push({
            dataKey,
            name: typeof rec.name === 'string' && rec.name.trim() ? rec.name.trim() : dataKey,
            color: typeof rec.color === 'string' && rec.color.trim() ? rec.color.trim() : undefined,
          });
        }
      }
    }
    if (parsed.length > 0) return parsed;
  }

  const firstRow = sampleRows[0];
  if (firstRow) {
    const numericKeys = Object.entries(firstRow)
      .filter(([k, v]) => k !== xAxisKey && typeof v === 'number')
      .map(([k]) => ({ dataKey: k, name: k === 'value' ? 'Giá trị' : k }));
    if (numericKeys.length > 0) return numericKeys;
  }

  return [{ dataKey: 'value', name: 'Giá trị' }];
}

function buildDynamicChartSpec(rawObj: Record<string, unknown>): DynamicChartSpec | null {
  const xAxisKey =
    typeof rawObj.xAxisKey === 'string' && rawObj.xAxisKey.trim() ? rawObj.xAxisKey.trim() : 'name';

  const datasets: DynamicChartDatasetSpec[] = [];
  if (Array.isArray(rawObj.datasets)) {
    rawObj.datasets.forEach((dsItem, idx) => {
      if (dsItem && typeof dsItem === 'object' && !Array.isArray(dsItem)) {
        const dsObj = dsItem as Record<string, unknown>;
        const dsXKey =
          typeof dsObj.xAxisKey === 'string' && dsObj.xAxisKey.trim() ? dsObj.xAxisKey.trim() : xAxisKey;
        const dsRows = coerceChartRows(dsObj.data);
        if (dsRows.length > 0) {
          datasets.push({
            key: typeof dsObj.key === 'string' ? dsObj.key : `ds_${idx}`,
            label:
              typeof dsObj.label === 'string' && dsObj.label.trim()
                ? dsObj.label.trim()
                : typeof dsObj.title === 'string' && dsObj.title.trim()
                  ? dsObj.title.trim()
                  : `Tập dữ liệu #${idx + 1}`,
            title: typeof dsObj.title === 'string' ? dsObj.title : undefined,
            subtitle: typeof dsObj.subtitle === 'string' ? dsObj.subtitle : undefined,
            type: typeof dsObj.type === 'string' ? dsObj.type : undefined,
            xAxisKey: dsXKey,
            data: dsRows,
            series: coerceChartSeries(dsObj.series, dsRows, dsXKey),
          });
        }
      }
    });
  }

  const directRows = coerceChartRows(rawObj.data);
  const primaryData = directRows.length > 0 ? directRows : datasets[0]?.data || [];
  if (primaryData.length === 0) return null;

  const primaryType = normalizeChartViewType(
    typeof rawObj.type === 'string' ? rawObj.type : datasets[0]?.type
  );

  return {
    title:
      typeof rawObj.title === 'string' && rawObj.title.trim()
        ? rawObj.title.trim()
        : datasets[0]?.title || 'Biểu đồ phân tích DOM Agent',
    subtitle:
      typeof rawObj.subtitle === 'string'
        ? rawObj.subtitle
        : typeof rawObj.description === 'string'
          ? rawObj.description
          : datasets[0]?.subtitle,
    type: primaryType,
    xAxisKey,
    data: primaryData,
    series: coerceChartSeries(rawObj.series, primaryData, xAxisKey),
    datasets: datasets.length > 0 ? datasets : undefined,
  };
}

/**
 * Parses and strips <<<CHART_DATA: {...} >>> or <<<DYNAMIC_CHART: {...} >>> tags from message content.
 */
export function parseChartDataTag(content: string): {
  cleanContent: string;
  chart: DynamicChartSpec | null;
} {
  if (!content || typeof content !== 'string') {
    return { cleanContent: '', chart: null };
  }

  let text = content;
  let chart: DynamicChartSpec | null = null;

  const patterns = [
    /<<<CHART_DATA:\s*(\{[\s\S]*?\})\s*>>>/g,
    /<<<DYNAMIC_CHART:\s*(\{[\s\S]*?\})\s*>>>/g,
    /\[\[CHART_DATA:\s*(\{[\s\S]*?\})\s*\]\]/g,
    /\[\[DYNAMIC_CHART:\s*(\{[\s\S]*?\})\s*\]\]/g,
  ];

  for (const regex of patterns) {
    const matches = Array.from(text.matchAll(regex));
    for (const m of matches) {
      text = text.replace(m[0], '').trim();
      if (!chart) {
        const parsed = safeParseJsonObject(m[1]);
        if (parsed) {
          chart = buildDynamicChartSpec(parsed);
        }
      }
    }
  }

  return { cleanContent: text, chart };
}

function extractProposalFromObject(raw: Record<string, unknown>): ActionProposalSpec {
  let params: Record<string, unknown> = {};
  if (raw.params && typeof raw.params === 'object' && !Array.isArray(raw.params)) {
    params = { ...(raw.params as Record<string, unknown>) };
  }
  if (typeof raw.params_json === 'string') {
    const extra = safeParseJsonObject(raw.params_json);
    if (extra) params = { ...params, ...extra };
  } else if (raw.params_json && typeof raw.params_json === 'object' && !Array.isArray(raw.params_json)) {
    params = { ...params, ...(raw.params_json as Record<string, unknown>) };
  }

  const actionType =
    typeof raw.action_type === 'string' && raw.action_type.trim()
      ? raw.action_type.trim()
      : typeof params.action_type === 'string' && params.action_type.trim()
        ? params.action_type.trim()
        : 'task';

  const title =
    typeof raw.title === 'string' && raw.title.trim()
      ? raw.title.trim()
      : typeof params.title === 'string' && params.title.trim()
        ? params.title.trim()
        : 'Đề xuất thực thi tác vụ ERP';

  const summary =
    typeof raw.summary === 'string' && raw.summary.trim()
      ? raw.summary.trim()
      : typeof params.summary === 'string' && params.summary.trim()
        ? params.summary.trim()
        : 'Đề xuất hành động xác nhận trước khi ghi từ DOM Agent';

  return {
    action_type: actionType,
    title,
    summary,
    params,
  };
}

/**
 * Parses <<<ACTION_PROPOSAL: {...} >>> AND <<<CHART_DATA: {...} >>> tags cleanly.
 */
export function parseActionProposal(content: string): {
  cleanContent: string;
  proposal: ActionProposalSpec | null;
  proposals: ActionProposalSpec[];
  chart: DynamicChartSpec | null;
} {
  if (!content || typeof content !== 'string') {
    return { cleanContent: '', proposal: null, proposals: [], chart: null };
  }

  const chartParsed = parseChartDataTag(content);
  let text = chartParsed.cleanContent;
  const proposals: ActionProposalSpec[] = [];

  const proposalPatterns = [
    /<<<ACTION_PROPOSAL:\s*(\{[\s\S]*?\})\s*>>>/g,
    /\[\[ACTION_PROPOSAL:\s*(\{[\s\S]*?\})\s*\]\]/g,
  ];

  for (const regex of proposalPatterns) {
    const matches = Array.from(text.matchAll(regex));
    for (const m of matches) {
      text = text.replace(m[0], '').trim();
      const raw = safeParseJsonObject(m[1]);
      if (raw) {
        proposals.push(extractProposalFromObject(raw));
      } else {
        const typeMatch = m[1].match(/"action_type"\s*:\s*"([^"]+)"/);
        const titleMatch = m[1].match(/"title"\s*:\s*"([^"]+)"/);
        const summaryMatch = m[1].match(/"summary"\s*:\s*"([^"]+)"/);
        if (typeMatch) {
          proposals.push({
            action_type: typeMatch[1],
            title: titleMatch ? titleMatch[1] : 'Đề xuất hành động ERP',
            summary: summaryMatch ? summaryMatch[1] : 'Đề xuất từ DOM Agent',
            params: {},
          });
        }
      }
    }
  }

  // Strip unclosed streaming tag tail if message is mid-stream
  text = text.replace(/<<<[A-Z_]+(?::[\s\S]*)?$/, '').trim();

  return {
    cleanContent: text,
    proposal: proposals[0] || null,
    proposals,
    chart: chartParsed.chart,
  };
}
