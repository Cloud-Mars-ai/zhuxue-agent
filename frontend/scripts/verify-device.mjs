// 临时判定表单测：node scripts/verify-device.mjs
import { matchDeviceType, BREAKPOINTS, treeOf } from '../src/utils/device.js'

const UA = {
  iPhone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  androidPhone:
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  iPad: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/604.1',
  iPadDesktopMode:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  androidTablet:
    'Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  winChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
}

const cases = [
  // [说明, UA, 视口宽, 触摸点, 期望类型]
  ['iPhone 竖屏', UA.iPhone, 390, 5, 'phone'],
  ['iPhone 横屏（UA 优先）', UA.iPhone, 844, 5, 'phone'],
  ['Android 手机', UA.androidPhone, 412, 5, 'phone'],
  ['iPad 竖屏', UA.iPad, 810, 5, 'tablet'],
  ['iPad 桌面模式（Macintosh UA + 触摸）', UA.iPadDesktopMode, 1194, 5, 'tablet'],
  ['Android 平板', UA.androidTablet, 800, 5, 'tablet'],
  ['Windows 桌面', UA.winChrome, 1920, 0, 'desktop'],
  ['桌面窗口拖窄到 1000px', UA.winChrome, 1000, 0, 'tablet'],
  ['桌面窗口拖窄到 500px', UA.winChrome, 500, 0, 'phone'],
  ['Mac Safari（无触摸，非平板）', UA.macSafari, 1440, 0, 'desktop'],
  ['视口恰好 767px', UA.winChrome, 767, 0, 'phone'],
  ['视口恰好 768px', UA.winChrome, 768, 0, 'tablet'],
  ['视口恰好 1199px', UA.winChrome, 1199, 0, 'tablet'],
  ['视口恰好 1200px', UA.winChrome, 1200, 0, 'desktop'],
]

let failed = 0
for (const [name, ua, width, touch, expect] of cases) {
  const got = matchDeviceType(ua, width, touch)
  const ok = got === expect
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  → ${got}${ok ? '' : `（期望 ${expect}）`}`)
}

const treeCases = [
  ['phone → mobile 树', treeOf('phone'), 'mobile'],
  ['tablet → web 树', treeOf('tablet'), 'web'],
  ['desktop → web 树', treeOf('desktop'), 'web'],
]
for (const [name, got, expect] of treeCases) {
  const ok = got === expect
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
}

console.log(`\n断点: phoneMax=${BREAKPOINTS.phoneMax}, tabletMax=${BREAKPOINTS.tabletMax}`)
console.log(failed === 0 ? '全部通过' : `${failed} 个用例失败`)
process.exit(failed === 0 ? 0 : 1)
