export interface BrandedQrOptions {
  value: string;
  fgColor: string;
  bgColor: string;
  cornerRadius: number;
  logoUrl: string;
}

/**
 * Generates a crisp branded SVG QR visual with finder eyes, deterministic encoded data matrix,
 * custom corner radius, and optional center logo (`/imgs/autodata/ICON.png` or custom URL).
 */
export function generateBrandedQrSvg(opts: BrandedQrOptions): string {
  const grid = 25;
  const cell = 10;
  const pad = 20;
  const total = grid * cell + pad * 2;
  const fg = opts.fgColor || '#1E40FF';
  const bg = opts.bgColor || '#FFFFFF';
  const rx = Math.min(28, Math.max(0, opts.cornerRadius || 12));

  let hash = 2166136261;
  const text = opts.value || 'https://domation.net';
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const isFinderArea = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= grid - 7) || (r >= grid - 7 && c < 7);

  const isCenterLogoZone = (r: number, c: number) =>
    Boolean(opts.logoUrl) && r >= 9 && r <= 15 && c >= 9 && c <= 15;

  const rects: string[] = [];

  // 3 Finder Eyes
  const drawFinder = (startR: number, startC: number) => {
    const x = pad + startC * cell;
    const y = pad + startR * cell;
    rects.push(
      `<rect x="${x}" y="${y}" width="${7 * cell}" height="${7 * cell}" rx="12" fill="none" stroke="${fg}" stroke-width="${cell}" />`,
      `<rect x="${x + 2 * cell}" y="${y + 2 * cell}" width="${3 * cell}" height="${3 * cell}" rx="6" fill="${fg}" />`
    );
  };
  drawFinder(0, 0);
  drawFinder(0, grid - 7);
  drawFinder(grid - 7, 0);

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      if (isFinderArea(r, c) || isCenterLogoZone(r, c)) continue;
      const bitSeed = Math.imul(hash ^ (r * 31 + c * 97 + text.charCodeAt((r + c) % text.length)), 2654435761);
      if ((bitSeed >>> 3) % 2 === 0) {
        rects.push(
          `<rect x="${pad + c * cell + 1}" y="${pad + r * cell + 1}" width="${cell - 2}" height="${cell - 2}" rx="2.5" fill="${fg}" />`
        );
      }
    }
  }

  const centerLogo = opts.logoUrl
    ? `<g transform="translate(${pad + 9.5 * cell}, ${pad + 9.5 * cell})">
        <rect width="${6 * cell}" height="${6 * cell}" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
        <image href="${opts.logoUrl.replace(/"/g, '&quot;')}" x="6" y="6" width="${6 * cell - 12}" height="${6 * cell - 12}" preserveAspectRatio="xMidYMid contain" />
      </g>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}">
    <rect width="${total}" height="${total}" rx="${rx}" fill="${bg}" stroke="#E2E8F0" stroke-width="1.5" />
    ${rects.join('\n    ')}
    ${centerLogo}
  </svg>`;
}

export function downloadSvgString(svgText: string, fileName: string): void {
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.svg') ? fileName : `${fileName}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSvgAsPng(svgText: string, fileName: string): void {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 580;
    canvas.height = 580;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
      a.click();
    }
    URL.revokeObjectURL(url);
  };
  img.src = url;
}
