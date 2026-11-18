export const SITE_URL = 'https://domation.net';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/imgs/og-domation-v2.jpg`;
export const BRAND_LOGO_URL = `${SITE_URL}/domation-logo.svg`;
export const ORG_ID = `${SITE_URL}/#organization`;
export const FOUNDER_ID = `${SITE_URL}/#founder`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const FOUNDER_PRIMARY_URL = 'https://turnio.vercel.app/';
export const FOUNDER_PORTFOLIO_URL = 'https://portfo-turnio.vercel.app/';

export interface PageFaqItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface SoftwareAppOfferInput {
  name?: string;
  price: string;
  description?: string;
  url?: string;
}

export interface PageSeoConfig {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogType?: 'website' | 'article';
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogImageType?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  section?: string;
  noindex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  faqs?: PageFaqItem[];
  jsonLd?: Record<string, unknown>[];
}

const KNOWN_IMAGE_DIMENSIONS: Record<string, { width: number; height: number; type: string }> = {
  '/imgs/og-domation-v2.jpg': { width: 1200, height: 630, type: 'image/jpeg' },
  '/imgs/home.jpg': { width: 2560, height: 1400, type: 'image/jpeg' },
  '/imgs/enterprise/sol-crm-misa.webp': { width: 1344, height: 750, type: 'image/webp' },
  '/imgs/enterprise/sol-erp-operations.webp': { width: 1376, height: 768, type: 'image/webp' },
  '/imgs/enterprise/sol-data-capi.webp': { width: 1344, height: 750, type: 'image/webp' },
  '/imgs/enterprise/sol-ai-automation.webp': { width: 1344, height: 750, type: 'image/webp' },
  '/imgs/enterprise/sol-web3d-meta.webp': { width: 1344, height: 750, type: 'image/webp' },
  '/imgs/enterprise/hero-domation-hub.webp': { width: 1344, height: 750, type: 'image/webp' },
  '/imgs/boost/boost-hero-growth-hub.jpg': { width: 1376, height: 768, type: 'image/jpeg' },
  '/landingpage_avatar/portfolio.webp': { width: 2558, height: 1340, type: 'image/webp' },
  '/landingpage_avatar/ideasmba.webp': { width: 2557, height: 1345, type: 'image/webp' },
  '/imgs/erp-screens/dashboard-lead.webp': { width: 2880, height: 1800, type: 'image/webp' },
  '/imgs/erp-screens/fair-share.webp': { width: 2880, height: 1800, type: 'image/webp' },
  '/imgs/erp-screens/attendance-detail.webp': { width: 2880, height: 1800, type: 'image/webp' },
};

export function toAbsoluteUrl(urlOrPath: string): string {
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  const clean = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return `${SITE_URL}${clean}`;
}

export function normalizeIsoDateTime(dateStr: string, defaultTime: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return `${dateStr}T${defaultTime}`;
  }
  return dateStr;
}

export function inferOgImageMeta(
  config: Pick<PageSeoConfig, 'ogImage' | 'ogImageWidth' | 'ogImageHeight' | 'ogImageType'>
): {
  url: string;
  secureUrl: string | undefined;
  type: string | undefined;
  width: number | undefined;
  height: number | undefined;
} {
  const raw = config.ogImage || DEFAULT_OG_IMAGE;
  const url = toAbsoluteUrl(raw);
  const relPath = url.startsWith(SITE_URL) ? url.slice(SITE_URL.length) : raw;
  const known = KNOWN_IMAGE_DIMENSIONS[relPath];

  let inferredType = config.ogImageType || known?.type;
  if (!inferredType) {
    const cleanUrl = url.split('?')[0].toLowerCase();
    if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg')) inferredType = 'image/jpeg';
    else if (cleanUrl.endsWith('.webp')) inferredType = 'image/webp';
    else if (cleanUrl.endsWith('.png')) inferredType = 'image/png';
    else if (cleanUrl.endsWith('.svg')) inferredType = 'image/svg+xml';
    else if (cleanUrl.startsWith(`${SITE_URL}/imgs/boost/`)) inferredType = 'image/jpeg';
  }

  let width = config.ogImageWidth ?? known?.width;
  let height = config.ogImageHeight ?? known?.height;
  if ((width === undefined || height === undefined) && relPath.startsWith('/imgs/boost/')) {
    width = 1376;
    height = 768;
  }

  return {
    url,
    secureUrl: url.startsWith('https://') ? url : undefined,
    type: inferredType,
    width,
    height,
  };
}

function stripContext(node: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...node };
  delete rest['@context'];
  return rest;
}

export function buildFounderSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': FOUNDER_ID,
    name: 'Huỳnh Trọng Phúc (TurnioDEV)',
    alternateName: ['Turnio DEV', 'TurnioDEV', 'Huỳnh Trọng Phúc'],
    jobTitle: 'Founder & Solution Architect',
    url: FOUNDER_PRIMARY_URL,
    worksFor: {
      '@id': ORG_ID,
    },
    sameAs: [
      FOUNDER_PRIMARY_URL,
      FOUNDER_PORTFOLIO_URL,
      'https://www.facebook.com/turni0',
      'https://zalo.me/0378859736',
    ],
  };
}

export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'Công Ty TNHH DOMATION Việt Nam',
    alternateName: ['DOMATION', 'DOMATION.NET', 'DOMARKETING', 'DOM MARKETING'],
    url: `${SITE_URL}/`,
    description:
      'DOMATION là hệ thống vận hành custom may đo, thiết kế flow riêng cho doanh nghiệp thời đại mới: Enterprise ERP 5.0 (12 phân hệ), CRM 360° MISA, Auto Chia Data ZaloBot <5s, Meta CAPI, Vibecode & AI Doanh nghiệp 5.0.',
    image: DEFAULT_OG_IMAGE,
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE_URL}/#logo`,
      url: BRAND_LOGO_URL,
      contentUrl: BRAND_LOGO_URL,
      caption: 'DOMATION.NET Logo',
    },
    email: 'turniodev@gmail.com',
    telephone: '+84378859736',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'TP. Hồ Chí Minh',
      addressCountry: 'VN',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+84378859736',
        email: 'turniodev@gmail.com',
        contactType: 'sales',
        areaServed: 'VN',
        availableLanguage: ['vi', 'en'],
        url: 'https://zalo.me/0378859736',
      },
    ],
    areaServed: [
      { '@type': 'Country', name: 'Việt Nam' },
      { '@type': 'City', name: 'TP. Hồ Chí Minh' },
      { '@type': 'City', name: 'Đà Nẵng' },
      { '@type': 'City', name: 'Hà Nội' },
    ],
    founder: {
      '@id': FOUNDER_ID,
    },
    sameAs: [
      'https://www.facebook.com/turni0',
      FOUNDER_PRIMARY_URL,
      FOUNDER_PORTFOLIO_URL,
      'https://zalo.me/0378859736',
    ],
    knowsAbout: [
      'Hệ thống vận hành custom may đo doanh nghiệp',
      'Làm chủ hệ thống, làm chủ dữ liệu và làm chủ source code doanh nghiệp',
      'Thiết kế flow riêng cho doanh nghiệp thời đại mới',
      'Phần mềm ERP 5.0 May Đo 12 Phân Hệ Chuyên Sâu',
      'Phần mềm AI Agent & Multi-Agent AI Điều Phối Tự Trị',
      'Vibecode Enterprise & Kiến Trúc Phần Mềm Custom Chuyên Sâu',
      'Flow Automation Đa Kênh (Visual Flow IF/ELSE, Webhook 2 Chiều)',
      'Auto Chia Data ZaloBot < 5s & Meta CAPI SHA-256',
      'Phần mềm CRM 360 độ & Hóa đơn điện tử MISA',
      'Tối ưu Quảng cáo, Landing Page CRO & Chiến dịch Automation',
      'Thiết kế Website & Sa bàn 3D WebGL',
      'SEO 100%, GEO & LLMS.txt',
    ],
  };
}

export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: 'DOMATION.NET',
    alternateName: 'DOMATION Việt Nam',
    description:
      'Hệ sinh thái Công nghệ Marketing × App × AI May Đo cho Doanh nghiệp: Auto Chia Data, Meta CAPI, ERP 5.0, CRM 360°, AI Agent & Web 3D.',
    inLanguage: 'vi-VN',
    publisher: {
      '@id': ORG_ID,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/boost?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildBreadcrumbSchema(
  items: BreadcrumbItem[],
  pageUrl?: string
): Record<string, unknown> {
  const idBase = pageUrl ? toAbsoluteUrl(pageUrl) : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    ...(idBase ? { '@id': `${idBase}#breadcrumb` } : {}),
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: toAbsoluteUrl(item.url),
    })),
  };
}

export function buildFaqSchema(
  faqs: PageFaqItem[],
  pageUrl?: string
): Record<string, unknown> {
  const idBase = pageUrl ? toAbsoluteUrl(pageUrl) : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(idBase ? { '@id': `${idBase}#faq` } : {}),
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildSoftwareAppSchema(params: {
  name: string;
  description: string;
  path: string;
  applicationCategory?: string;
  softwareVersion?: string;
  screenshot?: string;
  featureList?: string[];
  price?: string;
  offers?: SoftwareAppOfferInput[];
  isCustomQuote?: boolean;
  priceNote?: string;
}): Record<string, unknown> {
  const fullUrl = toAbsoluteUrl(params.path);

  let offersNode: Record<string, unknown> | Record<string, unknown>[];
  if (params.offers && params.offers.length > 0) {
    const mapped = params.offers.map((offer) => ({
      '@type': 'Offer',
      ...(offer.name ? { name: offer.name } : {}),
      priceCurrency: 'VND',
      price: offer.price,
      availability: 'https://schema.org/InStock',
      ...(offer.description ? { description: offer.description } : {}),
      ...(offer.url ? { url: toAbsoluteUrl(offer.url) } : {}),
    }));
    offersNode = mapped.length === 1 ? mapped[0] : mapped;
  } else if (params.isCustomQuote) {
    offersNode = {
      '@type': 'Offer',
      name: 'Báo giá thiết kế riêng (Bespoke Quote)',
      priceCurrency: 'VND',
      price: '0',
      url: `${fullUrl}#tu-van`,
      availability: 'https://schema.org/InStock',
      description:
        params.priceNote || 'Khảo sát & báo giá thiết kế riêng theo quy mô doanh nghiệp',
    };
  } else {
    offersNode = {
      '@type': 'Offer',
      priceCurrency: 'VND',
      price: params.price || '2990000',
      availability: 'https://schema.org/InStock',
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${fullUrl}#software`,
    name: params.name,
    description: params.description,
    url: fullUrl,
    applicationCategory: params.applicationCategory || 'BusinessApplication',
    operatingSystem: 'Web, Cloud SaaS, iOS, Android',
    inLanguage: 'vi-VN',
    ...(params.softwareVersion ? { softwareVersion: params.softwareVersion } : {}),
    ...(params.screenshot ? { screenshot: toAbsoluteUrl(params.screenshot) } : {}),
    ...(params.featureList && params.featureList.length > 0
      ? { featureList: params.featureList }
      : {}),
    provider: {
      '@id': ORG_ID,
    },
    publisher: {
      '@id': ORG_ID,
    },
    offers: offersNode,
  };
}

export function buildArticleSchema(params: {
  headline: string;
  description: string;
  path: string;
  image: string;
  extraImages?: string[];
  datePublished: string;
  dateModified: string;
  keywords: string[];
  articleSection: string;
  aboutIndustry: string;
  wordCount?: number;
}): Record<string, unknown> {
  const fullUrl = toAbsoluteUrl(params.path);
  const images = Array.from(
    new Set([params.image, ...(params.extraImages || [])].filter(Boolean).map(toAbsoluteUrl))
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${fullUrl}#article`,
    mainEntityOfPage: {
      '@id': `${fullUrl}#webpage`,
    },
    isPartOf: {
      '@id': `${fullUrl}#webpage`,
    },
    url: fullUrl,
    headline: params.headline,
    description: params.description,
    image: images,
    datePublished: normalizeIsoDateTime(params.datePublished, '08:00:00+07:00'),
    dateModified: normalizeIsoDateTime(params.dateModified, '09:00:00+07:00'),
    inLanguage: 'vi-VN',
    isAccessibleForFree: true,
    articleSection: params.articleSection,
    keywords: params.keywords.join(', '),
    about: {
      '@type': 'Thing',
      name: params.aboutIndustry,
    },
    wordCount: params.wordCount || 1100,
    author: {
      '@id': FOUNDER_ID,
    },
    publisher: {
      '@id': ORG_ID,
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '#geo-tldr'],
    },
  };
}

export function buildSeoGraphDocument(config: PageSeoConfig): Record<string, unknown> | null {
  if (config.noindex) return null;

  const canonicalUrl = toAbsoluteUrl(config.path);
  const imageMeta = inferOgImageMeta(config);
  const hasBreadcrumbs = Boolean(config.breadcrumbs && config.breadcrumbs.length >= 2);

  const graphNodes: Record<string, unknown>[] = [
    stripContext(buildOrganizationSchema()),
    stripContext(buildFounderSchema()),
    stripContext(buildWebSiteSchema()),
  ];

  const customNodes = (config.jsonLd || []).map(stripContext);
  const hasCollectionPage = customNodes.some(
    (n) => n['@type'] === 'CollectionPage' || n['@type'] === 'ProfilePage'
  );

  const primaryEntityNode = customNodes.find(
    (n) =>
      n['@type'] === 'SoftwareApplication' ||
      n['@type'] === 'Service' ||
      n['@type'] === 'BlogPosting' ||
      n['@type'] === 'Article'
  );
  const primaryEntityId =
    primaryEntityNode && typeof primaryEntityNode['@id'] === 'string'
      ? primaryEntityNode['@id']
      : undefined;

  if (!hasCollectionPage) {
    const webPageNode: Record<string, unknown> = {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: config.title,
      description: config.description,
      inLanguage: 'vi-VN',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': ORG_ID },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: imageMeta.url,
      },
      ...(config.publishedTime
        ? { datePublished: normalizeIsoDateTime(config.publishedTime, '08:00:00+07:00') }
        : {}),
      ...(config.modifiedTime
        ? { dateModified: normalizeIsoDateTime(config.modifiedTime, '09:00:00+07:00') }
        : {}),
      ...(hasBreadcrumbs ? { breadcrumb: { '@id': `${canonicalUrl}#breadcrumb` } } : {}),
      ...(primaryEntityId ? { mainEntity: { '@id': primaryEntityId } } : {}),
    };
    graphNodes.push(webPageNode);
  }

  if (hasBreadcrumbs && config.breadcrumbs) {
    graphNodes.push(stripContext(buildBreadcrumbSchema(config.breadcrumbs, canonicalUrl)));
  }
  if (config.faqs && config.faqs.length > 0) {
    graphNodes.push(stripContext(buildFaqSchema(config.faqs, canonicalUrl)));
  }

  customNodes.forEach((node) => {
    if (node['@type'] === 'CollectionPage' || node['@type'] === 'ProfilePage') {
      graphNodes.push({
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        description: config.description,
        inLanguage: 'vi-VN',
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': ORG_ID },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: imageMeta.url,
        },
        ...(hasBreadcrumbs ? { breadcrumb: { '@id': `${canonicalUrl}#breadcrumb` } } : {}),
        ...node,
      });
    } else {
      graphNodes.push(node);
    }
  });

  return {
    '@context': 'https://schema.org',
    '@graph': graphNodes,
  };
}
