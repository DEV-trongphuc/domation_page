import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Download,
  Filter,
  Hash,
  Layers,
  Link2,
  Loader2,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  BOOST_74_SEO_TOPICS,
  BOOST_KEYWORD_CLUSTERS,
} from '../data/boostSeoData';
import { handleSpaLinkClick } from '../utils/navigation';

export const BoostSeoClusterSection: React.FC = () => {
  const [selectedClusterId, setSelectedClusterId] = useState(
    BOOST_KEYWORD_CLUSTERS[0]?.id ?? ''
  );
  const [funnelFilter, setFunnelFilter] = useState<'ALL' | 'TOFU' | 'MOFU' | 'BOFU'>('ALL');
  const [topicQuery, setTopicQuery] = useState('');
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [exporting, setExporting] = useState(false);

  const activeCluster = useMemo(
    () =>
      BOOST_KEYWORD_CLUSTERS.find((c) => c.id === selectedClusterId) ??
      BOOST_KEYWORD_CLUSTERS[0],
    [selectedClusterId]
  );

  const filteredTopics = useMemo(() => {
    const q = topicQuery.trim().toLowerCase();
    return BOOST_74_SEO_TOPICS.filter((topic) => {
      const matchStage =
        funnelFilter === 'ALL' || topic.funnelStage === funnelFilter;
      const matchQuery =
        !q ||
        topic.code.toLowerCase().includes(q) ||
        topic.title.toLowerCase().includes(q) ||
        topic.primaryKeyword.toLowerCase().includes(q) ||
        topic.pillarLabel.toLowerCase().includes(q) ||
        topic.secondaryKeywords.some((kw) => kw.toLowerCase().includes(q));
      return matchStage && matchQuery;
    });
  }, [funnelFilter, topicQuery]);

  const visibleTopics = useMemo(
    () => (showAllTopics ? filteredTopics : filteredTopics.slice(0, 12)),
    [filteredTopics, showAllTopics]
  );

  const stageCounts = useMemo(() => {
    return {
      ALL: BOOST_74_SEO_TOPICS.length,
      TOFU: BOOST_74_SEO_TOPICS.filter((t) => t.funnelStage === 'TOFU').length,
      MOFU: BOOST_74_SEO_TOPICS.filter((t) => t.funnelStage === 'MOFU').length,
      BOFU: BOOST_74_SEO_TOPICS.filter((t) => t.funnelStage === 'BOFU').length,
    };
  }, []);

  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
        import('exceljs'),
        import('file-saver'),
      ]);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'DOMATION.NET SEO Engine';
      workbook.created = new Date();

      const sheetClusters = workbook.addWorksheet(`${BOOST_KEYWORD_CLUSTERS.length} Keyword Clusters`, {
        properties: { tabColor: { argb: 'FF1E40FF' } },
      });
      sheetClusters.columns = [
        { header: 'Cluster', key: 'cluster', width: 32 },
        { header: 'Hub URL', key: 'hubUrl', width: 22 },
        { header: 'Từ Khóa', key: 'keyword', width: 34 },
        { header: 'Vai Trò (Chính/Phụ)', key: 'role', width: 18 },
        { header: 'Độ Dài (Ngắn/Dài)', key: 'lengthType', width: 20 },
        { header: 'Search Intent', key: 'intent', width: 16 },
        { header: 'Độ Khó', key: 'difficulty', width: 16 },
        { header: 'Priority', key: 'priority', width: 16 },
        { header: 'Target URL', key: 'targetUrl', width: 20 },
        { header: 'LSI Variants', key: 'lsi', width: 42 },
      ];

      sheetClusters.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheetClusters.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40FF' },
      };

      for (const cluster of BOOST_KEYWORD_CLUSTERS) {
        for (const kw of cluster.keywords) {
          sheetClusters.addRow({
            cluster: cluster.name,
            hubUrl: `https://domation.net${cluster.hubUrl}`,
            keyword: kw.keyword,
            role: kw.role ?? (kw.priority === 'Core Money' || kw.priority === 'GEO Entity' ? 'Từ khóa Chính' : 'Từ khóa Phụ'),
            lengthType:
              kw.lengthType ??
              (kw.keyword.trim().split(/\s+/).length >= 4
                ? 'Dài (Long-tail)'
                : 'Ngắn (Short-tail)'),
            intent: kw.intent,
            difficulty: kw.difficulty,
            priority: kw.priority,
            targetUrl: `https://domation.net${kw.targetUrl}`,
            lsi: kw.lsiVariants.join(' | '),
          });
        }
      }

      const sheetTopics = workbook.addWorksheet(`${BOOST_74_SEO_TOPICS.length} Chu De Blog SEO`, {
        properties: { tabColor: { argb: 'FF06B6D4' } },
      });
      sheetTopics.columns = [
        { header: 'Mã', key: 'code', width: 10 },
        { header: 'Trụ Cột', key: 'pillarLabel', width: 26 },
        { header: 'Phễu', key: 'funnelStage', width: 10 },
        { header: 'Tiêu Đề Bài Viết', key: 'title', width: 52 },
        { header: 'Từ Khóa Chính', key: 'primaryKeyword', width: 30 },
        { header: 'Từ Khóa Phụ & Long-Tail', key: 'secondaryKeywords', width: 45 },
        { header: 'Intent', key: 'searchIntent', width: 15 },
        { header: 'Landing Page Đích', key: 'targetLandingPage', width: 20 },
        { header: 'Blog SLUG URL', key: 'articleUrl', width: 50 },
      ];

      sheetTopics.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheetTopics.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' },
      };

      for (const topic of BOOST_74_SEO_TOPICS) {
        sheetTopics.addRow({
          code: topic.code,
          pillarLabel: topic.pillarLabel,
          funnelStage: topic.funnelStage,
          title: topic.title,
          primaryKeyword: topic.primaryKeyword,
          secondaryKeywords: topic.secondaryKeywords.join(' | '),
          searchIntent: topic.searchIntent,
          targetLandingPage: `https://domation.net${topic.targetLandingPage}`,
          articleUrl: topic.linkedArticleSlug
            ? `https://domation.net/boost/${topic.linkedArticleSlug}`
            : 'https://domation.net/boost',
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `Ke_Hoach_SEO_Cluster_${BOOST_74_SEO_TOPICS.length}_Bai_DOMATION.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section
      id="seo-clusters"
      className="space-y-8 scroll-mt-24 pt-2"
      aria-labelledby="seo-clusters-heading"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2 max-w-3xl">
          <div className="ql-eyebrow">
            <Target className="w-3.5 h-3.5 text-[#1E40FF]" />
            <span>CONTENT SEO CLUSTER PLANNER • BỘ TỪ KHÓA CHÍNH–PHỤ, NGẮN–DÀI</span>
          </div>
          <h2
            id="seo-clusters-heading"
            className="text-[20px] sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-[1.24] tracking-tight"
          >
            Kiến Trúc {BOOST_KEYWORD_CLUSTERS.length} Cụm Từ Khóa &amp;{' '}
            <span className="text-gradient-inkica">{BOOST_74_SEO_TOPICS.length} Bài SEO DOMATION</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Quy hoạch chặt chẽ từ khóa ngắn (Short-tail) &amp; dài (Long-tail), từ khóa chính &amp;
            phụ cho hệ sinh thái{' '}
            <strong className="text-slate-900">
              ERP DOMATION may đo thiết kế flow riêng
            </strong>
            , Vibecode, AI doanh nghiệp thời đại 5.0, tối ưu quảng cáo, Landing Page &amp; chiến dịch.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={exporting}
          className="ql-btn-outline px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-700 border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 w-fit shrink-0 cursor-pointer disabled:opacity-60"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>
            {exporting ? 'Đang xuất Excel...' : 'Xuất Kế Hoạch SEO Cluster (.xlsx)'}
          </span>
        </button>
      </div>

      {/* Interactive 12-Cluster Selector & Keyword Breakdown */}
      <div className="inkica-glass-card rounded-3xl p-5 sm:p-7 border border-slate-200/80 space-y-6">
        <div className="flex flex-wrap gap-2">
          {BOOST_KEYWORD_CLUSTERS.map((cluster) => {
            const isSelected = cluster.id === activeCluster.id;
            return (
              <button
                key={cluster.id}
                type="button"
                onClick={() => setSelectedClusterId(cluster.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white/90 text-slate-700 border border-slate-200 hover:border-[#1E40FF]/40 hover:text-[#1E40FF]'
                }`}
              >
                {cluster.name}
              </button>
            );
          })}
        </div>

        {activeCluster && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200/75">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1E40FF]">
                  <Layers className="w-4 h-4" />
                  <span>Cụm chủ đề: {activeCluster.name}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeCluster.description}
                </p>
              </div>
              <a
                href={activeCluster.hubUrl}
                onClick={(e) => handleSpaLinkClick(e, activeCluster.hubUrl)}
                className="ql-btn-primary px-4 py-2 text-xs shrink-0 w-fit"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Pillar Hub: {activeCluster.hubUrl}</span>
              </a>
            </div>

            {/* Short-tail vs Long-tail Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-blue-50/60 border border-blue-200/70 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E40FF]">
                  <Hash className="w-3.5 h-3.5" />
                  <span>Từ Khóa Ngắn (Short-tail • Đẩy Volume &amp; Brand)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(activeCluster.shortTailTerms ?? []).map((term) => (
                    <span
                      key={term}
                      className="px-2.5 py-1 rounded-lg bg-white border border-blue-200/80 text-xs font-semibold text-slate-800"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-cyan-50/60 border border-cyan-200/70 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Từ Khóa Dài (Long-tail • Chuyển Đổi &amp; AI Overviews)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(activeCluster.longTailTerms ?? []).map((term) => (
                    <span
                      key={term}
                      className="px-2.5 py-1 rounded-lg bg-white border border-cyan-200/80 text-xs font-medium text-slate-700"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Primary & Secondary Keywords Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-bold">Từ Khóa Mục Tiêu</th>
                    <th className="py-3 px-3 font-bold">Chính / Phụ</th>
                    <th className="py-3 px-3 font-bold">Ngắn / Dài</th>
                    <th className="py-3 px-3 font-bold">Intent &amp; Độ Khó</th>
                    <th className="py-3 px-3 font-bold">LSI &amp; Ngữ Nghĩa</th>
                    <th className="py-3 px-4 font-bold">Trang Đích</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeCluster.keywords.map((kw) => {
                    const roleLabel =
                      kw.role ??
                      (kw.priority === 'Core Money' || kw.priority === 'GEO Entity'
                        ? 'Từ khóa Chính'
                        : 'Từ khóa Phụ');
                    const lenLabel =
                      kw.lengthType ??
                      (kw.keyword.trim().split(/\s+/).length >= 4
                        ? 'Dài (Long-tail)'
                        : 'Ngắn (Short-tail)');
                    return (
                      <tr key={kw.keyword} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {kw.keyword}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              roleLabel.includes('Chính')
                                ? 'bg-blue-100 text-[#1E40FF]'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {roleLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                          {lenLabel}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{kw.intent}</div>
                          <div className="text-[11px] text-slate-500">{kw.difficulty}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs">
                          {kw.lsiVariants.join(' • ')}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <a
                            href={kw.targetUrl}
                            onClick={(e) => handleSpaLinkClick(e, kw.targetUrl)}
                            className="font-bold text-[#1E40FF] hover:underline inline-flex items-center gap-1"
                          >
                            <span>{kw.targetUrl}</span>
                            <ArrowRight className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 74 SEO Content Topics Matrix */}
      <div className="inkica-glass-card rounded-3xl p-5 sm:p-7 border border-slate-200/80 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Ma Trận {BOOST_74_SEO_TOPICS.length} Chủ Đề SEO &amp; SLUG Đã Index Trên Blog /boost
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Lọc theo tầng phễu TOFU / MOFU / BOFU hoặc tìm theo từ khóa để kiểm tra internal link.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'TOFU', 'MOFU', 'BOFU'] as const).map((stage) => {
              const active = funnelFilter === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => {
                    setFunnelFilter(stage);
                    setShowAllTopics(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all ${
                    active ? 'ql-pill-tab-active' : 'ql-pill-tab'
                  }`}
                >
                  {stage === 'ALL' ? 'Tất cả' : stage} ({stageCounts[stage]})
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={topicQuery}
            onChange={(e) => setTopicQuery(e.target.value)}
            placeholder={`Lọc trong ${BOOST_74_SEO_TOPICS.length} chủ đề SEO theo tiêu đề, từ khóa chính/phụ, vibecode, ERP may đo, tối ưu quảng cáo...`}
            aria-label={`Lọc danh sách ${BOOST_74_SEO_TOPICS.length} chủ đề SEO`}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E40FF]/30 focus:border-[#1E40FF]"
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 font-bold">Mã</th>
                <th className="py-3 px-3 font-bold">Phễu</th>
                <th className="py-3 px-4 font-bold">Bài Viết &amp; SLUG Chuẩn SEO</th>
                <th className="py-3 px-3 font-bold">Từ Khóa Chính &amp; Phụ</th>
                <th className="py-3 px-4 font-bold">Đích Chuyển Đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleTopics.map((topic) => (
                <tr key={topic.code} className="hover:bg-blue-50/25 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#1E40FF] whitespace-nowrap">
                    {topic.code}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        topic.funnelStage === 'BOFU'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : topic.funnelStage === 'MOFU'
                            ? 'bg-blue-50 text-[#1E40FF] border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {topic.funnelStage}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-md space-y-1">
                    {topic.linkedArticleSlug ? (
                      <a
                        href={`/boost/${topic.linkedArticleSlug}`}
                        onClick={(e) =>
                          handleSpaLinkClick(e, `/boost/${topic.linkedArticleSlug}`)
                        }
                        className="font-bold text-slate-900 hover:text-[#1E40FF] transition-colors block"
                      >
                        {topic.title}
                      </a>
                    ) : (
                      <div className="font-bold text-slate-900">{topic.title}</div>
                    )}
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      /boost/{topic.linkedArticleSlug ?? ''}
                    </div>
                  </td>
                  <td className="py-3 px-3 max-w-xs space-y-1">
                    <div className="font-semibold text-slate-900">{topic.primaryKeyword}</div>
                    <div className="text-[11px] text-slate-500">
                      {topic.secondaryKeywords.slice(0, 2).join(' • ')}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <a
                      href={topic.targetLandingPage}
                      onClick={(e) => handleSpaLinkClick(e, topic.targetLandingPage)}
                      className="inline-flex items-center gap-1 font-bold text-[#1E40FF] hover:underline"
                    >
                      <span>{topic.targetLandingPage}</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTopics.length > 12 && (
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#1E40FF]" />
              Đang hiển thị {visibleTopics.length}/{filteredTopics.length} chủ đề SEO
            </span>
            <button
              type="button"
              onClick={() => setShowAllTopics((prev) => !prev)}
              className="ql-btn-outline px-4 py-2 text-xs font-bold cursor-pointer"
            >
              {showAllTopics
                ? 'Thu gọn còn 12 chủ đề đầu'
                : `Xem toàn bộ ${filteredTopics.length} chủ đề SEO`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
