import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Paintbrush, 
  Download, 
  Shuffle, 
  RefreshCw, 
  Check, 
  Sparkles, 
  Gift, 
  CreditCard, 
  RotateCw, 
  Palette, 
  User, 
  Quote, 
  QrCode, 
  CheckCircle2, 
  Play, 
  Pause 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import { BODY_COLORS, PRESET_COLORS } from '../../utils/constants';
import { useLanguage } from '../../utils/i18n';

interface DiyStudioProps {
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

type SeriesType = 'normal' | 'dog' | 'block' | 'rabbit' | 'peer';
type CategoryType = 'Body' | 'Earring' | 'Eyes' | 'Head';
type BgModeType = 'transparent' | 'orange' | 'auto' | 'custom';
type DiyViewMode = 'diy' | 'gif' | 'santa' | 'passport';
type CardTheme = 'obsidian' | 'gold' | 'cyber' | 'matrix' | 'sunset';

interface TraitPart {
  value: string;
  url: string;
}

const METADATA_URL = 'https://pub-ce8a03b190984a3d99332e13b7d5e3cb.r2.dev/metadata.json';

const BASE_URLS: Record<SeriesType, string> = {
  block: 'https://pub-d7a7a960d42949efb84bea391aa90d4c.r2.dev',
  dog: 'https://pub-4d8b3f7049bb4025a6642c75eeb71c46.r2.dev',
  normal: 'https://pub-2f0821e8464b4c139f681d763393f4ee.r2.dev',
  peer: 'https://pub-026e5fdeaab545cc9c5aa34738735770.r2.dev',
  rabbit: 'https://pub-e50795db8d0d41dd942f04a8b290f95f.r2.dev',
};

const CATEGORIES: CategoryType[] = ['Body', 'Earring', 'Eyes', 'Head'];
const SPECIAL_SERIES = ['Dog', 'Peer', 'Rabbit', 'Block'];

const SERIES_COMPONENTS: Record<SeriesType, CategoryType[]> = {
  normal: ['Body', 'Earring', 'Eyes', 'Head'],
  dog: ['Body', 'Earring', 'Eyes'],
  block: ['Body', 'Earring', 'Eyes'],
  rabbit: ['Body', 'Earring', 'Eyes'],
  peer: ['Body', 'Eyes'],
};

const SERIES_BUTTONS: { id: SeriesType; zh: string; en: string }[] = [
  { id: 'normal', zh: '普通', en: 'Normal' },
  { id: 'dog', zh: '狗猴', en: 'Dog' },
  { id: 'block', zh: '方块', en: 'Block' },
  { id: 'rabbit', zh: '兔猴', en: 'Rabbit' },
  { id: 'peer', zh: '同行', en: 'Peer' },
];

const RESOLUTION_OPTIONS = [
  { label: '512px', value: 512 },
  { label: '1008px', value: 1008 },
  { label: '2048px (2K)', value: 2048 },
  { label: '4096px (4K)', value: 4096 },
];

const THEMES: { id: CardTheme; nameZh: string; nameEn: string; icon: string; border: string; bg: string }[] = [
  { id: 'obsidian', nameZh: '👑 曜石黑金', nameEn: '👑 Obsidian Gold', icon: '👑', border: 'from-amber-400 via-amber-600 to-amber-200', bg: 'bg-gradient-to-br from-[#0c0a09] via-[#1c1917] to-[#0a0a0a]' },
  { id: 'gold', nameZh: '🥇 纯金至尊', nameEn: '🥇 Pure Gold', icon: '🥇', border: 'from-yellow-300 via-amber-500 to-yellow-100', bg: 'bg-gradient-to-br from-[#1e1503] via-[#332205] to-[#120c02]' },
  { id: 'cyber', nameZh: '🟣 赛博全息', nameEn: '🟣 Cyber Holo', icon: '🟣', border: 'from-purple-400 via-cyan-400 to-pink-500', bg: 'bg-gradient-to-br from-[#0f0728] via-[#1a0b3b] to-[#080318]' },
  { id: 'matrix', nameZh: '🟢 矩阵终端', nameEn: '🟢 Matrix Green', icon: '🟢', border: 'from-emerald-400 via-green-500 to-teal-300', bg: 'bg-gradient-to-br from-[#02180c] via-[#042815] to-[#010e07]' },
  { id: 'sunset', nameZh: '🌅 暮光霞光', nameEn: '🌅 Twilight Glow', icon: '🌅', border: 'from-rose-400 via-amber-500 to-indigo-500', bg: 'bg-gradient-to-br from-[#1a081e] via-[#2c0d23] to-[#120417]' },
];

function loadCanvasImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = `${url}?t=${Date.now()}`;
  });
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export const DiyStudio: React.FC<DiyStudioProps> = ({ onToast }) => {
  const { lang, t } = useLanguage();
  const [activeSeries, setActiveSeries] = useState<SeriesType>('normal');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('Body');
  const [viewMode, setViewMode] = useState<DiyViewMode>('diy');

  const [selectedParts, setSelectedParts] = useState<Record<CategoryType, string>>({
    Body: '',
    Earring: '',
    Eyes: '',
    Head: '',
  });

  const [bgMode, setBgMode] = useState<BgModeType>('transparent');
  const [customColor, setCustomColor] = useState<string>('#310000');
  const [saveResolution, setSaveResolution] = useState<number>(1008);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // GIF Animation State
  const [isGifPlaying, setIsGifPlaying] = useState<boolean>(true);
  const [gifSpeed, setGifSpeed] = useState<number>(1.0);
  const gifCanvasRef = useRef<HTMLCanvasElement>(null);
  const gifRafRef = useRef<number | null>(null);

  // 3D Passport State
  const [cardTheme, setCardTheme] = useState<CardTheme>('obsidian');
  const [ownerHandle, setOwnerHandle] = useState<string>('@diy_collector');
  const [customTitle, setCustomTitle] = useState<string>('CUSTOM CREATOR');
  const [customMotto, setCustomMotto] = useState<string>('Custom Inscription • 100% Unique');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [sheen, setSheen] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });

  const [components, setComponents] = useState<Record<SeriesType, Record<CategoryType, TraitPart[]>>>({
    normal: { Body: [], Earring: [], Eyes: [], Head: [] },
    dog: { Body: [], Earring: [], Eyes: [], Head: [] },
    block: { Body: [], Earring: [], Eyes: [], Head: [] },
    rabbit: { Body: [], Earring: [], Eyes: [], Head: [] },
    peer: { Body: [], Earring: [], Eyes: [], Head: [] },
  });

  // Extract human-readable trait labels
  const traitNames = useMemo(() => {
    const getTraitName = (url: string) => {
      if (!url || url === 'none') return 'None';
      const file = url.split('/').pop()?.replace('.png', '') || 'None';
      return decodeURIComponent(file);
    };

    return {
      Body: getTraitName(selectedParts.Body),
      Earring: getTraitName(selectedParts.Earring),
      Eyes: getTraitName(selectedParts.Eyes),
      Head: getTraitName(selectedParts.Head),
      Count: Object.values(selectedParts).filter((p) => p && p !== 'none').length,
    };
  }, [selectedParts]);

  const currentBgColor = useMemo(() => {
    if (bgMode === 'transparent') return 'transparent';
    if (bgMode === 'orange') return '#F97316';
    if (bgMode === 'custom') return customColor;
    if (bgMode === 'auto') {
      const bodyUrl = selectedParts.Body;
      if (bodyUrl && bodyUrl !== 'none') {
        const filename = bodyUrl.split('/').pop()?.replace('.png', '').toLowerCase() || '';
        for (const [key, color] of Object.entries(BODY_COLORS)) {
          if (filename.includes(key.toLowerCase())) {
            return color;
          }
        }
      }
      return '#FFAA01';
    }
    return 'transparent';
  }, [bgMode, customColor, selectedParts.Body]);

  useEffect(() => {
    let mounted = true;

    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const res = await fetch(METADATA_URL);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const metadataList: any[] = Array.isArray(data) ? data : [data];

        const uniqueComponents: Record<CategoryType, Set<string>> = {
          Body: new Set(),
          Earring: new Set(),
          Eyes: new Set(),
          Head: new Set(),
        };

        metadataList.forEach((item) => {
          if (item.attributes) {
            CATEGORIES.forEach((category) => {
              const value = item.attributes[category];
              if (value && value !== 'None') {
                if (!(category === 'Head' && SPECIAL_SERIES.includes(value))) {
                  uniqueComponents[category].add(value);
                }
              }
            });
          }
        });

        const newComponents: Record<SeriesType, Record<CategoryType, TraitPart[]>> = {
          normal: { Body: [], Earring: [], Eyes: [], Head: [] },
          dog: { Body: [], Earring: [], Eyes: [], Head: [] },
          block: { Body: [], Earring: [], Eyes: [], Head: [] },
          rabbit: { Body: [], Earring: [], Eyes: [], Head: [] },
          peer: { Body: [], Earring: [], Eyes: [], Head: [] },
        };

        (Object.keys(BASE_URLS) as SeriesType[]).forEach((series) => {
          SERIES_COMPONENTS[series].forEach((category) => {
            const parts: TraitPart[] = Array.from(uniqueComponents[category]).map((value) => ({
              value,
              url: `${BASE_URLS[series]}/${category.toLowerCase()}/${value}.png`,
            }));

            if (['Earring', 'Eyes'].includes(category) || (category === 'Head' && series === 'normal')) {
              parts.unshift({ value: 'None', url: 'none' });
            }

            newComponents[series][category] = parts;
          });
        });

        if (!mounted) return;
        setComponents(newComponents);

        const initialParts: Record<CategoryType, string> = {
          Body: '',
          Earring: '',
          Eyes: '',
          Head: '',
        };

        SERIES_COMPONENTS.normal.forEach((cat) => {
          const parts = newComponents.normal[cat];
          const valid = parts.filter((p) => p.url !== 'none');
          if (valid.length > 0) {
            if (cat === 'Body' || Math.random() > 0.3) {
              const rand = valid[Math.floor(Math.random() * valid.length)];
              initialParts[cat] = rand.url;
            } else {
              initialParts[cat] = 'none';
            }
          }
        });

        setSelectedParts(initialParts);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching DIY metadata:', err);
        if (mounted) setLoading(false);
      }
    };

    fetchMetadata();

    return () => {
      mounted = false;
    };
  }, []);

  const selectPart = (category: CategoryType, src: string) => {
    setSelectedParts((prev) => ({
      ...prev,
      [category]: src,
    }));
  };

  const setActiveSeriesHandler = (series: SeriesType) => {
    setActiveSeries(series);
    if (!SERIES_COMPONENTS[series].includes(activeCategory)) {
      setActiveCategory('Body');
    }

    setSelectedParts({
      Body: '',
      Earring: '',
      Eyes: '',
      Head: '',
    });
  };

  const randomize = () => {
    const newParts: Record<CategoryType, string> = {
      Body: '',
      Earring: '',
      Eyes: '',
      Head: '',
    };

    SERIES_COMPONENTS[activeSeries].forEach((category) => {
      const parts = components[activeSeries][category];
      if (parts && parts.length > 0) {
        const validParts = parts.filter((item) => item.url !== 'none');
        const useNone = ['Earring', 'Eyes'].includes(category) && Math.random() < 0.2;

        if (!useNone && validParts.length > 0) {
          const randomIndex = Math.floor(Math.random() * validParts.length);
          newParts[category] = validParts[randomIndex].url;
        } else if (useNone) {
          newParts[category] = 'none';
        } else if (validParts.length > 0) {
          const randomIndex = Math.floor(Math.random() * validParts.length);
          newParts[category] = validParts[randomIndex].url;
        }
      }
    });

    setSelectedParts(newParts);
  };

  // Pixel-perfect Santa Hat & Beard Overlay Drawer
  const drawPixelSantaHat = (ctx: CanvasRenderingContext2D, size: number) => {
    const u = size / 28;
    ctx.save();
    // Red Hat Cone
    ctx.fillStyle = '#E11D48';
    ctx.fillRect(Math.round(9 * u), Math.round(2 * u), Math.round(5 * u), Math.round(2 * u));
    ctx.fillRect(Math.round(8 * u), Math.round(4 * u), Math.round(8 * u), Math.round(3 * u));
    ctx.fillRect(Math.round(7 * u), Math.round(7 * u), Math.round(12 * u), Math.round(2 * u));
    // White Fur Band
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(Math.round(6 * u), Math.round(9 * u), Math.round(15 * u), Math.round(2 * u));
    // White Pom-pom
    ctx.fillRect(Math.round(6 * u), Math.round(2 * u), Math.round(3 * u), Math.round(3 * u));
    // Festive White Beard
    ctx.fillRect(Math.round(8 * u), Math.round(17 * u), Math.round(12 * u), Math.round(4 * u));
    ctx.fillRect(Math.round(9 * u), Math.round(21 * u), Math.round(10 * u), Math.round(3 * u));
    ctx.fillRect(Math.round(11 * u), Math.round(24 * u), Math.round(6 * u), Math.round(2 * u));
    ctx.restore();
  };

  // Render Full Composite Avatar onto a Canvas
  const renderCompositeCanvas = async (size: number, addSantaHat: boolean = false): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context error');

    ctx.imageSmoothingEnabled = false;

    if (currentBgColor && currentBgColor !== 'transparent') {
      ctx.fillStyle = currentBgColor;
      ctx.fillRect(0, 0, size, size);
    }

    for (const category of CATEGORIES) {
      const imgSrc = selectedParts[category];
      if (imgSrc && imgSrc !== 'none') {
        const img = await loadCanvasImage(imgSrc);
        ctx.drawImage(img, 0, 0, size, size);
      }
    }

    // Add Santa Hat & Beard overlay if in Santa mode
    if (addSantaHat) {
      drawPixelSantaHat(ctx, size);
    }

    return canvas;
  };

  // 1. Standard PNG Export
  const saveAvatar = async () => {
    setSaving(true);
    try {
      const canvas = await renderCompositeCanvas(saveResolution, viewMode === 'santa');

      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Blob creation failed');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nodemonke_diy_${activeSeries}_${viewMode === 'santa' ? 'santa_' : ''}${saveResolution}px_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#F59E0B', '#6EE7B7'],
        });

        onToast(t.diySuccess, `${t.diySuccessDesc} (${saveResolution} × ${saveResolution})`, 'success');
        setSaving(false);
      }, 'image/png');
    } catch (err: any) {
      console.error('Save failed:', err);
      onToast(t.diySaveFailed, err.message || (lang === 'zh' ? '请重试' : 'Please retry'), 'error');
      setSaving(false);
    }
  };

  // 2. GIF Real-time 60FPS Bouncing Animation Loop
  useEffect(() => {
    if (viewMode !== 'gif') {
      if (gifRafRef.current) {
        cancelAnimationFrame(gifRafRef.current);
        gifRafRef.current = null;
      }
      return;
    }

    let active = true;
    let progress = 0;
    let lastTime = performance.now();

    const canvas = gifCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let compositeImg: HTMLImageElement | null = null;
    renderCompositeCanvas(500, false).then((c) => {
      if (!active) return;
      const img = new Image();
      img.src = c.toDataURL();
      img.onload = () => {
        compositeImg = img;
      };
    });

    const loop = (currentTime: number) => {
      if (!active) return;
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isGifPlaying) {
        progress = (progress + delta * gifSpeed * 1.5) % 1;
      }

      const size = canvas.width = 400;
      canvas.height = 400;
      ctx.imageSmoothingEnabled = false;

      ctx.clearRect(0, 0, size, size);
      if (currentBgColor && currentBgColor !== 'transparent') {
        ctx.fillStyle = currentBgColor;
        ctx.fillRect(0, 0, size, size);
      }

      if (compositeImg) {
        // Classic Squash & Stretch bouncing physics
        const pressPhase = Math.max(0, Math.sin(progress * Math.PI * 2));
        const bounceY = -Math.abs(Math.sin(progress * Math.PI)) * 24;
        const scaleX = 1 + pressPhase * 0.08;
        const scaleY = 1 - pressPhase * 0.08;

        ctx.save();
        ctx.translate(size / 2, size / 2 + bounceY);
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(compositeImg, -160, -160, 320, 320);
        ctx.restore();
      }

      gifRafRef.current = requestAnimationFrame(loop);
    };

    gifRafRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (gifRafRef.current) {
        cancelAnimationFrame(gifRafRef.current);
        gifRafRef.current = null;
      }
    };
  }, [viewMode, selectedParts, currentBgColor, isGifPlaying, gifSpeed]);

  // 3. 3D Passport 1:1 Canvas Exporter for DIY Monke
  const handleExportPassport = async () => {
    try {
      setSaving(true);
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

      // Draw helper
      const drawRRect = (x: number, y: number, rw: number, rh: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + rw - r, y);
        ctx.quadraticCurveTo(x + rw, y, x + rw, y + r);
        ctx.lineTo(x + rw, y + rh - r);
        ctx.quadraticCurveTo(x + rw, y + rh, x + rw - r, y + rh);
        ctx.lineTo(x + r, y + rh);
        ctx.quadraticCurveTo(x, y + rh, x, y + rh - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };

      // 1. Outer Border
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
        borderGrad.addColorStop(0, '#FBBF24');
        borderGrad.addColorStop(0.5, '#D97706');
        borderGrad.addColorStop(1, '#FDE68A');
      }

      ctx.save();
      drawRRect(cardX, cardY, cardW, cardH, outerRadius);
      ctx.fillStyle = borderGrad;
      ctx.fill();
      ctx.restore();

      // 2. Inner Surface
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
        innerGrad.addColorStop(0, '#0C0A09');
        innerGrad.addColorStop(0.5, '#1C1917');
        innerGrad.addColorStop(1, '#0A0A0A');
      }

      ctx.save();
      drawRRect(innerX, innerY, innerW, innerH, innerRadius);
      ctx.fillStyle = innerGrad;
      ctx.fill();
      ctx.clip();

      const headerY = innerY + 45;

      // Header Lightning
      drawRRect(innerX + 45, headerY, 44, 44, 12);
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
      ctx.fillText('NODEMONKES DIY PASSPORT', innerX + 104, headerY + 32);

      // Custom Tier Badge
      const tierBadgeW = 135;
      const tierBadgeH = 34;
      const tierBadgeX = innerX + innerW - 45 - tierBadgeW;
      const tierBadgeY = headerY + 5;

      drawRRect(tierBadgeX, tierBadgeY, tierBadgeW, tierBadgeH, 17);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.strokeStyle = '#34D399';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 14px "Space Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CUSTOM DIY', tierBadgeX + tierBadgeW / 2, tierBadgeY + 23);

      // Header Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(innerX + 45, headerY + 62);
      ctx.lineTo(innerX + innerW - 45, headerY + 62);
      ctx.stroke();

      // Body Layout (5:7 Grid)
      const bodyTopY = headerY + 62;
      const bodyBottomY = innerY + innerH - 65;
      const bodyH = bodyBottomY - bodyTopY;
      const bodyCenterY = bodyTopY + bodyH / 2;

      const leftColW = innerW * 0.416;
      const leftColCenterX = innerX + leftColW / 2;

      const avatarBoxSize = 340;
      const avatarX = Math.round(leftColCenterX - avatarBoxSize / 2);
      const avatarY = Math.round(bodyCenterY - avatarBoxSize / 2);

      drawRRect(avatarX, avatarY, avatarBoxSize, avatarBoxSize, 26);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Render DIY composite avatar
      const compCanvas = await renderCompositeCanvas(400, false);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(compCanvas, avatarX + 18, avatarY + 18, avatarBoxSize - 36, avatarBoxSize - 36);

      // Top left badge
      drawRRect(avatarX + 14, avatarY + 14, 76, 26, 6);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px "Space Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('#DIY-001', avatarX + 14 + 38, avatarY + 14 + 18);

      // Right Column Content
      const rightColX = innerX + leftColW + 20;
      const rightGroupH = 220;
      const rightStartY = Math.round(bodyCenterY - rightGroupH / 2);

      let curInfoY = rightStartY + 30;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 36px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(ownerHandle, rightColX, curInfoY);

      // Verified checkmark
      const handleTextW = ctx.measureText(ownerHandle).width;
      ctx.save();
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(rightColX + handleTextW + 26, curInfoY - 12, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rightColX + handleTextW + 20, curInfoY - 12);
      ctx.lineTo(rightColX + handleTextW + 25, curInfoY - 7);
      ctx.lineTo(rightColX + handleTextW + 33, curInfoY - 17);
      ctx.stroke();
      ctx.restore();

      // Title Pill
      curInfoY += 24;
      ctx.font = 'bold 13px "Space Mono", ui-monospace, monospace';
      const titleW = ctx.measureText(customTitle.toUpperCase()).width + 24;
      drawRRect(rightColX, curInfoY, titleW, 28, 6);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.stroke();
      ctx.fillStyle = '#FDE68A';
      ctx.textAlign = 'center';
      ctx.fillText(customTitle.toUpperCase(), rightColX + titleW / 2, curInfoY + 19);

      // Metadata Rows
      curInfoY += 56;
      const rowLineH = 34;

      ctx.textAlign = 'left';
      ctx.font = '19px "Space Mono", ui-monospace, monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Series: ', rightColX, curInfoY);
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 19px "Space Mono", ui-monospace, monospace';
      ctx.fillText(`${activeSeries.toUpperCase()} SPECIAL`, rightColX + ctx.measureText('Series: ').width, curInfoY);

      curInfoY += rowLineH;
      ctx.font = '19px "Space Mono", ui-monospace, monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Body: ', rightColX, curInfoY);
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 19px "Space Mono", ui-monospace, monospace';
      ctx.fillText(traitNames.Body, rightColX + ctx.measureText('Body: ').width, curInfoY);

      curInfoY += rowLineH;
      ctx.font = '19px "Space Mono", ui-monospace, monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Traits: ', rightColX, curInfoY);
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 19px "Space Mono", ui-monospace, monospace';
      ctx.fillText(`${traitNames.Count} Custom Parts`, rightColX + ctx.measureText('Traits: ').width, curInfoY);

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

      ctx.fillStyle = '#34D399';
      ctx.font = 'bold 16px "Space Mono", ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('DIY AUTHENTICATED PASS', innerX + innerW - 45, footerTextY);

      ctx.restore();

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `NodeMonke_DIY_Passport_${cardTheme}.png`;
      link.href = url;
      link.click();

      confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
      onToast('DIY 3D 通行证已导出！', '高清 1:1 卡片已成功保存', 'success');
      setSaving(false);
    } catch (e: any) {
      console.error('Export DIY passport error:', e);
      onToast('导出失败', e?.message || '请重试', 'error');
      setSaving(false);
    }
  };

  // 3D Tilt handlers
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

  const currentParts = components[activeSeries][activeCategory] || [];
  const currentSeriesObj = SERIES_BUTTONS.find((s) => s.id === activeSeries);
  const activeSeriesLabel = currentSeriesObj ? (lang === 'zh' ? currentSeriesObj.zh : currentSeriesObj.en) : activeSeries;

  const getCategoryLabel = (cat: CategoryType) => {
    if (cat === 'Body') return t.diyCatBody;
    if (cat === 'Earring') return t.diyCatEarring;
    if (cat === 'Eyes') return t.diyCatEyes;
    return t.diyCatHead;
  };

  const activeThemeObj = THEMES.find((t) => t.id === cardTheme) || THEMES[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Title Header */}
      <div className="text-center space-y-2 px-2">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold shadow-sm">
          <Paintbrush className="w-3.5 h-3.5" />
          <span>{t.diyBadge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          {t.diyTitle}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-sans">
          自由组合特征，一键切换制作 <strong>GIF 动图</strong>、<strong>圣诞装扮</strong> 与 <strong>3D 全息通行证</strong>！
        </p>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Interactive Preview & Mode Views (5 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
            
            {/* Top View Mode Switcher */}
            <div className="flex items-center justify-between gap-1 p-1 bg-slate-900/90 rounded-2xl border border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('diy')}
                className={clsx(
                  'flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5',
                  viewMode === 'diy'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>🎨 基础定制</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('gif')}
                className={clsx(
                  'flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5',
                  viewMode === 'gif'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>🎬 GIF 动图</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('santa')}
                className={clsx(
                  'flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5',
                  viewMode === 'santa'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>🎅 圣诞装</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('passport')}
                className={clsx(
                  'flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5',
                  viewMode === 'passport'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>🎴 3D卡片</span>
              </button>
            </div>

            {/* Mode 1 & 3: Standard DIY & Santa Layer Preview */}
            {(viewMode === 'diy' || viewMode === 'santa') && (
              <div 
                className="relative w-full aspect-square rounded-2xl border border-white/10 overflow-hidden shadow-inner flex items-center justify-center transition-colors"
                style={{ backgroundColor: currentBgColor }}
              >
                {currentBgColor === 'transparent' && (
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                )}

                {/* Layer 1: Body */}
                {selectedParts.Body && selectedParts.Body !== 'none' && (
                  <img
                    src={selectedParts.Body}
                    alt="Body Layer"
                    className="absolute inset-0 w-full h-full object-contain pixelated pointer-events-none z-10"
                  />
                )}

                {/* Layer 2: Earring */}
                {selectedParts.Earring && selectedParts.Earring !== 'none' && (
                  <img
                    src={selectedParts.Earring}
                    alt="Earring Layer"
                    className="absolute inset-0 w-full h-full object-contain pixelated pointer-events-none z-20"
                  />
                )}

                {/* Layer 3: Eyes */}
                {selectedParts.Eyes && selectedParts.Eyes !== 'none' && (
                  <img
                    src={selectedParts.Eyes}
                    alt="Eyes Layer"
                    className="absolute inset-0 w-full h-full object-contain pixelated pointer-events-none z-30"
                  />
                )}

                {/* Layer 4: Head */}
                {selectedParts.Head && selectedParts.Head !== 'none' && (
                  <img
                    src={selectedParts.Head}
                    alt="Head Layer"
                    className="absolute inset-0 w-full h-full object-contain pixelated pointer-events-none z-40"
                  />
                )}

                {/* Festive Santa Hat & Beard SVG Overlay */}
                {viewMode === 'santa' && (
                  <svg viewBox="0 0 28 28" className="absolute inset-0 w-full h-full pointer-events-none z-50 filter drop-shadow-[0_8px_16px_rgba(225,29,72,0.4)]" style={{ shapeRendering: 'crispEdges' }}>
                    {/* Red Hat Cone */}
                    <rect x="9" y="2" width="5" height="2" fill="#E11D48" />
                    <rect x="8" y="4" width="8" height="3" fill="#E11D48" />
                    <rect x="7" y="7" width="12" height="2" fill="#E11D48" />
                    {/* White Fur Band */}
                    <rect x="6" y="9" width="15" height="2" fill="#FFFFFF" />
                    {/* White Pom-pom Ball */}
                    <rect x="6" y="2" width="3" height="3" fill="#FFFFFF" />
                    {/* Festive White Beard */}
                    <rect x="8" y="17" width="12" height="4" fill="#FFFFFF" />
                    <rect x="9" y="21" width="10" height="3" fill="#FFFFFF" />
                    <rect x="11" y="24" width="6" height="2" fill="#FFFFFF" />
                  </svg>
                )}

                {loading && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-50">
                    <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                    <span className="text-xs font-mono text-slate-300">{t.diyLoadingComponents}</span>
                  </div>
                )}

                <div className="absolute top-3 left-3 z-50 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] font-mono text-slate-300 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{activeSeriesLabel} {viewMode === 'santa' ? '🎅 圣诞特别款' : t.diySeriesSuffix}</span>
                </div>
              </div>
            )}

            {/* Mode 2: Real-time 60FPS GIF Bouncing Canvas */}
            {viewMode === 'gif' && (
              <div className="relative w-full aspect-square rounded-2xl border border-white/10 overflow-hidden shadow-inner flex flex-col items-center justify-center bg-black/40">
                <canvas
                  ref={gifCanvasRef}
                  className="w-full h-full object-contain pixelated"
                />

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 p-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-xs font-mono">
                  <button
                    onClick={() => setIsGifPlaying((p) => !p)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  >
                    {isGifPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isGifPlaying ? '暂停' : '播放'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">速度:</span>
                    {[0.5, 1.0, 1.5, 2.0].map((s) => (
                      <button
                        key={s}
                        onClick={() => setGifSpeed(s)}
                        className={clsx(
                          'px-2 py-0.5 rounded-md text-[11px] font-bold',
                          gifSpeed === s ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
                        )}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 4: Real-time 3D Holographic Passport Container */}
            {viewMode === 'passport' && (
              <div 
                className="relative perspective-[1200px] w-full aspect-[1.58/1] cursor-grab active:cursor-grabbing select-none"
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
                    'relative w-full h-full rounded-2xl p-1 shadow-[0_20px_50px_rgba(0,0,0,0.85)] border transition-shadow duration-300',
                    'bg-gradient-to-br',
                    activeThemeObj.border
                  )}
                >
                  <div className={clsx('w-full h-full rounded-[18px] p-4 flex flex-col justify-between relative overflow-hidden', activeThemeObj.bg)}>
                    
                    {/* Rainbow Sheen */}
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-color-dodge transition-opacity duration-300 z-20"
                      style={{
                        background: `radial-gradient(circle at ${sheen.x}% ${sheen.y}%, rgba(255,255,255,0.7) 0%, rgba(236,72,153,0.3) 30%, rgba(59,130,246,0.3) 60%, transparent 80%)`,
                        opacity: sheen.opacity,
                      }}
                    />

                    {/* Card Front */}
                    <div className="w-full h-full flex flex-col justify-between" style={{ backfaceVisibility: 'hidden' }}>
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                          <span>⚡</span> NODEMONKES DIY PASS
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          CUSTOM DIY
                        </span>
                      </div>

                      <div className="grid grid-cols-12 gap-3 items-center my-auto">
                        <div className="col-span-5 flex items-center justify-center">
                          <div className="w-24 h-24 rounded-xl bg-black/60 border border-white/15 p-1.5 shadow-xl relative overflow-hidden">
                            {/* Stacking Mini Layers */}
                            {selectedParts.Body && selectedParts.Body !== 'none' && (
                              <img src={selectedParts.Body} alt="Body" className="absolute inset-0 w-full h-full object-contain pixelated pointer-events-none z-10" />
                            )}
                            {selectedParts.Earring && selectedParts.Earring !== 'none' && (
                              <img src={selectedParts.Earring} alt="Earring" className="absolute inset-0 w-full h-full object-contain pixelated pointer-events-none z-20" />
                            )}
                            {selectedParts.Eyes && selectedParts.Eyes !== 'none' && (
                              <img src={selectedParts.Eyes} alt="Eyes" className="absolute inset-0 w-full h-full object-contain pixelated pointer-events-none z-30" />
                            )}
                            {selectedParts.Head && selectedParts.Head !== 'none' && (
                              <img src={selectedParts.Head} alt="Head" className="absolute inset-0 w-full h-full object-contain pixelated pointer-events-none z-40" />
                            )}
                          </div>
                        </div>

                        <div className="col-span-7 flex flex-col gap-1 font-mono">
                          <div className="flex items-center gap-1 text-sm font-black text-white">
                            <span>{ownerHandle}</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                          </div>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-block w-max">
                            {customTitle}
                          </span>
                          <div className="text-[10px] text-slate-400 flex flex-col mt-0.5">
                            <span>Series: <strong className="text-slate-200">{activeSeries.toUpperCase()}</strong></span>
                            <span>Traits: <strong className="text-slate-200">{traitNames.Count} Parts</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-1.5 flex items-center justify-between text-[9px] font-mono text-slate-400">
                        <span className="truncate max-w-[200px]">"{customMotto}"</span>
                        <span className="text-emerald-400 font-bold">DIY AUTHENTICATED</span>
                      </div>
                    </div>

                  </div>
                </motion.div>
              </div>
            )}

            {/* Quick Actions & Download Controls */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={randomize}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition-all shadow-md"
                >
                  <Shuffle className="w-4 h-4 text-emerald-400" />
                  <span>{t.diyRandomBtn}</span>
                </motion.button>

                {viewMode === 'passport' ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleExportPassport}
                    disabled={loading || saving}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{saving ? '正在导出...' : '💾 导出 3D 通行证 PNG'}</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={saveAvatar}
                    disabled={loading || saving}
                    className={clsx(
                      'flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs shadow-lg transition-all',
                      viewMode === 'santa'
                        ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-rose-500/25 hover:brightness-110'
                        : 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 shadow-emerald-500/25'
                    )}
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{saving ? t.diySavingBtn : `${viewMode === 'santa' ? '🎅 导出圣诞款' : t.diySaveBtn} (${saveResolution}px)`}</span>
                  </motion.button>
                )}
              </div>

              {/* Resolution Options Selector */}
              {viewMode !== 'passport' && (
                <div className="flex flex-wrap items-center justify-between gap-1 p-1 bg-slate-950/60 rounded-2xl border border-white/5 text-[11px] font-mono shadow-inner">
                  <span className="text-slate-400 px-2 font-medium">{t.diyResTitle}</span>
                  <div className="flex items-center gap-1">
                    {RESOLUTION_OPTIONS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setSaveResolution(r.value)}
                        className={clsx(
                          'px-2.5 py-1 rounded-xl transition-all font-semibold',
                          saveResolution === r.value
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Passport Material Selector (when in Passport Mode) */}
              {viewMode === 'passport' && (
                <div className="flex flex-col gap-2 p-2 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[11px] font-mono font-bold text-slate-300">卡片全息材质主题:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {THEMES.map((th) => (
                      <button
                        key={th.id}
                        onClick={() => setCardTheme(th.id)}
                        className={clsx(
                          'px-2 py-1.5 rounded-xl text-[11px] font-mono font-bold border transition-all truncate text-left',
                          cardTheme === th.id
                            ? 'bg-purple-500/25 border-purple-400 text-purple-300'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                        )}
                      >
                        <span>{th.icon}</span> <span className="text-[10px]">{th.nameZh.split(' ')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>

        {/* Right Side: Trait Picker & Customizer (7 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/[0.08] shadow-2xl space-y-5">
            
            {/* 1. Series Switcher Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                {t.diySeriesTitle}
              </label>
              <div className="flex flex-wrap gap-2">
                {SERIES_BUTTONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSeriesHandler(s.id)}
                    className={clsx(
                      'flex-1 min-w-[70px] py-2 px-3 rounded-2xl text-xs font-mono font-bold transition-all border shadow-sm',
                      activeSeries === s.id
                        ? 'bg-emerald-500/20 border-emerald-400/80 text-emerald-300 shadow-emerald-500/10'
                        : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    )}
                  >
                    {lang === 'zh' ? s.zh : s.en}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Trait Category Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                {lang === 'zh' ? '部件类别' : 'Categories'}
              </label>
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/60 rounded-2xl border border-white/5">
                {SERIES_COMPONENTS[activeSeries].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={clsx(
                      'flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all text-center',
                      activeCategory === cat
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    {getCategoryLabel(cat)}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Trait Items Grid Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{getCategoryLabel(activeCategory)} ({currentParts.length})</span>
                <span className="text-emerald-400 font-semibold">{traitNames[activeCategory]}</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
                {currentParts.map((item, idx) => {
                  const isSelected = selectedParts[activeCategory] === item.url;
                  const isNone = item.url === 'none';

                  return (
                    <motion.div
                      key={`${item.value}-${idx}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => selectPart(activeCategory, item.url)}
                      className={clsx(
                        'relative aspect-square rounded-2xl border flex flex-col items-center justify-center p-1.5 cursor-pointer transition-all',
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-800/60'
                      )}
                    >
                      {isNone ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <span className="text-slate-500 text-lg">✕</span>
                          <span className="text-[10px] font-mono text-slate-400 mt-1">{t.diyNoneOption}</span>
                        </div>
                      ) : (
                        <img
                          src={item.url}
                          alt={item.value}
                          className="w-full h-full object-contain pixelated"
                          loading="lazy"
                        />
                      )}

                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center text-slate-950 shadow-sm">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 4. Background Color Selector */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                {t.diyBgTitle}
              </label>

              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setBgMode('transparent')}
                  className={clsx(
                    'py-2 px-1 rounded-2xl text-[11px] font-mono font-bold border transition-all',
                    bgMode === 'transparent'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {t.diyBgNone}
                </button>

                <button
                  type="button"
                  onClick={() => setBgMode('orange')}
                  className={clsx(
                    'py-2 px-1 rounded-2xl text-[11px] font-mono font-bold border transition-all',
                    bgMode === 'orange'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {t.diyBgOrange}
                </button>

                <button
                  type="button"
                  onClick={() => setBgMode('auto')}
                  className={clsx(
                    'py-2 px-1 rounded-2xl text-[11px] font-mono font-bold border transition-all',
                    bgMode === 'auto'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {t.diyBgAuto}
                </button>

                <button
                  type="button"
                  onClick={() => setBgMode('custom')}
                  className={clsx(
                    'py-2 px-1 rounded-2xl text-[11px] font-mono font-bold border transition-all',
                    bgMode === 'custom'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {t.diyBgCustom}
                </button>
              </div>

              {bgMode === 'custom' && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-8 h-8 rounded-xl cursor-pointer border border-white/20 bg-transparent"
                  />
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCustomColor(c.value)}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                        className="w-6 h-6 rounded-lg border border-white/20 transition-transform hover:scale-110 active:scale-95"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
