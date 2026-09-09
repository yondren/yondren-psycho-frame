// 改动面报告：显式 base 的四层路径集合，输出带版本号的 JSON。
// 对标 DSH 官方 scripts/change-scope.ts 的裁剪版：base 必须显式提供，绝不猜测；
// parseArgs 严格校验参数，rev-parse 用 --end-of-options 防 ref 注入，
// merge-base 要求唯一，路径用 -z NUL 分隔解析。
// 用法: import { run } from './change-scope.mjs'; run(process.argv.slice(2))
import { execFileSync } from 'node:child_process'
import { parseArgs } from 'node:util'

const MAX_GIT_OUTPUT = 64 * 1024 * 1024

function parseOptions(argv) {
  try {
    const { values } = parseArgs({
      args: argv,
      allowPositionals: false,
      options: {
        base: { type: 'string' },
        head: { type: 'string', default: 'HEAD' },
      },
      strict: true,
    })
    if (values.base === undefined) throw new Error('必须显式提供 --base <ref>；不猜测 origin/<branch> 或上游')
    return { base: values.base, head: values.head }
  } catch (error) {
    console.error(`change-scope: ${error.message}`)
    process.exit(1)
  }
}

function spawnGit(cwd, args, encoding) {
  return execFileSync('git', ['-C', cwd, '-c', 'core.fsmonitor=false', ...args], {
    encoding,
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: MAX_GIT_OUTPUT,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', LANG: 'C', LC_ALL: 'C' },
  })
}

const gitBytes = (cwd, args) => spawnGit(cwd, args, 'buffer')

function requireGitText(cwd, args, context) {
  try {
    return spawnGit(cwd, args, 'utf8')
  } catch (e) {
    throw new Error(`${context}: ${String(e.stderr ?? e.message).trim() || `git 退出码 ${String(e.status)}`}`)
  }
}

function resolveCommit(root, label, ref) {
  try {
    const out = requireGitText(root, [
      '-c', 'core.warnAmbiguousRefs=true',
      'rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`,
    ], `${label} ref ${JSON.stringify(ref)} 无法解析为 commit`)
    const commits = out.trim().split(/\r?\n/).filter(Boolean)
    if (commits.length !== 1) throw new Error(`${label} ref ${JSON.stringify(ref)} 未解析为唯一 commit`)
    return commits[0]
  } catch (e) {
    if (/\bambiguous\b/iu.test(String(e.message))) {
      throw new Error(`${label} ref ${JSON.stringify(ref)} 有歧义；使用全限定引用或 commit id`)
    }
    throw e
  }
}

function resolveMergeBase(root, baseSha, headSha) {
  let out
  try {
    out = requireGitText(root, ['merge-base', '--all', baseSha, headSha], 'base 与 head 无共同祖先')
  } catch (e) {
    throw new Error(`base 与 head 无共同祖先: ${e.message}`)
  }
  const bases = out.trim().split(/\r?\n/).filter(Boolean)
  if (bases.length !== 1) throw new Error(`base 与 head 的 merge-base 不唯一（${bases.length} 个）`)
  return bases[0]
}

function parsePathSet(buf) {
  const paths = new Set()
  let start = 0
  for (let end = 0; end < buf.length; end += 1) {
    if (buf[end] !== 0) continue
    if (end > start) paths.add(buf.subarray(start, end).toString('utf8'))
    start = end + 1
  }
  return [...paths].sort()
}

function diffPaths(root, args, context) {
  return parsePathSet(gitBytes(root, [
    'diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--ignore-submodules=none',
    '--name-only', '-z', ...args, '--',
  ], context))
}

export function run(argv) {
  const options = parseOptions(argv)

  let root
  try {
    root = requireGitText(process.cwd(), ['rev-parse', '--show-toplevel'], '无法定位 Git worktree').trim()
  } catch (e) {
    console.error(`change-scope: ${e.message}`)
    process.exit(1)
  }

  try {
    const baseSha = resolveCommit(root, 'base', options.base)
    const headSha = resolveCommit(root, 'head', options.head)
    const mergeBaseSha = resolveMergeBase(root, baseSha, headSha)
    const report = {
      formatVersion: 1,
      repositoryRoot: root,
      input: { base: options.base, head: options.head },
      resolved: { baseSha, headSha, mergeBaseSha },
      paths: {
        committed: diffPaths(root, [mergeBaseSha, headSha], '无法读取已提交路径'),
        staged: diffPaths(root, ['--cached'], '无法读取暂存路径'),
        unstaged: diffPaths(root, [], '无法读取未暂存路径'),
        untracked: parsePathSet(gitBytes(root, ['ls-files', '--others', '--exclude-standard', '-z', '--'], '无法读取未跟踪路径')),
      },
    }
    console.log(`${JSON.stringify(report, null, 2)}\n`)
  } catch (e) {
    console.error(`change-scope: ${e.message}`)
    process.exit(1)
  }
}
