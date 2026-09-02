import { PersonaProfile, getSystemPrompt } from './personaEngine';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  traces?: any[];
  usedTools?: string[];
}

export interface AIProviderConfig {
  provider: 'free_public' | 'custom_gemini' | 'custom_openai' | 'custom_deepseek';
  apiKey?: string;
  customEndpoint?: string;
}

const LOCAL_STORAGE_CONFIG_KEY = 'nodemonkes_ai_config';

export const getAIConfig = (): AIProviderConfig => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to read AI config from localStorage', e);
  }
  return { provider: 'free_public' };
};

export const saveAIConfig = (config: AIProviderConfig) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save AI config', e);
  }
};

// Built-in SiliconFlow DeepSeek R1 Model & API Key (100% Free Unlimited Live R1 Engine)
const DEFAULT_BUILTIN_API_KEY = 'sk-crtlkliqnbbbzhisstlwdwmqegasipwdgghrekgvhrkddion';

// Default Cloudflare Workers AI Gateway URL
const DEFAULT_CF_WORKER_AI_URL = 'https://nodemonkes-ai.superjohnson1984.workers.dev/api/ai/chat';

// Token-by-Token Streaming Helper for natural typewriter effect
export const streamTextChunkByChunk = async (
  fullText: string,
  onChunk: (currentText: string) => void,
  chunkDelayMs = 20
) => {
  let displayed = '';
  for (let i = 0; i < fullText.length; i += 2) {
    displayed += fullText.slice(i, i + 2);
    onChunk(displayed);
    await new Promise((r) => setTimeout(r, chunkDelayMs));
  }
};

// Pure Dynamic Real-Time LLM Dispatcher
export const callMonkeAI = async (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  persona: PersonaProfile,
  lang: 'zh' | 'en' = 'zh'
): Promise<string> => {
  const config = getAIConfig();
  const systemPrompt = getSystemPrompt(persona, lang);

  // Active Key: User's custom Key OR built-in DeepSeek R1 Key
  const activeKey = (config.apiKey && config.apiKey.trim().length > 0) 
    ? config.apiKey.trim() 
    : DEFAULT_BUILTIN_API_KEY;

  if (activeKey && activeKey.trim().length > 0) {
    const key = activeKey.trim();
    
    // Gemini 1.5/2.0 Flash API Direct
    if (key.startsWith('AIza')) {
      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
        const geminiRes = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: messages.map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            })),
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 1500,
            }
          }),
        });

        if (geminiRes.ok) {
          const gData = await geminiRes.json();
          const gReply = gData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (gReply && gReply.trim().length > 0) {
            return cleanAIReply(gReply);
          }
        } else {
          const errData = await geminiRes.json().catch(() => ({}));
          console.error('Gemini API Error:', errData);
          throw new Error(errData.error?.message || `Gemini API returned status ${geminiRes.status}`);
        }
      } catch (err: any) {
        console.error('Gemini API call error', err);
        throw err;
      }
    } else {
      // SiliconFlow (硅基流动) / DeepSeek R1 / OpenAI API Direct
      try {
        let endpoint = config.customEndpoint;
        let modelName = 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B';

        if (!endpoint) {
          if (key.length > 40) {
            // SiliconFlow (硅基流动 免费 R1 模型)
            endpoint = 'https://api.siliconflow.cn/v1/chat/completions';
            modelName = 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B';
          } else if (key.startsWith('sk-')) {
            // DeepSeek 官方
            endpoint = 'https://api.deepseek.com/v1/chat/completions';
            modelName = 'deepseek-reasoner';
          } else {
            endpoint = 'https://api.openai.com/v1/chat/completions';
            modelName = 'gpt-4o-mini';
          }
        }

        const isDeepSeekReasoner = modelName === 'deepseek-reasoner';

        const payload: any = {
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
        };

        if (!isDeepSeekReasoner) {
          payload.temperature = 0.7;
          payload.max_tokens = 1500;
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          const choice = data.choices?.[0]?.message;
          const reply = choice?.content || choice?.reasoning_content;
          if (reply) {
            return cleanAIReply(reply);
          }
        } else {
          // Failover to SiliconFlow free secondary models if needed
          if (endpoint.includes('siliconflow')) {
            const fallbackModels = ['THUDM/GLM-Z1-9B-0414', 'Qwen/Qwen2.5-7B-Instruct'];
            for (const fbModel of fallbackModels) {
              try {
                payload.model = fbModel;
                const fbRes = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`,
                  },
                  body: JSON.stringify(payload),
                });
                if (fbRes.ok) {
                  const fbData = await fbRes.json();
                  const fbChoice = fbData.choices?.[0]?.message;
                  const fbReply = fbChoice?.content || fbChoice?.reasoning_content;
                  if (fbReply) return cleanAIReply(fbReply);
                }
              } catch (e) {}
            }
          }

          const errData = await res.json().catch(() => ({}));
          console.error('API Error:', errData);
          throw new Error(errData.message || errData.error?.message || `API returned status ${res.status}`);
        }
      } catch (err: any) {
        console.error('LLM API call error', err);
        throw err;
      }
    }
  }

  // Tier 2: Cloudflare Workers AI Gateway (DeepSeek R1 & Llama 3.3 24/7)
  try {
    const cfUrl = config.customEndpoint || DEFAULT_CF_WORKER_AI_URL;
    const cfRes = await fetch(cfUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        model: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
        temperature: 0.7,
      }),
    });

    if (cfRes.ok) {
      const cfData = await cfRes.json();
      if (cfData.success && cfData.reply) {
        return cleanAIReply(cfData.reply);
      } else if (cfData.error) {
        console.warn('Cloudflare Workers AI:', cfData.error);
      }
    }
  } catch (cfErr) {
    console.warn('Cloudflare Workers AI Gateway unreachable', cfErr);
  }

  // Notice when no API is reachable
  const noticeZh = '【大模型服务未连通】请点击右上角「⚙️ 引擎设置」填入您的 DeepSeek 或 Google Gemini API Key，即可开启与神兽的 100% 实时原生大模型对话与推文创作！';
  const noticeEn = '[Notice] AI Model offline. Please configure your DeepSeek or Google Gemini API Key in "⚙️ Settings" to enable 100% real-time model generation!';
  return lang === 'en' ? noticeEn : noticeZh;
};

// Robust Sanitizer to eliminate DeepSeek <think> reasoning tags and repeating glitch loops
export const cleanAIReply = (raw: string): string => {
  if (!raw) return '';
  let cleaned = raw;

  // 1. Remove complete <think>...</think> reasoning blocks
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. If <think> was opened but never closed (e.g. token cutoff during reasoning), strip everything after <think>
  if (cleaned.includes('<think>')) {
    cleaned = cleaned.replace(/<think>[\s\S]*/gi, '').trim();
  }

  // 3. Detect and truncate repeating character glitches (e.g. 叕叕叕... loops in LLM outputs)
  cleaned = cleaned.replace(/(.)\1{8,}/g, '$1$1$1').trim();

  // 4. Remove enclosing markdown code fence wrappers if present
  cleaned = cleaned.replace(/^```[a-z]*\n?/gi, '').replace(/\n?```$/gi, '').trim();

  return cleaned;
};

// Generate Daily On-Chain Monke Journal via Real Cloudflare / Custom DeepSeek / Gemini Model
export const generateDailyJournal = async (
  persona: PersonaProfile,
  dateStr: string = new Date().toLocaleDateString(),
  lang: 'zh' | 'en' = 'zh'
): Promise<{ title: string; date: string; content: string; mood: string }> => {
  const prompt = lang === 'en'
    ? `Write an engaging Web3 daily diary as NodeMonkes #${persona.monkeId} (${persona.temperamentEn}) for ${dateStr}.
Requirements:
1. First line: attractive title in brackets;
2. Body: 120-200 words reflecting your personality, discussing Bitcoin, Mempool, or Ordinals;
3. End with a mood tag (e.g. [Mood: 🔥 Ultra Bullish]);
4. Reply in fluent English.`
    : `请以 NodeMonkes #${persona.monkeId}（【${persona.title}】· 性格：${persona.temperament}）的第一人称，写一篇真实的 Web3 链上日记（日期：${dateStr}）。
要求：
1. 第一行以【标题】开头；
2. 正文 150~250 字，自然体现你的性格风格，记录你今天在比特币网络、Mempool 或 Ordinals 社区的所见所想；
3. 文末附上心情标签（如：【心情：🔥 狂暴看多】）；
4. 语言流畅自然，使用中文。`;

  const messages = [{ role: 'user' as const, content: prompt }];
  const rawText = await callMonkeAI(messages, persona, lang);
  const cleaned = cleanAIReply(rawText);
  
  const lines = cleaned.split('\n').filter(l => l.trim().length > 0);
  let title = lines[0]?.replace(/^[#*【\[\s]+|[】\]*\s]+$/g, '').trim() || (lang === 'en' ? `${persona.titleEn}'s Daily Hash` : `${persona.title} 的链上日常`);
  if (title.length > 35) title = lang === 'en' ? `${persona.titleEn}'s Daily Hash` : `${persona.title} 的链上日常`;
  const body = lines.slice(1).join('\n\n') || cleaned;

  const defaultMood = lang === 'en'
    ? (persona.stats.faith > 80 ? '🔥 Ultra Bullish' : persona.stats.humor > 70 ? '😂 Pure Meme Energy' : persona.stats.toxicity > 70 ? '💀 Savage Roast' : '👑 Sovereign King')
    : (persona.stats.faith > 80 ? '🔥 狂暴看多' : persona.stats.humor > 70 ? '😂 玩梗整活' : persona.stats.toxicity > 70 ? '💀 毒舌觉醒' : '👑 唯我独尊');

  return {
    title,
    date: dateStr,
    content: body,
    mood: defaultMood,
  };
};

// Generate High-Engagement Twitter / X Tweet via Real Cloudflare / Custom DeepSeek / Gemini Model
export const generateTweet = async (
  persona: PersonaProfile,
  topicType: 'bullish' | 'toxic' | 'philosophical' | 'meme',
  lang: 'zh' | 'en' = 'zh'
): Promise<string> => {
  const topicPromptsZh = {
    bullish: '写一条看多比特币主网与 NodeMonkes 头部共识的 Twitter (X) 爆款推文，富有社区感染力与激情！',
    toxic: '写一条犀利吐槽、嘲讽踏空者、投机客和空气币的 Twitter (X) 战神推文，言辞辛辣幽默！',
    philosophical: '写一条关于时间、算力、抗通胀与不可篡改链上艺术的极客哲学思考推文！',
    meme: '写一条充满 Web3 梗、幽默笑点与反转的推特神梗推文！',
  };

  const topicPromptsEn = {
    bullish: 'Write a viral, high-conviction Twitter/X tweet celebrating Bitcoin L1 sovereignty and NodeMonkes consensus.',
    toxic: 'Write a sharp, witty, savagely humorous crypto Twitter/X tweet roasting paper hands, sideline watchers, and shitcoins.',
    philosophical: 'Write a profound Web3 philosophical tweet exploring hashrate, digital scarcity, and immutable on-chain art.',
    meme: 'Write a hilarious Web3 Twitter/X tweet with iconic crypto memes and witty humor.',
  };

  const prompt = lang === 'en'
    ? `As NodeMonkes #${persona.monkeId} [${persona.titleEn}] (${persona.temperamentEn}), ${topicPromptsEn[topicType]}
Requirements:
1. 80~150 words in natural Twitter format;
2. Include hashtags like #NodeMonkes #Bitcoin #Ordinals #WAGMI at the end;
3. Reply in fluent English.`
    : `请以 NodeMonkes #${persona.monkeId}（【${persona.title}】· 性格：${persona.temperament}）的第一人称，${topicPromptsZh[topicType]}
要求：
1. 长度 100~180 字，排版自然，有推特张力；
2. 文末附上相关标签（如 #NodeMonkes #Bitcoin #Ordinals #WAGMI 等）；
3. 语言地道生动，使用中文。`;

  const messages = [{ role: 'user' as const, content: prompt }];
  const rawText = await callMonkeAI(messages, persona, lang);
  return cleanAIReply(rawText);
};
