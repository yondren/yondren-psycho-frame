# 可配置工作模式（plan / confirmAmbiguous）执行报告

- task_key: work-modes
- 状态: DONE

## 1. 改了哪些文件

- 新增 `packages/psycho-frame/src/work-mode.mjs`（取值/读写/默认 + 共享 config 读取）
- 改 `packages/psycho-frame/src/cli.mjs`（mode 命令 + USAGE）、`verify-docs.mjs`（workMode 校验、
  config 读取移入 work-mode.mjs）、`init.mjs`（doctor 对缺失 workMode 提示）
- 配置：根 `.psycho-frame.json`、`packages/psycho-frame/template/.psycho-frame.json`（均加
  `workMode` 并规范化 pretty-print，mode set/reset 往返零漂移）
- 文档：根 `AGENTS.md`、`docs/development.md`、`docs/architecture.md`、`README.md`、
  `packages/psycho-frame/README.md` 与 template 同名文件同步
- 决策 `decisions/implemented/feature/2026-09-09-work-modes.md`、任务
  `tasks/2026-09-09-work-modes.md`

## 2. 实现了什么

`.psycho-frame.json` 的 `workMode` 两把正交开关：`plan`（on/off，默认 on，on 为 plan 模式，
off 动手前仍显式说明计划）、`confirmAmbiguous`（true/false，默认 true）。CLI
`psycho-frame mode` / `mode set <key>=<value>` / `mode reset`；verify 门禁校验封闭取值；
对话内调整 = Agent 执行 `mode set` 持久化。语义唯一事实源在 docs/development.md。

## 3. 跑了哪些命令

- `node --check` × 4 个 src 文件
- 临时项目（/tmp）：`init` → `mode`/`mode set`/`mode reset` → `verify` → `doctor`，含注入
  非法值验证 verify 失败
- 根仓库：`mode set plan=off` → `mode reset` → `git diff .psycho-frame.json` 确认零漂移
- `pnpm change-scope --base c997e94`、`pnpm verify:docs`、`pnpm run doctor`

## 4. 验证结果

- change-scope：committed/staged 为空，unstaged 12 + untracked 3，与改动面一致
- verify:docs 通过（16 个 Markdown 文件）；doctor 通过
- 临时项目默认、off/false、reset 后 verify 均通过；`plan=maybe` 与
  `confirmAmbiguous="yes"` 被 verify 拒绝并给出明确错误
- CLI 非法输入 exit code：未知 key 2、非法取值 1

## 5. 文档与决策是否同步

已同步。决策记录随本提交落地；README 与包 README 的命令/配置表、architecture 地图、
模板与仓库文档同批更新；官网经 sync-content MAP 自动展示 mode 命令与新配置项。

## 6. 还剩什么阻塞

无。包版本号 bump 遵循既有分工留给 release 任务。
