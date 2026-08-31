import React from 'react';
import { Search, Sparkles, Paintbrush, Gift, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { TabType } from '../../types';
import { useLanguage } from '../../utils/i18n';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  totalMonkes?: number;
  onQuickSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { lang, setLang, t } = useLanguage();

  const tabs = [
    { id: 'explorer' as TabType, label: t.tabExplorer, icon: Search, badge: t.badge10k },
    { id: 'gif' as TabType, label: t.tabGif, icon: Sparkles, badge: t.badgeStudio },
    { id: 'diy' as TabType, label: t.tabDiy, icon: Paintbrush, badge: t.badgeCreator },
    { id: 'santa' as TabType, label: t.tabSanta, icon: Gift, badge: t.badgeSpecial },
    { id: 'poster' as TabType, label: t.tabPoster, icon: Sparkles, badge: t.badgePoster },
  ];

  const toggleLanguage = () => {
    setLang(lang === 'zh' ? 'en' : 'zh');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#07090E]/80 backdrop-blur-2xl transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Interactive Brand Logo & Title */}
        <motion.div 
          onClick={() => onTabChange('explorer')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
        >
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-amber-500/30 to-orange-500/20 p-0.5 border border-amber-500/40 group-hover:border-amber-400/80 transition-all shadow-[0_0_20px_-3px_rgba(245,158,11,0.3)] shrink-0">
            <img 
              src="https://raw.githubusercontent.com/supercrypto1984/nodemonkes-gallery/main/images/209.png" 
              alt="NodeMonkes"
              className="w-full h-full object-cover pixelated transform group-hover:scale-110 transition-transform duration-300" 
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold tracking-tight text-sm sm:text-base lg:text-lg text-white font-sans bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text">
                NODEMONKES
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold tracking-wider shadow-sm">
                LAB
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono hidden md:inline-block">
              {t.brandSub}
            </span>
          </div>
        </motion.div>

        {/* Center: Module Tabs with Emil Kowalski Fluid Spring Pill */}
        <nav className="relative flex items-center gap-1 p-1 bg-slate-900/80 rounded-2xl border border-white/[0.08] shadow-inner overflow-x-auto no-scrollbar max-w-[calc(100vw-145px)] sm:max-w-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={clsx(
                  'relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 select-none z-10',
                  isActive ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-100'
                )}
              >
                {/* Active Sliding Spring Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                    className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 rounded-xl shadow-[0_0_20px_-3px_rgba(245,158,11,0.4)]"
                  />
                )}

                <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                  <Icon className={clsx('w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform', isActive ? 'text-slate-950 scale-105' : 'text-slate-400')} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {isActive && (
                    <span className="hidden lg:inline-block text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/20 text-slate-950 font-mono font-extrabold">
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right: Language Switcher Button with Spring Tap */}
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            type="button"
            onClick={toggleLanguage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            title={t.langSwitchTitle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-amber-500/40 transition-all shadow-sm shrink-0"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{t.langSwitchBtn}</span>
          </motion.button>
        </div>

      </div>
    </header>
  );
};
