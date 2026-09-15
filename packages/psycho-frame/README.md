# yondren-psycho-frame

见山处（Yondren）精神力骨架开发框架：文档优先的工程骨架，任务、决策、报告、事实四层
分离，门禁机器可校验。零运行时依赖（仅 Node ≥ 18.20 内置模块），任何新项目或旧项目都
可安装。

## 安装

```sh
npm create yondren-psycho-frame@latest   # 新项目脚手架（等价 npx ... init）
npx yondren-psycho-frame init 目录        # 新项目：目标目录须为空
npx yondren-psycho-frame adopt 目录       # 旧项目：只增不改，绝不覆盖既有文件
npm install -g yondren-psycho-frame       # 全局安装：任意目录可用，self-upgrade 自动升级
pnpm add -D yondren-psycho-frame          # 作为 devDependency，门禁随版本升级
```

一个 checkout 只用一种包管理器：门禁与 devDependency 走 pnpm（`pnpm verify:docs` 缺依赖时
会先自动装好）；agent 沙箱内 npm/npx 写不了 workspace 外缓存（EPERM），混装会让 pnpm 拒绝
重建 `node_modules`。

交互终端运行任意命令时静默检查最新版本并在有新版时提示（24h 节流、离线静默、
非交互终端跳过）；设 `PSYCHO_FRAME_NO_UPDATE_CHECK=1` 关闭。

## 命令

| 命令 | 作用 |
| --- | --- |
| `verify [--json]` | 文档门禁：链接/锚点、决策结构与格式、任务头字段、字数预算、工作模式取值；`--json` 输出 `{ formatVersion, ok, count, errors }` |
| `scope --base <ref>` | 四层改动面报告（committed/staged/unstaged/untracked，JSON） |
| `mode` | 查看当前工作模式（六把开关）；`mode set <key>=<value>` 设置并写回配置，`mode reset` 恢复默认 |
| `upgrade [目录]` | 骨架一键升级：模板优先，被覆盖的本地改动备份到 `.psycho-frame-upgrade/`，配置增量合并（对象键下探一层补缺），README.md 保留本地；`--dry-run` 只预览，`--exit-code` 让预览有变更时退出码 1；无目录参数时定位 git 仓库根；非骨架项目、框架源码仓库与 linked worktree 中止（升级改的是全仓库共享的根文件，须在根 checkout 原地执行，见 [骨架升级](https://github.com/yondren/yondren-psycho-frame/blob/main/docs/cookbook/skeleton-upgrade.md)） |
| `self-upgrade` | CLI 自身升级：npm 全局安装自动 `npm install -g` 到最新版，其余安装方式打印对应指引；`--check` 只查询（退出码 0=最新、1=落后） |
| `init [目录]` | 新项目脚手架，生成知识四层 + AGENTS.md + 配置 |
| `adopt [目录]` | 旧项目采纳，add-only：已存在的文件跳过并报告 |
| `doctor [目录]` | 结构漂移检查：必需文件、配置、脚本、骨架漂移（与模板不一致的骨架文件数与缺失数），以及领先集成分支的本地分支（未合流的任务分支） |
| `help [命令]` | 无参数打印全量用法；带命令名打印该命令专属帮助 |
| `version` | 输出版本号（等价 `--version` / `-v`） |

## 配置

仓库根可选 `.psycho-frame.json`：

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `decisionClasses` | 6 个内置类别 | `decisions/` 类别封闭集合 |
| `taskStatuses` | 5 个内置状态 | `tasks/` 状态枚举 |
| `workMode` | `{ plan: "on", confirmAmbiguous: true, fleet: "off", merge: "ask", audience: "expert", engineering: "off" }` | 每次会话行为开关：纪律 `plan` / `confirmAmbiguous` / `fleet` / `merge`，加沟通语域 `audience`（expert/product/novice，决定措辞与解释深度）与工程化 `engineering`（on/off，强制逐项过工程化清单）；语义与耦合矩阵见 [docs/modes.md](https://github.com/yondren/yondren-psycho-frame/blob/main/docs/modes.md)；用 `mode` 命令调整 |
| `budgets` | 无（不启用） | `{ 文件路径: 字数上限 }`，CJK 逐字计 1、拉丁/数字串计 1 词，超限门禁失败 |
| `ignore` | 无 | 相对根的前缀列表，跳过门禁 |

门禁只写当前状态、每个事实只有一个家、每个非平凡变更携带决策记录——制度文本全部在
模板内，init/adopt 后即可阅读 AGENTS.md。

## 许可

MIT（见仓库 LICENSE）。
