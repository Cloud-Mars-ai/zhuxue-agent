# AGENTS.md

本仓库是「人机协同助学智能体」前端（Vue 3.5 + Vite 8 + Pinia + Element Plus/Vant），纯前端演示项目，无后端。

**接手前先读 `Codex交接文档.md`**（全貌、进展、待办、风险、地址、上手清单），重点是 §6「HyperKnow 参照基线」。

## 第一优先任务：从帧重建 HyperKnow 参照

1. **不要直接采信已有报告**。`HyperKnow*.md` 是二手线索，没有帧号、没有差异表。
2. **自己看帧**：`video-analysis/frames/f_001–f_113.jpg` 建地图，再用 `frames1/s_001–s_453.jpg` 细读（**帧号≈秒数**，`s_430` = 7:10）。≥40 条带帧号观察、≥8 张并排对比图。
3. **产出落在 `docs/research/hyperknow-frame-review.md`**（已有模板 + 5 条已验证锚点：s_045 / s_120 / s_200 / s_300 / s_430）。
4. **再据此改设计与功能**：形态对照表 → 改哪个文件；动线对照表 → 步数差；取舍结论表 → 必须写理由。
5. 仿的是**形态 + 范式**（白板讲解、先测后讲、资料第一、每日推荐），**不仿品牌层**（logo/文案/插图/命名），不做课程集市、积分、Craft Course、语音主流程。

## 硬规则（违反会直接坏掉演示）

1. **推送只用 `mygithub`**（`Cloud-Mars-ai/zhuxue-agent`）。`origin` 指向 `yunwenshuai/zhuxue-agent`，无写权限。
2. **新增页面必须同步 `frontend/src/router/index.js` 的 `WEB_TO_MOBILE`**，否则手机端被设备守卫弹回首页；同时在 `layouts/WebLayout.vue` 的 `GROUP_OF` 补分组。
3. **构建是相对 base（`base: './'`）**。验证深链接必须 `npm run build && node server.mjs`（4173），不要用 `vite preview` 或纯静态托管代替。
4. **UI 基调是浅色纸感 + 浅色夜读**（`yun` / `mo`）。深色皮肤已于 2026-11-03 删除，不要恢复。
5. 颜色/圆角/字体只走 `src/theme/tokens.css` 语义变量，页面内不写死色值。
6. AI 功能一律带本地确定性兜底（`flags.offlineFallback`），失败时标「演示缓存」。
7. 模型只输出 `chunkId`，页码由前端回填，禁止让模型写页码。
8. 板书只做**结构化 block 渲染**（AI 填 JSON，前端渲染），不做自由画布。

## 常用命令

```bash
cd frontend
npm install          # node_modules 已存在，228MB，可跳过
npm run dev          # 5173
npm run build        # 2–3s，chunk 体积警告属既有问题
npm start            # build + node server.mjs（4173，深链接验证用）
npm run build:offline# 单文件离线版
```

演示账号：`student` / `student2` / `ta` / `teacher` / `admin`，密码均 `123456`。

## 待处理最高优先级

- `src/stores/model.js` 内硬编码的阶跃星辰 API Key 已泄露到公开仓库，需轮换并移除（须项目负责人操作）。
- 真实模型链路未系统验收，`docs/release/EVIDENCE-TEMPLATE.md` 仍为空模板。
- E2E 脚本已丢失（`.playwright-cli/` 仅剩 3 个零散脚本），回归基线需重建。
