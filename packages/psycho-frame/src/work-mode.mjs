// 工作模式：plan（on/off）与 confirmAmbiguous（true/false）两把正交开关，真源在
// <root>/.psycho-frame.json 的 workMode 字段，缺省用内置默认；取值封闭，由本模块
// 校验，verify 门禁与 mode CLI 共用。config 读取也收敛在这里（verify-docs 复用）。
// 用法: import { readWorkMode, setWorkMode, validateWorkMode, readConfig } from './work-mode.mjs'
import fs from 'node:fs'
import path from 'node:path'

export const DEFAULT_WORK_MODE = Object.freeze({ plan: 'on', confirmAmbiguous: true })
export const PLAN_VALUES = ['on', 'off']
export const CONFIRM_VALUES = [true, false]

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
    errors.push('workMode 必须为 { plan, confirmAmbiguous } 对象')
    return errors
  }
  if (value.plan !== undefined && !PLAN_VALUES.includes(value.plan)) {
    errors.push(`workMode.plan 必须为 ${PLAN_VALUES.join(' / ')}（现为 ${JSON.stringify(value.plan)}）`)
  }
  if (value.confirmAmbiguous !== undefined && !CONFIRM_VALUES.includes(value.confirmAmbiguous)) {
    errors.push(`workMode.confirmAmbiguous 必须为 true / false（现为 ${JSON.stringify(value.confirmAmbiguous)}）`)
  }
  return errors
}

export function readWorkMode(root) {
  const wm = readConfig(root).workMode ?? {}
  return {
    plan: wm.plan ?? DEFAULT_WORK_MODE.plan,
    confirmAmbiguous: wm.confirmAmbiguous ?? DEFAULT_WORK_MODE.confirmAmbiguous,
  }
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
