export type CustomTraitCategory = 'Head' | 'Eyes' | 'Mouth';

export interface CustomTraitItem {
  id: string;
  nameZh: string;
  nameEn: string;
  category: CustomTraitCategory;
  descZh: string;
  descEn: string;
  baseCoord: string;
  render: (ctx: CanvasRenderingContext2D, size: number) => void;
}

function px(ctx: CanvasRenderingContext2D, size: number, color: string, x: number, y: number, w: number = 1, h: number = 1) {
  const s = size / 28;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x * s), Math.round(y * s), Math.round(w * s), Math.round(h * s));
}

function clearPx(ctx: CanvasRenderingContext2D, size: number, x: number, y: number, w: number = 1, h: number = 1) {
  const s = size / 28;
  ctx.clearRect(Math.round(x * s), Math.round(y * s), Math.round(w * s), Math.round(h * s));
}

export const CUSTOM_TRAITS: Record<CustomTraitCategory, CustomTraitItem[]> = {
  Head: [
    {
      id: 'btc_crown',
      nameZh: '👑 比特币纯金皇冠',
      nameEn: 'BTC Golden Crown',
      category: 'Head',
      descZh: '三峰纯金王冠，嵌橙色 BTC 标志与 3 颗闪耀红宝石',
      descEn: 'Triple-peak solid gold crown with BTC logo & rubies',
      baseCoord: 'Y=9 基准线，向上生长至 Y=3',
      render: (ctx, size) => {
        // Gold Base
        px(ctx, size, '#EAB308', 8, 8, 13, 2);
        // Triple Peaks
        px(ctx, size, '#EAB308', 8, 4, 3, 4);
        px(ctx, size, '#EAB308', 13, 3, 3, 5);
        px(ctx, size, '#EAB308', 18, 4, 3, 4);
        // Rubies
        px(ctx, size, '#EF4444', 9, 5, 1, 1);
        px(ctx, size, '#EF4444', 14, 4, 1, 1);
        px(ctx, size, '#EF4444', 19, 5, 1, 1);
        // Center Orange BTC Emblem
        px(ctx, size, '#F97316', 13, 7, 3, 2);
        px(ctx, size, '#FFFFFF', 14, 7, 1, 1);
      }
    },
    {
      id: 'cyber_cap',
      nameZh: '🧢 赛博反戴机能帽',
      nameEn: 'Cyber Snapback Cap',
      category: 'Head',
      descZh: '潮流反戴机能帽，带发光青色条纹与金属搭扣',
      descEn: 'Backwards streetwear tech cap with cyan neon strip',
      baseCoord: 'Y=9 基准线，向上至 Y=5',
      render: (ctx, size) => {
        px(ctx, size, '#1E293B', 8, 7, 13, 3);
        px(ctx, size, '#1E293B', 9, 5, 11, 2);
        // Cyan neon strip
        px(ctx, size, '#06B6D4', 8, 8, 13, 1);
        // Backward visor
        px(ctx, size, '#0F172A', 5, 8, 3, 2);
      }
    },
    {
      id: 'astronaut_helmet',
      nameZh: '👨‍🚀 NASA 宇航员金盔',
      nameEn: 'Astro Reflective Helmet',
      category: 'Head',
      descZh: '全包围太空宇航盔，金色反光防辐射面罩',
      descEn: 'Full astronaut helmet with gold radiation visor',
      baseCoord: 'Y=9 基准线，外罩延伸至 Y=2',
      render: (ctx, size) => {
        px(ctx, size, '#F1F5F9', 7, 3, 15, 6);
        px(ctx, size, '#F1F5F9', 6, 6, 17, 4);
        // Gold Visor
        px(ctx, size, '#F59E0B', 9, 5, 11, 4);
        px(ctx, size, '#FEF08A', 10, 5, 4, 1);
        px(ctx, size, '#FEF08A', 9, 6, 2, 1);
      }
    },
    {
      id: 'wizard_hat',
      nameZh: '🧙‍♂️ 以太魔法巫师帽',
      nameEn: 'Ether Wizard Hat',
      category: 'Head',
      descZh: '深紫尖顶大檐魔法帽，带金色星星束带',
      descEn: 'Deep purple wizard cone hat with gold star band',
      baseCoord: 'Y=9 基准线，尖顶延伸至 Y=1',
      render: (ctx, size) => {
        px(ctx, size, '#4C1D95', 6, 8, 17, 2);
        px(ctx, size, '#4C1D95', 9, 6, 11, 2);
        px(ctx, size, '#4C1D95', 11, 4, 7, 2);
        px(ctx, size, '#4C1D95', 13, 2, 4, 2);
        px(ctx, size, '#4C1D95', 15, 1, 2, 2);
        // Gold Star Buckle
        px(ctx, size, '#FBBF24', 9, 7, 11, 1);
        px(ctx, size, '#FBBF24', 14, 6, 2, 2);
      }
    },
    {
      id: 'fire_mohawk',
      nameZh: '🔥 烈焰莫西干发型',
      nameEn: 'Flame Mohawk Hair',
      category: 'Head',
      descZh: '红橙黄三色渐变燃烧火焰朋克尖刺',
      descEn: 'Blazing tri-color flame punk mohawk spikes',
      baseCoord: 'Y=9 基准线，尖刺升至 Y=2',
      render: (ctx, size) => {
        px(ctx, size, '#DC2626', 12, 6, 5, 3);
        px(ctx, size, '#DC2626', 13, 3, 3, 4);
        px(ctx, size, '#DC2626', 14, 2, 2, 2);
        // Yellow core
        px(ctx, size, '#FBBF24', 13, 5, 3, 3);
        px(ctx, size, '#FBBF24', 14, 3, 1, 2);
        px(ctx, size, '#FFFFFF', 14, 4, 1, 1);
      }
    },
    {
      id: 'angel_halo',
      nameZh: '😇 神圣天使光环',
      nameEn: 'Holy Angel Halo',
      category: 'Head',
      descZh: '头顶悬浮的金黄色像素光环与神圣光斑',
      descEn: 'Floating golden sacred angel halo with sparkles',
      baseCoord: 'Y=9 头部上方，悬浮在 Y=3~4',
      render: (ctx, size) => {
        px(ctx, size, '#FDE047', 10, 3, 9, 2);
        clearPx(ctx, size, 12, 3, 5, 1);
        px(ctx, size, '#FFFFFF', 9, 4, 1, 1);
        px(ctx, size, '#FFFFFF', 19, 4, 1, 1);
      }
    }
  ],

  Eyes: [
    {
      id: 'cyber_vr',
      nameZh: '🥽 赛博全息头显 (Vision Pro)',
      nameEn: 'Vision Pro Cyber VR',
      category: 'Eyes',
      descZh: '横跨双眼的圆弧高科技发光条头显',
      descEn: 'Curved high-tech VR visor with cyan screen display',
      baseCoord: 'Y=13~15，X=10~20',
      render: (ctx, size) => {
        px(ctx, size, '#0F172A', 10, 13, 11, 4);
        px(ctx, size, '#06B6D4', 11, 14, 9, 2);
        px(ctx, size, '#FFFFFF', 12, 14, 3, 1);
        px(ctx, size, '#FFFFFF', 17, 15, 2, 1);
      }
    },
    {
      id: 'thug_shades',
      nameZh: '🕶️ 西海岸像素黑超 (Thug Life)',
      nameEn: 'Thug Life Pixel Shades',
      category: 'Eyes',
      descZh: '经典的阶梯型黑白反光像素墨镜',
      descEn: 'Authentic 8-bit stepped gangster pixel sunglasses',
      baseCoord: 'Y=13~15，X=10~20',
      render: (ctx, size) => {
        px(ctx, size, '#000000', 10, 13, 11, 1);
        px(ctx, size, '#000000', 10, 14, 5, 2);
        px(ctx, size, '#000000', 16, 14, 5, 2);
        // Glares
        px(ctx, size, '#FFFFFF', 10, 14, 1, 1);
        px(ctx, size, '#FFFFFF', 11, 15, 1, 1);
        px(ctx, size, '#FFFFFF', 16, 14, 1, 1);
        px(ctx, size, '#FFFFFF', 17, 15, 1, 1);
      }
    },
    {
      id: 'laser_eyes',
      nameZh: '⚡ 超能猩红激光眼',
      nameEn: 'Crimson Laser Eyes',
      category: 'Eyes',
      descZh: '向外贯穿喷射的高能红色充能激光光柱',
      descEn: 'Full-screen piercing scarlet power laser beams',
      baseCoord: 'Y=14，贯穿发射至全屏边界',
      render: (ctx, size) => {
        // Left beam
        px(ctx, size, '#EF4444', 0, 13, 14, 3);
        px(ctx, size, '#FFFFFF', 0, 14, 14, 1);
        // Right beam
        px(ctx, size, '#EF4444', 17, 13, 11, 3);
        px(ctx, size, '#FFFFFF', 17, 14, 11, 1);
        // Flares
        px(ctx, size, '#FDE047', 12, 13, 3, 3);
        px(ctx, size, '#FDE047', 17, 13, 3, 3);
      }
    },
    {
      id: 'cyborg_eye',
      nameZh: '🤖 终结者半机械红眼',
      nameEn: 'Terminator Cyborg Eye',
      category: 'Eyes',
      descZh: '左侧机械改造透镜，带红色准星雷达',
      descEn: 'Cybernetic modified steel eye with red radar target',
      baseCoord: 'Y=13~15，X=11~15',
      render: (ctx, size) => {
        px(ctx, size, '#64748B', 11, 13, 4, 4);
        px(ctx, size, '#DC2626', 12, 14, 2, 2);
        px(ctx, size, '#FEF08A', 12, 14, 1, 1);
      }
    },
    {
      id: 'heart_eyes',
      nameZh: '😍 恋爱粉红爱心眼',
      nameEn: 'Pink Heart Eyes',
      category: 'Eyes',
      descZh: '粉红闪亮发光心形眼眸',
      descEn: 'Glowing rose pink animated lover heart eyes',
      baseCoord: 'Y=13~15，X=10~19',
      render: (ctx, size) => {
        // Left heart
        px(ctx, size, '#F43F5E', 11, 13, 3, 1);
        px(ctx, size, '#F43F5E', 10, 14, 5, 1);
        px(ctx, size, '#F43F5E', 11, 15, 3, 1);
        px(ctx, size, '#F43F5E', 12, 16, 1, 1);
        // Right heart
        px(ctx, size, '#F43F5E', 16, 13, 3, 1);
        px(ctx, size, '#F43F5E', 15, 14, 5, 1);
        px(ctx, size, '#F43F5E', 16, 15, 3, 1);
        px(ctx, size, '#F43F5E', 17, 16, 1, 1);
      }
    }
  ],

  Mouth: [
    {
      id: 'gold_cigar',
      nameZh: '🚬 大金牙 + 冒烟雪茄',
      nameEn: 'Gold Tooth & Smokin Cigar',
      category: 'Mouth',
      descZh: '嘴叼燃烧的古巴雪茄，嘴露大金牙，升起袅袅白烟',
      descEn: 'Burning Cuban cigar with rising smoke & gold tooth',
      baseCoord: 'Y=18~20，X=14~24',
      render: (ctx, size) => {
        // Gold Tooth
        px(ctx, size, '#F59E0B', 14, 18, 2, 1);
        // Cigar
        px(ctx, size, '#78350F', 16, 18, 5, 2);
        px(ctx, size, '#EF4444', 21, 18, 1, 2);
        px(ctx, size, '#F59E0B', 22, 18, 1, 1);
        // Smoke
        px(ctx, size, 'rgba(241, 245, 249, 0.75)', 23, 17, 2, 2);
        px(ctx, size, 'rgba(241, 245, 249, 0.75)', 24, 14, 2, 2);
        px(ctx, size, 'rgba(241, 245, 249, 0.75)', 22, 12, 3, 2);
      }
    },
    {
      id: 'bubblegum',
      nameZh: '🫧 鲜艳粉红泡泡糖',
      nameEn: 'Pink Bubblegum Pop',
      category: 'Mouth',
      descZh: '嘴前吹出的大号粉色半透明泡泡',
      descEn: 'Gigantic shiny translucent pink bubblegum sphere',
      baseCoord: 'Y=17~21，X=15~22',
      render: (ctx, size) => {
        px(ctx, size, '#FB7185', 16, 17, 5, 5);
        px(ctx, size, '#FB7185', 15, 18, 7, 3);
        px(ctx, size, '#FFFFFF', 17, 18, 2, 1);
        px(ctx, size, '#FFFFFF', 16, 19, 1, 1);
      }
    },
    {
      id: 'diamond_chain',
      nameZh: '💎 古巴大金链 + BTC吊坠',
      nameEn: 'Cuban Diamond Chain & BTC Medal',
      category: 'Mouth',
      descZh: '胸前粗重大金链，挂着一枚闪亮的比特币金牌',
      descEn: 'Heavyweight gold cuban chain with gleaming BTC medal',
      baseCoord: 'Y=21~25，X=9~20',
      render: (ctx, size) => {
        px(ctx, size, '#EAB308', 9, 21, 2, 2);
        px(ctx, size, '#EAB308', 10, 22, 2, 2);
        px(ctx, size, '#EAB308', 18, 21, 2, 2);
        px(ctx, size, '#EAB308', 17, 22, 2, 2);
        px(ctx, size, '#EAB308', 12, 23, 5, 2);
        // BTC Medallion
        px(ctx, size, '#F59E0B', 13, 24, 3, 3);
        px(ctx, size, '#FFFFFF', 14, 25, 1, 1);
      }
    },
    {
      id: 'gas_mask',
      nameZh: '☣️ 赛博重装防毒面罩',
      nameEn: 'Cyberpunk Gas Mask',
      category: 'Mouth',
      descZh: '下半脸双滤罐机械面罩，带青色呼吸呼吸光点',
      descEn: 'Dual-canister armored respirator with glowing cyan valve',
      baseCoord: 'Y=16~22，X=9~20',
      render: (ctx, size) => {
        px(ctx, size, '#334155', 10, 17, 10, 4);
        px(ctx, size, '#334155', 12, 16, 6, 6);
        px(ctx, size, '#1E293B', 9, 18, 3, 3);
        px(ctx, size, '#1E293B', 18, 18, 3, 3);
        px(ctx, size, '#06B6D4', 14, 18, 2, 2);
      }
    }
  ]
};

export function getCustomTraitParts(category: 'Head' | 'Eyes' | 'Earring', lang: 'zh' | 'en' = 'zh'): Array<{ value: string; url: string }> {
  if (typeof document === 'undefined') return [];
  const catKey = category === 'Earring' ? 'Mouth' : category;
  const items = CUSTOM_TRAITS[catKey as 'Head' | 'Eyes' | 'Mouth'] || [];
  
  return items.map((item) => {
    const canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      item.render(ctx, 28);
    }
    const cleanName = lang === 'zh' ? item.nameZh.replace(/^[^\s]+\s*/, '') : item.nameEn;
    return {
      value: `✨ ${cleanName}`,
      url: canvas.toDataURL('image/png'),
    };
  });
}

