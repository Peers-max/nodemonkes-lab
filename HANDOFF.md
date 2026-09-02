# NodeMonkes Lab — AI Agent & Suite Version Handoff Document

> **版本定位**：v1.1.0-agent (含 10,000 神兽专属 ReAct AI 智能体宇宙 + 现代拖拽导航栏 + 像素对齐)  
> **更新时间**：2026-09-02  
> **Git 仓库**：`https://github.com/Peers-max/nodemonkes-lab.git`

---

## 📋 本次迭代核心功能概览

1. **神兽专属 AI 智能体宇宙 (`/components/agent`)**：
   - **ReAct 认知架构**：结合链上 Trait 派生 5 维性格（战力、信仰、毒舌、智商、幽默），支持思考链（Chain-of-Thought）展开与探针调用。
   - **链上实时工具链**：集成 Mempool 实时 Gas、SatFlow 地板价与交易统计、神兽稀有度扫描、DRPC 去中心化全链 RPC 探针。
   - **全场景 100% 纯模型即时生成**：
     - **💬 实时心声对话**：自然多轮问答，结合真实链上数据与性格特征回复。
     - **📰 每日链上日记**：第一人称视角的链上见闻、心情与思考生成。
     - **🐦 推特爆款文案**：4 种独立情绪基调（狂热看多、毒舌战神、极客哲学、神级梗图），支持独立缓存与单点无冲突「重新生成」。
   - **大模型引擎接入**：
     - 默认内置 **硅基流动 (SiliconFlow) DeepSeek R1 深度推理模型**（`deepseek-ai/DeepSeek-R1-0528-Qwen3-8B`，含 `THUDM/GLM-Z1-9B-0414` 与 `Qwen2.5-7B` 自动容灾备用）；
     - 支持在「⚙️ 引擎设置」中填入自定义 Google Gemini Flash (`AIza...`) 或官方 DeepSeek R1 满血版 (`sk-...`) 进行无缝覆盖。

2. **现代横向拖拽滑动导航栏 (Draggable Navbar)**：
   - 支持桌面端鼠标按住抓取平滑滑动（`grab` / `grabbing`），移动端手势滑屏与滚轮横向响应；
   - 左右边缘动态渐变遮罩与微型辅助滚动按钮；
   - 「神兽 AI 智能体」标签紧邻放置于「圣诞版」右侧。

3. **视口稳定性与像素对齐**：
   - 彻底移除触发全屏视口跳动的 `scrollIntoView()`，限制消息滚动在聊天框内部；
   - 精确计算右侧工作区与左侧神兽名片卡片的底部高度（`502px`），实现 **0px 垂直水平基准平齐**。

---

## 🔑 现行 API 接口与密钥清单 (交接专用 · 免反复询问)

| 服务名称 | 接入地址 (Endpoint) | API Key / 凭据 | 默认模型 / 参数 | 用途说明 | 代码引用文件 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **硅基流动 (SiliconFlow)** | `https://api.siliconflow.cn/v1/chat/completions` | `sk-crtlkliqnbbbzhisstlwdwmqegasipwdgghrekgvhrkddion` | `deepseek-ai/DeepSeek-R1-0528-Qwen3-8B`<br>*(备用: THUDM/GLM-Z1-9B-0414, Qwen2.5-7B)* | 核心免费无限量 DeepSeek R1 深度推理大模型引擎（心声对话、日记、推特生成） | [`src/components/agent/aiClient.ts`](file:///c:/Users/cai/Documents/antigravity/wise-hertz/nodemonkes-lab/src/components/agent/aiClient.ts) |
| **DRPC 全链去中心化 RPC** | `https://lb.drpc.org/ogrpc?network={network}&dkey=...` | `AifCUrEbwEL6kh1531Q6rUrsP_6co1YR8bNemp9cv0wK` | 支持 `bitcoin`, `ethereum`, `base`, `arbitrum`, `polygon` | 智能体链上探针：查询实时区块高度、钱包余额、Gas 与链上状态 | [`src/components/agent/drpcClient.ts`](file:///c:/Users/cai/Documents/antigravity/wise-hertz/nodemonkes-lab/src/components/agent/drpcClient.ts) |
| **SatFlow Ordinals 行情** | `https://backend.satflow.com/trpc/collectionStats.collectionMemflow,collections.get` | 公共免 Key | 集合标识: `nodemonkes` | 实时抓取 NodeMonkes 官方主网地板价（BTC & Sats）、交易量与挂单数 | [`src/components/agent/agentHarness.ts`](file:///c:/Users/cai/Documents/antigravity/wise-hertz/nodemonkes-lab/src/components/agent/agentHarness.ts) |
| **Mempool.space BTC 探针** | `https://mempool.space/api/v1/fees/recommended`<br>`https://mempool.space/api/blocks/tip/height` | 公共免 Key | 纯 REST 响应 | 实时抓取比特币 L1 最速手续费、半小时确认费率及当前区块高度 | [`src/components/agent/agentHarness.ts`](file:///c:/Users/cai/Documents/antigravity/wise-hertz/nodemonkes-lab/src/components/agent/agentHarness.ts) |
| **Binance / 现货行情** | `https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT` | 公共免 Key | 交易对: `BTCUSDT` | 实时获取比特币法币美元价格与 24 小时涨跌幅 | [`src/components/agent/agentHarness.ts`](file:///c:/Users/cai/Documents/antigravity/wise-hertz/nodemonkes-lab/src/components/agent/agentHarness.ts) |
| **Cloudflare Workers AI (备用)** | `https://nodemonkes-ai.superjohnson1984.workers.dev/api/ai/chat` | CF Worker Gateway | `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` | 备用网关通道与跨域 SatFlow 代理 | [`cf-ai-worker/worker.js`](file:///c:/Users/cai/Documents/antigravity/wise-hertz/nodemonkes-lab/cf-ai-worker/worker.js) |

---

## 🗂️ 文件目录结构清单 (AI 模块相关)

```text
nodemonkes-lab/
├── HANDOFF.md                          # 本交接文档
├── cf-ai-worker/                       # Cloudflare Workers AI 部署脚本与网关配置
│   ├── worker.js                       # Workers AI 路由与 SatFlow 代理
│   └── wrangler.toml                   # Cloudflare 绑定配置
├── src/
│   ├── components/
│   │   ├── agent/                      # 💡 [AI 智能体核心模块 - 全部自包含]
│   │   │   ├── MonkeAgentStudio.tsx    # 智能体主界面（名片、对话、日记、推特、设置）
│   │   │   ├── agentHarness.ts         # ReAct Harness 循环、工具链执行与思维链调度
│   │   │   ├── aiClient.ts             # 大模型分发器（DeepSeek R1 / Gemini / Workers AI）
│   │   │   ├── drpcClient.ts           # DRPC 官方去中心化链上 RPC 查询客户端
│   │   │   └── personaEngine.ts        # 链上 Trait -> 5维性格与角色 Prompt 派生引擎
│   │   └── layout/
│   │       └── Navbar.tsx              # 导航栏组件 (含 agent tab 与拖拽交互)
│   ├── types/
│   │   └── index.ts                    # 类型定义 (TabType 包含 'agent')
│   ├── utils/
│   │   └── i18n.tsx                    # 多语言国际化字典 (包含 AI 相关文案)
│   └── App.tsx                         # 根路由与选项卡渲染挂载
```

---

## ✂️ 极简移除 / 隐藏 AI 模块指南 (1分钟干净下线)

若后续因大模型不可控因素需要**彻底下线或暂时隐藏 AI 板块**，仅需修改 3 个文件（无任何残留影响）：

### 步骤 1：从 `src/types/index.ts` 中移除 `'agent'`
```typescript
// 修改前：
export type TabType = 'explorer' | 'gif' | 'diy' | 'santa' | 'agent' | 'poster' | 'passport' | 'arcade';

// 修改后：
export type TabType = 'explorer' | 'gif' | 'diy' | 'santa' | 'poster' | 'passport' | 'arcade';
```

### 步骤 2：从 `src/components/layout/Navbar.tsx` 中移除导航项
删除 `tabs` 数组中的这一行：
```typescript
{ id: 'agent' as TabType, label: t.tabAgent, icon: Bot, badge: 'AI' },
```

### 步骤 3：从 `src/App.tsx` 中移除组件引入与渲染
1. 移除头部引入：
   ```typescript
   // 删除这行：
   import { MonkeAgentStudio } from './components/agent/MonkeAgentStudio';
   ```
2. 移除条件渲染区块：
   ```tsx
   // 删除这行：
   {activeTab === 'agent' && <MonkeAgentStudio monkes={monkes} initialMonkeId={targetMonkeId} onToast={addToast} />}
   ```

### 步骤 4（可选）：删除目录
直接删除 `src/components/agent/` 和 `cf-ai-worker/` 即可，其他 7 大功能模块（全量图库、GIF工坊、DIY、圣诞版、海报工坊、3D通行证、像素游戏）100% 独立运行不受任何影响。

---

## 🚀 启动与构建验证

```bash
# 启动本地开发服务器
npm run dev

# 生产环境打包构建
npm run build
```
验证构建产物：`dist/` 目录可直接部署至 Cloudflare Pages、Vercel、GitHub Pages 或纯静态服务器。
