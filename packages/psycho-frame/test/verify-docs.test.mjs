import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { verifyDocs, countWords } from '../src/verify-docs.mjs'
import { fixtureRepo, write, remove, decisionText, taskText } from './helpers.mjs'

const errs = root => verifyDocs(root).errors
const has = (errors, needle) =>
  assert.ok(errors.some(e => e.includes(needle)), `期望错误包含 ${needle}，实际：\n${errors.join('\n') || '<无>'}`)

test('countWords：CJK 逐字、拉丁/数字串逐词、标点不计', () => {
  assert.equal(countWords('中文 abc'), 3)
  assert.equal(countWords('0.3.1 gate-budget-tests'), 2)
  assert.equal(countWords('## --- |'), 0)
  assert.equal(countWords(''), 0)
})

test('合法骨架零错误', () => {
  assert.deepEqual(errs(fixtureRepo()), [])
})

// ---------- 链接与锚点 ----------

test('链接目标不存在', () => {
  const root = fixtureRepo()
  write(root, 'docs/note.md', '# 笔记\n\n见 [缺失](missing.md)。\n')
  has(errs(root), '链接目标不存在: missing.md')
})

test('锚点不存在', () => {
  const root = fixtureRepo()
  write(root, 'docs/other.md', '# 别的\n')
  write(root, 'docs/note.md', '# 笔记\n\n见 [错锚](other.md#nothere)。\n')
  has(errs(root), '锚点不存在')
})

test('中文标题锚点可解析', () => {
  const root = fixtureRepo()
  write(root, 'docs/other.md', '# 中文标题\n')
  write(root, 'docs/note.md', '# 笔记\n\n见 [对](other.md#中文标题)。\n')
  assert.deepEqual(errs(root), [])
})

test('引用式定义缺失', () => {
  const root = fixtureRepo()
  write(root, 'docs/note.md', '# 笔记\n\n见 [文字][nope]。\n')
  has(errs(root), '引用定义缺失')
})

test('Windows 绝对路径不可移植', () => {
  const root = fixtureRepo()
  write(root, 'docs/note.md', '# 笔记\n\n见 [x](C:\\tmp\\a.md)。\n')
  has(errs(root), '不可移植的绝对路径')
})

// ---------- 决策记录 ----------

test('决策：未知生命周期目录', () => {
  const root = fixtureRepo()
  write(root, 'decisions/someday/process/2026-01-01-x.md', decisionText())
  has(errs(root), '未知生命周期目录')
})

test('决策：未知类别目录', () => {
  const root = fixtureRepo()
  write(root, 'decisions/implemented/nope/2026-01-01-x.md', decisionText())
  has(errs(root), '未知类别目录 "nope"')
})

test('决策：文件名日期非法', () => {
  const root = fixtureRepo()
  write(root, 'decisions/implemented/process/2026-13-40-x.md', decisionText())
  has(errs(root), '文件名必须为 yyyy-mm-dd-主题.md')
})

test('决策：首行不是 Agent Note', () => {
  const root = fixtureRepo()
  write(root, 'decisions/implemented/process/2026-01-01-x.md', decisionText().replace('# Agent Note: 测试决策', '# 测试决策'))
  has(errs(root), '第 1 行必须为 "# Agent Note: <标题>"')
})

test('决策：缺必需章节', () => {
  const root = fixtureRepo()
  write(root, 'decisions/implemented/process/2026-01-01-x.md',
    decisionText({ sections: ['## Problem', '## Decision', '## Alternatives considered'] }))
  has(errs(root), '缺少章节 ## Consequences')
})

test('决策：implemented 禁止提案期章节', () => {
  const root = fixtureRepo()
  write(root, 'decisions/implemented/process/2026-01-01-x.md',
    decisionText({ sections: ['## Problem', '## Decision', '## Alternatives considered', '## Consequences', '## Proposal'] }))
  has(errs(root), '是提案期章节')
})

test('决策：Status 行必须唯一', () => {
  const root = fixtureRepo()
  write(root, 'decisions/implemented/process/2026-01-01-x.md', `${decisionText()}\nStatus: implemented\n`)
  has(errs(root), '必须全文唯一')
})

test('决策：proposed 生命周期合规通过', () => {
  const root = fixtureRepo()
  remove(root, 'decisions/implemented/process/2026-01-01-sample.md')
  write(root, 'decisions/proposed/process/2026-01-01-x.md',
    decisionText({ status: 'proposed', sections: ['## Problem', '## Proposal', '## Alternatives considered', '## Acceptance criteria', '## Risks'] }))
  assert.deepEqual(errs(root), [])
})

test('决策：archived 头部合规与冻结', () => {
  const root = fixtureRepo()
  remove(root, 'decisions/implemented/process/2026-01-01-sample.md')
  write(root, 'decisions/archived/process/2026-01-01-x.md', '# Agent Note: 旧决策\n\nStatus: implemented\nArchived: 2026-02-01\n\n## Problem\n\n只有头部被复查。\n')
  assert.deepEqual(errs(root), [])
})

test('决策：归档日期早于文件名日期', () => {
  const root = fixtureRepo()
  write(root, 'decisions/archived/process/2026-03-01-x.md', '# Agent Note: 旧决策\n\nStatus: implemented\nArchived: 2026-02-01\n\n## Problem\n\n。\n')
  has(errs(root), '归档日期 2026-02-01 早于文件名日期 2026-03-01')
})

// ---------- 任务头字段 ----------

test('任务：状态不在封闭集合', () => {
  const root = fixtureRepo()
  write(root, 'tasks/2026-01-01-sample.md', taskText({ status: 'RUNNING' }))
  has(errs(root), 'status "RUNNING" 不在')
})

test('任务：task_key 与文件名后缀不一致', () => {
  const root = fixtureRepo()
  write(root, 'tasks/2026-01-01-sample.md', taskText({ key: 'other' }))
  has(errs(root), '与文件名后缀 "sample" 不一致')
})

test('任务：缺少 report 字段', () => {
  const root = fixtureRepo()
  write(root, 'tasks/2026-01-01-sample.md', taskText({ report: null }))
  has(errs(root), '缺少头字段 - report:')
})

test('任务：report 必须指向 reports/<task_key>.md', () => {
  const root = fixtureRepo()
  write(root, 'reports/other.md', '# 别的报告\n')
  write(root, 'tasks/2026-01-01-sample.md', taskText({ report: '../reports/other.md' }))
  has(errs(root), 'report 必须指向 reports/sample.md（现为 reports/other.md）')
})

test('任务：report 必须为链接形式', () => {
  const root = fixtureRepo()
  write(root, 'tasks/2026-01-01-sample.md',
    taskText().replace('[reports/sample.md](../reports/sample.md)', 'reports/sample.md'))
  has(errs(root), 'report 必须为 [reports/sample.md](../reports/sample.md) 形式的链接')
})

test('任务：task_key 必须全小写连字符', () => {
  const root = fixtureRepo()
  write(root, 'tasks/2026-01-01-BadKey.md', taskText({ key: 'BadKey' }))
  has(errs(root), '必须全小写连字符')
})

// ---------- 字数预算 ----------

test('预算：超出上限', () => {
  const root = fixtureRepo({ config: JSON.stringify({ budgets: { 'AGENTS.md': 2 } }) })
  has(errs(root), '超出预算 2')
})

test('预算：清单内文件缺失', () => {
  const root = fixtureRepo({ config: JSON.stringify({ budgets: { 'docs/gone.md': 100 } }) })
  has(errs(root), '预算清单中的文件缺失')
})

test('预算：上限必须为正整数', () => {
  const root = fixtureRepo({ config: JSON.stringify({ budgets: { 'AGENTS.md': 0 } }) })
  has(errs(root), '预算必须为正整数')
})

test('预算：按 CJK 计数生效', () => {
  const root = fixtureRepo({ config: JSON.stringify({ budgets: { 'AGENTS.md': 20 } }) })
  // “# AGENTS.md\n\n常驻命令。” = CJK 4 字 + 拉丁 1 词 = 5，预算 20 应通过
  assert.deepEqual(errs(root), [])
})

// ---------- 配置与工作模式 ----------

test('配置：JSON 损坏时返回干净错误而非抛栈', () => {
  const root = fixtureRepo({ config: '{ not json' })
  const errors = errs(root)
  assert.equal(errors.length, 1)
  assert.match(errors[0], /JSON 解析失败/)
})

test('配置：预算必须为对象', () => {
  const root = fixtureRepo({ config: JSON.stringify({ budgets: [1, 2] }) })
  has(errs(root), 'budgets 必须为')
})

test('工作模式：取值非法', () => {
  const root = fixtureRepo({ config: JSON.stringify({ workMode: { plan: 'maybe' } }) })
  has(errs(root), 'workMode.plan 必须为')
})

test('工作模式：fleet 取值非法', () => {
  const root = fixtureRepo({ config: JSON.stringify({ workMode: { fleet: 'always' } }) })
  has(errs(root), 'workMode.fleet 必须为')
})

test('工作模式：merge 取值非法', () => {
  const root = fixtureRepo({ config: JSON.stringify({ workMode: { merge: 'always' } }) })
  has(errs(root), 'workMode.merge 必须为')
})

test('ignore：前缀命中的文件被跳过', () => {
  const root = fixtureRepo({ config: JSON.stringify({ ignore: ['docs/'] }) })
  write(root, 'docs/note.md', '# 笔记\n\n[坏链](missing.md)\n')
  assert.deepEqual(errs(root), [])
})

test('count 返回扫描到的 Markdown 文件数', () => {
  const root = fixtureRepo()
  assert.equal(verifyDocs(root).count, 5)
  assert.equal(path.basename(root).startsWith('pf-test-'), true)
})
