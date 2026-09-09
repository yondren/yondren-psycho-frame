# Agent Note: yondern-psycho-frame 开源化与 npm 分发

Status: implemented

## Problem

文档优先骨架要作为独立开源项目面向任意新/旧项目分发，当前形态不可行：业务代码
`apps/` 与骨架同仓；根 package.json 为 private 且混业务脚本；门禁硬编码封闭集合且从
脚本位置推导仓库根，装入 node_modules 即失效；无脚手架、无旧项目采纳模式、无升级机制。

## Decision

- 品牌与命名：Yondern（见山处），项目 yondern-psycho-frame（精神力骨架开发框架）。
- 仓库改为 pnpm monorepo：`packages/psycho-frame`（门禁 + CLI + 模板，主包
  yondern-psycho-frame）、`packages/create-yondern-psycho-frame`（npm create 入口，转发 init）。
- CLI 七命令：verify / scope（别名 change-scope）/ mode / upgrade / init / adopt / doctor；
  零依赖，仅用 Node ≥ 18.20 内置模块。
- 门禁泛化：仓库根 = cwd 的 git toplevel（无 git 回退 cwd）；决策类别、任务状态、字数
  预算移入 [.psycho-frame.json](../../../.psycho-frame.json)；新增 ignore 前缀排除。
- 模板 = 本仓库文档的泛化版，[packages/psycho-frame/template](../../../packages/psycho-frame/template/)；
  旧项目采纳走 adopt（add-only，绝不覆盖既有文件）；doctor 检查结构漂移。
- 业务代码 `apps/` 与相关 decisions/tasks/reports 不随新项目迁移，保留在 codeup
  全历史备份。
- 许可证 MIT；包名暂不取 scope（@yondern 需 npm 组织，阻塞首发），后续可迁移。
- 托管与远端：主远端 GitHub org `yondren` / 仓库 `yondren-psycho-frame`（origin）；codeup
  保留为备份远端（远端名 `codeup`）：`main` 冻结全量开发历史，`mirror` 同步开源历史；
  日常推送 `git push origin main` + `git push codeup main:mirror`。
- npm 包元数据（repository / homepage / bugs）与根 package.json 的 license 字段指向
  GitHub 仓库与官网。

## Alternatives considered

**GitHub template 单发** — 否决：拷贝即腐烂，无版本升级，门禁一致性无保证。

**全量历史直推 GitHub** — 否决：apps/ 业务代码随 22/53 个历史提交公开，超出骨架开源面。

**filter-repo 剔除 apps/ 后保留完整历史** — 否决：历史重写与两远端分叉的复杂度高于
收益，开源历史以当前树单提交起步。

**@yondern/* scoped 包** — 否决（暂缓）：npm 组织未注册前无法发布，先免 scope 占位，
迁移成本低。

**postinstall 隐式向宿主写入文件** — 否决：隐式副作用受安全审查反感，且 pnpm 默认
禁止依赖 postinstall 脚本；一律走显式 CLI 命令。

**保留硬编码封闭集合** — 否决：泛化到任意项目是核心诉求，配置化是必选项。

**继续保留 apps/ 在仓库内** — 否决：开源仓库携带业务代码污染模板与包产物；
业务代码留在 git 历史，可按需恢复。

## Consequences

- 消费方三选一：npm create（新项目）、adopt（旧项目）、devDependency（门禁随 semver 升级）。
- 仓库自身即模板源头：docs/ 与 template/ 的漂移由 doctor 与 init/adopt 冒烟测试看护。
- 发布前需在 npm 注册 yondern-psycho-frame 与 create-yondern-psycho-frame 两个包名。
- 两远端历史不同源：codeup main 为全历史备份（冻结），mirror 为开源历史镜像；
  重写已推历史仍受租约保护。
- npm 页面与 issue 入口指向 GitHub 仓库与官网。
- 模板默认中文；英文模板与仓库 i18n 列为后续任务。
- 根 package.json 的 verify:docs/change-scope/doctor 直接指向包内脚本，仓库自举无需 install。
