import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Search, Sparkles, Paintbrush, Gift, CreditCard, Gamepad2, Image as ImageIcon, Bot, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const navRef = useRef<HTMLElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Drag-to-scroll state
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const tabs = [
    { id: 'explorer' as TabType, label: t.tabExplorer, icon: Search, badge: t.badge10k },
    { id: 'gif' as TabType, label: t.tabGif, icon: Sparkles, badge: t.badgeStudio },
    { id: 'diy' as TabType, label: t.tabDiy, icon: Paintbrush, badge: t.badgeCreator },
    { id: 'santa' as TabType, label: t.tabSanta, icon: Gift, badge: t.badgeSpecial },
    { id: 'agent' as TabType, label: t.tabAgent, icon: Bot, badge: 'AI' },
    { id: 'poster' as TabType, label: t.tabPoster, icon: ImageIcon, badge: t.badgePoster },
    { id: 'passport' as TabType, label: t.tabPassport, icon: CreditCard, badge: '3D' },
    { id: 'arcade' as TabType, label: t.tabArcade, icon: Gamepad2, badge: '8Bit' },
  ];

  const toggleLanguage = () => {
    setLang(lang === 'zh' ? 'en' : 'zh');
  };

  // Check scroll boundary to show/hide edge fade indicators
  const checkScrollBoundaries = useCallback(() => {
    if (!navRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    checkScrollBoundaries();
    window.addEventListener('resize', checkScrollBoundaries);
    return () => window.removeEventListener('resize', checkScrollBoundaries);
  }, [checkScrollBoundaries]);

  // Auto-center active tab smoothly into view
  useEffect(() => {
    if (activeTabRef.current && navRef.current) {
      const tabEl = activeTabRef.current;
      const containerEl = navRef.current;
      const tabLeft = tabEl.offsetLeft;
      const tabWidth = tabEl.offsetWidth;
      const containerWidth = containerEl.offsetWidth;
      
      const targetScroll = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      containerEl.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
      setTimeout(checkScrollBoundaries, 350);
    }
  }, [activeTab, checkScrollBoundaries]);

  // Mouse Drag Handlers (Modern desktop grab-and-drag gesture)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!navRef.current) return;
    setIsMouseDown(true);
    setIsDragging(false);
    setStartX(e.pageX - navRef.current.offsetLeft);
    setScrollLeftState(navRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !navRef.current) return;
    e.preventDefault();
    const x = e.pageX - navRef.current.offsetLeft;
    const walk = (x - startX) * 1.35; // Drag speed multiplier
    if (Math.abs(walk) > 4) {
      setIsDragging(true);
    }
    navRef.current.scrollLeft = scrollLeftState - walk;
    checkScrollBoundaries();
  };

  const handleMouseUpOrLeave = () => {
    setIsMouseDown(false);
    setTimeout(() => setIsDragging(false), 50);
  };

  // Wheel Horizontal Scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (!navRef.current) return;
    if (e.deltaY !== 0) {
      navRef.current.scrollLeft += e.deltaY * 0.8;
      checkScrollBoundaries();
    }
  };

  const scrollByAmount = (offset: number) => {
    if (!navRef.current) return;
    navRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScrollBoundaries, 300);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#07090E]/85 backdrop-blur-2xl transition-all select-none">
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

        {/* Center: Draggable / Swipeable Horizontal Tabs Wrapper */}
        <div className="relative flex-1 max-w-[calc(100vw-145px)] sm:max-w-2xl flex items-center group/nav">
          
          {/* Left scroll indicator hint button */}
          {canScrollLeft && (
            <button
              onClick={() => scrollByAmount(-180)}
              className="absolute -left-2 z-20 w-6 h-6 rounded-full bg-slate-900/90 border border-white/20 text-slate-300 hover:text-white flex items-center justify-center shadow-lg backdrop-blur-md hidden sm:flex transition-opacity"
              title="向左滚动"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Left Fade Mask */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#07090E] to-transparent pointer-events-none z-10 rounded-l-2xl" />
          )}

          <nav 
            ref={navRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onWheel={handleWheel}
            onScroll={checkScrollBoundaries}
            className={clsx(
              'relative flex items-center gap-1 p-1 bg-slate-900/80 rounded-2xl border border-white/[0.08] shadow-inner overflow-x-auto no-scrollbar w-full transition-shadow',
              isMouseDown ? 'cursor-grabbing' : 'cursor-grab',
              'touch-pan-x'
            )}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={isActive ? activeTabRef : null}
                  onClick={(e) => {
                    if (isDragging) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    onTabChange(tab.id);
                  }}
                  className={clsx(
                    'relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 select-none z-10 cursor-pointer',
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

          {/* Right Fade Mask */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#07090E] to-transparent pointer-events-none z-10 rounded-r-2xl" />
          )}

          {/* Right scroll indicator hint button */}
          {canScrollRight && (
            <button
              onClick={() => scrollByAmount(180)}
              className="absolute -right-2 z-20 w-6 h-6 rounded-full bg-slate-900/90 border border-white/20 text-slate-300 hover:text-white flex items-center justify-center shadow-lg backdrop-blur-md hidden sm:flex transition-opacity"
              title="向右滚动"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

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
