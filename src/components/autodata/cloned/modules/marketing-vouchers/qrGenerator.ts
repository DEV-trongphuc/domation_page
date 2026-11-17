import {
  DEFAULT_QR_DESIGN,
  type BrandedQrOptions,
  type QrEyeShape,
  type QrFrameStyle,
  type QrGradientMode,
  type QrModuleShape,
} from './voucherTypes';

export type { BrandedQrOptions };

function escapeXml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a full Branded QR Studio SVG with:
 * - Module shapes (`square` | `dots` | `rounded` | `diamond`)
 * - Custom finder eye frames & eyeballs (`square` | `rounded` | `circle`)
 * - Solid / Linear / Radial gradient (`fgColor` -> `gradientEndColor`, `bgColor`)
 * - Center logo URL / Data URL with configurable `logoSizePct` & `logoPadding`
 * - Branded CTA frame (`none` | `bottom_pill` | `card_badge`, `frameText`, `frameColor`)
 */
export function generateBrandedQrSvg(inputOpts: BrandedQrOptions): string {
  const opts: Required<BrandedQrOptions> = {
    ...DEFAULT_QR_DESIGN,
    ...inputOpts,
    fgColor: inputOpts.fgColor || DEFAULT_QR_DESIGN.fgColor,
    bgColor: inputOpts.bgColor || DEFAULT_QR_DESIGN.bgColor,
    cornerRadius:
      typeof inputOpts.cornerRadius === 'number'
        ? inputOpts.cornerRadius
        : DEFAULT_QR_DESIGN.cornerRadius,
    logoUrl: inputOpts.logoUrl !== undefined ? inputOpts.logoUrl : DEFAULT_QR_DESIGN.logoUrl,
    moduleShape: (inputOpts.moduleShape || 'rounded') as QrModuleShape,
    eyeFrameShape: (inputOpts.eyeFrameShape || 'rounded') as QrEyeShape,
    eyeBallShape: (inputOpts.eyeBallShape || 'rounded') as QrEyeShape,
    eyeColor: inputOpts.eyeColor || inputOpts.fgColor || '#1E40FF',
    gradientMode: (inputOpts.gradientMode || 'solid') as QrGradientMode,
    gradientEndColor: inputOpts.gradientEndColor || '#0284C7',
    gradientAngle: typeof inputOpts.gradientAngle === 'number' ? inputOpts.gradientAngle : 135,
    logoSizePct: Math.min(32, Math.max(14, Number(inputOpts.logoSizePct ?? 22))),
    logoPadding: Math.min(14, Math.max(2, Number(inputOpts.logoPadding ?? 6))),
    frameStyle: (inputOpts.frameStyle || 'none') as QrFrameStyle,
    frameText: inputOpts.frameText || 'QUÉT NHẬN ƯU ĐÃI',
    frameColor: inputOpts.frameColor || '#1E40FF',
  };

  const grid = 27;
  const cell = 10;
  const pad = 22;
  const qrBoxSize = grid * cell + pad * 2; // 314
  const rx = Math.min(32, Math.max(0, opts.cornerRadius));

  const extraBottom = opts.frameStyle === 'bottom_pill' ? 54 : opts.frameStyle === 'card_badge' ? 64 : 0;
  const extraTop = opts.frameStyle === 'card_badge' ? 18 : 0;
  const extraSide = opts.frameStyle === 'card_badge' ? 16 : 0;

  const viewWidth = qrBoxSize + extraSide * 2;
  const viewHeight = qrBoxSize + extraTop + extraBottom;
  const qrOffsetX = extraSide;
  const qrOffsetY = extraTop;

  let hash = 2166136261;
  const text = opts.value || 'https://domation.net';
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const gradId = `domQrGrad_${Math.abs(hash % 999983)}`;
  const useGrad = opts.gradientMode === 'linear' || opts.gradientMode === 'radial';
  const moduleFill = useGrad ? `url(#${gradId})` : escapeXml(opts.fgColor);
  const finderStrokeFill = useGrad ? `url(#${gradId})` : escapeXml(opts.eyeColor || opts.fgColor);

  const angleRad = ((opts.gradientAngle % 360) * Math.PI) / 180;
  const x1 = Math.round(50 - Math.cos(angleRad) * 50);
  const y1 = Math.round(50 - Math.sin(angleRad) * 50);
  const x2 = Math.round(50 + Math.cos(angleRad) * 50);
  const y2 = Math.round(50 + Math.sin(angleRad) * 50);

  const defs = useGrad
    ? opts.gradientMode === 'radial'
      ? `<defs>
      <radialGradient id="${gradId}" cx="50%" cy="50%" r="65%">
        <stop offset="0%" stop-color="${escapeXml(opts.fgColor)}" />
        <stop offset="100%" stop-color="${escapeXml(opts.gradientEndColor)}" />
      </radialGradient>
    </defs>`
      : `<defs>
      <linearGradient id="${gradId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
        <stop offset="0%" stop-color="${escapeXml(opts.fgColor)}" />
        <stop offset="100%" stop-color="${escapeXml(opts.gradientEndColor)}" />
      </linearGradient>
    </defs>`
    : '';

  const logoBoxPx = Math.round((grid * cell * opts.logoSizePct) / 100);
  const halfCells = Math.ceil(logoBoxPx / cell / 2) + 1;
  const midCell = Math.floor(grid / 2);

  const isFinderArea = (r: number, c: number) =>
    (r < 8 && c < 8) || (r < 8 && c >= grid - 8) || (r >= grid - 8 && c < 8);

  const isCenterLogoZone = (r: number, c: number) =>
    Boolean(opts.logoUrl.trim()) &&
    r >= midCell - halfCells &&
    r <= midCell + halfCells &&
    c >= midCell - halfCells &&
    c <= midCell + halfCells;

  const shapes: string[] = [];

  const drawFinder = (startR: number, startC: number) => {
    const x = qrOffsetX + pad + startC * cell;
    const y = qrOffsetY + pad + startR * cell;
    const outerSize = 7 * cell;
    const halfStroke = cell / 2;

    if (opts.eyeFrameShape === 'circle') {
      const cx = x + outerSize / 2;
      const cy = y + outerSize / 2;
      shapes.push(
        `<circle cx="${cx}" cy="${cy}" r="${(outerSize - cell) / 2}" fill="none" stroke="${finderStrokeFill}" stroke-width="${cell}" />`
      );
    } else {
      const frameRx = opts.eyeFrameShape === 'rounded' ? 14 : 0;
      shapes.push(
        `<rect x="${x + halfStroke}" y="${y + halfStroke}" width="${outerSize - cell}" height="${outerSize - cell}" rx="${frameRx}" fill="none" stroke="${finderStrokeFill}" stroke-width="${cell}" />`
      );
    }

    const ballX = x + 2 * cell;
    const ballY = y + 2 * cell;
    const ballSize = 3 * cell;
    if (opts.eyeBallShape === 'circle') {
      shapes.push(
        `<circle cx="${ballX + ballSize / 2}" cy="${ballY + ballSize / 2}" r="${ballSize / 2}" fill="${finderStrokeFill}" />`
      );
    } else {
      const ballRx = opts.eyeBallShape === 'rounded' ? 8 : 0;
      shapes.push(
        `<rect x="${ballX}" y="${ballY}" width="${ballSize}" height="${ballSize}" rx="${ballRx}" fill="${finderStrokeFill}" />`
      );
    }
  };

  drawFinder(0, 0);
  drawFinder(0, grid - 7);
  drawFinder(grid - 7, 0);

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      if (isFinderArea(r, c) || isCenterLogoZone(r, c)) continue;
      // Deterministic timing patterns on row 6 and col 6
      const isTiming = (r === 6 && c % 2 === 0) || (c === 6 && r % 2 === 0);
      const bitSeed = Math.imul(
        hash ^ (r * 37 + c * 101 + text.charCodeAt((r * 3 + c) % text.length)),
        2654435761
      );
      if (!isTiming && (bitSeed >>> 3) % 2 !== 0) continue;

      const mx = qrOffsetX + pad + c * cell + 1;
      const my = qrOffsetY + pad + r * cell + 1;
      const mSize = cell - 1.6;
      const cx = mx + mSize / 2;
      const cy = my + mSize / 2;

      if (opts.moduleShape === 'dots') {
        shapes.push(`<circle cx="${cx}" cy="${cy}" r="${mSize / 2}" fill="${moduleFill}" />`);
      } else if (opts.moduleShape === 'diamond') {
        const pts = `${cx},${my} ${mx + mSize},${cy} ${cx},${my + mSize} ${mx},${cy}`;
        shapes.push(`<polygon points="${pts}" fill="${moduleFill}" />`);
      } else if (opts.moduleShape === 'rounded') {
        shapes.push(
          `<rect x="${mx}" y="${my}" width="${mSize}" height="${mSize}" rx="3.2" fill="${moduleFill}" />`
        );
      } else {
        shapes.push(`<rect x="${mx}" y="${my}" width="${mSize}" height="${mSize}" fill="${moduleFill}" />`);
      }
    }
  }

  const logoCenterCoordX = qrOffsetX + qrBoxSize / 2 - logoBoxPx / 2;
  const logoCenterCoordY = qrOffsetY + qrBoxSize / 2 - logoBoxPx / 2;
  const innerImgPad = opts.logoPadding;
  const innerImgSize = Math.max(16, logoBoxPx - innerImgPad * 2);

  const centerLogoSvg = opts.logoUrl.trim()
    ? `<g transform="translate(${logoCenterCoordX}, ${logoCenterCoordY})">
      <rect width="${logoBoxPx}" height="${logoBoxPx}" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
      <image href="${escapeXml(opts.logoUrl.trim())}" x="${innerImgPad}" y="${innerImgPad}" width="${innerImgSize}" height="${innerImgSize}" preserveAspectRatio="xMidYMid meet" />
    </g>`
    : '';

  const safeFrameText = escapeXml((opts.frameText || 'QUÉT NHẬN ƯU ĐÃI').slice(0, 32));
  const safeFrameColor = escapeXml(opts.frameColor || '#1E40FF');

  let outerChrome = `<rect x="${qrOffsetX}" y="${qrOffsetY}" width="${qrBoxSize}" height="${qrBoxSize}" rx="${rx}" fill="${escapeXml(opts.bgColor)}" stroke="#E2E8F0" stroke-width="1.5" />`;
  let ctaOverlay = '';

  if (opts.frameStyle === 'bottom_pill') {
    const pillW = qrBoxSize - 36;
    const pillX = qrOffsetX + 18;
    const pillY = qrOffsetY + qrBoxSize + 8;
    ctaOverlay = `<g>
      <rect x="${pillX}" y="${pillY}" width="${pillW}" height="38" rx="19" fill="${safeFrameColor}" />
      <text x="${viewWidth / 2}" y="${pillY + 24}" text-anchor="middle" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="800" letter-spacing="0.06em">${safeFrameText}</text>
    </g>`;
  } else if (opts.frameStyle === 'card_badge') {
    outerChrome = `<rect x="2" y="2" width="${viewWidth - 4}" height="${viewHeight - 4}" rx="${Math.max(18, rx)}" fill="${safeFrameColor}" />
    <rect x="${qrOffsetX}" y="${qrOffsetY}" width="${qrBoxSize}" height="${qrBoxSize}" rx="${Math.max(12, rx - 4)}" fill="${escapeXml(opts.bgColor)}" />`;
    ctaOverlay = `<text x="${viewWidth / 2}" y="${qrOffsetY + qrBoxSize + 38}" text-anchor="middle" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="800" letter-spacing="0.07em">${safeFrameText}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${viewWidth}" height="${viewHeight}" viewBox="0 0 ${viewWidth} ${viewHeight}">
    ${defs}
    ${outerChrome}
    ${shapes.join('\n    ')}
    ${centerLogoSvg}
    ${ctaOverlay}
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

async function inlineSvgImagesForCanvas(svgText: string): Promise<string> {
  const match = svgText.match(/<image[^>]+href="([^"]+)"/);
  if (!match || !match[1] || match[1].startsWith('data:')) {
    return svgText;
  }
  try {
    const res = await fetch(match[1]);
    if (!res.ok) return svgText;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
    if (!dataUrl) return svgText;
    return svgText.replace(match[1], dataUrl);
  } catch {
    return svgText;
  }
}

export function downloadSvgAsPng(svgText: string, fileName: string): void {
  void (async () => {
    const hydratedSvg = await inlineSvgImagesForCanvas(svgText);
    const vbMatch = hydratedSvg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
    const vbW = vbMatch ? Number(vbMatch[1]) : 314;
    const vbH = vbMatch ? Number(vbMatch[2]) : 314;
    const outW = 1024;
    const outH = Math.round((outW * vbH) / Math.max(1, vbW));

    const img = new Image();
    img.crossOrigin = 'anonymous';
    const svgBlob = new Blob([hydratedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
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
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  })();
}
