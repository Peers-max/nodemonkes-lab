import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  RotateCw, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  Crown,
  Palette, 
  User, 
  Quote, 
  Sliders, 
  Type, 
  FileCode, 
  Compass, 
  Zap,
  Move,
  RotateCcw,
  Eye,
  EyeOff,
  Trash2,
  QrCode,
  Layers
} from 'lucide-react';
import { clsx } from 'clsx';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import type { Monke } from '../../types';
import { getMonkeImageUrl } from '../../utils/api';
import { useLanguage } from '../../utils/i18n';
import { NODE_STRATEGY_LOGO } from './logoBase64';
import confetti from 'canvas-confetti';

interface PassportStudioProps {
  initialMonkeId?: number;
  monkes: Monke[];
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

export type CardTheme = 'obsidian' | 'gold' | 'cyber' | 'matrix' | 'sunset' | 'ruby';

export interface CardLayoutState {
  header: { x: number; y: number; scale: number; visible: boolean };
  badges: { x: number; y: number; scale: number; visible: boolean };
  avatar: { x: number; y: number; scale: number; visible: boolean };
  chip: { x: number; y: number; scale: number; visible: boolean };
  genesisTag: { x: number; y: number; scale: number; visible: boolean };
  ownerHandle: { x: number; y: number; scale: number; visible: boolean };
  badgePill: { x: number; y: number; scale: number; visible: boolean };
  attributes: { x: number; y: number; scale: number; visible: boolean };
  qrCode: { x: number; y: number; scale: number; visible: boolean };
  footerMotto: { x: number; y: number; scale: number; visible: boolean };
  footerVerified: { x: number; y: number; scale: number; visible: boolean };
}

export const DEFAULT_LAYOUT: CardLayoutState = {
  header: { x: 5, y: 4, scale: 100, visible: true },
  badges: { x: 58, y: 4.5, scale: 100, visible: true },
  avatar: { x: 5, y: 19, scale: 100, visible: true },
  chip: { x: 44, y: 20, scale: 100, visible: false },
  genesisTag: { x: 79, y: 21, scale: 100, visible: true },
  ownerHandle: { x: 44, y: 30, scale: 100, visible: true },
  badgePill: { x: 44, y: 45, scale: 100, visible: true },
  attributes: { x: 44, y: 58, scale: 100, visible: true },
  qrCode: { x: 79, y: 42, scale: 100, visible: true },
  footerMotto: { x: 5, y: 92, scale: 100, visible: true },
  footerVerified: { x: 67, y: 92, scale: 100, visible: true },
};

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
    border: 'from-amber-200 via-amber-600 to-amber-400', 
    bg: 'bg-gradient-to-br from-[#141312] via-[#0c0b0a] to-[#040404]',
    gradCss: 'linear-gradient(135deg, #141312 0%, #0c0b0a 50%, #040404 100%)',
    borderCss: 'linear-gradient(135deg, #FDE68A 0%, #D97706 50%, #F59E0B 100%)',
    rimColor: '#B45309',
    glowColor: 'rgba(245, 158, 11, 0.2)'
  },
  { 
    id: 'gold', 
    nameZh: '🥇 纯金至尊', 
    nameEn: '🥇 Pure Gold', 
    icon: '🥇', 
    border: 'from-yellow-100 via-amber-400 to-amber-600', 
    bg: 'bg-gradient-to-br from-[#1a1403] via-[#0f0b01] to-[#050300]',
    gradCss: 'linear-gradient(135deg, #1a1403 0%, #0f0b01 50%, #050300 100%)',
    borderCss: 'linear-gradient(135deg, #FEF08A 0%, #F59E0B 50%, #FFFBEB 100%)',
    rimColor: '#D97706',
    glowColor: 'rgba(251, 191, 36, 0.2)'
  },
  { 
    id: 'cyber', 
    nameZh: '🟣 钛黑赛博', 
    nameEn: '🟣 Cyber Titanium', 
    icon: '🟣', 
    border: 'from-purple-400 via-cyan-400 to-indigo-500', 
    bg: 'bg-gradient-to-br from-[#100824] via-[#080314] to-[#020108]',
    gradCss: 'linear-gradient(135deg, #100824 0%, #080314 50%, #020108 100%)',
    borderCss: 'linear-gradient(135deg, #E879F9 0%, #38BDF8 50%, #818CF8 100%)',
    rimColor: '#9333EA',
    glowColor: 'rgba(192, 132, 252, 0.2)'
  },
  { 
    id: 'matrix', 
    nameZh: '🟢 矩阵黑晶', 
    nameEn: '🟢 Matrix Obsidian', 
    icon: '🟢', 
    border: 'from-emerald-300 via-emerald-600 to-teal-400', 
    bg: 'bg-gradient-to-br from-[#03170c] via-[#020d06] to-[#000502]',
    gradCss: 'linear-gradient(135deg, #03170c 0%, #020d06 50%, #000502 100%)',
    borderCss: 'linear-gradient(135deg, #6EE7B7 0%, #10B981 50%, #34D399 100%)',
    rimColor: '#059669',
    glowColor: 'rgba(52, 211, 153, 0.2)'
  },
  { 
    id: 'sunset', 
    nameZh: '🌅 暮光暗金', 
    nameEn: '🌅 Twilight Dark', 
    icon: '🌅', 
    border: 'from-rose-400 via-amber-500 to-indigo-500', 
    bg: 'bg-gradient-to-br from-[#17071c] via-[#0d0210] to-[#040005]',
    gradCss: 'linear-gradient(135deg, #17071c 0%, #0d0210 50%, #040005 100%)',
    borderCss: 'linear-gradient(135deg, #FDA4AF 0%, #FB923C 50%, #818CF8 100%)',
    rimColor: '#E11D48',
    glowColor: 'rgba(251, 113, 133, 0.2)'
  },
  { 
    id: 'ruby', 
    nameZh: '💎 深邃红宝', 
    nameEn: '💎 Crimson Deep', 
    icon: '💎', 
    border: 'from-rose-400 via-red-600 to-amber-300', 
    bg: 'bg-gradient-to-br from-[#170303] via-[#0d0101] to-[#040000]',
    gradCss: 'linear-gradient(135deg, #170303 0%, #0d0101 50%, #040000 100%)',
    borderCss: 'linear-gradient(135deg, #FDA4AF 0%, #E11D48 50%, #FBBF24 100%)',
    rimColor: '#B91C1C',
    glowColor: 'rgba(244, 63, 94, 0.2)'
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
  onToast,
}) => {
  const { lang, t } = useLanguage();
  const [selectedId, setSelectedId] = useState<number>(initialMonkeId);
  const [cardTheme, setCardTheme] = useState<CardTheme>('obsidian');

  // View Mode: 'layout' (2D Drag Editor) | '3d' (3D Interactive Physics)
  const [viewMode, setViewMode] = useState<'layout' | '3d'>('layout');
  const [selectedLayer, setSelectedLayer] = useState<keyof CardLayoutState | null>('ownerHandle');

  // Customizable Element Positions & Visibility (% coordinates)
  const [layout, setLayout] = useState<CardLayoutState>(() => ({ ...DEFAULT_LAYOUT }));

  // Content Fields
  const [cardTitle, setCardTitle] = useState<string>('NODEMONKES PASSPORT');
  const [ownerHandle, setOwnerHandle] = useState<string>('@satoshi_monke');
  const [showVerified, setShowVerified] = useState<boolean>(true);
  const [customTitle, setCustomTitle] = useState<string>('GENESIS COLLECTOR');
  const [customMotto, setCustomMotto] = useState<string>('In Monkes We Trust • Bitcoin Ordinals');

  // Dynamic Inscription QR Code Data URL
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // High-Precision 3D Physics State
  const [rotX, setRotX] = useState<number>(0);
  const [rotY, setRotY] = useState<number>(0);
  const [isAutoSpin, setIsAutoSpin] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // DOM Refs
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const cardFrontRef = useRef<HTMLDivElement>(null);

  const dragInfoRef = useRef<{
    isDraggingElement: boolean;
    layerKey: keyof CardLayoutState | null;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({
    isDraggingElement: false,
    layerKey: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0
  });

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

  const getLayerName = useCallback((key: keyof CardLayoutState): string => {
    switch (key) {
      case 'header': return t.passportLayerHeader;
      case 'badges': return t.passportLayerBadges;
      case 'avatar': return t.passportLayerAvatar;
      case 'chip': return t.passportLayerChip;
      case 'genesisTag': return t.passportLayerGenesisTag;
      case 'ownerHandle': return t.passportLayerOwnerHandle;
      case 'badgePill': return t.passportLayerBadgePill;
      case 'attributes': return t.passportLayerAttributes;
      case 'qrCode': return t.passportLayerQrCode;
      case 'footerMotto': return t.passportLayerFooterMotto;
      case 'footerVerified': return t.passportLayerFooterVerified;
    }
  }, [t]);

  const currentMonke = useMemo(() => {
    return monkes.find((m) => m.id === selectedId) || monkes[0] || {
      id: 209,
      rank: 1,
      inscription: 83795,
      block: 776487,
      attributes: { Body: 'Alien', Head: 'None', Eyes: 'None', Earring: 'None', Count: 1 },
      scriptPubkey: ''
    };
  }, [monkes, selectedId]);

  const activeAvatarSrc = getMonkeImageUrl(currentMonke.id);
  const activeTraits = {
    Body: String(currentMonke.attributes.Body || 'Alien'),
    Head: String(currentMonke.attributes.Head || 'None'),
    Eyes: String(currentMonke.attributes.Eyes || 'None'),
    Earring: String(currentMonke.attributes.Earring || 'None'),
    Count: Number(currentMonke.attributes.Count || 4),
  };

  // Generate Inscription QR Code dynamically
  useEffect(() => {
    const inscUrl = `https://ordinals.com/inscription/${currentMonke.inscription}`;
    QRCode.toDataURL(inscUrl, {
      margin: 1,
      color: {
        dark: '#FFFFFF',
        light: '#00000000',
      },
      errorCorrectionLevel: 'M'
    }).then((data) => {
      setQrDataUrl(data);
    }).catch((e) => {
      console.warn('QR Code generation error:', e);
    });
  }, [currentMonke.inscription]);

  // Tier Rating
  const tier = useMemo(() => {
    const r = currentMonke.rank || 5000;
    if (r <= 50) return { label: 'SSS TIER', color: 'text-amber-300 bg-amber-500/20 border-amber-400' };
    if (r <= 200) return { label: 'SS TIER', color: 'text-purple-300 bg-purple-500/20 border-purple-400' };
    if (r <= 1000) return { label: 'S TIER', color: 'text-cyan-300 bg-cyan-500/20 border-cyan-400' };
    return { label: 'A TIER', color: 'text-emerald-300 bg-emerald-500/20 border-emerald-400' };
  }, [currentMonke.rank]);

  // Physics Loop (Only in 3D Mode)
  useEffect(() => {
    const updatePhysics = () => {
      if (viewMode === '3d' && !isDraggingRef.current) {
        if (isAutoSpin) {
          setRotY((prev) => (prev + 0.85) % 360);
        } else {
          if (Math.abs(physicsRef.current.vx) > 0.01 || Math.abs(physicsRef.current.vy) > 0.01) {
            setRotY((prev) => prev + physicsRef.current.vx);
            setRotX((prev) => {
              const next = prev - physicsRef.current.vy;
              return Math.max(-75, Math.min(75, next));
            });
            physicsRef.current.vx *= 0.94;
            physicsRef.current.vy *= 0.94;
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
  }, [viewMode, isAutoSpin]);

  // Reset to default layout
  const handleResetLayout = () => {
    setLayout({ ...DEFAULT_LAYOUT });
    onToast(t.passportResetToast, t.passportResetToastDesc, 'info');
  };

  // Toggle Visibility for any Layer
  const toggleLayerVisibility = (layerKey: keyof CardLayoutState) => {
    setLayout((prev) => {
      const nextVisible = !prev[layerKey].visible;
      const layerTitle = getLayerName(layerKey);
      onToast(
        nextVisible ? (lang === 'zh' ? `已显示: ${layerTitle}` : `Shown: ${layerTitle}`) : (lang === 'zh' ? `已删除/隐藏: ${layerTitle}` : `Hidden: ${layerTitle}`),
        nextVisible ? (lang === 'zh' ? '元素已恢复显示' : 'Layer restored') : (lang === 'zh' ? '卡面已精简，导出时不包含此元素' : 'Layer will not be included in export'),
        'info'
      );
      return {
        ...prev,
        [layerKey]: {
          ...prev[layerKey],
          visible: nextVisible
        }
      };
    });
  };

  // Element Dragging Handler in 2D Layout Mode
  const startElementDrag = (layerKey: keyof CardLayoutState, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLayer(layerKey);
    dragInfoRef.current = {
      isDraggingElement: true,
      layerKey,
      startX: e.clientX,
      startY: e.clientY,
      origX: layout[layerKey].x,
      origY: layout[layerKey].y
    };
  };

  // Stage Handlers
  const handleStageMouseDown = (e: React.MouseEvent) => {
    if (viewMode === '3d') {
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
    }
  };

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragInfoRef.current.isDraggingElement && dragInfoRef.current.layerKey && cardContainerRef.current) {
      const cardRect = cardContainerRef.current.getBoundingClientRect();
      const dxPx = e.clientX - dragInfoRef.current.startX;
      const dyPx = e.clientY - dragInfoRef.current.startY;
      const dxPct = (dxPx / cardRect.width) * 100;
      const dyPct = (dyPx / cardRect.height) * 100;

      const layerKey = dragInfoRef.current.layerKey;
      const newX = Math.round(Math.max(-10, Math.min(95, dragInfoRef.current.origX + dxPct)));
      const newY = Math.round(Math.max(-10, Math.min(95, dragInfoRef.current.origY + dyPct)));

      setLayout((prev) => ({
        ...prev,
        [layerKey]: {
          ...prev[layerKey],
          x: newX,
          y: newY
        }
      }));
      return;
    }

    if (viewMode === '3d' && isDraggingRef.current) {
      const now = performance.now();
      const dt = Math.max(1, now - physicsRef.current.lastTime);
      const dx = e.clientX - physicsRef.current.lastX;
      const dy = e.clientY - physicsRef.current.lastY;

      setRotY((prev) => prev + dx * 0.45);
      setRotX((prev) => Math.max(-75, Math.min(75, prev - dy * 0.45)));

      physicsRef.current = {
        vx: (dx / dt) * 10,
        vy: (dy / dt) * 10,
        lastX: e.clientX,
        lastY: e.clientY,
        lastTime: now,
      };
    }
  };

  const handleStageMouseUp = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
    dragInfoRef.current.isDraggingElement = false;
  };

  // Acrobatic 360 Flip
  const handleAcrobaticFlip = () => {
    setViewMode('3d');
    setIsAutoSpin(false);
    physicsRef.current.vx = 16;
    physicsRef.current.vy = 4;
  };

  // EXPORT 1: 100% Pure WYSIWYG Ultra-HD 4K Collectible Card PNG (Direct DOM Capture at 4x DPI)
  const handleExport2DCardPng = useCallback(async () => {
    if (!cardFrontRef.current) return;
    try {
      setIsExporting(true);
      
      const prevSelected = selectedLayer;
      setSelectedLayer(null);
      await new Promise((r) => setTimeout(r, 60));

      const dataUrl = await toPng(cardFrontRef.current, {
        pixelRatio: 4,
        quality: 1,
        cacheBust: true,
      });

      setSelectedLayer(prevSelected);

      const link = document.createElement('a');
      link.download = `NodeMonke_${currentMonke.id}_4K_Passport_${cardTheme}.png`;
      link.href = dataUrl;
      link.click();

      confetti({ particleCount: 70, spread: 70, origin: { y: 0.8 } });
      onToast(t.passportExportSuccess, t.passportExportSuccessDesc, 'success');
    } catch (e: any) {
      console.error('WYSIWYG Export error:', e);
      onToast(lang === 'zh' ? '导出失败' : 'Export Failed', e?.message || 'Please try again', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [currentMonke, cardTheme, selectedLayer, t, lang, onToast]);

  // EXPORT 2: Standalone Interactive 3D HTML Generator
  const handleExport3DHtml = useCallback(async () => {
    try {
      setIsExporting(true);
      const activeThemeObj = THEMES.find((t) => t.id === cardTheme) || THEMES[0];

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
<html lang="${lang}">
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
    .floor-shadow {
      position: absolute;
      bottom: -45px;
      width: 80%;
      height: 44px;
      background: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 80%);
      border-radius: 50%;
      filter: blur(16px);
      pointer-events: none;
      transform: rotateX(80deg);
    }
    .card-wrap {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      will-change: transform;
    }
    .card-rim {
      position: absolute;
      inset: 0;
      border-radius: 28px;
      background: ${activeThemeObj.rimColor};
      transform: translateZ(0px);
      box-shadow: 0 35px 90px rgba(0,0,0,0.95), 0 0 30px rgba(0,0,0,0.8);
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
    .card-front { transform: translateZ(8px); }
    .card-back { transform: rotateY(180deg) translateZ(8px); }
    .card-inner {
      width: 100%;
      height: 100%;
      border-radius: 22px;
      background: ${activeThemeObj.gradCss};
      padding: 20px;
      position: relative;
      overflow: hidden;
      transform-style: preserve-3d;
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.18), inset 0 -1px 2px rgba(0,0,0,0.8);
    }
    .sheen {
      position: absolute;
      inset: 0;
      border-radius: 22px;
      pointer-events: none;
      background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.02) 100%);
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.8);
      z-index: 30;
      transform: translateZ(2px);
    }
    .header-box {
      position: absolute;
      left: ${layout.header.x}%;
      top: ${layout.header.y}%;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
      font-size: 14px;
      transform: scale(${layout.header.scale / 100}) translateZ(20px);
      transform-origin: top left;
    }
    .badges-box {
      position: absolute;
      left: ${layout.badges.x}%;
      top: ${layout.badges.y}%;
      display: flex;
      align-items: center;
      gap: 6px;
      transform: scale(${layout.badges.scale / 100}) translateZ(20px);
      transform-origin: top left;
    }
    .avatar-box {
      position: absolute;
      left: ${layout.avatar.x}%;
      top: ${layout.avatar.y}%;
      width: 140px;
      height: 140px;
      border-radius: 20px;
      background: #080a0f;
      border: 1px solid rgba(255,255,255,0.22);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.9), 0 15px 35px rgba(0,0,0,0.85);
      transform: scale(${layout.avatar.scale / 100}) translateZ(36px);
      transform-origin: top left;
    }
    .chip-box {
      position: absolute;
      left: ${layout.chip.x}%;
      top: ${layout.chip.y}%;
      width: 38px;
      height: 26px;
      border-radius: 5px;
      background: linear-gradient(135deg, #FDE68A 0%, #D97706 50%, #B45309 100%);
      border: 1px solid rgba(255,255,255,0.6);
      transform: scale(${layout.chip.scale / 100}) translateZ(24px);
      transform-origin: top left;
    }
    .genesis-tag {
      position: absolute;
      left: ${layout.genesisTag.x}%;
      top: ${layout.genesisTag.y}%;
      padding: 2px 8px;
      border-radius: 5px;
      font-size: 10px;
      font-weight: 800;
      background: rgba(245,158,11,0.15);
      border: 1px solid rgba(245,158,11,0.35);
      color: #FDE68A;
      transform: scale(${layout.genesisTag.scale / 100}) translateZ(24px);
      transform-origin: top left;
    }
    .handle-box {
      position: absolute;
      left: ${layout.ownerHandle.x}%;
      top: ${layout.ownerHandle.y}%;
      font-size: 20px;
      font-weight: 900;
      display: flex;
      align-items: center;
      gap: 6px;
      transform: scale(${layout.ownerHandle.scale / 100}) translateZ(26px);
      transform-origin: top left;
    }
    .pill-box {
      position: absolute;
      left: ${layout.badgePill.x}%;
      top: ${layout.badgePill.y}%;
      padding: 3px 10px;
      border-radius: 6px;
      background: rgba(245,158,11,0.25);
      border: 1px solid rgba(245,158,11,0.5);
      color: #FDE68A;
      font-size: 11px;
      font-weight: 800;
      transform: scale(${layout.badgePill.scale / 100}) translateZ(24px);
      transform-origin: top left;
    }
    .attr-box {
      position: absolute;
      left: ${layout.attributes.x}%;
      top: ${layout.attributes.y}%;
      font-size: 12px;
      color: #94A3B8;
      display: flex;
      flex-direction: column;
      gap: 3px;
      transform: scale(${layout.attributes.scale / 100}) translateZ(24px);
      transform-origin: top left;
    }
    .attr-box strong { color: #F8FAFC; }
    .motto-box {
      position: absolute;
      left: ${layout.footerMotto.x}%;
      top: ${layout.footerMotto.y}%;
      font-size: 11px;
      color: #94A3B8;
      font-style: italic;
      transform: scale(${layout.footerMotto.scale / 100}) translateZ(18px);
      transform-origin: top left;
    }
    .ver-box {
      position: absolute;
      left: ${layout.footerVerified.x}%;
      top: ${layout.footerVerified.y}%;
      font-size: 11px;
      color: #FBBF24;
      font-weight: 900;
      transform: scale(${layout.footerVerified.scale / 100}) translateZ(18px);
      transform-origin: top left;
    }
    .controls { position: absolute; bottom: 20px; display: flex; gap: 8px; z-index: 100; }
    .btn {
      background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
      color: #FFFFFF; padding: 8px 16px; border-radius: 12px; font-size: 12px;
      font-weight: 800; cursor: pointer; backdrop-filter: blur(12px);
      transition: all 0.2s;
    }
    .btn:hover { background: rgba(255,255,255,0.22); transform: translateY(-2px); }
  </style>
</head>
<body>
  <div class="stage" id="stage">
    <div class="card-wrap" id="cardWrap">
      <div class="card-rim"></div>
      <div class="card-face card-front">
        <div class="card-inner">
          <div class="sheen"></div>
          
          ${layout.header.visible ? `
          <div class="header-box">
            <img src="${NODE_STRATEGY_LOGO}" alt="Logo" style="width:20px;height:20px;object-fit:contain;image-rendering:pixelated;">
            <span>${cardTitle}</span>
          </div>` : ''}

          ${layout.badges.visible ? `
          <div class="badges-box">
            <span style="padding:2px 8px;border-radius:6px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);font-size:10px;font-weight:bold;">Rank #${currentMonke.rank || 'N/A'}</span>
            <span style="padding:2px 8px;border-radius:99px;background:rgba(245,158,11,0.25);border:1px solid #FBBF24;color:#FDE68A;font-size:10px;font-weight:900;">${tier.label}</span>
          </div>` : ''}

          ${layout.avatar.visible ? `
          <div class="avatar-box">
            <span style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.9);padding:2px 6px;border-radius:4px;font-size:9px;border:1px solid rgba(255,255,255,0.2)">#${currentMonke.id}</span>
            <img src="${avatarBase64}" alt="Avatar" style="width:85%;height:85%;object-fit:contain;image-rendering:pixelated;">
          </div>` : ''}

          ${layout.chip.visible ? '<div class="chip-box"></div>' : ''}
          ${layout.genesisTag.visible ? '<div class="genesis-tag">GENESIS 10K</div>' : ''}

          ${layout.ownerHandle.visible ? `
          <div class="handle-box">
            <span>${ownerHandle}</span>
            ${showVerified ? '<span style="color:#38BDF8;font-size:16px;">✓</span>' : ''}
          </div>` : ''}

          ${layout.badgePill.visible ? `<div class="pill-box">${customTitle}</div>` : ''}

          ${layout.attributes.visible ? `
          <div class="attr-box">
            <div>Inscription: <strong>#${currentMonke.inscription}</strong></div>
            <div>Block Height: <strong>#${currentMonke.block}</strong></div>
            <div>Traits: <strong>${activeTraits.Count || 4} Parts</strong></div>
          </div>` : ''}

          ${layout.qrCode.visible && qrDataUrl ? `
          <div style="position:absolute;left:${layout.qrCode.x}%;top:${layout.qrCode.y}%;width:64px;border-radius:10px;background:rgba(0,0,0,0.85);border:1px solid rgba(245,158,11,0.4);display:flex;flex-direction:column;align-items:center;padding:5px;box-shadow:0 10px 25px rgba(0,0,0,0.8);transform:scale(${layout.qrCode.scale / 100}) translateZ(28px);transform-origin:top left;">
            <img src="${qrDataUrl}" alt="QR" style="width:100%;aspect-ratio:1;object-fit:contain;">
            <span style="font-size:6px;color:#FDE68A;font-weight:bold;margin-top:2px;">SCAN TO VERIFY</span>
          </div>` : ''}

          ${layout.footerMotto.visible ? `<div class="motto-box">"${customMotto}"</div>` : ''}
          ${layout.footerVerified.visible ? `<div class="ver-box">ORDINALS VERIFIED</div>` : ''}
        </div>
      </div>
      <div class="card-face card-back">
        <div class="card-inner">
          <div style="font-size:13px;font-weight:bold;color:#FBBF24;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px;">AUTHENTICATED ORDINALS INSCRIPTION</div>
          <div style="margin:20px 0;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;">
            <div style="background:rgba(255,255,255,0.06);padding:8px;border-radius:8px;">Body: <strong>${activeTraits.Body}</strong></div>
            <div style="background:rgba(255,255,255,0.06);padding:8px;border-radius:8px;">Head: <strong>${activeTraits.Head}</strong></div>
            <div style="background:rgba(255,255,255,0.06);padding:8px;border-radius:8px;">Eyes: <strong>${activeTraits.Eyes}</strong></div>
            <div style="background:rgba(255,255,255,0.06);padding:8px;border-radius:8px;">Earring: <strong>${activeTraits.Earring}</strong></div>
          </div>
          <div style="font-size:10px;color:#94A3B8;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;display:flex;justify-content:space-between;">
            <span>GENESIS BLOCK #776487</span>
            <span style="color:#34D399;font-weight:bold;">100% ON-CHAIN</span>
          </div>
        </div>
      </div>
    </div>
    <div class="floor-shadow" id="floorShadow"></div>
  </div>
  <div class="controls">
    <button class="btn" onclick="setAngle(0, 0)">🎯 ${t.passportAngleFront}</button>
    <button class="btn" onclick="setAngle(0, 180)">🔄 ${t.passportAngleBack}</button>
    <button class="btn" onclick="setAngle(15, 35)">📐 ${t.passportAngleTop}</button>
    <button class="btn" onclick="flipAcrobatic()">💫 ${t.passportAngleFlip}</button>
    <button class="btn" onclick="toggleAutoSpin()">🌀 ${t.passportAngleAuto}</button>
  </div>
  <script>
    let rotX = 0, rotY = 0, vx = 0, vy = 0, lastX = 0, lastY = 0, lastTime = 0, isDragging = false, isAutoSpin = false;
    const card = document.getElementById('cardWrap');
    const stage = document.getElementById('stage');
    const floorShadow = document.getElementById('floorShadow');

    function updateCard() {
      card.style.transform = "rotateX(" + rotX + "deg) rotateY(" + rotY + "deg)";
      const shadowScale = Math.abs(Math.cos(rotY * Math.PI / 180));
      floorShadow.style.transform = "rotateX(80deg) scale(" + (0.5 + shadowScale * 0.5) + ")";
    }

    function physicsLoop() {
      if (!isDragging) {
        if (isAutoSpin) {
          rotY = (rotY + 0.85) % 360;
          updateCard();
        } else if (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01) {
          rotY += vx;
          rotX = Math.max(-75, Math.min(75, rotX - vy));
          vx *= 0.94;
          vy *= 0.94;
          updateCard();
        }
      }
      requestAnimationFrame(physicsLoop);
    }
    requestAnimationFrame(physicsLoop);

    stage.addEventListener('mousedown', function(e) {
      isDragging = true; isAutoSpin = false; vx = 0; vy = 0;
      lastX = e.clientX; lastY = e.clientY; lastTime = performance.now();
    });
    window.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dx = e.clientX - lastX; const dy = e.clientY - lastY;
      rotY += dx * 0.45; rotX = Math.max(-75, Math.min(75, rotX - dy * 0.45));
      vx = (dx / dt) * 10; vy = (dy / dt) * 10;
      lastX = e.clientX; lastY = e.clientY; lastTime = now;
      updateCard();
    });
    window.addEventListener('mouseup', function() { isDragging = false; });
    function setAngle(x, y) { isAutoSpin = false; rotX = x; rotY = y; vx = 0; vy = 0; updateCard(); }
    function flipAcrobatic() { isAutoSpin = false; vx = 16; vy = 4; }
    function toggleAutoSpin() { isAutoSpin = !isAutoSpin; }
  </script>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `NodeMonke_${currentMonke.id}_3D_Custom_Passport.html`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);

      confetti({ particleCount: 75, spread: 75, origin: { y: 0.8 } });
      onToast(t.passportHtmlExportSuccess, t.passportHtmlExportSuccessDesc, 'success');
    } catch (e: any) {
      console.error('Export 3D HTML error:', e);
      onToast(lang === 'zh' ? '导出 3D 网页失败' : 'Export 3D HTML Failed', e?.message || 'Please try again', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [cardTheme, cardTitle, currentMonke, tier, ownerHandle, showVerified, customTitle, customMotto, activeAvatarSrc, activeTraits, layout, qrDataUrl, t, lang, onToast]);

  const activeThemeObj = THEMES.find((th) => th.id === cardTheme) || THEMES[0];

  return (
    <div className="min-h-[calc(100vh-140px)] w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6 select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-black/60 border border-amber-500/40 flex items-center justify-center p-1.5 shadow-lg">
              <img src={NODE_STRATEGY_LOGO} alt="Node Monke Logo" className="w-full h-full object-contain pixelated" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {t.passportTitle}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            {t.passportSub}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport2DCardPng}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-black font-mono font-extrabold text-xs transition-all active:scale-95 shadow-lg shadow-amber-500/20"
            title={t.passportExportPng}
          >
            <Download className="w-4 h-4 text-black" />
            <span>{t.passportExportPng}</span>
          </button>

          <button
            onClick={handleExport3DHtml}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs transition-all active:scale-95 border border-white/10 shadow-md"
            title={t.passportExportHtml}
          >
            <FileCode className="w-4 h-4 text-amber-300" />
            <span>{t.passportExportHtml}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Stage Container */}
        <div 
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onMouseLeave={handleStageMouseUp}
          className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-2xl relative min-h-[620px] overflow-hidden"
        >
          
          {/* Subtle Ambient Depth */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[320px] rounded-full blur-[120px] pointer-events-none opacity-30 transition-colors duration-500" 
            style={{ backgroundColor: activeThemeObj.glowColor }}
          />

          {/* Mode Switch Bar */}
          <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-30">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs font-mono">
              <button
                onClick={() => { setViewMode('layout'); setRotX(0); setRotY(0); setIsAutoSpin(false); }}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  viewMode === 'layout' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
                )}
              >
                <Move className="w-3.5 h-3.5" />
                <span>{t.passportModeLayout}</span>
              </button>
              <button
                onClick={() => { setViewMode('3d'); setRotX(15); setRotY(32); }}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  viewMode === '3d' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                )}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{t.passportMode3d}</span>
              </button>
            </div>

            {/* 3D Angle Quick Toggles (If in 3D Mode) */}
            {viewMode === '3d' ? (
              <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs font-mono">
                <button
                  onClick={() => { setIsAutoSpin(false); setRotX(0); setRotY(0); }}
                  className={clsx('px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all', rotX === 0 && rotY === 0 ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white')}
                >
                  {t.passportAngleFront}
                </button>
                <button
                  onClick={() => { setIsAutoSpin(false); setRotX(0); setRotY(180); }}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white"
                >
                  {t.passportAngleBack}
                </button>
                <button
                  onClick={() => { setIsAutoSpin(false); setRotX(15); setRotY(35); }}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white"
                >
                  {t.passportAngleTop}
                </button>
                <button
                  onClick={handleAcrobaticFlip}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-0.5"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{t.passportAngleFlip}</span>
                </button>
                <button
                  onClick={() => setIsAutoSpin((s) => !s)}
                  className={clsx('px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-0.5', isAutoSpin ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white')}
                >
                  <RotateCw className={clsx('w-3 h-3', isAutoSpin ? 'animate-spin' : '')} />
                  <span>{t.passportAngleAuto}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleResetLayout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-mono font-bold border border-white/10 transition-all active:scale-95"
                title={t.passportResetLayout}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.passportResetLayout}</span>
              </button>
            )}
          </div>

          {/* Interactive Card Stage */}
          <div 
            ref={cardContainerRef}
            onMouseDown={handleStageMouseDown}
            className={clsx(
              'relative w-full max-w-[560px] aspect-[1.58/1] select-none my-auto mt-14 mb-8 flex items-center justify-center transition-all',
              viewMode === '3d' ? 'perspective-[1400px] cursor-grab active:cursor-grabbing' : 'cursor-default'
            )}
          >
            {/* Ground Shadow in 3D Mode */}
            {viewMode === '3d' && (
              <div 
                className="absolute -bottom-10 w-[82%] h-10 rounded-full blur-xl pointer-events-none transition-transform duration-100"
                style={{
                  background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 80%)',
                  transform: `rotateX(80deg) scale(${0.5 + Math.abs(Math.cos(rotY * Math.PI / 180)) * 0.5})`,
                }}
              />
            )}

            <motion.div
              animate={{
                rotateX: viewMode === '3d' ? rotX : 0,
                rotateY: viewMode === '3d' ? rotY : 0,
              }}
              transition={{ duration: 0 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative w-full h-full will-change-transform"
            >
              
              {/* Card Physical Edge Rims in 3D */}
              {viewMode === '3d' && (
                <>
                  <div 
                    className="absolute inset-0 rounded-[28px]"
                    style={{ 
                      backgroundColor: activeThemeObj.rimColor,
                      transform: 'translateZ(-4px)',
                      boxShadow: `0 35px 95px rgba(0,0,0,0.95), 0 0 30px rgba(0,0,0,0.8)`
                    }}
                  />
                  <div 
                    className="absolute inset-0 rounded-[28px]"
                    style={{ 
                      backgroundColor: activeThemeObj.rimColor,
                      transform: 'translateZ(0px)'
                    }}
                  />
                  <div 
                    className="absolute inset-0 rounded-[28px]"
                    style={{ 
                      backgroundColor: activeThemeObj.rimColor,
                      transform: 'translateZ(4px)'
                    }}
                  />
                </>
              )}

              {/* FRONT FACE (Direct WYSIWYG Capture Target) */}
              <div 
                ref={cardFrontRef}
                className={clsx('absolute inset-0 rounded-[28px] p-1.5 bg-gradient-to-br shadow-2xl', activeThemeObj.border)}
                style={{ 
                  transform: viewMode === '3d' ? 'translateZ(10px)' : 'none',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div 
                  className={clsx('w-full h-full rounded-[22px] relative overflow-hidden', activeThemeObj.bg)}
                  style={{ 
                    transformStyle: 'preserve-3d',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.18), inset 0 -1px 3px rgba(0,0,0,0.9), inset 0 0 40px rgba(0,0,0,0.6)'
                  }}
                >
                  
                  {/* Subtle Satin Brushed Metal Reflection Layer */}
                  <div
                    className="absolute inset-0 pointer-events-none rounded-[22px]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 45%, rgba(255,255,255,0.02) 100%)',
                      transform: 'translateZ(2px)'
                    }}
                  />

                  {/* Header Divider Line */}
                  <div className="absolute left-[4%] right-[4%] top-[14%] h-[1px] bg-white/10 pointer-events-none" />
                  
                  {/* Footer Divider Line */}
                  <div className="absolute left-[4%] right-[4%] bottom-[12%] h-[1px] bg-white/10 pointer-events-none" />

                  {/* 1. Header (Draggable & Deletable) */}
                  {layout.header.visible && (
                    <div 
                      onMouseDown={(e) => startElementDrag('header', e)}
                      onClick={() => setSelectedLayer('header')}
                      style={{ 
                        left: `${layout.header.x}%`, 
                        top: `${layout.header.y}%`,
                        transform: `scale(${layout.header.scale / 100}) translateZ(20px)`,
                        transformOrigin: 'top left'
                      }}
                      className={clsx(
                        'absolute z-30 flex items-center gap-2 cursor-move p-1 rounded-lg transition-all',
                        selectedLayer === 'header' && viewMode === 'layout' ? 'ring-2 ring-amber-400 bg-amber-400/10' : 'hover:ring-1 hover:ring-white/30'
                      )}
                    >
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-black/50 border border-amber-400/50 flex items-center justify-center p-0.5 shadow-sm overflow-hidden">
                        <img src={NODE_STRATEGY_LOGO} alt="Node Monke Logo" className="w-full h-full object-contain pixelated pointer-events-none" />
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-white font-mono tracking-wider whitespace-nowrap drop-shadow-sm">
                        {cardTitle}
                      </span>
                    </div>
                  )}

                  {/* 2. Badges: Rank & Tier (Draggable & Deletable) */}
                  {layout.badges.visible && (
                    <div 
                      onMouseDown={(e) => startElementDrag('badges', e)}
                      onClick={() => setSelectedLayer('badges')}
                      style={{ 
                        left: `${layout.badges.x}%`, 
                        top: `${layout.badges.y}%`,
                        transform: `scale(${layout.badges.scale / 100}) translateZ(20px)`,
                        transformOrigin: 'top left'
                      }}
                      className={clsx(
                        'absolute z-30 flex items-center gap-1.5 cursor-move p-1 rounded-lg transition-all',
                        selectedLayer === 'badges' && viewMode === 'layout' ? 'ring-2 ring-amber-400 bg-amber-400/10' : 'hover:ring-1 hover:ring-white/30'
                      )}
                    >
                      <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/25 whitespace-nowrap shadow-sm">
                        Rank #{currentMonke.rank || 'N/A'}
                      </span>
                      <span className={clsx('px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border shadow-sm whitespace-nowrap', tier.color)}>
                        {tier.label}
                      </span>
                    </div>
                  )}

                  {/* 3. Avatar Box (Draggable & Deletable) */}
                  {layout.avatar.visible && (
                    <div 
                      onMouseDown={(e) => startElementDrag('avatar', e)}
                      onClick={() => setSelectedLayer('avatar')}
                      style={{ 
                        left: `${layout.avatar.x}%`, 
                        top: `${layout.avatar.y}%`,
                        transform: `scale(${layout.avatar.scale / 100}) translateZ(36px)`,
                        transformOrigin: 'top left'
                      }}
                      className={clsx(
                        'absolute z-30 w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-[#080a0f] border border-white/20 p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9),0_18px_40px_rgba(0,0,0,0.9)] cursor-move group overflow-hidden transition-all',
                        selectedLayer === 'avatar' && viewMode === 'layout' ? 'ring-2 ring-amber-400' : 'hover:ring-1 hover:ring-white/40'
                      )}
                    >
                      <img
                        src={activeAvatarSrc}
                        alt={`NodeMonke #${currentMonke.id}`}
                        style={{ transform: 'translateZ(12px)' }}
                        className="w-full h-full object-contain pixelated filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] pointer-events-none"
                      />
                      <div 
                        style={{ transform: 'translateZ(16px)' }}
                        className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/90 text-[9px] font-mono text-white font-bold border border-white/20"
                      >
                        #{currentMonke.id}
                      </div>
                    </div>
                  )}

                  {/* 4. 24K Gold Chip (Draggable & Deletable) */}
                  {layout.chip.visible && (
                    <div 
                      onMouseDown={(e) => startElementDrag('chip', e)}
                      onClick={() => setSelectedLayer('chip')}
                      style={{ 
                        left: `${layout.chip.x}%`, 
                        top: `${layout.chip.y}%`,
                        transform: `scale(${layout.chip.scale / 100}) translateZ(24px)`,
                        transformOrigin: 'top left'
                      }}
                      className={clsx(
                        'absolute z-30 w-9 h-6 rounded-md bg-gradient-to-br from-amber-200 via-amber-500 to-amber-700 border border-amber-200/60 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.8)] cursor-move relative overflow-hidden transition-all',
                        selectedLayer === 'chip' && viewMode === 'layout' ? 'ring-2 ring-amber-400' : 'hover:ring-1 hover:ring-white/40'
                      )}
                    >
                      <div className="w-full h-[1px] bg-amber-900/70 absolute top-1/2 -translate-y-1/2" />
                      <div className="h-full w-[1px] bg-amber-900/70 absolute left-1/3" />
                      <div className="h-full w-[1px] bg-amber-900/70 absolute left-2/3" />
                    </div>
                  )}

                  {/* 5. GENESIS 10K Tag (Draggable & Deletable) */}
                  {layout.genesisTag.visible && (
                    <div 
                      onMouseDown={(e) => startElementDrag('genesisTag', e)}
                      onClick={() => setSelectedLayer('genesisTag')}
                      style={{ 
                        left: `${layout.genesisTag.x}%`, 
                        top: `${layout.genesisTag.y}%`,
                        transform: `scale(${layout.genesisTag.scale / 100}) translateZ(24px)`,
                        transformOrigin: 'top left'
                      }}
                      className={clsx(
                        'absolute z-30 text-[9px] font-mono text-amber-400/90 font-bold border border-amber-400/30 px-2 py-0.5 rounded bg-amber-500/10 cursor-move whitespace-nowrap transition-all shadow-sm',
                        selectedLayer === 'genesisTag' && viewMode === 'layout' ? 'ring-2 ring-amber-400 bg-amber-400/20' : 'hover:ring-1 hover:ring-white/40'
                      )}
                    >
                      GENESIS 10K
                    </div>
                  )}

                  {/* 6. Owner Handle (Draggable & Deletable) */}
                  {layout.ownerHandle.visible && (
                    <div 
                      onMouseDown={(e) => startElementDrag('ownerHandle', e)}
                      onClick={() => setSelectedLayer('ownerHandle')}
                      style={{ 
                        left: `${layout.ownerHandle.x}%`, 
                        top: `${layout.ownerHandle.y}%`,
                        transform: `scale(${layout.ownerHandle.scale / 100}) translateZ(26px)`,
                        transformOrigin: 'top left'
                      }}
                      className={clsx(
                        'absolute z-30 flex items-center gap-1.5 cursor-move p-0.5 rounded-lg whitespace-nowrap transition-all',
                        selectedLayer === 'ownerHandle' && viewMode === 'layout' ? 'ring-2 ring-amber-400 bg-amber-400/10' : 'hover:ring-1 hover:ring-white/30'
                      )}
                    >
                      <span className="text-sm sm:text-base font-black text-white font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {ownerHandle}
                      </span>
                      {showVerified && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />}
                    </div>
                  )}

                  {/* 7. Custom Badge Pill (Draggable & Deletable) */}
                  {layout.badgePill.visible && (
                    <div 
                      onMouseDown={(e) => startElementDrag('badgePill', e)}
                      onClick={() => setSelectedLayer('badgePill')}
                      style={{ 
                        left: `${layout.badgePill.x}%`, 
                        top: `${layout.badgePill.y}%`,
                        transform: `scale(${layout.badgePill.scale / 100}) translateZ(24px)`,
                        transformOrigin: 'top left'
                      }}
                      className={clsx(
                        'absolute z-30 cursor-move transition-all',
                        selectedLayer === 'badgePill' && viewMode === 'layout' ? 'ring-2 ring-amber-400 rounded-lg' : 'hover:ring-1 hover:ring-white/30 rounded-lg'
                      )}
                    >
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-[11px] font-mono font-bold shadow-sm whitespace-nowrap">
                        {customTitle}
                      </span>
                    </div>
                  )}

                  {/* 8. Attributes Rows (Draggable & Deletable) */}
                  {layout.attributes.visible && (
                    <div 
                      onMouseDown={(e) => startElementDrag('attributes', e)}
                      onClick={() => setSelectedLayer('attributes')}
                      style={{ 
                        left: `${layout.attributes.x}%`, 
                        top: `${layout.attributes.y}%`,
                        transform: `scale(${layout.attributes.scale / 100}) translateZ(24px)`,
                        transformOrigin: 'top left'
                      }}
                      className={clsx(
                        'absolute z-30 text-[10px] sm:text-[11px] font-mono text-slate-300 flex flex-col gap-0.5 cursor-move p-1 rounded-lg whitespace-nowrap transition-all',
                        selectedLayer === 'attributes' && viewMode === 'layout' ? 'ring-2 ring-amber-400 bg-amber-400/10' : 'hover:ring-1 hover:ring-white/30'
                      )}
                    >
                      <span className="drop-shadow-sm">Inscription: <strong className="text-white font-bold">#{currentMonke.inscription}</strong></span>
                      <span className="drop-shadow-sm">Block Height: <strong className="text-white font-bold">#{currentMonke.block}</strong></span>
                      <span className="drop-shadow-sm">Traits: <strong className="text-white font-bold">{activeTraits.Count || 4} Parts</strong></span>
                    </div>
                  )}

                  {/* 9. On-Chain Ordinals QR Code Badge (Draggable & Deletable) */}
                  {layout.qrCode.visible && (
                    <div 
                      onMouseDown={(e) => startElementDrag('qrCode', e)}
                      onClick={() => setSelectedLayer('qrCode')}
                      style={{ 
                        left: `${layout.qrCode.x}%`, 
                        top: `${layout.qrCode.y}%`,
                        transform: `scale(${layout.qrCode.scale / 100}) translateZ(28px)`,
                        transformOrigin: 'top left'
                      }}
                      className={clsx(
                        'absolute z-30 flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-black/90 border border-amber-400/35 shadow-[0_10px_25px_rgba(0,0,0,0.85)] cursor-move transition-all group',
                        selectedLayer === 'qrCode' && viewMode === 'layout' ? 'ring-2 ring-amber-400 bg-amber-400/15' : 'hover:ring-1 hover:ring-white/40'
                      )}
                      title={`https://ordinals.com/inscription/${currentMonke.inscription}`}
                    >
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Ordinals Inscription QR"
                          className="w-12 h-12 sm:w-14 sm:h-14 object-contain pointer-events-none rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/5 animate-pulse rounded" />
                      )}
                      <span className="text-[7px] sm:text-[8px] font-mono text-amber-300 font-bold mt-0.5 tracking-tight">
                        SCAN TO VERIFY
                      </span>
                    </div>
                  )}

                  {/* 10. Footer Motto (Draggable & Deletable) */}
                  {layout.footerMotto.visible && (
                    <div 
                      onMouseDown={(e) => startElementDrag('footerMotto', e)}
                      onClick={() => setSelectedLayer('footerMotto')}
                      style={{ 
                        left: `${layout.footerMotto.x}%`, 
                        top: `${layout.footerMotto.y}%`,
                        transform: `scale(${layout.footerMotto.scale / 100}) translateZ(18px)`,
                        transformOrigin: 'top left'
                      }}
                      className={clsx(
                        'absolute z-30 text-[10px] font-mono text-slate-400 italic cursor-move truncate max-w-[280px] p-0.5 rounded transition-all',
                        selectedLayer === 'footerMotto' && viewMode === 'layout' ? 'ring-2 ring-amber-400 bg-amber-400/10' : 'hover:ring-1 hover:ring-white/30'
                      )}
                    >
                      "{customMotto}"
                    </div>
                  )}

                  {/* 11. Footer Verified (Draggable & Deletable) */}
                  {layout.footerVerified.visible && (
                    <div 
                      onMouseDown={(e) => startElementDrag('footerVerified', e)}
                      onClick={() => setSelectedLayer('footerVerified')}
                      style={{ 
                        left: `${layout.footerVerified.x}%`, 
                        top: `${layout.footerVerified.y}%`,
                        transform: `scale(${layout.footerVerified.scale / 100}) translateZ(18px)`,
                        transformOrigin: 'top left'
                      }}
                      className={clsx(
                        'absolute z-30 text-[10px] font-mono text-amber-400 font-bold cursor-move whitespace-nowrap p-0.5 rounded transition-all flex items-center gap-1',
                        selectedLayer === 'footerVerified' && viewMode === 'layout' ? 'ring-2 ring-amber-400 bg-amber-400/10' : 'hover:ring-1 hover:ring-white/30'
                      )}
                    >
                      <span>ORDINALS VERIFIED</span>
                    </div>
                  )}

                </div>
              </div>

              {/* BACK FACE */}
              <div 
                className={clsx('absolute inset-0 rounded-[28px] p-1.5 bg-gradient-to-br shadow-2xl', activeThemeObj.border)}
                style={{ 
                  transform: 'rotateY(180deg) translateZ(10px)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div 
                  className={clsx('w-full h-full rounded-[22px] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden', activeThemeObj.bg)}
                  style={{ 
                    transformStyle: 'preserve-3d',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.18), inset 0 -1px 3px rgba(0,0,0,0.9)'
                  }}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 z-10">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      AUTHENTICATED ORDINALS INSCRIPTION
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      SHA256: {currentMonke.id.toString(16).padStart(8, '0')}...
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center my-auto font-mono z-10">
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
                      <div className="w-20 h-20 bg-amber-400/10 border border-amber-400/30 p-2 rounded-2xl flex flex-col items-center justify-center shadow-xl text-center">
                        <img src={NODE_STRATEGY_LOGO} alt="Node Monke Logo" className="w-10 h-10 object-contain pixelated" />
                        <span className="text-[8px] font-mono text-amber-300 font-bold mt-1">BITCOIN L1</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 text-center font-bold">100% Immutable</span>
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 z-10">
                    <span>GENESIS BLOCK #776487</span>
                    <span className="text-emerald-400 font-bold">100% ON-CHAIN</span>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
            {viewMode === 'layout' ? (
              <span>{t.passportHintLayout}</span>
            ) : (
              <span><Compass className="w-3.5 h-3.5 text-amber-400 inline mr-1" />{t.passportHint3d} X: {Math.round(rotX)}° | Y: {Math.round(rotY)}°</span>
            )}
          </div>
        </div>

        {/* Right Editor Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4 p-6 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-2xl max-h-[660px] overflow-y-auto pr-2 no-scrollbar">
          
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold font-mono text-white">{t.passportEditorTitle}</h2>
            </div>
            <button
              onClick={handleResetLayout}
              className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.passportResetLayout}</span>
            </button>
          </div>

          {/* Layer Quick Toggles (1-Click Show/Hide/Delete Any Element) */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.passportLayersTitle}</span>
              </span>
              <span className="text-[10px] text-slate-400">{t.passportLayersSub}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(DEFAULT_LAYOUT) as (keyof CardLayoutState)[]).map((key) => {
                const isVis = layout[key].visible;
                const name = getLayerName(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleLayerVisibility(key)}
                    className={clsx(
                      'px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all flex items-center gap-1 active:scale-95',
                      isVis 
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-sm'
                        : 'bg-black/40 border-white/10 text-slate-500 line-through hover:text-slate-300'
                    )}
                    title={name}
                  >
                    {isVis ? <Eye className="w-3 h-3 text-amber-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Layer Fine Tuning & Delete Action */}
          {selectedLayer && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5" />
                  <span>{t.passportSelected} <strong>{getLayerName(selectedLayer)}</strong></span>
                </span>
                
                {/* 1-Click Delete / Hide Button for currently selected layer */}
                <button
                  onClick={() => toggleLayerVisibility(selectedLayer)}
                  className={clsx(
                    'px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all flex items-center gap-1',
                    layout[selectedLayer].visible
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                  )}
                >
                  {layout[selectedLayer].visible ? <Trash2 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{layout[selectedLayer].visible ? t.passportDeleteLayer : t.passportRestoreLayer}</span>
                </button>
              </div>

              {layout[selectedLayer].visible && (
                <>
                  {/* Position Sliders */}
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-slate-300">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>{t.passportPosX}</span>
                        <span className="text-amber-400">{layout[selectedLayer].x}%</span>
                      </div>
                      <input
                        type="range"
                        min={-5}
                        max={95}
                        value={layout[selectedLayer].x}
                        onChange={(e) => setLayout((prev) => ({
                          ...prev,
                          [selectedLayer]: { ...prev[selectedLayer], x: parseInt(e.target.value, 10) }
                        }))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>{t.passportPosY}</span>
                        <span className="text-amber-400">{layout[selectedLayer].y}%</span>
                      </div>
                      <input
                        type="range"
                        min={-5}
                        max={95}
                        value={layout[selectedLayer].y}
                        onChange={(e) => setLayout((prev) => ({
                          ...prev,
                          [selectedLayer]: { ...prev[selectedLayer], y: parseInt(e.target.value, 10) }
                        }))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Scale Slider */}
                  <div className="text-[11px] font-mono text-slate-300">
                    <div className="flex justify-between mb-1">
                      <span>{t.passportScale}</span>
                      <span className="text-amber-400">{layout[selectedLayer].scale}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={160}
                      value={layout[selectedLayer].scale}
                      onChange={(e) => setLayout((prev) => ({
                        ...prev,
                        [selectedLayer]: { ...prev[selectedLayer], scale: parseInt(e.target.value, 10) }
                      }))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* 1. Pick Monke ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.passportMonkeIdLabel}</span>
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
                NodeMonke #{currentMonke.id} ({lang === 'zh' ? '铭文' : 'Insc'} #{currentMonke.inscription})
              </span>
            </div>
          </div>

          {/* 2. On-Chain Inscription QR Code Info */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.passportQrLabel}</span>
              </label>
              <button
                onClick={() => toggleLayerVisibility('qrCode')}
                className={clsx(
                  'text-[10px] font-mono px-2 py-0.5 rounded border transition-all flex items-center gap-1',
                  layout.qrCode.visible ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                )}
              >
                {layout.qrCode.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>{layout.qrCode.visible ? t.passportQrShow : t.passportQrHide}</span>
              </button>
            </div>
            <div className="text-[10px] font-mono text-slate-400 break-all bg-black/40 p-2 rounded-lg border border-white/5">
              https://ordinals.com/inscription/{currentMonke.inscription}
            </div>
          </div>

          {/* 3. Card Material Theme */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.passportThemeLabel}</span>
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
                  <span className="truncate text-[11px]">{lang === 'zh' ? th.nameZh.split(' ')[1] : th.nameEn.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Card Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.passportTitleLabel}</span>
            </label>
            <input
              type="text"
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400 transition-all"
              placeholder="NODEMONKES PASSPORT"
            />
          </div>

          {/* 5. Owner Handle & Verified Checkmark */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>{t.passportOwnerLabel}</span>
              </label>
              <label className="flex items-center gap-1 text-[11px] font-mono text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVerified}
                  onChange={(e) => setShowVerified(e.target.checked)}
                  className="rounded border-white/20 text-sky-500"
                />
                <span>{t.passportVerifiedLabel}</span>
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

          {/* 6. Custom Badge Pill */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.passportBadgeLabel}</span>
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
              placeholder={t.passportCustomBadgePlaceholder}
            />
          </div>

          {/* 7. Custom Motto */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.passportMottoLabel}</span>
            </label>
            <input
              type="text"
              value={customMotto}
              onChange={(e) => setCustomMotto(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400 transition-all"
              placeholder="In Monkes We Trust..."
            />
          </div>

        </div>

      </div>

    </div>
  );
};
