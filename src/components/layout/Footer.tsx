import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-white/5 bg-[#080B10] py-8 mt-16 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-white tracking-tight">NODEMONKES SUITE</span>
          <span>•</span>
          <span>{t.footerDesc}</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://www.satflow.com/ordinals/nodemonkes"
            target="_blank"
            rel="noreferrer"
            className="hover:text-amber-400 transition-colors flex items-center gap-1.5 font-medium"
          >
            <span>SatFlow</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          <a
            href="https://ord.net/collection/nodemonkes"
            target="_blank"
            rel="noreferrer"
            className="hover:text-amber-400 transition-colors flex items-center gap-1.5 font-medium"
          >
            <span>Ord.net</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>

        <div className="text-slate-500 font-mono text-[11px]">
          {t.footerRights}
        </div>

      </div>
    </footer>
  );
};
