# 使用教程：从安装到第一次提交

这篇教程用一条完整回路带你上手：给项目装上骨架 → 认识生成的文件 → 跑通门禁 → 登记第一个
任务 → 写第一条决策记录 → 提交。每步都有可直接复制的命令和预期结果。

前置条件：Node.js ≥ 18.20 与 Git。骨架零运行时依赖，不需要数据库或构建链。

想先弄清"为什么要这四层"，读 [核心理念](../concepts.md)；只想查命令，读
[CLI 与配置](../../packages/psycho-frame/README.md)。

## 1. 给新项目装上骨架

```sh
npm create yondren-psycho-frame@latest my-project
cd my-project
pnpm install
```

三条命令依次是：生成骨架文件、进入目录、安装 devDependency（它提供 `psycho-frame` 命令）。
不想用 pnpm 时，`npx yondren-psycho-frame init my-project` 完全等价。

**已有项目不要用 init**，用只增不改的 adopt——它遇到同名文件会跳过，绝不覆盖你的东西：

```sh
cd existing-project
npx yondren-psycho-frame adopt .
```

## 2. 认识生成的文件

```text
my-project/
├── AGENTS.md            # 每次会话必须在场的常驻命令（AI 按目录自动读到）
├── .psycho-frame.json   # 门禁配置：决策类别、任务状态、工作模式、字数预算
├── docs/                # 当前事实
├── decisions/           # 为什么这样定、放弃了什么
├── tasks/               # 做到哪一步
├── reports/             # 每次执行的过程
├── package.json         # verify:docs / change-scope / doctor 脚本
└── .gitignore
```

四个知识目录各管一件事，规则是"每个事实只有一个家"：写进 `docs/` 的是当前事实，写进
`decisions/` 的是理由，`tasks/` 只存状态，`reports/` 只存过程。别处需要时放链接，不复制。

先花两分钟读生成的 `AGENTS.md` 与 [docs/AGENTS.md](../AGENTS.md)——它们就是这套骨架的使用
说明书，也是 AI 每次会话会读到的规则。

## 3. 跑通第一次门禁

```sh
pnpm verify:docs
```

刚生成的项目应当直接通过：

```text
文档门禁通过：N 个 Markdown 文件，链接与锚点可解析，决策结构与格式合规，任务头字段合规，预算达标，工作模式取值合规
```

不通过时退出码为 1，逐条列出问题。平时本地只跑与改动面匹配的检查，全量矩阵交给 CI。

## 4. 登记第一个任务

任务状态唯一真源是 `tasks/`，开工前先建文件并置 `IN_PROGRESS`。新建
`tasks/2026-09-13-add-login.md`：

```md
# 增加登录能力

- task_key: add-login
- status: IN_PROGRESS
- created: 2026-09-13
- updated: 2026-09-13
- report: [reports/add-login.md](../reports/add-login.md)

## 范围

本轮做什么、明确不做什么。
```

三条硬约束由门禁校验：

- `task_key` 全小写连字符，且与文件名日期后的部分完全一致。
- `status` 只能取 `NOT_STARTED` `IN_PROGRESS` `BLOCKED` `DEFERRED` `DONE`。
- `report` 必须是指向 `reports/<task_key>.md` 的链接，且该文件要存在——**建任务的同时把报告
  文件也建出来**，哪怕先写骨架。

## 5. 写第一条决策记录

只要一个改动会改变行为、架构、跨文件契约、流程或格式，就在同一提交里写一条决策记录。路径
`decisions/{生命周期}/{类别}/yyyy-mm-dd-主题.md`，例如
`decisions/implemented/feature/2026-09-13-session-storage.md`：

```md
# Agent Note: 会话存储改用服务端 Cookie

Status: implemented

## Problem

现状是什么、痛点在哪。

## Decision

定了什么，用现在时描述。

## Alternatives considered

**另一种做法** — 否决：败因是什么。

## Consequences

这个决定带来的结果与要遵守的契约。
```

头三行与章节名是门禁强校验的：第 1 行 `# Agent Note: <标题>`、第 3 行 `Status:`（全文唯一）、
首个章节必须是 `## Problem`，`implemented/` 还必须齐 `## Decision` `## Alternatives considered`
`## Consequences`。只改事实不改决策；要反转结论就新写一条并交叉链接。

## 6. 提交

```sh
git add -A
git commit -m "feat(add-login): 增加登录能力 [add-login]"
```

提交信息必须包含 task_key，这样从 commit 能一路查回任务与报告。

## 7. 日常循环

定稿后的稳定节奏：

1. 在 `tasks/` 登记任务并置 `IN_PROGRESS`。
2. 编码 / 改文档。
3. `pnpm change-scope --base main` 取改动面，只跑覆盖它的最窄检查（改了产品代码再加跑测试）。
4. 更新 `reports/<task_key>.md`，非平凡变更补决策记录。
5. `pnpm verify:docs` 通过后提交（含 task_key），把任务置 `DONE`。

另外两条常备命令：

```sh
pnpm doctor                        # 结构漂移检查：必需文件、配置、脚本
pnpm exec psycho-frame upgrade --dry-run   # 预览骨架升级（模板优先，本地改动自动备份）
```

## 8. 门禁报错怎么读

| 报错 | 含义 | 修法 |
| --- | --- | --- |
| `链接目标不存在` | 相对链接指向了不存在的文件 | 改链接或补文件；路径必须真实可解析 |
| `链接锚点不存在` | `#标题` 与实际标题对不上 | 核对标题 slug |
| `task_key … 与文件名后缀 … 不一致` | 头字段和文件名不同 | 统一两者 |
| `缺少头字段 - report:` | 任务没写报告链接 | 补 `- report:` 行 |
| `缺章节 ## Decision` | 决策记录结构不全 | 补齐该类别的必备章节 |
| `超出预算 N` | 常驻文档太长 | 先搬迁到归属层、再精简，最后才提预算 |

## 接下来

- [核心理念](../concepts.md)——为什么这样分层，以及门禁和工作模式的设计取舍。
- [CLI 与配置](../../packages/psycho-frame/README.md)——全部命令与 `.psycho-frame.json` 字段。
- [任务状态真源](../../tasks/README.md) / [决策记录](../../decisions/README.md) /
  [执行报告](../../reports/README.md)——三类文件的完整规则。
