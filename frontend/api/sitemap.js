const DEFAULT_API_BASE = 'https://plataforma-de-facturacion.onrender.com/api';

const resolveApiBase = () => {
  const raw = process.env.SITEMAP_API_URL || process.env.VITE_API_URL || DEFAULT_API_BASE;
  const trimmed = String(raw).trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  try {
    const upstream = await fetch(`${resolveApiBase()}/ecommerce/sitemap.xml`, {
      method: req.method,
    });

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (req.method === 'HEAD') {
      res.status(upstream.ok ? 200 : upstream.status).end();
      return;
    }

    const xml = await upstream.text();
    res.status(upstream.ok ? 200 : upstream.status).send(xml);
  } catch (error) {
    res.status(502).json({ message: 'No se pudo generar el sitemap' });
  }
}
