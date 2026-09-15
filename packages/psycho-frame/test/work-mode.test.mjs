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
  assert.match(
    validateWorkMode('on')[0],
    /必须为 \{ plan, confirmAmbiguous, fleet, merge, audience, engineering \} 对象/,
  )
})

test('validateWorkMode：取值封闭', () => {
  assert.deepEqual(
    validateWorkMode({
      plan: 'off',
      confirmAmbiguous: false,
      fleet: 'on',
      merge: 'auto',
      audience: 'product',
      engineering: 'on',
    }),
    [],
  )
  assert.match(validateWorkMode({ plan: 'maybe' })[0], /workMode.plan/)
  assert.match(validateWorkMode({ confirmAmbiguous: 'yes' })[0], /workMode.confirmAmbiguous/)
  assert.match(validateWorkMode({ fleet: 'maybe' })[0], /workMode.fleet/)
  assert.match(validateWorkMode({ merge: 'always' })[0], /workMode.merge/)
  assert.match(validateWorkMode({ audience: 'manager' })[0], /workMode.audience/)
  assert.match(validateWorkMode({ engineering: 'yes' })[0], /workMode.engineering/)
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

test('readWorkMode：fleet 缺省补 off，配置值优先', () => {
  const root = tempDir()
  write(root, '.psycho-frame.json', JSON.stringify({ workMode: { plan: 'off' } }))
  assert.equal(readWorkMode(root).fleet, 'off')
  setWorkMode(root, { fleet: 'on' })
  assert.equal(readWorkMode(root).fleet, 'on')
})

test('readWorkMode：merge 缺省补 ask，配置值优先', () => {
  const root = tempDir()
  write(root, '.psycho-frame.json', JSON.stringify({ workMode: { plan: 'on' } }))
  assert.equal(readWorkMode(root).merge, 'ask')
  setWorkMode(root, { merge: 'auto' })
  assert.equal(readWorkMode(root).merge, 'auto')
  setWorkMode(root, { merge: 'off' })
  assert.equal(readWorkMode(root).merge, 'off')
})

test('readWorkMode：audience 缺省补 expert、engineering 缺省补 off，配置值优先', () => {
  const root = tempDir()
  write(root, '.psycho-frame.json', JSON.stringify({ workMode: { plan: 'off' } }))
  assert.equal(readWorkMode(root).audience, 'expert')
  assert.equal(readWorkMode(root).engineering, 'off')
  setWorkMode(root, { audience: 'novice' })
  setWorkMode(root, { engineering: 'on' })
  assert.equal(readWorkMode(root).audience, 'novice')
  assert.equal(readWorkMode(root).engineering, 'on')
  assert.equal(readWorkMode(root).plan, 'off')
})

test('setWorkMode：audience 非法取值不落盘', () => {
  const root = tempDir()
  const result = setWorkMode(root, { audience: 'manager' })
  assert.equal(result.ok, false)
  assert.match(result.errors[0], /workMode.audience/)
  assert.equal(fs.existsSync(configPath(root)), false)
})

test('setWorkMode：merge 非法取值不落盘', () => {
  const root = tempDir()
  const result = setWorkMode(root, { merge: 'always' })
  assert.equal(result.ok, false)
  assert.match(result.errors[0], /workMode.merge/)
  assert.equal(fs.existsSync(configPath(root)), false)
})

test('setWorkMode：fleet 非法取值不落盘', () => {
  const root = tempDir()
  const result = setWorkMode(root, { fleet: 'always' })
  assert.equal(result.ok, false)
  assert.match(result.errors[0], /workMode.fleet/)
  assert.equal(fs.existsSync(configPath(root)), false)
})

test('setWorkMode：写入并可增量合并', () => {
  const root = tempDir()
  const first = setWorkMode(root, { plan: 'off' })
  assert.equal(first.ok, true)
  assert.deepEqual(first.workMode, {
    plan: 'off',
    confirmAmbiguous: true,
    fleet: 'off',
    merge: 'ask',
    audience: 'expert',
    engineering: 'off',
  })
  const second = setWorkMode(root, { confirmAmbiguous: false })
  assert.equal(second.ok, true)
  assert.deepEqual(second.workMode, {
    plan: 'off',
    confirmAmbiguous: false,
    fleet: 'off',
    merge: 'ask',
    audience: 'expert',
    engineering: 'off',
  })
  assert.deepEqual(readWorkMode(root), {
    plan: 'off',
    confirmAmbiguous: false,
    fleet: 'off',
    merge: 'ask',
    audience: 'expert',
    engineering: 'off',
  })
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
