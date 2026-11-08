/** register-alias.mjs —— 预加载别名解析钩子（配合 node --import 使用）。 */
import { register } from 'node:module'

register('./alias-hooks.mjs', import.meta.url)
