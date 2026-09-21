#!/usr/bin/env node
// Local, resumable two-package release. No network mutation without --publish / --push.
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { parseSemver, compareSemver, bumpVersion } from '../packages/psycho-frame/src/semver.mjs'
import { verifyDocs } from '../packages/psycho-frame/src/verify-docs.mjs'
import { collectChangeScope } from '../packages/psycho-frame/src/change-scope.mjs'
import { scanContentSnapshots, destroyChecks } from '../packages/psycho-frame/src/destroy.mjs'
import { readConfig } from '../packages/psycho-frame/src/work-mode.mjs'
import { readTaskCards } from '../packages/psycho-frame/src/worktree.mjs'

const CORE = 'yondren-psycho-frame', SHIM = 'create-yondren-psycho-frame'
const FILES = ['packages/psycho-frame/package.json', 'packages/create-yondren-psycho-frame/package.json', 'packages/psycho-frame/template/package.json']
const BUMPS = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease']
const USAGE = `pnpm release <bump> --task-key=<key> [--prepare|--preview|--publish] [--push]
pnpm release --resume=<version> [--publish] [--push]
准备：校验远端精确基线，bump、测试、pack、受测 tarball、commit/tag。
恢复：核对 HEAD/tag/远端/摘要，跳过内容相同的已发布包，仅补发缺失包。
默认不发布不推送；--push 必须与 --publish 同用。状态保存在 Git common-dir/releases/<version>/。`
const integrity = file => 'sha512-' + createHash('sha512').update(fs.readFileSync(file)).digest('base64')
const assert = (value, message) => { if (!value) throw new Error(message) }

export function runRelease({ args = process.argv.slice(2), cwd = process.cwd(), execute = spawnSync, log = console.log } = {}) {
  if (args.includes('--help') || args.includes('-h')) { log(USAGE); return }
  const opts = {}, positional = []
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const at = arg.indexOf('='), key = at < 0 ? arg.slice(2) : arg.slice(2, at), value = at < 0 ? true : arg.slice(at + 1)
      assert(['prepare', 'preview', 'publish', 'push', 'task-key', 'resume'].includes(key), '未知选项：' + key)
      assert(!(key in opts), '重复选项：' + key)
      assert(['task-key', 'resume'].includes(key) ? typeof value === 'string' && value.length : value === true, '选项值非法：' + key)
      opts[key] = value
    } else positional.push(arg)
  }
  assert(!(opts.prepare && (opts.publish || opts.push || opts.resume)), '--prepare 与发布/恢复互斥')
  assert(!opts.push || opts.publish, '--push 必须与 --publish 同用')
  assert(opts.resume ? positional.length === 0 : positional.length === 1, '提供一个 bump 或 --resume=<version>')
  assert(!opts.resume || !opts['task-key'], '恢复使用原任务，不接受新 task-key')
  const run = (cmd, argv, allowFailure = false) => {
    const r = execute(cmd, argv, { cwd, encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 })
    assert(!r.error && (allowFailure || r.status === 0), cmd + ' ' + argv[0] + ' 失败（exit ' + String(r.status) + '；未回显外部输出）')
    return r
  }
  const git = argv => run('git', argv).stdout.trim()
  const root = git(['rev-parse', '--show-toplevel']); cwd = root
  const read = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'))
  const write = (file, obj) => fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n')
  assert(read('package.json').name === 'yondren-psycho-frame-workspace', '仅允许本框架仓库发布')
  assert(git(['branch', '--show-current']) === 'main', '发布只允许 main')
  assert(!git(['status', '--porcelain']), '工作区不干净；先提交或还原')
  const common = path.resolve(root, git(['rev-parse', '--git-common-dir']))
  assert(fs.realpathSync(common) === fs.realpathSync(path.resolve(root, git(['rev-parse', '--git-dir']))), '发布必须在主 checkout')
  const remoteRef = (remote, ref) => {
    const lines = run('git', ['ls-remote', '--refs', remote, ref]).stdout.trim().split('\n').filter(Boolean)
    assert(lines.length <= 1, '远端引用不唯一')
    if (!lines.length) return null
    const [oid, name] = lines[0].split(/\s+/)
    assert(/^[a-f0-9]{40,64}$/.test(oid) && name === ref, '远端引用结果非法')
    return oid
  }
  const head = git(['rev-parse', 'HEAD'])
  const origin = remoteRef('origin', 'refs/heads/main')
  assert(origin, '无法读取 origin/main；拒绝跳过远端校验')
  const current = read(FILES[0]).version
  const version = opts.resume ?? (BUMPS.includes(positional[0]) ? bumpVersion(current, positional[0]) : positional[0])
  assert(parseSemver(version), '版本不是合法 SemVer')
  const tag = 'v' + version, tagRef = 'refs/tags/' + tag
  const stateDir = path.join(common, 'releases', version), stateFile = path.join(stateDir, 'state.json')
  let state
  if (opts.resume) {
    assert(fs.existsSync(stateFile), '没有恢复记录：' + stateFile)
    state = JSON.parse(fs.readFileSync(stateFile, 'utf8'))
    assert(state.formatVersion === 1 && state.version === version && ['committed', 'prepared', 'publishing', 'published', 'origin-pushed', 'complete'].includes(state.phase), '准备尚未完成；查看备份文件与恢复记录，修复后重新准备')
    assert(state.head === head && current === version, 'HEAD/版本已改变；拒绝发布过期产物')
    assert(state.artifacts?.length === 2 && state.artifacts.every((a, i) => a.name === [CORE, SHIM][i]), '恢复记录包清单非法')
  } else {
    assert(head === origin, 'HEAD 与 origin/main 精确 OID 不一致；拒绝过期基线')
    assert(compareSemver(version, current) > 0, '新版本必须高于当前版本')
    assert(!fs.existsSync(stateDir), '此版本已有准备记录；使用 --resume 或按记录恢复，不覆盖产物')
    assert(run('git', ['show-ref', '--verify', '--quiet', tagRef], true).status === 1, '本地 tag 已存在')
    assert(!remoteRef('origin', tagRef), '远端 tag 已存在')
    const key = opts['task-key']
    assert(typeof key === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key), '准备必须显式 --task-key=<key>')
    const cards = readTaskCards(root).filter(c => c.key === key)
    assert(cards.length === 1 && cards[0].status === 'IN_PROGRESS', '发布任务必须唯一且为 IN_PROGRESS')
    const registry = run('npm', ['config', 'get', 'registry']).stdout.trim()
    const url = new URL(registry)
    assert(['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash, 'registry 地址必须无凭据与查询参数')
    state = { formatVersion: 1, version, taskKey: key, base: head, origin, registry: url.href, phase: 'preparing', artifacts: [], published: [], validation: [], node: process.version }
    const core = read(FILES[0]), shim = read(FILES[1]), template = read(FILES[2])
    assert(core.name === CORE && shim.name === SHIM && shim.version === current, '两包名称或版本不一致')
    assert([current, '^' + current].includes(template.devDependencies?.[CORE]), '模板 pin 与当前版本不一致')
  }
  const task = readTaskCards(root).filter(c => c.key === state.taskKey)
  assert(task.length === 1 && ['IN_PROGRESS', 'DONE'].includes(task[0].status), '恢复任务必须存在且允许发布')
  const pin = version.includes('-') ? version : '^' + version
  const localTag = () => {
    const r = run('git', ['rev-parse', '--verify', tagRef], true)
    return r.status === 0 ? r.stdout.trim() : null
  }
  const checkRemote = () => {
    const now = remoteRef('origin', 'refs/heads/main')
    assert(now === state.origin || (state.head && now === state.head), 'origin/main 已变化；停止发布/推送')
    const remoteTag = remoteRef('origin', tagRef)
    assert(!remoteTag || (state.tagOid && remoteTag === state.tagOid), '远端 tag 冲突')
    if (opts.push) {
      const mirror = remoteRef('codeup', 'refs/heads/mirror')
      assert(mirror === null || mirror === state.origin || mirror === state.head, 'codeup/mirror 不在本次基线或发布 HEAD；先人工对齐')
    }
  }
  checkRemote()
  if (opts.preview) { log('预览：' + version + (opts.resume ? ' 从恢复记录继续' : ' 准备、验证、pack、commit/tag') + '；未写入'); return { state, stateFile } }
  fs.mkdirSync(path.dirname(stateDir), { recursive: true })
  const lock = path.join(path.dirname(stateDir), '.lock')
  try { fs.mkdirSync(lock) } catch { throw new Error('发布锁已存在；确认无发布进程后清理 ' + lock) }
  const save = () => {
    const temp = stateFile + '.tmp'
    write(temp, state); fs.renameSync(temp, stateFile)
  }
  const inspectArtifacts = () => {
    for (const a of state.artifacts) {
      assert(path.basename(a.file) === a.file && a.file.endsWith('.tgz'), '产物路径非法')
      const file = path.join(stateDir, a.file)
      assert(fs.lstatSync(file).isFile() && !fs.lstatSync(file).isSymbolicLink(), '产物必须是普通文件')
      assert(integrity(file) === a.integrity, '产物摘要不一致：' + a.name)
      const entries = run('tar', ['-tzf', file]).stdout.trim().split('\n')
      assert(entries.every(e => !e.startsWith('/') && !e.split('/').includes('..') && !e.endsWith('/.gitignore')), 'tarball 路径或 .gitignore 条目非法')
      const pkg = JSON.parse(run('tar', ['-xzOf', file, 'package/package.json']).stdout)
      assert(pkg.name === a.name && pkg.version === version && !pkg.private, 'tarball 包身份非法')
      if (a.name === CORE) {
        const tpl = JSON.parse(run('tar', ['-xzOf', file, 'package/template/package.json']).stdout)
        assert(tpl.devDependencies?.[CORE] === pin, 'tarball 模板 pin 不一致')
      } else assert(pkg.dependencies?.[CORE] === '^' + version || pkg.dependencies?.[CORE] === version, 'shim 依赖未固化为本次版本')
    }
  }
  const ready = () => {
    assert(!git(['status', '--porcelain']) && git(['rev-parse', 'HEAD']) === state.head, '发布前工作树或 HEAD 改变')
    assert(localTag() === state.tagOid && git(['rev-parse', tagRef + '^{commit}']) === state.head, '本地 tag 与受测 HEAD 不一致')
    assert(git(['rev-parse', 'HEAD^']) === state.base && git(['rev-parse', 'HEAD^{tree}']) === state.tree, '发布提交不匹配受测暂存树或基线')
    inspectArtifacts(); checkRemote()
  }
  const validated = name => { state.validation.push({ name, at: new Date().toISOString() }); save() }
  try {
    assert(git(['rev-parse', 'HEAD']) === head && !git(['status', '--porcelain']), '获取锁期间仓库改变')
    checkRemote()
    if (!opts.resume) {
      fs.mkdirSync(stateDir)
      state.originals = Object.fromEntries(FILES.map(rel => [rel, fs.readFileSync(path.join(root, rel), 'utf8')]))
      save()
      run('pnpm', ['install', '--frozen-lockfile'])
      const core = read(FILES[0]), shim = read(FILES[1]), template = read(FILES[2])
      core.version = shim.version = version; template.devDependencies[CORE] = pin
      const expected = [core, shim, template].map(json => JSON.stringify(json, null, 2) + '\n')
      for (const [i, text] of expected.entries()) fs.writeFileSync(path.join(root, FILES[i]), text)
      const docs = verifyDocs(root)
      assert(!docs.errors.length, '文档门禁失败：' + docs.errors.join('\n'))
      validated('documentation')
      const scope = collectChangeScope({ root, base: state.base })
      const scan = scanContentSnapshots(root, scope)
      assert(!scan.errors.length, '内容检查失败：' + scan.errors.join('\n'))
      scan.notes.forEach(note => log(note))
      validated('content snapshots')
      run('pnpm', ['test'])
      validated('current source tests')
      run(process.execPath, ['packages/psycho-frame/src/cli.mjs', 'doctor'])
      validated('doctor')
      const config = readConfig(root), checks = destroyChecks(config)
      if (config.workMode?.destroy === 'on') for (const command of checks) run(process.platform === 'win32' ? 'cmd.exe' : '/bin/sh', process.platform === 'win32' ? ['/c', command] : ['-c', command])
      for (const name of [CORE, SHIM]) {
        run('pnpm', ['--filter', name, 'pack', '--pack-destination', stateDir])
        const file = name + '-' + version + '.tgz'
        state.artifacts.push({ name, file, integrity: integrity(path.join(stateDir, file)) })
      }
      inspectArtifacts()
      validated('packed metadata and integrity')
      // Smoke consumes these exact bytes; it never repacks provided artifacts.
      run(process.execPath, ['scripts/smoke-package.mjs', stateDir])
      inspectArtifacts()
      validated('exact tarball consumer lifecycle')
      checkRemote()
      assert(expected.every((text, i) => fs.readFileSync(path.join(root, FILES[i]), 'utf8') === text), '验证过程中版本文件被修改')
      const changed = (git(['diff', '--name-only']) + '\n' + git(['diff', '--cached', '--name-only'])).split('\n').filter(Boolean)
      assert(changed.every(f => FILES.includes(f)) && !git(['ls-files', '--others', '--exclude-standard']), '验证过程改动了发布清单以外的文件')
      git(['add', '--', ...FILES])
      state.tree = git(['write-tree']); save()
      git(['commit', '-m', 'chore(release): ' + version + ' [' + state.taskKey + ']'])
      state.head = git(['rev-parse', 'HEAD']); state.phase = 'committed'; save()
    }
    if (state.phase === 'committed') {
      if (localTag()) assert(git(['cat-file', '-t', tagRef]) === 'tag' && git(['rev-parse', tagRef + '^{commit}']) === state.head, '未完成记录遇到冲突 tag')
      else git(['tag', '-a', tag, '-m', CORE + ' ' + tag])
      state.tagOid = localTag(); state.phase = 'prepared'; save()
    }
    ready()
    if (!opts.publish) {
      log('准备完成，恢复记录：' + stateFile + '\n发布受测产物：pnpm release --resume=' + version + ' --publish [--push]')
      return { state, stateFile }
    }
    const registryIntegrity = a => {
      const r = run('npm', ['view', a.name + '@' + version, 'dist.integrity', '--json', '--registry', state.registry], true)
      let value
      try { value = JSON.parse(r.stdout || r.stderr) } catch { throw new Error('无法解析 registry 核对结果：' + a.name) }
      if (r.status !== 0) {
        assert(value?.error?.code === 'E404', 'registry 查询失败；不能把认证/网络错误当成未发布')
        return null
      }
      assert(typeof value === 'string', 'registry 缺少 dist.integrity：' + a.name)
      return value
    }
    for (const a of state.artifacts) {
      ready()
      let remote = registryIntegrity(a)
      if (remote !== null) assert(remote === a.integrity, '已发布包摘要冲突：' + a.name)
      else {
        run('npm', ['publish', path.join(stateDir, a.file), '--registry', state.registry, '--access', 'public', '--tag', version.includes('-') ? 'next' : 'latest'])
        remote = registryIntegrity(a)
        assert(remote === a.integrity, '发布后摘要核对失败：' + a.name)
      }
      if (!state.published.includes(a.name)) state.published.push(a.name)
      state.phase = 'publishing'; save()
    }
    state.phase = 'published'; save()
    if (opts.push) {
      ready()
      // Fast-forward only; explicit lease prevents a changed baseline being overwritten in the race window.
      const expectedOrigin = remoteRef('origin', 'refs/heads/main')
      assert(expectedOrigin === state.origin || expectedOrigin === state.head, 'origin/main 在推送前改变')
      git(['push', '--atomic', '--force-with-lease=refs/heads/main:' + expectedOrigin, 'origin', 'HEAD:refs/heads/main', tagRef + ':' + tagRef])
      assert(remoteRef('origin', 'refs/heads/main') === state.head && remoteRef('origin', tagRef) === state.tagOid, 'origin 推送后核对失败')
      state.phase = 'origin-pushed'; save()
      checkRemote()
      const mirror = remoteRef('codeup', 'refs/heads/mirror')
      assert(mirror === null || mirror === state.origin || mirror === state.head, '镜像在推送前改变')
      git(['push', '--force-with-lease=refs/heads/mirror:' + (mirror ?? ''), 'codeup', 'HEAD:refs/heads/mirror'])
      assert(remoteRef('codeup', 'refs/heads/mirror') === state.head, '镜像推送后核对失败')
      state.phase = 'complete'; save()
    }
    log('release ' + version + '：' + state.phase + '；恢复记录：' + stateFile)
    return { state, stateFile }
  } catch (e) {
    throw new Error(e.message + '\n保留恢复记录与产物：' + stateFile + '；准备中断时先按 originals 恢复三份文件，再处理本地 commit/tag；已发布版本不能覆盖。')
  } finally { fs.rmdirSync(lock) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { runRelease() } catch (e) { console.error('release: ' + e.message); process.exitCode = 1 }
}
