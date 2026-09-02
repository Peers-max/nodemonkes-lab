import type { Monke } from '../../types';

export interface PersonaProfile {
  monkeId: number;
  title: string;
  titleEn: string;
  archetypeId: string;
  archetypeNameZh: string;
  archetypeNameEn: string;
  avatarUrl: string;
  tagline: string;
  taglineEn: string;
  catchphrase: string;
  catchphraseEn: string;
  bio: string;
  bioEn: string;
  stats: {
    attack: number;     // 攻击力/战力 (0~100)
    faith: number;      // 比特币信仰值 (0~100)
    toxicity: number;   // 毒舌指数 (0~100)
    iq: number;         // 智商/洞察力 (0~100)
    humor: number;      // 幽默感/玩梗度 (0~100)
  };
  traitsSummary: string;
  temperament: string; // 性格色彩
  temperamentEn: string;
  systemPrompt: string;
}

// Prefix vocabularies for title generation
const PREFIXES = [
  '创世', '暴富', '狂暴', '极光', '暗网', '至尊', '远古', '赛博',
  '星际', '满仓', '得道', '霓虹', '深海', '幽灵', '荒野', '黄金',
  '量子', '机械', '幻影', '嗜血', '天行', '原教旨', '黑客', '绝影'
];

const PREFIXES_EN = [
  'Genesis', 'Alpha', 'Raging', 'Aurora', 'Cyberspace', 'Supreme', 'Ancient', 'Cyber',
  'Cosmic', 'All-In', 'Enlightened', 'Neon', 'Abyssal', 'Phantom', 'Wild', 'Golden',
  'Quantum', 'Mecha', 'Mirage', 'Fierce', 'Skywalker', 'Orthodox', 'Hacker', 'Shadow'
];

const ROLES = [
  '君王', '狂信徒', '老矿工', '操盘手', '游侠', '领主', '黑客', '萨满',
  '猎人', '战神', '哲人', '造梗大师', '弄潮儿', '死神', '祭司', '先知',
  '剑客', '飞行员', '大魔导师', '先锋官', '炼金术士', '守护者'
];

const ROLES_EN = [
  'King', 'Zealot', 'Veteran Miner', 'Trader', 'Ranger', 'Lord', 'Hacker', 'Shaman',
  'Hunter', 'Warlord', 'Philosopher', 'Meme Lord', 'Trendsetter', 'Reaper', 'Priest', 'Oracle',
  'Swordsman', 'Pilot', 'Archmage', 'Vanguard', 'Alchemist', 'Guardian'
];

const TEMPERAMENTS = [
  '唯我独尊 · 霸气侧漏', '狂热暴躁 · 梭哈拉满', '沧桑沉稳 · 心如磐石',
  '冷静严密 · 极客代码', '大开大合 · 盯盘狂魔', '超脱物外 · 佛系禅意',
  '幽默风趣 · 玩梗天花板', '潮流反叛 · 自由不羁', '冷酷神秘 · 一针见血',
  '热血激昂 · 战力超群', '狡黠机智 · 洞察先机', '浪漫主义 · 星辰大海'
];

const TEMPERAMENTS_EN = [
  'Imperial Overlord · Dominant & Unstoppable', 'Fierce Maximalist · Full Send & High Conviction', 'Weathered Veteran · Steady as Diamond',
  'Methodical Geek · Pure Logic & Code', 'Furious Chart Watcher · Relentless Focus', 'Zen Transcendence · Peaceful Serenity',
  'Witty Humorist · Peak Meme Energy', 'Cyber Rebel · Wild & Free Spirit', 'Cold & Mysterious · Razor Sharp Precision',
  'Fiery Combatant · Unrivaled Battle Will', 'Shrewd Strategist · Ahead of the Curve', 'Cosmic Romantic · Boundless Ambition'
];

const CATCHPHRASE_TEMPLATES = [
  '跪下，听本王赐教！', '梭哈！信仰永不妥协！', '年轻人，大风大浪见多了！',
  '不信任任何人，只信任代码！', '急了急了，马上拉盘！', '善哉，持币即是修行。',
  '哈哈哈哈，这也太秀了！', '别问，问就是潮！', 'K线即命运，代码即真理！',
  '把空头打回老家！', '稳住，我们能赢！', '一切皆在算力之中！',
  '没有一个神兽是多余的！', '看好了，这就是排面！', '满仓是态度，暴富是必然！'
];

const CATCHPHRASE_TEMPLATES_EN = [
  'Kneel and behold!', 'Full send! Conviction never bends!', 'Kid, I have survived crypto winters!',
  'Don\'t trust, verify! Code is truth!', 'Pumping now, grab your seatbelt!', 'HODL is meditation, peace is alpha.',
  'Hahaha, this is pure comedy gold!', 'Stay iconic, stay on-chain!', 'Charts are destiny, math is salvation!',
  'Squeeze the bears back into their caves!', 'HODL steady, victory is ours!', 'Everything is governed by raw hashrate!',
  'Every Monke is a masterpiece!', 'Witness the sovereign glory!', 'Max allocation is our creed!'
];

const TAGLINE_TEMPLATES = [
  '行走在比特币区块之巅，每一个像素都是不可篡改的真理。',
  '1 MONKE = 1 BTC = 100 万美元，时间会证明一切。',
  '在算力与电费的洗礼下，唯有硬核共识能够永生。',
  '用最顶级的密码学与逻辑，撕碎一切虚妄的泡沫。',
  '盯盘是生活，拉盘是宿命，今晚不暴富誓不罢休。',
  '涨跌不过是瞬息幻象，持币方能参悟宇宙奥秘。',
  '人生苦短，及时狂欢，快乐是唯一的硬通货。',
  '手握最硬的铭文，走最帅的步伐，潮动整个 Web3。',
  '在冷酷的区块链世界里，做最有脾气的数字生命。',
  '算力风暴由我掀起，铭文浪潮因我而生。'
];

const TAGLINE_TEMPLATES_EN = [
  'Walking on the peak of Bitcoin blocks, every pixel is immutable truth.',
  '1 MONKE = 1 BTC = $1,000,000, time will prove everything.',
  'Under the baptism of hashrate and electricity, only hardcore consensus lives forever.',
  'With top-tier cryptography and pure logic, tear through all speculative bubbles.',
  'Watching charts is life, pumping is destiny, no rest until financial freedom.',
  'Price volatility is just fleeting noise, holding coins reveals the secrets of the cosmos.',
  'Life is short, celebrate every block, joy is the ultimate hard currency.',
  'Holding the rarest inscriptions with legendary swagger across Web3.',
  'In the cold blockchain world, exist as the most spirited digital life.',
  'The hashrate storm rises with me, the inscription wave is born because of me.'
];

// Hash function to get deterministic, varied parameters per ID
function hashString(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// Derive a 100% Unique, Individual Persona for Each of the 10,000 Monkes
export const deriveMonkePersona = (monke: Monke | null | undefined, monkeId: number): PersonaProfile => {
  const traits = monke?.attributes || {
    Body: 'Normal',
    Head: 'None',
    Eyes: 'None',
    Earring: 'None',
    Count: 4,
  };

  const headStr = String(traits.Head || 'None');
  const eyesStr = String(traits.Eyes || 'None');
  const bodyStr = String(traits.Body || 'Normal');
  const earringStr = String(traits.Earring || 'None');

  const hVal1 = hashString(`monke_${monkeId}_prefix`, monkeId);
  const hVal2 = hashString(`monke_${monkeId}_role`, monkeId * 7);
  const hVal3 = hashString(`monke_${monkeId}_stats`, monkeId * 13);
  const hVal4 = hashString(`monke_${monkeId}_catch`, monkeId * 19);
  const hVal5 = hashString(`monke_${monkeId}_tag`, monkeId * 31);
  const hVal6 = hashString(`monke_${monkeId}_temp`, monkeId * 43);

  // Dynamic Unique Title
  const prefixIdx = Math.abs(hVal1) % PREFIXES.length;
  let roleIdx = Math.abs(hVal2) % ROLES.length;
  const prefix = PREFIXES[prefixIdx];
  const prefixEn = PREFIXES_EN[prefixIdx];

  let role = ROLES[roleIdx];
  let roleEn = ROLES_EN[roleIdx];

  if (headStr.toLowerCase().includes('crown') || bodyStr.toLowerCase().includes('gold')) {
    role = '至尊金王';
    roleEn = 'Golden Sovereign';
  } else if (eyesStr.toLowerCase().includes('laser')) {
    role = '激光狂信徒';
    roleEn = 'Laser Zealot';
  } else if (headStr.toLowerCase().includes('helmet')) {
    role = '硬核老矿工';
    roleEn = 'Hardcore Miner';
  } else if (eyesStr.toLowerCase().includes('vr') || eyesStr.toLowerCase().includes('visor')) {
    role = '暗网黑客';
    roleEn = 'Cyberpunk Hacker';
  }

  const fullRoleZh = role === '至尊金王' ? (prefix === '黄金' ? '至尊金王' : `${prefix}金王`) : `${prefix}${role}`;
  const fullRoleEn = roleEn.toLowerCase().includes(prefixEn.toLowerCase()) ? roleEn : `${prefixEn} ${roleEn}`;

  const title = `#${monkeId} · ${fullRoleZh}`;
  const titleEn = `#${monkeId} · ${fullRoleEn}`;
  const archetypeNameZh = fullRoleZh;
  const archetypeNameEn = fullRoleEn;

  // Unique Dynamic 5D Stats (Exact scores from 50 to 99)
  const attack = 50 + Math.abs(hVal3 % 49);
  const faith = 60 + Math.abs((hVal3 >>> 4) % 39);
  const toxicity = 30 + Math.abs((hVal3 >>> 8) % 68);
  const iq = 55 + Math.abs((hVal3 >>> 12) % 43);
  const humor = 40 + Math.abs((hVal3 >>> 16) % 58);

  // Unique Catchphrase & Tagline
  const catchphraseIdx = Math.abs(hVal4) % CATCHPHRASE_TEMPLATES.length;
  const catchphrase = CATCHPHRASE_TEMPLATES[catchphraseIdx];
  const catchphraseEn = CATCHPHRASE_TEMPLATES_EN[catchphraseIdx];

  const taglineIdx = Math.abs(hVal5) % TAGLINE_TEMPLATES.length;
  const tagline = TAGLINE_TEMPLATES[taglineIdx];
  const taglineEn = TAGLINE_TEMPLATES_EN[taglineIdx];

  const tempIdx = Math.abs(hVal6) % TEMPERAMENTS.length;
  const temperament = TEMPERAMENTS[tempIdx];
  const temperamentEn = TEMPERAMENTS_EN[tempIdx];

  const traitsSummary = `Body=${bodyStr} · Head=${headStr} · Eyes=${eyesStr} · Earring=${earringStr}`;

  // Unique Bio / Lore
  const bio = `作为第 #${monkeId} 号独立数字生命，具有【${temperament}】的独特心智。链上特征为 ${traitsSummary}。在 NodeMonkes 宇宙中拥有专属的战斗意志（战力 ${attack}）与极度鲜明的处事哲学。`;
  const bioEn = `As NodeMonke #${monkeId}, equipped with the mind of [${temperamentEn}]. On-chain traits: ${traitsSummary}. Possessing a unique battle willpower (Combat ${attack}/100) and distinctive Web3 philosophy.`;

  // Default system prompt
  const systemPrompt = `你是 NodeMonkes #${monkeId}【${title}】。
性格基调：${temperament}。
链上特征：${traitsSummary}。
口头禅/口癖：“${catchphrase}”。
座右铭：“${tagline}”。`;

  return {
    monkeId,
    title,
    titleEn,
    archetypeId: `monke_${monkeId}`,
    archetypeNameZh,
    archetypeNameEn,
    avatarUrl: `https://pub-2f0821e8464b4c139f681d763393f4ee.r2.dev/${monkeId}.png`,
    tagline,
    taglineEn,
    catchphrase,
    catchphraseEn,
    bio,
    bioEn,
    stats: { attack, faith, toxicity, iq, humor },
    traitsSummary,
    temperament,
    temperamentEn,
    systemPrompt,
  };
};

export const getSystemPrompt = (persona: PersonaProfile, lang: 'zh' | 'en' = 'zh'): string => {
  if (lang === 'en') {
    return `You are NodeMonkes #${persona.monkeId} [${persona.titleEn}], an AI agent on Bitcoin Ordinals.
Personality style: ${persona.temperamentEn}.
Please answer questions accurately, objectively, and logically while naturally carrying your distinct personality style. Reply in fluent English.`;
  }
  return `你是 NodeMonkes #${persona.monkeId}【${persona.title}】，比特币 Ordinals 上的 AI 智能体。
性格风格：${persona.temperament}。
请先确保回答内容的准确性、专业性与逻辑严密，在此基础上自然体现你的性格风格。使用中文回答。`;
};

export const generatePersonaProfile = (monkeId: number): PersonaProfile => {
  return deriveMonkePersona(null, monkeId);
};


