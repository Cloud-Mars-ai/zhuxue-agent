/**
 * test-demo-seed.mjs — demoSeed 幂等注入计划的确定性回归测试
 * 运行：npm run test:demo-seed
 *
 * 覆盖：
 * 1. 空列表 → 两份样例全注入，有理数在前；
 * 2. 老用户已有管理课程 → 只补插有理数，且排在已有课程之前；
 * 3. 两份都在 → 不重复注入；
 * 4. 删过的样例 → 不复活；
 * 5. 容量受限（room）→ 按顺序截断，不超限；
 * 6. 脏数据（非数组/null）→ 容错不炸。
 */
import { planDemoSeed, DEMO_SEED_IDS } from '../src/utils/demoSeed.js'

let passed = 0
let failed = 0

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) {
    passed += 1
    console.log(`  ✓ ${name}`)
  } else {
    failed += 1
    console.log(`  ✗ ${name}\n     期望: ${JSON.stringify(expected)}\n     实际: ${JSON.stringify(actual)}`)
  }
}

const RATIONAL = 'course-demo-youshushu'
const MGMT = 'course-demo-mw815lqq'

// 1. 全新用户：两份全注入，有理数在前
check(
  '空列表注入两份样例（有理数在前）',
  planDemoSeed({ existingIds: [], dismissedIds: [] }),
  [RATIONAL, MGMT],
)

// 2. 老用户：本地已有管理课程（含进度），只补有理数
check(
  '老用户已有管理课程时只补有理数',
  planDemoSeed({ existingIds: [MGMT, 'course-own-001'], dismissedIds: [] }),
  [RATIONAL],
)

// 3. 两份都在：不重复注入
check(
  '两份都在时不重复注入',
  planDemoSeed({ existingIds: [MGMT, RATIONAL, 'course-own-001'], dismissedIds: [] }),
  [],
)

// 4. 用户删过有理数：不复活；管理仍在则补管理
check(
  '删过的有理数不复活',
  planDemoSeed({ existingIds: ['course-own-001'], dismissedIds: [RATIONAL] }),
  [MGMT],
)
check(
  '两份都删过则不再注入',
  planDemoSeed({ existingIds: ['course-own-001'], dismissedIds: [RATIONAL, MGMT] }),
  [],
)

// 5. 容量受限：room=1 只注入排在前面的有理数
check(
  '容量只剩 1 条时只注入有理数',
  planDemoSeed({ existingIds: [], dismissedIds: [], room: 1 }),
  [RATIONAL],
)
check(
  '容量为 0 时不注入',
  planDemoSeed({ existingIds: [], dismissedIds: [], room: 0 }),
  [],
)

// 6. 脏数据容错
check(
  'existingIds/dismissedIds 为 null 不炸',
  planDemoSeed({ existingIds: null, dismissedIds: null }),
  [RATIONAL, MGMT],
)
check(
  '无参调用返回全量',
  planDemoSeed(),
  [RATIONAL, MGMT],
)

// 7. DEMO_SEED_IDS 顺序契约：有理数必须是第一个
check('DEMO_SEED_IDS 有理数在前', DEMO_SEED_IDS[0], RATIONAL)

console.log(`\ndemo-seed 测试：${passed} 通过，${failed} 失败`)
if (failed > 0) process.exit(1)
