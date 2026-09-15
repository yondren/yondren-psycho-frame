// 工作模式：六把正交开关——纪律 plan（on/off）、confirmAmbiguous（true/false）、fleet（on/off）、
// merge（off/ask/auto），加两条轴 audience（expert/product/novice）与 engineering（on/off）。
// 真源在 <root>/.psycho-frame.json 的 workMode 字段，缺省用内置默认；取值封闭，由本模块校验，
// verify 门禁与 mode CLI 共用；新增开关只改 MODES 表。语义与耦合矩阵见 docs/modes.md。
// config 读取也收敛在这里（verify-docs 复用）。
// 用法: import { readWorkMode, setWorkMode, validateWorkMode, readConfig } from './work-mode.mjs'
import fs from 'node:fs'
import path from 'node:path'

/** 开关表：默认值与封闭取值同源，键顺序即 mode CLI 的回显顺序。 */
const MODES = {
  plan: { values: ['on', 'off'], default: 'on' },
  confirmAmbiguous: { values: [true, false], default: true },
  fleet: { values: ['on', 'off'], default: 'off' },
  merge: { values: ['off', 'ask', 'auto'], default: 'ask' },
  audience: { values: ['expert', 'product', 'novice'], default: 'expert' },
  engineering: { values: ['on', 'off'], default: 'off' },
}

export const DEFAULT_WORK_MODE = Object.freeze(
  Object.fromEntries(Object.entries(MODES).map(([key, mode]) => [key, mode.default])),
)
export const PLAN_VALUES = MODES.plan.values
export const CONFIRM_VALUES = MODES.confirmAmbiguous.values
export const FLEET_VALUES = MODES.fleet.values
export const MERGE_VALUES = MODES.merge.values
export const AUDIENCE_VALUES = MODES.audience.values
export const ENGINEERING_VALUES = MODES.engineering.values

export function configPath(root) {
  return path.join(root, '.psycho-frame.json')
}

export function readConfig(root) {
  const p = configPath(root)
  if (!fs.existsSync(p)) return {}
  let cfg = null
  try {
    cfg = JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (e) {
    throw new Error(`.psycho-frame.json: JSON 解析失败: ${e.message}`)
  }
  if (cfg === null || typeof cfg !== 'object' || Array.isArray(cfg)) {
    throw new Error('.psycho-frame.json: 顶层必须为对象')
  }
  return cfg
}

/** 校验 workMode 取值（undefined 合法，表示未配置）；返回错误列表。 */
export function validateWorkMode(value) {
  const errors = []
  if (value === undefined) return errors
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`workMode 必须为 { ${Object.keys(MODES).join(', ')} } 对象`)
    return errors
  }
  for (const [key, mode] of Object.entries(MODES)) {
    const v = value[key]
    if (v !== undefined && !mode.values.includes(v)) {
      errors.push(`workMode.${key} 必须为 ${mode.values.join(' / ')}（现为 ${JSON.stringify(v)}）`)
    }
  }
  return errors
}

export function readWorkMode(root) {
  const wm = readConfig(root).workMode ?? {}
  return Object.fromEntries(Object.entries(MODES).map(([key, mode]) => [key, wm[key] ?? mode.default]))
}

/** 合并 patch 进配置的 workMode 并写回；patch 非法时返回 { ok: false, errors }。 */
export function setWorkMode(root, patch) {
  const errors = validateWorkMode(patch)
  if (errors.length > 0) return { ok: false, errors }
  const cfg = readConfig(root)
  const prev = cfg.workMode
  const base = prev !== null && typeof prev === 'object' && !Array.isArray(prev) ? prev : {}
  cfg.workMode = { ...base, ...patch }
  fs.writeFileSync(configPath(root), JSON.stringify(cfg, null, 2) + '\n', 'utf8')
  return { ok: true, workMode: readWorkMode(root) }
}
