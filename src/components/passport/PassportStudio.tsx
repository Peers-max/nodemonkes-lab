import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  RotateCw, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  QrCode, 
  Hash, 
  Crown,
  Layers,
  Palette,
  User,
  Quote,
  Share2
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Monke } from '../../types';
import { getMonkeImageUrl } from '../../utils/api';
import { useLanguage } from '../../utils/i18n';
import confetti from 'canvas-confetti';

interface PassportStudioProps {
  initialMonkeId?: number;
  monkes: Monke[];
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

export type CardTheme = 'obsidian' | 'gold' | 'cyber' | 'matrix' | 'sunset';

const THEMES: { id: CardTheme; nameZh: string; nameEn: string; icon: string; border: string; bg: string }[] = [
  { id: 'obsidian', nameZh: '👑 曜石黑金', nameEn: '👑 Obsidian Gold', icon: '👑', border: 'from-amber-400 via-amber-600 to-amber-200', bg: 'bg-gradient-to-br from-[#0c0a09] via-[#1c1917] to-[#0a0a0a]' },
  { id: 'gold', nameZh: '🥇 纯金至尊', nameEn: '🥇 Pure Gold', icon: '🥇', border: 'from-yellow-300 via-amber-500 to-yellow-100', bg: 'bg-gradient-to-br from-[#1e1503] via-[#332205] to-[#120c02]' },
  { id: 'cyber', nameZh: '🟣 赛博全息', nameEn: '🟣 Cyber Holo', icon: '🟣', border: 'from-purple-400 via-cyan-400 to-pink-500', bg: 'bg-gradient-to-br from-[#0f0728] via-[#1a0b3b] to-[#080318]' },
  { id: 'matrix', nameZh: '🟢 矩阵终端', nameEn: '🟢 Matrix Green', icon: '🟢', border: 'from-emerald-400 via-green-500 to-teal-300', bg: 'bg-gradient-to-br from-[#02180c] via-[#042815] to-[#010e07]' },
  { id: 'sunset', nameZh: '🌅 暮光霞光', nameEn: '🌅 Twilight Glow', icon: '🌅', border: 'from-rose-400 via-amber-500 to-indigo-500', bg: 'bg-gradient-to-br from-[#1a081e] via-[#2c0d23] to-[#120417]' },
];

const PRESET_BADGES = [
  'GENESIS COLLECTOR',
  'DIAMOND HANDS',
  'ORDINALS OG',
  'TOP 100 ELITE',
  'CYBER MONKE',
  'HODL FOREVER',
];

export const PassportStudio: React.FC<PassportStudioProps> = ({
  initialMonkeId = 209,
  monkes,
  onToast,
}) => {
  const { lang } = useLanguage();
  const [selectedId, setSelectedId] = useState<number>(initialMonkeId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cardTheme, setCardTheme] = useState<CardTheme>('obsidian');
  const [ownerHandle, setOwnerHandle] = useState<string>('@satoshi_monke');
  const [customTitle, setCustomTitle] = useState<string>('GENESIS COLLECTOR');
  const [customMotto, setCustomMotto] = useState<string>('In Monkes We Trust • Bitcoin Ordinals');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // 3D Perspective Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [sheen, setSheen] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });

  const currentMonke = useMemo(() => {
    return monkes.find((m) => m.id === selectedId) || monkes[0] || {
      id: 209,
      rank: 1,
      inscription: 83985,
      block: 776487,
      attributes: { Body: 'Alien', Head: 'None', Eyes: 'None', Earring: 'None', Count: 1 },
      scriptPubkey: ''
    };
  }, [monkes, selectedId]);

  // Tier Rating
  const tier = useMemo(() => {
    const r = currentMonke.rank || 5000;
    if (r <= 50) return { label: 'SSS TIER', color: 'text-amber-300 bg-amber-500/20 border-amber-400' };
    if (r <= 200) return { label: 'SS TIER', color: 'text-purple-300 bg-purple-500/20 border-purple-400' };
    if (r <= 1000) return { label: 'S TIER', color: 'text-cyan-300 bg-cyan-500/20 border-cyan-400' };
    return { label: 'A TIER', color: 'text-emerald-300 bg-emerald-500/20 border-emerald-400' };
  }, [currentMonke.rank]);

  // Mouse Move Tilt Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -12;
    const rY = ((x - centerX) / centerX) * 12;

    setRotateX(rX);
    setRotateY(rY);
    setSheen({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setSheen((s) => ({ ...s, opacity: 0 }));
  };

  // Helper to draw rounded rectangle
  const drawRoundRect = (
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

  // Helper to draw Twitter/Web3 Verified Badge
  const drawVerifiedBadge = (
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

    // White Checkmark
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

  // 1:1 Pixel-Perfect High-Res 2D Canvas Export
  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 2K Ultra HD Dimensions (Aspect 1.58 : 1)
      const w = 1264;
      const h = 800;
      canvas.width = w;
      canvas.height = h;

      const padding = 16;
      const cardX = padding;
      const cardY = padding;
      const cardW = w - padding * 2;
      const cardH = h - padding * 2;
      const outerRadius = 40;
      const innerRadius = 32;
      const borderWidth = 10;

      // 1. Draw Outer Glowing Metallic Border
      const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
      if (cardTheme === 'gold') {
        borderGrad.addColorStop(0, '#FDE047');
        borderGrad.addColorStop(0.5, '#F59E0B');
        borderGrad.addColorStop(1, '#FEF08A');
      } else if (cardTheme === 'cyber') {
        borderGrad.addColorStop(0, '#C084FC');
        borderGrad.addColorStop(0.5, '#22D3EE');
        borderGrad.addColorStop(1, '#EC4899');
      } else if (cardTheme === 'matrix') {
        borderGrad.addColorStop(0, '#34D399');
        borderGrad.addColorStop(0.5, '#22C55E');
        borderGrad.addColorStop(1, '#5EEAD4');
      } else if (cardTheme === 'sunset') {
        borderGrad.addColorStop(0, '#FB7185');
        borderGrad.addColorStop(0.5, '#F59E0B');
        borderGrad.addColorStop(1, '#6366F1');
      } else {
        // obsidian
        borderGrad.addColorStop(0, '#FBBF24');
        borderGrad.addColorStop(0.5, '#D97706');
        borderGrad.addColorStop(1, '#FDE68A');
      }

      ctx.save();
      drawRoundRect(ctx, cardX, cardY, cardW, cardH, outerRadius);
      ctx.fillStyle = borderGrad;
      ctx.fill();
      ctx.restore();

      // 2. Draw Card Inner Background
      const innerX = cardX + borderWidth;
      const innerY = cardY + borderWidth;
      const innerW = cardW - borderWidth * 2;
      const innerH = cardH - borderWidth * 2;

      const innerGrad = ctx.createLinearGradient(innerX, innerY, innerX + innerW, innerY + innerH);
      if (cardTheme === 'gold') {
        innerGrad.addColorStop(0, '#1E1503');
        innerGrad.addColorStop(0.5, '#332205');
        innerGrad.addColorStop(1, '#120C02');
      } else if (cardTheme === 'cyber') {
        innerGrad.addColorStop(0, '#0F0728');
        innerGrad.addColorStop(0.5, '#1A0B3B');
        innerGrad.addColorStop(1, '#080318');
      } else if (cardTheme === 'matrix') {
        innerGrad.addColorStop(0, '#02180C');
        innerGrad.addColorStop(0.5, '#042815');
        innerGrad.addColorStop(1, '#010E07');
      } else if (cardTheme === 'sunset') {
        innerGrad.addColorStop(0, '#1A081E');
        innerGrad.addColorStop(0.5, '#2C0D23');
        innerGrad.addColorStop(1, '#120417');
      } else {
        // obsidian
        innerGrad.addColorStop(0, '#0C0A09');
        innerGrad.addColorStop(0.5, '#1C1917');
        innerGrad.addColorStop(1, '#0A0A0A');
      }

      ctx.save();
      drawRoundRect(ctx, innerX, innerY, innerW, innerH, innerRadius);
      ctx.fillStyle = innerGrad;
      ctx.fill();
      ctx.clip(); // Clip everything strictly inside inner surface

      if (!isFlipped) {
        // ================= FRONT FACE (1:1 UI MATCH) =================

        // A. Header (Top y: 55 ~ 115)
        const headerY = innerY + 45;

        // Lightning Badge Box
        drawRoundRect(ctx, innerX + 45, headerY, 44, 44, 12);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡', innerX + 67, headerY + 31);

        // Header Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 26px "Space Mono", ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('NODEMONKES PASSPORT', innerX + 104, headerY + 32);

        // Header Right Badges (Tier & Rank)
        const tierBadgeW = 120;
        const tierBadgeH = 34;
        const tierBadgeX = innerX + innerW - 45 - tierBadgeW;
        const tierBadgeY = headerY + 5;

        const rankBadgeW = 125;
        const rankBadgeH = 34;
        const rankBadgeX = tierBadgeX - 12 - rankBadgeW;
        const rankBadgeY = tierBadgeY;

        // Rank Badge
        drawRoundRect(ctx, rankBadgeX, rankBadgeY, rankBadgeW, rankBadgeH, 8);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 15px "Space Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Rank #${currentMonke.rank || 'N/A'}`, rankBadgeX + rankBadgeW / 2, rankBadgeY + 23);

        // Tier Badge
        drawRoundRect(ctx, tierBadgeX, tierBadgeY, tierBadgeW, tierBadgeH, 17);
        if (tier.label.includes('SSS')) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
          ctx.strokeStyle = '#FBBF24';
        } else if (tier.label.includes('SS')) {
          ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
          ctx.strokeStyle = '#C084FC';
        } else if (tier.label.includes('S')) {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
          ctx.strokeStyle = '#22D3EE';
        } else {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.strokeStyle = '#34D399';
        }
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 14px "Space Mono", ui-monospace, monospace';
        ctx.fillText(tier.label, tierBadgeX + tierBadgeW / 2, tierBadgeY + 23);

        // Header Divider Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(innerX + 45, headerY + 62);
        ctx.lineTo(innerX + innerW - 45, headerY + 62);
        ctx.stroke();

        // B. Center Body (Proportional 5:7 Grid Match with CSS layout)
        const bodyTopY = headerY + 62; // 107
        const bodyBottomY = innerY + innerH - 65; // 709
        const bodyH = bodyBottomY - bodyTopY; // 602
        const bodyCenterY = bodyTopY + bodyH / 2; // 408

        // Left Column (5/12 = 41.6% width)
        const leftColW = innerW * 0.416; // ~504px
        const leftColCenterX = innerX + leftColW / 2; // 26 + 252 = 278

        // Avatar Frame Box (340 x 340, centered in left column)
        const avatarBoxSize = 340;
        const avatarX = Math.round(leftColCenterX - avatarBoxSize / 2); // 108
        const avatarY = Math.round(bodyCenterY - avatarBoxSize / 2); // 238

        drawRoundRect(ctx, avatarX, avatarY, avatarBoxSize, avatarBoxSize, 26);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Load & Draw Monke
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = getMonkeImageUrl(currentMonke.id);
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
        });

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, avatarX + 18, avatarY + 18, avatarBoxSize - 36, avatarBoxSize - 36);

        // Avatar Top-Left ID Badge (#209)
        drawRoundRect(ctx, avatarX + 14, avatarY + 14, 72, 26, 6);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px "Space Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`#${currentMonke.id}`, avatarX + 14 + 36, avatarY + 14 + 18);

        // Right Column (7/12 width) - Identity Content
        const rightColX = innerX + leftColW + 20; // ~550px
        const rightGroupH = 220;
        const rightStartY = Math.round(bodyCenterY - rightGroupH / 2); // ~298

        // 1. Owner Handle & Verified Badge
        let curInfoY = rightStartY + 30;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 36px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(ownerHandle, rightColX, curInfoY);

        const handleTextWidth = ctx.measureText(ownerHandle).width;
        drawVerifiedBadge(ctx, rightColX + handleTextWidth + 12, curInfoY - 26, 28);

        // 2. Title Badge Pill
        curInfoY += 24;
        ctx.font = 'bold 13px "Space Mono", ui-monospace, monospace';
        const titleText = customTitle.toUpperCase();
        const titleTextW = ctx.measureText(titleText).width;
        const titleBoxW = titleTextW + 24;
        const titleBoxH = 28;

        drawRoundRect(ctx, rightColX, curInfoY, titleBoxW, titleBoxH, 6);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#FDE68A';
        ctx.textAlign = 'center';
        ctx.fillText(titleText, rightColX + titleBoxW / 2, curInfoY + 19);

        // 3. Info Metadata Rows (Clean, aligned)
        curInfoY += 56;
        const rowLineH = 34;

        // Inscription Row
        ctx.textAlign = 'left';
        ctx.font = '19px "Space Mono", ui-monospace, monospace';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('Inscription: ', rightColX, curInfoY);
        const inscLabelW = ctx.measureText('Inscription: ').width;
        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 19px "Space Mono", ui-monospace, monospace';
        ctx.fillText(`#${currentMonke.inscription}`, rightColX + inscLabelW, curInfoY);

        // Block Height Row
        curInfoY += rowLineH;
        ctx.font = '19px "Space Mono", ui-monospace, monospace';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('Block Height: ', rightColX, curInfoY);
        const blockLabelW = ctx.measureText('Block Height: ').width;
        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 19px "Space Mono", ui-monospace, monospace';
        ctx.fillText(`#${currentMonke.block}`, rightColX + blockLabelW, curInfoY);

        // Traits Count Row
        curInfoY += rowLineH;
        ctx.font = '19px "Space Mono", ui-monospace, monospace';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('Traits: ', rightColX, curInfoY);
        const traitsLabelW = ctx.measureText('Traits: ').width;
        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 19px "Space Mono", ui-monospace, monospace';
        ctx.fillText(`${currentMonke.attributes.Count || 4} Parts`, rightColX + traitsLabelW, curInfoY);

        // C. Footer (Bottom)
        const footerDividerY = innerY + innerH - 65;
        const footerTextY = footerDividerY + 38;

        // Footer Divider Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(innerX + 45, footerDividerY);
        ctx.lineTo(innerX + innerW - 45, footerDividerY);
        ctx.stroke();

        // Footer Motto
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'italic 17px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`"${customMotto}"`, innerX + 45, footerTextY);

        // Footer Verified Tag
        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 16px "Space Mono", ui-monospace, monospace';
        ctx.textAlign = 'right';
        ctx.fillText('ORDINALS VERIFIED', innerX + innerW - 45, footerTextY);

      } else {
        // ================= BACK FACE (1:1 UI MATCH) =================
        const headerY = innerY + 45;

        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 24px "Space Mono", ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('AUTHENTICATED ORDINALS INSCRIPTION', innerX + 45, headerY + 30);

        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 18px "Space Mono", ui-monospace, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`SHA256: ${currentMonke.id.toString(16).padStart(8, '0')}...`, innerX + innerW - 45, headerY + 30);

        // Divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(innerX + 45, headerY + 55);
        ctx.lineTo(innerX + innerW - 45, headerY + 55);
        ctx.stroke();

        // 4 Trait Cards
        const traitsY = headerY + 95;
        const traitW = 680;
        const traitH = 70;
        const gap = 20;

        const traitList = [
          { label: 'Body', val: currentMonke.attributes.Body },
          { label: 'Head', val: currentMonke.attributes.Head },
          { label: 'Eyes', val: currentMonke.attributes.Eyes },
          { label: 'Earring', val: currentMonke.attributes.Earring },
        ];

        traitList.forEach((tr, i) => {
          const tY = traitsY + i * (traitH + gap);
          drawRoundRect(ctx, innerX + 50, tY, traitW, traitH, 16);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#94A3B8';
          ctx.font = '22px "Space Mono", ui-monospace, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${tr.label}:`, innerX + 75, tY + 44);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 24px "Space Mono", ui-monospace, monospace';
          ctx.textAlign = 'right';
          ctx.fillText(String(tr.val), innerX + 50 + traitW - 25, tY + 44);
        });

        // QR Code Box (Right)
        const qrBoxX = innerX + 780;
        const qrBoxY = traitsY + 30;
        const qrBoxSize = 280;

        drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 90px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⛶', qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize / 2 + 30);

        ctx.fillStyle = '#94A3B8';
        ctx.font = '18px "Space Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Scan Ordinals Inscription', qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 40);

        // Footer
        const footerY = innerY + innerH - 45;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(innerX + 45, footerY - 24);
        ctx.lineTo(innerX + innerW - 45, footerY - 24);
        ctx.stroke();

        ctx.fillStyle = '#64748B';
        ctx.font = 'bold 18px "Space Mono", ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('GENESIS BLOCK #776487', innerX + 45, footerY + 8);

        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 18px "Space Mono", ui-monospace, monospace';
        ctx.textAlign = 'right';
        ctx.fillText('100% ON-CHAIN', innerX + innerW - 45, footerY + 8);
      }

      ctx.restore();

      // Trigger Download
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `NodeMonke_${currentMonke.id}_Passport_${cardTheme}${isFlipped ? '_Back' : ''}.png`;
      link.href = url;
      link.click();

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      onToast('通行证导出成功！', `NodeMonke #${currentMonke.id} 3D 通行证已保存为 1:1 高清卡片`, 'success');
    } catch (e: any) {
      console.error('Export passport error:', e);
      onToast('导出失败', e?.message || '请重试', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [cardTheme, currentMonke, tier, ownerHandle, customTitle, customMotto, isFlipped, onToast]);

  const activeThemeObj = THEMES.find((t) => t.id === cardTheme) || THEMES[0];

  return (
    <div className="min-h-[calc(100vh-140px)] w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-mono text-base font-bold shadow-lg">
              🎴
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              3D Web3 极客通行证 <span className="text-amber-400 text-lg font-sans">Passport Studio</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            为您的 NodeMonke 铸造独一无二的 3D 全息身份卡片，支持实时空间重力感应、正反翻转与 2K 高清 PNG 导出！
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFlipped((f) => !f)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all active:scale-95 shadow-md"
          >
            <RotateCw className="w-4 h-4 text-purple-400" />
            <span>{isFlipped ? '查看正面' : '🔄 翻转背面'}</span>
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-mono font-extrabold text-xs transition-all active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? '正在渲染...' : '💾 导出高清通行证 PNG'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: 3D Stage (Left) & Controls Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 3D Interactive Stage (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-12 rounded-3xl bg-slate-950/70 border border-white/10 backdrop-blur-xl shadow-2xl relative min-h-[560px] overflow-hidden">
          
          {/* Ambient Studio Lighting */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

          {/* 3D Perspective Card Container */}
          <div 
            className="relative perspective-[1200px] w-full max-w-[560px] cursor-grab active:cursor-grabbing select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              ref={cardRef}
              animate={{
                rotateX: rotateX,
                rotateY: rotateY + (isFlipped ? 180 : 0),
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              style={{ transformStyle: 'preserve-3d' }}
              className={clsx(
                'relative w-full aspect-[1.58/1] rounded-3xl p-1 shadow-[0_25px_60px_rgba(0,0,0,0.85)] border transition-shadow duration-300',
                'bg-gradient-to-br',
                activeThemeObj.border
              )}
            >
              {/* Card Inner Surface */}
              <div className="w-full h-full rounded-[22px] relative overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
                
                {/* Dynamic Holographic Rainbow Sheen */}
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-color-dodge transition-opacity duration-300 z-20"
                  style={{
                    background: `radial-gradient(circle at ${sheen.x}% ${sheen.y}%, rgba(255,255,255,0.7) 0%, rgba(236,72,153,0.3) 30%, rgba(59,130,246,0.3) 60%, transparent 80%)`,
                    opacity: sheen.opacity,
                  }}
                />

                {/* FRONT FACE */}
                <div 
                  className={clsx('w-full h-full p-5 sm:p-6 flex flex-col justify-between absolute inset-0', activeThemeObj.bg)}
                  style={{ 
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 text-xs font-bold font-mono">
                        ⚡
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-white font-mono tracking-wider">
                        NODEMONKES PASSPORT
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={clsx('px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border', tier.color)}>
                        {tier.label}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        Rank #{currentMonke.rank || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Card Center Body */}
                  <div className="grid grid-cols-12 gap-4 items-center my-auto">
                    {/* Left: Pixel Art Monke Avatar */}
                    <div className="col-span-5 flex items-center justify-center">
                      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-black/60 border border-white/15 p-2 shadow-2xl relative group overflow-hidden">
                        <img
                          src={getMonkeImageUrl(currentMonke.id)}
                          alt={`NodeMonke #${currentMonke.id}`}
                          className="w-full h-full object-contain pixelated filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                        />
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white font-bold border border-white/10">
                          #{currentMonke.id}
                        </div>
                      </div>
                    </div>

                    {/* Right: Identity Stats */}
                    <div className="col-span-7 flex flex-col gap-1.5 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base sm:text-lg font-black text-white">
                          {ownerHandle}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400/20" />
                      </div>

                      <div className="inline-block">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                          {customTitle}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex flex-col gap-0.5 mt-1">
                        <span>Inscription: <strong className="text-slate-200">#{currentMonke.inscription}</strong></span>
                        <span>Block Height: <strong className="text-slate-200">#{currentMonke.block}</strong></span>
                        <span>Traits: <strong className="text-slate-200">{currentMonke.attributes.Count} Parts</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="truncate max-w-[280px]">"{customMotto}"</span>
                    <span className="text-amber-400 font-bold">ORDINALS VERIFIED</span>
                  </div>
                </div>

                {/* BACK FACE */}
                <div 
                  className={clsx('w-full h-full p-5 sm:p-6 rounded-[22px] flex flex-col justify-between absolute inset-0', activeThemeObj.bg)}
                  style={{ 
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      AUTHENTICATED ORDINALS INSCRIPTION
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      SHA256: {currentMonke.id.toString(16).padStart(8, '0')}...
                    </span>
                  </div>

                  {/* Back Traits Breakdown & QR Code */}
                  <div className="grid grid-cols-12 gap-4 items-center my-auto font-mono">
                    <div className="col-span-8 flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-slate-400">Body:</span>
                        <span className="font-bold text-white">{currentMonke.attributes.Body}</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-slate-400">Head:</span>
                        <span className="font-bold text-white">{currentMonke.attributes.Head}</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-slate-400">Eyes:</span>
                        <span className="font-bold text-white">{currentMonke.attributes.Eyes}</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-slate-400">Earring:</span>
                        <span className="font-bold text-white">{currentMonke.attributes.Earring}</span>
                      </div>
                    </div>

                    {/* QR Code Simulation */}
                    <div className="col-span-4 flex flex-col items-center justify-center gap-1">
                      <div className="w-20 h-20 bg-white p-1.5 rounded-xl flex items-center justify-center shadow-lg">
                        <QrCode className="w-full h-full text-black" />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 text-center">Scan Ordinals</span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>GENESIS BLOCK #776487</span>
                    <span className="text-emerald-400 font-bold">100% ON-CHAIN</span>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>

          <span className="text-[11px] font-mono text-slate-500 mt-6 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>移动鼠标体验 3D 重力感应全息反光 • 点击右上角翻转卡片</span>
          </span>
        </div>

        {/* Right Controls Customizer (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5 p-6 rounded-3xl bg-slate-950/70 border border-white/10 backdrop-blur-xl shadow-2xl">
          
          {/* Pick Monke */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>选择目标猴子 (Select Monke)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={10000}
                value={selectedId}
                onChange={(e) => setSelectedId(parseInt(e.target.value, 10) || 1)}
                className="w-28 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-amber-400 transition-all"
                placeholder="ID (1-10000)"
              />
              <span className="text-xs font-mono text-slate-400">
                当前: NodeMonke #{currentMonke.id} (Rank #{currentMonke.rank || 'N/A'})
              </span>
            </div>
          </div>

          {/* Card Finish Theme */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>卡片材质与全息主题 (Card Material)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => setCardTheme(th.id)}
                  className={clsx(
                    'p-2.5 rounded-xl text-xs font-mono font-bold border transition-all text-left flex items-center gap-1.5 active:scale-95',
                    cardTheme === th.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                  )}
                >
                  <span>{th.icon}</span>
                  <span className="truncate">{th.nameZh.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Owner Handle Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>持有者推特 / 昵称 (Owner Handle)</span>
            </label>
            <input
              type="text"
              value={ownerHandle}
              onChange={(e) => setOwnerHandle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-amber-400 transition-all"
              placeholder="@your_twitter_handle"
            />
          </div>

          {/* Custom Badge Preset Chips */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>个性头衔与身份标识 (Badge Title)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_BADGES.map((b) => (
                <button
                  key={b}
                  onClick={() => setCustomTitle(b)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all active:scale-95',
                    customTitle === b
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400 transition-all mt-1"
              placeholder="自定义头衔..."
            />
          </div>

          {/* Custom Motto Slogan */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-rose-400" />
              <span>个性签名 (Custom Motto)</span>
            </label>
            <input
              type="text"
              value={customMotto}
              onChange={(e) => setCustomMotto(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400 transition-all"
              placeholder="In Monkes We Trust..."
            />
          </div>

        </div>

      </div>

    </div>
  );
};
