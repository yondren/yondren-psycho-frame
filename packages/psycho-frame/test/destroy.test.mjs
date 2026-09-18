import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  scanSecrets,
  destroyChecks,
  runCheck,
  activeTask,
  destroyGate,
  ALLOW_SECRET_MARKER,
  NESTED_ENV,
} from '../src/destroy.mjs'
import { startTask } from '../src/worktree.mjs'
import { gitFixture, gitIn, write, tempDir, decisionText } from './helpers.mjs'

const quiet = () => {}
const fakeToken = prefix => [prefix, '_', 'A'.repeat(36)].join('')
const fakePemHeader = ['-----BEGIN', 'RSA', 'PRIVATE KEY-----'].join(' ')

/** 毁灭模式下合规的 worktree：任务卡 + 决策记录 + 含 task_key 的提交；矩阵默认置空便于隔离断言。 */
function destroyFixture({ key = 'demo-task', destroyChecks = [] } = {}) {
  const root = gitFixture()
  startTask({ root, key, date: '2026-01-02', stdout: quiet })
  const wt = path.join(root, '.worktrees', key)
  setDestroyChecks(wt, destroyChecks)
  write(wt, 'decisions/implemented/process/2026-01-02-demo.md', decisionText({ title: '演示决策' }))
  write(wt, 'packages/app/note.md', '# 笔记\n\n正文。\n')
  gitIn(wt, 'add', '-A')
  gitIn(wt, 'commit', '-q', '-m', `feat(app): 演示改动 [${key}]`)
  return { root, wt, key }
}

/** 改写 worktree 内的 .psycho-frame.json（模板自带 destroyChecks，测试里显式覆盖）。 */
function setDestroyChecks(root, destroyChecks) {
  const cfgPath = path.join(root, '.psycho-frame.json')
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  cfg.destroyChecks = destroyChecks
  fs.writeFileSync(cfgPath, `${JSON.stringify(cfg, null, 2)}\n`)
  return cfg
}

/** 矩阵断言要在"非嵌套"环境下跑：测试本身可能就是被 destroyChecks 调起来的。 */
function withoutNested(fn) {
  const saved = process.env[NESTED_ENV]
  delete process.env[NESTED_ENV]
  try {
    return fn()
  } finally {
    if (saved !== undefined) process.env[NESTED_ENV] = saved
  }
}

test('scanSecrets：命中模式、尊重豁免标记、跳过二进制与缺失文件', () => {
  const root = tempDir()
  const token = fakeToken('ghp')
  write(root, 'a.txt', `token = ${token}\n`)
  write(root, 'b.txt', `${fakePemHeader} ${ALLOW_SECRET_MARKER}\n`)
  write(root, 'c.txt', '普通内容\n')
  fs.writeFileSync(path.join(root, 'bin.dat'), Buffer.from([0, 1, 2, 3]))
  const errors = scanSecrets(root, ['a.txt', 'b.txt', 'c.txt', 'bin.dat', 'missing.txt'])
  assert.equal(errors.length, 1)
  assert.match(errors[0], /a\.txt:1: 疑似GitHub token/)
  assert.equal(errors[0].includes(token), false, '错误信息不得回显凭据内容')
})

test('scanSecrets：AWS、OpenAI、Slack 与私钥模式都命中', () => {
  const root = tempDir()
  write(root, 'k.txt', [
    ['AKIA', 'A'.repeat(16)].join(''),
    ['sk-', 'b'.repeat(30)].join(''),
    ['xoxb', '-1234567890', 'abcdefghij'].join(''),
  ].join('\n'))
  const errors = scanSecrets(root, ['k.txt'])
  assert.equal(errors.length, 3)
  assert.ok(errors.some(e => /疑似AWS access key id/.test(e)))
  assert.ok(errors.some(e => /疑似OpenAI 风格密钥/.test(e)))
  assert.ok(errors.some(e => /疑似Slack token/.test(e)))
})

test('destroyChecks：未配置为空、非法配置报错、拒绝 verify 自身', () => {
  assert.deepEqual(destroyChecks({}), [])
  assert.deepEqual(destroyChecks({ destroyChecks: ['pnpm test'] }), ['pnpm test'])
  assert.throws(() => destroyChecks({ destroyChecks: 'pnpm test' }), /非空字符串数组/)
  assert.throws(() => destroyChecks({ destroyChecks: ['  '] }), /非空字符串数组/)
  assert.throws(() => destroyChecks({ destroyChecks: ['psycho-frame verify'] }), /自递归/)
  assert.throws(() => destroyChecks({ destroyChecks: ['pnpm verify:docs'] }), /自递归/)
})

test('runCheck：成功与失败都带回执，失败只报退出码', () => {
  const root = tempDir()
  assert.equal(runCheck(root, 'node -e "process.exit(0)"').ok, true)
  const bad = runCheck(root, 'node -e "process.exit(3)"')
  assert.equal(bad.ok, false)
  assert.match(bad.detail, /退出码 3/)
})

test('activeTask：分支名优先，其次唯一 IN_PROGRESS 任务', () => {
  const { root, wt, key } = destroyFixture()
  assert.equal(activeTask(wt).key, key)
  assert.equal(activeTask(root), null, '主 checkout 在 main 上且无 IN_PROGRESS 卡')
})

test('destroyGate：合规 worktree 通过，缺 --base 直接失败', () => {
  const { wt } = destroyFixture({ destroyChecks: [] })
  const missing = destroyGate(wt, {})
  assert.ok(missing.errors.some(e => /显式 --base/.test(e)))
  const gate = destroyGate(wt, { base: 'main' })
  assert.deepEqual(gate.errors, [])
  assert.deepEqual(gate.checks, [])
})

test('destroyGate：改动面没有决策记录即失败（微小改动豁免不适用）', () => {
  const root = gitFixture()
  startTask({ root, key: 'nodesc', date: '2026-01-02', stdout: quiet })
  const wt = path.join(root, '.worktrees', 'nodesc')
  write(wt, 'packages/app/note.md', '# 笔记\n')
  gitIn(wt, 'add', '-A')
  gitIn(wt, 'commit', '-q', '-m', 'feat(app): 只改代码 [nodesc]')
  const gate = destroyGate(wt, { base: 'main' })
  assert.ok(gate.errors.some(e => /至少新增或更新一条决策记录/.test(e)), gate.errors.join('\n'))
})

test('destroyGate：提交不含 task_key 即失败', () => {
  const { wt } = destroyFixture()
  write(wt, 'packages/app/more.md', '# 更多\n')
  gitIn(wt, 'add', '-A')
  gitIn(wt, 'commit', '-q', '-m', 'feat(app): 忘了 task_key')
  const gate = destroyGate(wt, { base: 'main' })
  assert.ok(gate.errors.some(e => /不含 task_key/.test(e)), gate.errors.join('\n'))
})

test('destroyGate：改动面命中凭据即失败', () => {
  const { wt } = destroyFixture()
  write(wt, 'packages/app/leak.md', `token: ${fakeToken('ghp')}\n`)
  gitIn(wt, 'add', '-A')
  gitIn(wt, 'commit', '-q', '-m', 'feat(app): 带上了密钥 [demo-task]')
  const gate = destroyGate(wt, { base: 'main' })
  assert.ok(gate.errors.some(e => /疑似GitHub token/.test(e)), gate.errors.join('\n'))
})

test('destroyGate：destroyChecks 失败即门禁失败，嵌套调用跳过矩阵', () => {
  const { wt } = destroyFixture({ destroyChecks: ['node -e "process.exit(3)"'] })

  withoutNested(() => {
    const gate = destroyGate(wt, { base: 'main' })
    assert.equal(gate.checks.length, 1)
    assert.equal(gate.checks[0].ok, false)
    assert.ok(gate.errors.some(e => /毁灭矩阵失败/.test(e)), gate.errors.join('\n'))

    process.env[NESTED_ENV] = '1'
    try {
      const nested = destroyGate(wt, { base: 'main' })
      assert.deepEqual(nested.checks, [])
      assert.ok(nested.notes.some(n => /跳过 destroyChecks/.test(n)))
    } finally {
      delete process.env[NESTED_ENV]
    }
  })
})

test('destroyGate：destroyChecks 配置非法时报配置错误', () => {
  const { wt } = destroyFixture({ destroyChecks: 'pnpm test' })
  const gate = destroyGate(wt, { base: 'main' })
  assert.ok(gate.errors.some(e => /destroyChecks 必须为非空字符串数组/.test(e)), gate.errors.join('\n'))
})

test('destroyGate：worktree 纪律违规并入毁灭门禁', () => {
  const { root, wt } = destroyFixture()
  write(root, 'tasks/2026-01-02-lonely.md', '# 任务\n\n- task_key: lonely\n- status: IN_PROGRESS\n')
  const gate = destroyGate(wt, { base: 'main' })
  assert.ok(gate.errors.some(e => /lonely 为 IN_PROGRESS 但没有 worktree/.test(e)), gate.errors.join('\n'))
})

test('destroyGate：base 无法解析时报改动面错误', () => {
  const { wt } = destroyFixture()
  const gate = destroyGate(wt, { base: 'no-such-ref' })
  assert.ok(gate.errors.some(e => /无法读取改动面/.test(e)), gate.errors.join('\n'))
})

test('destroyGate：配置损坏时报错而不抛异常', () => {
  const { wt } = destroyFixture()
  write(wt, '.psycho-frame.json', '{ nope')
  const gate = destroyGate(wt, { base: 'main' })
  assert.ok(gate.errors.some(e => /JSON 解析失败/.test(e)), gate.errors.join('\n'))
})
