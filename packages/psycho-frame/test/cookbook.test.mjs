import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { newCookbook, cookbookText, SLUG_RE, DEFAULT_BUDGET } from '../src/cookbook.mjs'
import { gitFixture, tempDir, write } from './helpers.mjs'

const quiet = () => {}
const readIndex = root => fs.readFileSync(path.join(root, 'docs/cookbook/README.md'), 'utf8')
const readConfig = root => JSON.parse(fs.readFileSync(path.join(root, '.psycho-frame.json'), 'utf8'))

test('SLUG_RE 与 cookbookText：全小写连字符、骨架含编号步骤与验证清单', () => {
  assert.ok(SLUG_RE.test('shared-toolchain'))
  for (const bad of ['Shared', 'a_b', '-a', '']) assert.equal(SLUG_RE.test(bad), false, bad)
  const text = cookbookText({ title: '共享工具链' })
  assert.match(text, /^# 共享工具链\n/)
  for (const section of ['## 1. 触发场景', '## 2. 前置', '## 3. 步骤', '## 4. 失败与回退', '## 验证清单']) {
    assert.ok(text.includes(section), `骨架应含 ${section}`)
  }
})

test('newCookbook：写骨架、登记索引、登记预算', () => {
  const root = gitFixture()
  const r = newCookbook({ root, slug: 'demo-flow', title: '演示流程', stdout: quiet })
  assert.equal(r.ok, true)
  assert.equal(r.exitCode, 0)
  assert.equal(r.created, true)
  assert.equal(r.budget, DEFAULT_BUDGET)

  const text = fs.readFileSync(path.join(root, 'docs/cookbook/demo-flow.md'), 'utf8')
  assert.match(text, /^# 演示流程\n/)
  assert.match(text, /## 验证清单/)

  const index = readIndex(root)
  assert.match(index, /- \[demo-flow\.md\]\(demo-flow\.md\) — 演示流程/)
  assert.ok(index.indexOf('demo-flow.md') > index.indexOf('submit-pr.md'), '新条目追加在既有条目之后')

  assert.equal(readConfig(root).budgets['docs/cookbook/demo-flow.md'], DEFAULT_BUDGET)
})

test('newCookbook：重复执行幂等，索引不重复、预算不覆盖', () => {
  const root = gitFixture()
  newCookbook({ root, slug: 'demo-flow', title: '演示流程', stdout: quiet })
  const again = newCookbook({ root, slug: 'demo-flow', title: '改过的标题', budget: 999, stdout: quiet })
  assert.equal(again.ok, true)
  assert.equal(again.created, false)
  assert.equal(again.budget, null)

  const index = readIndex(root)
  assert.equal(index.split('\n').filter(line => line.includes('](demo-flow.md)')).length, 1, '索引只出现一次')
  assert.equal(readConfig(root).budgets['docs/cookbook/demo-flow.md'], DEFAULT_BUDGET)
  assert.match(fs.readFileSync(path.join(root, 'docs/cookbook/demo-flow.md'), 'utf8'), /^# 演示流程\n/)
})

test('newCookbook：自定义预算写入配置', () => {
  const root = gitFixture()
  newCookbook({ root, slug: 'ci-cache', title: 'CI 缓存', budget: 550, stdout: quiet })
  assert.equal(readConfig(root).budgets['docs/cookbook/ci-cache.md'], 550)
})

test('newCookbook：slug 与预算非法退出码 2 且不落盘', () => {
  const root = gitFixture()
  const badSlug = newCookbook({ root, slug: 'Bad_Slug', stdout: quiet })
  assert.equal(badSlug.exitCode, 2)
  assert.equal(fs.existsSync(path.join(root, 'docs/cookbook/Bad_Slug.md')), false)
  const badBudget = newCookbook({ root, slug: 'ok-slug', budget: 0, stdout: quiet })
  assert.equal(badBudget.exitCode, 2)
  assert.equal(fs.existsSync(path.join(root, 'docs/cookbook/ok-slug.md')), false)
})

test('newCookbook：缺 docs/cookbook/ 时报错', () => {
  const root = tempDir()
  const r = newCookbook({ root, slug: 'demo-flow', stdout: quiet })
  assert.equal(r.ok, false)
  assert.equal(r.exitCode, 1)
  assert.match(r.errors[0], /没有 docs\/cookbook\//)
})

test('newCookbook：配置未启用 budgets 时跳过预算登记', () => {
  const root = gitFixture()
  write(root, '.psycho-frame.json', JSON.stringify({ workMode: { plan: 'on' } }))
  const r = newCookbook({ root, slug: 'demo-flow', title: '演示流程', stdout: quiet })
  assert.equal(r.ok, true)
  assert.equal(r.budget, null)
  assert.equal(readConfig(root).budgets, undefined)
})

test('newCookbook：配置损坏时报错而不抛异常', () => {
  const root = gitFixture()
  write(root, '.psycho-frame.json', '{ nope')
  const r = newCookbook({ root, slug: 'demo-flow', stdout: quiet })
  assert.equal(r.ok, false)
  assert.match(r.errors[0], /JSON 解析失败/)
})

test('newCookbook：缺索引文件时仍写骨架', () => {
  const root = gitFixture()
  fs.rmSync(path.join(root, 'docs/cookbook/README.md'))
  const r = newCookbook({ root, slug: 'demo-flow', stdout: quiet })
  assert.equal(r.ok, true)
  assert.ok(fs.existsSync(path.join(root, 'docs/cookbook/demo-flow.md')))
})
