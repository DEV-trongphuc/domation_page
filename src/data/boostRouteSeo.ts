import { BOOST_ARTICLES_PART_1 } from './boostArticlesPart1.ts';
import { BOOST_ARTICLES_PART_2 } from './boostArticlesPart2.ts';
import { PORTFOLIO_PROJECTS } from './portfolioData.ts';
import type { BoostArticle } from './boostTypes.ts';
import {
  SITE_URL,
  buildArticleSchema,
  type PageFaqItem,
  type PageSeoConfig,
} from '../utils/seoSchema.ts';

export const BOOST_ALL_ARTICLES: BoostArticle[] = [
  ...BOOST_ARTICLES_PART_1,
  ...BOOST_ARTICLES_PART_2,
];

export const BOOST_FAQS: PageFaqItem[] = [
  {
    question: 'Chuyên mục Tin Tức & Kinh Nghiệm của DOMATION tập trung vào nội dung gì?',
    answer:
      'Chuyên mục tổng hợp các bài phân tích thực tế về triển khai hệ thống phần mềm doanh nghiệp, tự động hóa phân phối dữ liệu đa kênh, vận hành ERP/CRM tích hợp kế toán MISA, đo lường hiệu suất quảng cáo Meta Ads và ứng dụng trợ lý AI theo từng ngành nghề.',
  },
  {
    question: 'Các bài viết giải quyết những khó khăn vận hành thực tế nào?',
    answer:
      'Các bài phân tích đi thẳng vào điểm nghẽn kỹ thuật và quy trình nhân sự khi triển khai thật: độ trễ Webhook quảng cáo, Lead bị nguội khi chia thủ công, đối soát sàn đại lý, đồng bộ hóa đơn MISA hai chiều, kiểm soát AI bịa thông tin báo giá và tối ưu trải nghiệm 3D Web trên thiết bị di động.',
  },
  {
    question: 'Doanh nghiệp có thể đặt lịch tư vấn kiến trúc giải pháp riêng theo từng bài viết không?',
    answer:
      'Có. Ở mỗi bài viết và chuyên mục ngành nghề đều có nút Đặt Lịch Khảo Sát 1-1 để đội ngũ kỹ sư giải pháp DOMATION trao đổi trực tiếp dựa trên quy mô nhân sự và quy trình vận hành thực tế của doanh nghiệp bạn.',
  },
];

export function computeArticleWordCount(article: BoostArticle): number {
  const text = [
    article.title,
    article.metaDescription,
    article.tldrSummary,
    ...article.keyTakeaways,
    ...article.painPoints.map((p) => `${p.title} ${p.detail}`),
    ...article.implementationChallenges.map((c) => `${c.challenge} ${c.rootCause} ${c.domationFix}`),
    ...article.solutionSteps.map((s) => `${s.title} ${s.detail}`),
    ...article.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets || [])]),
    ...article.faqs.map((f) => `${f.question} ${f.answer}`),
  ].join(' ');
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getPortfolioSeoConfig(): PageSeoConfig {
  return {
    title: 'Portfolio Dự Án & Case Study Đa Ngành | DOMATION.NET',
    description:
      'Hồ sơ triển khai thực tế của DOMATION cho 30+ doanh nghiệp: Capital House EcoLife 3D, INKICA AI 208 SKU, IDEAS ERP 5.0, Phúc Lộc Thọ ROAS 5+, Nha khoa Flora & Navastore.',
    path: '/portfolio',
    keywords: [
      'portfolio domation',
      'case study erp crm auto data',
      'dự án ecolife signature capital house',
      'inkica ai studio',
      'ideas erp 5.0',
    ],
    ogImage: '/landingpage_avatar/portfolio.webp',
    ogImageAlt: 'Portfolio Dự Án & Case Study Đa Ngành DOMATION.NET',
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'Portfolio Dự Án', url: '/portfolio' },
    ],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Portfolio Triển Khai & Case Study DOMATION',
        url: `${SITE_URL}/portfolio`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: PORTFOLIO_PROJECTS.length,
          itemListElement: PORTFOLIO_PROJECTS.map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: p.name,
            url: `${SITE_URL}/boost/${p.relatedArticleSlug}`,
          })),
        },
      },
    ],
  };
}

export function getBoostHubSeoConfig(): PageSeoConfig {
  return {
    title: 'Tin Tức & Kinh Nghiệm Triển Khai Công Nghệ Doanh Nghiệp | DOMATION',
    description:
      'Tạp chí công nghệ và kinh nghiệm triển khai thực tế từ DOMATION: tự động hóa chia Lead đa kênh, ERP 5.0, CRM MISA, tối ưu quảng cáo Meta CAPI và ứng dụng AI doanh nghiệp.',
    path: '/boost',
    keywords: [
      'kinh nghiệm triển khai erp crm',
      'tự động chia data zalobot telegram',
      'meta capi ads tối ưu lead',
      'ứng dụng ai cho doanh nghiệp b2b',
      'chuyển đổi số đa ngành',
      'domation tạp chí công nghệ',
    ],
    ogImage: '/imgs/boost/boost-hero-growth-hub.jpg',
    ogImageAlt: 'DOMATION — Tin Tức & Kinh Nghiệm Triển Khai Công Nghệ Doanh Nghiệp',
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'Tin Tức & Tri Thức', url: '/boost' },
    ],
    faqs: BOOST_FAQS,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Tin Tức & Kinh Nghiệm Triển Khai Công Nghệ Doanh Nghiệp | DOMATION',
        url: `${SITE_URL}/boost`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: BOOST_ALL_ARTICLES.length,
          itemListElement: BOOST_ALL_ARTICLES.map((art, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: art.title,
            url: `${SITE_URL}/boost/${art.slug}`,
          })),
        },
      },
    ],
  };
}

export function getSinglePostSeoConfig(article: BoostArticle): PageSeoConfig {
  return {
    title: article.seoTitle,
    description: article.metaDescription,
    path: `/boost/${article.slug}`,
    keywords: [article.focusKeyword, ...article.secondaryKeywords, 'DOMATION', article.industry],
    ogType: 'article',
    ogImage: article.coverImage,
    ogImageAlt: article.coverAlt,
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    section: article.pillarLabel,
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'Tin Tức', url: '/boost' },
      { name: article.pillarLabel, url: `/boost?pillar=${article.pillar}` },
      { name: article.title, url: `/boost/${article.slug}` },
    ],
    faqs: article.faqs,
    jsonLd: [
      buildArticleSchema({
        headline: article.title,
        description: article.metaDescription,
        path: `/boost/${article.slug}`,
        image: article.coverImage,
        extraImages: [article.screenshotImage],
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        keywords: [article.focusKeyword, ...article.secondaryKeywords],
        articleSection: article.pillarLabel,
        aboutIndustry: article.industry,
        wordCount: computeArticleWordCount(article),
      }),
    ],
  };
}

export function getAllBoostRouteSeoConfigs(): PageSeoConfig[] {
  return [
    getPortfolioSeoConfig(),
    getBoostHubSeoConfig(),
    ...BOOST_ALL_ARTICLES.map((art) => getSinglePostSeoConfig(art)),
  ];
}
