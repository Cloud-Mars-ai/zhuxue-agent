import{j as e,l as t,ut as n}from"./runtime-core.esm-bundler-pdE8C_u2.js";import{r}from"./index-DX_En-LI.js";import{c as i,l as a,s as o}from"./courseStudio-DPyJgAh0.js";import{a as s,n as c,t as l}from"./chat-DsGc1G_L.js";import{i as u,n as d}from"./courseOutline-DMLb3SO2.js";import{a as f,i as p,o as m,r as h,s as g}from"./localQuiz-BLxZTEzs.js";import{a as _,i as v,n as y,r as b}from"./voice-CZtJ4RZi.js";var x=`{
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
}`;function S({chapter:e,materialText:t,discipline:n,focus:r,studyMode:i}){return{system:`${f}\n你正在设计一页“结构化板书”，不是写一篇文章，也不是画自由画布。板书服务于学生看清推理链：先给路线，再解释概念，再用表格或图示做对照，最后用问题逼学生表态。${h}\n${m(n)}\n硬约束：只使用给定课程材料；模型只写内容与 chunk 之外的章级来源，绝对不要编造页码；不输出 HTML、Markdown、坐标、绘图指令或品牌文案；最多 6 个 block，至少包含 outline、definition 和一个 question。
`+g(x),user:`章节：${e}\n学习模式：${i===`sprint`?`考前冲刺，只讲高频考点与易错辨析`:`正常上课，跟随课程进度完整理解`}\n`+(r?`学生关注点：${r}\n`:``)+`教师确认材料：\n${t}`,temperature:.35,maxTokens:6e3,reasoningEffort:`low`}}function C({chapter:e,lessonText:t,question:n,discipline:r}){return{system:`${f}\n你正在白板讲解中接到学生的插问。先判断学生是在确认概念、提出反例，还是要求直接给答案。回答要接上当前板书，使用苏格拉底式引导；学生求作业答案时只给判断框架和下一步，不直接代做。控制在 80—180 个汉字，先正面回应，再抛回一个可执行的小问题。不要重复整页板书。
${h}\n${m(r)}`,user:`章节：${e}\n当前板书：\n${t}\n\n学生插问：${n}`,temperature:.45,maxTokens:1600,reasoningEffort:`low`}}var w=`【演示缓存】`;function T(e){return d(e)}function E(){try{return r().discipline||``}catch{return``}}async function D({chapter:e,focus:t=``,studyMode:n=`course`}){let r=T(e),o=r?.title||e,l=S({chapter:o,materialText:r?u([r]):`当前没有匹配到教师确认材料，请只给出概念框架并明确标注待核对。`,discipline:E(),focus:t,studyMode:n});try{let{data:e}=await c([{role:`user`,content:l.user}],{systemPrompt:l.system,temperature:l.temperature,maxTokens:l.maxTokens,reasoningEffort:l.reasoningEffort,responseFormat:`json_object`,kind:`board`,task:`board.generate`,promptVersion:p,traceRefs:{chapter:o,focus:t,studyMode:n}}),r=a(e,o);if(!r)throw Error(`板书结构解析失败`);return{lesson:r,fallback:!1}}catch(e){if(!s(`offlineFallback`))throw e;return{lesson:i(o),fallback:!0,error:e}}}function O({chapter:e,lesson:t,question:n}){let r=T(e)?.keyPoints?.[0],i=t?.blocks?.find(e=>e.type===`question`);return/答案|怎么做|直接|写完|标准/.test(n)?`${w}先不急着要整段答案。你可以按这条判断链走：先指出案例里的现象，再判断它是否满足「${r?.term||`核心概念`}」的适用条件，最后给出一个可执行动作。你愿意先写出第一步判断吗？`:/为什么|区别|是什么|怎么理解/.test(n)?`${w}回到板书里的定义：${r?.definition||`先确认概念定义。`}你可以用一个反例来检验自己是否真的理解：如果去掉其中一个条件，结论还成立吗？`:`${w}这个问题可以接在“${i?.prompt||`当前追问`}”后面继续想。先把你的直觉写成一句话，再补上你依据的课程概念；我会根据你的理由继续追问。`}async function k({chapter:e,lesson:t,question:n}){let r=C({chapter:e,lessonText:o(t),question:n,discipline:E()});try{return{text:await l([{role:`user`,content:r.user}],{systemPrompt:r.system,temperature:r.temperature,maxTokens:r.maxTokens,reasoningEffort:r.reasoningEffort,kind:`board`,task:`board.question`,promptVersion:p,traceRefs:{chapter:e}}),fallback:!1}}catch(r){if(!s(`offlineFallback`))throw r;return{text:O({chapter:e,lesson:t,question:n}),fallback:!0,error:r}}}function A(e){return String(e||``).replace(/\s+/g,` `).trim()}function j(e){if(!e)return``;if(e.type===`outline`)return`${e.title}。${(e.items||[]).join(`；`)}。`;if(e.type===`definition`)return[`${e.title}：${e.term}。`,`定义：${e.definition}`,e.analogy?`形象比喻：${e.analogy}`:``].filter(Boolean).join(` `);if(e.type===`table`){let t=(e.rows||[]).map(e=>e.join(`，`)).join(`；`);return`${e.title}。表头是：${(e.columns||[]).join(`、`)}。${t}。`}if(e.type===`diagram`){let t=(e.nodes||[]).map(e=>e.note?`${e.label}，${e.note}`:e.label).join(`；`);return`${e.title}。判断链是：${t}。${e.caption||``}`}return e.type===`callout`?`${e.title}。${e.text}`:e.type===`question`?`停下来想一想。${e.prompt}`:``}function M(e,t=900){let n=A(e);if(n.length<=t)return n;let r=n.slice(0,t),i=Math.max(r.lastIndexOf(`。`),r.lastIndexOf(`；`),r.lastIndexOf(`！`),r.lastIndexOf(`？`));return i>t*.55?r.slice(0,i+1):`${r}…`}function N(r,i={}){let a=Number(i.revealDelay)||900,o=y(),s=n(0),c=n(!1),l=n(!1),u=n(``),d=null,f=0,p=t(()=>!!r.value&&s.value>=r.value.blocks.length),m=t(()=>o.enabled);function h(){d&&=(clearInterval(d),null)}function g(){f+=1,_(),l.value=!1}function x(e=!1){h(),!(!r.value||c.value||o.enabled&&!e)&&(d=window.setInterval(()=>{!r.value||s.value>=r.value.blocks.length?h():s.value+=1},a))}async function S(e,t){if(!o.enabled||c.value||t!==f||!r.value)return;let n=r.value.blocks||[];if(e>=n.length){l.value=!1,h();return}s.value=Math.max(s.value,e+1);let i=M(j(n[e]));if(!i){s.value=Math.min(n.length,e+2),S(e+1,t);return}let a=M(j(n[e+1]));l.value=!0,u.value=``;try{if(await Promise.allSettled([v(i,{config:o.ttsConfig}),a?v(a,{config:o.ttsConfig}):Promise.resolve(null)]),t!==f||!o.enabled||c.value)return;await b(i,{config:o.ttsConfig,onEnded:()=>{l.value=!1,t===f&&o.enabled&&!c.value&&(s.value=Math.min(n.length,e+2),S(e+1,t))}})}catch(e){l.value=!1,u.value=e?.name===`NotAllowedError`?`浏览器阻止了自动播放，请点击“开启语音”`:e?.message||`语音播放失败`,t===f&&x(!0)}}function C(e=!1){if(h(),g(),c.value=!1,e&&(s.value=0),!r.value)return;let t=r.value.blocks||[];if(t.length){if(o.enabled){let n=e?0:Math.min(Math.max(s.value-1,0),t.length-1);s.value=Math.max(1,n+1),S(n,f)}else s.value=Math.max(s.value,1),x()}}function w(){r.value&&(p.value?C(!0):c.value?(c.value=!1,o.enabled?S(Math.min(Math.max(s.value-1,0),r.value.blocks.length-1),++f):x()):(c.value=!0,h(),g()))}function T(){C(!0)}function E(e){o.setEnabled(e),u.value=``,e?C(p.value):(g(),p.value||x())}function D(){E(!o.enabled)}function O(e){o.setVoice(e),o.enabled&&C(!1)}return e(()=>{h(),g()}),{visibleCount:s,paused:c,narrating:l,voiceError:u,voiceEnabled:m,revealFinished:p,voiceStore:o,startReveal:C,startInterval:x,stopReveal:h,stopNarration:g,togglePause:w,restart:T,setVoiceEnabled:E,toggleVoice:D,selectVoice:O}}export{k as n,D as r,N as t};