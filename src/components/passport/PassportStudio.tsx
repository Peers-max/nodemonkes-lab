import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
  Share2,
  Globe,
  Sliders,
  Maximize2,
  Minimize2,
  Eye,
  Type,
  FileCode,
  Compass,
  RotateCcw,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Monke } from '../../types';
import { getMonkeImageUrl } from '../../utils/api';
import { useLanguage } from '../../utils/i18n';
import confetti from 'canvas-confetti';

interface PassportStudioProps {
  initialMonkeId?: number;
  monkes: Monke[];
  customAvatarUrl?: string;
  customTraits?: { Body: string; Head: string; Eyes: string; Earring: string; Count: number };
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

export type CardTheme = 'obsidian' | 'gold' | 'cyber' | 'matrix' | 'sunset' | 'ruby';

const THEMES: { 
  id: CardTheme; 
  nameZh: string; 
  nameEn: string; 
  icon: string; 
  border: string; 
  bg: string; 
  gradCss: string; 
  borderCss: string;
  rimColor: string;
  glowColor: string;
}[] = [
  { 
    id: 'obsidian', 
    nameZh: '👑 曜石黑金', 
    nameEn: '👑 Obsidian Gold', 
    icon: '👑', 
    border: 'from-amber-400 via-amber-600 to-amber-200', 
    bg: 'bg-gradient-to-br from-[#0c0a09] via-[#1c1917] to-[#0a0a0a]',
    gradCss: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 50%, #0a0a0a 100%)',
    borderCss: 'linear-gradient(135deg, #FBBF24 0%, #D97706 50%, #FDE68A 100%)',
    rimColor: '#B45309',
    glowColor: 'rgba(245, 158, 11, 0.45)'
  },
  { 
    id: 'gold', 
    nameZh: '🥇 纯金至尊', 
    nameEn: '🥇 Pure Gold', 
    icon: '🥇', 
    border: 'from-yellow-300 via-amber-500 to-yellow-100', 
    bg: 'bg-gradient-to-br from-[#1e1503] via-[#332205] to-[#120c02]',
    gradCss: 'linear-gradient(135deg, #1e1503 0%, #332205 50%, #120c02 100%)',
    borderCss: 'linear-gradient(135deg, #FDE047 0%, #F59E0B 50%, #FEF08A 100%)',
    rimColor: '#D97706',
    glowColor: 'rgba(251, 191, 36, 0.5)'
  },
  { 
    id: 'cyber', 
    nameZh: '🟣 赛博全息', 
    nameEn: '🟣 Cyber Holo', 
    icon: '🟣', 
    border: 'from-purple-400 via-cyan-400 to-pink-500', 
    bg: 'bg-gradient-to-br from-[#0f0728] via-[#1a0b3b] to-[#080318]',
    gradCss: 'linear-gradient(135deg, #0f0728 0%, #1a0b3b 50%, #080318 100%)',
    borderCss: 'linear-gradient(135deg, #C084FC 0%, #22D3EE 50%, #EC4899 100%)',
    rimColor: '#9333EA',
    glowColor: 'rgba(192, 132, 252, 0.5)'
  },
  { 
    id: 'matrix', 
    nameZh: '🟢 矩阵终端', 
    nameEn: '🟢 Matrix Green', 
    icon: '🟢', 
    border: 'from-emerald-400 via-green-500 to-teal-300', 
    bg: 'bg-gradient-to-br from-[#02180c] via-[#042815] to-[#010e07]',
    gradCss: 'linear-gradient(135deg, #02180c 0%, #042815 50%, #010e07 100%)',
    borderCss: 'linear-gradient(135deg, #34D399 0%, #22C55E 50%, #5EEAD4 100%)',
    rimColor: '#059669',
    glowColor: 'rgba(52, 211, 153, 0.5)'
  },
  { 
    id: 'sunset', 
    nameZh: '🌅 暮光霞光', 
    nameEn: '🌅 Twilight Glow', 
    icon: '🌅', 
    border: 'from-rose-400 via-amber-500 to-indigo-500', 
    bg: 'bg-gradient-to-br from-[#1a081e] via-[#2c0d23] to-[#120417]',
    gradCss: 'linear-gradient(135deg, #1a081e 0%, #2c0d23 50%, #120417 100%)',
    borderCss: 'linear-gradient(135deg, #FB7185 0%, #F59E0B 50%, #6366F1 100%)',
    rimColor: '#E11D48',
    glowColor: 'rgba(251, 113, 133, 0.5)'
  },
  { 
    id: 'ruby', 
    nameZh: '💎 绝版红宝', 
    nameEn: '💎 Crimson Ruby', 
    icon: '💎', 
    border: 'from-rose-500 via-red-600 to-amber-400', 
    bg: 'bg-gradient-to-br from-[#1a0404] via-[#2d0808] to-[#0f0202]',
    gradCss: 'linear-gradient(135deg, #1a0404 0%, #2d0808 50%, #0f0202 100%)',
    borderCss: 'linear-gradient(135deg, #F43F5E 0%, #DC2626 50%, #F59E0B 100%)',
    rimColor: '#B91C1C',
    glowColor: 'rgba(244, 63, 94, 0.5)'
  },
];

const PRESET_BADGES = [
  'GENESIS COLLECTOR',
  'DIAMOND HANDS',
  'ORDINALS OG',
  'TOP 100 ELITE',
  'CUSTOM CREATOR',
  'HODL FOREVER',
];

export const PassportStudio: React.FC<PassportStudioProps> = ({
  initialMonkeId = 209,
  monkes,
  customAvatarUrl,
  customTraits,
  onToast,
}) => {
  const { lang } = useLanguage();
  const [selectedId, setSelectedId] = useState<number>(initialMonkeId);
  const [cardTheme, setCardTheme] = useState<CardTheme>('obsidian');

  // Deep Custom Content Fields (Fully Editable like Poster Studio)
  const [cardTitle, setCardTitle] = useState<string>('NODEMONKES PASSPORT');
  const [ownerHandle, setOwnerHandle] = useState<string>('@satoshi_monke');
  const [showVerified, setShowVerified] = useState<boolean>(true);
  const [customTitle, setCustomTitle] = useState<string>('GENESIS COLLECTOR');
  const [customMotto, setCustomMotto] = useState<string>('In Monkes We Trust • Bitcoin Ordinals');
  const [avatarScale, setAvatarScale] = useState<number>(100);
  const [sheenIntensity, setSheenIntensity] = useState<number>(65);

  // High-Precision 3D Physics Engine State (Inertia Damping & Velocity)
  const [rotX, setRotX] = useState<number>(0);
  const [rotY, setRotY] = useState<number>(0);
  const [isAutoSpin, setIsAutoSpin] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const physicsRef = useRef<{
    vx: number;
    vy: number;
    lastX: number;
    lastY: number;
    lastTime: number;
  }>({ vx: 0, vy: 0, lastX: 0, lastY: 0, lastTime: 0 });

  const animFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

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

  const activeAvatarSrc = customAvatarUrl || getMonkeImageUrl(currentMonke.id);
  const activeTraits = customTraits || {
    Body: String(currentMonke.attributes.Body || 'Alien'),
    Head: String(currentMonke.attributes.Head || 'None'),
    Eyes: String(currentMonke.attributes.Eyes || 'None'),
    Earring: String(currentMonke.attributes.Earring || 'None'),
    Count: Number(currentMonke.attributes.Count || 4),
  };

  // Tier Rating
  const tier = useMemo(() => {
    const r = currentMonke.rank || 5000;
    if (r <= 50) return { label: 'SSS TIER', color: 'text-amber-300 bg-amber-500/20 border-amber-400' };
    if (r <= 200) return { label: 'SS TIER', color: 'text-purple-300 bg-purple-500/20 border-purple-400' };
    if (r <= 1000) return { label: 'S TIER', color: 'text-cyan-300 bg-cyan-500/20 border-cyan-400' };
    return { label: 'A TIER', color: 'text-emerald-300 bg-emerald-500/20 border-emerald-400' };
  }, [currentMonke.rank]);

  // Smooth Physics Inertia Decay Loop
  useEffect(() => {
    const updatePhysics = () => {
      if (!isDraggingRef.current) {
        if (isAutoSpin) {
          setRotY((prev) => (prev + 0.85) % 360);
        } else {
          // Inertia damping
          if (Math.abs(physicsRef.current.vx) > 0.01 || Math.abs(physicsRef.current.vy) > 0.01) {
            setRotY((prev) => prev + physicsRef.current.vx);
            setRotX((prev) => {
              const next = prev - physicsRef.current.vy;
              // Clamp X tilt to prevent over-inversion dizziness
              return Math.max(-65, Math.min(65, next));
            });
            physicsRef.current.vx *= 0.93; // friction
            physicsRef.current.vy *= 0.93;
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isAutoSpin]);

  // Mouse Drag Handlers with Velocity Calculation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    isDraggingRef.current = true;
    setIsAutoSpin(false);
    physicsRef.current = {
      vx: 0,
      vy: 0,
      lastX: e.clientX,
      lastY: e.clientY,
      lastTime: performance.now(),
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const now = performance.now();
    const dt = Math.max(1, now - physicsRef.current.lastTime);
    const dx = e.clientX - physicsRef.current.lastX;
    const dy = e.clientY - physicsRef.current.lastY;

    setRotY((prev) => prev + dx * 0.5);
    setRotX((prev) => {
      const next = prev - dy * 0.5;
      return Math.max(-75, Math.min(75, next));
    });

    physicsRef.current = {
      vx: (dx / dt) * 12,
      vy: (dy / dt) * 12,
      lastX: e.clientX,
      lastY: e.clientY,
      lastTime: now,
    };
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    isDraggingRef.current = true;
    setIsAutoSpin(false);
    physicsRef.current = {
      vx: 0,
      vy: 0,
      lastX: e.touches[0].clientX,
      lastY: e.touches[0].clientY,
      lastTime: performance.now(),
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const now = performance.now();
    const dt = Math.max(1, now - physicsRef.current.lastTime);
    const dx = e.touches[0].clientX - physicsRef.current.lastX;
    const dy = e.touches[0].clientY - physicsRef.current.lastY;

    setRotY((prev) => prev + dx * 0.5);
    setRotX((prev) => {
      const next = prev - dy * 0.5;
      return Math.max(-75, Math.min(75, next));
    });

    physicsRef.current = {
      vx: (dx / dt) * 12,
      vy: (dy / dt) * 12,
      lastX: e.touches[0].clientX,
      lastY: e.touches[0].clientY,
      lastTime: now,
    };
  };

  // Acrobatic 360 Full Spin Flip Trick
  const handleAcrobaticFlip = () => {
    setIsAutoSpin(false);
    physicsRef.current.vx = 14;
    physicsRef.current.vy = 4;
  };

  // Helper to draw rounded rectangle in Canvas
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

  // Helper to draw Verified Badge
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

  // EXPORT 1: 1:1 Pixel-Perfect 2K PNG Card Export
  const handleExportPng = useCallback(async () => {
    try {
      setIsExporting(true);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

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

      // Outer Border Gradient
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
      } else if (cardTheme === 'ruby') {
        borderGrad.addColorStop(0, '#F43F5E');
        borderGrad.addColorStop(0.5, '#DC2626');
        borderGrad.addColorStop(1, '#F59E0B');
      } else {
        borderGrad.addColorStop(0, '#FBBF24');
        borderGrad.addColorStop(0.5, '#D97706');
        borderGrad.addColorStop(1, '#FDE68A');
      }

      ctx.save();
      drawRoundRect(ctx, cardX, cardY, cardW, cardH, outerRadius);
      ctx.fillStyle = borderGrad;
      ctx.fill();
      ctx.restore();

      // Inner Background
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
      } else if (cardTheme === 'ruby') {
        innerGrad.addColorStop(0, '#1A0404');
        innerGrad.addColorStop(0.5, '#2D0808');
        innerGrad.addColorStop(1, '#0F0202');
      } else {
        innerGrad.addColorStop(0, '#0C0A09');
        innerGrad.addColorStop(0.5, '#1C1917');
        innerGrad.addColorStop(1, '#0A0A0A');
      }

      ctx.save();
      drawRoundRect(ctx, innerX, innerY, innerW, innerH, innerRadius);
      ctx.fillStyle = innerGrad;
      ctx.fill();
      ctx.clip();

      // Header
      const headerY = innerY + 45;

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

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px "Space Mono", ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(cardTitle.toUpperCase(), innerX + 104, headerY + 32);

      // Right Badges
      const tierBadgeW = 120;
      const tierBadgeH = 34;
      const tierBadgeX = innerX + innerW - 45 - tierBadgeW;
      const tierBadgeY = headerY + 5;

      const rankBadgeW = 125;
      const rankBadgeH = 34;
      const rankBadgeX = tierBadgeX - 12 - rankBadgeW;
      const rankBadgeY = tierBadgeY;

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

      drawRoundRect(ctx, tierBadgeX, tierBadgeY, tierBadgeW, tierBadgeH, 17);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.strokeStyle = '#FBBF24';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 14px "Space Mono", ui-monospace, monospace';
      ctx.fillText(tier.label, tierBadgeX + tierBadgeW / 2, tierBadgeY + 23);

      // Header Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(innerX + 45, headerY + 62);
      ctx.lineTo(innerX + innerW - 45, headerY + 62);
      ctx.stroke();

      // Body (5:7 Grid)
      const bodyTopY = headerY + 62;
      const bodyBottomY = innerY + innerH - 65;
      const bodyH = bodyBottomY - bodyTopY;
      const bodyCenterY = bodyTopY + bodyH / 2;

      const leftColW = innerW * 0.416;
      const leftColCenterX = innerX + leftColW / 2;

      const baseAvatarBoxSize = 340;
      const avatarBoxSize = Math.round(baseAvatarBoxSize * (avatarScale / 100));
      const avatarX = Math.round(leftColCenterX - avatarBoxSize / 2);
      const avatarY = Math.round(bodyCenterY - avatarBoxSize / 2);

      drawRoundRect(ctx, avatarX, avatarY, avatarBoxSize, avatarBoxSize, 26);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Avatar
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = activeAvatarSrc;
      await new Promise((res) => {
        img.onload = res;
        img.onerror = res;
      });

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, avatarX + 18, avatarY + 18, avatarBoxSize - 36, avatarBoxSize - 36);

      // Top Left Tag
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

      // Right Column
      const rightColX = innerX + leftColW + 20;
      const rightGroupH = 220;
      const rightStartY = Math.round(bodyCenterY - rightGroupH / 2);

      let curInfoY = rightStartY + 30;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 36px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(ownerHandle, rightColX, curInfoY);

      if (showVerified) {
        const handleTextWidth = ctx.measureText(ownerHandle).width;
        drawVerifiedBadge(ctx, rightColX + handleTextWidth + 12, curInfoY - 26, 28);
      }

      curInfoY += 24;
      ctx.font = 'bold 13px "Space Mono", ui-monospace, monospace';
      const titleText = customTitle.toUpperCase();
      const titleBoxW = ctx.measureText(titleText).width + 24;
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

      curInfoY += 56;
      const rowLineH = 34;

      ctx.textAlign = 'left';
      ctx.font = '19px "Space Mono", ui-monospace, monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Inscription: ', rightColX, curInfoY);
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 19px "Space Mono", ui-monospace, monospace';
      ctx.fillText(`#${currentMonke.inscription}`, rightColX + ctx.measureText('Inscription: ').width, curInfoY);

      curInfoY += rowLineH;
      ctx.font = '19px "Space Mono", ui-monospace, monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Block Height: ', rightColX, curInfoY);
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 19px "Space Mono", ui-monospace, monospace';
      ctx.fillText(`#${currentMonke.block}`, rightColX + ctx.measureText('Block Height: ').width, curInfoY);

      curInfoY += rowLineH;
      ctx.font = '19px "Space Mono", ui-monospace, monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Traits: ', rightColX, curInfoY);
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 19px "Space Mono", ui-monospace, monospace';
      ctx.fillText(`${activeTraits.Count || 4} Parts`, rightColX + ctx.measureText('Traits: ').width, curInfoY);

      // Footer
      const footerDividerY = innerY + innerH - 65;
      const footerTextY = footerDividerY + 38;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(innerX + 45, footerDividerY);
      ctx.lineTo(innerX + innerW - 45, footerDividerY);
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'italic 17px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`"${customMotto}"`, innerX + 45, footerTextY);

      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 16px "Space Mono", ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('ORDINALS VERIFIED', innerX + innerW - 45, footerTextY);

      ctx.restore();

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `NodeMonke_${currentMonke.id}_Passport_${cardTheme}.png`;
      link.href = url;
      link.click();

      confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
      onToast('通行证正面 PNG 导出成功！', `NodeMonke #${currentMonke.id} 高清 1:1 卡片已保存`, 'success');
    } catch (e: any) {
      console.error('Export PNG error:', e);
      onToast('导出失败', e?.message || '请重试', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [cardTheme, cardTitle, currentMonke, tier, ownerHandle, showVerified, customTitle, customMotto, activeAvatarSrc, activeTraits, avatarScale, onToast]);

  // EXPORT 2: Standalone Interactive 3D HTML File Generator
  const handleExport3DHtml = useCallback(async () => {
    try {
      setIsExporting(true);

      const activeThemeObj = THEMES.find((t) => t.id === cardTheme) || THEMES[0];

      // Convert Avatar to Base64 Data URL for 100% offline standalone usage
      let avatarBase64 = activeAvatarSrc;
      try {
        const c = document.createElement('canvas');
        c.width = 300;
        c.height = 300;
        const cx = c.getContext('2d');
        if (cx) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = activeAvatarSrc;
          await new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          });
          cx.imageSmoothingEnabled = false;
          cx.drawImage(img, 0, 0, 300, 300);
          avatarBase64 = c.toDataURL('image/png');
        }
      } catch (e) {
        console.warn('Avatar base64 conversion notice:', e);
      }

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>NodeMonke #${currentMonke.id} • 3D Holographic Web3 Passport</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: radial-gradient(circle at 50% 50%, #0d1117 0%, #030712 100%);
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      perspective: 1400px;
      user-select: none;
      touch-action: none;
    }
    .hint {
      position: absolute;
      top: 24px;
      font-size: 13px;
      color: #94A3B8;
      background: rgba(0,0,0,0.65);
      padding: 8px 20px;
      border-radius: 99px;
      border: 1px solid rgba(255,255,255,0.12);
      backdrop-filter: blur(12px);
      z-index: 100;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .stage {
      width: 100%;
      max-width: 660px;
      aspect-ratio: 1.58 / 1;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      position: relative;
    }
    .stage:active { cursor: grabbing; }

    /* Ground Shadow & Reflection Platform */
    .floor-shadow {
      position: absolute;
      bottom: -40px;
      width: 80%;
      height: 40px;
      background: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 80%);
      border-radius: 50%;
      filter: blur(14px);
      pointer-events: none;
      transform: rotateX(80deg);
      transition: transform 0.1s ease;
    }

    .card-wrap {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      will-change: transform;
    }

    /* 3D Multi-Layer Physical Card Thickness & Rim */
    .card-rim {
      position: absolute;
      inset: 0;
      border-radius: 28px;
      background: ${activeThemeObj.rimColor};
      transform: translateZ(0px);
      box-shadow: 0 35px 90px rgba(0,0,0,0.9), 0 0 40px ${activeThemeObj.glowColor};
    }

    .card-face {
      position: absolute;
      inset: 0;
      border-radius: 28px;
      background: ${activeThemeObj.borderCss};
      padding: 6px;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      transform-style: preserve-3d;
    }

    .card-front {
      transform: translateZ(8px);
    }

    .card-back {
      transform: rotateY(180deg) translateZ(8px);
    }

    .card-inner {
      width: 100%;
      height: 100%;
      border-radius: 22px;
      background: ${activeThemeObj.gradCss};
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      transform-style: preserve-3d;
    }

    /* Holographic Light Flare Shader */
    .sheen {
      position: absolute;
      inset: 0;
      border-radius: 22px;
      pointer-events: none;
      mix-blend-mode: color-dodge;
      opacity: 0.65;
      background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.85) 0%, rgba(236,72,153,0.45) 25%, rgba(59,130,246,0.45) 50%, transparent 75%);
      z-index: 30;
      transform: translateZ(2px);
    }

    /* Parallax Floating 3D Depth Elements */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.12);
      padding-bottom: 12px;
      transform: translateZ(20px);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      font-size: 15px;
      letter-spacing: 1px;
    }
    .header-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: rgba(245,158,11,0.25);
      border: 1px solid rgba(245,158,11,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FBBF24;
      font-size: 14px;
    }
    .badges {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tier-badge {
      padding: 4px 12px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 900;
      background: rgba(245,158,11,0.2);
      border: 1px solid #FBBF24;
      color: #FDE68A;
      box-shadow: 0 4px 12px rgba(245,158,11,0.3);
    }
    .rank-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: #CBD5E1;
    }
    .body {
      display: flex;
      align-items: center;
      gap: 24px;
      margin: auto 0;
    }
    .avatar-box {
      width: 154px;
      height: 154px;
      border-radius: 20px;
      background: rgba(0,0,0,0.75);
      border: 1px solid rgba(255,255,255,0.2);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 20px 40px rgba(0,0,0,0.85);
      transform: translateZ(36px);
      transform-style: preserve-3d;
    }
    .avatar-img {
      width: 88%;
      height: 88%;
      object-fit: contain;
      image-rendering: pixelated;
      transform: translateZ(12px);
    }
    .avatar-tag {
      position: absolute;
      top: 6px;
      left: 6px;
      background: rgba(0,0,0,0.9);
      padding: 2px 8px;
      border-radius: 5px;
      font-size: 10px;
      font-weight: 800;
      border: 1px solid rgba(255,255,255,0.15);
      transform: translateZ(16px);
    }
    .info {
      display: flex;
      flex-direction: column;
      gap: 6px;
      transform: translateZ(28px);
    }
    .handle {
      font-size: 24px;
      font-weight: 900;
      display: flex;
      align-items: center;
      gap: 8px;
      text-shadow: 0 4px 12px rgba(0,0,0,0.8);
    }
    .verified {
      color: #38BDF8;
      font-size: 18px;
    }
    .title-pill {
      display: inline-block;
      width: max-content;
      padding: 3px 12px;
      border-radius: 6px;
      background: rgba(245,158,11,0.25);
      border: 1px solid rgba(245,158,11,0.45);
      color: #FDE68A;
      font-size: 11px;
      font-weight: 800;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .meta-rows {
      font-size: 12px;
      color: #94A3B8;
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-top: 4px;
    }
    .meta-rows strong { color: #F8FAFC; }
    .footer {
      border-top: 1px solid rgba(255,255,255,0.12);
      padding-top: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #94A3B8;
      transform: translateZ(18px);
    }
    .verified-stamp {
      color: #FBBF24;
      font-weight: 900;
    }
    .back-traits {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      width: 100%;
      margin: 12px 0;
      transform: translateZ(26px);
    }
    .trait-chip {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .controls {
      position: absolute;
      bottom: 24px;
      display: flex;
      gap: 10px;
      z-index: 100;
    }
    .btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: #FFFFFF;
      padding: 9px 18px;
      border-radius: 14px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      backdrop-filter: blur(12px);
      transition: all 0.2s;
      box-shadow: 0 6px 16px rgba(0,0,0,0.4);
    }
    .btn:hover { background: rgba(255,255,255,0.22); transform: translateY(-2px); }
  </style>
</head>
<body>
  <div class="hint">⚡ 物理惯性阻尼 • 鼠标 / 触屏任意拖拽 360° 自由翻滚 • 视差悬浮深度</div>

  <div class="stage" id="stage">
    <div class="card-wrap" id="cardWrap">
      
      <!-- Card Rim Extrusion -->
      <div class="card-rim"></div>

      <!-- FRONT FACE -->
      <div class="card-face card-front">
        <div class="card-inner">
          <div class="sheen" id="sheenFront"></div>
          
          <div class="header">
            <div class="header-left">
              <div class="header-icon">⚡</div>
              <span>${cardTitle}</span>
            </div>
            <div class="badges">
              <div class="rank-badge">Rank #${currentMonke.rank || 'N/A'}</div>
              <div class="tier-badge">${tier.label}</div>
            </div>
          </div>

          <div class="body">
            <div class="avatar-box">
              <div class="avatar-tag">#${currentMonke.id}</div>
              <img src="${avatarBase64}" alt="NodeMonke" class="avatar-img">
            </div>
            <div class="info">
              <div class="handle">
                <span>${ownerHandle}</span>
                ${showVerified ? '<span class="verified">✓</span>' : ''}
              </div>
              <div class="title-pill">${customTitle}</div>
              <div class="meta-rows">
                <div>Inscription: <strong>#${currentMonke.inscription}</strong></div>
                <div>Block Height: <strong>#${currentMonke.block}</strong></div>
                <div>Traits: <strong>${activeTraits.Count || 4} Parts</strong></div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div>"${customMotto}"</div>
            <div class="verified-stamp">ORDINALS VERIFIED</div>
          </div>
        </div>
      </div>

      <!-- BACK FACE -->
      <div class="card-face card-back">
        <div class="card-inner">
          <div class="sheen" id="sheenBack"></div>
          
          <div class="header">
            <div class="header-left">
              <span style="color: #FBBF24;">AUTHENTICATED ORDINALS INSCRIPTION</span>
            </div>
            <div style="font-size: 11px; color: #94A3B8;">SHA256: ${currentMonke.id.toString(16).padStart(8, '0')}...</div>
          </div>

          <div class="back-traits">
            <div class="trait-chip"><span>Body:</span> <strong>${activeTraits.Body}</strong></div>
            <div class="trait-chip"><span>Head:</span> <strong>${activeTraits.Head}</strong></div>
            <div class="trait-chip"><span>Eyes:</span> <strong>${activeTraits.Eyes}</strong></div>
            <div class="trait-chip"><span>Earring:</span> <strong>${activeTraits.Earring}</strong></div>
          </div>

          <div class="footer">
            <div>GENESIS BLOCK #776487</div>
            <div style="color: #34D399; font-weight: 800;">100% ON-CHAIN</div>
          </div>
        </div>
      </div>

    </div>
    <div class="floor-shadow" id="floorShadow"></div>
  </div>

  <div class="controls">
    <button class="btn" onclick="setAngle(0, 0)">🎯 正面</button>
    <button class="btn" onclick="setAngle(0, 180)">🔄 背面</button>
    <button class="btn" onclick="setAngle(15, 35)">📐 3D 俯瞰</button>
    <button class="btn" onclick="flipAcrobatic()">💫 3D 翻滚</button>
    <button class="btn" onclick="toggleAutoSpin()">🌀 360° 自动巡航</button>
  </div>

  <script>
    let rotX = 0;
    let rotY = 0;
    let vx = 0;
    let vy = 0;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;
    let isDragging = false;
    let isAutoSpin = false;

    const card = document.getElementById('cardWrap');
    const stage = document.getElementById('stage');
    const sheenFront = document.getElementById('sheenFront');
    const sheenBack = document.getElementById('sheenBack');
    const floorShadow = document.getElementById('floorShadow');

    function updateCard() {
      card.style.transform = \`rotateX(\${rotX}deg) rotateY(\${rotY}deg)\`;
      
      const normY = ((rotY % 360) + 360) % 360;
      const sheenX = (normY / 360) * 100;
      sheenFront.style.background = \`radial-gradient(circle at \${sheenX}% 50%, rgba(255,255,255,0.85) 0%, rgba(236,72,153,0.45) 25%, rgba(59,130,246,0.45) 50%, transparent 75%)\`;
      sheenBack.style.background = \`radial-gradient(circle at \${100 - sheenX}% 50%, rgba(255,255,255,0.85) 0%, rgba(236,72,153,0.45) 25%, rgba(59,130,246,0.45) 50%, transparent 75%)\`;

      const shadowScale = Math.abs(Math.cos(rotY * Math.PI / 180));
      floorShadow.style.transform = \`rotateX(80deg) scale(\${0.5 + shadowScale * 0.5})\`;
    }

    function physicsLoop() {
      if (!isDragging) {
        if (isAutoSpin) {
          rotY = (rotY + 0.85) % 360;
          updateCard();
        } else if (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01) {
          rotY += vx;
          rotX = Math.max(-65, Math.min(65, rotX - vy));
          vx *= 0.93;
          vy *= 0.93;
          updateCard();
        }
      }
      requestAnimationFrame(physicsLoop);
    }
    requestAnimationFrame(physicsLoop);

    stage.addEventListener('mousedown', (e) => {
      isDragging = true;
      isAutoSpin = false;
      vx = 0;
      vy = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = performance.now();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      rotY += dx * 0.5;
      rotX = Math.max(-75, Math.min(75, rotX - dy * 0.5));
      vx = (dx / dt) * 12;
      vy = (dy / dt) * 12;
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = now;
      updateCard();
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    // Touch Support
    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      isDragging = true;
      isAutoSpin = false;
      vx = 0;
      vy = 0;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      lastTime = performance.now();
    });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      rotY += dx * 0.5;
      rotX = Math.max(-75, Math.min(75, rotX - dy * 0.5));
      vx = (dx / dt) * 12;
      vy = (dy / dt) * 12;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      lastTime = now;
      updateCard();
    });

    window.addEventListener('touchend', () => { isDragging = false; });

    function setAngle(x, y) {
      isAutoSpin = false;
      rotX = x;
      rotY = y;
      vx = 0;
      vy = 0;
      updateCard();
    }

    function flipAcrobatic() {
      isAutoSpin = false;
      vx = 14;
      vy = 4;
    }

    function toggleAutoSpin() {
      isAutoSpin = !isAutoSpin;
    }
  </script>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `NodeMonke_${currentMonke.id}_3D_Interactive_Card.html`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);

      confetti({ particleCount: 70, spread: 70, origin: { y: 0.8 } });
      onToast('3D 交互网页文件已保存！', `可直接双击打开 .html 文件，随时在浏览器中 360° 交互翻转！`, 'success');
    } catch (e: any) {
      console.error('Export 3D HTML error:', e);
      onToast('导出 3D 网页失败', e?.message || '请重试', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [cardTheme, cardTitle, currentMonke, tier, ownerHandle, showVerified, customTitle, customMotto, activeAvatarSrc, activeTraits, onToast]);

  const activeThemeObj = THEMES.find((t) => t.id === cardTheme) || THEMES[0];

  return (
    <div className="min-h-[calc(100vh-140px)] w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6 select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-mono text-base font-bold shadow-lg">
              🎴
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              3D Web3 极客卡片工坊 <span className="text-amber-400 text-lg font-sans">Card Studio</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            物理惯性阻尼 + <strong>真实 3D 多图层视差悬浮深度</strong> + 任意角度 360° 自由翻滚，一键导出 2K 高清正面图与<strong>独立 3D 交互网页 HTML 文件</strong>！
          </p>
        </div>

        {/* Dual Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportPng}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs transition-all active:scale-95 border border-white/10 shadow-md"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>💾 导出正面图 PNG</span>
          </button>

          <button
            onClick={handleExport3DHtml}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-600 to-amber-500 hover:brightness-110 text-white font-mono font-extrabold text-xs transition-all active:scale-95 shadow-lg shadow-purple-500/25"
          >
            <FileCode className="w-4 h-4 text-amber-300" />
            <span>🌐 导出 3D 交互网页 HTML</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: 3D Stage (Left 7 Cols) & Custom Canvas Editor (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 3D Stage Container */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-10 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-2xl relative min-h-[620px] overflow-hidden">
          
          {/* Ambient Studio Lighting */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[380px] rounded-full blur-[140px] pointer-events-none transition-colors duration-500" 
            style={{ backgroundColor: activeThemeObj.glowColor }}
          />

          {/* Top Stage Badges & Angle Controls */}
          <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-30">
            <span className="text-[11px] font-mono text-slate-300 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>物理惯性阻尼 • 视差悬浮深度</span>
            </span>

            <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs font-mono">
              <button
                onClick={() => { setIsAutoSpin(false); setRotX(0); setRotY(0); }}
                className={clsx('px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all', rotY === 0 ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-400 hover:text-white')}
              >
                正面
              </button>
              <button
                onClick={() => { setIsAutoSpin(false); setRotX(0); setRotY(180); }}
                className={clsx('px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all', Math.abs(rotY % 360) === 180 ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-400 hover:text-white')}
              >
                背面
              </button>
              <button
                onClick={() => { setIsAutoSpin(false); setRotX(15); setRotY(35); }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white"
              >
                3D俯瞰
              </button>
              <button
                onClick={handleAcrobaticFlip}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-1"
                title="触发高阶 3D 空中翻滚特效"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>翻滚</span>
              </button>
              <button
                onClick={() => setIsAutoSpin((s) => !s)}
                className={clsx('px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1', isAutoSpin ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-white')}
              >
                <RotateCw className={clsx('w-3 h-3', isAutoSpin ? 'animate-spin' : '')} />
                <span>巡航</span>
              </button>
            </div>
          </div>

          {/* 360-Degree Free Orbit 3D Card with Parallax Depth */}
          <div 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
            className="relative perspective-[1400px] w-full max-w-[560px] aspect-[1.58/1] cursor-grab active:cursor-grabbing select-none my-auto mt-14 mb-8 flex items-center justify-center"
          >
            {/* Dynamic Ground Shadow Platform */}
            <div 
              className="absolute -bottom-10 w-[80%] h-10 rounded-full blur-xl pointer-events-none transition-transform duration-100"
              style={{
                background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 80%)',
                transform: `rotateX(80deg) scale(${0.5 + Math.abs(Math.cos(rotY * Math.PI / 180)) * 0.5})`,
              }}
            />

            <motion.div
              animate={{
                rotateX: rotX,
                rotateY: rotY,
              }}
              transition={{ duration: 0 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative w-full h-full will-change-transform"
            >
              
              {/* Card Physical Edge Rim Extrusion (Depth 8px) */}
              <div 
                className="absolute inset-0 rounded-[28px] shadow-[0_30px_90px_rgba(0,0,0,0.9)]"
                style={{ 
                  backgroundColor: activeThemeObj.rimColor,
                  transform: 'translateZ(0px)',
                  boxShadow: `0 30px 90px rgba(0,0,0,0.9), 0 0 35px ${activeThemeObj.glowColor}`
                }}
              />

              {/* FRONT FACE (Parallax Depth Layer) */}
              <div 
                className={clsx('absolute inset-0 rounded-[28px] p-1.5 bg-gradient-to-br', activeThemeObj.border)}
                style={{ 
                  transform: 'translateZ(8px)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div 
                  className={clsx('w-full h-full rounded-[22px] p-5 sm:p-6 flex flex-col justify-between relative', activeThemeObj.bg)}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  
                  {/* Holographic Sheen Layer */}
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-color-dodge transition-opacity duration-300 z-20 rounded-[22px]"
                    style={{
                      background: `radial-gradient(circle at ${((rotY % 360 + 360) % 360) / 360 * 100}% 50%, rgba(255,255,255,0.85) 0%, rgba(236,72,153,0.45) 25%, rgba(59,130,246,0.45) 50%, transparent 75%)`,
                      opacity: sheenIntensity / 100,
                      transform: 'translateZ(2px)'
                    }}
                  />

                  {/* Header (Floating at Z: 20px) */}
                  <div 
                    className="flex items-center justify-between border-b border-white/10 pb-3"
                    style={{ transform: 'translateZ(20px)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 text-xs font-bold font-mono shadow-sm">
                        ⚡
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-white font-mono tracking-wider">
                        {cardTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={clsx('px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border shadow-sm', tier.color)}>
                        {tier.label}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        Rank #{currentMonke.rank || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Card Center Body (Parallax Floating Avatar at Z: 36px) */}
                  <div className="grid grid-cols-12 gap-4 items-center my-auto">
                    <div className="col-span-5 flex items-center justify-center">
                      <div 
                        style={{ 
                          transform: `scale(${avatarScale / 100}) translateZ(36px)`,
                          transformStyle: 'preserve-3d'
                        }}
                        className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-black/75 border border-white/20 p-2 shadow-[0_20px_40px_rgba(0,0,0,0.85)] relative group overflow-hidden transition-transform"
                      >
                        <img
                          src={activeAvatarSrc}
                          alt={`NodeMonke #${currentMonke.id}`}
                          style={{ transform: 'translateZ(12px)' }}
                          className="w-full h-full object-contain pixelated filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                        />
                        <div 
                          style={{ transform: 'translateZ(16px)' }}
                          className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/90 text-[9px] font-mono text-white font-bold border border-white/15"
                        >
                          #{currentMonke.id}
                        </div>
                      </div>
                    </div>

                    {/* Owner Info (Floating at Z: 26px) */}
                    <div 
                      className="col-span-7 flex flex-col gap-1.5 font-mono"
                      style={{ transform: 'translateZ(26px)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-base sm:text-lg font-black text-white drop-shadow-md">
                          {ownerHandle}
                        </span>
                        {showVerified && <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400/20" />}
                      </div>

                      <div className="inline-block">
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[11px] font-bold shadow-sm">
                          {customTitle}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 flex flex-col gap-0.5 mt-1">
                        <span>Inscription: <strong className="text-white">#{currentMonke.inscription}</strong></span>
                        <span>Block Height: <strong className="text-white">#{currentMonke.block}</strong></span>
                        <span>Traits: <strong className="text-white">{activeTraits.Count || 4} Parts</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer (Floating at Z: 18px) */}
                  <div 
                    className="border-t border-white/10 pt-2 flex items-center justify-between text-[10px] font-mono text-slate-400"
                    style={{ transform: 'translateZ(18px)' }}
                  >
                    <span className="truncate max-w-[280px]">"{customMotto}"</span>
                    <span className="text-amber-400 font-bold">ORDINALS VERIFIED</span>
                  </div>
                </div>
              </div>

              {/* BACK FACE (Parallax Depth Layer) */}
              <div 
                className={clsx('absolute inset-0 rounded-[28px] p-1.5 bg-gradient-to-br', activeThemeObj.border)}
                style={{ 
                  transform: 'rotateY(180deg) translateZ(8px)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div 
                  className={clsx('w-full h-full rounded-[22px] p-5 sm:p-6 flex flex-col justify-between relative', activeThemeObj.bg)}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  
                  {/* Holographic Sheen Layer */}
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-color-dodge transition-opacity duration-300 z-20 rounded-[22px]"
                    style={{
                      background: `radial-gradient(circle at ${((rotY % 360 + 360) % 360) / 360 * 100}% 50%, rgba(255,255,255,0.85) 0%, rgba(236,72,153,0.45) 25%, rgba(59,130,246,0.45) 50%, transparent 75%)`,
                      opacity: sheenIntensity / 100,
                      transform: 'translateZ(2px)'
                    }}
                  />

                  {/* Header (Floating at Z: 20px) */}
                  <div 
                    className="flex items-center justify-between border-b border-white/10 pb-3"
                    style={{ transform: 'translateZ(20px)' }}
                  >
                    <span className="text-xs font-mono font-bold text-amber-400">
                      AUTHENTICATED ORDINALS INSCRIPTION
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      SHA256: {currentMonke.id.toString(16).padStart(8, '0')}...
                    </span>
                  </div>

                  {/* Traits Grid (Floating at Z: 26px) */}
                  <div 
                    className="grid grid-cols-12 gap-4 items-center my-auto font-mono"
                    style={{ transform: 'translateZ(26px)' }}
                  >
                    <div className="col-span-8 flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 shadow-sm">
                        <span className="text-slate-400">Body:</span>
                        <span className="font-bold text-white">{activeTraits.Body}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 shadow-sm">
                        <span className="text-slate-400">Head:</span>
                        <span className="font-bold text-white">{activeTraits.Head}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 shadow-sm">
                        <span className="text-slate-400">Eyes:</span>
                        <span className="font-bold text-white">{activeTraits.Eyes}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 shadow-sm">
                        <span className="text-slate-400">Earring:</span>
                        <span className="font-bold text-white">{activeTraits.Earring}</span>
                      </div>
                    </div>

                    <div className="col-span-4 flex flex-col items-center justify-center gap-1.5">
                      <div className="w-20 h-20 bg-white p-2 rounded-2xl flex items-center justify-center shadow-xl">
                        <QrCode className="w-full h-full text-black" />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 text-center font-bold">Scan Ordinals</span>
                    </div>
                  </div>

                  {/* Footer (Floating at Z: 18px) */}
                  <div 
                    className="border-t border-white/10 pt-2 flex items-center justify-between text-[10px] font-mono text-slate-400"
                    style={{ transform: 'translateZ(18px)' }}
                  >
                    <span>GENESIS BLOCK #776487</span>
                    <span className="text-emerald-400 font-bold">100% ON-CHAIN</span>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>

          <span className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>视角参数: X: {Math.round(rotX)}° | Y: {Math.round(rotY)}°</span>
          </span>
        </div>

        {/* Right Custom Canvas Editor Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 p-6 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-2xl max-h-[640px] overflow-y-auto pr-2 no-scrollbar">
          
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold font-mono text-white">画布内容自定义编辑 (Custom Editor)</h2>
          </div>

          {/* 1. Pick Monke ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>目标神兽编号 (Monke ID)</span>
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
                NodeMonke #{currentMonke.id} ({tier.label})
              </span>
            </div>
          </div>

          {/* 2. Card Material Theme */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>卡片全息材质主题 (Card Finish)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => setCardTheme(th.id)}
                  className={clsx(
                    'p-2 rounded-xl text-xs font-mono font-bold border transition-all text-left flex items-center gap-1.5 active:scale-95',
                    cardTheme === th.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                  )}
                >
                  <span>{th.icon}</span>
                  <span className="truncate text-[11px]">{th.nameZh.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Card Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span>卡片顶部主标题 (Header Title)</span>
            </label>
            <input
              type="text"
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400 transition-all"
              placeholder="NODEMONKES PASSPORT"
            />
          </div>

          {/* 4. Owner Handle & Verified Checkmark */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>持有者推特 / 昵称 (Owner Handle)</span>
              </label>
              <label className="flex items-center gap-1 text-[11px] font-mono text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVerified}
                  onChange={(e) => setShowVerified(e.target.checked)}
                  className="rounded border-white/20 text-sky-500"
                />
                <span>蓝标认证</span>
              </label>
            </div>
            <input
              type="text"
              value={ownerHandle}
              onChange={(e) => setOwnerHandle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400 transition-all"
              placeholder="@your_handle"
            />
          </div>

          {/* 5. Custom Badge Pill */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>个性身份头衔 (Badge Title)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_BADGES.map((b) => (
                <button
                  key={b}
                  onClick={() => setCustomTitle(b)}
                  className={clsx(
                    'px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-all active:scale-95',
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
              className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400 transition-all mt-1"
              placeholder="自定义头衔..."
            />
          </div>

          {/* 6. Custom Motto */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-rose-400" />
              <span>底部个性签名 (Motto Slogan)</span>
            </label>
            <input
              type="text"
              value={customMotto}
              onChange={(e) => setCustomMotto(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400 transition-all"
              placeholder="In Monkes We Trust..."
            />
          </div>

          {/* 7. Avatar Scale Slider */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-bold">
              <span>头像缩放比例 (Avatar Scale)</span>
              <span className="text-amber-400">{avatarScale}%</span>
            </div>
            <input
              type="range"
              min={70}
              max={130}
              value={avatarScale}
              onChange={(e) => setAvatarScale(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* 8. Sheen Intensity Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-bold">
              <span>全息光斑亮度 (Holo Sheen)</span>
              <span className="text-purple-400">{sheenIntensity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={sheenIntensity}
              onChange={(e) => setSheenIntensity(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

        </div>

      </div>

    </div>
  );
};
