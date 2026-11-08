/**
 * OpenMAIC 接入管线 barrel。
 *
 * 上游：THU-MAIC/OpenMAIC packages/@openmaic/generation@0.3.29（MIT）。
 * 移植范围与适配边界见 docs/research/openmaic-integration-design.md。
 */

export {
  PROMPT_IDS,
  SLIDE_CANVAS,
  buildPrompt,
  buildSlideContentPrompt,
  interpolateVariables,
  loadPrompt,
  processConditionalBlocks,
  processSnippets,
} from './promptEngine.js'

export {
  parseJsonResponse,
  repairJsonLight,
  stripReasoningPrefix,
} from './jsonRepair.js'

export {
  DEFAULT_MAX_DELAY_MS,
  isAbortError,
  isRetryableGenerationError,
  withGenerationRetry,
} from './generationRetry.js'

export {
  DEFAULT_LANGUAGE_DIRECTIVE,
  OPENMAIC_SCENE_TYPES,
  OPENMAIC_WIDGET_TYPES,
  applyOutlineFallbacks,
  buildOutlinePrompt,
  generateSceneOutlines,
  mapSceneType,
  normalizeSceneOutlines,
  sanitizeProceduralSkillOutline,
} from './outlineGenerator.js'

export {
  adaptOpenmaicQuestions,
  extractWidgetConfig,
  generateOpenmaicScene,
  pblToLesson,
  widgetConfigToLesson,
} from './sceneGenerator.js'

export { slideElementsToLesson } from './slideAdapter.js'

export {
  checkScientificModel,
  extractScientificModel,
  normalizeScientificModel,
} from './scientificModel.js'

export { OPENMAIC_ASSET_VERSION, OPENMAIC_SNIPPETS, OPENMAIC_TEMPLATES } from './promptAssets.js'
