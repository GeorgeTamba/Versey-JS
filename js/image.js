/**
 * Versey — Image Generation Module (ES Module)
 * Canvas-based generator for high-resolution shareable Scripture cards.
 * Supports Story (1080x1920) and Post (1080x1080) with 5 warm aesthetic themes.
 */

export const FORMAT_DIMENSIONS = {
  post: { width: 1080, height: 1080, name: 'Post (1080×1080)' },
  story: { width: 1080, height: 1920, name: 'Story (1080×1920)' }
};

export const THEMES = {
  cream: {
    id: 'cream',
    name: 'Soft Cream',
    bgStart: '#faf7f2',
    bgEnd: '#f2eae0',
    textColor: '#29221c',
    mutedColor: '#75685d',
    subtleBorder: '#dfd4c5',
    pillBg: 'rgba(215, 202, 187, 0.4)',
    pillText: '#4f443b',
    decorLine: '#cfc0ad'
  },
  sand: {
    id: 'sand',
    name: 'Warm Sand',
    bgStart: '#f3ece3',
    bgEnd: '#e3d7c7',
    textColor: '#2c241e',
    mutedColor: '#716254',
    subtleBorder: '#cfbfae',
    pillBg: 'rgba(197, 180, 161, 0.4)',
    pillText: '#4a3d31',
    decorLine: '#beab98'
  },
  charcoal: {
    id: 'charcoal',
    name: 'Charcoal Dark',
    bgStart: '#252321',
    bgEnd: '#151413',
    textColor: '#f5f0e8',
    mutedColor: '#aba093',
    subtleBorder: '#3d3832',
    pillBg: 'rgba(68, 62, 55, 0.7)',
    pillText: '#ded4c8',
    decorLine: '#4f4841'
  },
  sky: {
    id: 'sky',
    name: 'Soft Sky',
    bgStart: '#eff5f9',
    bgEnd: '#dbe7f0',
    textColor: '#1a2730',
    mutedColor: '#5c7180',
    subtleBorder: '#c3d5e2',
    pillBg: 'rgba(188, 208, 222, 0.45)',
    pillText: '#2e4352',
    decorLine: '#b5cad8'
  },
  sage: {
    id: 'sage',
    name: 'Sage Green',
    bgStart: '#eef4ef',
    bgEnd: '#d8e5da',
    textColor: '#1d2920',
    mutedColor: '#5a735e',
    subtleBorder: '#c2d5c5',
    pillBg: 'rgba(187, 207, 190, 0.45)',
    pillText: '#2b3f2f',
    decorLine: '#b3cabb'
  }
};

/**
 * Ensures web fonts are ready before rendering on Canvas.
 */
async function ensureFontsLoaded() {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font loading check completed with warnings', e);
    }
  }
}

/**
 * Word wraps text into lines that fit within a maximum width.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} text 
 * @param {number} maxWidth 
 * @returns {string[]}
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
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

/**
 * Draws a rounded rectangle helper.
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
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

/**
 * Renders the verse onto the target canvas.
 * @param {HTMLCanvasElement} canvas 
 * @param {Object} verse { text, reference, category }
 * @param {string} format 'post' | 'story'
 * @param {string} themeId 'cream' | 'sand' | 'charcoal' | 'sky' | 'sage'
 */
export async function renderVerseToCanvas(canvas, verse, format = 'post', themeId = 'cream') {
  await ensureFontsLoaded();

  const dimensions = FORMAT_DIMENSIONS[format] || FORMAT_DIMENSIONS.post;
  const theme = THEMES[themeId] || THEMES.cream;

  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // 1. Draw Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, theme.bgStart);
  bgGrad.addColorStop(1, theme.bgEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Decorative outer border / inner frame
  const inset = 44;
  ctx.strokeStyle = theme.subtleBorder;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, inset, inset, w - inset * 2, h - inset * 2, 28);
  ctx.stroke();

  // 3. Layout Bounds calculation
  // Instagram Story safe zone: keep away from top and bottom 250px
  const topSafe = format === 'story' ? 260 : 120;
  const bottomSafe = format === 'story' ? 260 : 110;
  const contentHeight = h - topSafe - bottomSafe;
  const maxContentWidth = w - 240; // generous side padding

  // 4. Draw Header: Category pill badge
  const categoryText = (verse.category || 'SCRIPTURE').toUpperCase();
  ctx.font = '600 24px "Inter", sans-serif';
  const categoryWidth = ctx.measureText(categoryText).width;
  const pillPaddingH = 28;
  const pillHeight = 44;
  const pillWidth = categoryWidth + pillPaddingH * 2;
  const pillX = (w - pillWidth) / 2;
  const pillY = topSafe;

  ctx.fillStyle = theme.pillBg;
  drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, 22);
  ctx.fill();

  ctx.fillStyle = theme.pillText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(categoryText, w / 2, pillY + pillHeight / 2);

  // 5. Dynamic Verse Typography: Auto-size text to fit comfortably
  const fullVerseText = `“${verse.text.trim()}”`;
  let fontSize = format === 'story' ? 62 : 56;
  const minFontSize = 32;
  let lineHeight = fontSize * 1.48;
  let lines = [];
  const maxAvailableTextHeight = contentHeight - 240; // room for category & reference

  while (fontSize >= minFontSize) {
    ctx.font = `400 ${fontSize}px "Crimson Text", Garamond, serif`;
    lineHeight = Math.round(fontSize * 1.46);
    lines = wrapText(ctx, fullVerseText, maxContentWidth);
    const totalTextHeight = lines.length * lineHeight;

    if (totalTextHeight <= maxAvailableTextHeight) {
      break;
    }
    fontSize -= 2;
  }

  // Calculate vertical center of the verse block
  const totalVerseHeight = lines.length * lineHeight;
  // Position block centered in available content area
  const contentStartY = pillY + pillHeight + 50;
  const contentCenterY = contentStartY + (contentHeight - (pillHeight + 80)) / 2;
  const verseStartY = contentCenterY - totalVerseHeight / 2 - 20;

  // Draw Verse text lines
  ctx.fillStyle = theme.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 ${fontSize}px "Crimson Text", Garamond, serif`;

  lines.forEach((line, index) => {
    const lineY = verseStartY + index * lineHeight;
    ctx.fillText(line, w / 2, lineY);
  });

  // 6. Draw Reference & KJV Tag
  const lastLineY = verseStartY + (lines.length - 1) * lineHeight;
  const refDividerY = lastLineY + lineHeight * 0.75 + 16;

  // Subtle separator line
  ctx.strokeStyle = theme.decorLine;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 60, refDividerY);
  ctx.lineTo(w / 2 + 60, refDividerY);
  ctx.stroke();

  // Reference Text
  const refY = refDividerY + 44;
  ctx.font = '600 italic 38px "Crimson Text", Garamond, serif';
  ctx.fillStyle = theme.textColor;
  ctx.fillText(verse.reference || 'Scripture', w / 2, refY);

  // Version tag
  ctx.font = '600 20px "Inter", sans-serif';
  ctx.fillStyle = theme.mutedColor;
  ctx.fillText('KING JAMES VERSION', w / 2, refY + 40);

  // 7. Footer: Brand stamp "Versey"
  const footerY = h - (format === 'story' ? 180 : 70);
  ctx.font = '700 22px "Inter", sans-serif';
  ctx.fillStyle = theme.mutedColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Versey • verse of the day', w / 2, footerY);

  return canvas;
}

/**
 * Generates a PNG Blob from a canvas with a verse rendered.
 * @param {HTMLCanvasElement} canvas 
 * @param {Object} verse 
 * @param {string} format 
 * @param {string} themeId 
 * @returns {Promise<Blob>}
 */
export async function generateVerseBlob(canvas, verse, format = 'post', themeId = 'cream') {
  await renderVerseToCanvas(canvas, verse, format, themeId);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas toBlob failed'));
      }
    }, 'image/png', 0.95);
  });
}

/**
 * Generates a File object suitable for Web Share API Level 2.
 * @param {HTMLCanvasElement} canvas 
 * @param {Object} verse 
 * @param {string} format 
 * @param {string} themeId 
 * @returns {Promise<File>}
 */
export async function generateVerseFile(canvas, verse, format = 'post', themeId = 'cream') {
  const blob = await generateVerseBlob(canvas, verse, format, themeId);
  const cleanRef = (verse.reference || 'verse').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const filename = `versey-${cleanRef}-${format}.png`;
  return new File([blob], filename, { type: 'image/png' });
}
