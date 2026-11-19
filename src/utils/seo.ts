import { useEffect } from 'react';
import {
  FOUNDER_PRIMARY_URL,
  SITE_URL,
  buildSeoGraphDocument,
  inferOgImageMeta,
  normalizeIsoDateTime,
  toAbsoluteUrl,
  type PageSeoConfig,
} from './seoSchema';

export * from './seoSchema';

function upsertMeta(attrName: 'name' | 'property', attrValue: string, content: string): void {
  if (typeof document === 'undefined') return;
  let el = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMeta(attrName: 'name' | 'property', attrValue: string): void {
  if (typeof document === 'undefined') return;
  document
    .querySelectorAll<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`)
    .forEach((el) => el.remove());
}

function upsertCanonical(href: string): void {
  if (typeof document === 'undefined') return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function removeCanonical(): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]').forEach((el) => el.remove());
}

function upsertHeadLink(attrs: Record<string, string>, selector: string): void {
  if (typeof document === 'undefined') return;
  let link = document.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement('link');
    document.head.appendChild(link);
  }
  Object.entries(attrs).forEach(([k, v]) => link!.setAttribute(k, v));
}

export function applyPageSeo(config: PageSeoConfig): void {
  if (typeof document === 'undefined') return;

  const canonicalUrl = toAbsoluteUrl(config.path);
  const imageMeta = inferOgImageMeta(config);
  const ogImageAlt = config.ogImageAlt || config.title;
  const ogType = config.ogType || 'website';

  document.title = config.title;
  if (config.noindex) {
    removeCanonical();
  } else {
    upsertCanonical(canonicalUrl);
  }
  upsertHeadLink(
    {
      rel: 'alternate',
      type: 'text/plain',
      title: 'LLM Context (GEO)',
      href: `${SITE_URL}/llms.txt`,
    },
    'link[rel="alternate"][href$="/llms.txt"]'
  );
  upsertHeadLink(
    {
      rel: 'alternate',
      type: 'text/plain',
      title: 'LLM Full Context (GEO)',
      href: `${SITE_URL}/llms-full.txt`,
    },
    'link[rel="alternate"][href$="/llms-full.txt"]'
  );
  upsertHeadLink(
    {
      rel: 'sitemap',
      type: 'application/xml',
      title: 'Sitemap',
      href: `${SITE_URL}/sitemap.xml`,
    },
    'link[rel="sitemap"]'
  );

  upsertMeta('name', 'title', config.title);
  upsertMeta('name', 'description', config.description);
  if (config.keywords && config.keywords.length > 0) {
    upsertMeta('name', 'keywords', config.keywords.join(', '));
  } else {
    removeMeta('name', 'keywords');
  }
  upsertMeta(
    'name',
    'robots',
    config.noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1'
  );
  upsertMeta('name', 'application-name', 'DOMATION');
  upsertMeta('name', 'author', config.authorName || 'Huỳnh Trọng Phúc (TurnioDEV) — DOMATION');

  upsertMeta('property', 'og:type', ogType);
  upsertMeta('property', 'og:locale', 'vi_VN');
  upsertMeta('property', 'og:site_name', 'DOMATION');
  upsertMeta('property', 'og:url', canonicalUrl);
  upsertMeta('property', 'og:title', config.title);
  upsertMeta('property', 'og:description', config.description);
  upsertMeta('property', 'og:image', imageMeta.url);
  if (imageMeta.secureUrl) {
    upsertMeta('property', 'og:image:secure_url', imageMeta.secureUrl);
  } else {
    removeMeta('property', 'og:image:secure_url');
  }
  if (imageMeta.type) {
    upsertMeta('property', 'og:image:type', imageMeta.type);
  } else {
    removeMeta('property', 'og:image:type');
  }
  if (imageMeta.width !== undefined) {
    upsertMeta('property', 'og:image:width', String(imageMeta.width));
  } else {
    removeMeta('property', 'og:image:width');
  }
  if (imageMeta.height !== undefined) {
    upsertMeta('property', 'og:image:height', String(imageMeta.height));
  } else {
    removeMeta('property', 'og:image:height');
  }
  upsertMeta('property', 'og:image:alt', ogImageAlt);

  if (ogType === 'article') {
    if (config.publishedTime) {
      upsertMeta(
        'property',
        'article:published_time',
        normalizeIsoDateTime(config.publishedTime, '08:00:00+07:00')
      );
    } else {
      removeMeta('property', 'article:published_time');
    }
    if (config.modifiedTime) {
      upsertMeta(
        'property',
        'article:modified_time',
        normalizeIsoDateTime(config.modifiedTime, '09:00:00+07:00')
      );
    } else {
      removeMeta('property', 'article:modified_time');
    }
    if (config.section) {
      upsertMeta('property', 'article:section', config.section);
    } else {
      removeMeta('property', 'article:section');
    }
    upsertMeta('property', 'article:author', FOUNDER_PRIMARY_URL);
  } else {
    removeMeta('property', 'article:published_time');
    removeMeta('property', 'article:modified_time');
    removeMeta('property', 'article:section');
    removeMeta('property', 'article:author');
  }

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:url', canonicalUrl);
  upsertMeta('name', 'twitter:title', config.title);
  upsertMeta('name', 'twitter:description', config.description);
  upsertMeta('name', 'twitter:image', imageMeta.url);
  upsertMeta('name', 'twitter:image:alt', ogImageAlt);

  const existingScripts = document.querySelectorAll('script[data-domation-seo="true"]');
  existingScripts.forEach((s) => s.remove());

  const graphDocument = buildSeoGraphDocument(config);
  if (graphDocument) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-domation-seo', 'true');
    script.textContent = JSON.stringify(graphDocument);
    document.head.appendChild(script);
  }
}

export function usePageSeo(config: PageSeoConfig): void {
  const serialized = JSON.stringify(config);
  useEffect(() => {
    applyPageSeo(JSON.parse(serialized) as PageSeoConfig);
  }, [serialized]);
}
