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
      nameZh: '👑 纯金皇冠',
      nameEn: 'BTC Golden Crown',
      category: 'Head',
      descZh: '三峰纯金王冠，嵌橙色 BTC 标志与 3 颗闪耀红宝石',
      descEn: 'Triple-peak solid gold crown with BTC logo & rubies',
      baseCoord: 'Y=10~11 基准线，向上生长至 Y=4',
      render: (ctx, size) => {
        // Gold Base
        px(ctx, size, '#EAB308', 8, 9, 13, 3);
        // Triple Peaks
        px(ctx, size, '#EAB308', 8, 5, 3, 4);
        px(ctx, size, '#EAB308', 13, 4, 3, 5);
        px(ctx, size, '#EAB308', 18, 5, 3, 4);
        // Rubies
        px(ctx, size, '#EF4444', 9, 6, 1, 1);
        px(ctx, size, '#EF4444', 14, 5, 1, 1);
        px(ctx, size, '#EF4444', 19, 6, 1, 1);
        // Center Orange BTC Emblem
        px(ctx, size, '#F97316', 13, 8, 3, 3);
        px(ctx, size, '#FFFFFF', 14, 9, 1, 1);
      }
    },
    {
      id: 'cyber_cap',
      nameZh: '🧢 赛博机能帽',
      nameEn: 'Cyber Snapback Cap',
      category: 'Head',
      descZh: '潮流反戴机能帽，带发光青色条纹与金属搭扣',
      descEn: 'Backwards streetwear tech cap with cyan neon strip',
      baseCoord: 'Y=10~11 基准线，向上至 Y=6',
      render: (ctx, size) => {
        px(ctx, size, '#1E293B', 8, 8, 13, 4);
        px(ctx, size, '#1E293B', 9, 6, 11, 2);
        // Cyan neon strip
        px(ctx, size, '#06B6D4', 8, 9, 13, 1);
        // Backward visor
        px(ctx, size, '#0F172A', 5, 9, 3, 2);
      }
    },
    {
      id: 'astronaut_helmet',
      nameZh: '👨‍🚀 宇航员金盔',
      nameEn: 'Astro Reflective Helmet',
      category: 'Head',
      descZh: '全包围太空宇航盔，金色反光防辐射面罩',
      descEn: 'Full astronaut helmet with gold radiation visor',
      baseCoord: 'Y=11 基准线，外罩延伸至 Y=4',
      render: (ctx, size) => {
        px(ctx, size, '#F1F5F9', 7, 4, 15, 8);
        px(ctx, size, '#F1F5F9', 6, 7, 17, 5);
        // Gold Visor
        px(ctx, size, '#F59E0B', 9, 6, 11, 5);
        px(ctx, size, '#FEF08A', 10, 6, 4, 1);
        px(ctx, size, '#FEF08A', 9, 7, 2, 1);
      }
    },
    {
      id: 'wizard_hat',
      nameZh: '🧙‍♂️ 魔法巫师帽',
      nameEn: 'Ether Wizard Hat',
      category: 'Head',
      descZh: '深紫尖顶大檐魔法帽，带金色星星束带',
      descEn: 'Deep purple wizard cone hat with gold star band',
      baseCoord: 'Y=11 基准线，尖顶延伸至 Y=2',
      render: (ctx, size) => {
        px(ctx, size, '#4C1D95', 6, 10, 17, 2);
        px(ctx, size, '#4C1D95', 9, 8, 11, 2);
        px(ctx, size, '#4C1D95', 11, 5, 7, 3);
        px(ctx, size, '#4C1D95', 13, 3, 4, 2);
        px(ctx, size, '#4C1D95', 15, 2, 2, 2);
        // Gold Star Buckle
        px(ctx, size, '#FBBF24', 9, 9, 11, 1);
        px(ctx, size, '#FBBF24', 14, 8, 2, 2);
      }
    },
    {
      id: 'fire_mohawk',
      nameZh: '🔥 烈焰莫西干',
      nameEn: 'Flame Mohawk Hair',
      category: 'Head',
      descZh: '红橙黄三色渐变燃烧火焰朋克尖刺',
      descEn: 'Blazing tri-color flame punk mohawk spikes',
      baseCoord: 'Y=11 基准线，尖刺升至 Y=3',
      render: (ctx, size) => {
        px(ctx, size, '#DC2626', 12, 7, 5, 4);
        px(ctx, size, '#DC2626', 13, 4, 3, 4);
        px(ctx, size, '#DC2626', 14, 3, 2, 2);
        // Yellow core
        px(ctx, size, '#FBBF24', 13, 6, 3, 4);
        px(ctx, size, '#FBBF24', 14, 4, 1, 2);
        px(ctx, size, '#FFFFFF', 14, 5, 1, 1);
      }
    },
    {
      id: 'angel_halo',
      nameZh: '😇 天使光环',
      nameEn: 'Holy Angel Halo',
      category: 'Head',
      descZh: '头顶悬浮的金黄色像素光环与神圣光斑',
      descEn: 'Floating golden sacred angel halo with sparkles',
      baseCoord: 'Y=11 头部上方，悬浮在 Y=5~6',
      render: (ctx, size) => {
        px(ctx, size, '#FDE047', 9, 5, 11, 2);
        clearPx(ctx, size, 11, 5, 7, 1);
        px(ctx, size, '#FFFFFF', 9, 6, 1, 1);
        px(ctx, size, '#FFFFFF', 19, 6, 1, 1);
      }
    }
  ],

  Eyes: [
    {
      id: 'cyber_vr',
      nameZh: '🥽 赛博全息头显',
      nameEn: 'Vision Pro Cyber VR',
      category: 'Eyes',
      descZh: '完全覆盖黑白眼睛的高科技圆弧全息头显',
      descEn: 'Full-coverage curved high-tech VR visor with cyan display',
      baseCoord: '完全覆盖 X=11~24, Y=13~16',
      render: (ctx, size) => {
        // Full eye block coverage
        px(ctx, size, '#0F172A', 11, 13, 14, 4);
        px(ctx, size, '#06B6D4', 12, 14, 12, 2);
        px(ctx, size, '#FFFFFF', 13, 14, 4, 1);
        px(ctx, size, '#FFFFFF', 20, 15, 3, 1);
      }
    },
    {
      id: 'thug_shades',
      nameZh: '🕶️ 西海岸黑超',
      nameEn: 'Thug Life Pixel Shades',
      category: 'Eyes',
      descZh: '完全覆盖两眼的西海岸阶梯反光像素墨镜',
      descEn: 'Full-coverage 8-bit stepped gangster sunglasses',
      baseCoord: '完全覆盖 X=11~24, Y=13~16',
      render: (ctx, size) => {
        px(ctx, size, '#000000', 11, 13, 14, 1);
        px(ctx, size, '#000000', 12, 14, 6, 3);
        px(ctx, size, '#000000', 18, 14, 7, 3);
        // Step Glares
        px(ctx, size, '#FFFFFF', 12, 14, 1, 1);
        px(ctx, size, '#FFFFFF', 13, 15, 1, 1);
        px(ctx, size, '#FFFFFF', 18, 14, 1, 1);
        px(ctx, size, '#FFFFFF', 19, 15, 1, 1);
      }
    },
    {
      id: 'laser_eyes',
      nameZh: '⚡ 猩红激光眼',
      nameEn: 'Crimson Laser Eyes',
      category: 'Eyes',
      descZh: '完全覆盖双眼并向右喷射的高能猩红激光束',
      descEn: 'Full eye covering scarlet power laser beams extending right',
      baseCoord: '完全覆盖 X=13~27, Y=13~16',
      render: (ctx, size) => {
        // Cover both eyes and shoot right
        px(ctx, size, '#DC2626', 11, 13, 17, 4);
        px(ctx, size, '#EF4444', 12, 14, 16, 2);
        px(ctx, size, '#FFFFFF', 13, 14, 15, 1);
        // Energy sparks
        px(ctx, size, '#FDE047', 13, 13, 2, 2);
        px(ctx, size, '#FDE047', 19, 13, 2, 2);
      }
    },
    {
      id: 'cyborg_eye',
      nameZh: '🤖 终结者红眼',
      nameEn: 'Terminator Cyborg Eye',
      category: 'Eyes',
      descZh: '完全覆盖双眼的终结者机械护甲与红色雷达眼',
      descEn: 'Cybernetic modified steel plate with red radar target',
      baseCoord: '完全覆盖 X=11~24, Y=13~16',
      render: (ctx, size) => {
        // Steel plate covering entire eye zone
        px(ctx, size, '#475569', 11, 13, 14, 4);
        px(ctx, size, '#64748B', 12, 14, 5, 2);
        // Glowing Red Radar Eye
        px(ctx, size, '#DC2626', 18, 13, 6, 4);
        px(ctx, size, '#EF4444', 19, 14, 4, 2);
        px(ctx, size, '#FEF08A', 20, 14, 2, 1);
      }
    },
    {
      id: 'heart_eyes',
      nameZh: '😍 恋爱爱心眼',
      nameEn: 'Pink Heart Eyes',
      category: 'Eyes',
      descZh: '完全覆盖双眼的粉红发光爱心眼眸',
      descEn: 'Glowing rose pink lover heart eyes covering raw eyes',
      baseCoord: '完全覆盖 X=11~24, Y=13~16',
      render: (ctx, size) => {
        // Left Heart (covering X: 11~17, Y: 13~16)
        px(ctx, size, '#F43F5E', 12, 13, 4, 1);
        px(ctx, size, '#F43F5E', 11, 14, 6, 2);
        px(ctx, size, '#F43F5E', 12, 16, 4, 1);
        px(ctx, size, '#FFFFFF', 12, 14, 1, 1);

        // Right Heart (covering X: 18~24, Y: 13~16)
        px(ctx, size, '#F43F5E', 19, 13, 4, 1);
        px(ctx, size, '#F43F5E', 18, 14, 6, 2);
        px(ctx, size, '#F43F5E', 19, 16, 4, 1);
        px(ctx, size, '#FFFFFF', 19, 14, 1, 1);
      }
    }
  ],

  Mouth: [
    {
      id: 'gold_cigar',
      nameZh: '🚬 大金牙雪茄',
      nameEn: 'Gold Tooth & Smokin Cigar',
      category: 'Mouth',
      descZh: '嘴叼燃烧的古巴雪茄，嘴露大金牙，升起袅袅白烟',
      descEn: 'Burning Cuban cigar with rising smoke & gold tooth',
      baseCoord: 'Y=17~19，X=14~24',
      render: (ctx, size) => {
        // Gold Tooth
        px(ctx, size, '#F59E0B', 14, 17, 2, 2);
        // Cigar
        px(ctx, size, '#78350F', 16, 17, 5, 2);
        px(ctx, size, '#EF4444', 21, 17, 1, 2);
        px(ctx, size, '#F59E0B', 22, 17, 1, 1);
        // Smoke
        px(ctx, size, 'rgba(241, 245, 249, 0.85)', 23, 16, 2, 2);
        px(ctx, size, 'rgba(241, 245, 249, 0.85)', 24, 13, 2, 2);
        px(ctx, size, 'rgba(241, 245, 249, 0.85)', 22, 11, 3, 2);
      }
    },
    {
      id: 'bubblegum',
      nameZh: '🫧 粉红泡泡糖',
      nameEn: 'Pink Bubblegum Pop',
      category: 'Mouth',
      descZh: '嘴前吹出的大号粉色半透明泡泡',
      descEn: 'Gigantic shiny translucent pink bubblegum sphere',
      baseCoord: 'Y=16~21，X=15~23',
      render: (ctx, size) => {
        px(ctx, size, '#FB7185', 16, 16, 6, 6);
        px(ctx, size, '#FB7185', 15, 17, 8, 4);
        px(ctx, size, '#FFFFFF', 17, 17, 2, 1);
        px(ctx, size, '#FFFFFF', 16, 18, 1, 1);
      }
    },
    {
      id: 'diamond_chain',
      nameZh: '💎 古巴大金链',
      nameEn: 'Cuban Diamond Chain & BTC Medal',
      category: 'Mouth',
      descZh: '胸前粗重大金链，挂着一枚闪亮的比特币金牌',
      descEn: 'Heavyweight gold cuban chain with gleaming BTC medal',
      baseCoord: 'Y=21~26，X=9~21',
      render: (ctx, size) => {
        px(ctx, size, '#EAB308', 9, 21, 2, 2);
        px(ctx, size, '#EAB308', 10, 22, 2, 2);
        px(ctx, size, '#EAB308', 19, 21, 2, 2);
        px(ctx, size, '#EAB308', 18, 22, 2, 2);
        px(ctx, size, '#EAB308', 12, 23, 6, 2);
        // BTC Medallion
        px(ctx, size, '#F59E0B', 13, 24, 4, 3);
        px(ctx, size, '#FFFFFF', 14, 25, 1, 1);
      }
    },
    {
      id: 'gas_mask',
      nameZh: '☣️ 赛博防毒面具',
      nameEn: 'Cyberpunk Gas Mask',
      category: 'Mouth',
      descZh: '下半脸双滤罐机械面罩，带青色呼吸光点',
      descEn: 'Dual-canister armored respirator with glowing cyan valve',
      baseCoord: 'Y=16~21，X=9~24',
      render: (ctx, size) => {
        px(ctx, size, '#334155', 10, 17, 12, 4);
        px(ctx, size, '#334155', 12, 16, 8, 5);
        px(ctx, size, '#1E293B', 9, 17, 3, 3);
        px(ctx, size, '#1E293B', 20, 17, 3, 3);
        px(ctx, size, '#06B6D4', 15, 17, 2, 2);
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
