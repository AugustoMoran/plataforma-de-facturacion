import Product from '../../inventory/models/Product';
import { CATALOG_PUBLIC_FILTER } from './catalogService';

const escapeXml = (value: string) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const formatLastMod = (value?: Date | string | null) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
};

export const getSiteBaseUrl = () => {
  const raw = process.env.SITE_URL || process.env.FRONTEND_URL || 'https://www.ososoundmusic.com';
  return raw.trim().replace(/\/+$/, '');
};

export const getSitemapXml = async () => {
  const baseUrl = getSiteBaseUrl();
  const products = await Product.find(CATALOG_PUBLIC_FILTER)
    .select('slug updatedAt')
    .sort({ updatedAt: -1, name: 1 })
    .lean();

  const staticPages = [
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/products`, changefreq: 'daily', priority: '0.9' },
  ];

  const productPages = products.map((product) => {
    const slug = String(product.slug || product._id).trim().toLowerCase();
    return {
      loc: `${baseUrl}/products/${encodeURIComponent(slug)}`,
      lastmod: formatLastMod(product.updatedAt),
      changefreq: 'weekly',
      priority: '0.7',
    };
  });

  const urls = [...staticPages, ...productPages];

  const body = urls
    .map((entry) => {
      const parts = [`<loc>${escapeXml(entry.loc)}</loc>`];
      if ('lastmod' in entry && entry.lastmod) parts.push(`<lastmod>${entry.lastmod}</lastmod>`);
      if ('changefreq' in entry && entry.changefreq) parts.push(`<changefreq>${entry.changefreq}</changefreq>`);
      if ('priority' in entry && entry.priority) parts.push(`<priority>${entry.priority}</priority>`);
      return `<url>${parts.join('')}</url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
};
