#!/usr/bin/env node
// release.mjs：yondern-psycho-frame 两包锁步发布脚本（零依赖，Node ≥ 18.20）。
// 用法：pnpm release <major|minor|patch|premajor|preminor|prepatch|prerelease|X.Y.Z>
//              [--preview] [--publish] [--push]
// 步骤：预检 → pnpm install → bump 两包 + 模板 pin → verify/doctor → pack 预检
//      → commit + tag →（--publish）按序双发 →（--push）推 origin main + tag。
// 默认只做本地 bump/commit/tag，不发布不推送；--preview 完全只读。
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const CORE = 'yondern-psycho-frame'
const SHIM = 'create-yondern-psycho-frame'
const CORE_PKG = path.join('packages', 'psycho-frame', 'package.json')
const SHIM_PKG = path.join('packages', 'create-yondern-psycho-frame', 'package.json')
const TEMPLATE_PKG = path.join('packages', 'psycho-frame', 'template', 'package.json')
const BUMP_TYPES = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease']
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/

const USAGE = `用法: pnpm release <bump> [--preview] [--publish] [--push]

  bump      major | minor | patch | premajor | preminor | prepatch | prerelease | X.Y.Z
  --preview 只读预览：打印将写入的版本与步骤，不落盘不执行
  --publish 实际 npm 发布两包（默认跳过，仅本地 bump/commit/tag）
  --push    推 origin main 与 tag（默认跳过；推送前校验远程 OID 未变）

默认不发布不推送；真实发布用: pnpm release patch --publish --push`

// ---------- 小工具 ----------

function fail(msg) {
  console.error(`release: ${msg}`)
  process.exit(1)
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: ['inherit', 'pipe', 'pipe'], encoding: 'utf8', ...opts })
  if (r.error) fail(`执行 ${cmd} 失败: ${r.error.message}`)
  return r
}

function mustOk(r, what) {
  if (r.status !== 0) {
    const tail = (r.stderr || '').trim().split('\n').slice(-4).join(' | ')
    fail(`${what} 失败（exit ${r.status}）${tail ? `：${tail}` : ''}`)
  }
  return r
}

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'))
  } catch {
    fail(`无法读取 ${rel}`)
  }
}

function writeJson(rel, obj) {
  fs.writeFileSync(path.join(root, rel), JSON.stringify(obj, null, 2) + '\n')
}

function git(args) {
  return mustOk(run('git', args, { cwd: root }), `git ${args[0]}`).stdout.trim()
}

function gitMaybe(args) {
  return run('git', args, { cwd: root })
}

// ---------- 版本计算 ----------

function parseSemver(v) {
  const m = SEMVER_RE.exec(v)
  if (!m) return null
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), pre: m[4] ?? '' }
}

function bumpVersion(current, type) {
  const cur = parseSemver(current)
  if (!cur) fail(`当前版本 ${current} 不是合法 semver`)
  const { major, minor, patch, pre } = cur
  let next
  switch (type) {
    case 'major': next = `${major + 1}.0.0`; break
    case 'minor': next = `${major}.${minor + 1}.0`; break
    case 'patch': next = `${major}.${minor}.${patch + 1}`; break
    case 'premajor': next = `${major + 1}.0.0-0`; break
    case 'preminor': next = `${major}.${minor + 1}.0-0`; break
    case 'prepatch': next = `${major}.${minor}.${patch + 1}-0`; break
    case 'prerelease': {
      const preNum = pre.match(/(\d+)$/)
      const n = preNum ? Number(preNum[1]) + 1 : 0
      next = preNum
        ? `${major}.${minor}.${patch}-${pre.slice(0, pre.length - preNum[1].length)}${n}`
        : `${major}.${minor}.${patch + 1}-0`
      break
    }
    default: fail(`未知 bump 类型 ${type}`)
  }
  if (!parseSemver(next)) fail(`bump 结果 ${next} 不是合法 semver`)
  if (compareSemver(next, current) <= 0) fail(`新版本 ${next} 未大于当前 ${current}`)
  return next
}

function compareSemver(a, b) {
  const pa = parseSemver(a); const pb = parseSemver(b)
  for (const k of ['major', 'minor', 'patch']) {
    if (pa[k] !== pb[k]) return pa[k] > pb[k] ? 1 : -1
  }
  if (pa.pre === pb.pre) return 0
  if (pa.pre === '') return 1
  if (pb.pre === '') return -1
  return pa.pre > pb.pre ? 1 : -1
}

function templatePin(next) {
  return next.includes('-') ? next : `^${next}`
}

// ---------- 参数 ----------

const args = process.argv.slice(2)
const flags = new Set(args.filter(a => a.startsWith('--')))
const positional = args.filter(a => !a.startsWith('--'))
if (flags.has('--help') || flags.has('-h')) { console.log(USAGE); process.exit(0) }
for (const f of flags) {
  if (!['--preview', '--publish', '--push'].includes(f)) fail(`未知选项 ${f}（见 --help）`)
}
if (positional.length !== 1) fail(`需要一个 bump 参数（见 --help）\n\n${USAGE}`)
const bumpArg = positional[0]
const preview = flags.has('--preview')
const doPublish = flags.has('--publish')
const doPush = flags.has('--push')

// ---------- 仓库定位与预检 ----------

const topR = run('git', ['rev-parse', '--show-toplevel'])
if (topR.status !== 0) fail('不在 git 仓库内；请在仓库 checkout 中运行')
const root = topR.stdout.trim()
const scriptPkg = readJson('package.json')
if (scriptPkg.name !== 'yondern-psycho-frame-workspace') {
  fail(`git 根 ${root} 不是本仓库（root package 名为 ${scriptPkg.name}）`)
}

const status = gitMaybe(['status', '--porcelain']).stdout.trim()
if (status !== '') fail('工作区不干净，先提交或还原再发布')

const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'])
if (branch !== 'main') fail(`当前分支 ${branch}，发布只允许在 main 上`)

const remoteOid = run('git', ['ls-remote', 'origin', 'refs/heads/main'])
const ahead = gitMaybe(['log', '--oneline', 'origin/main..HEAD']).stdout.trim()
if (ahead !== '') fail('本地有未推送提交，先对齐 origin/main 再发布')
const originOid = remoteOid.status === 0 ? remoteOid.stdout.trim().split(/\s/)[0] : null
if (!originOid) console.warn('release: 警告：无法读取 origin/main，推送前租约校验将跳过')

// ---------- 读取与校验当前版本 ----------

const coreJson = readJson(CORE_PKG)
const shimJson = readJson(SHIM_PKG)
const templateJson = readJson(TEMPLATE_PKG)
const current = coreJson.version
if (coreJson.name !== CORE) fail(`${CORE_PKG} 的 name 不是 ${CORE}`)
if (shimJson.name !== SHIM) fail(`${SHIM_PKG} 的 name 不是 ${SHIM}`)
if (shimJson.version !== current) fail(`两包版本不一致：${CORE}=${current}，${SHIM}=${shimJson.version}`)
const curPin = templateJson.devDependencies?.[CORE]
if (curPin !== `^${current}` && curPin !== current) {
  fail(`模板 pin ${curPin} 与当前版本 ${current} 不同步（应为 ^${current}）`)
}

const next = BUMP_TYPES.includes(bumpArg) ? bumpVersion(current, bumpArg)
  : (parseSemver(bumpArg) && compareSemver(bumpArg, current) > 0
      ? bumpArg
      : fail(`${bumpArg} 不是合法 bump 类型或未大于当前版本 ${current}`))
const pin = templatePin(next)

console.log(`release: ${CORE} ${current} → ${next}（模板 pin ${curPin} → ${pin}）`)

if (preview) {
  console.log('release: [preview] 将写入：')
  console.log(`  ${CORE_PKG}         version ${current} → ${next}`)
  console.log(`  ${SHIM_PKG} version ${current} → ${next}`)
  console.log(`  ${TEMPLATE_PKG} devDependencies[${CORE}] ${curPin} → ${pin}`)
  console.log('release: [preview] 将执行：pnpm install → verify → doctor → pack 预检 → commit + tag v' + next +
    (doPublish ? ' → 双发' : '') + (doPush ? ' → push' : '（未加 --publish/--push，跳过发布与推送）'))
  process.exit(0)
}

// ---------- 依赖就位 ----------

// workspace: 协议转换需要 install 后的链接状态；--frozen-lockfile 防止锁文件漂移。
const pnpmCheck = run('pnpm', ['--version'])
if (pnpmCheck.status !== 0) fail('未找到 pnpm；先安装 pnpm（packageManager 为 pnpm@11.20.0）')
mustOk(run('pnpm', ['install', '--frozen-lockfile'], { cwd: root }), 'pnpm install')

// ---------- bump 三处 ----------

coreJson.version = next
shimJson.version = next
templateJson.devDependencies[CORE] = pin
writeJson(CORE_PKG, coreJson)
writeJson(SHIM_PKG, shimJson)
writeJson(TEMPLATE_PKG, templateJson)

// ---------- 门禁 ----------

const cli = path.join(root, 'packages', 'psycho-frame', 'src', 'cli.mjs')
mustOk(run(process.execPath, [cli, 'verify'], { cwd: root }), 'verify:docs 门禁')
mustOk(run(process.execPath, [cli, 'doctor'], { cwd: root }), 'doctor 检查')

// ---------- pack 预检 ----------

function packAndInspect(rel, filter) {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'release-pack-'))
  const r = mustOk(run('pnpm', ['--filter', filter, 'pack', '--pack-destination', dest], { cwd: root }),
    `${filter} pack`)
  const tgz = r.stdout.trim().split('\n').filter(l => l.trim().endsWith('.tgz')).pop()
  if (!tgz) fail(`${filter} pack 未输出 tarball 路径`)
  const file = path.isAbsolute(tgz) ? tgz : path.join(dest, tgz)
  const entries = run('tar', ['-tzf', file]).stdout.trim().split('\n')
  if (entries.some(e => e.endsWith('/.gitignore'))) {
    fail(`${filter} tarball 含 .gitignore 条目（npm pack 会丢弃），模板须用无点 gitignore`)
  }
  const pkgJson = run('tar', ['-xzOf', file, 'package/package.json']).stdout
  const pkg = JSON.parse(pkgJson)
  if (pkg.name !== filter) fail(`${filter} tarball 内 name 为 ${pkg.name}`)
  if (pkg.version !== next) fail(`${filter} tarball 内 version ${pkg.version} ≠ ${next}`)
  return { pkg, file, dest }
}

const coreTarball = packAndInspect(CORE_PKG, CORE)
const inner = run('tar', ['-xzOf', coreTarball.file, 'package/template/package.json']).stdout
const innerPin = JSON.parse(inner).devDependencies?.[CORE]
if (innerPin !== pin) fail(`核心包 tarball 内模板 pin ${innerPin} ≠ ${pin}`)

const shimTarball = packAndInspect(SHIM_PKG, SHIM)
const shimDep = shimTarball.pkg.dependencies?.[CORE]
if (shimDep === undefined || shimDep.includes('workspace:')) {
  fail(`shim tarball 依赖 ${CORE} 为 ${shimDep}，workspace: 协议未转换`)
}
if (!next.includes('-') && shimDep !== pin) {
  fail(`shim tarball 依赖 ${CORE}=${shimDep}，期望 ${pin}`)
}
console.log(`release: pack 预检通过（${CORE} tarball 模板 pin ${innerPin}；shim 依赖固化 ${shimDep}）`)

// ---------- commit + tag ----------

const bumped = [CORE_PKG, SHIM_PKG, TEMPLATE_PKG]
git(['add', ...bumped])
git(['commit', '-m', `chore(release): 两包升 ${next}、模板 devDep 同步 [publish-release-script]`])
git(['tag', '-a', `v${next}`, '-m', `${CORE} v${next}`])
console.log(`release: 已提交并打 tag v${next}`)

// ---------- 发布（可选） ----------

if (!doPublish) {
  console.log('release: 未加 --publish，跳过 npm 发布。')
  console.log(`release: 发布命令：pnpm publish --filter ${CORE} --no-git-checks && pnpm publish --filter ${SHIM} --no-git-checks`)
  if (doPush) console.log('release: 注意：--publish 未给出时 --push 也不执行')
  process.exit(0)
}

for (const name of [CORE, SHIM]) {
  mustOk(run('pnpm', ['publish', '--filter', name, '--no-git-checks'], { cwd: root }),
    `发布 ${name}`)
  console.log(`release: ${name}@${next} 已发布`)
}

// ---------- 推送（可选） ----------

if (!doPush) {
  console.log('release: 未加 --push，跳过推送 origin。')
  console.log(`release: 推送命令：git push origin main v${next}`)
  process.exit(0)
}

if (originOid) {
  const nowOid = run('git', ['ls-remote', 'origin', 'refs/heads/main']).stdout.trim().split(/\s/)[0]
  if (nowOid !== originOid) fail(`origin/main 已变化（${originOid} → ${nowOid}），租约失效，拒绝推送`)
}
git(['push', 'origin', 'main'])
git(['push', 'origin', `v${next}`])
console.log(`release: 已推送 origin main 与 v${next}，发布完成。`)
