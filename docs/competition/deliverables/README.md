# 智慧学伴比赛交付物

| 文件 | 说明 |
| --- | --- |
| `智慧学伴设计方案.pdf` | 15 页设计方案，包含需求分析、架构、功能、验证、安全与边界 |
| `智慧学伴任务成果包.zip` | JSON/CSV 成果、字段说明、输入输出样例、验证报告 |
| `智慧学伴演示视频.mp4` | 约 3 分 23 秒，1280×720，含 StepAudio 旁白 |
| `智慧学伴答辩PPT.pptx` | 10 页答辩演示，含结构化表格与产品截图 |

## 文件校验

| 文件 | 大小 | SHA-256 |
| --- | ---: | --- |
| `智慧学伴设计方案.pdf` | 1,670,680 bytes | `1E648E9F8B5CC57390488BBF559894B35B8D3E150268B32B27DFD884493CF520` |
| `智慧学伴答辩PPT.pptx` | 1,325,696 bytes | `00C4774814F5ACB4BC8D7F25EC67FF9A96BDECC96A804E52B5441045210E5ED1` |
| `智慧学伴演示视频.mp4` | 11,675,058 bytes | `C84439F6731892B86DC940E73C4554FDA8E7AC13086572A2A8C5C8DAF169726C` |
| `智慧学伴任务成果包.zip` | 114,938 bytes | `D8D4255FDA4D05C7E7A036EA3790DFAB8831E6302F6BAC7C8065D45E7BB456E8` |

## 重要说明

- 当前数据是固定种子的开发样例，不是赛方正式数据。
- 正式提交前必须用赛方数据包替换 `frontend/src/competition/dataset.js` 对应的输入。
- 正式赛事数据仅限本次比赛使用，赛后按赛方要求删除。
- 历史明文 API Key 需要由项目负责人在服务商控制台轮换；当前前端源码不再包含密钥。

## 重新生成

```powershell
cd frontend
npm run test:competition
npm run export:competition
```

PPT 和视频的源脚本分别位于：

- `docs/competition/tools/finalize_presentation.mjs`
- `docs/competition/tools/record_demo.mjs`
