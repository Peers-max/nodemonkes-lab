export type SeriesType = 'normal' | 'dog' | 'block' | 'rabbit' | 'peer';
export type CategoryType = 'Body' | 'Earring' | 'Eyes' | 'Head';
export type BgModeType = 'transparent' | 'black' | 'orange' | 'green' | 'custom';

export interface TraitPart {
  value: string;
  url: string;
}

export interface PixelColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type PixelGrid = (PixelColor | null)[][];

export interface FxOption {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  categoryEn: string;
  desc: string;
  descEn: string;
}

export type MotionActionType = 
  | 'static'
  | 'masternod' 
  | 'nod' 
  | 'headbang' 
  | 'boxing' 
  | 'boss' 
  | 'pump' 
  | 'moon' 
  | 'orbit';

export interface MotionActionMeta {
  id: MotionActionType;
  icon: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  frameCount: number;
}

export const HEAD_FX_LIST: FxOption[] = [
  {
    id: 'none',
    name: '🚫 静态无特效',
    nameEn: '🚫 Static (No FX)',
    category: '原生状态',
    categoryEn: 'Original',
    desc: '保持配件原始像素质感，无动态光效',
    descEn: 'Keep native pixel texture, no dynamic shimmer'
  },
  {
    id: 'vertical_shimmer',
    name: '✨ 从左到右竖条流光 (精选)',
    nameEn: '✨ Vertical Shimmer (Featured)',
    category: '流光光效',
    categoryEn: 'Shimmer',
    desc: '纯正银白金属竖条流光从左至右匀速划过',
    descEn: 'Clean metallic vertical gleam passing smoothly from left to right'
  },
  {
    id: 'dual_beam',
    name: '💫 双轨交替垂直流光',
    nameEn: '💫 Dual Alternating Beams',
    category: '流光光效',
    categoryEn: 'Shimmer',
    desc: '前后两道明暗相间流光交替划过',
    descEn: 'Two alternating light beams sweeping across the hat'
  },
  {
    id: 'diagonal_glint',
    name: '⚡ 45°对角高级斜切流光',
    nameEn: '⚡ 45° Diagonal Luxury Glint',
    category: '流光光效',
    categoryEn: 'Shimmer',
    desc: '45度斜向切割光泽，奢华质感',
    descEn: 'Crisp 45-degree diagonal specular sheen, luxurious feel'
  },
  {
    id: 'pingpong_radar',
    name: '📡 左右往返雷达扫描光',
    nameEn: '📡 Ping-Pong Radar Scan',
    category: '流光光效',
    categoryEn: 'Shimmer',
    desc: '流光平滑在配件左右往返摆动',
    descEn: 'Smooth back-and-forth horizontal scanning beam'
  },
  {
    id: 'comet_trail',
    name: '☄️ 极速彗星拖尾流光',
    nameEn: '☄️ Comet Trail Streaks',
    category: '流光光效',
    categoryEn: 'Shimmer',
    desc: '强光头部带有渐隐拖尾划过',
    descEn: 'Intense leading sparkle with fading comet tail'
  },
  {
    id: 'holo_prism',
    name: '🌈 全息棱镜彩虹流光',
    nameEn: '🌈 Holographic Prism Rainbow',
    category: '炫彩流行',
    categoryEn: 'Vibrant',
    desc: 'RGB色相环如彩虹在配件表面流动',
    descEn: 'Vibrant RGB color spectrum flowing across the accessory'
  },
  {
    id: 'cyber_neon',
    name: '🔮 赛博霓虹双色脉冲',
    nameEn: '🔮 Cyber Neon Dual Pulse',
    category: '炫彩流行',
    categoryEn: 'Vibrant',
    desc: '青蓝与洋红双色交替流转',
    descEn: 'Alternating cyan and magenta cyber pulses'
  },
  {
    id: 'pure_gold',
    name: '👑 24K 纯金尊贵流光',
    nameEn: '👑 24K Pure Gold Sheen',
    category: '炫彩流行',
    categoryEn: 'Vibrant',
    desc: '高饱和度暖金色奢华流光划过',
    descEn: 'High-saturation rich golden liquid sheen'
  },
  {
    id: 'imperial_jade',
    name: '🍃 翡翠温润水头微光',
    nameEn: '🍃 Imperial Jade Glow',
    category: '炫彩流行',
    categoryEn: 'Vibrant',
    desc: '翠绿通透的东方玉石光泽',
    descEn: 'Translucent emerald glow with serene oriental jade luster'
  },
  {
    id: 'glacier_ice',
    name: '❄️ 极地冰晶幽蓝闪耀',
    nameEn: '❄️ Polar Ice Crystal Flare',
    category: '炫彩流行',
    categoryEn: 'Vibrant',
    desc: '高亮冰蓝色光线与微冷呼吸',
    descEn: 'Bright cyan-blue chill flare with cold pulse'
  },
  {
    id: 'electric_arc',
    name: '⚡ 高能电弧雷暴脉冲',
    nameEn: '⚡ High-Voltage Arc Storm',
    category: '科技能量',
    categoryEn: 'Cyber',
    desc: '蓝白色高压电弧火花高频跳动',
    descEn: 'White-blue high-energy electrical arcs sparking rapidly'
  },
  {
    id: 'matrix_scan',
    name: '👾 矩阵终端绿色扫描',
    nameEn: '👾 Matrix Terminal Scan',
    category: '科技能量',
    categoryEn: 'Cyber',
    desc: '荧光绿数据扫描线自上而下扫过',
    descEn: 'Phosphor-green tactical scanning bar moving downwards'
  },
  {
    id: 'overcharge',
    name: '🔋 超能充能过载爆闪',
    nameEn: '🔋 Overcharge Reactor Burst',
    category: '科技能量',
    categoryEn: 'Cyber',
    desc: '能量凝聚至极亮瞬间爆发',
    descEn: 'Condensing energy charge erupting into bright flash'
  },
  {
    id: 'terminator_red',
    name: '🤖 终结者猩红雷达',
    nameEn: '🤖 Terminator Red Radar',
    category: '科技能量',
    categoryEn: 'Cyber',
    desc: '猩红战术扫描波段由左向右扫过',
    descEn: 'Crimson tactical infrared sensor sweeping left to right'
  },
  {
    id: 'cosmic_stardust',
    name: '🌌 深空暗夜星尘微光',
    nameEn: '🌌 Deep Space Stardust Glow',
    category: '科技能量',
    categoryEn: 'Cyber',
    desc: '深紫与星金色星云粒子缓缓流动',
    descEn: 'Dark purple and starlight gold nebular particles drifting'
  },
  {
    id: 'diamond_bling',
    name: '💎 钻石十字星芒爆闪',
    nameEn: '💎 Diamond Cross Star Sparkle',
    category: '珠宝自然',
    categoryEn: 'Jewelry',
    desc: '关键顶点爆出纯白十字星芒闪光',
    descEn: 'Pure white four-point starburst gleam on key corners'
  },
  {
    id: 'lava_flame',
    name: '🔥 炽热熔岩烈焰涌动',
    nameEn: '🔥 Molten Lava Flare',
    category: '珠宝自然',
    categoryEn: 'Jewelry',
    desc: '炽热赤金自下而上升腾的火焰',
    descEn: 'Rising molten gold and crimson flame embers'
  },
  {
    id: 'ocean_tidal',
    name: '🌊 碧海潮汐水波纹律动',
    nameEn: '🌊 Ocean Tidal Ripple',
    category: '珠宝自然',
    categoryEn: 'Jewelry',
    desc: '水波纹在配件表面优雅柔和荡漾',
    descEn: 'Graceful undulating water ripples across accessory surface'
  },
  {
    id: 'luxury_breathe',
    name: '💓 极简奢华正弦呼吸',
    nameEn: '💓 Subtle Sinusoidal Pulse',
    category: '珠宝自然',
    categoryEn: 'Jewelry',
    desc: '沉稳柔和的正弦波明暗光影呼吸',
    descEn: 'Gentle and rhythmic ambient lighting breath'
  },
  {
    id: 'twinkling_stars',
    name: '⭐ 闪烁繁星交织眨眼',
    nameEn: '⭐ Constellation Twinkle',
    category: '珠宝自然',
    categoryEn: 'Jewelry',
    desc: '多点像素犹如夜空繁星交替闪烁',
    descEn: 'Scattered micro-pixels twinkling like a starry night sky'
  }
];

export const EYE_FX_LIST: FxOption[] = [
  {
    id: 'none',
    name: '🚫 静态无特效',
    nameEn: '🚫 Static (No FX)',
    category: '原生状态',
    categoryEn: 'Original',
    desc: '保持眼部原始像素质感，无动态眨眼与光效',
    descEn: 'Keep native pixel eyes without animation or blinks'
  },
  {
    id: 'natural_blink',
    name: '👀 自然真实眨眼 (精选)',
    nameEn: '👀 Natural Real Blink (Featured)',
    category: '神态表情',
    categoryEn: 'Expressions',
    desc: '眼睑自然闭合与睁开，Pepe 专属绿睑，0 色块瑕疵',
    descEn: 'Organic eyelid blink with custom Pepe green lid, zero artifacts'
  },
  {
    id: 'chill_squint',
    name: '😊 惬意微眯微笑',
    nameEn: '😊 Chill Squint Smile',
    category: '神态表情',
    categoryEn: 'Expressions',
    desc: '双眼/三眼惬意对称微眯微笑，神态悠闲自然',
    descEn: 'Relaxed symmetrical squint and confident laid-back gaze'
  },
  {
    id: 'gaze_highlight',
    name: '✨ 灵动流转高光',
    nameEn: '✨ Dynamic Gaze Highlights',
    category: '光影闪耀',
    categoryEn: 'Gleam',
    desc: '细腻柔和的高光在眼部与镜片表面优雅流转，晶莹剔透',
    descEn: 'Silky smooth specular shine gliding across eyes and visor'
  },
  {
    id: 'divine_gold',
    name: '👑 黄金神性凝视',
    nameEn: '👑 Divine Golden Gaze',
    category: '光影闪耀',
    categoryEn: 'Gleam',
    desc: '尊贵温润的 24K 流金神性光芒，眼波流转华贵非凡',
    descEn: 'Prestigious 24K liquid gold aura radiating from the gaze'
  },
  {
    id: 'cyber_scan',
    name: '⚡ 赛博矩阵横扫',
    nameEn: '⚡ Cyber Matrix Scan',
    category: '赛博硬核',
    categoryEn: 'Cyber',
    desc: '青蓝激光扫描线横穿镜片，极具科技质感',
    descEn: 'Cyan laser line traversing eyes with tactical precision'
  },
  {
    id: 'holo_iridescent',
    name: '🌈 镀膜全息彩虹',
    nameEn: '🌈 Holo Iridescent Coating',
    category: '光影闪耀',
    categoryEn: 'Gleam',
    desc: '顶级光学镀膜反光，青-紫-金幻彩循环流转',
    descEn: 'Premium anti-reflective cyan-purple-gold chromatic sheen'
  },
  {
    id: 'plasma_burst',
    name: '💥 等离子充能爆闪',
    nameEn: '💥 Plasma Charge Flash',
    category: '能量爆发',
    categoryEn: 'Energy',
    desc: '能量在核心凝聚蓄力，瞬间爆发纯白电离光芒',
    descEn: 'Energy gathers at the core then explodes into ionizing flash'
  },
  {
    id: 'aurora_flow',
    name: '🌌 幽邃极光律动',
    nameEn: '🌌 Aurora Borealis Flow',
    category: '光影闪耀',
    categoryEn: 'Gleam',
    desc: '极光绿与电光紫交织，在眼部柔和波浪涌动',
    descEn: 'Entwined auroral green and violet rolling softly across eyes'
  },
  {
    id: 'deep_pulse',
    name: '💓 沉稳暗涌呼吸',
    nameEn: '💓 Deep Vitality Pulse',
    category: '神态表情',
    categoryEn: 'Expressions',
    desc: '如心脏与呼吸同频，深邃暗涌起伏，赋予生命力',
    descEn: 'Heartbeat-synced breathing glow giving lifelike depth'
  },
  {
    id: 'glitch_jitter',
    name: '👾 赛博故障微抖',
    nameEn: '👾 Cyberpunk Glitch Jitter',
    category: '赛博硬核',
    categoryEn: 'Cyber',
    desc: '瞬时 RGB 色道分离与像素微撕裂，纯正赛博朋克',
    descEn: 'Instant RGB split and subtle pixel micro-tear effect'
  },
  {
    id: 'matrix_rain',
    name: '💧 赛博数码雨滴',
    nameEn: '💧 Matrix Code Raindrops',
    category: '赛博硬核',
    categoryEn: 'Cyber',
    desc: '荧光绿数字雨滴沿镜面纵向穿梭流动',
    descEn: 'Phosphor-green binary drips cascading through visor'
  },
  {
    id: 'inferno_ember',
    name: '🔥 炽焰余烬火光',
    nameEn: '🔥 Inferno Ember Flare',
    category: '能量爆发',
    categoryEn: 'Energy',
    desc: '宛如暗夜烈火跳跃，暖金与赤红火光生动闪烁',
    descEn: 'Fiery warm gold and crimson ember flickers like real fire'
  },
  {
    id: 'sleepy_snap',
    name: '💤 困倦打盹惊醒',
    nameEn: '💤 Sleepy Nod & Snap',
    category: '神态表情',
    categoryEn: 'Expressions',
    desc: '眼皮缓缓垂下打瞌睡，瞬间猛然睁开回神',
    descEn: 'Slow drowsy eyelid drop followed by a sudden alert snap'
  },
  {
    id: 'neon_tracer',
    name: '💎 霓虹环绕流萤',
    nameEn: '💎 Neon Orbit Tracer',
    category: '光影闪耀',
    categoryEn: 'Gleam',
    desc: '高亮霓虹光点沿眼部外轮廓流畅游走',
    descEn: 'Luminous neon sparks circling the contours of the eyes'
  },
  {
    id: 'frost_gaze',
    name: '❄️ 极地冰晶幽光',
    nameEn: '❄️ Glacial Crystal Gaze',
    category: '光影闪耀',
    categoryEn: 'Gleam',
    desc: '清冽通透的极地冰蓝微光流淌，宛若晶莹冰晶',
    descEn: 'Crisp and translucent icy-blue micro-shimmer'
  },
  {
    id: 'overheat_alert',
    name: '🚨 战力超频红温',
    nameEn: '🚨 Overheat Tactical Strobe',
    category: '能量爆发',
    categoryEn: 'Energy',
    desc: '机体超载警报，双重急促红光频闪并散温',
    descEn: 'Critical overdrive warning: rapid twin red strobes with heat cooling'
  },
  {
    id: 'nebula_pulse',
    name: '🔮 虚空星云紫芒',
    nameEn: '🔮 Void Nebula Pulse',
    category: '能量爆发',
    categoryEn: 'Energy',
    desc: '深邃虚空星云紫气律动涌动，神秘深邃能量凝聚',
    descEn: 'Deep mystical cosmic violet energy undulating in the void'
  },
  {
    id: 'disco_spectrum',
    name: '🪩 迪斯科炫彩波普',
    nameEn: '🪩 Pop Disco Spectrum',
    category: '潮流动感',
    categoryEn: 'Dynamic',
    desc: '波普粉、电光蓝、荧光绿高频色彩律动',
    descEn: 'High-frequency rhythmic pop pink, electric blue and neon yellow'
  },
  {
    id: 'hex_shield',
    name: '🛡️ 六边形能量盾',
    nameEn: '🛡️ Hexagonal Energy Shield',
    category: '赛博硬核',
    categoryEn: 'Cyber',
    desc: '蜂窝状全息能量屏障浮现并规律闪烁',
    descEn: 'Honeycomb tactical shield flashing in structured cadence'
  },
  {
    id: 'moonlight_glimmer',
    name: '🌙 冷月清辉掠影',
    nameEn: '🌙 Moonlight Water Reflection',
    category: '光影闪耀',
    categoryEn: 'Gleam',
    desc: '如月光掠过水面，斜向银白冷辉优雅划过',
    descEn: 'Silvery white sheen gliding like moonlight over calm waters'
  }
];

export const EARRING_FX_LIST: FxOption[] = [
  {
    id: 'none',
    name: '🚫 静态无特效',
    nameEn: '🚫 Static (No FX)',
    category: '原生状态',
    categoryEn: 'Original',
    desc: '保持耳饰原始像素，无动态微动与光效',
    descEn: 'Keep native earring pixels without dynamic effects'
  },
  {
    id: 'sparkle_star',
    name: '✨ 璀璨晶钻星芒',
    nameEn: '✨ Diamond Starburst Sparkle',
    category: '珠宝闪耀',
    categoryEn: 'Jewelry',
    desc: '纯白高光爆闪，璀璨十字星芒流转',
    descEn: 'Brilliant white flash with spinning cross starburst'
  },
  {
    id: 'gold_gleam',
    name: '👑 24K黄金流光',
    nameEn: '👑 24K Gold Gleam',
    category: '奢华流光',
    categoryEn: 'Luxe Gleam',
    desc: '高纯度温润流金在耳环表面优雅流转',
    descEn: 'Warm high-purity golden liquid shimmer over earring surface'
  },
  {
    id: 'glint_flash',
    name: '⚡ 极速珠宝反光',
    nameEn: '⚡ Rapid Gemstone Flash',
    category: '珠宝闪耀',
    categoryEn: 'Jewelry',
    desc: '周期性瞬间反光爆闪，珠宝折射质感',
    descEn: 'Periodic instantaneous glint highlighting jewelry facet cuts'
  },
  {
    id: 'neon_pulse',
    name: '💎 赛博霓虹脉冲',
    nameEn: '💎 Cyber Neon Pulse',
    category: '科技幻彩',
    categoryEn: 'Cyber Prism',
    desc: '青蓝与紫芒双色律动，赛博科技感耳饰',
    descEn: 'Cyan and magenta rhythmic pulse for futuristic earrings'
  },
  {
    id: 'aurora_glow',
    name: '🌌 幽邃极光呼吸',
    nameEn: '🌌 Deep Aurora Breath',
    category: '科技幻彩',
    categoryEn: 'Cyber Prism',
    desc: '极光渐变微光，如心脏呼吸般沉稳暗涌',
    descEn: 'Harmonious aurora gradient breathing with heartbeat cadence'
  },
  {
    id: 'disco_rainbow',
    name: '🪩 炫彩棱镜折射',
    nameEn: '🪩 Prism Diamond Refraction',
    category: '珠宝闪耀',
    categoryEn: 'Jewelry',
    desc: '多角度彩色棱镜散射，如切割钻石耀眼',
    descEn: 'Multi-angle chromatic prism dispersion like cut diamonds'
  },
  {
    id: 'ember_warmth',
    name: '🔥 炽热熔金余晖',
    nameEn: '🔥 Molten Gold Ember Glow',
    category: '奢华流光',
    categoryEn: 'Luxe Gleam',
    desc: '暖红赤金微光暗涌呼吸，充满温度',
    descEn: 'Warm crimson and red-gold ember glow full of warmth'
  },
  {
    id: 'frost_ice',
    name: '❄️ 极地冰晶幽芒',
    nameEn: '❄️ Glacial Ice Shimmer',
    category: '科技幻彩',
    categoryEn: 'Cyber Prism',
    desc: '清冽通透的冰蓝微光流转，冷冽晶莹',
    descEn: 'Pristine translucent arctic blue shimmer, cold and radiant'
  }
];

export const EARRING_TRAITS = ['None', 'Gold', 'Silver', 'Diamond', 'Cross'] as const;
export type EarringTraitType = (typeof EARRING_TRAITS)[number];

export const MOTION_ACTION_PRESETS: MotionActionMeta[] = [
  {
    id: 'static',
    icon: '🧘',
    nameZh: '纯配件微动效 (静止身体)',
    nameEn: 'Accessory FX Only (Still Body)',
    descZh: '身体保持静止，仅保留头部光效与眼部眨眼微动效 GIF',
    descEn: 'Still body, exports hat shimmer & eye blink animation GIF',
    frameCount: 16,
  },
  {
    id: 'masternod',
    icon: '✨',
    nameZh: '多层惯性大师点头',
    nameEn: 'Master Layered Nod',
    descZh: '下身挤压 + 头部穿插 + 附属惯性',
    descEn: 'Layered compression, head dip & secondary rebound',
    frameCount: 36,
  },
  {
    id: 'nod',
    icon: '🎵',
    nameZh: '经典律动点头',
    nameEn: 'Classic Groove Nod',
    descZh: '官方金牌原汁原味基础动作',
    descEn: 'Authentic NodeMonkes golden standard nod',
    frameCount: 36,
  },
  {
    id: 'headbang',
    icon: '🫨',
    nameZh: '狂暴甩头 (Metal)',
    nameEn: 'Heavy Metal Headbang',
    descZh: '重金属超速高频下砸甩头',
    descEn: 'Fast high-energy vertical thrash',
    frameCount: 16,
  },
  {
    id: 'boxing',
    icon: '🥊',
    nameZh: '拳击 U 型摇闪',
    nameEn: 'Boxing Bob & Weave',
    descZh: '8字形摇闪 + 离心圆周弧线',
    descEn: 'Figure-8 evasive head weave & roll',
    frameCount: 48,
  },
  {
    id: 'boss',
    icon: '🦹',
    nameZh: '大佬重节奏颠肩',
    nameEn: 'Boss Beat Bounce',
    descZh: '双肩重拍颠动 + 头部轻晃',
    descEn: 'Heavy shoulder bop & effortless swagger',
    frameCount: 24,
  },
  {
    id: 'pump',
    icon: '🎧',
    nameZh: '嘻哈前后探颈',
    nameEn: 'Hip-Hop Neck Pump',
    descZh: '街舞鸽子探颈前推 + 卡点回缩',
    descEn: 'Funk pigeon head thrust & lock',
    frameCount: 36,
  },
  {
    id: 'moon',
    icon: '🚀',
    nameZh: '乘火箭冲上月球',
    nameEn: 'Rocket To The Moon',
    descZh: 'To The Moon! 胖火箭 + 舷窗冲刺',
    descEn: 'Classic crypto rocket blasting to the moon',
    frameCount: 32,
  },
  {
    id: 'orbit',
    icon: '🌀',
    nameZh: '360° 丝滑绕颈回旋',
    nameEn: '360° Neck Orbit Roll',
    descZh: '以颈椎为轴平滑 360° 绕圆',
    descEn: 'Smooth circular head rotation around neck',
    frameCount: 40,
  },
];
