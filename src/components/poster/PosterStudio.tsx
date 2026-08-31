import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Sparkles, 
  Shuffle, 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  ChevronsUp, 
  ChevronsDown, 
  FlipHorizontal, 
  RotateCw, 
  Layout, 
  Palette, 
  Type, 
  Upload, 
  X, 
  ZoomIn,
  ZoomOut,
  CheckSquare,
  Square,
  BoxSelect
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import type { Monke } from '../../types';
import { getMonkeImageUrl } from '../../utils/api';
import { useLanguage } from '../../utils/i18n';

interface PosterStudioProps {
  initialMonkeId?: number;
  monkes: Monke[];
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

export type PosterLayout = 'banner' | 'wallpaper' | 'square' | 'cinema';
export type AuraTheme = 'btc' | 'cyber' | 'dark' | 'emerald' | 'minimal' | 'custom';

export interface MonkeLayer {
  id: string;
  monkeId: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  flipX: boolean;
}

export interface TextLayer {
  x: number;
  y: number;
  headline: string;
  subheadline: string;
  fontSize: number;
  color: string;
  subColor: string;
  align: 'left' | 'center' | 'right';
  visible: boolean;
}

const FORMAT_CONFIG: Record<PosterLayout, { w: number; h: number; name: string }> = {
  banner: { w: 1500, h: 500, name: 'Twitter Banner (3:1)' },
  wallpaper: { w: 1080, h: 1920, name: 'Phone Wallpaper (9:16)' },
  square: { w: 1200, h: 1200, name: 'Square Art (1:1)' },
  cinema: { w: 1920, h: 1080, name: 'Cinema 4K (16:9)' },
};

// Image caching
const imgCache = new Map<string, HTMLImageElement>();
function loadImg(src: string): Promise<HTMLImageElement> {
  if (imgCache.has(src)) {
    return Promise.resolve(imgCache.get(src)!);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function generateLayerId() {
  return Math.random().toString(36).substring(2, 9);
}

export const PosterStudio: React.FC<PosterStudioProps> = ({
  initialMonkeId = 209,
  monkes,
  onToast,
}) => {
  const { lang, t } = useLanguage();
  const [layout, setLayout] = useState<PosterLayout>('banner');
  const [theme, setTheme] = useState<AuraTheme>('btc');
  
  // Custom Background
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [customBgColor, setCustomBgColor] = useState<string>('#0B0D13');
  const [bgDim, setBgDim] = useState<number>(30);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text Layer State
  const [textLayer, setTextLayer] = useState<TextLayer>(() => ({
    x: 80,
    y: 240,
    headline: 'WE ARE NODEMONKES',
    subheadline: 'BITCOIN ORDINALS • 10,000 SACRED INSCRIPTIONS',
    fontSize: 52,
    color: '#FFFFFF',
    subColor: '#F59E0B',
    align: 'left',
    visible: true,
  }));

  // Dynamic Layers System (layers[0] is on the very top)
  const [layers, setLayers] = useState<MonkeLayer[]>(() => {
    const { w, h } = FORMAT_CONFIG['banner'];
    const baseIds = [209, 7277, 3361, 4143, 8812];
    const size = 390;
    const startX = w * 0.46;
    const spacing = 135;
    const centerY = h / 2 + 10;

    return baseIds.map((id, idx) => ({
      id: `layer-${idx}-${id}`,
      monkeId: id,
      x: startX + idx * spacing,
      y: centerY,
      size,
      rotation: 0,
      flipX: false,
    }));
  });

  // Multiple selection support (array of layer IDs or ['text'])
  const [selectedIds, setSelectedIds] = useState<string[]>(layers[0] ? [layers[0].id] : []);
  const [isExporting, setIsExporting] = useState(false);

  // Marquee Selection Box State (for direct canvas box dragging)
  const [marqueeBox, setMarqueeBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Refs for buttery smooth 60fps/120fps direct dragging & group dragging
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveLayersRef = useRef<MonkeLayer[]>(layers);
  const liveTextRef = useRef<TextLayer>(textLayer);
  liveLayersRef.current = layers;
  liveTextRef.current = textLayer;

  const isDraggingRef = useRef<{
    target: 'monke' | 'text' | 'marquee' | null;
    mode: 'move' | 'scale' | 'rotate' | 'marquee' | null;
    primaryId: string | null;
    startX: number;
    startY: number;
    // Map layerId -> original { x, y, size, rot } for multi-drag
    origPos: Map<string, { x: number; y: number; size: number; rotation: number }>;
    origText: { x: number; y: number; fontSize: number };
  }>({
    target: null,
    mode: null,
    primaryId: null,
    startX: 0,
    startY: 0,
    origPos: new Map(),
    origText: { x: 80, y: 240, fontSize: 52 },
  });

  const isTextSelected = selectedIds.length === 1 && selectedIds[0] === 'text';
  const selectedMonkeLayers = layers.filter((l) => selectedIds.includes(l.id));
  const primarySelectedMonke = selectedMonkeLayers[0] || null;

  // Sync initial Monke
  useEffect(() => {
    if (initialMonkeId && !layers.some((l) => l.monkeId === initialMonkeId)) {
      setLayers((prev) => [
        {
          id: generateLayerId(),
          monkeId: initialMonkeId,
          x: FORMAT_CONFIG[layout].w * 0.5,
          y: FORMAT_CONFIG[layout].h * 0.45,
          size: 400,
          rotation: 0,
          flipX: false,
        },
        ...prev,
      ]);
    }
  }, [initialMonkeId, layout]);

  // Handle Custom Background Upload
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCustomBgImage(event.target.result);
        setTheme('custom');
        onToast('背景图已上传', '已加载自定义背景壁纸', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Preset Template Applier
  const applyPresetTemplate = (type: 'squad' | 'duo' | 'pyramid' | 'solo' | 'scatter') => {
    const { w, h } = FORMAT_CONFIG[layout];
    const pool = layers.length ? layers.map((l) => l.monkeId) : [209, 7277, 3361, 4143, 8812];
    while (pool.length < 5) {
      pool.push(Math.floor(Math.random() * 10000) + 1);
    }

    let newLayers: MonkeLayer[] = [];

    if (type === 'solo') {
      const size = layout === 'wallpaper' ? 700 : layout === 'square' ? 680 : 540;
      newLayers = [
        {
          id: generateLayerId(),
          monkeId: pool[0] || 209,
          x: layout === 'banner' ? w * 0.72 : w / 2,
          y: layout === 'wallpaper' ? h * 0.44 : h * 0.45,
          size,
          rotation: 0,
          flipX: false,
        },
      ];
      setTextLayer((t) => ({
        ...t,
        x: layout === 'banner' ? 80 : w / 2,
        y: layout === 'banner' ? h / 2 - 10 : h * 0.82,
        align: layout === 'banner' ? 'left' : 'center',
      }));
    } else if (type === 'duo') {
      const size = layout === 'banner' ? 390 : layout === 'wallpaper' ? 560 : 520;
      newLayers = [
        {
          id: generateLayerId(),
          monkeId: pool[0] || 209,
          x: layout === 'banner' ? w * 0.58 : w * 0.32,
          y: layout === 'wallpaper' ? h * 0.44 : h * 0.45,
          size,
          rotation: 0,
          flipX: false,
        },
        {
          id: generateLayerId(),
          monkeId: pool[1] || 7277,
          x: layout === 'banner' ? w * 0.78 : w * 0.68,
          y: layout === 'wallpaper' ? h * 0.44 + 30 : h * 0.45,
          size,
          rotation: 0,
          flipX: true,
        },
      ];
      setTextLayer((t) => ({
        ...t,
        x: layout === 'banner' ? 80 : w / 2,
        y: layout === 'banner' ? h / 2 - 10 : h * 0.82,
        align: layout === 'banner' ? 'left' : 'center',
      }));
    } else if (type === 'pyramid') {
      const baseSize = layout === 'wallpaper' ? 440 : 380;
      const topSize = baseSize * 1.15;
      newLayers = [
        {
          id: generateLayerId(),
          monkeId: pool[0] || 209,
          x: w * 0.5,
          y: layout === 'wallpaper' ? h * 0.38 : h * 0.42,
          size: topSize,
          rotation: 0,
          flipX: false,
        },
        {
          id: generateLayerId(),
          monkeId: pool[1] || 7277,
          x: w * 0.32,
          y: layout === 'wallpaper' ? h * 0.48 : h * 0.48,
          size: baseSize,
          rotation: -6,
          flipX: false,
        },
        {
          id: generateLayerId(),
          monkeId: pool[2] || 3361,
          x: w * 0.68,
          y: layout === 'wallpaper' ? h * 0.48 : h * 0.48,
          size: baseSize,
          rotation: 6,
          flipX: true,
        },
      ];
      setTextLayer((t) => ({
        ...t,
        x: w / 2,
        y: layout === 'wallpaper' ? h * 0.80 : h * 0.84,
        align: 'center',
      }));
    } else if (type === 'scatter') {
      newLayers = Array.from({ length: 5 }).map((_, i) => ({
        id: generateLayerId(),
        monkeId: pool[i] || Math.floor(Math.random() * 10000) + 1,
        x: w * (0.2 + 0.6 * Math.random()),
        y: h * (0.25 + 0.5 * Math.random()),
        size: 280 + Math.random() * 200,
        rotation: (Math.random() - 0.5) * 40,
        flipX: Math.random() > 0.5,
      }));
    } else {
      // 5-Squad
      const size = layout === 'banner' ? 390 : layout === 'wallpaper' ? 520 : 500;
      const spacing = layout === 'banner' ? 135 : 150;
      const startX = layout === 'banner' ? w * 0.46 : (w - (4 * spacing)) / 2;
      const centerY = layout === 'banner' ? h / 2 + 10 : h * 0.44;

      newLayers = pool.slice(0, 5).map((id, idx) => ({
        id: generateLayerId(),
        monkeId: id,
        x: startX + idx * spacing,
        y: centerY + (layout === 'wallpaper' && idx % 2 === 1 ? 35 : 0),
        size,
        rotation: 0,
        flipX: false,
      }));

      setTextLayer((t) => ({
        ...t,
        x: layout === 'banner' ? 80 : w / 2,
        y: layout === 'banner' ? h / 2 - 10 : h * 0.82,
        align: layout === 'banner' ? 'left' : 'center',
      }));
    }

    setLayers(newLayers);
    setSelectedIds(newLayers[0] ? [newLayers[0].id] : []);
  };

  // Switch Format
  const handleFormatChange = (newLayout: PosterLayout) => {
    setLayout(newLayout);
    const { w, h } = FORMAT_CONFIG[newLayout];
    const oldConfig = FORMAT_CONFIG[layout];

    setLayers((prev) =>
      prev.map((l) => ({
        ...l,
        x: Math.min(w * 0.85, Math.max(w * 0.15, l.x * (w / oldConfig.w))),
        y: Math.min(h * 0.85, Math.max(h * 0.15, l.y * (h / oldConfig.h))),
      }))
    );

    setTextLayer((prev) => ({
      ...prev,
      x: newLayout === 'banner' ? 80 : w / 2,
      y: newLayout === 'banner' ? h / 2 - 10 : h * 0.82,
      align: newLayout === 'banner' ? 'left' : 'center',
    }));
  };

  // Layer CRUD
  const handleAddMonke = (customId?: number) => {
    const { w, h } = FORMAT_CONFIG[layout];
    const newId = customId || Math.floor(Math.random() * 10000) + 1;
    const newLayer: MonkeLayer = {
      id: generateLayerId(),
      monkeId: newId,
      x: w / 2 + (Math.random() - 0.5) * 120,
      y: h * 0.45 + (Math.random() - 0.5) * 80,
      size: layout === 'banner' ? 380 : 500,
      rotation: 0,
      flipX: false,
    };
    setLayers((prev) => [newLayer, ...prev]);
    setSelectedIds([newLayer.id]);
    onToast(t.posterAddMonke, `已添加 NodeMonke #${newId}`, 'success');
  };

  const handleDeleteSelected = () => {
    if (selectedIds.includes('text')) {
      setTextLayer((t) => ({ ...t, visible: false }));
      setSelectedIds([]);
      return;
    }
    setLayers((prev) => {
      const next = prev.filter((l) => !selectedIds.includes(l.id));
      setSelectedIds(next[0] ? [next[0].id] : []);
      return next;
    });
  };

  const handleDuplicateSelected = () => {
    const dups: MonkeLayer[] = selectedMonkeLayers.map((l) => ({
      ...l,
      id: generateLayerId(),
      x: l.x + 35,
      y: l.y + 35,
    }));
    setLayers((prev) => [...dups, ...prev]);
    setSelectedIds(dups.map((d) => d.id));
  };

  // Group Multi-Flip
  const handleBatchFlip = () => {
    setLayers((prev) =>
      prev.map((l) => (selectedIds.includes(l.id) ? { ...l, flipX: !l.flipX } : l))
    );
  };

  // Group Scale Step
  const handleBatchScale = (delta: number) => {
    setLayers((prev) =>
      prev.map((l) =>
        selectedIds.includes(l.id)
          ? { ...l, size: Math.max(80, Math.min(1500, l.size + delta)) }
          : l
      )
    );
  };

  // Group Bring to Front
  const handleBatchBringToFront = () => {
    setLayers((prev) => {
      const targets = prev.filter((l) => selectedIds.includes(l.id));
      const rest = prev.filter((l) => !selectedIds.includes(l.id));
      return [...targets, ...rest];
    });
  };

  // Group Send to Back
  const handleBatchSendToBack = () => {
    setLayers((prev) => {
      const targets = prev.filter((l) => selectedIds.includes(l.id));
      const rest = prev.filter((l) => !selectedIds.includes(l.id));
      return [...rest, ...targets];
    });
  };

  // Select All Monkes
  const handleSelectAll = () => {
    if (selectedIds.length === layers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(layers.map((l) => l.id));
    }
  };

  const updatePrimaryMonke = (partial: Partial<MonkeLayer>) => {
    if (!primarySelectedMonke) return;
    setLayers((prev) =>
      prev.map((l) => (l.id === primarySelectedMonke.id ? { ...l, ...partial } : l))
    );
  };

  // Convert client pointer event to canvas coordinate
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Hit Testing
  const findHit = (x: number, y: number): { type: 'monke' | 'text'; id: string; part: 'body' | 'corner' | 'rotate' } | null => {
    // 1. Text Layer Check
    if (textLayer.visible) {
      const textWidth = Math.max(textLayer.headline.length * (textLayer.fontSize * 0.65), 350);
      const textHeight = textLayer.fontSize * 2.6;
      let boxLeft = textLayer.x;
      if (textLayer.align === 'center') boxLeft = textLayer.x - textWidth / 2;
      if (textLayer.align === 'right') boxLeft = textLayer.x - textWidth;

      if (x >= boxLeft - 20 && x <= boxLeft + textWidth + 20 && y >= textLayer.y - textLayer.fontSize - 10 && y <= textLayer.y + textHeight - textLayer.fontSize) {
        return { type: 'text', id: 'text', part: 'body' };
      }
    }

    // 2. Monke Layers Check (from TOP to BOTTOM)
    for (const l of layers) {
      const dx = x - l.x;
      const dy = y - l.y;
      const rad = (-l.rotation * Math.PI) / 180;
      const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
      const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

      const half = l.size / 2;

      // Rotate handle check (single selected)
      if (selectedIds.length === 1 && selectedIds[0] === l.id) {
        if (Math.hypot(localX, localY - (-half - 35)) < 30) {
          return { type: 'monke', id: l.id, part: 'rotate' };
        }
        // Corner scale handle check (4 corners)
        if (Math.hypot(Math.abs(localX) - half, Math.abs(localY) - half) < 32) {
          return { type: 'monke', id: l.id, part: 'corner' };
        }
      }

      // Body bounding check
      if (Math.abs(localX) <= half && Math.abs(localY) <= half) {
        return { type: 'monke', id: l.id, part: 'body' };
      }
    }

    return null;
  };

  // Pointer Down (Supports Click, Shift+Click, and Marquee Box Drag)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const hit = findHit(x, y);

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (hit) {
      if (hit.type === 'text') {
        setSelectedIds(['text']);
        isDraggingRef.current = {
          target: 'text',
          mode: 'move',
          primaryId: 'text',
          startX: x,
          startY: y,
          origPos: new Map(),
          origText: { x: textLayer.x, y: textLayer.y, fontSize: textLayer.fontSize },
        };
      } else {
        // Monke Layer Hit
        let currentSelected = [...selectedIds];
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          // Toggle in multi-selection
          if (currentSelected.includes(hit.id)) {
            currentSelected = currentSelected.filter((id) => id !== hit.id);
          } else {
            currentSelected.push(hit.id);
          }
        } else {
          // Normal click: if clicking already-selected item in group, keep group; otherwise set single
          if (!currentSelected.includes(hit.id)) {
            currentSelected = [hit.id];
          }
        }
        setSelectedIds(currentSelected);

        // Store original positions for all selected layers to support group dragging
        const origMap = new Map<string, { x: number; y: number; size: number; rotation: number }>();
        layers.forEach((l) => {
          if (currentSelected.includes(l.id)) {
            origMap.set(l.id, { x: l.x, y: l.y, size: l.size, rotation: l.rotation });
          }
        });

        isDraggingRef.current = {
          target: 'monke',
          mode: hit.part === 'rotate' ? 'rotate' : hit.part === 'corner' ? 'scale' : 'move',
          primaryId: hit.id,
          startX: x,
          startY: y,
          origPos: origMap,
          origText: { x: textLayer.x, y: textLayer.y, fontSize: textLayer.fontSize },
        };
      }
    } else {
      // Empty Canvas clicked: start Marquee Box Drag
      if (!e.shiftKey && !e.ctrlKey) {
        setSelectedIds([]);
      }
      setMarqueeBox({ x1: x, y1: y, x2: x, y2: y });
      isDraggingRef.current = {
        target: 'marquee',
        mode: 'marquee',
        primaryId: null,
        startX: x,
        startY: y,
        origPos: new Map(),
        origText: { x: textLayer.x, y: textLayer.y, fontSize: textLayer.fontSize },
      };
    }
  };

  // Pointer Move (Buttery Smooth 60fps/120fps direct dragging & Marquee Selection)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = isDraggingRef.current;
    if (!drag.mode) return;

    const { x, y } = getCanvasCoords(e);
    const dx = x - drag.startX;
    const dy = y - drag.startY;

    if (drag.mode === 'marquee') {
      // Update Marquee Box
      const box = { x1: drag.startX, y1: drag.startY, x2: x, y2: y };
      setMarqueeBox(box);

      const minX = Math.min(box.x1, box.x2);
      const maxX = Math.max(box.x1, box.x2);
      const minY = Math.min(box.y1, box.y2);
      const maxY = Math.max(box.y1, box.y2);

      // Multi-select all Monkes intersecting with marquee box
      const hitIds = layers
        .filter((l) => {
          const left = l.x - l.size / 2;
          const right = l.x + l.size / 2;
          const top = l.y - l.size / 2;
          const bottom = l.y + l.size / 2;
          return !(left > maxX || right < minX || top > maxY || bottom < minY);
        })
        .map((l) => l.id);

      setSelectedIds(hitIds);
    } else if (drag.target === 'text') {
      setTextLayer((prev) => ({
        ...prev,
        x: Math.round(drag.origText.x + dx),
        y: Math.round(drag.origText.y + dy),
      }));
    } else if (drag.target === 'monke') {
      if (drag.mode === 'move') {
        // Group Move: All selected Monkes move in sync!
        setLayers((prev) =>
          prev.map((l) => {
            const orig = drag.origPos.get(l.id);
            if (orig) {
              return { ...l, x: Math.round(orig.x + dx), y: Math.round(orig.y + dy) };
            }
            return l;
          })
        );
      } else if (drag.mode === 'scale' && drag.primaryId) {
        const target = layers.find((l) => l.id === drag.primaryId);
        if (!target) return;
        const dist = Math.hypot(x - target.x, y - target.y);
        const newSize = Math.max(80, Math.min(1500, dist * 1.414));
        setLayers((prev) =>
          prev.map((l) => (l.id === drag.primaryId ? { ...l, size: Math.round(newSize) } : l))
        );
      } else if (drag.mode === 'rotate' && drag.primaryId) {
        const target = layers.find((l) => l.id === drag.primaryId);
        if (!target) return;
        const angle = (Math.atan2(y - target.y, x - target.x) * 180) / Math.PI + 90;
        setLayers((prev) =>
          prev.map((l) => (l.id === drag.primaryId ? { ...l, rotation: Math.round(angle) } : l))
        );
      }
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current.mode = null;
    isDraggingRef.current.target = null;
    isDraggingRef.current.primaryId = null;
    setMarqueeBox(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (e) {}
  };

  // Mouse Wheel Scale
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!selectedIds.length) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 30 : -30;

    if (isTextSelected) {
      setTextLayer((t) => ({ ...t, fontSize: Math.max(20, Math.min(120, t.fontSize + (delta > 0 ? 2 : -2))) }));
    } else {
      setLayers((prev) =>
        prev.map((l) =>
          selectedIds.includes(l.id)
            ? { ...l, size: Math.max(80, Math.min(1500, l.size + delta)) }
            : l
        )
      );
    }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = FORMAT_CONFIG[layout];
    canvas.width = w;
    canvas.height = h;

    const renderPoster = async () => {
      ctx.clearRect(0, 0, w, h);

      // 1. Draw Background
      if (customBgImage) {
        try {
          const bgImg = await loadImg(customBgImage);
          if (!active) return;
          ctx.drawImage(bgImg, 0, 0, w, h);

          if (bgDim > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${bgDim / 100})`;
            ctx.fillRect(0, 0, w, h);
          }
        } catch (e) {
          ctx.fillStyle = customBgColor;
          ctx.fillRect(0, 0, w, h);
        }
      } else if (theme === 'btc') {
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#0C0A09');
        bgGrad.addColorStop(0.5, '#1C1307');
        bgGrad.addColorStop(1, '#080604');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const radial = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h) * 0.6);
        radial.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
        radial.addColorStop(0.5, 'rgba(234, 88, 12, 0.12)');
        radial.addColorStop(1, 'transparent');
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, w, h);
      } else if (theme === 'cyber') {
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#090916');
        bgGrad.addColorStop(1, '#05050A');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const rad1 = ctx.createRadialGradient(w * 0.2, h * 0.3, 20, w * 0.2, h * 0.3, w * 0.5);
        rad1.addColorStop(0, 'rgba(168, 85, 247, 0.24)');
        rad1.addColorStop(1, 'transparent');
        ctx.fillStyle = rad1;
        ctx.fillRect(0, 0, w, h);

        const rad2 = ctx.createRadialGradient(w * 0.8, h * 0.7, 20, w * 0.8, h * 0.7, w * 0.5);
        rad2.addColorStop(0, 'rgba(6, 182, 212, 0.24)');
        rad2.addColorStop(1, 'transparent');
        ctx.fillStyle = rad2;
        ctx.fillRect(0, 0, w, h);
      } else if (theme === 'emerald') {
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#04130C');
        bgGrad.addColorStop(1, '#020A06');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const rad = ctx.createRadialGradient(w / 2, h * 0.4, 50, w / 2, h * 0.4, w * 0.5);
        rad.addColorStop(0, 'rgba(16, 185, 129, 0.30)');
        rad.addColorStop(1, 'transparent');
        ctx.fillStyle = rad;
        ctx.fillRect(0, 0, w, h);
      } else if (theme === 'minimal') {
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#141822');
        bgGrad.addColorStop(1, '#080A0E');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = customBgColor;
        ctx.fillRect(0, 0, w, h);
      }

      // Ambient Grid Dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const step = 32;
      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) {
          ctx.fillRect(x, y, 2, 2);
        }
      }

      // 2. Draw Monke Layers in REVERSE order (layers[last] to layers[0])
      try {
        const imgMap = new Map<number, HTMLImageElement>();
        for (const l of layers) {
          if (!imgMap.has(l.monkeId)) {
            const img = await loadImg(getMonkeImageUrl(l.monkeId));
            imgMap.set(l.monkeId, img);
          }
        }

        if (!active) return;
        ctx.imageSmoothingEnabled = false;

        for (let i = layers.length - 1; i >= 0; i--) {
          const l = layers[i];
          const img = imgMap.get(l.monkeId);
          if (!img) continue;

          ctx.save();
          ctx.translate(l.x, l.y);
          if (l.rotation !== 0) ctx.rotate((l.rotation * Math.PI) / 180);
          if (l.flipX) ctx.scale(-1, 1);

          ctx.drawImage(img, -l.size / 2, -l.size / 2, l.size, l.size);
          ctx.restore();
        }

        // 3. Draw Text Layer
        if (textLayer.visible) {
          ctx.save();
          ctx.textAlign = textLayer.align;
          ctx.fillStyle = textLayer.color;
          ctx.font = `900 ${textLayer.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillText(textLayer.headline, textLayer.x, textLayer.y);

          ctx.fillStyle = textLayer.subColor;
          ctx.font = `700 ${Math.round(textLayer.fontSize * 0.38)}px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace`;
          ctx.fillText(textLayer.subheadline, textLayer.x, textLayer.y + textLayer.fontSize * 0.9);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = `600 ${Math.round(textLayer.fontSize * 0.28)}px ui-monospace, SFMono-Regular, monospace`;
          ctx.fillText('NODE MONKES • BITCOIN LAYER 1', textLayer.x, textLayer.y + textLayer.fontSize * 1.6);
          ctx.restore();
        }

        // 4. Interactive Selection & Marquee Overlays (Only during edit mode)
        if (!isExporting) {
          
          // Draw Marquee Box if active
          if (marqueeBox) {
            const bx = Math.min(marqueeBox.x1, marqueeBox.x2);
            const by = Math.min(marqueeBox.y1, marqueeBox.y2);
            const bw = Math.abs(marqueeBox.x2 - marqueeBox.x1);
            const bh = Math.abs(marqueeBox.y2 - marqueeBox.y1);

            ctx.save();
            ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(bx, by, bw, bh);
            ctx.restore();
          }

          // Draw Selected Monkes Bounding Boxes
          selectedMonkeLayers.forEach((l) => {
            const half = l.size / 2;

            ctx.save();
            ctx.translate(l.x, l.y);
            if (l.rotation !== 0) ctx.rotate((l.rotation * Math.PI) / 180);

            // Dashed Cyan/Purple Selection Box
            ctx.strokeStyle = selectedIds.length > 1 ? '#C084FC' : '#38BDF8';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.strokeRect(-half, -half, l.size, l.size);

            // If single selected, draw handles
            if (selectedIds.length === 1) {
              ctx.setLineDash([]);
              ctx.fillStyle = '#38BDF8';
              [
                [-half, -half],
                [half, -half],
                [-half, half],
                [half, half],
              ].forEach(([cx, cy]) => {
                ctx.beginPath();
                ctx.arc(cx, cy, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.stroke();
              });

              // Top Rotate Handle
              ctx.beginPath();
              ctx.moveTo(0, -half);
              ctx.lineTo(0, -half - 32);
              ctx.strokeStyle = '#38BDF8';
              ctx.lineWidth = 2;
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(0, -half - 32, 10, 0, Math.PI * 2);
              ctx.fillStyle = '#F59E0B';
              ctx.fill();
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 2;
              ctx.stroke();
            }

            ctx.restore();
          });

          // Text Selection Box
          if (isTextSelected && textLayer.visible) {
            const textWidth = Math.max(textLayer.headline.length * (textLayer.fontSize * 0.65), 350);
            const textHeight = textLayer.fontSize * 2.2;
            let boxLeft = textLayer.x;
            if (textLayer.align === 'center') boxLeft = textLayer.x - textWidth / 2;
            if (textLayer.align === 'right') boxLeft = textLayer.x - textWidth;

            ctx.save();
            ctx.strokeStyle = '#A855F7';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 5]);
            ctx.strokeRect(boxLeft - 15, textLayer.y - textLayer.fontSize, textWidth + 30, textHeight);
            ctx.restore();
          }
        }
      } catch (err) {
        console.error('Render error:', err);
      }
    };

    renderPoster();

    return () => {
      active = false;
    };
  }, [layout, theme, customBgImage, customBgColor, bgDim, layers, textLayer, selectedIds, selectedMonkeLayers, isTextSelected, marqueeBox, isExporting]);

  // Clean PNG Export
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas || isExporting) return;
    setIsExporting(true);

    setTimeout(() => {
      try {
        canvas.toBlob((blob) => {
          if (!blob) throw new Error('Export blob error');
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `nodemonkes_poster_${layout}_${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 100);

          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#F59E0B', '#8B5CF6', '#10B981', '#38BDF8'],
          });

          onToast(t.posterSuccess, t.posterSuccessDesc, 'success');
          setIsExporting(false);
        }, 'image/png');
      } catch (err) {
        console.error('Export error:', err);
        setIsExporting(false);
      }
    }, 100);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2 px-2">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 text-xs font-mono font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.posterBadge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          {t.posterTitle}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-sans">
          {t.posterSub}
        </p>
      </div>

      {/* Presets & Batch Select Bar */}
      <div className="glass-panel p-3 rounded-2xl border border-white/10 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-mono text-slate-400 font-bold px-1 whitespace-nowrap">
            ⚡ {t.posterTemplates}:
          </span>
          {[
            { id: 'squad' as const, label: t.posterTemplateSquad },
            { id: 'duo' as const, label: t.posterTemplateDuo },
            { id: 'pyramid' as const, label: t.posterTemplatePyramid },
            { id: 'solo' as const, label: t.posterTemplateSolo },
            { id: 'scatter' as const, label: t.posterTemplateScatter },
          ].map((tp) => (
            <button
              key={tp.id}
              onClick={() => applyPresetTemplate(tp.id)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono font-semibold text-slate-200 hover:text-white border border-white/10 whitespace-nowrap active:scale-95 transition-all"
            >
              {tp.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition-all border shadow-sm',
              selectedIds.length === layers.length && layers.length > 0
                ? 'bg-purple-500/25 border-purple-400 text-purple-300'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
            )}
          >
            {selectedIds.length === layers.length && layers.length > 0 ? (
              <CheckSquare className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span>{selectedIds.length === layers.length && layers.length > 0 ? t.posterDeselectAll : t.posterSelectAll}</span>
          </button>

          <button
            onClick={() => handleAddMonke()}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold flex items-center gap-1 whitespace-nowrap active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.posterAddMonke}</span>
          </button>
        </div>
      </div>

      {/* Layer Selection Chips (Support Multi-Select & Drag Marquee) */}
      <div className="glass-panel p-2.5 rounded-2xl border border-white/10 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-mono text-slate-400 font-bold px-1 whitespace-nowrap flex items-center gap-1">
          <BoxSelect className="w-3.5 h-3.5 text-purple-400" />
          <span>{t.posterLayerList}:</span>
        </span>

        {/* Text Layer Chip */}
        <button
          onClick={() => setSelectedIds(['text'])}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all whitespace-nowrap',
            isTextSelected
              ? 'bg-purple-500/25 border-purple-400 text-purple-300 shadow-sm'
              : 'bg-slate-950/60 border-white/10 text-slate-300 hover:text-white'
          )}
        >
          <Type className="w-3 h-3 text-purple-400" />
          <span>文案排版 (Text)</span>
        </button>

        {/* Monke Layer Chips in order */}
        {layers.map((l, index) => {
          const isSelected = selectedIds.includes(l.id);
          return (
            <button
              key={l.id}
              onClick={(e) => {
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                  if (isSelected) {
                    setSelectedIds((prev) => prev.filter((id) => id !== l.id));
                  } else {
                    setSelectedIds((prev) => [...prev, l.id]);
                  }
                } else {
                  setSelectedIds([l.id]);
                }
              }}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition-all whitespace-nowrap',
                isSelected
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-sm'
                  : 'bg-slate-950/60 border-white/10 text-slate-300 hover:text-white'
              )}
            >
              <img
                src={getMonkeImageUrl(l.monkeId)}
                alt={`#${l.monkeId}`}
                className="w-4 h-4 rounded-md pixelated bg-black/50"
              />
              <span>#{l.monkeId}</span>
              {index === 0 && <span className="text-[9px] text-amber-400/80 font-normal">(顶层)</span>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Interactive Canvas Studio */}
        <div className="lg:col-span-8 flex flex-col items-center gap-3">
          
          {/* Canvas Box */}
          <div className="w-full glass-panel p-4 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center overflow-hidden relative group">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
              className="w-full h-auto max-h-[560px] object-contain rounded-2xl shadow-2xl border border-white/10 cursor-crosshair active:cursor-grabbing touch-none select-none"
            />

            {/* Floating Multi-Selection Group Toolbar */}
            {selectedMonkeLayers.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-purple-950/85 backdrop-blur-xl px-4 py-2 rounded-2xl border border-purple-400/30 shadow-2xl flex items-center gap-2.5 z-20">
                <span className="text-xs font-mono font-bold text-purple-200">
                  {t.posterMultiSelected.replace('{n}', String(selectedMonkeLayers.length))}
                </span>
                <div className="w-[1px] h-4 bg-white/15" />
                <button
                  onClick={() => handleBatchScale(-30)}
                  title="批量缩小"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleBatchScale(30)}
                  title="批量放大"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleBatchFlip}
                  title={t.posterBatchFlip}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-xs font-mono"
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span>翻转</span>
                </button>
                <button
                  onClick={handleBatchBringToFront}
                  title="批量置顶"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteSelected}
                  title={t.posterBatchDelete}
                  className="p-1.5 rounded-lg bg-rose-500/30 hover:bg-rose-500/40 text-rose-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  title="取消全选"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Floating Single-Selection Toolbar */}
            {selectedMonkeLayers.length === 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl px-3 py-1.5 rounded-2xl border border-white/15 shadow-2xl flex items-center gap-2 z-20">
                <button
                  onClick={() => handleBatchScale(-30)}
                  title="缩小"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-amber-300 px-1">
                  {Math.round(selectedMonkeLayers[0].size)}px
                </span>
                <button
                  onClick={() => handleBatchScale(30)}
                  title="放大"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-white/10" />
                <button
                  onClick={() => updatePrimaryMonke({ flipX: !selectedMonkeLayers[0].flipX })}
                  title={t.posterFlipH}
                  className={clsx(
                    'p-1.5 rounded-lg text-slate-300 hover:text-white',
                    selectedMonkeLayers[0].flipX ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5'
                  )}
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleBatchBringToFront()}
                  title={t.posterBringFront}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white"
                >
                  <ChevronsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteSelected}
                  title={t.posterDeleteMonke}
                  className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Export Action */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:brightness-110 text-white font-extrabold text-sm shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? t.posterExporting : `${t.posterExportBtn} (${FORMAT_CONFIG[layout].name})`}</span>
          </motion.button>
        </div>

        {/* Right: Properties Inspector Panel */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Format & Dimensions */}
          <div className="glass-panel p-4 rounded-3xl border border-white/10 space-y-2.5 shadow-xl">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.posterLayoutTitle}</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'banner' as PosterLayout, label: t.posterBanner },
                { id: 'wallpaper' as PosterLayout, label: t.posterWallpaper },
                { id: 'square' as PosterLayout, label: t.posterSquare },
                { id: 'cinema' as PosterLayout, label: t.posterCinema },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFormatChange(f.id)}
                  className={clsx(
                    'py-2 px-2.5 rounded-2xl border text-xs font-semibold transition-all text-center',
                    layout === f.id
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold shadow-sm'
                      : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Layer Inspector */}
          {isTextSelected ? (
            <div className="glass-panel p-4 rounded-3xl border border-purple-500/30 space-y-3.5 shadow-2xl bg-purple-950/10">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <span className="text-xs font-bold text-purple-300 font-mono flex items-center gap-1.5">
                  <Type className="w-4 h-4" />
                  <span>文案排版设置 (Text Layer)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">画布可拖拽</span>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">{t.posterHeadline}</label>
                <input
                  type="text"
                  value={textLayer.headline}
                  onChange={(e) => setTextLayer((t) => ({ ...t, headline: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">{t.posterSubheadline}</label>
                <input
                  type="text"
                  value={textLayer.subheadline}
                  onChange={(e) => setTextLayer((t) => ({ ...t, subheadline: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Font Size & Align */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{t.posterTextFontSize}</span>
                  <span className="text-white font-bold">{textLayer.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={24}
                  max={100}
                  step={2}
                  value={textLayer.fontSize}
                  onChange={(e) => setTextLayer((t) => ({ ...t, fontSize: parseInt(e.target.value, 10) }))}
                  className="w-full accent-purple-400 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] font-mono text-slate-400">对齐方式:</span>
                <div className="flex items-center gap-1">
                  {(['left', 'center', 'right'] as const).map((al) => (
                    <button
                      key={al}
                      onClick={() => setTextLayer((t) => ({ ...t, align: al }))}
                      className={clsx(
                        'px-2.5 py-1 rounded-xl text-xs font-mono uppercase',
                        textLayer.align === al
                          ? 'bg-purple-500/30 text-purple-300 font-bold border border-purple-400'
                          : 'bg-white/5 text-slate-400 border border-white/5'
                      )}
                    >
                      {al}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : selectedMonkeLayers.length > 1 ? (
            /* Multi-Selection Inspector */
            <div className="glass-panel p-4 rounded-3xl border border-purple-500/40 space-y-3.5 shadow-2xl bg-purple-950/20">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                <span className="text-xs font-bold text-purple-300 font-mono">
                  已多选 {selectedMonkeLayers.length} 只 NodeMonkes
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>批量删除</span>
                </button>
              </div>

              {/* Batch Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleBatchFlip}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-white border border-white/10 flex items-center justify-center gap-1.5"
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span>{t.posterBatchFlip}</span>
                </button>
                <button
                  onClick={handleDuplicateSelected}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-white border border-white/10 flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  <span>批量复制</span>
                </button>
                <button
                  onClick={handleBatchBringToFront}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-white border border-white/10 flex items-center justify-center gap-1.5"
                >
                  <ChevronsUp className="w-4 h-4" />
                  <span>批量置顶</span>
                </button>
                <button
                  onClick={handleBatchSendToBack}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-white border border-white/10 flex items-center justify-center gap-1.5"
                >
                  <ChevronsDown className="w-4 h-4" />
                  <span>批量置底</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-400 pt-1">
                💡 可以在画布上按住任意一只选中的猴子，整体同步平移或缩放。
              </div>
            </div>
          ) : primarySelectedMonke ? (
            /* Single Selected Monke Inspector */
            <div className="glass-panel p-4 rounded-3xl border border-amber-500/30 space-y-3.5 shadow-2xl bg-amber-950/10">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                <div className="flex items-center gap-2">
                  <img
                    src={getMonkeImageUrl(primarySelectedMonke.monkeId)}
                    alt={`#${primarySelectedMonke.monkeId}`}
                    className="w-7 h-7 rounded-lg bg-black/60 pixelated border border-white/10"
                  />
                  <span className="text-xs font-bold text-white font-mono">
                    NodeMonke #{primarySelectedMonke.monkeId}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDuplicateSelected}
                    title={t.posterDuplicateMonke}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    title={t.posterDeleteMonke}
                    className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ID Input */}
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-mono text-slate-400">更换猴子 ID:</label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={primarySelectedMonke.monkeId}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 1 && v <= 10000) {
                      updatePrimaryMonke({ monkeId: v });
                    }
                  }}
                  className="w-24 px-2 py-1 rounded-xl bg-slate-950/70 border border-white/10 text-center font-mono text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Scale Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{t.posterSize}</span>
                  <span className="text-white font-bold">{Math.round(primarySelectedMonke.size)}px</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={1400}
                  step={10}
                  value={primarySelectedMonke.size}
                  onChange={(e) => updatePrimaryMonke({ size: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>

              {/* Rotation Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{t.posterRotate}</span>
                  <span className="text-white font-bold">{primarySelectedMonke.rotation}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={primarySelectedMonke.rotation}
                    onChange={(e) => updatePrimaryMonke({ rotation: parseInt(e.target.value, 10) })}
                    className="flex-1 accent-amber-400 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={() => updatePrimaryMonke({ rotation: 0 })}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[10px] font-mono text-slate-300"
                  >
                    0°
                  </button>
                </div>
              </div>

              {/* Actions & Flip */}
              <div className="flex items-center justify-between gap-1 pt-1">
                <button
                  onClick={() => updatePrimaryMonke({ flipX: !primarySelectedMonke.flipX })}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all',
                    primarySelectedMonke.flipX
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  )}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>{t.posterFlipH}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleBatchBringToFront}
                    title={t.posterBringFront}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10"
                  >
                    <ChevronsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleBatchSendToBack}
                    title={t.posterSendBack}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10"
                  >
                    <ChevronsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel p-4 rounded-3xl border border-white/5 text-center py-5 space-y-2">
              <span className="text-xs font-mono text-slate-400 block">在画布上拖拽框选多个猴子，或点击单个猴子编辑</span>
            </div>
          )}

          {/* Custom Background & Lighting Panel */}
          <div className="glass-panel p-4 rounded-3xl border border-white/10 space-y-3 shadow-xl">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.posterThemeTitle}</span>
            </span>

            {/* Upload Custom BG */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleBgUpload}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{t.posterUploadBg}</span>
              </button>

              {customBgImage && (
                <button
                  onClick={() => setCustomBgImage(null)}
                  className="p-2 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-mono"
                  title={t.posterRemoveBg}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Built-in Aura Themes */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'btc' as AuraTheme, label: t.posterThemeBtc },
                { id: 'cyber' as AuraTheme, label: t.posterThemeCyber },
                { id: 'emerald' as AuraTheme, label: t.posterThemeEmerald },
                { id: 'dark' as AuraTheme, label: t.posterThemeDark },
                { id: 'minimal' as AuraTheme, label: t.posterThemeMinimal },
              ].map((th) => (
                <button
                  key={th.id}
                  onClick={() => {
                    setTheme(th.id);
                    setCustomBgImage(null);
                  }}
                  className={clsx(
                    'py-2 px-2 rounded-2xl border text-xs font-medium transition-all text-center',
                    theme === th.id && !customBgImage
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold shadow-sm'
                      : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {th.label}
                </button>
              ))}
            </div>

            {/* Custom Overlay Dimming Slider */}
            {customBgImage && (
              <div className="space-y-1 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>背景压暗蒙版</span>
                  <span className="text-white">{bgDim}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={bgDim}
                  onChange={(e) => setBgDim(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-400 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
