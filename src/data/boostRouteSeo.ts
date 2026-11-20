import { BOOST_ARTICLES_PART_1 } from './boostArticlesPart1.ts';
import { BOOST_ARTICLES_PART_2 } from './boostArticlesPart2.ts';
import { BOOST_ARTICLES_PART_3 } from './boostArticlesPart3.ts';
import { BOOST_ARTICLES_PART_4 } from './boostArticlesPart4.ts';
import { BOOST_ARTICLES_PART_5 } from './boostArticlesPart5.ts';
import { PORTFOLIO_PROJECTS } from './portfolioData.ts';
import type { BoostArticle } from './boostTypes.ts';
import {
  FOUNDER_ID,
  ORG_ID,
  SITE_URL,
  buildArticleSchema,
  normalizeIsoDateTime,
  toAbsoluteUrl,
  type PageFaqItem,
  type PageSeoConfig,
} from '../utils/seoSchema.ts';

export const BOOST_ALL_ARTICLES: BoostArticle[] = [
  ...BOOST_ARTICLES_PART_1,
  ...BOOST_ARTICLES_PART_2,
  ...BOOST_ARTICLES_PART_3,
  ...BOOST_ARTICLES_PART_4,
  ...BOOST_ARTICLES_PART_5,
];

export const BOOST_FAQS: PageFaqItem[] = [
  {
    question: 'Blog DOMATION (/boost) tập trung chia sẻ những chủ đề chuyên sâu nào?',
    answer:
      'Blog DOMATION tổng hợp 74+ bài phân tích thực chiến về Hệ thống vận hành ERP 5.0 custom may đo thiết kế flow riêng, Vibecode doanh nghiệp, AI doanh nghiệp thời đại 5.0, logic vận hành quản trị, tối ưu quảng cáo Meta/TikTok/Google, Landing Page CRO và chiến dịch Automation.',
  },
  {
    question: 'Tại sao DOMATION định vị là hệ thống vận hành custom may đo cho doanh nghiệp thời đại mới?',
    answer:
      'Thay vì ép doanh nghiệp cắt gọt quy trình để vừa với phần mềm đóng gói, DOMATION sử dụng lõi 12 phân hệ ERP 5.0 kết hợp Vibecode và Visual Flow Builder để thiết kế luồng phê duyệt, chia data ZaloBot tức thì, tính hoa hồng, CRM MISA và Multi-Agent AI khớp 100% cơ cấu tổ chức thực tế.',
  },
  {
    question: 'Doanh nghiệp có thể đặt lịch tư vấn thiết kế hệ thống & khảo sát 1-1 không?',
    answer:
      'Có. Bạn có thể bấm nút Tư Vấn Triển Khai hoặc Đặt Lịch Khảo Sát 1-1 ngay trên trang Blog /boost để đội ngũ Solution Architect của DOMATION khảo sát luồng vận hành và đề xuất kiến trúc ERP/CRM may đo phù hợp.',
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

export const PORTFOLIO_FAQS: PageFaqItem[] = [
  {
    question: 'DOMATION đã triển khai thành công hệ thống may đo cho những doanh nghiệp và lĩnh vực nào?',
    answer:
      'DOMATION đã triển khai thực tế cho hơn 30+ thương hiệu đa ngành tại Việt Nam: Bất động sản (Capital House EcoLife Signature 3D, Rich Land), Giáo dục sau đại học (IDEAS Business, College de Paris, Swiss UMEF), Chuỗi F&B (Phúc Lộc Thọ 30+ cửa hàng, Cowboy Steak, En Group), Nha khoa (Flora, ImplantSwiss), E-commerce (Navastore) và AI/POD (INKICA 208 SKU 3D CAD).',
  },
  {
    question: 'Hiệu quả định lượng khi triển khai ERP 5.0, CRM và Auto Data may đo là bao nhiêu?',
    answer:
      'Các dự án triển khai thực tế ghi nhận chia Lead qua ZaloBot tức thì, độ lệch chia data 3 Đại lý F1 ~0%, giảm 35% chi phí Lead rác nhờ Meta CAPI SHA-256, tăng 300% quy mô lớp MBA và giảm 30% CPA tại IDEAS, đồng thời đạt ROAS 5+ trên chuỗi F&B 30+ cửa hàng.',
  },
  {
    question: 'Doanh nghiệp có thể làm chủ hoàn toàn dữ liệu và quy trình sau khi triển khai không?',
    answer:
      'Có. Toàn bộ kiến trúc được thiết kế may đo theo sơ đồ tổ chức, phân quyền Row-Level Security (RLS) cấp cơ sở dữ liệu, xuất hóa đơn/báo cáo tự chủ và bàn giao source code website/hệ thống theo gói Bespoke Enterprise.',
  },
];

export function getPortfolioSeoConfig(): PageSeoConfig {
  return {
    title: 'Portfolio Dự Án & Case Study Đa Ngành | DOMATION.NET',
    description:
      'Hồ sơ triển khai thực tế của DOMATION cho 30+ doanh nghiệp: Capital House EcoLife 3D, INKICA AI 208 SKU, IDEAS ERP 5.0, Phúc Lộc Thọ & Flora.',
    path: '/portfolio',
    keywords: [
      'portfolio domation',
      'case study erp crm auto data',
      'triển khai phần mềm ERP custom may đo',
      'triển khai AI Agent và Flow Automation doanh nghiệp',
      'làm chủ hệ thống và dữ liệu doanh nghiệp',
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
    faqs: PORTFOLIO_FAQS,
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
  const blogId = `${SITE_URL}/boost#blog`;
  const itemListId = `${SITE_URL}/boost#article-list`;
  return {
    title: 'Blog DOMATION | ERP May Đo, Vibecode & AI Doanh Nghiệp 5.0',
    description:
      'Blog kiến thức DOMATION: 74+ bài phân tích chuyên sâu về ERP may đo, Flow Automation, CRM, AI Agent, Vibecode & chiến lược SEO/GEO.',
    path: '/boost',
    keywords: [
      'blog domation',
      'erp may đo cho doanh nghiệp thời đại mới',
      'phần mềm erp custom chuyên sâu',
      'hệ thống vận hành custom may đo',
      'làm chủ hệ thống doanh nghiệp',
      'thiết kế flow automation riêng',
      'phần mềm crm 360 độ',
      'ai agent và multi-agent doanh nghiệp 5.0',
      'vibecode doanh nghiệp',
      'logic vận hành quản trị doanh nghiệp',
      'tối ưu quảng cáo landing page chiến dịch',
      'content seo topic cluster geo llms',
    ],
    ogImage: '/imgs/boost/boost-hero-growth-hub.jpg',
    ogImageAlt: 'Blog DOMATION — ERP May Đo, Vibecode, AI 5.0 & Tối Ưu Quảng Cáo Chiến Dịch',
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'Blog DOMATION', url: '/boost' },
    ],
    faqs: BOOST_FAQS,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Blog DOMATION — Hệ Thống Vận Hành May Đo, Vibecode & AI Doanh Nghiệp 5.0',
        url: `${SITE_URL}/boost`,
        mainEntity: { '@id': blogId },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        '@id': blogId,
        name: 'Blog DOMATION — Kiến Thức Vận Hành Doanh Nghiệp 5.0, ERP May Đo, Vibecode & Chuyển Đổi Số',
        description:
          'Blog chuyên sâu 74+ bài viết của DOMATION về ERP 5.0 custom may đo, thiết kế flow riêng, Vibecode, AI doanh nghiệp thời đại 5.0, tối ưu quảng cáo, Landing Page và chiến dịch.',
        url: `${SITE_URL}/boost`,
        inLanguage: 'vi-VN',
        publisher: { '@id': ORG_ID },
        author: { '@id': FOUNDER_ID },
        mainEntityOfPage: { '@id': `${SITE_URL}/boost#webpage` },
        blogPost: BOOST_ALL_ARTICLES.map((art) => ({
          '@type': 'BlogPosting',
          '@id': `${SITE_URL}/boost/${art.slug}#article`,
          headline: art.title,
          description: art.metaDescription,
          url: `${SITE_URL}/boost/${art.slug}`,
          image: toAbsoluteUrl(art.coverImage),
          datePublished: normalizeIsoDateTime(art.publishedAt, '08:00:00+07:00'),
          dateModified: normalizeIsoDateTime(art.updatedAt, '09:00:00+07:00'),
          author: { '@id': FOUNDER_ID },
          publisher: { '@id': ORG_ID },
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': itemListId,
        name: `Danh sách ${BOOST_ALL_ARTICLES.length} bài Blog DOMATION`,
        numberOfItems: BOOST_ALL_ARTICLES.length,
        itemListElement: BOOST_ALL_ARTICLES.map((art, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: art.title,
          url: `${SITE_URL}/boost/${art.slug}`,
        })),
      },
    ],
  };
}

export function getSinglePostSeoConfig(article: BoostArticle): PageSeoConfig {
  const schema = buildArticleSchema({
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
  });
  schema.isPartOf = { '@id': `${SITE_URL}/boost#blog` };

  return {
    title: article.seoTitle,
    description: article.metaDescription,
    path: `/boost/${article.slug}`,
    keywords: [article.focusKeyword, ...article.secondaryKeywords, 'Blog DOMATION', article.industry],
    ogType: 'article',
    ogImage: article.coverImage,
    ogImageAlt: article.coverAlt,
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    section: article.pillarLabel,
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'Blog', url: '/boost' },
      { name: article.pillarLabel, url: `/boost?pillar=${article.pillar}` },
      { name: article.title, url: `/boost/${article.slug}` },
    ],
    faqs: article.faqs,
    jsonLd: [schema],
  };
}

export function getAllBoostRouteSeoConfigs(): PageSeoConfig[] {
  return [
    getPortfolioSeoConfig(),
    getBoostHubSeoConfig(),
    ...BOOST_ALL_ARTICLES.map((art) => getSinglePostSeoConfig(art)),
  ];
}
