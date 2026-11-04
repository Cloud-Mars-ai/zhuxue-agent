# 发布证据：2026-11-04 交接版

```json
{
  "version": "hyperknow-handoff-core",
  "date": "2026-11-04",
  "scope": "P0 交接基线 + 统一入口/结构化板书/板书内追问垂直切片",
  "changes": [
    "重建 HyperKnow 逐帧证据：51 条帧级观察、16 条交互状态、8 组并排对比",
    "新增 Web/H5 结构化板书与确定性 fallback",
    "首页统一工具菜单、双端路由与导航映射",
    "无模型时一人一题、自测、速查表、考核可从 UI 进入演示兜底",
    "新增 10 条 Playwright 关键链路回归"
  ],
  "verified": [
    "npm run build 通过，仅保留既有大 chunk 警告",
    "10 条 Playwright E2E 全部通过",
    "生产服务器 4173 支持 /app/board 直接访问与刷新",
    "H5 /m/board 可渲染 6 个板书 block 并打开讨论面板",
    "板书 A/B 追问进入右栏，回复标记为演示缓存",
    "源码扫描无非空硬编码 apiKey"
  ],
  "unverified": [
    "真实阶跃星辰调用：本轮没有可用且已轮换的模型密钥",
    "黄金题库真实模型抽测与评分",
    "PDF/PPT 材料抽取",
    "iOS Safari 打印预览",
    "公网 WorkBuddy 链接更新"
  ],
  "knownRisks": [
    "旧 API Key 仍在历史提交中，必须由负责人在服务商侧轮换",
    "板书真实模型 JSON 稳定性尚未做多轮抽测",
    "学习计划、页码级引用、自动跟随当前 block 尚未实现",
    "Element Plus 与 ECharts 主 chunk 仍超过 500KB",
    "npm audit --omit=dev 报告 axios -> follow-redirects 的 2 个 high 风险，当前无可用修复版本"
  ],
  "rollback": "Git tag v0.5-baseline 指向接手前 8552214",
  "evidence": [
    "docs/research/hyperknow-frame-review.md",
    "docs/research/comparisons/",
    "frontend/tests/e2e/critical-flows.spec.js"
  ]
}
```
