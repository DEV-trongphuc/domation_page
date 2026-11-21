export type BoostPillarId =
  | 'auto-data-capi'
  | 'erp-operations'
  | 'crm-misa-sales'
  | 'automation-zns'
  | 'multi-agent-ai'
  | 'web3d-ads-seo'
  | 'vibecode-ops'
  | 'ads-cro-seo'
  | 'ai-data-security'
  | 'github-vibecode-audit'
  | 'llm-models-mcp-skills';

export type EditorialFormatId =
  | 'field-report'
  | 'forensic-postmortem'
  | 'contrarian-essay'
  | 'repo-teardown'
  | 'head-to-head-arena'
  | 'architecture-blueprint'
  | 'playbook-manual'
  | 'executive-dossier';

export type ArticleSchemaType =
  | 'BlogPosting'
  | 'TechArticle'
  | 'Report'
  | 'AnalysisNewsArticle';

export type ThumbnailThemeId =
  | 'slate-cobalt-exec'
  | 'midnight-cyan-data'
  | 'crimson-obsidian-sec'
  | 'swiss-editorial-paper'
  | 'github-terminal-audit'
  | 'arena-peer-vs';

export interface ArticleChartSeries {
  key: string;
  label: string;
  color: string;
  type?: 'bar' | 'line' | 'area';
  unit?: string;
}

export interface ArticleChartSpec {
  chartType: 'bar' | 'horizontal-bar' | 'line' | 'area' | 'composed' | 'radar' | 'donut';
  title: string;
  subtitle?: string;
  xKey: string;
  yUnit?: string;
  series: ArticleChartSeries[];
  data: Record<string, string | number>[];
  kpis?: { label: string; value: string; delta?: string; positive?: boolean }[];
  sourceNote?: string;
}

export interface RepoAuditMeta {
  fullName: string;
  url: string;
  category: string;
  primaryLanguage: string;
  license: string;
  starsTier: string;
  bestFor: string;
  avoidWhen: string;
  domationSynergy: string;
  scores: {
    productionReadiness: number;
    vibecodeSpeed: number;
    securityGovernance: number;
    costEfficiency: number;
  };
}

export type ArticleContentBlock =
  | {
      type: 'prose';
      id: string;
      heading: string;
      eyebrow?: string;
      variant?: 'narrative' | 'incident' | 'contrarian' | 'deep-dive';
      paragraphs: string[];
      pullQuote?: string;
      bullets?: string[];
    }
  | {
      type: 'chart-dashboard';
      id: string;
      heading: string;
      subtitle?: string;
      chart: ArticleChartSpec;
      insightSummary: string;
    }
  | {
      type: 'comparison-matrix';
      id: string;
      heading: string;
      caption?: string;
      columns: string[];
      highlightColumn?: number;
      rows: { criterion: string; values: string[]; winnerNote?: string }[];
      footnote?: string;
    }
  | {
      type: 'repo-card';
      id: string;
      heading?: string;
      repo: RepoAuditMeta;
    }
  | {
      type: 'callout-verdict';
      id?: string;
      variant: 'founder-pov' | 'warning' | 'benchmark' | 'key-rule' | 'anti-pattern';
      title: string;
      body: string;
      authorBadge?: string;
    }
  | {
      type: 'code-recipe';
      id: string;
      heading: string;
      language: string;
      filename?: string;
      description?: string;
      code: string;
    }
  | {
      type: 'timeline-flow';
      id: string;
      heading: string;
      variant?: 'steps' | 'incident-chain' | 'migration-phases';
      items: { tag: string; title: string; detail: string; metricOrTool?: string }[];
    }
  | {
      type: 'checklist-audit';
      id: string;
      heading: string;
      items: {
        check: string;
        severity: 'critical' | 'high' | 'recommended';
        verificationHow: string;
        passThreshold: string;
      }[];
    }
  | {
      type: 'visual-figure';
      id: string;
      src: string;
      alt: string;
      caption: string;
      badge?: string;
    }
  | {
      type: 'stat-grid';
      id?: string;
      heading: string;
      stats: {
        value: string;
        label: string;
        context?: string;
        trend?: 'up' | 'down' | 'neutral';
      }[];
    }
  | {
      type: 'myth-vs-reality';
      id: string;
      heading: string;
      pairs: { myth: string; reality: string; proofMetric?: string }[];
    }
  | {
      type: 'decision-tree';
      id: string;
      heading: string;
      subtitle?: string;
      scenarios: {
        condition: string;
        recommendedChoice: string;
        rationale: string;
        avoidIf?: string;
      }[];
    };

export type SearchIntentType =
  | 'Informational'
  | 'Commercial'
  | 'Transactional'
  | 'Comparison';

export type FunnelStageType = 'TOFU' | 'MOFU' | 'BOFU';

export interface ArticlePainPoint {
  title: string;
  detail: string;
  impactMetric: string;
}

export interface ArticleChallengeFix {
  challenge: string;
  rootCause: string;
  domationFix: string;
}

export interface ArticleSolutionStep {
  step: string;
  title: string;
  detail: string;
  techStack?: string;
}

export interface ArticleSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  codeSnippet?: {
    label: string;
    content: string;
  };
}

export interface ArticleFaq {
  question: string;
  answer: string;
}

export interface BoostArticle {
  id: string;
  number: string;
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  pillar: BoostPillarId;
  pillarLabel: string;
  industry: string;
  searchIntent: SearchIntentType;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
  coverImage: string;
  coverAlt: string;
  screenshotImage: string;
  screenshotCaption: string;
  tldrSummary: string;
  keyTakeaways: string[];
  painPoints: ArticlePainPoint[];
  implementationChallenges: ArticleChallengeFix[];
  solutionSteps: ArticleSolutionStep[];
  sections: ArticleSection[];
  metricsOutcome: { label: string; value: string }[];
  relatedPortfolioId?: string;
  relatedModuleUrl: string;
  relatedModuleLabel: string;
  faqs: ArticleFaq[];
  editorialFormat?: EditorialFormatId;
  schemaType?: ArticleSchemaType;
  clusterId?: string;
  relatedSlugs?: string[];
  thumbnailTheme?: ThumbnailThemeId;
  thumbnailTitle?: string;
  thumbnailHook?: string;
  thumbnailBadge?: string;
  repoMeta?: RepoAuditMeta;
  blocks?: ArticleContentBlock[];
  shardId?: string;
}

export interface BoostArticleSummary {
  id: string;
  number: string;
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  pillar: BoostPillarId;
  pillarLabel: string;
  industry: string;
  searchIntent: SearchIntentType;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
  coverImage: string;
  coverAlt: string;
  screenshotImage: string;
  screenshotCaption: string;
  relatedPortfolioId?: string;
  relatedModuleUrl: string;
  relatedModuleLabel: string;
  shardId: string;
  wordCount?: number;
  editorialFormat?: EditorialFormatId;
  schemaType?: ArticleSchemaType;
  clusterId?: string;
  relatedSlugs?: string[];
  thumbnailHook?: string;
  thumbnailBadge?: string;
  repoFullName?: string;
}

export interface SeoTopicItem {
  id: number;
  code: string;
  pillar: BoostPillarId;
  pillarLabel: string;
  title: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: SearchIntentType;
  funnelStage: FunnelStageType;
  targetPainPoint: string;
  targetLandingPage: string;
  geoAnswerAngle: string;
  linkedArticleSlug?: string;
}

export interface SeoKeywordItem {
  keyword: string;
  intent: SearchIntentType;
  difficulty: 'Thấp (Dễ Top)' | 'Trung bình' | 'Cao (Cạnh tranh)';
  priority: 'Core Money' | 'High Intent' | 'Pain Point Long-tail' | 'GEO Entity';
  role?: 'Từ khóa Chính' | 'Từ khóa Phụ';
  lengthType?: 'Ngắn (Short-tail)' | 'Dài (Long-tail)';
  targetUrl: string;
  lsiVariants: string[];
}

export interface KeywordCluster {
  id: string;
  name: string;
  pillar: BoostPillarId;
  description: string;
  hubUrl: string;
  shortTailTerms?: string[];
  longTailTerms?: string[];
  keywords: SeoKeywordItem[];
}

export interface IndustryPainItem {
  id: string;
  industry: string;
  badge: string;
  representativeClients: string[];
  coverImage: string;
  corePainPoints: string[];
  deploymentFriction: string[];
  domationArchitecture: string;
  keyMetrics: string[];
  targetModuleUrl: string;
  targetModuleLabel: string;
  relatedArticleSlugs: string[];
}

export interface PortfolioProject {
  id: string;
  name: string;
  client: string;
  industry: string;
  category:
    | 'Bất Động Sản'
    | 'Giáo Dục & ERP'
    | 'F&B & Nhượng Quyền'
    | 'AI & Prepress 3D'
    | 'Y Tế & Nha Khoa'
    | 'E-Commerce & B2B';
  year: string;
  logo: string;
  previewImage: string;
  liveUrl?: string;
  problem: string;
  implementationPain: string;
  architecture: string;
  deliverables: string[];
  metrics: string[];
  relatedArticleSlug: string;
  inspectionTab?: 'erp' | 'data-capi' | 'crm' | 'autoflow' | 'meta-report' | 'web-3d' | 'inkica';
}

export interface RouteSeoAuditItem {
  route: string;
  name: string;
  category: 'Core' | 'Product Suite' | 'Portfolio' | 'Knowledge / Boost' | 'Singlepost' | 'Crawler / GEO';
  titleConfigured: boolean;
  metaDescription: boolean;
  canonicalSet: boolean;
  openGraphAbsolute: boolean;
  jsonLdSchema: string;
  geoReadiness: string;
  internalLinkHub: string;
}
