import { ComicPage, PanelScript, DialogueItem, PageLayoutType, BorderStyle } from '../types/comic';

export interface PanelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasDimensions {
  width: number;
  height: number;
}

/**
 * Organic layout partitioner for arbitrary panel counts (1 to 9+ panels)
 */
export function calculateDynamicPanelRects(
  panelCount: number,
  innerW: number,
  innerH: number,
  gutter: number,
  margin: number
): PanelRect[] {
  if (panelCount <= 1) {
    return [{ x: margin, y: margin, width: innerW, height: innerH }];
  }
  if (panelCount === 2) {
    const h = (innerH - gutter) / 2;
    return [
      { x: margin, y: margin, width: innerW, height: h },
      { x: margin, y: margin + h + gutter, width: innerW, height: h }
    ];
  }
  if (panelCount === 3) {
    const topH = innerH * 0.48;
    const botH = innerH - topH - gutter;
    const botW = (innerW - gutter) / 2;
    return [
      { x: margin, y: margin, width: innerW, height: topH },
      { x: margin, y: margin + topH + gutter, width: botW, height: botH },
      { x: margin + botW + gutter, y: margin + topH + gutter, width: botW, height: botH }
    ];
  }
  if (panelCount === 4) {
    const w = (innerW - gutter) / 2;
    const h = (innerH - gutter) / 2;
    return [
      { x: margin, y: margin, width: w, height: h },
      { x: margin + w + gutter, y: margin, width: w, height: h },
      { x: margin, y: margin + h + gutter, width: w, height: h },
      { x: margin + w + gutter, y: margin + h + gutter, width: w, height: h }
    ];
  }
  if (panelCount === 5) {
    const topH = innerH * 0.32;
    const midH = innerH * 0.36;
    const botH = innerH - topH - midH - gutter * 2;
    const midW = (innerW - gutter * 2) / 3;
    return [
      { x: margin, y: margin, width: innerW, height: topH },
      { x: margin, y: margin + topH + gutter, width: midW, height: midH },
      { x: margin + midW + gutter, y: margin + topH + gutter, width: midW, height: midH },
      { x: margin + (midW + gutter) * 2, y: margin + topH + gutter, width: midW, height: midH },
      { x: margin, y: margin + topH + midH + gutter * 2, width: innerW, height: botH }
    ];
  }
  if (panelCount === 6) {
    const w = (innerW - gutter) / 2;
    const h = (innerH - gutter * 2) / 3;
    return [
      { x: margin, y: margin, width: w, height: h },
      { x: margin + w + gutter, y: margin, width: w, height: h },
      { x: margin, y: margin + h + gutter, width: w, height: h },
      { x: margin + w + gutter, y: margin + h + gutter, width: w, height: h },
      { x: margin, y: margin + (h + gutter) * 2, width: w, height: h },
      { x: margin + w + gutter, y: margin + (h + gutter) * 2, width: w, height: h }
    ];
  }
  if (panelCount === 7) {
    const row1H = innerH * 0.32;
    const row2H = innerH * 0.36;
    const row3H = innerH - row1H - row2H - gutter * 2;
    const r1w1 = (innerW - gutter) * 0.58;
    const r1w2 = innerW - gutter - r1w1;
    const r2w = (innerW - gutter * 2) / 3;
    const r3w1 = (innerW - gutter) * 0.42;
    const r3w2 = innerW - gutter - r3w1;
    return [
      { x: margin, y: margin, width: r1w1, height: row1H },
      { x: margin + r1w1 + gutter, y: margin, width: r1w2, height: row1H },
      { x: margin, y: margin + row1H + gutter, width: r2w, height: row2H },
      { x: margin + r2w + gutter, y: margin + row1H + gutter, width: r2w, height: row2H },
      { x: margin + (r2w + gutter) * 2, y: margin + row1H + gutter, width: r2w, height: row2H },
      { x: margin, y: margin + row1H + row2H + gutter * 2, width: r3w1, height: row3H },
      { x: margin + r3w1 + gutter, y: margin + row1H + row2H + gutter * 2, width: r3w2, height: row3H }
    ];
  }
  if (panelCount === 8) {
    const rowH = (innerH - gutter * 2) / 3;
    const r1w = (innerW - gutter * 2) / 3;
    const r2w = (innerW - gutter) / 2;
    const r3w = (innerW - gutter * 2) / 3;
    return [
      { x: margin, y: margin, width: r1w, height: rowH },
      { x: margin + r1w + gutter, y: margin, width: r1w, height: rowH },
      { x: margin + (r1w + gutter) * 2, y: margin, width: r1w, height: rowH },
      { x: margin, y: margin + rowH + gutter, width: r2w, height: rowH },
      { x: margin + r2w + gutter, y: margin + rowH + gutter, width: r2w, height: rowH },
      { x: margin, y: margin + (rowH + gutter) * 2, width: r3w, height: rowH },
      { x: margin + r3w + gutter, y: margin + (rowH + gutter) * 2, width: r3w, height: rowH },
      { x: margin + (r3w + gutter) * 2, y: margin + (rowH + gutter) * 2, width: r3w, height: rowH }
    ];
  }

  // Dynamic row partition for arbitrary N
  const numRows = Math.min(4, Math.ceil(panelCount / 3));
  const rowHeight = (innerH - gutter * (numRows - 1)) / numRows;
  const rects: PanelRect[] = [];
  const baseCols = Math.floor(panelCount / numRows);
  let remainder = panelCount % numRows;

  let currentY = margin;
  for (let r = 0; r < numRows; r++) {
    const colsInThisRow = baseCols + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    const colWidth = (innerW - gutter * (colsInThisRow - 1)) / colsInThisRow;
    let currentX = margin;

    for (let c = 0; c < colsInThisRow; c++) {
      rects.push({
        x: currentX,
        y: currentY,
        width: colWidth,
        height: rowHeight
      });
      currentX += colWidth + gutter;
    }
    currentY += rowHeight + gutter;
  }

  return rects;
}

/**
 * Calculates panel grid bounding boxes for a page layout
 */
export function calculatePanelRects(
  layoutType: PageLayoutType,
  containerWidth: number,
  containerHeight: number,
  gutter: number,
  margin: number,
  panelCount: number = 4
): PanelRect[] {
  const innerW = containerWidth - margin * 2;
  const innerH = containerHeight - margin * 2;

  if (layoutType === 'dynamic-auto') {
    return calculateDynamicPanelRects(panelCount, innerW, innerH, gutter, margin);
  }

  switch (layoutType) {
    case 'grid-4': {
      // 2 columns x 2 rows
      const w = (innerW - gutter) / 2;
      const h = (innerH - gutter) / 2;
      return [
        { x: margin, y: margin, width: w, height: h },
        { x: margin + w + gutter, y: margin, width: w, height: h },
        { x: margin, y: margin + h + gutter, width: w, height: h },
        { x: margin + w + gutter, y: margin + h + gutter, width: w, height: h }
      ];
    }
    case 'cinematic-3': {
      // 3 horizontal widescreen banners
      const h = (innerH - gutter * 2) / 3;
      return [
        { x: margin, y: margin, width: innerW, height: h },
        { x: margin, y: margin + h + gutter, width: innerW, height: h },
        { x: margin, y: margin + (h + gutter) * 2, width: innerW, height: h }
      ];
    }
    case 'action-5': {
      // 1 top banner + 3 middle panels + 1 bottom banner
      const topH = innerH * 0.32;
      const midH = innerH * 0.32;
      const botH = innerH - topH - midH - gutter * 2;
      const midW = (innerW - gutter * 2) / 3;

      return [
        { x: margin, y: margin, width: innerW, height: topH },
        { x: margin, y: margin + topH + gutter, width: midW, height: midH },
        { x: margin + midW + gutter, y: margin + topH + gutter, width: midW, height: midH },
        { x: margin + (midW + gutter) * 2, y: margin + topH + gutter, width: midW, height: midH },
        { x: margin, y: margin + topH + midH + gutter * 2, width: innerW, height: botH }
      ];
    }
    case 'manga-6': {
      // 2 columns x 3 rows
      const w = (innerW - gutter) / 2;
      const h = (innerH - gutter * 2) / 3;
      return [
        { x: margin, y: margin, width: w, height: h },
        { x: margin + w + gutter, y: margin, width: w, height: h },
        { x: margin, y: margin + h + gutter, width: w, height: h },
        { x: margin + w + gutter, y: margin + h + gutter, width: w, height: h },
        { x: margin, y: margin + (h + gutter) * 2, width: w, height: h },
        { x: margin + w + gutter, y: margin + (h + gutter) * 2, width: w, height: h }
      ];
    }
    case 'hero-split-2': {
      // 2 vertical columns
      const w = (innerW - gutter) / 2;
      return [
        { x: margin, y: margin, width: w, height: innerH },
        { x: margin + w + gutter, y: margin, width: w, height: innerH }
      ];
    }
    case 'splash-1':
    default: {
      return [{ x: margin, y: margin, width: innerW, height: innerH }];
    }
  }
}

/**
 * Main function: Renders a full comic page with panels, images, gutters, and speech bubbles to a canvas
 */
export async function renderComicPageToCanvas(
  canvas: HTMLCanvasElement,
  page: ComicPage,
  scale: number = 1,
  signal?: AbortSignal
): Promise<void> {
  const baseWidth = 1200;
  const baseHeight = 1700;
  const width = baseWidth * scale;
  const height = baseHeight * scale;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const layout = page.layout_config || {
    layout_type: 'grid-4',
    border_style: 'ink-gutter',
    gutter_width: 14,
    font_family: 'Bangers',
    bg_color: '#ffffff',
    border_color: '#000000',
    show_page_number: true,
    dpi: 150
  };

  const margin = 28 * scale;
  const gutter = (layout.gutter_width || 14) * scale;

  // 1. Page Background
  ctx.fillStyle = layout.border_style === 'neon-glow' ? '#0b0914' : (layout.bg_color || '#ffffff');
  ctx.fillRect(0, 0, width, height);

  // 2. Calculate Panel Geometry
  const rects = calculatePanelRects(layout.layout_type, width, height, gutter, margin, page.panels.length);

  // 3. Render Each Panel Image & Border
  for (let i = 0; i < rects.length; i++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const rect = rects[i];
    const panel = page.panels[i];

    ctx.save();
    // Clip to panel bounds
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.clip();

    if (panel && panel.image_url) {
      try {
        const img = await loadImage(panel.image_url);
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        // Draw image cover-fitted into panel rect
        drawImageCover(ctx, img, rect.x, rect.y, rect.width, rect.height);
      } catch (err) {
        console.warn('Failed to load image for panel:', err);
        drawPanelPlaceholder(ctx, rect, i + 1, panel.scene_description);
      }
    } else {
      drawPanelPlaceholder(ctx, rect, i + 1, panel ? panel.scene_description : 'No panel content');
    }
    ctx.restore();

    // Draw Panel Border based on style
    drawPanelBorder(ctx, rect, layout.border_style, scale);

    // Draw Panel Caption if present
    if (panel && panel.caption) {
      drawCaptionBox(ctx, rect, panel.caption, layout.font_family, scale);
    }

    // Draw Dialogue & Speech Bubbles for this panel
    if (panel && panel.dialogue && panel.dialogue.length > 0) {
      panel.dialogue.forEach((item, dIdx) => {
        drawSpeechBubble(ctx, rect, item, dIdx, panel.dialogue.length, layout.font_family, scale);
      });
    }
  }

  // 4. Page Header & Number
  if (layout.show_page_number) {
    ctx.save();
    ctx.font = `${14 * scale}px ${layout.font_family || 'Outfit'}, sans-serif`;
    ctx.fillStyle = layout.border_style === 'neon-glow' ? '#06b6d4' : '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText(`PAGE ${page.page_index} • ${page.title || 'MD TO COMIC'}`, width / 2, height - 10 * scale);
    ctx.restore();
  }
}

/**
 * Draws an image with CSS object-fit: cover logic
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;

  let sx = 0;
  let sy = 0;
  let sWidth = img.width;
  let sHeight = img.height;

  if (imgRatio > targetRatio) {
    sWidth = img.height * targetRatio;
    sx = (img.width - sWidth) / 2;
  } else {
    sHeight = img.width / targetRatio;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}

/**
 * Placeholder when image is still generating
 */
function drawPanelPlaceholder(
  ctx: CanvasRenderingContext2D,
  rect: PanelRect,
  index: number,
  description?: string
) {
  ctx.fillStyle = '#181528';
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

  ctx.fillStyle = '#94a3b8';
  ctx.font = `bold 24px 'Bangers', cursive, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`PANEL ${index}`, rect.x + rect.width / 2, rect.y + rect.height / 2 - 10);

  if (description) {
    ctx.font = `13px 'Outfit', sans-serif`;
    ctx.fillStyle = '#64748b';
    const words = description.split(' ').slice(0, 8).join(' ') + '...';
    ctx.fillText(words, rect.x + rect.width / 2, rect.y + rect.height / 2 + 18);
  }
}

/**
 * Draws panel frame borders
 */
function drawPanelBorder(
  ctx: CanvasRenderingContext2D,
  rect: PanelRect,
  style: BorderStyle,
  scale: number
) {
  ctx.save();
  if (style === 'ink-gutter') {
    ctx.lineWidth = 4 * scale;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  } else if (style === 'classic-black') {
    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  } else if (style === 'neon-glow') {
    ctx.lineWidth = 3 * scale;
    ctx.strokeStyle = '#8b5cf6';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 12 * scale;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  } else if (style === 'manga-clean') {
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeStyle = '#18181b';
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  } else if (style === 'borderless') {
    // No border drawn
  }
  ctx.restore();
}

/**
 * Draws a narrator caption box at top of panel
 */
function drawCaptionBox(
  ctx: CanvasRenderingContext2D,
  panelRect: PanelRect,
  caption: string,
  fontFamily: string,
  scale: number
) {
  ctx.save();
  const padX = 14 * scale;
  const padY = 8 * scale;
  const fontSize = 14 * scale;

  ctx.font = `bold ${fontSize}px ${fontFamily || 'Comic Neue'}, sans-serif`;
  const textWidth = Math.min(ctx.measureText(caption).width + padX * 2, panelRect.width * 0.9);
  const boxX = panelRect.x + 12 * scale;
  const boxY = panelRect.y + 12 * scale;
  const boxHeight = fontSize + padY * 2;

  // Box Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(boxX + 3 * scale, boxY + 3 * scale, textWidth, boxHeight);

  // Box Fill & Stroke
  ctx.fillStyle = '#fef08a'; // Pale comic yellow
  ctx.fillRect(boxX, boxY, textWidth, boxHeight);

  ctx.lineWidth = 2 * scale;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(boxX, boxY, textWidth, boxHeight);

  // Text
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(caption, boxX + padX, boxY + boxHeight / 2, textWidth - padX * 2);

  ctx.restore();
}

/**
 * Draws an interactive comic speech balloon (speech, shout, thought)
 */
function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  panelRect: PanelRect,
  item: DialogueItem,
  index: number,
  totalDialogue: number,
  fontFamily: string,
  scale: number
) {
  ctx.save();

  // Position calculation (or use custom bubblePos if user dragged)
  let bubbleX: number;
  let bubbleY: number;

  if (item.bubblePos) {
    bubbleX = panelRect.x + item.bubblePos.x * panelRect.width;
    bubbleY = panelRect.y + item.bubblePos.y * panelRect.height;
  } else {
    // Default smart staggering: alternate top-left and top-right / bottom
    const offsetX = index % 2 === 0 ? 0.3 : 0.7;
    const offsetY = 0.28 + (index * 0.22);
    bubbleX = panelRect.x + panelRect.width * offsetX;
    bubbleY = panelRect.y + panelRect.height * Math.min(offsetY, 0.75);
  }

  const fontSize = (item.type === 'shout' ? 17 : 14) * scale;
  ctx.font = `${item.type === 'shout' ? 'bold' : '600'} ${fontSize}px ${fontFamily || 'Comic Neue'}, cursive, sans-serif`;

  // Speaker label & line text
  const displayText = `${item.speaker.toUpperCase()}: ${item.line}`;
  const lines = wrapTextLines(ctx, displayText, Math.min(panelRect.width * 0.55, 260 * scale));

  const padX = 16 * scale;
  const padY = 12 * scale;
  const lineHeight = fontSize * 1.35;
  const bubbleWidth = Math.max(...lines.map(l => ctx.measureText(l).width)) + padX * 2;
  const bubbleHeight = lines.length * lineHeight + padY * 2;

  const left = bubbleX - bubbleWidth / 2;
  const top = bubbleY - bubbleHeight / 2;

  // Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  roundRect(ctx, left + 3 * scale, top + 3 * scale, bubbleWidth, bubbleHeight, 14 * scale);
  ctx.fill();

  // Balloon body
  ctx.fillStyle = item.type === 'shout' ? '#fee2e2' : '#ffffff';
  ctx.strokeStyle = item.type === 'shout' ? '#ef4444' : '#000000';
  ctx.lineWidth = (item.type === 'shout' ? 3 : 2.5) * scale;

  if (item.type === 'shout') {
    drawStarburstBalloon(ctx, left, top, bubbleWidth, bubbleHeight, 8 * scale);
  } else {
    roundRect(ctx, left, top, bubbleWidth, bubbleHeight, 14 * scale);
  }
  ctx.fill();
  ctx.stroke();

  // Tail pointing downward/inward
  if (item.type === 'speech' || item.type === 'shout') {
    ctx.beginPath();
    ctx.moveTo(bubbleX - 10 * scale, top + bubbleHeight - 1);
    ctx.lineTo(bubbleX - 25 * scale, top + bubbleHeight + 16 * scale);
    ctx.lineTo(bubbleX + 6 * scale, top + bubbleHeight - 1);
    ctx.fillStyle = item.type === 'shout' ? '#fee2e2' : '#ffffff';
    ctx.fill();
    ctx.stroke();
  }

  // Draw dialogue text
  ctx.fillStyle = item.type === 'shout' ? '#991b1b' : '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  lines.forEach((line, lIdx) => {
    ctx.fillText(line, bubbleX, top + padY + lIdx * lineHeight);
  });

  ctx.restore();
}

/**
 * Text wrapping helper for canvas
 */
function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawStarburstBalloon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  spikeSize: number
) {
  const points = 16;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points;
    const isSpike = i % 2 === 1;
    const currentRx = isSpike ? rx + spikeSize : rx - 2;
    const currentRy = isSpike ? ry + spikeSize : ry - 2;

    const px = cx + Math.cos(angle) * currentRx;
    const py = cy + Math.sin(angle) * currentRy;

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
