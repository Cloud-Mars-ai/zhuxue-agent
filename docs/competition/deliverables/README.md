# 智慧学伴比赛交付物

| 文件 | 说明 |
| --- | --- |
| `智慧学伴设计方案.pdf` | 15 页设计方案，包含需求分析、架构、功能、验证、安全与边界 |
| `智慧学伴任务成果包.zip` | `math7-official-v1`：JSON/CSV 成果、字段说明、输入输出样例、验证报告 |
| `智慧学伴演示视频.mp4` | 203.5 秒（3 分 23.5 秒），符合 5 分钟限制 |
| `智慧学伴答辩PPT.pptx` | 10 页答辩演示，含结构化表格与产品截图 |

## 文件校验

| 文件 | 大小 | SHA-256 |
| --- | ---: | --- |
| `智慧学伴设计方案.pdf` | 1,671,327 bytes | `8671C2F36583EB6CB7DA6DB8D7EAD3604F6995C938AF288AE424DBE837970389` |
| `智慧学伴答辩PPT.pptx` | 1,408,745 bytes | `B215BD5B20A126E62DE6D94FD6215CAADA5BED29A56D33199F57B985B11FBF07` |
| `智慧学伴演示视频.mp4` | 11,675,058 bytes | `C84439F6731892B86DC940E73C4554FDA8E7AC13086572A2A8C5C8DAF169726C` |
| `智慧学伴任务成果包.zip` | 418,508 bytes | `6A073D56F8E9E46979AE73A162C06A4DDD953D3E8C824685FD5983A665BC1` |

## 重要说明

- 当前应用已接入赛方公开模拟学情数据 `math7-official-v1`：40 名学生、54 道题、3 个主题、806 条原始作答记录，其中 793 条有效记录。
- 质量分类为旧修订 7 条、待复核 4 条、得分超出 0..满分范围 2 条、缺失观察 5 条；两条异常均属于 `invalid_value`，不是异常引用。
- 原始 CSV 位于 `frontend/src/competition/official/`；Node 校验和浏览器构建共用同一份规范化数据。
- 正式赛事数据仅限本次比赛使用，赛后按赛方要求删除。
- 历史明文 API Key 需要由项目负责人在服务商控制台轮换；当前前端源码不再包含密钥。
- 独立评测数据由赛方另行提供，不包含在本开发/展示成果包中。

## 重新生成

```powershell
cd frontend
npm run sync:competition-data
npm run test:competition
npm run export:competition
```

PPT 和视频的源脚本分别位于：

- `docs/competition/tools/finalize_presentation.mjs`
- `docs/competition/tools/record_demo.mjs`
