import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

process.env.RUNTIME_NODE_MODULES =
  'C:/Users/24358/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES =
  process.env.RUNTIME_NODE_MODULES

const workspaceDir = 'D:/黑客松/经管Agent'
const skillDir =
  'D:/chatting_records/Chatgpt/plugins/cache/openai-primary-runtime/presentations/26.1030.10813/skills/presentations'
const runtimePython =
  'C:/Users/24358/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
const candidatePath =
  'D:/黑客松/经管Agent/output/presentations/zhuxue-defense-candidate.pptx'
const finalPath =
  'D:/黑客松/经管Agent/output/presentations/智慧学伴答辩-final-v3.pptx'
const stagingDir = path.join(workspaceDir, 'tmp', 'presentation-finalizer')
const receiptPath = path.join(stagingDir, 'validation-v3.json')

await fs.mkdir(stagingDir, { recursive: true })
await fs.mkdir(path.dirname(finalPath), { recursive: true })

const { finalizePresentation } = await import(
  pathToFileURL(path.join(skillDir, 'container_tools/artifact_tool_utils.mjs')).href
)

const requirements = {
  explicitTotalSlideCount: 10,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  requiredEmbeddedWorkbookChartOwnerSlides: [],
  tableArithmeticContracts: [],
  materializeLiteralChartWorkbooks: false,
}

const result = await finalizePresentation({
  ...requirements,
  workspaceDir,
  candidatePath,
  finalPath,
  pythonExecutable: runtimePython,
  integrityValidatorPath: path.join(
    skillDir,
    'container_tools/inspect_presentation_package_integrity.py',
  ),
  layoutValidatorPath: path.join(
    skillDir,
    'container_tools/inspect_presentation_layout_geometry.py',
  ),
  layoutArgs: [
    '--expected-slide-size-emu',
    '12192000,6858000',
    '--validate-bullet-geometry',
    '--validate-heading-fit',
  ],
  fontPolicy: {
    basis: 'design',
    families: ['Aptos'],
  },
  verifyArtifactToolImport: true,
  receiptPath,
})

console.log(JSON.stringify({ result, finalPath, receiptPath }, null, 2))
