# 分支卫生执行报告

- task_key: branch-hygiene
- 状态: DEFERRED（清理已完成，合流流程补步骤未实施）

## 1. 改了哪些文件

- `tasks/2026-09-14-branch-hygiene.md`：登记任务（清理已完成、补步骤延期）
- `reports/branch-hygiene.md`：本报告
- 未改代码、文档与配置；分支清理只动本地 ref，远端 ref 未变

## 2. 实现了什么

清理本地历史分支 11 个，并记录根因：合流流程只写 `git worktree remove`、没有删除已合入的任务
分支，因此分支随任务单调堆积。

判定方法（不只看分支名）：逐分支比对"分支独有文件"（`git ls-tree` 文件清单差集）与对应任务卡在
main 中的状态，确认独有内容均为 main 里已改名、已搬迁或已移除的旧路径后才删除。

| 分支 | SHA | 判定 |
| --- | --- | --- |
| `consumer-gate-entry` | `0de2ea0` | `git branch --merged main` 完全合入 |
| `fleet-work-mode` | `e26115e` | 完全合入 |
| `cli-self-update` | `5f096d2` | 独有文件为旧路径 `create-yondern-*`、已移除的 `apps/`；任务卡 DONE |
| `cli-version-help` | `f248957` | 同上；任务卡 DONE |
| `cloudflare-gh-pages` | `83081e6` | `docs/cookbook/cloudflare-gh-pages.md` 在官网收敛时下线；任务卡 DONE |
| `github-launch` | `2ad3c96` | 旧路径；任务卡 DONE |
| `legacy` | `afd7a12` | 等于 `codeup/main`，远端仍保有该提交 |
| `remove-apps-residue` | `7d92036` | `apps/` 已移除且 git 历史保留；任务卡 DONE |
| `skeleton-review` | `9b6b786` | `scripts/*.mjs` 已迁入 `packages/psycho-frame/src/` |
| `yondern-psycho-frame-oss` | `c67c21a` | 旧路径与旧 `template/.gitignore`（已改名 `template/gitignore`）；任务卡 DONE |
| `yondern-website` | `2bbc913` | 报告已改名 `reports/yondern-website.md`；任务卡 DONE |

删除方式：已合入的两个用 `git branch -d`，其余九个用 `git branch -D`；未使用任何 `--force` 推送，
未触碰远端。删除前的 SHA 见上表，本地 reflog 默认保留 90 天，期间可用
`git branch <name> <sha>` 找回。

## 3. 跑了哪些命令

- `git branch --no-merged main`、`git branch --merged main`、`git rev-list --count`、`git cherry`
  （补丁等价性在此仓库被历史重写破坏，仅作参考）
- `git ls-tree -r --name-only <branch>` 与 main 的文件清单差集
- `git ls-remote origin`、`git ls-remote codeup`（确认任务分支从未推到远端）
- `git branch -d` / `git branch -D`、`git worktree list`
- `node packages/psycho-frame/src/cli.mjs doctor`、`... verify`

## 4. 验证结果

- `doctor`：清理前提示 9 个本地分支领先 `main`，清理后无该提示（退出码 0，7 个必需文件齐全）
- `pnpm verify:docs`：通过（124 个 Markdown 文件）
- 分支与 worktree：仅剩 `main`，worktree 仅主 checkout
- 远端：`origin/main` 与 `codeup/mirror` 均为 `fca7375`，未受影响

## 5. 文档与决策是否同步

未改文档，缺口记在本任务卡的范围与延期原因里；无决策记录——登记与清理不改变行为、架构、跨文件
契约、流程或格式。

## 6. 合流状态

不适用：本次为登记类改动，直接在 `main` 完成，没有任务分支，也不产生合并提交。

## 7. 还剩什么阻塞

合流流程补"删除已合入任务分支"一步，按用户要求延期（见任务卡延期原因）。
