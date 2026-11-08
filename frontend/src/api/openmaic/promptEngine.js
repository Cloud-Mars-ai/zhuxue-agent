/**
 * OpenMAIC 提示词模板引擎（移植自 @openmaic/generation/src/prompts/loader.ts）。
 *
 * 上游用 node:fs 读 templates/ 与 snippets/，浏览器不可用；本移植把模板与
 * 片段改为内嵌字符串资产（promptAssets.js），处理顺序与上游字节级一致：
 *   snippets 包含 → {{#if}} 条件块 → {{variable}} 插值。
 *
 * 硬规则：只用相对导入，node 测试脚本可直接 import。
 */

import { OPENMAIC_SNIPPETS, OPENMAIC_TEMPLATES } from './promptAssets.js'

export const PROMPT_IDS = {
  REQUIREMENTS_TO_OUTLINES: 'requirements-to-outlines',
  SLIDE_CONTENT: 'slide-content',
  QUIZ_CONTENT: 'quiz-content',
  SIMULATION_CONTENT: 'simulation-content',
}

/** 画布尺寸（与上游 scene-prompts.ts 一致）。 */
export const SLIDE_CANVAS = { width: 1000, height: 562.5 }

/** 替换片段包含 {{snippet:id}}；缺失即抛错（上游行为：宁肯失败也不要把占位符发给模型）。 */
export function processSnippets(template) {
  return template.replace(/\{\{snippet:(\w[\w-]*)\}\}/g, (match, snippetId) => {
    const snippet = OPENMAIC_SNIPPETS[snippetId]
    if (snippet == null) {
      throw new Error(`Snippet not found: ${snippetId}`)
    }
    return snippet.trim()
  })
}

/** 按真值包含/移除非嵌套 {{#if name}}…{{/if}} 块（上游不支持嵌套，此处同）。 */
export function processConditionalBlocks(template, conditions = {}) {
  return template.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, conditionName, content) => (conditions[conditionName] ? content : ''),
  )
}

/** camelCase / snake_case 占位符插值；对象值序列化为 JSON（上游行为）。 */
export function interpolateVariables(template, variables = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key]
    if (value === undefined) return match
    if (typeof value === 'object' && value !== null) return JSON.stringify(value, null, 2)
    return String(value)
  })
}

/** 取原始模板（未做任何处理）；缺失返回 null（上游 loadPrompt 语义）。 */
export function loadPrompt(promptId) {
  const entry = OPENMAIC_TEMPLATES[promptId]
  if (!entry) return null
  return {
    id: promptId,
    // 上游顺序：先展开 snippets 再返回（snippet 缺失即抛错）
    systemPrompt: processSnippets(entry.system.trim()),
    userPromptTemplate: processSnippets((entry.user || '').trim()),
  }
}

/**
 * 构建完整提示词：snippets → conditionals → variables（与上游 buildPrompt 同序）。
 * 返回 { system, user }；模板缺失返回 null。
 */
export function buildPrompt(promptId, variables = {}) {
  const prompt = loadPrompt(promptId)
  if (!prompt) return null
  const resolved = { ...variables }
  return {
    system: interpolateVariables(
      processConditionalBlocks(prompt.systemPrompt, resolved),
      resolved,
    ),
    user: interpolateVariables(
      processConditionalBlocks(prompt.userPromptTemplate, resolved),
      resolved,
    ),
  }
}

/**
 * slide-content 场景提示词（移植自上游 scene-prompts.ts）。
 * 本项目无媒体生成通道：image/generatedImage/generatedVideo 恒 false，
 * 模板中对应条件块整体移除，只保留画布契约与文本/形状/线条/latex 规则。
 */
export function buildSlideContentPrompt({ imageElementEnabled = false, generatedImageEnabled = false, generatedVideoEnabled = false } = {}, userVariables = {}) {
  return buildPrompt(PROMPT_IDS.SLIDE_CONTENT, {
    ...userVariables,
    canvas_width: SLIDE_CANVAS.width,
    canvas_height: SLIDE_CANVAS.height,
    imageElementEnabled,
    generatedImageEnabled,
    generatedVideoEnabled,
    mediaElementEnabled: imageElementEnabled || generatedVideoEnabled,
  })
}
