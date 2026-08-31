import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TabType, Monke, ToastMessage } from './types';
import { fetchMonkes } from './utils/api';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MonkesExplorer } from './components/explorer/MonkesExplorer';
import { GifStudio } from './components/gif/GifStudio';
import { DiyStudio } from './components/diy/DiyStudio';
import { SantaStudio } from './components/santa/SantaStudio';
import { ToastContainer } from './components/ui/Toast';
import { LanguageProvider, useLanguage } from './utils/i18n';

const pageVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.18, ease: 'easeIn' as const } },
};

const AppContent: React.FC = () => {
  const { t } = useLanguage();

  const getInitialTab = (): TabType => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as TabType;
    if (['explorer', 'gif', 'diy', 'santa'].includes(tab)) {
      return tab;
    }
    return 'explorer';
  };

  const getInitialMonkeId = (): number => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id') || '209', 10);
    return isNaN(id) || id < 1 || id > 10000 ? 209 : id;
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [targetMonkeId, setTargetMonkeId] = useState<number>(getInitialMonkeId);
  const [monkes, setMonkes] = useState<Monke[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const handleTabChange = useCallback((tab: TabType, id?: number) => {
    setActiveTab(tab);
    if (id !== undefined) {
      setTargetMonkeId(id);
    }
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    if (id !== undefined) {
      params.set('id', String(id));
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
  }, []);

  const addToast = useCallback((title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      const filtered = prev.slice(-1);
      return [...filtered, { id, title, description, type }];
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchMonkes();
        setMonkes(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load NodeMonkes:', err);
        setError(t.toastNetworkWarningDesc);
        addToast(t.toastNetworkWarning, t.toastNetworkWarningDesc, 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [addToast, t]);

  const handleOpenInGif = (id: number) => {
    handleTabChange('gif', id);
    addToast(t.toastGifLoaded, `${t.toastGifLoadedDesc} (#${id})`, 'info');
  };

  const handleOpenInSanta = (id: number) => {
    handleTabChange('santa', id);
    addToast(t.toastSantaLoaded, `${t.toastSantaLoadedDesc} (#${id})`, 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-ambient-mesh text-slate-100 selection:bg-amber-500/30 selection:text-amber-200 relative">
      
      {/* Top Subtle Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent blur-[90px] pointer-events-none -z-10" />

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        totalMonkes={monkes.length || 10000}
        onQuickSearchClick={() => handleTabChange('explorer')}
      />

      {/* Main View Area with Fluid Spring Tab Switch Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between shadow-lg">
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg font-mono text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Tab 1: Explorer */}
          {activeTab === 'explorer' && (
            <motion.div
              key="explorer"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <MonkesExplorer
                monkes={monkes}
                loading={loading}
                onOpenInGif={handleOpenInGif}
                onOpenInSanta={handleOpenInSanta}
                onToast={addToast}
              />
            </motion.div>
          )}

          {/* Tab 2: GIF Studio */}
          {activeTab === 'gif' && (
            <motion.div
              key="gif"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <GifStudio
                initialMonkeId={targetMonkeId}
                monkes={monkes}
                onToast={addToast}
              />
            </motion.div>
          )}

          {/* Tab 3: DIY Studio */}
          {activeTab === 'diy' && (
            <motion.div
              key="diy"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <DiyStudio onToast={addToast} />
            </motion.div>
          )}

          {/* Tab 4: Santa Monkes */}
          {activeTab === 'santa' && (
            <motion.div
              key="santa"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <SantaStudio
                initialMonkeId={targetMonkeId}
                monkes={monkes}
                onOpenInGif={handleOpenInGif}
                onToast={addToast}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer */}
      <Footer />

      {/* Global Toast System */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};
