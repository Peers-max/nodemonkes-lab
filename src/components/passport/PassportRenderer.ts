// High-Precision 4K Ultra-HD WYSIWYG Canvas Rendering Engine for NodeMonkes Web3 Passport
import QRCode from 'qrcode';
import type { Monke } from '../../types';
import type { CardTheme, CardLayoutState } from './PassportStudio';

export interface RenderCardOptions {
  monke: Monke;
  cardTheme: CardTheme;
  cardTitle: string;
  ownerHandle: string;
  showVerified: boolean;
  customTitle: string;
  customMotto: string;
  avatarScale: number;
  sheenIntensity: number;
  avatarSrc: string;
  traits: { Body: string; Head: string; Eyes: string; Earring: string; Count: number };
  tierLabel: string;
  layout: CardLayoutState;
}

// Draw smooth rounded rectangle
export const drawRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

// Draw Verified Blue Badge
export const drawVerifiedBadge = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) => {
  ctx.save();
  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = size * 0.16;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + size * 0.28, y + size * 0.52);
  ctx.lineTo(x + size * 0.44, y + size * 0.68);
  ctx.lineTo(x + size * 0.72, y + size * 0.34);
  ctx.stroke();
  ctx.restore();
};

// Draw 24K Gold EMV Microchip
export const drawGoldEmvChip = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  ctx.save();
  drawRoundRect(ctx, x, y, w, h, 14);
  const chipGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  chipGrad.addColorStop(0, '#FFFBEB');
  chipGrad.addColorStop(0.25, '#F59E0B');
  chipGrad.addColorStop(0.5, '#D97706');
  chipGrad.addColorStop(0.8, '#FCD34D');
  chipGrad.addColorStop(1, '#92400E');
  ctx.fillStyle = chipGrad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(120, 53, 15, 0.8)';
  ctx.lineWidth = 3;
  
  ctx.beginPath();
  ctx.moveTo(x + 6, y + h / 2);
  ctx.lineTo(x + w - 6, y + h / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.35, y + 6);
  ctx.lineTo(x + w * 0.35, y + h - 6);
  ctx.moveTo(x + w * 0.65, y + 6);
  ctx.lineTo(x + w * 0.65, y + h - 6);
  ctx.stroke();

  drawRoundRect(ctx, x + w * 0.38, y + h * 0.28, w * 0.24, h * 0.44, 6);
  ctx.fillStyle = 'rgba(251, 191, 36, 0.95)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(146, 64, 14, 0.85)';
  ctx.stroke();
  ctx.restore();
};

// Main 2D Ultra-HD 4K Card Renderer (WYSIWYG 100% Proportional Percentage Coordinates)
export const renderPassportToCanvas = async (
  canvas: HTMLCanvasElement,
  opt: RenderCardOptions
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = 2400;
  const h = 1519; // Standard 1.58 : 1 ratio
  canvas.width = w;
  canvas.height = h;

  const cardX = 16;
  const cardY = 16;
  const cardW = w - 32;
  const cardH = h - 32;
  const outerRadius = 80;
  const innerRadius = 66;
  const borderWidth = 18;

  // 1. Outer Metallic Border
  const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  if (opt.cardTheme === 'gold') {
    borderGrad.addColorStop(0, '#FEF08A');
    borderGrad.addColorStop(0.3, '#F59E0B');
    borderGrad.addColorStop(0.6, '#FFFBEB');
    borderGrad.addColorStop(1, '#D97706');
  } else if (opt.cardTheme === 'cyber') {
    borderGrad.addColorStop(0, '#E879F9');
    borderGrad.addColorStop(0.4, '#38BDF8');
    borderGrad.addColorStop(1, '#F43F5E');
  } else if (opt.cardTheme === 'matrix') {
    borderGrad.addColorStop(0, '#6EE7B7');
    borderGrad.addColorStop(0.4, '#10B981');
    borderGrad.addColorStop(1, '#34D399');
  } else if (opt.cardTheme === 'sunset') {
    borderGrad.addColorStop(0, '#FDA4AF');
    borderGrad.addColorStop(0.4, '#FB923C');
    borderGrad.addColorStop(1, '#818CF8');
  } else if (opt.cardTheme === 'ruby') {
    borderGrad.addColorStop(0, '#FDA4AF');
    borderGrad.addColorStop(0.4, '#E11D48');
    borderGrad.addColorStop(1, '#FBBF24');
  } else {
    // Obsidian Gold
    borderGrad.addColorStop(0, '#FDE68A');
    borderGrad.addColorStop(0.3, '#D97706');
    borderGrad.addColorStop(0.7, '#FFFBEB');
    borderGrad.addColorStop(1, '#B45309');
  }

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, outerRadius);
  ctx.fillStyle = borderGrad;
  ctx.fill();
  ctx.restore();

  // 2. Inner Card Surface
  const innerX = cardX + borderWidth;
  const innerY = cardY + borderWidth;
  const innerW = cardW - borderWidth * 2;
  const innerH = cardH - borderWidth * 2;

  const innerGrad = ctx.createLinearGradient(innerX, innerY, innerX + innerW, innerY + innerH);
  if (opt.cardTheme === 'gold') {
    innerGrad.addColorStop(0, '#1A1202');
    innerGrad.addColorStop(0.5, '#2D1D04');
    innerGrad.addColorStop(1, '#100A02');
  } else if (opt.cardTheme === 'cyber') {
    innerGrad.addColorStop(0, '#0E0624');
    innerGrad.addColorStop(0.5, '#1B0A3D');
    innerGrad.addColorStop(1, '#070214');
  } else if (opt.cardTheme === 'matrix') {
    innerGrad.addColorStop(0, '#02180C');
    innerGrad.addColorStop(0.5, '#042815');
    innerGrad.addColorStop(1, '#010E07');
  } else if (opt.cardTheme === 'sunset') {
    innerGrad.addColorStop(0, '#1A081E');
    innerGrad.addColorStop(0.5, '#2F0D29');
    innerGrad.addColorStop(1, '#110314');
  } else if (opt.cardTheme === 'ruby') {
    innerGrad.addColorStop(0, '#1A0404');
    innerGrad.addColorStop(0.5, '#330808');
    innerGrad.addColorStop(1, '#100202');
  } else {
    // Obsidian
    innerGrad.addColorStop(0, '#0C0A09');
    innerGrad.addColorStop(0.5, '#1C1917');
    innerGrad.addColorStop(1, '#0A0A0A');
  }

  ctx.save();
  drawRoundRect(ctx, innerX, innerY, innerW, innerH, innerRadius);
  ctx.fillStyle = innerGrad;
  ctx.fill();
  ctx.clip(); // Clip inside card

  // 3. Holographic Sheen Layer
  if (opt.sheenIntensity > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const flareCenterX = innerX + innerW * 0.45;
    const flareCenterY = innerY + innerH * 0.5;
    const flareRadius = innerW * 0.65;
    const holoGrad = ctx.createRadialGradient(flareCenterX, flareCenterY, 0, flareCenterX, flareCenterY, flareRadius);
    const alpha = (opt.sheenIntensity / 100) * 0.75;
    
    holoGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
    holoGrad.addColorStop(0.2, `rgba(236, 72, 153, ${alpha * 0.55})`);
    holoGrad.addColorStop(0.42, `rgba(168, 85, 247, ${alpha * 0.45})`);
    holoGrad.addColorStop(0.65, `rgba(59, 130, 246, ${alpha * 0.35})`);
    holoGrad.addColorStop(0.85, `rgba(34, 211, 238, ${alpha * 0.2})`);
    holoGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = holoGrad;
    ctx.fillRect(innerX, innerY, innerW, innerH);
    ctx.restore();
  }

  const { layout } = opt;

  // 4. Header Divider Line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(innerX + innerW * 0.04, innerY + innerH * 0.14);
  ctx.lineTo(innerX + innerW * 0.96, innerY + innerH * 0.14);
  ctx.stroke();

  // 5. Header Component (Positioned by layout.header)
  const headerX = innerX + (layout.header.x / 100) * innerW;
  const headerY = innerY + (layout.header.y / 100) * innerH;
  const headerScale = (layout.header.scale || 100) / 100;

  // Header Icon Box
  const hIconSize = 88 * headerScale;
  drawRoundRect(ctx, headerX, headerY, hIconSize, hIconSize, 22 * headerScale);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
  ctx.lineWidth = 3.5 * headerScale;
  ctx.stroke();

  ctx.fillStyle = '#FBBF24';
  ctx.font = `bold ${Math.round(48 * headerScale)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡', headerX + hIconSize / 2, headerY + hIconSize / 2 + 2);

  // Header Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(56 * headerScale)}px "Space Mono", ui-monospace, monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(opt.cardTitle.toUpperCase(), headerX + hIconSize + 24 * headerScale, headerY + hIconSize / 2);

  // 6. Badges Component (Rank & Tier, Positioned by layout.badges)
  const badgesX = innerX + (layout.badges.x / 100) * innerW;
  const badgesY = innerY + (layout.badges.y / 100) * innerH;
  const badgesScale = (layout.badges.scale || 100) / 100;

  const rankBadgeW = 270 * badgesScale;
  const rankBadgeH = 76 * badgesScale;
  const tierBadgeW = 250 * badgesScale;
  const tierBadgeH = 76 * badgesScale;

  // Rank Badge
  drawRoundRect(ctx, badgesX, badgesY, rankBadgeW, rankBadgeH, 18 * badgesScale);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.lineWidth = 3 * badgesScale;
  ctx.stroke();

  ctx.fillStyle = '#FDE68A';
  ctx.font = `bold ${Math.round(34 * badgesScale)}px "Space Mono", ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Rank #${opt.monke.rank || 'N/A'}`, badgesX + rankBadgeW / 2, badgesY + rankBadgeH / 2 + 2);

  // Tier Badge
  const tierX = badgesX + rankBadgeW + 20 * badgesScale;
  drawRoundRect(ctx, tierX, badgesY, tierBadgeW, tierBadgeH, 38 * badgesScale);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
  ctx.fill();
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 3.5 * badgesScale;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${Math.round(32 * badgesScale)}px "Space Mono", ui-monospace, monospace`;
  ctx.fillText(opt.tierLabel, tierX + tierBadgeW / 2, badgesY + tierBadgeH / 2 + 2);

  // 7. Avatar Box (Positioned by layout.avatar)
  const avatarX = innerX + (layout.avatar.x / 100) * innerW;
  const avatarY = innerY + (layout.avatar.y / 100) * innerH;
  const avatarScaleFactor = (layout.avatar.scale || 100) / 100;
  const avatarBoxSize = Math.round(680 * avatarScaleFactor);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 45;
  ctx.shadowOffsetY = 22;
  drawRoundRect(ctx, avatarX, avatarY, avatarBoxSize, avatarBoxSize, 56 * avatarScaleFactor);
  ctx.fillStyle = '#05070A';
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 4.5;
  drawRoundRect(ctx, avatarX, avatarY, avatarBoxSize, avatarBoxSize, 56 * avatarScaleFactor);
  ctx.stroke();

  // Load and Draw Avatar Image Crisp
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = opt.avatarSrc;
  await new Promise((res) => {
    img.onload = res;
    img.onerror = res;
  });

  ctx.save();
  drawRoundRect(ctx, avatarX + 22, avatarY + 22, avatarBoxSize - 44, avatarBoxSize - 44, 46 * avatarScaleFactor);
  ctx.clip();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, avatarX + 38, avatarY + 38, avatarBoxSize - 76, avatarBoxSize - 76);
  ctx.restore();

  // Avatar #ID Tag
  const tagW = 150 * avatarScaleFactor;
  const tagH = 54 * avatarScaleFactor;
  drawRoundRect(ctx, avatarX + 24 * avatarScaleFactor, avatarY + 24 * avatarScaleFactor, tagW, tagH, 14 * avatarScaleFactor);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(26 * avatarScaleFactor)}px "Space Mono", ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`#${opt.monke.id}`, avatarX + 24 * avatarScaleFactor + tagW / 2, avatarY + 24 * avatarScaleFactor + tagH / 2 + 1);

  // 8. 24K Gold Chip (Positioned by layout.chip)
  if (layout.chip?.visible !== false) {
    const chipX = innerX + (layout.chip.x / 100) * innerW;
    const chipY = innerY + (layout.chip.y / 100) * innerH;
    const chipScale = (layout.chip.scale || 100) / 100;
    drawGoldEmvChip(ctx, chipX, chipY, 150 * chipScale, 100 * chipScale);
  }

  // 9. GENESIS 10K Tag (Positioned by layout.genesisTag)
  if (layout.genesisTag?.visible !== false) {
    const genX = innerX + (layout.genesisTag.x / 100) * innerW;
    const genY = innerY + (layout.genesisTag.y / 100) * innerH;
    const genScale = (layout.genesisTag.scale || 100) / 100;
    const genW = 230 * genScale;
    const genH = 58 * genScale;

    drawRoundRect(ctx, genX, genY, genW, genH, 14 * genScale);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.lineWidth = 2.5 * genScale;
    ctx.stroke();

    ctx.fillStyle = '#FDE68A';
    ctx.font = `bold ${Math.round(24 * genScale)}px "Space Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GENESIS 10K', genX + genW / 2, genY + genH / 2 + 1);
  }

  // 10. Owner Handle (Positioned by layout.ownerHandle)
  const handleX = innerX + (layout.ownerHandle.x / 100) * innerW;
  const handleY = innerY + (layout.ownerHandle.y / 100) * innerH;
  const handleScale = (layout.ownerHandle.scale || 100) / 100;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${Math.round(76 * handleScale)}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(opt.ownerHandle, handleX, handleY);

  if (opt.showVerified) {
    const handleTextWidth = ctx.measureText(opt.ownerHandle).width;
    drawVerifiedBadge(ctx, handleX + handleTextWidth + 24 * handleScale, handleY + 10 * handleScale, 56 * handleScale);
  }

  // 11. Badge Title Pill (Positioned by layout.badgePill)
  const pillX = innerX + (layout.badgePill.x / 100) * innerW;
  const pillY = innerY + (layout.badgePill.y / 100) * innerH;
  const pillScale = (layout.badgePill.scale || 100) / 100;

  ctx.font = `bold ${Math.round(32 * pillScale)}px "Space Mono", ui-monospace, monospace`;
  const titleText = opt.customTitle.toUpperCase();
  const titleBoxW = ctx.measureText(titleText).width + 52 * pillScale;
  const titleBoxH = 68 * pillScale;

  drawRoundRect(ctx, pillX, pillY, titleBoxW, titleBoxH, 16 * pillScale);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
  ctx.lineWidth = 3 * pillScale;
  ctx.stroke();

  ctx.fillStyle = '#FDE68A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(titleText, pillX + titleBoxW / 2, pillY + titleBoxH / 2 + 1);

  // 12. Attributes Rows (Positioned by layout.attributes)
  const attrX = innerX + (layout.attributes.x / 100) * innerW;
  let attrY = innerY + (layout.attributes.y / 100) * innerH;
  const attrScale = (layout.attributes.scale || 100) / 100;
  const metaLineH = 68 * attrScale;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Inscription
  ctx.font = `${Math.round(38 * attrScale)}px "Space Mono", ui-monospace, monospace`;
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('Inscription: ', attrX, attrY);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(39 * attrScale)}px "Space Mono", ui-monospace, monospace`;
  ctx.fillText(`#${opt.monke.inscription}`, attrX + ctx.measureText('Inscription: ').width + 12, attrY);

  // Block Height
  attrY += metaLineH;
  ctx.font = `${Math.round(38 * attrScale)}px "Space Mono", ui-monospace, monospace`;
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('Block Height: ', attrX, attrY);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(39 * attrScale)}px "Space Mono", ui-monospace, monospace`;
  ctx.fillText(`#${opt.monke.block}`, attrX + ctx.measureText('Block Height: ').width + 12, attrY);

  // Traits
  attrY += metaLineH;
  ctx.font = `${Math.round(38 * attrScale)}px "Space Mono", ui-monospace, monospace`;
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('Traits: ', attrX, attrY);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(39 * attrScale)}px "Space Mono", ui-monospace, monospace`;
  ctx.fillText(`${opt.traits.Count || 4} Parts`, attrX + ctx.measureText('Traits: ').width + 12, attrY);

  // 13. High-Precision On-Chain Ordinals QR Code (Positioned by layout.qrCode)
  if (layout.qrCode?.visible !== false) {
    const qrX = innerX + (layout.qrCode.x / 100) * innerW;
    const qrY = innerY + (layout.qrCode.y / 100) * innerH;
    const qrScale = (layout.qrCode.scale || 100) / 100;
    const qrBoxSize = Math.round(280 * qrScale);

    // QR Badge Container
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;
    drawRoundRect(ctx, qrX, qrY, qrBoxSize, qrBoxSize + 48 * qrScale, 28 * qrScale);
    ctx.fillStyle = 'rgba(10, 12, 18, 0.88)';
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 3 * qrScale;
    drawRoundRect(ctx, qrX, qrY, qrBoxSize, qrBoxSize + 48 * qrScale, 28 * qrScale);
    ctx.stroke();

    // Generate Inscription QR Code Image
    const qrUrl = `https://ordinals.com/inscription/${opt.monke.inscription}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        margin: 1,
        color: {
          dark: '#FFFFFF',
          light: '#00000000'
        },
        errorCorrectionLevel: 'M'
      });

      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise((res) => {
        qrImg.onload = res;
        qrImg.onerror = res;
      });

      const qrPadding = 20 * qrScale;
      ctx.drawImage(qrImg, qrX + qrPadding, qrY + qrPadding, qrBoxSize - qrPadding * 2, qrBoxSize - qrPadding * 2);
    } catch (e) {
      console.warn('QR rendering on Canvas:', e);
    }

    // QR Bottom Label
    ctx.fillStyle = '#FDE68A';
    ctx.font = `bold ${Math.round(20 * qrScale)}px "Space Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCAN TO VERIFY', qrX + qrBoxSize / 2, qrY + qrBoxSize + 22 * qrScale);
  }

  // 14. Footer Divider Line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(innerX + innerW * 0.04, innerY + innerH * 0.88);
  ctx.lineTo(innerX + innerW * 0.96, innerY + innerH * 0.88);
  ctx.stroke();

  // 15. Footer Motto (Positioned by layout.footerMotto)
  const mottoX = innerX + (layout.footerMotto.x / 100) * innerW;
  const mottoY = innerY + (layout.footerMotto.y / 100) * innerH;
  const mottoScale = (layout.footerMotto.scale || 100) / 100;

  ctx.fillStyle = '#94A3B8';
  ctx.font = `italic ${Math.round(36 * mottoScale)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`"${opt.customMotto}"`, mottoX, mottoY);

  // 16. Footer Verified Stamp (Positioned by layout.footerVerified)
  const verX = innerX + (layout.footerVerified.x / 100) * innerW;
  const verY = innerY + (layout.footerVerified.y / 100) * innerH;
  const verScale = (layout.footerVerified.scale || 100) / 100;

  ctx.fillStyle = '#FBBF24';
  ctx.font = `bold ${Math.round(34 * verScale)}px "Space Mono", ui-monospace, monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ORDINALS VERIFIED ⚡', verX, verY);

  ctx.restore();
};

// Mode B: 3D Hologram Perspective Poster Canvas Renderer (2400 × 1519)
export const render3DPerspectivePoster = async (
  canvas: HTMLCanvasElement,
  opt: RenderCardOptions,
  rotX: number,
  rotY: number
) => {
  const cardCanvas = document.createElement('canvas');
  await renderPassportToCanvas(cardCanvas, opt);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = 2400;
  const h = 1519;
  canvas.width = w;
  canvas.height = h;

  // Studio Dark Background
  const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, w * 0.7);
  bgGrad.addColorStop(0, '#0F172A');
  bgGrad.addColorStop(0.5, '#070C18');
  bgGrad.addColorStop(1, '#020408');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Ground Ambient Glow
  const glowGrad = ctx.createRadialGradient(w / 2, h * 0.78, 40, w / 2, h * 0.78, 600);
  glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
  glowGrad.addColorStop(0.6, 'rgba(168, 85, 247, 0.12)');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, w, h);

  // Soft Contact Ground Shadow
  ctx.save();
  ctx.translate(w / 2, h * 0.82);
  ctx.scale(1, 0.25);
  ctx.beginPath();
  ctx.arc(0, 0, 750, 0, Math.PI * 2);
  const shadowGrad = ctx.createRadialGradient(0, 0, 100, 0, 0, 750);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
  shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.5)');
  shadowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = shadowGrad;
  ctx.fill();
  ctx.restore();

  // 3D Perspective Card Placement
  ctx.save();
  ctx.translate(w / 2, h / 2 - 30);

  const radX = (rotX || 15) * (Math.PI / 180);
  const radY = (rotY || 28) * (Math.PI / 180);
  
  const scale = 0.62;
  const skewX = Math.sin(radY) * 0.35;
  const scaleY = Math.cos(radX) * 0.92;
  const scaleX = Math.cos(radY) * scale;

  ctx.transform(scaleX, -skewX * 0.5, skewX * 0.4, scaleY * scale, 0, 0);

  // Draw 3D Physical Rim Extrusion
  const thickness = 16;
  for (let t = thickness; t > 0; t--) {
    ctx.drawImage(cardCanvas, -cardCanvas.width / 2 + t * 0.6, -cardCanvas.height / 2 + t * 1.1);
  }

  // Draw Main Front Card
  ctx.drawImage(cardCanvas, -cardCanvas.width / 2, -cardCanvas.height / 2);

  ctx.restore();

  // Top Watermark Header
  ctx.save();
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 24px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NODEMONKES WEB3 HOLOGRAPHIC PASSPORT • 3D COLLECTIBLE EDITION', w / 2, 70);
  ctx.restore();
};
