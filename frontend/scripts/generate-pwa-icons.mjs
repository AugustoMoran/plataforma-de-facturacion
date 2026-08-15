import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');
const iconsDir = path.join(publicDir, 'icons');
const logoPath = path.join(publicDir, 'brand-logo.png');

const sizes = [192, 512];

const buildIcon = async (size) => {
  const logo = sharp(logoPath);
  const meta = await logo.metadata();
  const logoAspect = (meta.width || 1) / (meta.height || 1);

  const circleDiameter = Math.round(size * 0.78);
  const maxLogoWidth = Math.round(circleDiameter * 0.72);
  const maxLogoHeight = Math.round(maxLogoWidth / logoAspect);

  const resizedLogo = await logo
    .resize(maxLogoWidth, maxLogoHeight, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();

  const logoMeta = await sharp(resizedLogo).metadata();
  const logoW = logoMeta.width || maxLogoWidth;
  const logoH = logoMeta.height || maxLogoHeight;

  const circleSvg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="28%" stop-color="#e0f2fe"/>
          <stop offset="68%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#1d4ed8"/>
        </radialGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="#ffffff"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${circleDiameter / 2}" fill="url(#g)" stroke="#ffffff" stroke-width="${Math.max(2, size * 0.02)}"/>
    </svg>
  `;

  const circleBuffer = await sharp(Buffer.from(circleSvg)).png().toBuffer();

  const left = Math.round((size - logoW) / 2);
  const top = Math.round((size - logoH) / 2);

  return sharp(circleBuffer)
    .composite([{ input: resizedLogo, left, top }])
    .png()
    .toFile(path.join(iconsDir, `pwa-${size}.png`));
};

await mkdir(iconsDir, { recursive: true });
await Promise.all(sizes.map((size) => buildIcon(size)));
console.log('PWA icons generated in public/icons/');
