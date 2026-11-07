import{j as e,l as t,ut as n}from"./runtime-core.esm-bundler-pdE8C_u2.js";import{r}from"./index-DFHJxuu-.js";import{D as i,E as a,O as o}from"./courseStudio-lU6IykPh.js";import{i as s,n as c}from"./courseOutline-DMLb3SO2.js";import{c as l,d as u,f as d,g as f,i as p,l as m,n as h,o as g,p as _,r as v,t as y,u as b}from"./chat-BN_5qkOD.js";import{a as x,i as S,n as C,r as w}from"./voice-Dni0L8bO.js";var T=`{
  "chapter": "章节标题",
  "title": "本节主题，最多16字",
  "subtitle": "一句话说明本节解决什么问题",
  "blocks": [
    {
      "type": "outline",
      "title": "本节路线图",
      "items": ["3到5条学习路径"]
    },
    {
      "type": "definition",
      "title": "核心概念",
      "term": "概念名",
      "definition": "教材定义，必须来自给定材料",
      "analogy": "一个有助于理解的类比，可为空"
    },
    {
      "type": "table",
      "title": "对照表",
      "columns": ["维度", "功能", "核心含义"],
      "rows": [["2到4列文本", "与列数一致", "与列数一致"]]
    },
    {
      "type": "diagram",
      "title": "判断链",
      "nodes": [
        { "label": "节点名", "note": "节点说明" }
      ],
      "caption": "图示说明"
    },
    {
      "type": "animation",
      "title": "跟着变化看",
      "caption": "点下一步观察条件改变后的结果",
      "steps": [
        { "label": "初始状态", "detail": "先看起点" },
        { "label": "改变条件", "detail": "每次只改变一个条件" },
        { "label": "观察结果", "detail": "说出变化和原因" }
      ]
    },
    {
      "type": "callout",
      "title": "学习提示",
      "tone": "note|warn|idea",
      "text": "易错点或判断依据"
    },
    {
      "type": "question",
      "title": "停下来想一想",
      "prompt": "一个开放但有明确判断对象的问题",
      "options": ["可选的回答方向A", "可选的回答方向B"]
    }
  ]
}`;function E({chapter:e,materialText:t,discipline:n,focus:r,studyMode:i}){let a=g(v({chapter:e,objective:r,materialText:t})),o=[`preschool`,`primary`,`junior`].includes(a.stage);return{system:`${u}\n你正在设计一页“结构化板书”，不是写一篇文章，也不是画自由画布。板书服务于学生看清推理链：先给路线，再解释概念，再用表格或图示做对照，最后用问题逼学生表态。${l}\n${d(n)}\n【本轮学习者画像】\n${p(a)}\n硬约束：只使用给定课程材料；模型只写内容与 chunk 之外的章级来源，绝对不要编造页码；不输出 HTML、Markdown、坐标、绘图指令或品牌文案；最多 8 个 block，至少包含 outline、definition 和一个 question。${o?`当内容涉及流程、变化或运算过程时，加入 1 个 animation，用 2—4 帧表现“只改变一个条件后发生什么”。`:`仅在需要推演关系时使用 animation。`}\n${b}\n`+_(T),user:`章节：${e}\n学习模式：${i===`sprint`?`考前冲刺，只讲高频考点与易错辨析`:`正常上课，跟随课程进度完整理解`}\n`+(r?`学生关注点：${r}\n`:``)+`教师确认材料：\n${t}`,temperature:.35,maxTokens:6e3,reasoningEffort:`low`}}function D({chapter:e,lessonText:t,question:n,discipline:r}){let i=g(v({chapter:e,objective:n,materialText:t}));return{system:`${u}\n你正在白板讲解中接到学生的插问。先判断学生是在确认概念、提出反例，还是要求直接给答案。回答要接上当前板书，使用苏格拉底式引导；学生求作业答案时只给判断框架和下一步，不直接代做。控制在 80—180 个汉字，先正面回应，再抛回一个可执行的小问题。不要重复整页板书。
${l}\n${b}\n${d(r)}\n【本轮学习者画像】\n${p(i)}`,user:`章节：${e}\n当前板书：\n${t}\n\n学生插问：${n}`,temperature:.45,maxTokens:1600,reasoningEffort:`low`}}var O=`【演示缓存】`;function k(e){return c(e)}function A(){try{return r().discipline||``}catch{return``}}async function j({chapter:e,focus:t=``,studyMode:n=`course`}){let r=k(e),a=r?.title||e,c=E({chapter:a,materialText:r?s([r]):`当前没有匹配到教师确认材料，请只给出概念框架并明确标注待核对。`,discipline:A(),focus:t,studyMode:n});try{let{data:e}=await h([{role:`user`,content:c.user}],{systemPrompt:c.system,temperature:c.temperature,maxTokens:c.maxTokens,reasoningEffort:c.reasoningEffort,responseFormat:`json_object`,kind:`board`,task:`board.generate`,promptVersion:m,traceRefs:{chapter:a,focus:t,studyMode:n}}),r=o(e,a);if(!r)throw Error(`板书结构解析失败`);return{lesson:r,fallback:!1}}catch(e){if(!f(`offlineFallback`))throw e;return{lesson:i(a),fallback:!0,error:e}}}function M({chapter:e,lesson:t,question:n}){let r=k(e)?.keyPoints?.[0],i=t?.blocks?.find(e=>e.type===`question`);return/答案|怎么做|直接|写完|标准/.test(n)?`${O}先不急着要整段答案。你可以按这条判断链走：先指出案例里的现象，再判断它是否满足「${r?.term||`核心概念`}」的适用条件，最后给出一个可执行动作。你愿意先写出第一步判断吗？`:/为什么|区别|是什么|怎么理解/.test(n)?`${O}回到板书里的定义：${r?.definition||`先确认概念定义。`}你可以用一个反例来检验自己是否真的理解：如果去掉其中一个条件，结论还成立吗？`:`${O}这个问题可以接在“${i?.prompt||`当前追问`}”后面继续想。先把你的直觉写成一句话，再补上你依据的课程概念；我会根据你的理由继续追问。`}async function N({chapter:e,lesson:t,question:n}){let r=D({chapter:e,lessonText:a(t),question:n,discipline:A()});try{return{text:await y([{role:`user`,content:r.user}],{systemPrompt:r.system,temperature:r.temperature,maxTokens:r.maxTokens,reasoningEffort:r.reasoningEffort,kind:`board`,task:`board.question`,promptVersion:m,traceRefs:{chapter:e}}),fallback:!1}}catch(r){if(!f(`offlineFallback`))throw r;return{text:M({chapter:e,lesson:t,question:n}),fallback:!0,error:r}}}function P(e){return String(e||``).replace(/\s+/g,` `).trim()}function F(e){if(!e)return``;if(e.type===`outline`)return`${e.title}。${(e.items||[]).join(`；`)}。`;if(e.type===`definition`)return[`${e.title}：${e.term}。`,`先看一个例子：${e.concreteAnchor||``}`,`定义：${e.definition}`,e.analogy?`形象比喻：${e.analogy}`:``,e.method?.length?`方法：${e.method.join(`，`)}`:``,e.verify?`验证：${e.verify}`:``].filter(Boolean).join(` `);if(e.type===`table`){let t=(e.rows||[]).map(e=>e.join(`，`)).join(`；`);return`${e.title}。表头是：${(e.columns||[]).join(`、`)}。${t}。`}if(e.type===`diagram`){let t=(e.nodes||[]).map(e=>e.note?`${e.label}，${e.note}`:e.label).join(`；`);return`${e.title}。判断链是：${t}。${e.caption||``}`}if(e.type===`callout`)return`${e.title}。${e.text}${e.mnemonic?`口诀：${e.mnemonic}`:``}`;if(e.type===`question`)return`停下来想一想。${e.prompt}`;if(e.type===`classification-tree`){let t=(e.branches||[]).map(e=>e.children?.length?`${e.label}，包括${e.children.map(e=>e.label).join(`、`)}`:e.label).join(`；`);return`${e.title}。${e.root.label}分成：${t}。`}if(e.type===`number-line`){let t=(e.points||[]).map(e=>`${e.label}在${e.value}`).join(`；`);return`${e.title}。从${e.min}到${e.max}：${t}。`}return e.type===`fill-blank`?`${e.title}。${e.prompt.replace(/___/g,`哪里`)}`:e.type===`wrong-first`?`${e.title}。先看一份常见错解，第${e.errorIndex+1}步有问题。${e.errorHint||`想一想错在哪里`}。正确做法是：${(e.correctSteps||[]).join(`，`)}。`:e.type===`judge`?`${e.title}。${e.statement}`:e.type===`case-table`?`${e.title}。按${e.dimension}分情形：${(e.cases||[]).map(e=>`${e.condition}时，${e.conclusion}`).join(`；`)}。`:e.type===`induction`?`${e.title}。先看这几个例子：${(e.examples||[]).join(`；`)}。规律是什么？`:e.type===`multi-solution`?`${e.title}。${e.problem} 可以用${(e.methods||[]).map(e=>e.name).join(`、`)}等方法分别解决。`:``}function I(e,t=900){let n=P(e);if(n.length<=t)return n;let r=n.slice(0,t),i=Math.max(r.lastIndexOf(`。`),r.lastIndexOf(`；`),r.lastIndexOf(`！`),r.lastIndexOf(`？`));return i>t*.55?r.slice(0,i+1):`${r}…`}function L(r,i={}){let a=Number(i.revealDelay)||900,o=C(),s=n(0),c=n(!1),l=n(!1),u=n(``),d=null,f=0,p=t(()=>!!r.value&&s.value>=r.value.blocks.length),m=t(()=>o.enabled);function h(){d&&=(clearInterval(d),null)}function g(){f+=1,x(),l.value=!1}function _(e=!1){h(),!(!r.value||c.value||o.enabled&&!e)&&(d=window.setInterval(()=>{!r.value||s.value>=r.value.blocks.length?h():s.value+=1},a))}async function v(e,t){if(!o.enabled||c.value||t!==f||!r.value)return;let n=r.value.blocks||[];if(e>=n.length){l.value=!1,h();return}s.value=Math.max(s.value,e+1);let i=I(F(n[e]));if(!i){s.value=Math.min(n.length,e+2),v(e+1,t);return}let a=I(F(n[e+1]));l.value=!0,u.value=``;try{if(await Promise.allSettled([S(i,{config:o.ttsConfig}),a?S(a,{config:o.ttsConfig}):Promise.resolve(null)]),t!==f||!o.enabled||c.value)return;await w(i,{config:o.ttsConfig,onEnded:()=>{l.value=!1,t===f&&o.enabled&&!c.value&&(s.value=Math.min(n.length,e+2),v(e+1,t))}})}catch(e){l.value=!1,u.value=e?.name===`NotAllowedError`?`浏览器阻止了自动播放，请点击“开启语音”`:e?.message||`语音播放失败`,t===f&&_(!0)}}function y(e=!1){if(h(),g(),c.value=!1,e&&(s.value=0),!r.value)return;let t=r.value.blocks||[];if(t.length){if(o.enabled){let n=e?0:Math.min(Math.max(s.value-1,0),t.length-1);s.value=Math.max(1,n+1),v(n,f)}else s.value=Math.max(s.value,1),_()}}function b(){r.value&&(p.value?y(!0):c.value?(c.value=!1,o.enabled?v(Math.min(Math.max(s.value-1,0),r.value.blocks.length-1),++f):_()):(c.value=!0,h(),g()))}function T(){y(!0)}function E(e){o.setEnabled(e),u.value=``,e?y(p.value):(g(),p.value||_())}function D(){E(!o.enabled)}function O(e){o.setVoice(e),o.enabled&&y(!1)}return e(()=>{h(),g()}),{visibleCount:s,paused:c,narrating:l,voiceError:u,voiceEnabled:m,revealFinished:p,voiceStore:o,startReveal:y,startInterval:_,stopReveal:h,stopNarration:g,togglePause:b,restart:T,setVoiceEnabled:E,toggleVoice:D,selectVoice:O}}export{N as n,j as r,L as t};