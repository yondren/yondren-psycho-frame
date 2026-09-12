import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  readConfig,
  readWorkMode,
  setWorkMode,
  validateWorkMode,
  configPath,
  DEFAULT_WORK_MODE,
} from '../src/work-mode.mjs'
import { tempDir, write } from './helpers.mjs'

test('validateWorkMode：undefined 合法（用内置默认）', () => {
  assert.deepEqual(validateWorkMode(undefined), [])
})

test('validateWorkMode：非对象非法', () => {
  assert.equal(validateWorkMode(null).length, 1)
  assert.equal(validateWorkMode(['on']).length, 1)
  assert.match(validateWorkMode('on')[0], /必须为 \{ plan, confirmAmbiguous \} 对象/)
})

test('validateWorkMode：取值封闭', () => {
  assert.deepEqual(validateWorkMode({ plan: 'off', confirmAmbiguous: false }), [])
  assert.match(validateWorkMode({ plan: 'maybe' })[0], /workMode.plan/)
  assert.match(validateWorkMode({ confirmAmbiguous: 'yes' })[0], /workMode.confirmAmbiguous/)
})

test('readConfig：缺失返回空对象', () => {
  assert.deepEqual(readConfig(tempDir()), {})
})

test('readConfig：JSON 损坏抛错', () => {
  const root = tempDir()
  write(root, '.psycho-frame.json', '{ nope')
  assert.throws(() => readConfig(root), /JSON 解析失败/)
})

test('readConfig：顶层必须是对象', () => {
  const root = tempDir()
  write(root, '.psycho-frame.json', '[]')
  assert.throws(() => readConfig(root), /顶层必须为对象/)
})

test('readWorkMode：未配置时用默认', () => {
  assert.deepEqual(readWorkMode(tempDir()), { ...DEFAULT_WORK_MODE })
})

test('setWorkMode：写入并可增量合并', () => {
  const root = tempDir()
  const first = setWorkMode(root, { plan: 'off' })
  assert.equal(first.ok, true)
  assert.deepEqual(first.workMode, { plan: 'off', confirmAmbiguous: true })
  const second = setWorkMode(root, { confirmAmbiguous: false })
  assert.equal(second.ok, true)
  assert.deepEqual(second.workMode, { plan: 'off', confirmAmbiguous: false })
  assert.deepEqual(readWorkMode(root), { plan: 'off', confirmAmbiguous: false })
})

test('setWorkMode：保留配置中的其他键', () => {
  const root = tempDir()
  write(root, '.psycho-frame.json', JSON.stringify({ decisionClasses: ['feature'], workMode: { plan: 'on' } }))
  setWorkMode(root, { plan: 'off' })
  const cfg = readConfig(root)
  assert.deepEqual(cfg.decisionClasses, ['feature'])
  assert.equal(cfg.workMode.plan, 'off')
})

test('setWorkMode：非法 patch 不落盘', () => {
  const root = tempDir()
  const result = setWorkMode(root, { plan: 'maybe' })
  assert.equal(result.ok, false)
  assert.match(result.errors[0], /workMode.plan/)
  assert.equal(fs.existsSync(configPath(root)), false)
})

test('setWorkMode：损坏的既有配置会抛错（不静默覆盖）', () => {
  const root = tempDir()
  write(root, '.psycho-frame.json', '{ nope')
  assert.throws(() => setWorkMode(root, { plan: 'off' }), /JSON 解析失败/)
})
