# 智慧学伴比赛交付物

| 文件 | 说明 |
| --- | --- |
| `智慧学伴设计方案.pdf` | 14 页设计方案，包含需求分析、架构、功能、验证、安全与边界 |
| `智慧学伴任务成果包.zip` | JSON/CSV 成果、字段说明、输入输出样例、验证报告 |
| `智慧学伴演示视频.mp4` | 约 3 分 23 秒，1280×720，含 StepAudio 旁白 |
| `智慧学伴答辩PPT.pptx` | 10 页答辩演示，含结构化表格与产品截图 |

## 文件校验

| 文件 | 大小 | SHA-256 |
| --- | ---: | --- |
| `智慧学伴设计方案.pdf` | 737,620 bytes | `5A737A2230DE5A70B15FE8D01C58D62E25753513730438EB8B177E142EC061B0` |
| `智慧学伴答辩PPT.pptx` | 791,128 bytes | `1DE5FC672B8B1E86C6B07612F635D612479BF83528CD3637B475DF72169F32BF` |
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
