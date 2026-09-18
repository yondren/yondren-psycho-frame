// 测试夹具：临时目录、写文件、可过门禁的最小骨架、可跑 git 的骨架仓库，以及决策/任务文档的构造器。
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { scaffold } from '../src/init.mjs'

export function tempDir(prefix = 'pf-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

export function write(root, rel, text) {
  const p = path.join(root, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, text)
  return p
}

export function remove(root, rel) {
  fs.rmSync(path.join(root, rel), { force: true })
}

export const noop = () => {}

export function decisionText({
  title = '测试决策',
  status = 'implemented',
  extraHeader = '',
  sections = ['## Problem', '## Decision', '## Alternatives considered', '## Consequences'],
} = {}) {
  const body = sections.map(s => `${s}\n\n内容。\n`).join('\n')
  const header = extraHeader === '' ? '' : `${extraHeader}\n`
  return `# Agent Note: ${title}\n\nStatus: ${status}\n${header}\n${body}`
}

export function taskText({ key = 'sample', status = 'DONE', report = '../reports/sample.md' } = {}) {
  const reportLine = report === null ? '' : `- report: [reports/sample.md](${report})\n`
  return `# 测试任务\n\n- task_key: ${key}\n- status: ${status}\n- created: 2026-01-01\n- updated: 2026-01-01\n${reportLine}\n## 范围\n\n无。\n`
}

/** 一个可通过门禁的最小骨架（无 .psycho-frame.json，使用内置默认值）。 */
export function fixtureRepo({ config } = {}) {
  const root = tempDir()
  write(root, 'AGENTS.md', '# AGENTS.md\n\n常驻命令。\n')
  write(root, 'docs/note.md', '# 笔记\n\n正文。\n')
  write(root, 'decisions/implemented/process/2026-01-01-sample.md', decisionText())
  write(root, 'tasks/2026-01-01-sample.md', taskText())
  write(root, 'reports/sample.md', '# 报告\n')
  if (config !== undefined) write(root, '.psycho-frame.json', config)
  return root
}

/** 在 root 里跑 git（测试用薄封装，带编码返回）。 */
export function gitIn(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

/** 可跑 git 的骨架仓库：adopt 全套模板 + 首次提交 + 集成分支名（默认 main）；返回 root。 */
export function gitFixture({ branch = 'main' } = {}) {
  const root = tempDir()
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
  git('init', '-q')
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'test')
  scaffold({ cwd: root, target: '.', mode: 'adopt', stdout: noop, stderr: noop })
  git('add', '-A')
  git('commit', '-q', '-m', 'init')
  git('branch', '-M', branch)
  return root
}
