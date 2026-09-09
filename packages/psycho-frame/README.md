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

交互终端运行任意命令时静默检查最新版本并在有新版时提示（24h 节流、离线静默、
非交互终端跳过）；设 `PSYCHO_FRAME_NO_UPDATE_CHECK=1` 关闭。

## 命令

| 命令 | 作用 |
| --- | --- |
| `verify` | 文档门禁：链接/锚点、决策结构与格式、任务头字段、字数预算、工作模式取值 |
| `scope --base <ref>` | 四层改动面报告（committed/staged/unstaged/untracked，JSON） |
| `mode` | 查看当前工作模式；`mode set <key>=<value>` 设置并写回配置，`mode reset` 恢复默认 |
| `upgrade [目录]` | 骨架一键升级：模板优先，被覆盖的本地改动备份到 `.psycho-frame-upgrade/`，配置增量合并，README.md 保留本地；`--dry-run` 只预览（有变更退出码 1）；无目录参数时定位 git 仓库根，非骨架项目中止 |
| `self-upgrade` | CLI 自身升级：npm 全局安装自动 `npm install -g` 到最新版，其余安装方式打印对应指引；`--check` 只查询（退出码 0=最新、1=落后） |
| `init [目录]` | 新项目脚手架，生成知识四层 + AGENTS.md + 配置 |
| `adopt [目录]` | 旧项目采纳，add-only：已存在的文件跳过并报告 |
| `doctor [目录]` | 结构漂移检查：必需文件、配置、脚本 |
| `help [命令]` | 无参数打印全量用法；带命令名打印该命令专属帮助 |
| `version` | 输出版本号（等价 `--version` / `-v`） |

## 配置

仓库根可选 `.psycho-frame.json`：

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `decisionClasses` | 6 个内置类别 | `decisions/` 类别封闭集合 |
| `taskStatuses` | 5 个内置状态 | `tasks/` 状态枚举 |
| `workMode` | `{ plan: "on", confirmAmbiguous: true }` | 每次会话行为开关：是否先出计划等确认、需求不明是否必须询问；用 `mode` 命令调整 |
| `budgets` | 无（不启用） | `{ 文件路径: 词数上限 }`，超限门禁失败 |
| `ignore` | 无 | 相对根的前缀列表，跳过门禁 |

门禁只写当前状态、每个事实只有一个家、每个非平凡变更携带决策记录——制度文本全部在
模板内，init/adopt 后即可阅读 AGENTS.md。

## 许可

MIT（见仓库 LICENSE）。
