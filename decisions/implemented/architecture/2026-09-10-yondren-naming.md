# Agent Note: 品牌与命名统一为 Yondren（yondren-psycho-frame）

Status: implemented

## Problem

GitHub org 实际为 `yondren`、仓库 `yondren-psycho-frame`，而 npm 包名、官网与文档品牌仍为
Yondern（yondern-psycho-frame），同一项目双拼写并存：安装命令、仓库地址、官网域名互相
错位；已发布的旧 npm 包名（yondern-psycho-frame / create-yondern-psycho-frame）随改名需迁移。

## Decision

- 英文品牌与项目名统一为 Yondren（见山处）/ yondren-psycho-frame：GitHub org `yondren`、
  仓库 yondren-psycho-frame、npm 包 yondren-psycho-frame 与 create-yondren-psycho-frame、
  官网域名 psycho-frame.yondren.com 全部一致。
- 代码与活跃文档全部改名：两包 package.json 名称与目录
  （[packages/create-yondren-psycho-frame](../../../packages/create-yondren-psycho-frame/)）、
  [release.mjs](../../../scripts/release.mjs) 常量、self-update 提示、模板 devDependency 与
  模板文档、根 workspace 名与 `--filter`、官网标题/描述/导航、LICENSE 版权行。
- npm 迁移：新名包延续 0.3.0 锁步发布；旧包 yondern-psycho-frame 与
  create-yondern-psycho-frame 用 `npm deprecate` 指路新名（发布与 deprecate 由维护者持
  npm 凭据执行，凭据不进仓库与报告）。
- 历史文件名保留：decisions/tasks/reports 中 2026-09-09 及更早的 yondern-* 文件名与正文
  不改（历史标识）；本记录为命名修订的交叉链接点，逆转的原文条目见
  [2026-09-09-yondern-psycho-frame-oss.md](2026-09-09-yondern-psycho-frame-oss.md)。

## Alternatives considered

**保留 Yondern 品牌只改仓库路径** — 否决：双拼写（仓库 yondren-psycho-frame、包
yondern-psycho-frame）长期混淆安装命令与仓库地址，npm 页面与 GitHub 不一致。

**历史文件一并改名** — 否决：决策/任务/报告文件名是历史标识，改名需同步全库相对
链接与索引，收益低于成本；历史正文保持原拼写。

**旧包直接废弃不指路** — 否决：已安装用户与新用户都会撞 E404；deprecate 指路成本最低。

## Consequences

- 消费方命令为 `npm create yondren-psycho-frame@latest`、`npx yondren-psycho-frame`
  等；旧包 deprecate 消息指路新名。
- npm registry 上旧包名保留（0.3.0）并 deprecate 指路新名；新名包已发布 0.3.1，
  安装命令指向新名可用。
- 官网域名切换为 psycho-frame.yondren.com（cookbook 步骤同步更新）；自定义域名启用前
  GitHub Pages 项目页（yondren.github.io/yondren-psycho-frame/）照常服务。
- 历史决策/任务/报告文件名保留 yondern 拼写，与活跃文档的 yondren 拼写并存，分界为本记录。
