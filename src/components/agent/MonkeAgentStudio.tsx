import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Shuffle, 
  RotateCcw, 
  Copy, 
  Check, 
  Download, 
  Share2, 
  Flame, 
  TrendingUp, 
  MessageSquare, 
  FileText, 
  Twitter, 
  Settings2, 
  ShieldCheck,
  Zap,
  Radio,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Activity,
  Award,
  RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Monke } from '../../types';
import { getMonkeById, getMonkeImageUrl } from '../../utils/api';
import { useLanguage } from '../../utils/i18n';
import { deriveMonkePersona, PersonaProfile } from './personaEngine';
import { 
  callMonkeAI, 
  generateDailyJournal, 
  generateTweet, 
  ChatMessage, 
  getAIConfig, 
  saveAIConfig,
  AIProviderConfig,
  streamTextChunkByChunk 
} from './aiClient';
import { getDRPCConfig, saveDRPCConfig, DRPCConfig } from './drpcClient';
import { 
  runMonkeAgentHarness, 
  AgentTraceStep, 
  MONKE_TOOLS 
} from './agentHarness';

interface MonkeAgentStudioProps {
  initialMonkeId?: number;
  monkes: Monke[];
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

type StudioSubTab = 'chat' | 'journal' | 'tweet' | 'settings';

export const MonkeAgentStudio: React.FC<MonkeAgentStudioProps> = ({
  initialMonkeId = 209,
  monkes,
  onToast,
}) => {
  const { lang } = useLanguage();

  const [monkeId, setMonkeId] = useState<number>(initialMonkeId);
  const [activeSubTab, setActiveSubTab] = useState<StudioSubTab>('chat');

  // Derive Persona
  const currentMonke = useMemo(() => getMonkeById(monkeId), [monkeId]);
  const persona: PersonaProfile = useMemo(() => deriveMonkePersona(currentMonke, monkeId), [currentMonke, monkeId]);

  // Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [liveTraces, setLiveTraces] = useState<AgentTraceStep[]>([]);
  const [expandedTraces, setExpandedTraces] = useState<Record<string, boolean>>({});

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Journal States
  const [journal, setJournal] = useState<{ title: string; date: string; content: string; mood: string } | null>(null);
  const [isJournalLoading, setIsJournalLoading] = useState<boolean>(false);

  // Tweet States: Isolated per-topic & per-monke caching to prevent cross-topic collisions
  const [tweetTopic, setTweetTopic] = useState<'bullish' | 'toxic' | 'philosophical' | 'meme'>('bullish');
  const [tweetCache, setTweetCache] = useState<Record<string, string>>({});
  const [tweetLoadingTopic, setTweetLoadingTopic] = useState<string | null>(null);
  const [tweetCopied, setTweetCopied] = useState<boolean>(false);

  // Settings States
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(getAIConfig());
  const [customKeyInput, setCustomKeyInput] = useState<string>(aiConfig.apiKey || '');
  const [drpcConfig, setDrpcConfig] = useState<DRPCConfig>(getDRPCConfig());
  const [drpcKeyInput, setDrpcKeyInput] = useState<string>(drpcConfig.apiKey || '');

  // Auto scroll chat inside chat container only (strictly isolate from outer page scroll)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, liveTraces, isLoading]);

  // Initial Welcome message when persona or language changes
  useEffect(() => {
    const welcomeContent = lang === 'en'
      ? `${persona.catchphraseEn || 'LFG!'} I am ${persona.titleEn} (${persona.temperamentEn})!\nMotto: "${persona.taglineEn}".\nEquipped with real-time Web3 on-chain probes. Ask me anything about floor prices, Mempool gas, transactions, or market analytics!`
      : `${persona.catchphrase} 吾乃【${persona.title}】（${persona.temperament}）！\n座右铭：“${persona.tagline}”。\n已搭载 Web3 链上智能探针，随时为你调取行情、探测 Gas、扫描稀有度或解答各种链上问题！`;

    const welcomeMsg: ChatMessage = {
      id: `welcome_${persona.monkeId}_${lang}`,
      role: 'assistant',
      content: welcomeContent,
      timestamp: Date.now(),
    };
    setMessages([welcomeMsg]);
    setJournal(null);
  }, [persona, lang]);

  // Random monke switcher
  const handleRandomMonke = () => {
    const rand = Math.floor(Math.random() * 10000) + 1;
    setMonkeId(rand);
  };

  // Handle Send Chat via ReAct Agent Harness
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputPrompt('');
    setIsLoading(true);
    setLiveTraces([]);

    try {
      // Execute ReAct Harness loop
      const result = await runMonkeAgentHarness(text, persona, (currentTraces) => {
        setLiveTraces([...currentTraces]);
      }, lang);

      const assistantId = `ai_${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        traces: result.traces,
        usedTools: result.usedTools,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
      setLiveTraces([]);

      // Natural Token-by-Token Streaming animation
      await streamTextChunkByChunk(result.finalAnswer, (partial) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: partial } : msg
          )
        );
      }, 10);
    } catch (err: any) {
      console.error('Agent Harness error', err);
      setIsLoading(false);
      setLiveTraces([]);
      onToast(lang === 'zh' ? '智能体执行异常' : 'Agent Execution error', err.message || '', 'error');
    }
  };

  // Handle Journal Generation
  const handleGenerateJournal = async () => {
    if (isJournalLoading) return;
    setIsJournalLoading(true);
    try {
      const j = await generateDailyJournal(persona, new Date().toLocaleDateString(), lang);
      setJournal(j);
      setIsJournalLoading(false);
      onToast(lang === 'zh' ? '今日链上日记已出炉！' : 'Daily Journal Generated!', '', 'success');
    } catch (e: any) {
      setIsJournalLoading(false);
      onToast(lang === 'zh' ? '生成失败' : 'Failed', e.message, 'error');
    }
  };

  // Isolated Tweet Topic Generation & Strict Key-Based Cache
  const getTweetCacheKey = (topic: string) => `${monkeId}_${lang}_${topic}`;

  const handleSelectTweetTopic = (topic: 'bullish' | 'toxic' | 'philosophical' | 'meme') => {
    setTweetTopic(topic);
    const key = getTweetCacheKey(topic);
    if (!tweetCache[key] && tweetLoadingTopic !== topic) {
      generateSpecificTweet(topic);
    }
  };

  const generateSpecificTweet = async (topic: 'bullish' | 'toxic' | 'philosophical' | 'meme') => {
    const key = getTweetCacheKey(topic);
    setTweetLoadingTopic(topic);
    try {
      const tw = await generateTweet(persona, topic, lang);
      setTweetCache((prev) => ({ ...prev, [key]: tw }));
    } catch (e: any) {
      onToast(lang === 'zh' ? '生成推文失败' : 'Failed to generate tweet', e.message, 'error');
    } finally {
      setTweetLoadingTopic((current) => (current === topic ? null : current));
    }
  };

  const currentTweetKey = getTweetCacheKey(tweetTopic);
  const currentTweet = tweetCache[currentTweetKey] || '';
  const isCurrentTweetLoading = tweetLoadingTopic === tweetTopic;

  const handleCopyTweet = () => {
    if (!currentTweet) return;
    navigator.clipboard.writeText(currentTweet);
    setTweetCopied(true);
    setTimeout(() => setTweetCopied(false), 2000);
    onToast(lang === 'zh' ? '推文已复制到剪贴板！' : 'Tweet copied!', '', 'success');
  };

  const handlePostToTwitter = () => {
    if (!currentTweet) return;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(currentTweet)}`;
    window.open(url, '_blank');
  };

  // Handle Save Settings
  const handleSaveSettings = () => {
    const key = customKeyInput.trim();
    let provider: AIProviderConfig['provider'] = 'free_public';
    if (key.startsWith('AIza')) {
      provider = 'custom_gemini';
    } else if (key.startsWith('sk-')) {
      provider = key.length > 30 ? 'custom_deepseek' : 'custom_openai';
    }

    const newCfg: AIProviderConfig = {
      provider,
      apiKey: key.length > 0 ? key : undefined,
    };
    saveAIConfig(newCfg);
    setAiConfig(newCfg);

    const dkey = drpcKeyInput.trim();
    const newDrpcCfg: DRPCConfig = {
      apiKey: dkey.length > 0 ? dkey : undefined,
    };
    saveDRPCConfig(newDrpcCfg);
    setDrpcConfig(newDrpcCfg);

    onToast(
      lang === 'zh' ? '配置已保存' : 'Settings Saved',
      key || dkey
        ? (lang === 'zh' ? '已激活自定义高级大模型与 DRPC 节点加速！' : 'Custom Model & DRPC Node Activated!') 
        : (lang === 'zh' ? '已恢复默认免费公共通道' : 'Reverted to default free channel'),
      'success'
    );
  };

  const toggleTraceExpand = (msgId: string) => {
    setExpandedTraces((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fade-in pb-8">
      
      {/* Header Banner - Compact & Elevated */}
      <div className="text-center space-y-1 relative py-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono tracking-wide">
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span>{lang === 'zh' ? '10,000 神兽专属 AI 智能体 · ReAct 高级架构' : '10,000 Autonomous Monke AI Agents · ReAct Harness'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
          {lang === 'zh' ? 'NodeMonkes 智能体性格宇宙' : 'NodeMonkes AI Persona Universe'}
        </h1>
        <p className="text-xs text-slate-400 max-w-2xl mx-auto font-mono">
          {lang === 'zh' 
            ? '每只神兽拥有链上 Trait 派生的独立灵魂。搭载实时工具链，支持心声对话、每日日志与推文创作！'
            : 'Every NodeMonke has an autonomous persona with live on-chain tools, daily journals, and viral tweet crafting.'}
        </p>
      </div>

      {/* Main Grid: Left Persona Identity Card (4 Cols) + Right Interactive Workspace (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left 4 Cols: Active Monke Profile */}
        <div className="lg:col-span-4 space-y-3">
          <div className="glass-panel p-4 rounded-3xl border border-white/10 shadow-2xl space-y-3 relative overflow-hidden">
            
            {/* ID Selector & Random Button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400">
                  {lang === 'zh' ? '神兽主角' : 'Hero Monke'}
                </span>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={monkeId}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= 10000) setMonkeId(val);
                  }}
                  className="w-20 px-2 py-1 rounded-xl bg-slate-950 border border-white/20 text-center font-mono font-bold text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                onClick={handleRandomMonke}
                className="py-1 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '随机神兽' : 'Shuffle'}</span>
              </button>
            </div>

            {/* Avatar & Title */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-950/80 border-2 border-cyan-500/30 p-1.5 shadow-2xl relative overflow-hidden group">
                <img 
                  src={getMonkeImageUrl(monkeId)} 
                  alt="" 
                  className="w-full h-full object-contain pixelated group-hover:scale-105 transition-transform duration-300" 
                />
                <div className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded bg-black/70 border border-white/10 text-[9px] font-mono text-cyan-300">
                  AI #{monkeId}
                </div>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-white font-sans">
                  {lang === 'en' ? persona.titleEn : persona.title}
                </h3>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{lang === 'en' ? persona.archetypeNameEn : persona.archetypeNameZh}</span>
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-mono">
                    {lang === 'en' ? persona.temperamentEn : persona.temperament}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 italic px-2">
                “{lang === 'en' ? persona.taglineEn : persona.tagline}”
              </p>
            </div>

            {/* Catchphrase Badge */}
            <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
              <div className="text-[10px] font-mono text-slate-400">{lang === 'zh' ? '招牌口癖' : 'Catchphrase'}</div>
              <div className="text-[11px] font-mono font-bold text-amber-300">“{lang === 'en' ? persona.catchphraseEn : persona.catchphrase}”</div>
            </div>

            {/* 5D Persona Radar Stats */}
            <div className="space-y-1.5 pt-1 border-t border-white/10">
              <div className="text-[11px] font-mono font-bold text-slate-300 flex items-center justify-between">
                <span>{lang === 'zh' ? '五维性格雷达' : '5D Persona Stats'}</span>
                <span className="text-[10px] text-cyan-400 font-normal">{lang === 'zh' ? '链上 Trait 派生' : 'Trait Derived'}</span>
              </div>

              <div className="space-y-1">
                {[
                  { labelZh: '⚔️ 攻击/战斗力', labelEn: '⚔️ Attack & Combat', val: persona.stats.attack, color: 'bg-rose-500' },
                  { labelZh: '💎 比特币信仰', labelEn: '💎 BTC Conviction', val: persona.stats.faith, color: 'bg-amber-500' },
                  { labelZh: '🔥 毒舌/战神度', labelEn: '🔥 Roast & Toxicity', val: persona.stats.toxicity, color: 'bg-orange-500' },
                  { labelZh: '🧠 智商/洞察力', labelEn: '🧠 IQ & Wisdom', val: persona.stats.iq, color: 'bg-cyan-500' },
                  { labelZh: '😂 幽默/玩梗力', labelEn: '😂 Humor & Memes', val: persona.stats.humor, color: 'bg-emerald-500' },
                ].map((stat, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>{lang === 'zh' ? stat.labelZh : stat.labelEn}</span>
                      <span className="font-bold text-slate-200">{stat.val}/100</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div className={clsx('h-full rounded-full transition-all duration-500', stat.color)} style={{ width: `${stat.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div className="text-[10px] font-mono text-slate-400 leading-relaxed pt-1.5 border-t border-white/5 line-clamp-3 hover:line-clamp-none transition-all">
              {lang === 'en' ? persona.bioEn : persona.bio}
            </div>

          </div>
        </div>

        {/* Right 8 Cols: Interactive Agent Workspace */}
        <div className="lg:col-span-8 space-y-3">
          
          {/* Sub Tab Navigation */}
          <div className="glass-panel p-1.5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'chat', labelZh: '💬 实时心声对话', labelEn: '💬 Live Chat', icon: MessageSquare },
                { id: 'journal', labelZh: '📰 每日链上日记', labelEn: '📰 Daily Journal', icon: FileText },
                { id: 'tweet', labelZh: '🐦 推特爆款文案', labelEn: '🐦 Tweet Crafter', icon: Twitter },
                { id: 'settings', labelZh: '⚙️ 引擎设置', labelEn: '⚙️ Settings', icon: Settings2 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as StudioSubTab)}
                  className={clsx(
                    'py-1.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0',
                    activeSubTab === tab.id
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  )}
                >
                  <span>{lang === 'zh' ? tab.labelZh : tab.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ================= TAB 1: LIVE CHAT WITH HARNESS ================= */}
          {activeSubTab === 'chat' && (
            <div className="glass-panel p-4 rounded-3xl border border-white/10 shadow-2xl space-y-3 flex flex-col h-[502px]">
              
              {/* LLM Engine Connection Status Banner */}
              <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <div className={clsx('w-2 h-2 rounded-full', aiConfig.apiKey ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400')} />
                  <span className="text-slate-300">
                    {aiConfig.apiKey 
                      ? (lang === 'zh' ? `🧠 真实大模型已直连 (${aiConfig.provider})` : `Real LLM Connected (${aiConfig.provider})`)
                      : (lang === 'zh' ? '⚡ 真实链上探针已就绪 (Binance / MagicEden / Mempool)' : 'Live On-Chain Probes Active')}
                  </span>
                </div>
                {!aiConfig.apiKey && (
                  <button
                    onClick={() => setActiveSubTab('settings')}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 font-bold"
                  >
                    <span>{lang === 'zh' ? '接入免费大模型 Key' : 'Connect Free LLM Key'}</span>
                  </button>
                )}
              </div>

              {/* Message Feed */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {messages.map((m) => {
                  const isAi = m.role === 'assistant';
                  const hasTraces = m.traces && m.traces.length > 0;
                  const isExpanded = expandedTraces[m.id] ?? false;

                  return (
                    <div
                      key={m.id}
                      className={clsx('flex gap-3 items-start', isAi ? 'justify-start' : 'justify-end')}
                    >
                      {isAi && (
                        <div className="w-8 h-8 rounded-xl bg-slate-950 border border-cyan-500/30 p-0.5 shrink-0 overflow-hidden">
                          <img src={getMonkeImageUrl(monkeId)} alt="" className="w-full h-full object-contain pixelated" />
                        </div>
                      )}

                      <div
                        className={clsx(
                          'max-w-[85%] rounded-2xl p-3.5 text-xs font-mono leading-relaxed space-y-2 shadow-md',
                          isAi
                            ? 'bg-slate-900/90 border border-cyan-500/20 text-slate-200'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium'
                        )}
                      >
                        {isAi && (
                          <div className="text-[10px] text-cyan-400 font-bold flex items-center justify-between pb-1 border-b border-white/5">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-cyan-400" />
                              {lang === 'en' ? persona.titleEn : persona.title}
                            </span>
                            <div className="flex items-center gap-2">
                              {m.usedTools && m.usedTools.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[9px] text-cyan-300">
                                  {lang === 'en' ? `⚡ Probes (${m.usedTools.length})` : `⚡ 工具调用 (${m.usedTools.length})`}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Collapsible Chain-of-Thought Traces */}
                        {hasTraces && (
                          <div className="rounded-xl bg-slate-950/80 border border-cyan-500/20 overflow-hidden">
                            <button
                              onClick={() => toggleTraceExpand(m.id)}
                              className="w-full px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-cyan-300/90 hover:bg-white/5 transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <Cpu className="w-3 h-3 text-cyan-400" />
                                <span>{lang === 'en' ? '🧠 Chain of Thought & Probes' : '🧠 思考过程与链上探针 (Chain of Thought)'}</span>
                              </span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            {isExpanded && (
                              <div className="p-3 space-y-2 border-t border-cyan-500/15 bg-slate-950/60 text-[11px] text-slate-300">
                                {m.traces!.map((t, idx) => (
                                  <div key={idx} className="space-y-1">
                                    <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                      <span>Step {t.stepNumber}:</span>
                                      <span className="text-cyan-400 italic">{t.thought}</span>
                                    </div>
                                    {t.action && (
                                      <div className="p-2 rounded-lg bg-black/60 border border-white/10 text-[10px] text-amber-300 font-mono">
                                        <div className="flex items-center gap-1 text-cyan-300">
                                          <Zap className="w-3 h-3" />
                                          <span>{t.action.toolLabel}</span>
                                        </div>
                                        {t.action.output && (
                                          <div className="text-slate-400 mt-1 pl-4 border-l border-cyan-500/30">
                                            {JSON.stringify(t.action.output, null, 2)}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    </div>
                  );
                })}

                {/* Real-time thinking animation with Live Traces */}
                {isLoading && (
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-xl bg-slate-950 border border-cyan-500/30 p-0.5 shrink-0 overflow-hidden">
                      <img src={getMonkeImageUrl(monkeId)} alt="" className="w-full h-full object-contain pixelated" />
                    </div>
                    <div className="max-w-[85%] p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300 space-y-2 shadow-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                        <span className="font-bold">{lang === 'zh' ? '神兽正在执行 ReAct 思考与链上探针...' : 'Monke ReAct Loop Executing...'}</span>
                      </div>
                      {liveTraces.length > 0 && (
                        <div className="space-y-1 text-[10px] text-slate-400 border-t border-cyan-500/20 pt-1.5">
                          {liveTraces.map((t, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-cyan-300/80">
                              <span>›</span>
                              <span>{t.thought}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Input Box */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder={lang === 'zh' ? `向 ${persona.title} 提问或调用链上探针...` : `Ask ${persona.titleEn} or query live on-chain tools...`}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-white/15 font-mono text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputPrompt.trim()}
                  className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 active:scale-95 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ================= TAB 3: DAILY JOURNAL ================= */}
          {activeSubTab === 'journal' && (
            <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-2xl space-y-4 min-h-[502px] flex flex-col justify-between">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white font-sans">
                    {lang === 'zh' ? '神兽每日链上日记 (Daily Journal)' : 'Daily On-Chain Monke Journal'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'zh' ? '以这只神兽的第一人称视角，撰写今天的链上见闻、生活与思考。' : 'Auto-generated first-person daily diary for this Monke.'}
                  </p>
                </div>
                <button
                  onClick={handleGenerateJournal}
                  disabled={isJournalLoading}
                  className="py-2 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 hover:brightness-110 active:scale-98 shadow-lg transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isJournalLoading ? (lang === 'zh' ? '正在撰写中...' : 'Writing...') : (lang === 'zh' ? '✍️ 撰写今日日记' : 'Write Journal')}</span>
                </button>
              </div>

              {journal ? (
                <div className="p-5 rounded-3xl bg-[#14100C] border-2 border-amber-500/30 text-amber-100 shadow-2xl relative space-y-3 font-serif flex-1 flex flex-col justify-between">
                  {/* Journal Header */}
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-black border border-amber-500/40 p-0.5 shrink-0 overflow-hidden">
                        <img src={getMonkeImageUrl(monkeId)} alt="" className="w-full h-full object-contain pixelated" />
                      </div>
                      <div>
                        <div className="font-bold text-amber-300">{journal.title}</div>
                        <div className="text-[10px] text-amber-500/80">{journal.date}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                      {journal.mood}
                    </span>
                  </div>

                  {/* Journal Body */}
                  <div className="text-xs sm:text-sm leading-relaxed text-amber-200/90 whitespace-pre-wrap font-sans flex-1 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
                    {journal.content}
                  </div>

                  {/* Journal Footer Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-amber-500/20 font-mono text-xs">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${journal.title}\n${journal.date}\n\n${journal.content}`);
                        onToast(lang === 'zh' ? '日记已复制' : 'Copied', '', 'success');
                      }}
                      className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{lang === 'zh' ? '复制日记' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 space-y-3 text-slate-400 font-mono text-xs border border-dashed border-white/10 rounded-3xl flex-1 flex flex-col items-center justify-center">
                  <FileText className="w-10 h-10 mx-auto text-slate-600" />
                  <p>{lang === 'zh' ? '暂未生成今日日记，点击上方按钮让神兽动笔！' : 'Click above to write today’s diary!'}</p>
                </div>
              )}

            </div>
          )}

          {/* ================= TAB 4: TWEET CRAFTER ================= */}
          {activeSubTab === 'tweet' && (
            <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-2xl space-y-4 min-h-[502px] flex flex-col justify-between">
              
              <div>
                <h3 className="text-base font-extrabold text-white font-sans">
                  {lang === 'zh' ? '推特爆款推文工坊 (Tweet Crafter)' : 'Viral Tweet Crafter'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'zh' ? '选择情绪基调，一键生成极具共鸣或嘲讽度的 Twitter/X 爆款推文。' : 'Craft high-engagement tweets tailored to this Monke’s persona.'}
                </p>
              </div>

              {/* Topic Category Selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'bullish', labelZh: '🚀 狂热看多', labelEn: '🚀 Bullish' },
                  { key: 'toxic', labelZh: '💀 毒舌战神', labelEn: '💀 Roast & Toxic' },
                  { key: 'philosophical', labelZh: '🧠 极客哲学', labelEn: '🧠 Philosophical' },
                  { key: 'meme', labelZh: '😂 神级梗图', labelEn: '😂 Meme Humor' },
                ].map((t) => {
                  const key = getTweetCacheKey(t.key);
                  const hasCache = !!tweetCache[key];
                  const isThisLoading = tweetLoadingTopic === t.key;

                  return (
                    <button
                      key={t.key}
                      onClick={() => handleSelectTweetTopic(t.key as any)}
                      className={clsx(
                        'py-2.5 px-3 rounded-2xl border text-xs font-mono font-bold transition-all truncate flex items-center justify-center gap-1.5',
                        tweetTopic === t.key
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md ring-1 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white'
                      )}
                    >
                      <span>{lang === 'zh' ? t.labelZh : t.labelEn}</span>
                      {isThisLoading && <RefreshCw className="w-2.5 h-2.5 animate-spin text-cyan-400" />}
                      {!isThisLoading && hasCache && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                    </button>
                  );
                })}
              </div>

              {/* Tweet Render Preview Box (Twitter UI Style) */}
              {isCurrentTweetLoading ? (
                <div className="p-8 text-center space-y-2 text-cyan-300 font-mono text-xs rounded-2xl bg-slate-950 border border-white/10">
                  <Zap className="w-6 h-6 mx-auto animate-bounce text-cyan-400" />
                  <p>{lang === 'zh' ? '神兽正在憋大招推文...' : 'Monke is crafting a viral tweet...'}</p>
                </div>
              ) : currentTweet ? (
                <div className="p-5 rounded-3xl bg-black border border-white/15 text-white shadow-2xl space-y-4 font-sans">
                  
                  {/* Twitter Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/20 p-0.5 overflow-hidden shrink-0">
                      <img src={getMonkeImageUrl(monkeId)} alt="" className="w-full h-full object-contain pixelated" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-sm font-bold">
                        <span>{lang === 'en' ? persona.titleEn : persona.title}</span>
                        <span className="text-cyan-400">✓</span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">@NodeMonke_{monkeId} · Web3</div>
                    </div>
                  </div>

                  {/* Tweet Content */}
                  <div className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap font-mono">
                    {currentTweet}
                  </div>

                  {/* Tweet Stats & Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs font-mono">
                    <div className="text-slate-500">
                      💬 42  🔄 128  ❤️ 1.4K
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generateSpecificTweet(tweetTopic)}
                        disabled={isCurrentTweetLoading}
                        className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white font-bold flex items-center gap-1.5 transition-all text-xs"
                      >
                        <RefreshCw className={clsx("w-3.5 h-3.5", isCurrentTweetLoading && "animate-spin")} />
                        <span>{lang === 'zh' ? '重新生成' : 'Regenerate'}</span>
                      </button>

                      <button
                        onClick={handleCopyTweet}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 transition-all"
                      >
                        {tweetCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{lang === 'zh' ? '复制推文' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={handlePostToTwitter}
                        className="py-1.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-lg shadow-sky-500/20 transition-all"
                      >
                        <Twitter className="w-3.5 h-3.5" />
                        <span>{lang === 'zh' ? '去 X 发推' : 'Post to X'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-12 space-y-2 text-slate-400 font-mono text-xs border border-dashed border-white/10 rounded-2xl">
                  <Twitter className="w-8 h-8 mx-auto text-slate-600" />
                  <p>{lang === 'zh' ? '请点击上方情绪按钮生成专属爆款推文！' : 'Click a category above to craft tweet!'}</p>
                </div>
              )}

            </div>
          )}

          {/* ================= TAB 5: ENGINE SETTINGS ================= */}
          {activeSubTab === 'settings' && (
            <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-2xl space-y-4 min-h-[502px] flex flex-col justify-between">
              
              <div>
                <h3 className="text-base font-extrabold text-white font-sans">
                  {lang === 'zh' ? 'AI 引擎与连接状态 (AI Engine Status)' : 'AI Engine & Connection Settings'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'zh' ? '默认已启用大厂免 KEY 免费公共高速通道，随时畅聊。' : 'Free zero-key public AI channel is active by default.'}
                </p>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <div className="text-xs font-mono font-bold text-emerald-300">
                      {lang === 'zh' ? '大厂免 KEY 免费公共通道：已就绪 (Active)' : 'Free Public Channel: Connected'}
                    </div>
                    <div className="text-[11px] text-emerald-500/80 font-mono">
                      {lang === 'zh' ? '多通道容灾 + 本地 0ms 离线语料双重护航' : 'Multi-tier failover & 0ms deterministic fallback ready'}
                    </div>
                  </div>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>

              {/* Custom API Key Input for Power Users */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-mono font-bold text-slate-300">
                  {lang === 'zh' ? '🧠 自定义大模型 API Key (Gemini / DeepSeek / OpenAI)' : 'Custom LLM Key (Gemini / DeepSeek / OpenAI)'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="AIza... / sk-..."
                    value={customKeyInput}
                    onChange={(e) => setCustomKeyInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleSaveSettings}
                    className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all"
                  >
                    {lang === 'zh' ? '保存' : 'Save'}
                  </button>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {lang === 'zh' ? '💡 填入免费 Google Gemini Flash 或 DeepSeek Key 即可解锁 100% 自由发挥的真实大模型即兴创作。' : '💡 Connect your Gemini or DeepSeek API Key.'}
                </div>
              </div>

              {/* DRPC Decentralized On-Chain RPC Configuration */}
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                    <span>🔗 DRPC 去中心化节点 API Key (全链高速探针)</span>
                  </label>
                  <a
                    href="https://drpc.org"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>获取免费 DRPC Key</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="dkey-..."
                    value={drpcKeyInput}
                    onChange={(e) => setDrpcKeyInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleSaveSettings}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 text-slate-950 font-mono text-xs font-bold shadow-lg transition-all"
                  >
                    {lang === 'zh' ? '激活 DRPC' : 'Activate'}
                  </button>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {lang === 'zh' ? '🚀 填入 DRPC Key 后，Agent 将直连全球分布式 RPC 节点，实时穿透扫描 Bitcoin、Ethereum、Solana 等全链数据！' : '🚀 Connects Agent directly to global distributed DRPC nodes.'}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
