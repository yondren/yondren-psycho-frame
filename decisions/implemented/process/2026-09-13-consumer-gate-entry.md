# Agent Note: 消费方门禁入口与 pnpm 单一化

Status: implemented

## Problem

模板给消费方（init/adopt 出来的项目）装好门禁，但入口与包管理器绑在一起：模板
`package.json` 的 `verify:docs` 依赖已安装的 `psycho-frame` bin，环境段又声明
"pnpm ≥ 10（npm/yarn 亦可）"。在 agent 会话里这条路径会断——DSH 的 workspace-write 沙箱
禁止写 workspace 外文件，`npm install`、`npx`、`pnpm dlx` 都因缓存目录在 `~/.npm` /
`~/Library/Caches/pnpm` 而 EPERM；改用 npm 装出 `node_modules` 后，pnpm 判定目录异类，非
交互环境下直接 `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`，门禁看起来"没进入校验逻辑"。
`adopt` 只增不改、不写 `verify:docs` / `change-scope` 脚本，`doctor` 只提示一句，进一步把
agent 推向手工改 `package.json` 与混装。

## Decision

门禁入口按"能用"分层，消费方只用 pnpm：

- 模板与使用者向文档的主入口是 `pnpm verify:docs`；pnpm 在脚本缺 devDependency 时会先自动
  装好，worktree 与新 checkout 无需手动 install（[模板开发工作流](../../../packages/psycho-frame/template/docs/development.md)）。
- 环境段删去"npm/yarn 亦可"，写明一个 checkout 只用 pnpm 与沙箱 EPERM 事实；免安装兜底只在
  无 Node 工程时给出，缓存必须落在 workspace 内：`npx --yes --cache ./.npm-cache yondren-psycho-frame verify`。
- [worktree cookbook](../../../packages/psycho-frame/template/docs/cookbook/parallel-worktrees.md)
  增"依赖供给"步骤：门禁零依赖可直接跑，需要构建时 `CI=true pnpm install --frozen-lockfile`；
  禁止软链或复制其他 checkout 的 `node_modules`。
- 模板新增零依赖 CI（`.github/workflows/ci.yml`）跑 `verify:docs` 与 `doctor`，消费方在本地
  没有可用包管理器时也有信号。
- `init` / `doctor` 输出改为可执行提示：`init` 打印 `pnpm verify:docs`，`adopt` 指向"门禁接入"；
  `doctor` 直接给出脚本与 devDependency 片段，并新增依赖缺失提示。

## Alternatives considered

**模板脚本改成 `npx --yes yondren-psycho-frame verify`** — 否决：沙箱内 npx 写不了 `~/.npm`
缓存直接 EPERM，等于把失败从 pnpm 换到 npm，还要每次联网解析版本。

**保留"npm/yarn 亦可"，只在文档补一句"别混装"** — 否决：沙箱里 npm 系结构性不可用，保留承诺
只会让 agent 先撞 EPERM 再混装 `node_modules`。

**让 adopt 自动改写既有 `package.json` 的 scripts/devDependencies** — 否决：破坏"只增不改"
契约；接入片段由 `doctor` / `init` 输出，改动仍由使用者显式完成。

**在仓库配置里写死绝对 `store-dir`** — 否决：机器相关路径不能进 Git；store 固定只作为
[模板开发工作流](../../../packages/psycho-frame/template/docs/development.md) 的操作建议。

## Consequences

- 消费方三条路径（新项目、adopt、长期 devDependency）都从 `pnpm verify:docs` 进入，门禁不再
  要求预先 install。
- 混装 npm 的 `node_modules` 仍会失败，但文档、tutorial 报错表与 CLI 提示都指向唯一修法：
  删目录、只用 pnpm，CI 设 `CI=true`。
- 模板新增 CI 文件随 init/adopt/upgrade 分发；`doctor` 不把它列为必需文件，旧项目升级后不会
  因缺失报 issue。
- 事实真源：环境与接入规则在模板 `docs/development.md`，worktree 步骤在 cookbook，CLI 行为在
  包 README；本任务过程见[报告](../../../reports/consumer-gate-entry.md)。
