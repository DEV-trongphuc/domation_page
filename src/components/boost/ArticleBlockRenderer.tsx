import React, { Suspense, lazy, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  CheckSquare,
  Code2,
  Compass,
  Copy,
  Cpu,
  ExternalLink,
  GitBranch,
  Layers,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  TrendingDown,
  TrendingUp,
  ZoomIn,
} from 'lucide-react';
import type { ArticleContentBlock } from '../../data/boostTypes';
import type { ReaderFontScale } from './blogMeta';

const LazyChartDashboard = lazy(() => import('./ArticleChartDashboard'));

interface ArticleBlockRendererProps {
  blocks: ArticleContentBlock[];
  onZoomImage?: (img: { src: string; caption: string }) => void;
  proseScale?: ReaderFontScale;
}

const PROSE_SCALE_CLASSES: Record<ReaderFontScale, { p: string; li: string }> = {
  sm: {
    p: 'text-sm sm:text-[14.5px] leading-[1.78]',
    li: 'text-xs sm:text-[13.5px] leading-relaxed',
  },
  md: {
    p: 'text-[14.5px] sm:text-[16px] leading-[1.85]',
    li: 'text-sm sm:text-[15px] leading-relaxed',
  },
  lg: {
    p: 'text-[15.5px] sm:text-[17.5px] leading-[1.88]',
    li: 'text-[14.5px] sm:text-[16px] leading-relaxed',
  },
};

const ChartSkeleton: React.FC = () => (
  <div className="rounded-3xl bg-white/95 border border-slate-200/85 p-6 sm:p-8 space-y-4 animate-pulse">
    <div className="h-4 w-44 rounded bg-slate-200" />
    <div className="h-7 w-3/4 rounded bg-slate-200" />
    <div className="h-[300px] w-full rounded-2xl bg-slate-100 border border-slate-200/70" />
  </div>
);

const CodeRecipeBlock: React.FC<{
  id: string;
  heading: string;
  language: string;
  filename?: string;
  description?: string;
  code: string;
  proseClass: string;
}> = ({ id, heading, language, filename, description, code, proseClass }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      id={id}
      className="rounded-3xl bg-white/95 border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{heading}</h2>
        <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-mono text-[11px] font-semibold text-slate-600 uppercase">
          {language}
        </span>
      </div>
      {description && <p className={`text-slate-600 ${proseClass}`}>{description}</p>}
      <div className="rounded-2xl bg-[#0F172A] text-slate-100 border border-slate-800 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/95 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-300">
            <Code2 className="w-3.5 h-3.5" />
            <span>{filename || `${language.toLowerCase()} snippet`}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Đã copy</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-x-auto">
          <pre className="text-xs font-mono leading-relaxed text-slate-200 whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
};

const ChecklistAuditBlock: React.FC<{
  id: string;
  heading: string;
  items: {
    check: string;
    severity: 'critical' | 'high' | 'recommended';
    verificationHow: string;
    passThreshold: string;
  }[];
  liClass: string;
}> = ({ id, heading, items, liClass }) => {
  const [checkedMap, setCheckedMap] = useState<Record<number, boolean>>({});
  const checkedCount = Object.values(checkedMap).filter(Boolean).length;
  const pct = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  return (
    <section
      id={id}
      className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-5 scroll-mt-24"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{heading}</h2>
        </div>

        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/85 text-xs font-bold text-slate-700">
          <span>
            Đã rà soát <strong className="text-[#1E40FF]">{checkedCount}</strong>/{items.length}
          </span>
          <span className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden inline-block">
            <span
              className="block h-full bg-gradient-to-r from-[#1E40FF] to-emerald-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((it, cIdx) => {
          const isChecked = Boolean(checkedMap[cIdx]);
          const sevStyle =
            it.severity === 'critical'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : it.severity === 'high'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-blue-50 border-blue-200 text-[#1E40FF]';
          return (
            <button
              key={cIdx}
              type="button"
              onClick={() => setCheckedMap((prev) => ({ ...prev, [cIdx]: !prev[cIdx] }))}
              aria-pressed={isChecked}
              className={`w-full text-left rounded-2xl border p-4 sm:p-5 space-y-2 transition-all cursor-pointer ${
                isChecked
                  ? 'bg-emerald-50/55 border-emerald-200/90 opacity-90'
                  : 'bg-slate-50/85 border-slate-200/80 hover:border-blue-300/80'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                  )}
                  <h3
                    className={`text-sm sm:text-base font-bold ${
                      isChecked ? 'line-through text-slate-500' : 'text-slate-900'
                    }`}
                  >
                    {it.check}
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0 ${sevStyle}`}
                >
                  {it.severity}
                </span>
              </div>
              <p className={`text-slate-600 pl-6.5 ${liClass}`}>
                <strong className="text-slate-800">Cách kiểm tra: </strong>
                {it.verificationHow}
              </p>
              <div className="text-xs font-semibold text-emerald-700 pl-6.5">
                ✓ Ngưỡng đạt chuẩn: {it.passThreshold}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export const ArticleBlockRenderer: React.FC<ArticleBlockRendererProps> = ({
  blocks,
  onZoomImage,
  proseScale = 'md',
}) => {
  const scaleCfg = PROSE_SCALE_CLASSES[proseScale] || PROSE_SCALE_CLASSES.md;

  return (
    <div className="space-y-8">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'prose': {
            const isIncident = block.variant === 'incident';
            const isContrarian = block.variant === 'contrarian';
            return (
              <section
                key={block.id || idx}
                id={block.id}
                className={`rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 border scroll-mt-24 ${
                  isIncident
                    ? 'bg-gradient-to-br from-rose-50/75 via-white to-amber-50/45 border-rose-200/80'
                    : isContrarian
                      ? 'bg-gradient-to-br from-[#FFFEFA] via-white to-blue-50/45 border-slate-200/90'
                      : 'bg-white/95 backdrop-blur-xl border-slate-200/85'
                }`}
              >
                {block.eyebrow && (
                  <div
                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                      isIncident ? 'text-rose-700' : 'text-[#1E40FF]'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{block.eyebrow}</span>
                  </div>
                )}
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {block.heading}
                </h2>

                {block.pullQuote && (
                  <blockquote className="rounded-2xl bg-gradient-to-r from-[#EEF4FF]/90 via-[#F8FAFF] to-white text-slate-900 px-5 py-4 border-l-4 border-[#1E40FF] border-y border-r border-slate-200/70 text-sm sm:text-base font-semibold leading-relaxed italic shadow-xs">
                    “{block.pullQuote}”
                  </blockquote>
                )}

                <div className="space-y-4">
                  {block.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className={`text-slate-700 ${scaleCfg.p}`}>
                      {p}
                    </p>
                  ))}
                </div>

                {block.bullets && block.bullets.length > 0 && (
                  <ul className="space-y-2.5 pt-2">
                    {block.bullets.map((b, bIdx) => (
                      <li
                        key={bIdx}
                        className={`flex items-start gap-2.5 text-slate-700 ${scaleCfg.li}`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#1E40FF] shrink-0 mt-1" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          }

          case 'chart-dashboard':
            return (
              <Suspense key={block.id || idx} fallback={<ChartSkeleton />}>
                <LazyChartDashboard
                  id={block.id}
                  heading={block.heading}
                  subtitle={block.subtitle}
                  chart={block.chart}
                  insightSummary={block.insightSummary}
                />
              </Suspense>
            );

          case 'comparison-matrix':
            return (
              <section
                key={block.id || idx}
                id={block.id}
                className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
              >
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1E40FF]">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Ma Trận Đối Chiếu Trực Diện</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {block.heading}
                  </h2>
                  {block.caption && (
                    <p className="text-xs sm:text-sm text-slate-500">{block.caption}</p>
                  )}
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200/90">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100/95 border-b border-slate-200 text-slate-800">
                        {block.columns.map((col, cIdx) => (
                          <th
                            key={cIdx}
                            className={`px-4 py-3.5 font-extrabold whitespace-nowrap ${
                              block.highlightColumn === cIdx
                                ? 'bg-[#1E40FF] text-white'
                                : 'text-slate-800'
                            }`}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 bg-white">
                      {block.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={`hover:bg-blue-50/30 transition-colors ${
                            rIdx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                          }`}
                        >
                          <td className="px-4 py-3.5 font-bold text-slate-900 align-top min-w-[160px]">
                            {row.criterion}
                            {row.winnerNote && (
                              <div className="text-[11px] font-semibold text-emerald-700 mt-1">
                                ★ {row.winnerNote}
                              </div>
                            )}
                          </td>
                          {row.values.map((val, vIdx) => (
                            <td
                              key={vIdx}
                              className={`px-4 py-3.5 text-slate-700 align-top leading-relaxed ${
                                block.highlightColumn === vIdx + 1
                                  ? 'bg-blue-50/55 font-semibold text-slate-900'
                                  : ''
                              }`}
                            >
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {block.footnote && (
                  <p className="text-xs text-slate-500 italic">{block.footnote}</p>
                )}
              </section>
            );

          case 'repo-card': {
            const { repo } = block;
            const scoreEntries = [
              { label: 'Production Readiness', val: repo.scores.productionReadiness },
              { label: 'Tốc độ Vibecode', val: repo.scores.vibecodeSpeed },
              { label: 'Bảo mật & Governance', val: repo.scores.securityGovernance },
              { label: 'Hiệu quả Chi phí', val: repo.scores.costEfficiency },
            ];
            return (
              <section
                key={block.id || idx}
                id={block.id}
                className="rounded-3xl bg-gradient-to-br from-white via-[#F7FAFF] to-[#F0FDFA] text-slate-900 border border-slate-200/90 shadow-[0_18px_46px_-22px_rgba(30,64,255,0.14)] overflow-hidden scroll-mt-24"
              >
                <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-[#0284C7] to-[#1E40FF]" />
                <div className="p-6 sm:p-8 space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-teal-700 uppercase tracking-wider">
                        <span className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center">
                          <GitBranch className="w-3.5 h-3.5" />
                        </span>
                        <span>{repo.category}</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                        {block.heading || `Audit Repository: ${repo.fullName}`}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] font-mono font-semibold">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                          Lang: {repo.primaryLanguage}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                          License: {repo.license}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF]">
                          ★ {repo.starsTier}
                        </span>
                      </div>
                    </div>
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-inkica-primary px-4 py-2.5 text-xs font-bold shrink-0"
                    >
                      <span>Mở GitHub Repo</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {scoreEntries.map((sc) => (
                      <div
                        key={sc.label}
                        className="rounded-2xl bg-white border border-slate-200/85 p-3.5 space-y-2 shadow-xs"
                      >
                        <div className="text-[11px] text-slate-500 font-semibold">{sc.label}</div>
                        <div className="text-lg font-black text-[#1E40FF]">{sc.val}/10</div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]"
                            style={{ width: `${Math.min(100, Math.max(0, sc.val * 10))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-4 space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        Nên dùng khi (Best Fit)
                      </div>
                      <p className="text-slate-700 leading-relaxed">{repo.bestFor}</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50/70 border border-rose-200/80 p-4 space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                        Cân nhắc / Tránh khi (Trade-off)
                      </div>
                      <p className="text-slate-700 leading-relaxed">{repo.avoidWhen}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-r from-[#EEF4FF] to-[#ECFEFF] border border-blue-200/80 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed">
                    <strong className="text-[#1E40FF]">Kết nối vào Kiến trúc DOMATION: </strong>
                    {repo.domationSynergy}
                  </div>
                </div>
              </section>
            );
          }

          case 'callout-verdict': {
            const palette: Record<
              typeof block.variant,
              { wrap: string; badge: string; label: string; Icon: React.FC<{ className?: string }> }
            > = {
              'founder-pov': {
                wrap: 'bg-gradient-to-br from-blue-50/85 via-white to-indigo-50/70 border-blue-200/90',
                badge: 'text-[#1E40FF]',
                label: block.authorBadge || 'Góc Nhìn Kiến Trúc Sư • Huỳnh Trọng Phúc (TurnioDEV)',
                Icon: Sparkles,
              },
              warning: {
                wrap: 'bg-gradient-to-br from-rose-50/85 via-white to-amber-50/60 border-rose-200/90',
                badge: 'text-rose-700',
                label: 'Cảnh Báo Triển Khai & Bảo Mật',
                Icon: ShieldAlert,
              },
              benchmark: {
                wrap: 'bg-gradient-to-br from-cyan-50/85 via-white to-emerald-50/60 border-cyan-200/90',
                badge: 'text-[#0369A1]',
                label: 'Kết Luận Benchmark Thực Chiến',
                Icon: Cpu,
              },
              'key-rule': {
                wrap: 'bg-gradient-to-br from-emerald-50/85 via-white to-teal-50/60 border-emerald-200/90',
                badge: 'text-emerald-700',
                label: 'Nguyên Tắc Kiến Trúc Vàng',
                Icon: ShieldCheck,
              },
              'anti-pattern': {
                wrap: 'bg-gradient-to-br from-amber-50/85 via-white to-orange-50/60 border-amber-200/90',
                badge: 'text-amber-800',
                label: 'Anti-Pattern Cần Tránh',
                Icon: AlertTriangle,
              },
            };
            const cfg = palette[block.variant] || palette['key-rule'];
            const Icon = cfg.Icon;
            return (
              <aside
                key={block.id || idx}
                id={block.id}
                className={`rounded-3xl border p-6 sm:p-7 shadow-xs space-y-2.5 scroll-mt-24 ${cfg.wrap}`}
              >
                <div
                  className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${cfg.badge}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cfg.label}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{block.title}</h3>
                <p className={`text-slate-700 ${scaleCfg.p}`}>{block.body}</p>
              </aside>
            );
          }

          case 'code-recipe':
            return (
              <CodeRecipeBlock
                key={block.id || idx}
                id={block.id}
                heading={block.heading}
                language={block.language}
                filename={block.filename}
                description={block.description}
                code={block.code}
                proseClass={scaleCfg.li}
              />
            );

          case 'timeline-flow': {
            const isIncidentChain = block.variant === 'incident-chain';
            return (
              <section
                key={block.id || idx}
                id={block.id}
                className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-5 scroll-mt-24"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                      isIncidentChain
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-blue-50 border-blue-200 text-[#1E40FF]'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {block.heading}
                  </h2>
                </div>
                <div className="space-y-4 relative before:absolute before:left-[15px] before:top-3 before:bottom-3 before:w-[2px] before:bg-slate-200">
                  {block.items.map((item, iIdx) => (
                    <div key={iIdx} className="relative pl-10">
                      <span
                        className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center text-[11px] font-mono font-extrabold bg-white ${
                          isIncidentChain
                            ? 'border-rose-500 text-rose-700'
                            : 'border-[#1E40FF] text-[#1E40FF]'
                        }`}
                      >
                        {iIdx + 1}
                      </span>
                      <div className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-4 sm:p-5 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] font-mono text-[11px] font-bold">
                            {item.tag}
                          </span>
                          {item.metricOrTool && (
                            <span className="text-[11px] font-mono text-slate-500">
                              {item.metricOrTool}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {item.title}
                        </h3>
                        <p className={`text-slate-600 ${scaleCfg.li}`}>{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          case 'checklist-audit':
            return (
              <ChecklistAuditBlock
                key={block.id || idx}
                id={block.id}
                heading={block.heading}
                items={block.items}
                liClass={scaleCfg.li}
              />
            );

          case 'visual-figure':
            return (
              <figure
                key={block.id || idx}
                id={block.id}
                className="rounded-3xl bg-white/95 border border-slate-200/85 p-5 sm:p-6 shadow-xs space-y-3 scroll-mt-24"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {block.badge || 'Biểu Đồ & Báo Cáo Thống Kê'}
                  </span>
                  {onZoomImage && (
                    <button
                      type="button"
                      onClick={() => onZoomImage({ src: block.src, caption: block.caption })}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E40FF] hover:underline cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Phóng to</span>
                    </button>
                  )}
                </div>
                {onZoomImage ? (
                  <button
                    type="button"
                    onClick={() => onZoomImage({ src: block.src, caption: block.caption })}
                    aria-label={`Phóng to hình minh họa: ${block.caption}`}
                    className="block w-full text-left rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 cursor-zoom-in group"
                  >
                    <img
                      src={block.src}
                      alt={block.alt}
                      width={1376}
                      height={768}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-[16/9] object-cover group-hover:scale-[1.01] transition-transform duration-300"
                    />
                  </button>
                ) : (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={block.src}
                      alt={block.alt}
                      width={1376}
                      height={768}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-[16/9] object-cover"
                    />
                  </div>
                )}
                <figcaption className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                  {block.caption}
                </figcaption>
              </figure>
            );

          case 'stat-grid':
            return (
              <section
                key={block.id || idx}
                id={block.id}
                className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
              >
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {block.heading}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {block.stats.map((st, sIdx) => (
                    <div
                      key={sIdx}
                      className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/55 border border-slate-200/80 p-4 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xl sm:text-2xl font-black text-[#1E40FF]">
                          {st.value}
                        </span>
                        {st.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
                        {st.trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-600" />}
                      </div>
                      <div className="text-xs font-bold text-slate-800">{st.label}</div>
                      {st.context && <p className="text-[11px] text-slate-500">{st.context}</p>}
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'myth-vs-reality':
            return (
              <section
                key={block.id || idx}
                id={block.id}
                className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-5 scroll-mt-24"
              >
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {block.heading}
                </h2>
                <div className="space-y-4">
                  {block.pairs.map((pair, mIdx) => (
                    <div
                      key={mIdx}
                      className="rounded-2xl border border-slate-200/85 overflow-hidden grid grid-cols-1 md:grid-cols-2"
                    >
                      <div className="bg-rose-50/75 p-4 sm:p-5 space-y-1.5 border-b md:border-b-0 md:border-r border-rose-200/70">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                          Ngộ nhận phổ biến
                        </div>
                        <p className={`font-semibold text-slate-800 ${scaleCfg.li}`}>{pair.myth}</p>
                      </div>
                      <div className="bg-emerald-50/70 p-4 sm:p-5 space-y-1.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                          Thực tế sản xuất &amp; Bằng chứng
                        </div>
                        <p className={`text-slate-700 ${scaleCfg.li}`}>{pair.reality}</p>
                        {pair.proofMetric && (
                          <div className="text-[11px] font-mono font-bold text-emerald-700 pt-1">
                            Data point: {pair.proofMetric}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'decision-tree':
            return (
              <section
                key={block.id || idx}
                id={block.id}
                className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-8 shadow-xs space-y-5 scroll-mt-24"
              >
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1E40FF]">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Ma Trận Ra Quyết Định Theo Bối Cảnh</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {block.heading}
                  </h2>
                  {block.subtitle && (
                    <p className="text-xs sm:text-sm text-slate-500">{block.subtitle}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {block.scenarios.map((sc, dIdx) => (
                    <div
                      key={dIdx}
                      className="rounded-2xl bg-slate-50/90 border border-slate-200/85 p-5 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Nếu bối cảnh của bạn là:
                        </div>
                        <div className="text-sm font-bold text-slate-900">{sc.condition}</div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-xs font-extrabold">
                          → {sc.recommendedChoice}
                        </div>
                        <p className={`text-slate-600 pt-1 ${scaleCfg.li}`}>{sc.rationale}</p>
                      </div>
                      {sc.avoidIf && (
                        <div className="pt-2 border-t border-slate-200/75 text-[11px] text-rose-700 font-medium">
                          Tránh chọn phương án này nếu: {sc.avoidIf}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
