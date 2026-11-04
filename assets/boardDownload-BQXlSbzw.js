import{$ as e,L as t,Ut as n,Z as r,_ as i,f as a,i as o,l as s,p as c,qt as l,u,ut as d,v as f,z as p}from"./runtime-core.esm-bundler-pdE8C_u2.js";import{n as m}from"./runtime-dom.esm-bundler-BcWhQtDb.js";import{t as h}from"./_plugin-vue_export-helper-BDNMzG2s.js";var g={class:`board-title`},_={class:`board-kicker`},v=[`data-block-index`],y={class:`outline-list`},b={class:`definition-text`},x={key:0,class:`analogy`},S={class:`table-wrap`},C={class:`diagram-chain`},w={class:`diagram-node`},T={key:0,class:`diagram-arrow`},E={key:0,class:`diagram-caption`},D={class:`callout-label`},O={key:5,class:`question-card`},k={class:`block-label`},A={key:0,class:`question-options`},j=[`disabled`,`aria-pressed`,`onClick`],M={key:1,class:`question-selection`},N=h({__name:`BoardCanvas`,props:{lesson:{type:Object,default:null},visibleCount:{type:Number,default:999},interactive:{type:Boolean,default:!0},landscape:{type:Boolean,default:!1}},emits:[`answer`],setup(h,{emit:N}){let P=h,F=N,I=d({}),L=s(()=>(P.lesson?.blocks||[]).slice(0,Math.max(0,P.visibleCount)));function R(e){return e===`warn`?`易错点`:e===`idea`?`理解抓手`:`学习提示`}function z(e,t){P.interactive&&(I.value={...I.value,[e]:t},F(`answer`,{question:e,option:t}))}return r(()=>P.lesson,()=>{I.value={}}),(r,s)=>h.lesson?(t(),c(`article`,{key:0,class:n([`board-canvas`,{"is-landscape":h.landscape}]),"data-testid":`board-canvas`},[u(`header`,g,[u(`span`,_,`本节板书 · `+l(h.lesson.chapter),1),u(`h1`,null,l(h.lesson.title),1),u(`p`,null,l(h.lesson.subtitle),1)]),f(m,{name:`block`,tag:`div`,class:`board-blocks`},{default:e(()=>[(t(!0),c(o,null,p(L.value,(e,r)=>(t(),c(`section`,{key:`${e.type}-${r}`,class:n([`board-block`,`is-${e.type}`]),"data-block-index":r},[e.type===`outline`?(t(),c(o,{key:0},[u(`h2`,null,l(e.title),1),u(`ol`,y,[(t(!0),c(o,null,p(e.items,e=>(t(),c(`li`,{key:e},[s[0]||=u(`span`,{class:`outline-dot`},null,-1),u(`span`,null,l(e),1)]))),128))])],64)):e.type===`definition`?(t(),c(o,{key:1},[u(`h2`,null,l(e.title)+`：`+l(e.term),1),u(`p`,b,[s[1]||=u(`span`,null,`定义：`,-1),i(l(e.definition),1)]),e.analogy?(t(),c(`p`,x,[s[2]||=u(`span`,null,`形象比喻：`,-1),i(` `+l(e.analogy),1)])):a(``,!0)],64)):e.type===`table`?(t(),c(o,{key:2},[u(`h2`,null,l(e.title),1),u(`div`,S,[u(`table`,null,[u(`thead`,null,[u(`tr`,null,[(t(!0),c(o,null,p(e.columns,e=>(t(),c(`th`,{key:e},l(e),1))),128))])]),u(`tbody`,null,[(t(!0),c(o,null,p(e.rows,(e,n)=>(t(),c(`tr`,{key:n},[(t(!0),c(o,null,p(e,(e,n)=>(t(),c(`td`,{key:n},l(e),1))),128))]))),128))])])])],64)):e.type===`diagram`?(t(),c(o,{key:3},[u(`h2`,null,l(e.title),1),u(`div`,C,[(t(!0),c(o,null,p(e.nodes,(n,r)=>(t(),c(o,{key:n.label},[u(`div`,w,[u(`strong`,null,l(n.label),1),u(`span`,null,l(n.note),1)]),r<e.nodes.length-1?(t(),c(`span`,T,`→`)):a(``,!0)],64))),128))]),e.caption?(t(),c(`p`,E,l(e.caption),1)):a(``,!0)],64)):e.type===`callout`?(t(),c(`div`,{key:4,class:n([`callout`,`tone-${e.tone}`])},[u(`span`,D,l(R(e.tone))+`：`+l(e.title),1),u(`p`,null,l(e.text),1)],2)):e.type===`question`?(t(),c(`div`,O,[u(`span`,k,l(e.title),1),u(`h2`,null,l(e.prompt),1),e.options?.length?(t(),c(`div`,A,[(t(!0),c(o,null,p(e.options,(r,a)=>(t(),c(`button`,{key:r,type:`button`,disabled:!h.interactive,class:n({selected:I.value[e.prompt]===r}),"aria-pressed":I.value[e.prompt]===r,onClick:t=>z(e.prompt,r)},[u(`span`,null,l(String.fromCharCode(65+a)),1),i(` `+l(r),1)],10,j))),128))])):a(``,!0),I.value[e.prompt]?(t(),c(`p`,M,` 已选择「`+l(I.value[e.prompt])+`」。可以继续在对话栏补充你的判断依据。 `,1)):a(``,!0),s[3]||=u(`p`,{class:`question-tip`},`也可以直接在右侧输入自己的判断。`,-1)])):a(``,!0)],10,v))),128))]),_:1})],2)):a(``,!0)}},[[`__scopeId`,`data-v-b6196c44`]]);function P(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`)}function F(e){return e.type===`outline`?`<section><h2>${P(e.title)}</h2><ul>${(e.items||[]).map(e=>`<li>${P(e)}</li>`).join(``)}</ul></section>`:e.type===`definition`?`<section><h2>${P(e.title)}：${P(e.term)}</h2><p><strong>定义：</strong>${P(e.definition)}</p>${e.analogy?`<p><strong>形象比喻：</strong>${P(e.analogy)}</p>`:``}</section>`:e.type===`table`?`<section><h2>${P(e.title)}</h2><table><thead><tr>${(e.columns||[]).map(e=>`<th>${P(e)}</th>`).join(``)}</tr></thead><tbody>${(e.rows||[]).map(e=>`<tr>${e.map(e=>`<td>${P(e)}</td>`).join(``)}</tr>`).join(``)}</tbody></table></section>`:e.type===`diagram`?`<section><h2>${P(e.title)}</h2><div class="chain">${(e.nodes||[]).map(e=>`<div class="node"><strong>${P(e.label)}</strong><span>${P(e.note)}</span></div>`).join(`<i>→</i>`)}</div>${e.caption?`<p>${P(e.caption)}</p>`:``}</section>`:e.type===`callout`?`<aside><strong>${P(e.title)}</strong><p>${P(e.text)}</p></aside>`:e.type===`question`?`<section class="question"><h2>${P(e.title)}</h2><p>${P(e.prompt)}</p>${e.options?.length?`<ul>${e.options.map(e=>`<li>${P(e)}</li>`).join(``)}</ul>`:``}</section>`:``}function I(e){let t=(e?.blocks||[]).map(F).join(`
`);return`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${P(e?.title||`课程板书`)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 42px 22px;
    color: #292943;
    background: #f5f2ea;
    font-family: "Segoe Print", "KaiTi", "STKaiti", "Noto Serif SC", serif;
    line-height: 1.8;
  }
  main {
    max-width: 1080px;
    margin: auto;
    padding: 42px 48px 56px;
    background-color: #fffefa;
    background-image: radial-gradient(rgba(111,118,154,.15) 1px, transparent 1px);
    background-size: 18px 18px;
    border: 1px solid #e3dfd3;
    border-radius: 12px;
  }
  header { padding-bottom: 20px; margin-bottom: 28px; border-bottom: 1px solid #d9d6cd; }
  small { color: #9295a8; font-size: 12px; letter-spacing: .06em; }
  h1 { width: fit-content; margin: 8px 0 6px; padding-right: 6px; color: #5647bd; font-size: 34px;
    background: linear-gradient(to top, rgba(218,208,255,.68) 38%, transparent 38%); }
  header p { margin: 0; color: #5f6279; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px 48px; align-items: start; }
  section, aside { break-inside: avoid; }
  h2 { width: fit-content; margin: 0 0 14px; padding-right: 5px; color: #5647bd; font-size: 20px;
    background: linear-gradient(to top, rgba(218,208,255,.68) 42%, transparent 42%); }
  ul { margin: 0; padding-left: 22px; }
  li { margin: 7px 0; }
  p { margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { padding: 9px 11px; border: 1px solid #4d5067; text-align: left; vertical-align: top; }
  th { color: #4459c6; background: #f0f1ff; }
  .chain { display: flex; gap: 8px; align-items: stretch; overflow-x: auto; }
  .node { flex: 1 0 120px; padding: 12px; border: 1px solid #4d5067; border-radius: 3px; }
  .node strong, .node span { display: block; }
  .node strong { color: #4459c6; }
  .node span { color: #5f6279; font-size: 13px; }
  .chain i { align-self: center; color: #4e5ec8; font-style: normal; }
  aside { padding: 12px 14px; background: #f6f3ff; border-left: 3px solid #4e5ec8; }
  .question { grid-column: 1 / -1; padding: 18px 20px; background: #f5f0ff; border: 1px solid #d9d1ee; }
  @media (max-width: 760px) {
    body { padding: 12px; }
    main { padding: 26px 18px 36px; }
    .grid { grid-template-columns: 1fr; gap: 24px; }
    .question { grid-column: auto; }
  }
  @media print {
    body { padding: 0; background: white; }
    main { max-width: none; border: 0; }
  }
</style>
</head>
<body>
<main>
  <header>
    <small>${P(e?.chapter||`课程板书`)}</small>
    <h1>${P(e?.title||`课程板书`)}</h1>
    <p>${P(e?.subtitle||``)}</p>
  </header>
  <div class="grid">${t}</div>
</main>
</body>
</html>`}function L(e){let t=new Blob([I(e)],{type:`text/html;charset=utf-8`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`${String(e?.title||`课程板书`).replace(/[\\/:*?"<>|]/g,`-`)}.html`,document.body.appendChild(r),r.click(),r.remove(),URL.revokeObjectURL(n)}export{N as n,L as t};