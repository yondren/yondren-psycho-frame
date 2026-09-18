import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { scaffold } from '../src/init.mjs'
import { startTask } from '../src/worktree.mjs'
import { NESTED_ENV } from '../src/destroy.mjs'
import { fixtureRepo, gitFixture, gitIn, tempDir, write, noop, decisionText } from './helpers.mjs'

const cli = fileURLToPath(new URL('../src/cli.mjs', import.meta.url))
// 清掉毁灭矩阵标记：测试可能在 destroyChecks 里被调用，不该因此跳过矩阵相关断言
const cleanEnv = () => {
  const env = { ...process.env }
  delete env[NESTED_ENV]
  return env
}
const runCli = (cwd, args, env = cleanEnv()) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8', env })

test('verify --json：通过时输出 ok=true', () => {
  const r = runCli(fixtureRepo(), ['verify', '--json'])
  assert.equal(r.status, 0)
  const out = JSON.parse(r.stdout)
  assert.equal(out.formatVersion, 1)
  assert.equal(out.ok, true)
  assert.deepEqual(out.errors, [])
  assert.ok(out.count > 0)
})

test('verify --json：失败时 ok=false 且带 errors', () => {
  const root = fixtureRepo({ config: '{ not json' })
  const r = runCli(root, ['verify', '--json'])
  assert.equal(r.status, 1)
  const out = JSON.parse(r.stdout)
  assert.equal(out.ok, false)
  assert.match(out.errors[0], /JSON 解析失败/)
})

test('verify：未知参数退出码 2', () => {
  const r = runCli(fixtureRepo(), ['verify', '--np'])
  assert.equal(r.status, 2)
  assert.match(r.stderr, /未知参数/)
})

test('mode CLI：默认回显七项，set fleet=on 与 merge=auto 落盘', () => {
  const root = fixtureRepo()
  const shown = runCli(root, ['mode'])
  assert.equal(shown.status, 0)
  assert.match(
    shown.stdout,
    /plan=on，confirmAmbiguous=true，fleet=off，merge=ask，destroy=off，audience=expert，engineering=off/,
  )
  const set = runCli(root, ['mode', 'set', 'fleet=on'])
  assert.equal(set.status, 0)
  assert.match(set.stdout, /fleet=on/)
  const cfg = JSON.parse(fs.readFileSync(path.join(root, '.psycho-frame.json'), 'utf8'))
  assert.equal(cfg.workMode.fleet, 'on')
  const merge = runCli(root, ['mode', 'set', 'merge=auto'])
  assert.equal(merge.status, 0)
  assert.match(merge.stdout, /merge=auto/)
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, '.psycho-frame.json'), 'utf8')).workMode.merge, 'auto')
})

test('mode CLI：一次设置两条新轴并落盘', () => {
  const root = fixtureRepo()
  const r = runCli(root, ['mode', 'set', 'audience=product', 'engineering=on'])
  assert.equal(r.status, 0)
  assert.match(r.stdout, /audience=product/)
  assert.match(r.stdout, /engineering=on/)
  const cfg = JSON.parse(fs.readFileSync(path.join(root, '.psycho-frame.json'), 'utf8'))
  assert.equal(cfg.workMode.audience, 'product')
  assert.equal(cfg.workMode.engineering, 'on')
  const reset = runCli(root, ['mode', 'reset'])
  assert.equal(reset.status, 0)
  assert.match(reset.stdout, /audience=expert，engineering=off/)
})

test('mode CLI：fleet 与 merge 非法取值退出码 1，未知键退出码 2', () => {
  const root = fixtureRepo()
  const bad = runCli(root, ['mode', 'set', 'fleet=maybe'])
  assert.equal(bad.status, 1)
  assert.match(bad.stderr, /workMode\.fleet 必须为/)
  const badMerge = runCli(root, ['mode', 'set', 'merge=always'])
  assert.equal(badMerge.status, 1)
  assert.match(badMerge.stderr, /workMode\.merge 必须为/)
  const badAudience = runCli(root, ['mode', 'set', 'audience=manager'])
  assert.equal(badAudience.status, 1)
  assert.match(badAudience.stderr, /workMode\.audience 必须为 expert \/ product \/ novice/)
  const badEngineering = runCli(root, ['mode', 'set', 'engineering=yes'])
  assert.equal(badEngineering.status, 1)
  assert.match(badEngineering.stderr, /workMode\.engineering 必须为/)
  const unknown = runCli(root, ['mode', 'set', 'merges=on'])
  assert.equal(unknown.status, 2)
  assert.match(unknown.stderr, /无法解析/)
})

test('mode help：展示 merge 取值、不含推送与两条新轴', () => {
  const r = runCli(fixtureRepo(), ['help', 'mode'])
  assert.equal(r.status, 0)
  assert.match(r.stdout, /merge=off\|ask\|auto/)
  assert.match(r.stdout, /不含推送/)
  assert.match(r.stdout, /destroy=on\|off/)
  assert.match(r.stdout, /audience=expert\|product\|novice/)
  assert.match(r.stdout, /docs\/modes\.md/)
})

test('mode CLI：destroy 取值封闭，非法值退出码 1', () => {
  const root = fixtureRepo()
  const on = runCli(root, ['mode', 'set', 'destroy=on'])
  assert.equal(on.status, 0)
  assert.match(on.stdout, /destroy=on/)
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, '.psycho-frame.json'), 'utf8')).workMode.destroy, 'on')
  const bad = runCli(root, ['mode', 'set', 'destroy=yes'])
  assert.equal(bad.status, 1)
  assert.match(bad.stderr, /workMode\.destroy 必须为/)
})

test('upgrade CLI：--dry-run 默认退出码 0，--exit-code 时为 1', () => {
  const cwd = tempDir()
  scaffold({ cwd, target: 'proj', mode: 'init', stdout: noop, stderr: noop })
  write(cwd, 'proj/AGENTS.md', '# 本地改过\n')
  const plain = runCli(cwd, ['upgrade', 'proj', '--dry-run'])
  assert.equal(plain.status, 0)
  const strict = runCli(cwd, ['upgrade', 'proj', '--dry-run', '--exit-code'])
  assert.equal(strict.status, 1)
})

test('upgrade help：说明 linked worktree 与框架源码仓库中止', () => {
  const r = runCli(fixtureRepo(), ['help', 'upgrade'])
  assert.equal(r.status, 0)
  assert.match(r.stdout, /linked worktree 中止/)
  assert.match(r.stdout, /框架源码仓库/)
})

test('upgrade CLI：未知参数与多目录都退出码 2', () => {
  const cwd = tempDir()
  assert.equal(runCli(cwd, ['upgrade', '--bogus']).status, 2)
  assert.match(runCli(cwd, ['upgrade', '--bogus']).stderr, /未知参数/)
  assert.equal(runCli(cwd, ['upgrade', 'a', 'b']).status, 2)
})

test('任意命令 --help/-h：打印该命令专属帮助且绝不执行命令', () => {
  const cwd = tempDir()
  const cases = [
    [['init', '--help'], /psycho-frame init/],
    [['adopt', '-h'], /psycho-frame adopt/],
    [['doctor', '--help'], /psycho-frame doctor/],
    [['verify', '--help'], /psycho-frame verify/],
    [['mode', '--help'], /psycho-frame mode/],
    [['upgrade', '--help'], /psycho-frame upgrade/],
    [['self-upgrade', '--help'], /psycho-frame self-upgrade/],
    [['version', '--help'], /psycho-frame version/],
  ]
  for (const [argv, expected] of cases) {
    const r = runCli(cwd, argv)
    assert.equal(r.status, 0, `${argv.join(' ')} 退出码应为 0`)
    assert.match(r.stdout, expected)
  }
  assert.deepEqual(fs.readdirSync(cwd), [], '--help 不得就地生成文件或目录')
})

test('未知命令带 --help 退出码 2', () => {
  const r = runCli(fixtureRepo(), ['bogus', '--help'])
  assert.equal(r.status, 2)
  assert.match(r.stderr, /未知命令/)
})

test('init/adopt/doctor：未知选项与多余目录参数退出码 2 且不落盘', () => {
  const cwd = tempDir()
  for (const argv of [['init', '--bogus'], ['init', 'a', 'b'], ['adopt', '-x'], ['doctor', 'a', 'b']]) {
    const r = runCli(cwd, argv)
    assert.equal(r.status, 2, `${argv.join(' ')} 退出码应为 2`)
    assert.match(r.stderr, /未知参数|最多提供一个目录参数/)
  }
  assert.deepEqual(fs.readdirSync(cwd), [], '参数非法时不得生成文件或目录')
})

test('verify CLI：--base 缺取值退出码 2', () => {
  const r = runCli(fixtureRepo(), ['verify', '--base'])
  assert.equal(r.status, 2)
  assert.match(r.stderr, /--base 需要一个 ref/)
})

test('task CLI：help、未知子命令与非法参数都退出码 2', () => {
  const root = gitFixture()
  const help = runCli(root, ['help', 'task'])
  assert.equal(help.status, 0)
  assert.match(help.stdout, /psycho-frame task start/)
  for (const argv of [
    ['task'],
    ['task', 'bogus'],
    ['task', 'start'],
    ['task', 'start', 'Bad_Key'],
    ['task', 'start', 'demo', '--bogus'],
    ['task', 'start', 'demo', '--base'],
    ['task', 'start', 'demo', 'extra'],
    ['task', 'check', '--np'],
  ]) {
    const r = runCli(root, argv)
    assert.equal(r.status, 2, `${argv.join(' ')} 退出码应为 2`)
    assert.match(r.stderr, /未知参数|必须提供 task_key|必须全小写连字符|最多提供一个|缺少取值|未知子命令/)
  }
  assert.equal(fs.existsSync(path.join(root, '.worktrees')), false, '参数非法时不得建 worktree')
})

test('task CLI：start 开 worktree 后 check 通过，重复 start 幂等', () => {
  const root = gitFixture()
  const start = runCli(root, ['task', 'start', 'demo-task'])
  assert.equal(start.status, 0, start.stderr)
  assert.match(start.stdout, /\.worktrees\/demo-task/)
  const check = runCli(root, ['task', 'check', '--json'])
  assert.equal(check.status, 0, check.stderr)
  const out = JSON.parse(check.stdout)
  assert.equal(out.ok, true)
  assert.deepEqual(out.issues, [])
  const again = runCli(root, ['task', 'start', 'demo-task'])
  assert.equal(again.status, 0)
  const list = runCli(root, ['task', 'check'])
  assert.match(list.stdout, /worktree 纪律通过/)
})

test('verify CLI：destroy=on 时要求 --base、跑 destroyChecks 并把 checks 写进 --json', () => {
  const root = gitFixture()
  const cfgPath = path.join(root, '.psycho-frame.json')
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  cfg.workMode.destroy = 'on'
  cfg.destroyChecks = ['node -e "process.exit(0)"']
  write(root, '.psycho-frame.json', `${JSON.stringify(cfg, null, 2)}\n`)
  gitIn(root, 'add', '-A')
  gitIn(root, 'commit', '-q', '-m', 'chore: 打开毁灭模式')

  startTask({ root, key: 'fixture', date: '2026-01-02', stdout: noop })
  const wt = path.join(root, '.worktrees', 'fixture')
  write(wt, 'decisions/implemented/process/2026-01-02-fixture.md', decisionText({ title: '毁灭演示' }))
  gitIn(wt, 'add', '-A')
  gitIn(wt, 'commit', '-q', '-m', 'feat: 毁灭演示 [fixture]')

  const noBase = runCli(wt, ['verify'])
  assert.equal(noBase.status, 1)
  assert.match(noBase.stderr, /显式 --base/)

  const ok = runCli(wt, ['verify', '--base', 'main', '--json'])
  assert.equal(ok.status, 0, ok.stderr)
  const out = JSON.parse(ok.stdout)
  assert.equal(out.destroy, true)
  assert.equal(out.checks.length, 1)
  assert.equal(out.checks[0].ok, true)
  assert.deepEqual(out.errors, [])

  // 矩阵失败时门禁失败
  cfg.destroyChecks = ['node -e "process.exit(3)"']
  write(wt, '.psycho-frame.json', `${JSON.stringify(cfg, null, 2)}\n`)
  const bad = runCli(wt, ['verify', '--base', 'main'])
  assert.equal(bad.status, 1)
  assert.match(bad.stderr, /毁灭矩阵失败/)
})
