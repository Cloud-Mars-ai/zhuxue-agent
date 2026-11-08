/**
 * alias-hooks.mjs —— 让 node 脚本能直接 import 本项目 src/ 下的模块。
 *
 * 解决两件事：
 * 1. `@/` 别名（vite 配置里的 @ → src/）；
 * 2. 源码里大量 extensionless 相对导入（'./shared'、'@/utils/board'）。
 *
 * 用法（在入口脚本里）：
 *   import { register } from 'node:module'
 *   register('./lib/alias-hooks.mjs', import.meta.url)
 * 或用 --import 预加载 register-alias.mjs。
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SRC_URL = new URL('../../src/', import.meta.url)

function firstExisting(urls) {
  for (const url of urls) {
    try {
      if (existsSync(fileURLToPath(url))) return url
    } catch {
      // 非法路径（如 URL 编码问题）跳过
    }
  }
  return null
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2)
    const hit = firstExisting([
      new URL(rel, SRC_URL),
      new URL(`${rel}.js`, SRC_URL),
      new URL(`${rel}/index.js`, SRC_URL),
    ])
    if (hit) return { url: hit.href, shortCircuit: true }
  }
  if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    !/\.(js|mjs|json|css|vue)$/.test(specifier)
  ) {
    const hit = firstExisting([
      new URL(specifier, context.parentURL),
      new URL(`${specifier}.js`, context.parentURL),
      new URL(`${specifier}/index.js`, context.parentURL),
    ])
    if (hit) return { url: hit.href, shortCircuit: true }
  }
  return nextResolve(specifier, context)
}
