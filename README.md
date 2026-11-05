# 人机协同助学智能体

“智慧学伴”面向七年级数学，用课程要求、配套材料和脱敏模拟学习记录完成内容梳理、个体与群体学情分析、个性化学习建议，并将建议转为可继续追问的个性化课程。

界面提供“澄蓝”和“纸感”两套浅色主题：教师首次登录默认澄蓝，学生默认纸感，手动选择会持久化。教师主控台支持按每次作业或考试生成班级知识点掌握矩阵、成绩分布、全员明细、风险学生、小组差异和教学建议，并可导出 CSV。

课程生成采用“用户需求定主题、上传材料作证据、先大纲后场景”的流程。主页输入课程目标后会直接进入大纲确认页，不再展示独立的“智能课程编排”导航入口；模型不可用时也会依据用户输入和材料生成，不再套用固定学科大纲。

学生端提供个人知识库、资料上传、板书收藏、作业文件提交、教师批阅回信和研讨主题评论。

## 在线入口

- 公网演示：https://cloud-mars-ai.github.io/zhuxue-agent/
- 智慧学伴工作台：https://cloud-mars-ai.github.io/zhuxue-agent/#/app/competition
- 学生移动端：https://cloud-mars-ai.github.io/zhuxue-agent/#/m/competition
- 代码仓库：https://github.com/Cloud-Mars-ai/zhuxue-agent
- 交付 Release：https://github.com/Cloud-Mars-ai/zhuxue-agent/releases/tag/v0.7-competition

GitHub Pages 是静态部署，模型未配置时使用确定性演示兜底。需要真实 DeepSeek 与 StepAudio 时，请按 [`frontend/.env.example`](frontend/.env.example) 配置服务端环境变量，并用 `npm start` 运行同源 Node 代理。

## 本地运行

```bash
cd frontend
npm install
npm run dev
```

生产深链接验证：

```bash
cd frontend
npm start
```

默认地址为 http://localhost:4173。

## 赛事交付物

- [`智慧学伴设计方案.pdf`](docs/competition/deliverables/智慧学伴设计方案.pdf)
- [`智慧学伴演示视频.mp4`](docs/competition/deliverables/智慧学伴演示视频.mp4)
- [`智慧学伴答辩PPT.pptx`](docs/competition/deliverables/智慧学伴答辩PPT.pptx)
- [`智慧学伴任务成果包.zip`](docs/competition/deliverables/智慧学伴任务成果包.zip)

当前内置数据为固定种子开发样例，不是赛方正式数据。正式数据到位后替换 `frontend/src/competition/dataset.js` 对应输入，统计和建议引擎无需改写。

