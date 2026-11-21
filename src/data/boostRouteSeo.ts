import { BOOST_CATALOG } from './boostCatalog.ts';
import { filterPublishedArticles, getEffectiveArticleDates } from './publishSchedule.ts';
import { PORTFOLIO_PROJECTS } from './portfolioData.ts';
import type { BoostArticle, BoostArticleSummary } from './boostTypes.ts';
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

export const BOOST_FAQS: PageFaqItem[] = [
  {
    question: 'Blog DOMATION (/boost) tập trung chia sẻ những chủ đề chuyên sâu nào?',
    answer:
      'Blog DOMATION tổng hợp 220+ bài phân tích thực chiến cực sâu về nỗi đau vận hành & tăng trưởng doanh nghiệp, kiến trúc dữ liệu AI (ETL/RAG/Token FinOps), bảo mật dữ liệu AI thời đại mới (OWASP LLM 2026, Zero-Trust, RLS), Audit 50+ Repo GitHub mã nguồn mở cho AI Vibecode, so đọ ngang hạng cân Gemini / Claude / OpenAI Codex / MCP & Skills, cùng ERP 5.0 may đo thiết kế flow riêng.',
  },
  {
    question: 'Vì sao DOMATION so sánh model Gemini, Claude và OpenAI Codex theo từng hạng cân thay vì xếp hạng chung?',
    answer:
      'Không có một model duy nhất thắng mọi tác vụ. DOMATION luôn đưa các model cùng phân khúc (ví dụ Heavyweight Opus 5.5 vs Gemini 4 Argon vs GPT-5.3-Codex, Midweight Sonnet 5.5 vs Gemini 3.8 Flash vs GPT-5.2-Codex, hay Lightweight Haiku 5.5 vs Flash-Lite vs codex-mini-latest) lên bàn cân chi phí, độ trễ, tool calling và tỷ lệ pass test thực tế để kỹ sư phối hợp đúng vai.',
  },
  {
    question: 'Tại sao DOMATION định vị là hệ thống vận hành custom may đo cho doanh nghiệp thời đại mới?',
    answer:
      'Thay vì ép doanh nghiệp cắt gọt quy trình để vừa với phần mềm đóng gói, DOMATION sử dụng lõi 12 phân hệ ERP 5.0 kết hợp Vibecode, Multi-Agent MCP và Visual Flow Builder để thiết kế luồng phê duyệt, chia data ZaloBot tức thì, bảo mật RLS, CRM MISA và AI RAG khớp 100% cơ cấu tổ chức thực tế.',
  },
  {
    question: 'Doanh nghiệp có thể đặt lịch tư vấn thiết kế hệ thống & khảo sát 1-1 không?',
    answer:
      'Có. Bạn có thể bấm nút Tư Vấn Triển Khai hoặc Đặt Lịch Khảo Sát 1-1 ngay trên trang Blog /boost để Founder & CEO Huỳnh Trọng Phúc (TurnioDEV) cùng đội ngũ Solution Architect của DOMATION khảo sát luồng vận hành và đề xuất kiến trúc ERP/CRM/AI may đo phù hợp.',
  },
];

function extractBlockWordsText(art: BoostArticle): string {
  if (!art.blocks || art.blocks.length === 0) return '';
  return art.blocks
    .map((block) => {
      switch (block.type) {
        case 'prose':
          return [block.heading, block.pullQuote || '', ...block.paragraphs, ...(block.bullets || [])].join(' ');
        case 'chart-dashboard':
          return [
            block.heading,
            block.subtitle || '',
            block.chart.title,
            ...(block.chart.kpis || []).map((k) => `${k.label} ${k.value}`),
            block.insightSummary,
          ].join(' ');
        case 'comparison-matrix':
          return [
            block.heading,
            block.caption || '',
            ...block.columns,
            ...block.rows.flatMap((r) => [r.criterion, ...r.values, r.winnerNote || '']),
          ].join(' ');
        case 'repo-card':
          return [
            block.heading || '',
            block.repo.fullName,
            block.repo.category,
            block.repo.bestFor,
            block.repo.avoidWhen,
            block.repo.domationSynergy,
          ].join(' ');
        case 'callout-verdict':
          return `${block.title} ${block.body}`;
        case 'code-recipe':
          return `${block.heading} ${block.description || ''}`;
        case 'timeline-flow':
          return [block.heading, ...block.items.map((i) => `${i.tag} ${i.title} ${i.detail}`)].join(' ');
        case 'checklist-audit':
          return [
            block.heading,
            ...block.items.map((i) => `${i.check} ${i.verificationHow} ${i.passThreshold}`),
          ].join(' ');
        case 'visual-figure':
          return `${block.caption} ${block.alt}`;
        case 'stat-grid':
          return [block.heading, ...block.stats.map((s) => `${s.value} ${s.label} ${s.context || ''}`)].join(' ');
        case 'myth-vs-reality':
          return [block.heading, ...block.pairs.map((p) => `${p.myth} ${p.reality} ${p.proofMetric || ''}`)].join(' ');
        case 'decision-tree':
          return [
            block.heading,
            ...block.scenarios.map((s) => `${s.condition} ${s.recommendedChoice} ${s.rationale}`),
          ].join(' ');
        default:
          return '';
      }
    })
    .join(' ');
}

export function computeArticleWordCount(article: BoostArticle | BoostArticleSummary): number {
  if (!('sections' in article)) {
    return article.wordCount || 1800;
  }
  const text = [
    article.title,
    article.metaDescription,
    article.tldrSummary,
    ...article.keyTakeaways,
    ...article.painPoints.map((p) => `${p.title} ${p.detail}`),
    ...article.implementationChallenges.map((c) => `${c.challenge} ${c.rootCause} ${c.domationFix}`),
    ...article.solutionSteps.map((s) => `${s.title} ${s.detail}`),
    ...article.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets || [])]),
    extractBlockWordsText(article),
    ...article.faqs.map((f) => `${f.question} ${f.answer}`),
  ].join(' ');
  const counted = text.trim().split(/\s+/).filter(Boolean).length;
  return counted > 0 ? counted : 1800;
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
  {
    question: 'Huỳnh Trọng Phúc (TurnioDEV) đóng vai trò gì trong các dự án thuộc Portfolio DOMATION?',
    answer:
      'Huỳnh Trọng Phúc (TurnioDEV) — Founder & CEO DOMATION, Chuyên Gia AI Automation & Digital Marketing — là người trực tiếp chủ trì khảo sát, thiết kế kiến trúc kỹ thuật và xây dựng hệ thống từ A–Z cho 35+ dự án thực chiến (EcoLife Signature 3D, INKICA AI 208 SKU, IDEAS ERP 5.0, Phúc Lộc Thọ, Nha khoa Flora, RichLand, NavaTek). Hồ sơ cá nhân & 220+ bài chuyên sâu xem tại https://portfo-turnio.vercel.app/.',
  },
];

export function getPortfolioSeoConfig(): PageSeoConfig {
  return {
    title: 'Portfolio Dự Án A–Z & Hồ Sơ Founder Huỳnh Trọng Phúc (TurnioDEV) | DOMATION.NET',
    description:
      'Portfolio triển khai 35+ hệ thống từ A–Z của Founder & CEO Huỳnh Trọng Phúc (TurnioDEV) & DOMATION — Chuyên gia AI Automation, Digital Marketing cho 30+ doanh nghiệp.',
    path: '/portfolio',
    keywords: [
      'portfolio TurnioDEV',
      'Huỳnh Trọng Phúc',
      'Huỳnh Trọng Phúc DOMATION',
      'Founder CEO DOMATION',
      'chuyên gia AI Automation',
      'chuyên gia Digital Marketing',
      'xây dựng hệ thống doanh nghiệp từ A-Z',
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
  const publishedCatalog = filterPublishedArticles(BOOST_CATALOG);
  const totalCount = publishedCatalog.length;
  return {
    title: 'Blog DOMATION | AI, Công Nghệ & Vận Hành Doanh Nghiệp',
    description:
      'Góc nhìn, bài viết thực chiến về AI ứng dụng, bảo mật dữ liệu, kỹ thuật phần mềm, CRM, Automation và vận hành doanh nghiệp từ đội ngũ DOMATION.',
    path: '/boost',
    keywords: [
      'blog domation',
      'vận hành doanh nghiệp 5.0',
      'bảo mật dữ liệu ai',
      'erp may đo',
      'automation & crm',
      'multi-agent ai',
    ],
    ogImage: '/imgs/boost/boost-hero-growth-hub.jpg',
    ogImageAlt: 'Blog DOMATION — AI, Công Nghệ & Vận Hành Doanh Nghiệp',
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'Blog DOMATION', url: '/boost' },
    ],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Blog DOMATION — AI, Công Nghệ & Vận Hành Doanh Nghiệp',
        url: `${SITE_URL}/boost`,
        mainEntity: { '@id': blogId },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        '@id': blogId,
        name: 'Blog DOMATION',
        description:
          'Bài viết phân tích và chia sẻ kinh nghiệm thực chiến về AI, kỹ thuật phần mềm, bảo mật và vận hành doanh nghiệp của DOMATION & Huỳnh Trọng Phúc (TurnioDEV).',
        url: `${SITE_URL}/boost`,
        inLanguage: 'vi-VN',
        publisher: { '@id': ORG_ID },
        author: { '@id': FOUNDER_ID },
        mainEntityOfPage: { '@id': `${SITE_URL}/boost#webpage` },
        blogPost: publishedCatalog.map((art) => {
          const eff = getEffectiveArticleDates(art);
          return {
            '@type': art.schemaType || 'BlogPosting',
            '@id': `${SITE_URL}/boost/${art.slug}#article`,
            headline: art.title,
            description: art.metaDescription,
            url: `${SITE_URL}/boost/${art.slug}`,
            image: toAbsoluteUrl(art.coverImage),
            datePublished: normalizeIsoDateTime(eff.publishedAt, '08:00:00+07:00'),
            dateModified: normalizeIsoDateTime(eff.updatedAt, '09:00:00+07:00'),
            author: { '@id': FOUNDER_ID },
            publisher: { '@id': ORG_ID },
          };
        }),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': itemListId,
        name: 'Danh sách bài viết Blog DOMATION',
        numberOfItems: totalCount,
        itemListElement: publishedCatalog.map((art, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: art.title,
          url: `${SITE_URL}/boost/${art.slug}`,
        })),
      },
    ],
  };
}

export function getSinglePostSeoConfig(article: BoostArticle | BoostArticleSummary): PageSeoConfig {
  const fullBlocks = 'blocks' in article ? article.blocks : undefined;
  const repoMeta = 'repoMeta' in article ? article.repoMeta : undefined;
  const faqs = 'faqs' in article ? article.faqs : undefined;
  const effDates = getEffectiveArticleDates(article);

  const extraImages: string[] = [];
  const imageCaptions: { url: string; caption: string }[] = [
    { url: article.coverImage, caption: article.coverAlt },
  ];

  if (article.screenshotImage) {
    extraImages.push(article.screenshotImage);
    imageCaptions.push({
      url: article.screenshotImage,
      caption: article.screenshotCaption || article.coverAlt,
    });
  }
  if (fullBlocks) {
    for (const blk of fullBlocks) {
      if (blk.type === 'visual-figure' && blk.src) {
        extraImages.push(blk.src);
        imageCaptions.push({ url: blk.src, caption: blk.alt || blk.caption });
      }
    }
  }

  const schema = buildArticleSchema({
    headline: article.title,
    description: article.metaDescription,
    path: `/boost/${article.slug}`,
    image: article.coverImage,
    extraImages,
    imageCaptions,
    datePublished: effDates.publishedAt,
    dateModified: effDates.updatedAt,
    keywords: [article.focusKeyword, ...article.secondaryKeywords],
    articleSection: article.pillarLabel,
    aboutIndustry: article.industry,
    wordCount: computeArticleWordCount(article),
    schemaType: article.schemaType,
    repoMeta,
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
    publishedTime: effDates.publishedAt,
    modifiedTime: effDates.updatedAt,
    section: article.pillarLabel,
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'Blog', url: '/boost' },
      { name: article.pillarLabel, url: `/boost?pillar=${article.pillar}` },
      { name: article.title, url: `/boost/${article.slug}` },
    ],
    faqs,
    jsonLd: [schema],
  };
}
