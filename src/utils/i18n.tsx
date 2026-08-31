import React, { createContext, useContext, useState } from 'react';

export type Language = 'zh' | 'en';

export interface Translations {
  // Brand & Navbar
  brandSub: string;
  tabExplorer: string;
  tabGif: string;
  tabDiy: string;
  tabSanta: string;
  badge10k: string;
  badgeStudio: string;
  badgeCreator: string;
  badgeSpecial: string;
  langSwitchTitle: string;
  langSwitchBtn: string;

  // Footer
  footerDesc: string;
  footerSatflow: string;
  footerOrdnet: string;
  footerRights: string;

  // Explorer
  explorerBadge: string;
  explorerTitle: string;
  explorerSub: string;
  searchPlaceholder: string;
  clearSearch: string;
  allBodies: string;
  sortBy: string;
  sortRank: string;
  sortId: string;
  sortInscription: string;
  sortBlock: string;
  orderAsc: string;
  orderDesc: string;
  totalFound: string;
  ofMonkes: string;
  perPage: string;
  viewGrid: string;
  viewTable: string;
  tableThImage: string;
  tableThRank: string;
  tableThId: string;
  tableThInscription: string;
  tableThTraits: string;
  tableThActions: string;
  actionMakeGif: string;
  actionSanta: string;
  actionDetails: string;
  noResults: string;
  noResultsSub: string;
  prevPage: string;
  nextPage: string;
  pageOf: string;
  jumpTo: string;
  jumpGo: string;

  // Detail Modal
  modalRank: string;
  modalBlock: string;
  modalInscription: string;
  modalTotalTraits: string;
  modalTraitsUnit: string;
  modalColorPalette: string;
  modalMakeGif: string;
  modalSanta: string;
  modalTraits: string;
  modalOwner: string;
  modalCopyKey: string;
  modalCopied: string;
  modalClose: string;

  // GIF Studio
  gifBadge: string;
  gifTitle: string;
  gifSub: string;
  gifReady: string;
  gifSearchPlaceholder: string;
  gifConfirm: string;
  gifRandom: string;
  gifModeTitle: string;
  gifModeClassic: string;
  gifModeSanta: string;
  gifBgTitle: string;
  gifBgNone: string;
  gifBgAuto: string;
  gifBgCustom: string;
  gifSpeedTitle: string;
  gifSpeedSlow: string;
  gifSpeedNormal: string;
  gifSpeedFast: string;
  gifSpeedUltra: string;
  gifSpeedExtreme: string;
  gifResTitle: string;
  gifSaveBtn: string;
  gifSavingBtn: string;
  gifSuccess: string;
  gifSuccessDesc: string;
  gifErrorInput: string;
  gifErrorInputDesc: string;

  // DIY Studio
  diyBadge: string;
  diyTitle: string;
  diySub: string;
  diySeriesSuffix: string;
  diyRandomBtn: string;
  diySaveBtn: string;
  diySavingBtn: string;
  diyResTitle: string;
  diyBgTitle: string;
  diyBgNone: string;
  diyBgOrange: string;
  diyBgAuto: string;
  diyBgCustom: string;
  diySeriesTitle: string;
  diyCatBody: string;
  diyCatEarring: string;
  diyCatEyes: string;
  diyCatHead: string;
  diyNotSupported: string;
  diyLoadingComponents: string;
  diySuccess: string;
  diySuccessDesc: string;
  diySaveFailed: string;
  diyNoneOption: string;

  // Santa Studio
  santaBadge: string;
  santaTitle: string;
  santaSub: string;
  santaEdition: string;
  santaRandomBtn: string;
  santaSearchPlaceholder: string;
  santaDownloadBtn: string;
  santaBgTitle: string;
  santaBgNone: string;
  santaBgAuto: string;
  santaBgCustom: string;
  santaResTitle: string;
  santaResStd: string;
  santaResHd: string;
  santaRes4k: string;
  santaCrossGif: string;
  santaDownloadSuccess: string;
  santaDownloadSuccessDesc: string;

  // Toast Messages
  toastGifLoaded: string;
  toastGifLoadedDesc: string;
  toastSantaLoaded: string;
  toastSantaLoadedDesc: string;
  toastCopied: string;
  toastCopiedDesc: string;
  toastNetworkWarning: string;
  toastNetworkWarningDesc: string;
}

export const translations: Record<Language, Translations> = {
  zh: {
    // Brand & Navbar
    brandSub: 'Bitcoin Ordinals • 10,000 铭文藏品',
    tabExplorer: '全量图库',
    tabGif: 'GIF 动图',
    tabDiy: 'DIY 工坊',
    tabSanta: '圣诞版',
    badge10k: '1万',
    badgeStudio: '工坊',
    badgeCreator: '创作',
    badgeSpecial: '限定',
    langSwitchTitle: '切换为英文 (Switch to English)',
    langSwitchBtn: 'EN',

    // Footer
    footerDesc: 'NodeMonkes 社区铭文创作工具箱',
    footerSatflow: 'SatFlow 交易市场',
    footerOrdnet: 'Ord.net 交易市场',
    footerRights: '100% 纯前端离线合成渲染 • 2026',

    // Explorer
    explorerBadge: '10,000 铭文全量探索器',
    explorerTitle: 'NodeMonkes 稀有度与属性浏览器',
    explorerSub: '实时毫秒级检索 10,000 只 NodeMonkes 稀有度排行、Inscription 铭文属性与色彩分析。',
    searchPlaceholder: '搜索 ID 或 Inscription 编号...',
    clearSearch: '清空',
    allBodies: '全部身体类型',
    sortBy: '排序方式',
    sortRank: '按稀有度排序',
    sortId: '按编号排序',
    sortInscription: '按铭文排序',
    sortBlock: '按区块排序',
    orderAsc: '升序 (从低到高)',
    orderDesc: '降序 (从高到低)',
    totalFound: '共展示',
    ofMonkes: '只 NodeMonkes',
    perPage: '每页条数',
    viewGrid: '网格视图',
    viewTable: '列表视图',
    tableThImage: '预览图',
    tableThRank: '稀有度',
    tableThId: '编号',
    tableThInscription: '铭文编号',
    tableThTraits: '4 项核心属性明细',
    tableThActions: '操作',
    actionMakeGif: '生成动图',
    actionSanta: '圣诞版',
    actionDetails: '详情',
    noResults: '未找到匹配的 NodeMonke',
    noResultsSub: '请尝试调整搜索关键词或重置筛选条件。',
    prevPage: '上一页',
    nextPage: '下一页',
    pageOf: '页 / 共',
    jumpTo: '跳转到:',
    jumpGo: '确定',

    // Detail Modal
    modalRank: '稀有度排名',
    modalBlock: '区块高度',
    modalInscription: '铭文编号',
    modalTotalTraits: '属性总数',
    modalTraitsUnit: '项属性',
    modalColorPalette: '提取主色调',
    modalMakeGif: '生成 GIF 动图',
    modalSanta: '进入圣诞版查看',
    modalTraits: '属性与稀有度明细',
    modalOwner: '持有人地址 (链上凭证)',
    modalCopyKey: '复制完整地址',
    modalCopied: '已复制',
    modalClose: '关闭',

    // GIF Studio
    gifBadge: 'NODEMONKES 36 帧正版动图工坊',
    gifTitle: 'NodeMonkes 动图生成器',
    gifSub: '支持 0.1x ~ 5.0x 无极变速调节与多档高清分辨率导出，动图速度与网页预览 100% 毫秒级同步。',
    gifReady: '预览已就绪',
    gifSearchPlaceholder: '输入 ID (1-10000)...',
    gifConfirm: '确定',
    gifRandom: '随机',
    gifModeTitle: '1. 模式选择',
    gifModeClassic: '经典普通版',
    gifModeSanta: '圣诞节日版',
    gifBgTitle: '2. 背景底色',
    gifBgNone: '无背景 (透明)',
    gifBgAuto: '自动背景',
    gifBgCustom: '自定义颜色',
    gifSpeedTitle: '3. 动画播放速度',
    gifSpeedSlow: '0.5x 慢速',
    gifSpeedNormal: '1.0x 原速',
    gifSpeedFast: '2.0x 快速',
    gifSpeedUltra: '3.5x 极速',
    gifSpeedExtreme: '5.0x 狂暴',
    gifResTitle: '4. 导出分辨率',
    gifSaveBtn: '导出 GIF 动图',
    gifSavingBtn: '正在导出 GIF...',
    gifSuccess: 'GIF 导出成功！',
    gifSuccessDesc: '动图已保存至本地',
    gifErrorInput: '输入错误',
    gifErrorInputDesc: '请输入 1 - 10000 之间的有效 ID',

    // DIY Studio
    diyBadge: 'NODEMONKES DIY 头像工坊',
    diyTitle: 'NodeMonkes DIY 头像工坊',
    diySub: '100% 还原原版全部 5 大系列真实图层，支持身体、耳环、眼睛、头部自由拼装与最高 4K 极清导出。',
    diySeriesSuffix: '系列',
    diyRandomBtn: '🎲 随机搭配',
    diySaveBtn: '💾 保存头像',
    diySavingBtn: '正在合成保存...',
    diyResTitle: '导出分辨率:',
    diyBgTitle: '背景底色设置',
    diyBgNone: '无背景 (透明)',
    diyBgOrange: '经典橙底',
    diyBgAuto: '自动背景',
    diyBgCustom: '自定义颜色',
    diySeriesTitle: '系列切换',
    diyCatBody: '身体',
    diyCatEarring: '耳环',
    diyCatEyes: '眼睛',
    diyCatHead: '头部',
    diyNotSupported: '此系列不支持该部件',
    diyLoadingComponents: '正在加载图层组件...',
    diySuccess: '头像保存成功！',
    diySuccessDesc: '已下载高清无损 PNG',
    diySaveFailed: '保存失败',
    diyNoneOption: '无部件',

    // Santa Studio
    santaBadge: 'NODEMONKES 圣诞限定版',
    santaTitle: '10,000 圣诞帽 NodeMonkes',
    santaSub: '节日专属像素级圣诞帽融合，支持自定义背景底色与高清节日头像下载。',
    santaEdition: '圣诞特别版',
    santaRandomBtn: '随机抽取',
    santaSearchPlaceholder: '输入 ID (1-10000)...',
    santaDownloadBtn: '下载节日头像',
    santaBgTitle: '1. 背景底色设置',
    santaBgNone: '透明背景',
    santaBgAuto: '自动背景',
    santaBgCustom: '节日调色盘',
    santaResTitle: '2. 导出尺寸',
    santaResStd: '标准 (280px)',
    santaResHd: '高清头像 (560px)',
    santaRes4k: '超清 4K (1120px)',
    santaCrossGif: '在 GIF 工坊中制作此猴子动图',
    santaDownloadSuccess: '下载成功！',
    santaDownloadSuccessDesc: '已保存圣诞版高清 PNG',

    // Toast Messages
    toastGifLoaded: '已载入动图工坊',
    toastGifLoadedDesc: '猴子已准备就绪',
    toastSantaLoaded: '已载入圣诞版',
    toastSantaLoadedDesc: '猴子节日视图已就绪',
    toastCopied: '复制成功',
    toastCopiedDesc: '已复制到剪贴板',
    toastNetworkWarning: '网络提示',
    toastNetworkWarningDesc: '无法获取实时数据，请检查网络连接',
  },
  en: {
    // Brand & Navbar
    brandSub: 'Bitcoin Ordinals • 10,000 Inscription Collection',
    tabExplorer: 'Explorer',
    tabGif: 'Make GIF',
    tabDiy: 'DIY Studio',
    tabSanta: 'Santa Monkes',
    badge10k: '10K',
    badgeStudio: 'Studio',
    badgeCreator: 'Creator',
    badgeSpecial: 'Special',
    langSwitchTitle: 'Switch to Chinese (切换为中文)',
    langSwitchBtn: '中文',

    // Footer
    footerDesc: 'NodeMonkes Community Hub & Creative Toolkit',
    footerSatflow: 'SatFlow Marketplace',
    footerOrdnet: 'Ord.net Marketplace',
    footerRights: '100% Client-Side Inscriptions Studio • 2026',

    // Explorer
    explorerBadge: '10,000 INSCRIPTIONS EXPLORER',
    explorerTitle: 'NodeMonkes Rarity & Traits Explorer',
    explorerSub: 'Instant search across 10,000 NodeMonkes for rarity rankings, inscription traits, and color analysis.',
    searchPlaceholder: 'Search by ID or Inscription #...',
    clearSearch: 'Clear',
    allBodies: 'All Body Types',
    sortBy: 'Sort By',
    sortRank: 'Sort by Rank',
    sortId: 'Sort by ID',
    sortInscription: 'Sort by Inscription',
    sortBlock: 'Sort by Block',
    orderAsc: 'Ascending (Low to High)',
    orderDesc: 'Descending (High to Low)',
    totalFound: 'Showing',
    ofMonkes: 'NodeMonkes',
    perPage: 'Per Page',
    viewGrid: 'Grid View',
    viewTable: 'Table View',
    tableThImage: 'Image',
    tableThRank: 'Rarity Rank',
    tableThId: 'ID',
    tableThInscription: 'Inscription',
    tableThTraits: '4-Trait Breakdown & Rarity',
    tableThActions: 'Actions',
    actionMakeGif: 'Animate',
    actionSanta: 'Santa',
    actionDetails: 'Details',
    noResults: 'No NodeMonkes match your criteria',
    noResultsSub: 'Try changing your search keywords or resetting filters.',
    prevPage: 'Previous',
    nextPage: 'Next',
    pageOf: 'of',
    jumpTo: 'Jump to:',
    jumpGo: 'Go',

    // Detail Modal
    modalRank: 'Rarity Rank',
    modalBlock: 'Block Number',
    modalInscription: 'Inscription Number',
    modalTotalTraits: 'Total Traits',
    modalTraitsUnit: 'Traits',
    modalColorPalette: 'Extracted Palette',
    modalMakeGif: 'Make Animated GIF',
    modalSanta: 'View in Santa Edition',
    modalTraits: 'Traits & Rarity Breakdown',
    modalOwner: 'Owner ScriptPubKey (On-Chain Proof)',
    modalCopyKey: 'Copy Full Key',
    modalCopied: 'Copied',
    modalClose: 'Close',

    // GIF Studio
    gifBadge: 'NODEMONKES 36-FRAME GENUINE GIF STUDIO',
    gifTitle: 'NodeMonkes GIF Generator',
    gifSub: 'Authentic nodding animation engine, supporting 0.1x ~ 5.0x speed and multi-tier HD resolutions.',
    gifReady: 'Preview Ready',
    gifSearchPlaceholder: 'Enter ID (1-10000)...',
    gifConfirm: 'Go',
    gifRandom: 'Random',
    gifModeTitle: '1. Select Mode',
    gifModeClassic: 'Classic Edition',
    gifModeSanta: 'Santa Edition',
    gifBgTitle: '2. Background Color',
    gifBgNone: 'Transparent',
    gifBgAuto: 'Auto Background',
    gifBgCustom: 'Custom Color',
    gifSpeedTitle: '3. Animation Speed',
    gifSpeedSlow: '0.5x Slow',
    gifSpeedNormal: '1.0x Normal',
    gifSpeedFast: '2.0x Fast',
    gifSpeedUltra: '3.5x Ultra',
    gifSpeedExtreme: '5.0x Extreme',
    gifResTitle: '4. Output Resolution',
    gifSaveBtn: 'Export GIF',
    gifSavingBtn: 'Exporting GIF...',
    gifSuccess: 'GIF Exported Successfully!',
    gifSuccessDesc: 'Downloaded to your device',
    gifErrorInput: 'Invalid Input',
    gifErrorInputDesc: 'Please enter a valid ID (1 - 10000)',

    // DIY Studio
    diyBadge: 'NODEMONKES DIY AVATAR CREATOR',
    diyTitle: 'NodeMonkes DIY Avatar Creator',
    diySub: '100% authentic 5 series layer engine. Freely customize Body, Earring, Eyes, Head with up to 4K Ultra HD export.',
    diySeriesSuffix: 'Series',
    diyRandomBtn: '🎲 Randomize',
    diySaveBtn: '💾 Save Avatar',
    diySavingBtn: 'Rendering Avatar...',
    diyResTitle: 'Export Resolution:',
    diyBgTitle: 'Background Color',
    diyBgNone: 'Transparent',
    diyBgOrange: 'Orange',
    diyBgAuto: 'Auto Background',
    diyBgCustom: 'Custom Color',
    diySeriesTitle: 'Select Series',
    diyCatBody: 'Body',
    diyCatEarring: 'Earring',
    diyCatEyes: 'Eyes',
    diyCatHead: 'Head',
    diyNotSupported: 'This series does not support this component',
    diyLoadingComponents: 'Loading layer components...',
    diySuccess: 'Avatar Saved Successfully!',
    diySuccessDesc: 'Lossless HD PNG downloaded',
    diySaveFailed: 'Save Failed',
    diyNoneOption: 'None',

    // Santa Studio
    santaBadge: 'SANTA MONKES LIMITED EDITION',
    santaTitle: '10,000 Santa Hat NodeMonkes',
    santaSub: 'Festive holiday edition with pixel-perfect Santa hats. Customize background colors and download high-resolution holiday avatars.',
    santaEdition: 'SANTA EDITION',
    santaRandomBtn: 'Random',
    santaSearchPlaceholder: 'Monke ID (1-10000)',
    santaDownloadBtn: 'Download Festive Avatar',
    santaBgTitle: '1. Background Styling',
    santaBgNone: 'Transparent',
    santaBgAuto: 'Auto Background',
    santaBgCustom: 'Holiday Palette',
    santaResTitle: '2. Export Dimensions',
    santaResStd: 'Standard (280px)',
    santaResHd: 'HD Avatar (560px)',
    santaRes4k: 'Ultra 4K (1120px)',
    santaCrossGif: 'Animate this Monke in GIF Studio',
    santaDownloadSuccess: 'Downloaded!',
    santaDownloadSuccessDesc: 'Saved Santa NodeMonke PNG',

    // Toast Messages
    toastGifLoaded: 'Loaded in GIF Studio',
    toastGifLoadedDesc: 'Monke ready to animate',
    toastSantaLoaded: 'Loaded in Santa Edition',
    toastSantaLoadedDesc: 'Monke festive view ready',
    toastCopied: 'Copied to clipboard',
    toastCopiedDesc: 'Script PubKey copied',
    toastNetworkWarning: 'Network Warning',
    toastNetworkWarningDesc: 'Could not load live metadata, please check connection',
  },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'zh',
  setLang: () => {},
  t: translations.zh,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nm_lang');
      if (saved === 'zh' || saved === 'en') return saved;
      return 'zh';
    }
    return 'zh';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nm_lang', newLang);
    }
  };

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
