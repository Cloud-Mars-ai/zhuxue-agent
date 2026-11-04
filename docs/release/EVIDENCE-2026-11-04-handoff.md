# 发布证据：2026-11-04 交接版

```json
{
  "version": "hyperknow-handoff-core",
  "date": "2026-11-04",
  "scope": "P0 交接基线 + 统一入口/结构化板书/板书内追问垂直切片",
  "changes": [
    "重建 HyperKnow 逐帧证据：51 条帧级观察、16 条交互状态、8 组并排对比",
    "新增 Web/H5 结构化板书与确定性 fallback",
    "首页一体化材料区、双学习模式、文件选择与浏览器内正文抽取",
    "统一工具菜单、双端路由与导航映射",
    "接入 Step 5 Preview 与 StepAudio 3 TTS，并在 AI 回答中提供朗读",
    "无模型时一人一题、自测、速查表、考核可从 UI 进入演示兜底",
    "新增 10 条 Playwright 关键链路回归"
  ],
  "verified": [
    "npm run build 通过，仅保留既有大 chunk 警告",
    "13 条确定性 Playwright E2E 全部通过",
    "3 条真实 StepFun E2E 全部通过：Step 5 Preview 对话、StepAudio 3 TTS、Step 5 结构化板书",
    "npm audit --omit=dev：0 个已知漏洞",
    "生产服务器 4173 支持 /app/board 直接访问与刷新",
    "H5 /m/board 可渲染 6 个板书 block 并打开讨论面板",
    "板书 A/B 追问进入右栏，回复标记为演示缓存",
    "教学大纲卡可选择文件；TXT/Markdown/PDF 正文提取后进入知识库",
    "按负责人要求临时内置文本与语音密钥，接口均返回成功"
  ],
  "unverified": [
    "黄金题库真实模型抽测与评分",
    "扫描版 PDF OCR、旧版 .doc/.ppt 和复杂版式 PPTX 质量验收",
    "iOS Safari 打印预览",
    "公网 WorkBuddy 链接更新"
  ],
  "knownRisks": [
    "Step 5 与 StepAudio 密钥当前会被打入公开前端构建，迁移前必须轮换；旧 Key 历史也需清理",
    "板书真实模型 JSON 稳定性尚未做多轮抽测",
    "学习计划、页码级引用、自动跟随当前 block 尚未实现",
    "Element Plus 与 ECharts 主 chunk 仍超过 500KB"
  ],
  "rollback": "Git tag v0.5-baseline 指向接手前 8552214",
  "evidence": [
    "docs/research/hyperknow-frame-review.md",
    "docs/research/comparisons/",
    "frontend/tests/e2e/critical-flows.spec.js"
  ]
}
```
