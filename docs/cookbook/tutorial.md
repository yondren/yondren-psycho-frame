# 使用教程：从空目录到第一次任务收尾

完整教程需要 Node.js ≥22.13、pnpm 11.20.0、Git ≥2.26，并已配置 Git 提交身份。
核心 CLI 零运行时依赖，单独运行支持 Node ≥18.20；模板的 pnpm 工作流使用上述更高下限。
下面在一个空的父目录执行。`npm create` 只负责生成文件；`pnpm install` 显式安装项目依赖。

## 一次完整回路

这个示例添加一条团队说明，走完 Git 基线、隔离任务、决策、验证、提交、合流和状态收尾。
全部命令由分发冒烟执行，测试只将联网创建/安装替换为当前构建的本地 tarball。

```sh
npm create yondren-psycho-frame@latest my-project
cd my-project
pnpm install
pnpm verify:docs
pnpm run doctor

git init -b main
git add -A
git commit -m "chore: initialize skeleton [bootstrap]"
pnpm exec psycho-frame mode
pnpm exec psycho-frame task start first-task
cd .worktrees/first-task

# 编辑生成的任务卡范围，并在报告中记录下面的实施与验证结果。
mkdir -p decisions/implemented/process
cat > decisions/implemented/process/2026-09-21-first-task.md <<'DECISION'
# Agent Note: 团队说明独立成页

Status: implemented

## Problem

团队需要一个可链接的说明入口。

## Decision

团队约定放在 docs/team.md，由架构地图链接。

## Alternatives considered

**写入常驻指令** — 不采用：增加每轮上下文负担。

## Consequences

团队约定有唯一入口，修改时同步链接。
DECISION
printf '# 团队说明\n\n团队在任务 worktree 中协作。\n' > docs/team.md
printf '\n团队约定见 [团队说明](team.md)。\n' >> docs/architecture.md
cat > reports/first-task.md <<'REPORT'
# first-task 执行报告

增加团队说明与架构入口；决策同步。改动面仅文档，验证命令见教程。
合流前状态：IN_PROGRESS；执行下列门禁通过后提交，合流后再收尾。
REPORT

pnpm change-scope --base main
pnpm verify:docs
pnpm exec psycho-frame task check
git add -A
git commit -m "docs: add team guide [first-task]"

# 用户接受变更后合入 main；这里演示本地合流，不涉及远端。
cd ../..
git merge --no-ff first-task -m "merge: team guide [first-task]"
git worktree remove .worktrees/first-task
node -e 'const fs=require("node:fs"); const p="tasks/"+fs.readdirSync("tasks").find(n=>n.endsWith("-first-task.md")); fs.writeFileSync(p,fs.readFileSync(p,"utf8").replaceAll("IN_PROGRESS","DONE")); fs.appendFileSync("reports/first-task.md","\n已合入 main，worktree 已移除；状态 DONE。\n")'
pnpm verify:docs
pnpm exec psycho-frame task check
git add tasks reports
git commit -m "chore: close task [first-task]"
```

预期：门禁通过、`git status --short` 无输出、`git worktree list` 只剩 main，任务卡为 DONE。
生成的任务卡还应填清范围，报告记录实际结果；示例日期可换成当天。七项模式的语义见
[工作模式](../modes.md)，任务状态字段见 [任务规则](../../tasks/README.md)。

## 已有项目与日常检查

已有项目使用 `npx yondren-psycho-frame adopt .`，仅补缺失文件；随后显式 `pnpm install`。
诊断用 `pnpm run doctor`，避免调用 pnpm 自带的同名命令。普通本地门禁用 `pnpm verify:docs`；
毁灭模式必须提供 `--base`，其规则见 [工作模式](../modes.md)。
CI 使用 `psycho-frame verify --ci --base <基线 OID>`，完整历史、命令矩阵和网站构建由 workflow 提供。

## 常见失败

| 输出 | 处理 |
| --- | --- |
| 找不到 psycho-frame | 在项目根执行 pnpm install |
| 无法解析 base | 先提交 Git 基线，CI checkout 使用完整历史 |
| 链接目标/锚点不存在 | 修复相对路径或标题 |
| 预算超限 | 精简或搬到其归属文档，不默认提预算 |
| 任务未绑定 worktree | 使用 task start 创建并进入返回路径 |
| DONE key 不能复用 | 新建任务 key，保留历史状态 |

完整命令见 [CLI 与配置](../../packages/psycho-frame/README.md)，升级流程见
[骨架升级](skeleton-upgrade.md)，知识分层见 [核心理念](../concepts.md)。
