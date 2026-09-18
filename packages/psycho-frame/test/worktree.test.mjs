import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  startTask,
  checkWorktrees,
  listWorktrees,
  currentBranch,
  hooksPathOf,
  ensureWorktreesIgnored,
  findTaskCard,
  readTaskCards,
  isLinkedWorktree,
  TASK_KEY_RE,
} from '../src/worktree.mjs'
import { gitFixture, gitIn, write, tempDir } from './helpers.mjs'

const wtPath = (root, key) => path.join(root, '.worktrees', key)
const quiet = () => {}

test('TASK_KEY_RE：全小写连字符', () => {
  assert.ok(TASK_KEY_RE.test('destroy-gate'))
  assert.ok(TASK_KEY_RE.test('a1'))
  for (const bad of ['Destroy', 'a_b', 'a b', '-a', 'a-', '']) assert.equal(TASK_KEY_RE.test(bad), false, bad)
})

test('startTask：一条命令建 worktree、分支、任务卡、报告与 hooks 隔离', () => {
  const root = gitFixture()
  const r = startTask({ root, key: 'demo-task', date: '2026-01-02', stdout: quiet })
  assert.equal(r.ok, true)
  assert.equal(r.exitCode, 0)
  assert.equal(r.base, 'main')
  assert.equal(r.created, true)

  const wt = wtPath(root, 'demo-task')
  assert.ok(fs.existsSync(wt), 'worktree 目录应存在')
  assert.equal(currentBranch(wt), 'demo-task')
  assert.ok(fs.existsSync(path.join(wt, 'tasks/2026-01-02-demo-task.md')))
  assert.ok(fs.existsSync(path.join(wt, 'reports/demo-task.md')))
  assert.match(hooksPathOf(wt), /hooks-demo-task$/)
  assert.equal(hooksPathOf(root), null, '主 checkout 的 hooksPath 不应被代设')
  assert.equal(findTaskCard(wt, 'demo-task').status, 'IN_PROGRESS')
  assert.ok(listWorktrees(root).some(w => w.branch === 'demo-task'))
})

test('startTask：重复执行幂等，不重复建分支', () => {
  const root = gitFixture()
  startTask({ root, key: 'demo-task', date: '2026-01-02', stdout: quiet })
  const again = startTask({ root, key: 'demo-task', stdout: quiet })
  assert.equal(again.ok, true)
  assert.equal(again.created, false)
  assert.equal(listWorktrees(root).filter(w => w.branch === 'demo-task').length, 1)
})

test('startTask：非法 task_key 退出码 2，缺 base 时报错不落盘', () => {
  const root = gitFixture()
  const bad = startTask({ root, key: 'Bad_Key', stdout: quiet })
  assert.equal(bad.exitCode, 2)
  assert.equal(fs.existsSync(path.join(root, '.worktrees')), false)
  const noBase = startTask({ root, key: 'demo', base: 'nope', stdout: quiet })
  assert.equal(noBase.ok, false)
  assert.match(noBase.errors[0], /无法解析为 commit/)
})

test('startTask：linked worktree 内拒绝再开 worktree', () => {
  const root = gitFixture()
  startTask({ root, key: 'demo-task', date: '2026-01-02', stdout: quiet })
  const wt = wtPath(root, 'demo-task')
  assert.equal(isLinkedWorktree(wt), true)
  assert.equal(isLinkedWorktree(root), false)
  const r = startTask({ root: wt, key: 'other-task', stdout: quiet })
  assert.equal(r.ok, false)
  assert.match(r.errors[0], /linked worktree/)
})

test('startTask：非 git 目录直接失败', () => {
  const r = startTask({ root: tempDir(), key: 'demo', stdout: quiet })
  assert.equal(r.ok, false)
  assert.match(r.errors[0], /不是 git 仓库/)
})

test('checkWorktrees：startTask 之后纪律合规', () => {
  const root = gitFixture()
  startTask({ root, key: 'demo-task', date: '2026-01-02', stdout: quiet })
  const { issues } = checkWorktrees(root)
  assert.deepEqual(issues, [])
})

test('checkWorktrees：常驻骨架（无任务、无 worktree）也合规', () => {
  const root = gitFixture()
  assert.deepEqual(checkWorktrees(root).issues, [])
})

test('checkWorktrees：分支上的过期任务卡不覆盖主 checkout 的新状态', () => {
  const root = gitFixture()
  // 主 checkout 上先有一个 IN_PROGRESS 任务，随后被另一个任务分支取走
  write(root, 'tasks/2026-01-02-other.md', '# 任务\n\n- task_key: other\n- status: IN_PROGRESS\n')
  gitIn(root, 'add', '-A')
  gitIn(root, 'commit', '-q', '-m', 'docs(task): 登记 other [other]')
  startTask({ root, key: 'worker', date: '2026-01-02', stdout: quiet })
  // other 在主 checkout 上完成（分支上仍是过期的 IN_PROGRESS）
  write(root, 'tasks/2026-01-02-other.md', '# 任务\n\n- task_key: other\n- status: DONE\n')
  gitIn(root, 'add', '-A')
  gitIn(root, 'commit', '-q', '-m', 'docs(task): other 置 DONE [other]')

  const fromWorktree = checkWorktrees(wtPath(root, 'worker'))
  assert.ok(
    !fromWorktree.issues.some(i => /other 为 IN_PROGRESS 但没有 worktree/.test(i)),
    fromWorktree.issues.join('\n'),
  )
})

test('checkWorktrees：IN_PROGRESS 无 worktree 报违规', () => {
  const root = gitFixture()
  write(root, 'tasks/2026-01-02-lonely.md', '# 任务\n\n- task_key: lonely\n- status: IN_PROGRESS\n')
  const { issues } = checkWorktrees(root)
  assert.equal(issues.length, 1)
  assert.match(issues[0], /lonely 为 IN_PROGRESS 但没有 worktree/)
})

test('checkWorktrees：DONE 留 worktree 报违规', () => {
  const root = gitFixture()
  startTask({ root, key: 'demo-task', date: '2026-01-02', stdout: quiet })
  const wt = wtPath(root, 'demo-task')
  const card = path.join(wt, 'tasks/2026-01-02-demo-task.md')
  fs.writeFileSync(card, fs.readFileSync(card, 'utf8').replace('- status: IN_PROGRESS', '- status: DONE'))
  const { issues } = checkWorktrees(root)
  assert.ok(issues.some(i => /已 DONE 仍留着 worktree/.test(i)), issues.join('\n'))
})

test('checkWorktrees：孤儿 worktree 报违规', () => {
  const root = gitFixture()
  gitIn(root, 'worktree', 'add', '.worktrees/orphan', '-b', 'orphan', 'main')
  const { issues } = checkWorktrees(root)
  assert.ok(issues.some(i => /没有对应的任务卡/.test(i)), issues.join('\n'))
})

test('checkWorktrees：未设 hooksPath 与 hooksPath 重复都报违规', () => {
  const root = gitFixture()
  startTask({ root, key: 'first', date: '2026-01-02', stdout: quiet })
  gitIn(root, 'worktree', 'add', '.worktrees/second', '-b', 'second', 'main')
  const { issues } = checkWorktrees(root)
  assert.ok(issues.some(i => /未设置 worktree 级 core\.hooksPath/.test(i)), issues.join('\n'))

  gitIn(wtPath(root, 'second'), 'config', '--worktree', 'core.hooksPath', hooksPathOf(wtPath(root, 'first')))
  const dup = checkWorktrees(root)
  assert.ok(dup.issues.some(i => /core\.hooksPath 与 .* 相同/.test(i)), dup.issues.join('\n'))
})

test('checkWorktrees：根 checkout 检出任务分支报违规', () => {
  const root = gitFixture()
  write(root, 'tasks/2026-01-02-rootside.md', '# 任务\n\n- task_key: rootside\n- status: NOT_STARTED\n')
  gitIn(root, 'checkout', '-q', '-b', 'rootside')
  const { issues } = checkWorktrees(root)
  assert.ok(issues.some(i => /根 checkout 检出了任务分支 rootside/.test(i)), issues.join('\n'))
})

test('checkWorktrees：BLOCKED / DEFERRED 必须写原因', () => {
  const root = gitFixture()
  write(root, 'tasks/2026-01-02-stuck.md', '# 任务\n\n- task_key: stuck\n- status: BLOCKED\n')
  const { issues } = checkWorktrees(root)
  assert.ok(issues.some(i => /BLOCKED 必须写明原因/.test(i)), issues.join('\n'))
})

test('readTaskCards：解析 task_key 与 status', () => {
  const root = gitFixture()
  write(root, 'tasks/2026-01-02-demo.md', '# 任务\n\n- task_key: demo\n- status: IN_PROGRESS\n')
  const cards = readTaskCards(root)
  assert.deepEqual(cards.map(c => [c.key, c.status]), [['demo', 'IN_PROGRESS']])
  assert.equal(findTaskCard(root, 'missing'), null)
})

test('ensureWorktreesIgnored：缺失时补一行，已存在时不重复写', () => {
  const root = gitFixture()
  fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules\n')
  const first = ensureWorktreesIgnored(root, { write: true })
  assert.equal(first.changed, true)
  assert.match(fs.readFileSync(path.join(root, '.gitignore'), 'utf8'), /\.worktrees\//)
  const second = ensureWorktreesIgnored(root, { write: true })
  assert.equal(second.changed, false)
})

test('checkWorktrees：.worktrees/ 未忽略时报违规', () => {
  const root = gitFixture()
  fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules\n')
  const { issues } = checkWorktrees(root)
  assert.ok(issues.some(i => /未被 \.gitignore 忽略/.test(i)), issues.join('\n'))
})
