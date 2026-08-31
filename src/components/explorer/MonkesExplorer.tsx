import React, { useState, useMemo } from 'react';
import { 
  Search, 
  LayoutGrid, 
  Table as TableIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  ArrowUpDown,
  Sparkles,
  Gift,
  ExternalLink,
  Crown,
  Play,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { Monke } from '../../types';
import { getMonkeImageUrl } from '../../utils/api';
import { MonkeDetailModal } from './MonkeDetailModal';
import { TheatreModal } from './TheatreModal';
import { ParallaxCard } from '../ui/ParallaxCard';
import { useLanguage } from '../../utils/i18n';

interface MonkesExplorerProps {
  monkes: Monke[];
  loading: boolean;
  onOpenInGif: (monkeId: number) => void;
  onOpenInSanta: (monkeId: number) => void;
  onOpenInPoster?: (monkeId: number) => void;
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

type SortField = 'rank' | 'id' | 'inscription' | 'block';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'table';

const ALL_BODY_TYPES = [
  'all', 'Gold', 'Alien', 'Light', 'Wrapped', 'Underlord',
  'Albino', 'Moon', 'Rainbow', 'Medium', 'Pink', 'Safemode',
  'Zombie', 'Dark', 'Deathbot', 'Patriot', 'Hyena', 'Ion',
  'VHS', 'DOS', 'Purple', 'Nightfall', 'Glow', 'Ice',
  'Ghost', 'Radioactive', 'Magma', 'Matrix', 'Circuit', 'Steel',
  'Carbon', 'Ether', 'Void', 'Copper', 'Emerald', 'Ruby',
  'Obsidian', 'Bronze', 'Silver', 'Amethyst', 'Diamond', 'Sapphire',
  'Neon', 'Glitch', 'Shadow', 'Solar', 'Cyber', 'Chrome',
  'Bismuth', 'Cosmic', 'Plasma', 'Terra'
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 350, damping: 28 }
  },
};

export const MonkesExplorer: React.FC<MonkesExplorerProps> = ({
  monkes,
  loading,
  onOpenInGif,
  onOpenInSanta,
  onOpenInPoster = () => {},
  onToast,
}) => {
  const { lang, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBody, setSelectedBody] = useState('all');
  const [selectedHead, setSelectedHead] = useState('all');
  const [selectedEyes, setSelectedEyes] = useState('all');
  const [selectedEarring, setSelectedEarring] = useState('all');
  const [isHallOfFame, setIsHallOfFame] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [, setCopiedId] = useState<number | null>(null);

  const [activeModalMonke, setActiveModalMonke] = useState<Monke | null>(null);
  const [theatreIndex, setTheatreIndex] = useState<number | null>(null);

  // Dynamic Trait Lists
  const { headOptions, eyesOptions, earringOptions } = useMemo(() => {
    const heads = new Set<string>();
    const eyes = new Set<string>();
    const earrings = new Set<string>();

    monkes.forEach((m) => {
      if (m.attributes?.Head && m.attributes.Head !== 'None') heads.add(m.attributes.Head);
      if (m.attributes?.Eyes && m.attributes.Eyes !== 'None') eyes.add(m.attributes.Eyes);
      if (m.attributes?.Earring && m.attributes.Earring !== 'None') earrings.add(m.attributes.Earring);
    });

    return {
      headOptions: Array.from(heads).sort(),
      eyesOptions: Array.from(eyes).sort(),
      earringOptions: Array.from(earrings).sort(),
    };
  }, [monkes]);

  // Filter & Sort Logic
  const filteredAndSortedMonkes = useMemo(() => {
    let result = [...monkes];

    if (isHallOfFame) {
      result = result.filter((m) => m.rank && m.rank <= 100);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter((m) => {
        if (String(m.id).includes(q)) return true;
        if (String(m.inscription).includes(q)) return true;
        if (m.attributes.Body?.toLowerCase().includes(q)) return true;
        if (m.attributes.Head?.toLowerCase().includes(q)) return true;
        if (m.attributes.Eyes?.toLowerCase().includes(q)) return true;
        if (m.attributes.Earring?.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    if (selectedBody !== 'all') {
      result = result.filter((m) => m.attributes.Body?.toLowerCase() === selectedBody.toLowerCase());
    }

    if (selectedHead !== 'all') {
      result = result.filter((m) => m.attributes.Head?.toLowerCase() === selectedHead.toLowerCase());
    }

    if (selectedEyes !== 'all') {
      result = result.filter((m) => m.attributes.Eyes?.toLowerCase() === selectedEyes.toLowerCase());
    }

    if (selectedEarring !== 'all') {
      result = result.filter((m) => m.attributes.Earring?.toLowerCase() === selectedEarring.toLowerCase());
    }

    result.sort((a, b) => {
      let valA: number;
      let valB: number;

      switch (sortField) {
        case 'rank':
          valA = a.rank ?? 99999;
          valB = b.rank ?? 99999;
          break;
        case 'id':
          valA = a.id;
          valB = b.id;
          break;
        case 'inscription':
          valA = a.inscription;
          valB = b.inscription;
          break;
        case 'block':
          valA = a.block;
          valB = b.block;
          break;
        default:
          valA = a.id;
          valB = b.id;
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [monkes, isHallOfFame, searchTerm, selectedBody, selectedHead, selectedEyes, selectedEarring, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedMonkes.length / itemsPerPage) || 1;
  const paginatedMonkes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedMonkes.slice(start, start + itemsPerPage);
  }, [filteredAndSortedMonkes, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      handlePageChange(p);
      setJumpPageInput('');
    }
  };

  const handleCopyPubkey = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onToast(t.toastCopied, `${t.toastCopiedDesc} (#${id})`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeFilterCount = (selectedBody !== 'all' ? 1 : 0) + 
    (selectedHead !== 'all' ? 1 : 0) + 
    (selectedEyes !== 'all' ? 1 : 0) + 
    (selectedEarring !== 'all' ? 1 : 0);

  const handleLaunchScreensaver = async (startIndex: number = 0) => {
    setTheatreIndex(startIndex);
    try {
      const el = document.documentElement as any;
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          await el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
          await el.msRequestFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen call note:', e);
    }
  };

  const resetAllFilters = () => {
    setSelectedBody('all');
    setSelectedHead('all');
    setSelectedEyes('all');
    setSelectedEarring('all');
    setIsHallOfFame(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      
      {/* Control Bar: Filters, Search, Views */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl space-y-4 shadow-xl border border-white/[0.08]">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          
          {/* Left: Search Input */}
          <div className="relative flex-1 max-w-full lg:max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-400 transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 rounded-2xl bg-slate-950/60 border border-white/10 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                {t.clearSearch}
              </button>
            )}
          </div>

          {/* Right: Hall of Fame, Filter Toggles, Sort, Theatre Mode & View Toggle */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-2.5">
            
            {/* Hall of Fame Toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsHallOfFame((h) => !h)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-mono font-bold transition-all border shadow-sm',
                isHallOfFame
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-amber-500/20'
                  : 'bg-slate-950/60 border-white/10 text-slate-300 hover:text-white hover:border-amber-500/40'
              )}
            >
              <Crown className={clsx('w-3.5 h-3.5', isHallOfFame ? 'text-amber-300' : 'text-amber-400')} />
              <span>{isHallOfFame ? t.hallOfFame : t.hallOfFame}</span>
            </motion.button>

            {/* Advanced Filters Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdvancedFilters((v) => !v)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-mono font-medium transition-all border shadow-sm',
                showAdvancedFilters || activeFilterCount > 0
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                  : 'bg-slate-950/60 border-white/10 text-slate-300 hover:text-white'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t.filterBtn}</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </motion.button>

            {/* Screensaver Fullscreen Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleLaunchScreensaver(0)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-mono font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 transition-all shadow-sm"
              title={t.theatreMode}
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.theatreMode}</span>
            </motion.button>

            {/* Sort Selector */}
            <div className="flex items-center rounded-2xl bg-slate-950/60 border border-white/10 p-1 text-xs shadow-inner">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="bg-transparent pl-2.5 pr-2 py-1.5 text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="rank" className="bg-slate-900">{t.sortRank}</option>
                <option value="id" className="bg-slate-900">{t.sortId}</option>
                <option value="inscription" className="bg-slate-900">{t.sortInscription}</option>
                <option value="block" className="bg-slate-900">{t.sortBlock}</option>
              </select>
              <button
                onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                title={sortOrder === 'asc' ? t.orderAsc : t.orderDesc}
                className="px-2 py-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-amber-400 transition-colors active:scale-95"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* View Mode Toggle (Grid / Table) */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-950/60 border border-white/10 shadow-inner">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'p-2 rounded-xl transition-all',
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                )}
                title={t.viewGrid}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={clsx(
                  'p-2 rounded-xl transition-all',
                  viewMode === 'table'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                )}
                title={t.viewTable}
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Expandable Multi-Trait Matrix Filters */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-2 border-t border-white/[0.06] space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                
                {/* 1. Body Selector */}
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">{t.filterBody}</label>
                  <select
                    value={selectedBody}
                    onChange={(e) => setSelectedBody(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {ALL_BODY_TYPES.map((b) => (
                      <option key={b} value={b} className="bg-slate-900">{b === 'all' ? t.allBodies : b}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Head Selector */}
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">{t.filterHead}</label>
                  <select
                    value={selectedHead}
                    onChange={(e) => setSelectedHead(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900">{t.allHeads}</option>
                    {headOptions.map((h) => (
                      <option key={h} value={h} className="bg-slate-900">{h}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Eyes Selector */}
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">{t.filterEyes}</label>
                  <select
                    value={selectedEyes}
                    onChange={(e) => setSelectedEyes(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900">{t.allEyes}</option>
                    {eyesOptions.map((e) => (
                      <option key={e} value={e} className="bg-slate-900">{e}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Earring Selector */}
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">{t.filterEarring}</label>
                  <select
                    value={selectedEarring}
                    onChange={(e) => setSelectedEarring(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900">{t.allEarrings}</option>
                    {earringOptions.map((er) => (
                      <option key={er} value={er} className="bg-slate-900">{er}</option>
                    ))}
                  </select>
                </div>

              </div>

              {activeFilterCount > 0 && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={resetAllFilters}
                    className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t.resetFilters}</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats & Summary Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/[0.06] font-mono gap-2">
          <div className="text-[11px] sm:text-xs flex items-center gap-1.5 flex-wrap">
            <span>{t.totalFound}</span>
            <span className="text-white font-bold">{filteredAndSortedMonkes.length.toLocaleString()}</span>
            <span>/ {monkes.length.toLocaleString()} {t.ofMonkes}</span>
            
            {isHallOfFame && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                👑 Top 100
              </span>
            )}
            {selectedBody !== 'all' && (
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10">
                Body: {selectedBody}
              </span>
            )}
            {selectedHead !== 'all' && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Head: {selectedHead}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span>{t.perPage}:</span>
            {[24, 48, 96].map((num) => (
              <button
                key={num}
                onClick={() => setItemsPerPage(num)}
                className={clsx(
                  'px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all active:scale-95',
                  itemsPerPage === num
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                )}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-3xl p-3.5 space-y-3 animate-pulse">
              <div className="aspect-square bg-slate-800/50 rounded-2xl" />
              <div className="h-4 bg-slate-800/50 rounded-lg w-2/3" />
              <div className="h-3 bg-slate-800/30 rounded-lg w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAndSortedMonkes.length === 0 && (
        <div className="text-center py-20 glass-panel rounded-3xl border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">{t.noResults}</h3>
          <p className="text-slate-400 text-xs font-mono max-w-sm mx-auto">
            {t.noResultsSub}
          </p>
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 font-mono text-xs font-bold hover:bg-amber-500/30 border border-amber-500/40"
          >
            重置所有筛选
          </button>
        </div>
      )}

      {/* Main Content: 3D Tilt Parallax Grid */}
      {!loading && viewMode === 'grid' && filteredAndSortedMonkes.length > 0 && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key={`${currentPage}-${selectedBody}-${selectedHead}-${selectedEyes}-${selectedEarring}-${sortField}-${sortOrder}-${searchTerm}-${isHallOfFame}`}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4"
        >
          {paginatedMonkes.map((monke, idx) => {
            const attrs = monke.attributes;
            const globalIndex = (currentPage - 1) * itemsPerPage + idx;

            return (
              <motion.div
                key={monke.id}
                variants={cardVariants}
              >
                <ParallaxCard
                  onClick={() => setActiveModalMonke(monke)}
                  className="h-full glass-panel rounded-3xl p-3 border border-white/[0.07] hover:border-amber-500/50 transition-colors duration-200 hover:shadow-[0_12px_28px_-6px_rgba(245,158,11,0.2)] flex flex-col justify-between"
                >
                  {/* Image Box */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black/50 border border-white/5 mb-3 shadow-inner">
                    <img
                      src={getMonkeImageUrl(monke.id)}
                      alt={`NodeMonke #${monke.id}`}
                      loading="lazy"
                      className="w-full h-full object-contain pixelated group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Rank Badge */}
                    {monke.rank && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-black/70 backdrop-blur-md text-amber-300 border border-white/10 shadow-sm flex items-center gap-1">
                          {monke.rank <= 100 && <Crown className="w-2.5 h-2.5 text-amber-400" />}
                          <span>#{monke.rank}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ID & Inscription Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs sm:text-sm text-white group-hover:text-amber-300 transition-colors">
                        #{monke.id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        #{monke.inscription}
                      </span>
                    </div>

                    {/* Traits Badges */}
                    <div className="flex flex-wrap gap-1">
                      {attrs.Body && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.04] text-slate-300 font-sans border border-white/5 truncate max-w-full">
                          {attrs.Body}
                        </span>
                      )}
                      {attrs.Head && attrs.Head !== 'None' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 font-sans border border-amber-500/20 truncate max-w-full">
                          {attrs.Head}
                        </span>
                      )}
                    </div>
                  </div>

                </ParallaxCard>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Main Content: Table Mode */}
      {!loading && viewMode === 'table' && filteredAndSortedMonkes.length > 0 && (
        <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl overflow-x-auto">
          <table className="w-full text-left font-mono text-xs min-w-[640px]">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-white/5">
              <tr>
                <th className="p-3.5 pl-5">{t.tableThImage}</th>
                <th className="p-3.5">{t.tableThRank}</th>
                <th className="p-3.5">{t.tableThId}</th>
                <th className="p-3.5">{t.tableThInscription}</th>
                <th className="p-3.5">{t.tableThTraits}</th>
                <th className="p-3.5 pr-5 text-right">{t.tableThActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {paginatedMonkes.map((monke) => {
                const attrs = monke.attributes;
                return (
                  <tr 
                    key={monke.id}
                    onClick={() => setActiveModalMonke(monke)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="p-3 pl-5">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/50 border border-white/10 p-0.5">
                        <img
                          src={getMonkeImageUrl(monke.id)}
                          alt={`#${monke.id}`}
                          loading="lazy"
                          className="w-full h-full object-contain pixelated"
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-amber-400">
                        {monke.rank ? `#${monke.rank}` : '-'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white">#{monke.id}</td>
                    <td className="p-3 text-slate-400">#{monke.inscription}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5 font-sans">
                          {attrs.Body}
                        </span>
                        {attrs.Head && attrs.Head !== 'None' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-sans">
                            {attrs.Head}
                          </span>
                        )}
                        {attrs.Eyes && attrs.Eyes !== 'None' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-sans">
                            {attrs.Eyes}
                          </span>
                        )}
                        {attrs.Earring && attrs.Earring !== 'None' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 font-sans">
                            {attrs.Earring}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenInGif(monke.id)}
                          title={t.actionMakeGif}
                          className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenInSanta(monke.id)}
                          title={t.actionSanta}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all active:scale-95"
                        >
                          <Gift className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveModalMonke(monke)}
                          title={t.actionDetails}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition-all active:scale-95"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && filteredAndSortedMonkes.length > 0 && (
        <div className="glass-panel p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 font-mono text-xs shadow-xl border border-white/[0.08]">
          
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-slate-900 border border-white/10 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t.prevPage}</span>
            </motion.button>

            <span className="text-slate-400 px-2 font-medium">
              {lang === 'zh' ? (
                <>第 <strong className="text-white font-bold">{currentPage}</strong> / {totalPages} 页</>
              ) : (
                <>Page <strong className="text-white font-bold">{currentPage}</strong> of <strong className="text-white font-bold">{totalPages}</strong></>
              )}
            </span>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-slate-900 border border-white/10 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition-all shadow-sm"
            >
              <span>{t.nextPage}</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Jump to Page */}
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
            <span className="text-slate-400">{t.jumpTo}</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              placeholder={`${currentPage}`}
              className="w-16 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-center text-white focus:outline-none focus:border-amber-500 shadow-inner"
            />
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold hover:brightness-110 transition-all shadow-md"
            >
              {t.jumpGo}
            </motion.button>
          </form>

        </div>
      )}

      {/* Detail Modal */}
      <MonkeDetailModal
        monke={activeModalMonke}
        onClose={() => setActiveModalMonke(null)}
        onOpenInGif={onOpenInGif}
        onOpenInSanta={onOpenInSanta}
        onOpenInPoster={onOpenInPoster}
        onCopyPubkey={(text) => activeModalMonke && handleCopyPubkey(text, activeModalMonke.id)}
      />

      {/* Fullscreen Cinematic Theatre Modal */}
      <TheatreModal
        isOpen={theatreIndex !== null}
        monkes={filteredAndSortedMonkes}
        initialIndex={theatreIndex || 0}
        onClose={() => setTheatreIndex(null)}
        onOpenInGif={onOpenInGif}
        onOpenInSanta={onOpenInSanta}
        onOpenInPoster={onOpenInPoster}
      />

    </div>
  );
};
