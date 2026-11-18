export type BoostPillarId =
  | 'auto-data-capi'
  | 'erp-operations'
  | 'crm-misa-sales'
  | 'automation-zns'
  | 'multi-agent-ai'
  | 'web3d-ads-seo'
  | 'vibecode-ops'
  | 'ads-cro-seo';

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
