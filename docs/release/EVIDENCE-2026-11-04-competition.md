# 发布证据：智慧学伴赛事模式

日期：2026-11-04

## 范围

- 七年级数学开发样例：有理数、整式、一元一次方程；
- 一个角色自适应工作台：内容与数据、学情分析、建议与核验；
- 学生复用课程首页、学习路径、课程编排、横向板书和语音开关；
- JSON/CSV 任务成果包；
- 服务端模型代理与前端确定性兜底。

## 已验证

### 公网入口

- GitHub Pages 根路径：`https://cloud-mars-ai.github.io/zhuxue-agent/`
- 教师工作台：`https://cloud-mars-ai.github.io/zhuxue-agent/#/app/competition`
- 学生 H5：`https://cloud-mars-ai.github.io/zhuxue-agent/#/m/competition`
- GitHub Release：`https://github.com/Cloud-Mars-ai/zhuxue-agent/releases/tag/v0.7-competition`
- GitHub Pages 构建状态：`built`，深链接在真实浏览器中渲染成功，页面无 JavaScript 错误。
- 源码提交：`9610523`；GitHub Pages 发布提交：`2cc7a41`。
- 真实浏览器验收：教师端默认澄蓝、学生 Web/H5 默认纸感；界面不再出现夜读选项，Web/H5 均无横向溢出。
- 教师首页标题与课程输入框在内容区同一轴线居中，垂直间距 26px。
- 教师主控台线上渲染 7 个知识点，CSV 导出与全员明细入口可用。

### 数据与分析

- `npm run test:competition`：通过
- 3 个主题、9 项课程要求、18 份材料、60 道题；
- 30 名模拟学生，417 条原始记录；
- 411 条有效记录；6 条质量问题；14 条缺失观察；
- 30 份个体建议均包含理由、完成标准、材料、题目和证据；
- 3 个典型案例覆盖不同表现与信息不足；
- 固定种子重复构建结果一致。

### 产品链路

- `npm run test:e2e`：25/25 通过；
- `npm run test:e2e:live`：5/5 通过；
- 常规构建 `npm run build`：通过；
- 单文件离线构建 `npm run build:offline`：通过；
- `npm audit --omit=dev`：0 个已知漏洞；
- 教师可在同一工作台查看数据质量、群体分析和个体证据；
- 教师可调整建议并填写调整依据；
- 教师主控台可按每次作业或考试生成班级知识点掌握矩阵、成绩分布、全员明细、风险学生和小组差异，并可导出 CSV；
- 澄蓝 / 纸感双主题上线；教师首次登录默认澄蓝，学生默认纸感，旧夜读主题已从选择器移除；
- 学生可从建议链生成正常上课或考前冲刺课程；
- 数学课程可进入独立 `/learn/:projectId` 页面；
- 第一场景完成即可学习，后续场景后台继续生成；
- Web/H5 均映射 `/competition` 路由；
- 板书沉浸布局、自动跟随和语音开关继续可用。

### 模型与安全

- DeepSeek 同源代理实测：HTTP 200，返回有效中文内容；
- StepAudio 代理实测：返回 `audio/mpeg`，测试文件 118,954 bytes；
- 前端源码扫描未发现明文 `sk-` 或旧 TTS key；
- 生产服务 `/api/health` 在无密钥时明确返回 `offline-fallback`；
- 请求与模型返回执行基础教育内容安全检查。

### 交付物

- 设计方案 PDF：15 页；
- 演示视频：3 分 23 秒，1280×720，H.264 + AAC，旁白已响度标准化；
- 答辩 PPT：10 页，原生表格可编辑，文件结构和首次导入校验通过；
- 任务成果包：14 个文件，ZIP 打包完成。
- Release 中的设计方案与答辩 PPT 已更新为本轮最终版本。

## 待负责人处理

- 历史提交中的明文 DeepSeek / StepAudio Key 仍需在服务商控制台轮换；
- 正式赛方数据包和最终典型 case 尚未提供，当前界面与成果包均标记为开发样例；
- 公网部署时需要在托管平台配置 `DEEPSEEK_API_KEY` 与 `STEPFUN_API_KEY`，不要写入仓库；
- 提交前按赛方最终模板复核 PDF 页眉、视频时长、文件命名和数据使用声明。
