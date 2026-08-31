# 🐒 NodeMonkes All-in-One Suite — 工程交接与维护文档 (HANDOFF.md)

> 本文档旨在为后续维护者、开发者与 AI 协作 Agent 提供清晰详尽的系统架构、模块拆解、数据流向、开发调试与持续部署指南。

---

## 📑 目录
1. [项目背景与 4 合 1 整合总览](#1-项目背景与-4-合-1-整合总览)
2. [技术栈与核心依赖](#2-技术栈与核心依赖)
3. [目录与代码架构](#3-目录与代码架构)
4. [四大核心功能模块详解](#4-四大核心功能模块详解)
5. [数据流、静态资源与 CDN 策略](#5-数据流静态资源与-cdn-策略)
6. [本地开发与构建调试](#6-本地开发与构建调试)
7. [CI/CD 自动化构建与 GitHub Pages 部署](#7-cicd-自动化构建与-github-pages-部署)
8. [常见问题排查与日常维护 (Troubleshooting)](#8-常见问题排查与日常维护-troubleshooting)
9. [未来演进建议 (Roadmap)](#9-未来演进建议-roadmap)

---

## 1. 项目背景与 4 合 1 整合总览

**NodeMonkes** 是比特币 Ordinals 生态的顶级 10,000 像素头像艺术系列。此前，社区工具分散在 4 个独立的 GitHub 仓库中，各自为政，UI 简陋且缺乏联动。

本项目将这 4 个独立系统重构并合并为一个**统一架构、极高流畅度、暗黑赛博毛玻璃 UI 的单页应用（SPA）**：

| 原独立仓库 | 对应功能模块 | 迁移与整合实现 |
| :--- | :--- | :--- |
| `supercrypto1984/nodemonkes-browser` | **🔍 1. Explorer (主浏览器)** | 10,000 数据多维筛选、网格 (Grid) / 表格 (Table) 双视图秒切、稀有度彩色发光胶囊、Script PubKey 一键复制、详情弹窗。 |
| `supercrypto1984/nodemonkes-gif` | **🎬 2. GIF Studio (动态工坊)** | 100% 还原原版 Upper/Lower 分层 36 帧正弦插值独立点头与形变动效，支持普通款与 Santa 圣诞款双模式切换，自动匹配肤色底色、透明背景、Web Worker 多线程 GIF 渲染导出。 |
| `supercrypto1984/diynm` | **🎨 3. DIY Studio (捏猴工坊)** | 100% 继承官方原版全部 5 大系列（Normal、Dog、Block、Rabbit、Peer）全部真实 R2 资产图层，支持 Body, Earring, Eyes, Head 自由组合、一键随机 (🎲 随机搭配)、自选底色与 600px 高清无损 PNG 导出。 |
| `supercrypto1984/santa-nodemonkes` | **🎅 4. Santa Monkes (圣诞限定)** | 10,000 圣诞帽全集画廊、自定义节日色盘、多分辨率（280px / 560px / 1120px 4K）头像一键生成与下载。 |

---

## 2. 技术栈与核心依赖

| 类别 | 选用技术 | 版本 / 说明 | 选型优势 |
| :--- | :--- | :--- | :--- |
| **基础框架** | `React` + `TypeScript` | `React 18.3.1` / `TS 5.4.5` | 严格类型约束，组件高度模块化 |
| **构建工具** | `Vite` | `Vite 5.2.11` | 秒级 HMR 启动，打包体积极小（生产包 ~60KB） |
| **样式系统** | `Tailwind CSS` | `v3.4.4` | 原子化 CSS，无运行时开销，暗黑赛博风格深度定制 |
| **图标库** | `lucide-react` | `v0.344.0` | 现代轻量矢量图标，按需 Tree-shaking |
| **动态动图引擎** | `gif.js` + Web Worker | Worker 托管于 `/public/gif.worker.js` | 纯客户端离线生成 GIF，不占用服务器，不卡顿主线程 |

---

## 3. 目录与代码架构

```text
nodemonkes-suite/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自动化构建部署至 GitHub Pages
├── public/
│   └── gif.worker.js           # GIF.js 后台多线程 Worker 脚本
├── src/
│   ├── components/
│   │   ├── diy/
│   │   │   └── DiyStudio.tsx   # 原版 5 大系列真实 R2 图层换装与画布导出
│   │   ├── explorer/
│   │   │   ├── MonkeDetailModal.tsx # 节点猴大图、全属性、色板与链上公钥详情弹窗
│   │   │   └── MonkesExplorer.tsx   # 主画廊/数据表、筛选器、排序与分页组件
│   │   ├── gif/
│   │   │   └── GifStudio.tsx   # 原版 Upper/Lower 36 帧动画、调色盘与导出控制器
│   │   ├── layout/
│   │   │   ├── Navbar.tsx      # 顶部响应式导航栏、Tab 切换与全站快捷搜索
│   │   │   └── Footer.tsx      # 底部版权与 Web3 外部生态链接
│   │   ├── santa/
│   │   │   └── SantaStudio.tsx # 圣诞限定版画廊、色盘与多分辨率下载器
│   │   └── ui/
│   │       ├── Badge.tsx       # 稀有度百分比自适应发光胶囊
│   │       └── Toast.tsx       # 全局轻量通知提示系统
│   ├── types/
│   │   └── index.ts            # 全局 TypeScript 接口定义 (Monke, Attributes, Tabs)
│   ├── utils/
│   │   ├── api.ts              # 元数据拉取 (带内存缓存) 与色板提取
│   │   ├── constants.ts        # 33 种 Body 肤色、动画参数、CDN 地址与预置色盘
│   │   └── gifEngine.ts        # Canvas Upper/Lower 帧插值计算与 GIF 生成器核心
│   ├── App.tsx                 # 根组件：全局状态管理、URL Query 同步与模块路由
│   ├── index.css               # Tailwind 注入、毛玻璃面板与像素渲染配置
│   └── main.tsx                # React 18 入口挂载
├── .gitignore
├── HANDOFF.md                  # 本工程交接维护文档
├── index.html                  # 宿主 HTML (配置字体、描述与像素图标)
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 4. 四大核心功能模块详解

### 4.1 🔍 Explorer（节点猴浏览器与稀有度大盘）
- **文件路径**：`src/components/explorer/MonkesExplorer.tsx`
- **核心逻辑**：
  - **搜索索引**：支持按数字 ID（1-10000）、铭文编号（`inscription`）、身体/头部属性进行大小写不敏感的实时模糊匹配。
  - **排序引擎**：支持按 `Rank (稀有度排名)`、`ID`、`Inscription #`、`Block Height` 正序/倒序排列。
  - **双视图秒切**：
    - `Grid View`：卡片式流式布局，自适应响应式（移动端 2 列，桌面 4~6 列），悬停放大动效；
    - `Table View`：高密度数据表，Script PubKey 自动截断并提供一键复制与已复制状态反馈。
  - **模块联动**：在详情弹窗中点击任意 Monke，可直接一键将当前 Monke ID 传参至 GIF 工坊或 Santa 模块。

### 4.2 🎬 GIF Studio（动态 GIF 工坊）
- **文件路径**：`src/components/gif/GifStudio.tsx` + `src/utils/gifEngine.ts`
- **真实分层动效原理**：
  - **Upper/Lower 分离资源**：从原版 R2 读取预切片的 `upperbody/${id}.png` 和 `lowerbody/${id}.png`；
  - **36 帧正弦插值算法**：
    - `lowerImg` 进行微挤压形变（`scaleY = 1 - smoothCompression`, `scaleX = 1 + smoothCompression * 0.2`）；
    - `upperImg` 围绕动态轴心（抬起时以 `raisePivotX = 3/7 * size` 旋转，下压时以 `insertionAngle` 下沉插入）。
  - **双模式支持**：支持 Normal 原版与 Santa 圣诞版一键切换；
  - **背景模式**：`Transparent (透明)`、`Auto (自动匹配官方皮肤底色)`、`Custom (自定义色盘)`。

### 4.3 🎨 DIY Studio（节点猴 5 大系列原版换装）
- **文件路径**：`src/components/diy/DiyStudio.tsx`
- **真实 R2 资产架构**：
  - 支持原版 5 大系列：
    1. `Normal`：`https://pub-2f0821e8464b4c139f681d763393f4ee.r2.dev`
    2. `Dog`：`https://pub-4d8b3f7049bb4025a6642c75eeb71c46.r2.dev`
    3. `Block`：`https://pub-d7a7a960d42949efb84bea391aa90d4c.r2.dev`
    4. `Rabbit`：`https://pub-e50795db8d0d41dd942f04a8b290f95f.r2.dev`
    5. `Peer`：`https://pub-026e5fdeaab545cc9c5aa34738735770.r2.dev`
  - 自动从 `metadata.json` 提取所有官方组件清单（Body, Earring, Eyes, Head）；
  - 图层按 `Background → Body → Earring → Eyes → Head` 严格次序合成；
  - **🎲 随机搭配 (Randomize)** 与 **💾 保存头像 (Save Avatar)**（600px 高清无损 PNG 导出）。

### 4.4 🎅 Santa Monkes（圣诞限定款画廊）
- **文件路径**：`src/components/santa/SantaStudio.tsx`
- **核心逻辑**：
  - 访问官方 10,000 张圣诞帽合成图库；
  - 支持更换背景色、切换 `280px / 560px / 1120px` 三档分辨率并导出。

---

## 5. 数据流、静态资源与 CDN 策略

1. **元数据（Metadata）**：
   - 数据源：`https://pub-ce8a03b190984a3d99332e13b7d5e3cb.r2.dev/transformed_metadata.json` 与 `metadata.json`
   - 首次加载后自动存入内存缓存，全应用跨 Tab 切换不产生二次网络请求。
2. **GIF 分层图片源**：
   - 普通款：`https://pub-b4dd93b94d3b4b3a93fa599c57a78615.r2.dev/upperbody/{id}.png` 及 `lowerbody/{id}.png`
   - 圣诞款：`https://pub-048d93bb0a5a448783aecb63c784ccbf.r2.dev/santaupperbody/{id}.png` 及 `santalowerbody/{id}.png`
3. **DIY 5 大系列图层源**：
   - 统一走 Cloudflare R2 高速全球边缘节点。

---

## 6. 本地开发与构建调试

```bash
# 1. 安装依赖
npm install

# 2. 启动本地开发服务器
npm run dev

# 3. 生产编译打包 (TypeScript 严格检查)
npm run build

# 4. 本地预览生产构建产物
npm run preview
```

---

## 7. CI/CD 自动化构建与 GitHub Pages 部署

本项目在 `.github/workflows/deploy.yml` 中配置了 GitHub Actions 自动化工作流：
- **部署触发**：向 `main` 分支执行 `git push` 时自动触发构建并发布到 GitHub Pages。
- **线上地址**：`https://peers-max.github.io/nodemonkes-suite/`
