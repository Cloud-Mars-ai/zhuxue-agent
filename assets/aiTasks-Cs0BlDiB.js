import{a as e,i as t,n,r,t as i}from"./chat-APcla1P7.js";import{i as a,n as o,r as s,t as c}from"./courseOutline-DMLb3SO2.js";import{a as l,i as u,n as d,o as f,r as p,t as m}from"./shared-ByzWI2-K.js";function h({chapter:e,type:t,discipline:n,materialText:r=``}){return{system:`${u}

这次你要给学生出一道「${t}」练习题，考查「${e}」。
${l(n)}

工作方式：
- 先想清楚这一章最值得练的是什么，再决定用什么情境承载它；情境要具体到一个真实的人、一个具体的决定，而不是"某公司"。
- 题目只给情境与任务要求，不给提示、要点或答案。
- 如果这个知识点更适合用两难选择来考，就设计两难；不要为了形式完整硬凑背景。
- 最后一行注明考查章节。

完成标准：学生读完会产生"我知道该从哪里想，但还得自己走一遍"的感觉，而不是"照着题干抄就能答"。
${r?`\n【本章课程材料】\n${r}\n\n出题不得超出上述材料范围；材料没有的概念不要引入。`:``}`,user:`章节：${e}\n题型：${t}\n请出题。`,temperature:.8,maxTokens:900}}function g({chapter:e,question:t,answer:n,discipline:r,selfTest:i,materialText:a=``}){return{system:`${u}

${i?`这是一次"先测后学"的自测：学生在没有参考资料的情况下凭记忆作答。回想时的吃力是正常的学习信号，不要把它说成失败。`:`这是一次日常练习，学生已经尽力作答。`}
${l(r)}

${m}

反馈要落在三个地方：观点结构（他有没有把话说成一个整体）、理论运用（有没有用对本章概念）、表达逻辑（别人能不能跟上）。不必三个都平均用力，哪一处最值得说就多说一点。
${d}
${a?`\n【本章课程材料】\n${a}\n\n判断"理论运用"时以上述材料的口径为准。`:``}`,user:`章节：${e}\n题目：${t}\n学生作答：${n}\n请给出反馈。`,temperature:.4,maxTokens:900}}function _({chapter:e,count:t=5,difficulty:n=`中等`,discipline:r,materialText:i=``}){return{system:`${u}

你要为「${e}」出一组单项选择题，用于检索练习（先测后学）。${l(r)}

出题原则：
- 考"能不能从记忆里取出并区分"，不考死记硬背的数字和年份；
- 每题只有一个正确答案，三个干扰项要像"学生真的会犯的错"，而不是明显荒谬；
- 题干给一个具体情境或一个易混点，不要直接问定义；
- 解析只讲"为什么对、为什么错"，不超过 80 字；
- 难度：${n}。
${i?`\n【本章课程材料】\n${i}\n\n题目与解析不得超出上述材料；干扰项也不要编造材料里没有的理论。`:``}

${f(`{
  "questions": [
    {
      "stem": "题干",
      "options": ["A 选项", "B 选项", "C 选项", "D 选项"],
      "answerIndex": 0,
      "explanation": "解析",
      "concept": "本题考查的概念名",
      "chapter": "${e}"
    }
  ]
}`)}

一共 ${t} 题。不要输出任何 JSON 之外的内容。`,user:`请为「${e}」生成 ${t} 道自测题。`,temperature:.6,maxTokens:2600}}function v({student:e,scope:t,evaluation:n,materialText:r=``}){return{system:`${u}

你正在为教师准备一道个性化模拟面试题。这不是随机抽题：你要同时看两样东西——教师划定的范围，以及这名学生过去练过什么、弱在哪里。
${l(e.discipline)}

工作方式：
- 先判断这名学生最需要在哪个概念上被"问住"，再决定题目情境；薄弱章节加大权重，但不要用偏题怪题为难人。
- 题目只描述任务与要求，不写答案，不超过 200 字。
- 题目之后另起一行，以"【参考要点】"开头给出 3 条要点，供教师复核；要点是评分线索，不是标准答案。
- 不超出课程纲要范围；材料没有的结论不要引入。

${d}
${r?`\n【课程材料】\n${r}\n\n出题只能考查上述材料覆盖的内容。`:``}`,user:`学生：${e.name}（学号 ${e.id}）\n过程性评价：${n}\n出题范围：章节 ${t.chapters.join(`、`)}；题型 ${t.questionType}；难度 ${t.difficulty}\n请生成一道模拟面试题。`,temperature:.7,maxTokens:900}}function y({question:e,answer:t,referencePoints:n}){return{system:`${u}

你以模拟面试官的身份读学生的作答。学生已经离开考场，这段话是他真实水平的切片——你的任务是让他知道下一次面试可以怎么不一样。
${d}

工作方式：
- 先给 2–3 条参考要点，说明这道题本来在考什么；
- 再给一条最值得改的具体建议，指出"下一句话该怎么说"，不要泛泛说"要加强逻辑"；
- 不直接给完整标准答案，不替教师打分。`,user:`题目：${e}\n学生作答：${t}\n`+(n?`教师复核参考要点：${n}\n`:``)+`请给出反馈。`,temperature:.4,maxTokens:900}}function b({title:e,chapter:t,content:n}){return{system:`${u}

学生在预习时提交了一个案例，你要帮教师快速判断"这条案例值不值得进课堂"。

工作方式：
- 先读懂案例里真正的管理冲突是什么，再写摘要；不要复述新闻。
- 摘要 50 字以内，说清"谁遇到了什么决定"。
- 标签给 3 个，必须是本课程的概念词（如"矩阵结构""有限理性"），不要用"热点""新闻"这类空标签。

输出两行：
第一行以"【摘要】"开头；
第二行以"【标签】"开头，3 个标签用顿号分隔。`,user:`案例标题：${e}\n相关章节：${t}\n案例内容：${n}`,temperature:.3,maxTokens:400}}function x({chapters:e,outlineText:t,layout:n,focus:r}){let i=n===`print`?`这份是打印版，学生要带到考场外候考时看，信息密度优先。`:`这份是屏幕阅读版，学生会在手机上快速过一遍。`,a=r?`学生特别担心的是：${r}。在不偏离材料的前提下，相关知识点可以多给一句提示。`:``;return{system:`${u}

你要为学生做一份「${e.join(`、`)}」的备考速查表。${i}${a}

工作方式：
- 考试按主题考，不按章节顺序考。先决定这份速查表应该分成哪几个主题（例如"计划与决策""组织与结构"），再把知识点挂进去。
- 每个知识点一行：概念名 + 一句话定义 + 一句考点提示。定义要能独立读懂，不要写"如上所述"。
- 重点内容标 priority: true，总数不超过 12 条；全表不超过 40 条。
- 只使用给定课程材料；材料没有的概念不要补。
- source 填章节标题（如"第4章 组织设计与组织变革"），不要编页码。

${f(`{
  "topics": [
    {
      "name": "主题名",
      "points": [
        {
          "term": "概念名",
          "definition": "一句话定义",
          "examTip": "考点提示",
          "priority": true,
          "source": "第X章 章节名"
        }
      ]
    }
  ]
}`)}

不要输出 JSON 之外的内容。`,user:`课程材料：\n${t}\n\n请生成速查表。`,temperature:.4,maxTokens:4200}}var S=[{name:`管理基础与理论演进`,chapters:[1,2],note:`先建立"管理是什么"，再看理论如何一步步演进。`},{name:`决策与计划`,chapters:[3],note:`决策是计划的前提，计划是决策的落地。`},{name:`组织设计与变革`,chapters:[4],note:`结构跟着战略走，变革跟着环境走。`},{name:`领导与激励`,chapters:[5],note:`领导靠影响力，激励靠满足需要。`},{name:`控制与控制过程`,chapters:[6],note:`控制不是监视，是保证计划落地。`}];function C(e=[]){let t=s(e),n=new Set(t.map(e=>e.id));return S.filter(e=>e.chapters.some(e=>n.has(e))).map(e=>({name:e.name,points:e.chapters.filter(e=>n.has(e)).flatMap(e=>c.find(t=>t.id===e)?.keyPoints||[]).map(e=>({term:e.term,definition:e.definition,examTip:e.examTip,priority:!!e.priority,source:c.find(t=>t.keyPoints.includes(e))?.title||``}))}))}function w(e=[]){return e.map(e=>`【${e.name}】\n`+e.points.map(e=>`· ${e.term}：${e.definition}${e.examTip?`（考点：${e.examTip}）`:``}`).join(`
`)).join(`

`)}function T(e,t){if(!e.length)return[];let n=(t%e.length+e.length)%e.length;return e.slice(n).concat(e.slice(0,n))}function E({chapters:e=[],count:t=5}={}){let n=s(e).flatMap(e=>e.keyPoints.map(t=>({...t,chapter:e.title}))),r=s([]).flatMap(e=>e.keyPoints.map(t=>({...t,chapter:e.title}))),i=[],a=Math.min(t,n.length);for(let e=0;e<a;e+=1){let t=n[e],a=T((r.length?r:n).filter(e=>e.term!==t.term),e*3+1).slice(0,3);if(a.length<3)continue;let o=[t.definition,...a.map(e=>e.definition)],s=e%4,[c]=o.splice(0,1);o.splice(s,0,c),i.push({id:`local-${e+1}`,stem:`关于「${t.term}」，下列哪一项最符合课程材料的表述？`,options:o,answerIndex:s,explanation:`${t.term}：${t.definition}${t.examTip?` 考点：${t.examTip}`:``}`,concept:t.term,chapter:t.chapter})}return i}var D=[`案例分析`,`情景模拟`,`即兴演讲`],O=[`情景案例题`,`模拟面试题`],k=[`基础`,`中等`,`提高`],A=`【演示缓存】`;function j(){return e(`offlineFallback`)}function M(e){return`${A}${e}`}function N(e){let t=o(e);return t?a([t]):``}function P(e=[]){return a(s(e))}async function F({chapter:e,type:t,discipline:n}){let r=h({chapter:e,type:t,discipline:n,materialText:N(e)});try{return await i([{role:`user`,content:r.user}],{systemPrompt:r.system,temperature:r.temperature,maxTokens:r.maxTokens,kind:`practice`,task:`practice.question`,promptVersion:p,traceRefs:{chapter:e,type:t}})}catch(n){if(!j())throw n;return M(`${e} · ${t}\n\n某连锁餐饮企业两年内从 12 家门店扩张到 60 家，总部仍由创始人一人拍板选址、采购与店长任免，区域经理只有执行权。最近三个月，三家新店因选址失误连续亏损，店长离职率上升。

请分析：该企业当前的组织结构最可能出现什么问题？如果你来做组织调整，会先动哪一处？

（考查章节：第4章 组织设计与组织变革）`)}}async function I({chapter:e,question:t,answer:n,discipline:r,selfTest:a=!1}){let o=g({chapter:e,question:t,answer:n,discipline:r,selfTest:a,materialText:N(e)});try{return await i([{role:`user`,content:o.user}],{systemPrompt:o.system,temperature:o.temperature,maxTokens:o.maxTokens,kind:`practice`,task:`practice.review`,promptVersion:p,traceRefs:{chapter:e,selfTest:a}})}catch(e){if(!j())throw e;return M(`先说做得好的地方：你注意到了总部与区域之间的权责关系，这是这道题的核心。

观点结构：你的回答有判断也有理由，但结论出现得偏晚，听的人前两句还不知道你要说什么。下次可以先用一句话给结论，再展开。

理论运用：你用了"集权"这个词，方向是对的；如果再点到"管理幅度"和"授权原则"，分析会更完整。

表达逻辑：第二段从选址跳到离职率，中间缺一句因果连接。补上"因为……所以……"，逻辑就顺了。

你在这道题上的卡点，恰好是记忆正在加固的位置——再答一次，会比这次清楚。`)}}async function L({chapter:e,count:r=5,difficulty:i=`中等`,discipline:a}){let o=_({chapter:e,count:r,difficulty:i,discipline:a,materialText:N(e)});try{let{data:a}=await n([{role:`user`,content:o.user}],{systemPrompt:o.system,temperature:o.temperature,maxTokens:o.maxTokens,kind:`selftest`,task:`selftest.generate`,promptVersion:p,traceRefs:{chapter:e,count:r,difficulty:i}}),s=t(a,e);if(s.length>=Math.min(3,r))return{questions:s.slice(0,r),fallback:!1};throw Error(`自测题结构解析失败`)}catch(t){if(!j())throw t;return{questions:E({chapters:[e],count:r}),fallback:!0}}}async function R({student:e,scope:t,evaluation:n}){let r=v({student:e,scope:t,evaluation:n,materialText:P(t.chapters)});try{let n=await i([{role:`user`,content:r.user}],{systemPrompt:r.system,temperature:r.temperature,maxTokens:r.maxTokens,kind:`assessment`,task:`assessment.question`,promptVersion:p,traceRefs:{studentId:e.id,chapters:t.chapters}}),a=n.indexOf(`【参考要点】`);return a>=0?{question:n.slice(0,a).trim(),referencePoints:n.slice(a+6).trim()}:{question:n.trim(),referencePoints:``}}catch(n){if(!j())throw n;return{question:M(`${e.name} 同学，请结合「${t.chapters[0]||`本章`}」的内容回答：\n\n一家快速扩张的企业发现，新开门店的决策质量明显下降，区域经理认为自己"只有执行权、没有判断权"。

请分析：这是哪一类管理问题？你会用本章的哪些概念向创始人解释，并给出第一步调整建议？`),referencePoints:`1. 能识别集权过度与管理幅度问题；
2. 能引用授权原则（权责对等、适度授权）；
3. 能给出可执行的第一步（如区域选址权下放与复盘机制）。`}}}async function z({question:e,answer:t,referencePoints:n}){let r=y({question:e,answer:t,referencePoints:n});try{return await i([{role:`user`,content:r.user}],{systemPrompt:r.system,temperature:r.temperature,maxTokens:r.maxTokens,kind:`assessment`,task:`assessment.review`,promptVersion:p})}catch(e){if(!j())throw e;return M(`参考要点：这道题在考"组织结构与决策权配置"的关系，而不是单纯背集权的缺点。

你的回答抓住了"总部管得太多"这一现象，方向是对的。下一步可以把现象翻译成课程语言：这是管理幅度过宽与授权不足的叠加，导致了决策质量下降。

一条具体建议：下次回答时，先用一句话给出判断（"这是集权过度"），再用两个概念支撑，最后给一个可执行动作。这样面试官能在前 20 秒抓住你的思路。`)}}async function B({title:e,chapter:t,content:n}){let r=b({title:e,chapter:t,content:n});try{let e=await i([{role:`user`,content:r.user}],{systemPrompt:r.system,temperature:r.temperature,maxTokens:r.maxTokens,kind:`case`,task:`case.summarize`,promptVersion:p,traceRefs:{chapter:t}}),n=``,a=[],o=e.match(/【摘要】\s*([^\n【]+)/),s=e.match(/【标签】\s*([^\n]+)/);return o&&(n=o[1].trim()),s&&(a=s[1].split(/[、,，]/).map(e=>e.trim()).filter(Boolean).slice(0,3)),n||=e.trim().slice(0,60),{summary:n,tags:a}}catch(r){if(!j())throw r;return{summary:String(n||``).replace(/\s+/g,` `).trim().slice(0,48)||`${e}（演示缓存摘要）`,tags:[t.replace(/^第\d+章\s*/,``),`案例分析`,`课堂研讨`].slice(0,3)}}}async function V({chapters:e=[],outlineText:t,layout:i=`screen`,focus:a=``}){let o=x({chapters:e,outlineText:t,layout:i,focus:a});try{let{data:t}=await n([{role:`user`,content:o.user}],{systemPrompt:o.system,temperature:o.temperature,maxTokens:o.maxTokens,kind:`cheatsheet`,task:`cheatsheet.generate`,promptVersion:p,traceRefs:{chapters:e,layout:i,focus:a}}),s=r(t);if(s)return{topics:s,fallback:!1};throw Error(`速查表结构解析失败`)}catch(t){if(!j())throw t;return{topics:C(e),fallback:!0}}}export{V as a,z as c,w as d,R as i,I as l,k as n,F as o,D as r,L as s,O as t,B as u};