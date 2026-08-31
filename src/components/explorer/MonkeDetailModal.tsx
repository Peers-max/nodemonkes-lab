import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Sparkles, Gift, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Monke, ColorInfo } from '../../types';
import { getMonkeImageUrl, getImageColors } from '../../utils/api';
import { TraitBadge } from '../ui/Badge';
import { useLanguage } from '../../utils/i18n';

interface MonkeDetailModalProps {
  monke: Monke | null;
  onClose: () => void;
  onOpenInGif: (monkeId: number) => void;
  onOpenInSanta: (monkeId: number) => void;
  onOpenInPoster?: (monkeId: number) => void;
  onCopyPubkey: (text: string) => void;
}

export const MonkeDetailModal: React.FC<MonkeDetailModalProps> = ({
  monke,
  onClose,
  onOpenInGif,
  onOpenInSanta,
  onOpenInPoster = () => {},
  onCopyPubkey,
}) => {
  const { t } = useLanguage();
  const [colors, setColors] = useState<ColorInfo[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!monke) return;
    setColors([]);
    getImageColors(getMonkeImageUrl(monke.id), monke.id).then(setColors);
  }, [monke]);

  const handleCopy = () => {
    if (!monke) return;
    onCopyPubkey(monke.scriptPubkey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const attrs = monke?.attributes;

  return (
    <AnimatePresence>
      {monke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          
          {/* Backdrop Blur with Fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Card with Spring Scale */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="relative w-full max-w-2xl bg-[#0C101A] border border-white/[0.12] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                  <span>NodeMonke #{monke.id}</span>
                </h2>
                {monke.rank && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm">
                    Rank #{monke.rank}
                  </span>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                
                {/* Image Preview */}
                <div className="relative aspect-square rounded-2xl bg-black/60 border border-white/10 p-4 flex items-center justify-center overflow-hidden shadow-inner group">
                  <img
                    src={getMonkeImageUrl(monke.id)}
                    alt={`NodeMonke #${monke.id}`}
                    className="w-full h-full object-contain pixelated transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-3 left-3 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-white/5 backdrop-blur-md">
                    {t.modalBlock} #{monke.block}
                  </span>
                </div>

                {/* Quick Overview */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">{t.modalInscription}</span>
                      <span className="text-white font-semibold text-sm">#{monke.inscription}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">{t.modalTotalTraits}</span>
                      <span className="text-white font-semibold text-sm">{attrs?.Count || 4} {t.modalTraitsUnit}</span>
                    </div>
                  </div>

                  {/* Color Palette */}
                  <div className="space-y-2">
                    <span className="text-xs text-slate-400 font-medium block">{t.modalColorPalette} ({colors.length})</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {colors.slice(0, 12).map((c, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.25, y: -2 }}
                          title={`rgb(${c.r}, ${c.g}, ${c.b})`}
                          className="w-6 h-6 rounded-lg border border-white/20 shadow-sm cursor-pointer"
                          style={{ backgroundColor: `rgb(${c.r}, ${c.g}, ${c.b})` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-col gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onOpenInGif(monke.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 shadow-md shadow-amber-500/20 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{t.modalMakeGif}</span>
                    </motion.button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onOpenInSanta(monke.id);
                          onClose();
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-all"
                      >
                        <Gift className="w-3.5 h-3.5 text-rose-400" />
                        <span>{t.modalSanta}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onOpenInPoster(monke.id);
                          onClose();
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all"
                      >
                        <span>🖼️</span>
                        <span>{t.modalMakePoster}</span>
                      </motion.button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Traits Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {t.modalTraits}
                </h3>
                {attrs && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <TraitBadge label="Body" value={attrs.Body} percentage={attrs.BodyCount ? (attrs.BodyCount / 10000) * 100 : undefined} />
                    <TraitBadge label="Head" value={attrs.Head || 'None'} percentage={attrs.HeadCount ? (attrs.HeadCount / 10000) * 100 : undefined} />
                    <TraitBadge label="Eyes" value={attrs.Eyes || 'None'} percentage={attrs.EyesCount ? (attrs.EyesCount / 10000) * 100 : undefined} />
                    <TraitBadge label="Earring" value={attrs.Earring || 'None'} percentage={attrs.EarringCount ? (attrs.EarringCount / 10000) * 100 : undefined} />
                  </div>
                )}
              </div>

              {/* Marketplace Trade Links */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <motion.a
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  href="https://www.satflow.com/ordinals/nodemonkes"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-semibold transition-all hover:border-amber-500/40 shadow-sm"
                >
                  <span>SatFlow</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </motion.a>

                <motion.a
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  href="https://ord.net/collection/nodemonkes"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-semibold transition-all hover:border-amber-500/40 shadow-sm"
                >
                  <span>Ord.net</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </motion.a>
              </div>

              {/* Script PubKey */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono uppercase">{t.modalOwner}</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-mono text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? t.modalCopied : t.modalCopyKey}</span>
                  </button>
                </div>
                <div 
                  onClick={handleCopy}
                  className="p-3.5 rounded-2xl bg-black/60 border border-white/5 font-mono text-[11px] text-slate-300 break-all cursor-pointer hover:border-white/20 transition-all select-all shadow-inner"
                >
                  {monke.scriptPubkey}
                </div>
              </div>

            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
