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
  ExternalLink
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Monke } from '../../types';
import { getMonkeImageUrl } from '../../utils/api';
import { MonkeDetailModal } from './MonkeDetailModal';
import { useLanguage } from '../../utils/i18n';

interface MonkesExplorerProps {
  monkes: Monke[];
  loading: boolean;
  onOpenInGif: (monkeId: number) => void;
  onOpenInSanta: (monkeId: number) => void;
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

export const MonkesExplorer: React.FC<MonkesExplorerProps> = ({
  monkes,
  loading,
  onOpenInGif,
  onOpenInSanta,
  onToast,
}) => {
  const { lang, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBody, setSelectedBody] = useState('all');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [, setCopiedId] = useState<number | null>(null);

  // Detail Modal State
  const [activeModalMonke, setActiveModalMonke] = useState<Monke | null>(null);

  // Filter & Sort Logic (Optimized for 10,000 items)
  const filteredAndSortedMonkes = useMemo(() => {
    let result = [...monkes];

    // Filter by search (ID, Inscription, or Trait keywords)
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

    // Filter by Body trait
    if (selectedBody !== 'all') {
      result = result.filter(
        (m) => m.attributes.Body?.toLowerCase() === selectedBody.toLowerCase()
      );
    }

    // Sort
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
  }, [monkes, searchTerm, selectedBody, sortField, sortOrder]);

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

  return (
    <div className="space-y-6">
      
      {/* Control Bar: Filters, Search, Views */}
      <div className="glass-panel p-3.5 sm:p-5 rounded-2xl space-y-3.5 sm:space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          
          {/* Left: Search Input */}
          <div className="relative flex-1 max-w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-12 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-white/5"
              >
                {t.clearSearch}
              </button>
            )}
          </div>

          {/* Right: Body Filter, Sort & View Mode */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-2.5">
            
            {/* Body Selector */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={selectedBody}
                onChange={(e) => setSelectedBody(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500/60 transition-all cursor-pointer"
              >
                {ALL_BODY_TYPES.map((b) => (
                  <option key={b} value={b} className="bg-slate-900 text-slate-100">
                    {b === 'all' ? t.allBodies : b}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center rounded-xl bg-slate-900/90 border border-white/10 p-0.5 text-xs">
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
                className="px-2 py-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* View Mode Toggle (Grid / Table) */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-900/90 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'p-1.5 sm:p-2 rounded-lg transition-all',
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                )}
                title={t.viewGrid}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={clsx(
                  'p-1.5 sm:p-2 rounded-lg transition-all',
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                )}
                title={t.viewTable}
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Stats & Summary Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5 font-mono gap-2">
          <div className="text-[11px] sm:text-xs">
            {t.totalFound} <span className="text-white font-semibold">{filteredAndSortedMonkes.length.toLocaleString()}</span> /{' '}
            <span className="text-white font-semibold">{monkes.length.toLocaleString()}</span> {t.ofMonkes}
            {selectedBody !== 'all' && (
              <span className="ml-2 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Body: {selectedBody}
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
                  'px-2 py-0.5 rounded-md text-xs transition-colors',
                  itemsPerPage === num
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl p-3 space-y-3 animate-pulse">
              <div className="aspect-square bg-slate-800/60 rounded-xl" />
              <div className="h-4 bg-slate-800/60 rounded w-2/3" />
              <div className="h-3 bg-slate-800/40 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAndSortedMonkes.length === 0 && (
        <div className="text-center py-20 glass-panel rounded-2xl border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">{t.noResults}</h3>
          <p className="text-slate-400 text-xs font-mono max-w-sm mx-auto">
            {t.noResultsSub}
          </p>
        </div>
      )}

      {/* Main Content: Grid Mode */}
      {!loading && viewMode === 'grid' && filteredAndSortedMonkes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {paginatedMonkes.map((monke) => {
            const attrs = monke.attributes;
            return (
              <div
                key={monke.id}
                onClick={() => setActiveModalMonke(monke)}
                className="group glass-panel rounded-2xl p-2.5 sm:p-3 border border-white/5 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              >
                {/* Image Box */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/40 border border-white/5 mb-2.5">
                  <img
                    src={getMonkeImageUrl(monke.id)}
                    alt={`NodeMonke #${monke.id}`}
                    loading="lazy"
                    className="w-full h-full object-contain pixelated group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Rank Badge */}
                  {monke.rank && (
                    <div className="absolute top-1.5 left-1.5">
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/70 backdrop-blur-md text-amber-300 border border-white/10">
                        #{monke.rank}
                      </span>
                    </div>
                  )}
                </div>

                {/* ID & Inscription Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-100">
                      #{monke.id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      #{monke.inscription}
                    </span>
                  </div>

                  {/* Traits Badges */}
                  <div className="flex flex-wrap gap-1">
                    {attrs.Body && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300 font-sans border border-white/5 truncate max-w-full">
                        {attrs.Body}
                      </span>
                    )}
                    {attrs.Head && attrs.Head !== 'None' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-sans border border-amber-500/20 truncate max-w-full">
                        {attrs.Head}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Main Content: Table Mode (Mobile Horizontal Scrollable) */}
      {!loading && viewMode === 'table' && filteredAndSortedMonkes.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl overflow-x-auto">
          <table className="w-full text-left font-mono text-xs min-w-[640px]">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-white/5">
              <tr>
                <th className="p-3.5 pl-4">{t.tableThImage}</th>
                <th className="p-3.5">{t.tableThRank}</th>
                <th className="p-3.5">{t.tableThId}</th>
                <th className="p-3.5">{t.tableThInscription}</th>
                <th className="p-3.5">{t.tableThTraits}</th>
                <th className="p-3.5 pr-4 text-right">{t.tableThActions}</th>
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
                    <td className="p-3 pl-4">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 border border-white/10 p-0.5">
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
                        <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5 font-sans">
                          {attrs.Body}
                        </span>
                        {attrs.Head && attrs.Head !== 'None' && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-sans">
                            {attrs.Head}
                          </span>
                        )}
                        {attrs.Eyes && attrs.Eyes !== 'None' && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-sans">
                            {attrs.Eyes}
                          </span>
                        )}
                        {attrs.Earring && attrs.Earring !== 'None' && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-sans">
                            {attrs.Earring}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenInGif(monke.id)}
                          title={t.actionMakeGif}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenInSanta(monke.id)}
                          title={t.actionSanta}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all"
                        >
                          <Gift className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveModalMonke(monke)}
                          title={t.actionDetails}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition-all"
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
        <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 font-mono text-xs shadow-xl">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t.prevPage}</span>
            </button>

            <span className="text-slate-400 px-1">
              {lang === 'zh' ? (
                <>第 <strong className="text-white">{currentPage}</strong> / {totalPages} 页</>
              ) : (
                <>Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong></>
              )}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 active:scale-95 transition-all"
            >
              <span>{t.nextPage}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
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
              className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-center text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors active:scale-95"
            >
              {t.jumpGo}
            </button>
          </form>

        </div>
      )}

      {/* Detail Modal */}
      <MonkeDetailModal
        monke={activeModalMonke}
        onClose={() => setActiveModalMonke(null)}
        onOpenInGif={onOpenInGif}
        onOpenInSanta={onOpenInSanta}
        onCopyPubkey={(text) => activeModalMonke && handleCopyPubkey(text, activeModalMonke.id)}
      />

    </div>
  );
};
