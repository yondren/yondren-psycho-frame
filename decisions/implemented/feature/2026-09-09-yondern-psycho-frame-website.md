# Agent Note: yondern-psycho-frame 官网（VitePress docs-as-code）

Status: implemented

## Problem

项目需要官方站点承载安装指引、概念指南与 CLI/配置参考。若官网手写一套文档，会制造
第三处事实源，违反本骨架"每个事实只有一个家"的核心规则；同时站点构建也要吃同一套
门禁，否则官网会先于仓库腐化。

## Decision

- 选型 VitePress（Vue/Vite 生态，内置本地搜索与 i18n 结构，Vite/Vitest 官方同款）。
- 站点位于顶层 `website/`，并入 pnpm workspace（private，不发布）；根 scripts 增
  `docs:dev` / `docs:build`。
- 官网页面由 [sync-content.mjs](../../../website/scripts/sync-content.mjs) 从仓库权威
  Markdown 生成，映射表 [content-map.mjs](../../../website/scripts/content-map.mjs) 只收
  使用者向内容：映射内目标重写为官网路径，其余仓库内目标重写为 GitHub 直链；生成物
  `website/src/guide/`、`website/src/reference/` 不入 Git，构建前整体重建。
- 手写内容只有：首页 hero、VitePress 配置、网站说明——官网不产生第二份事实源。
- 发布：GitHub Pages workflow（[docs.yml](../../../.github/workflows/docs.yml)），构建前先跑
  `psycho-frame verify`，再由 workflow 上传站点产物。
- 单语中文首发；VitePress i18n 目录结构已预留，英文站点与英文模板一起列入后续任务。

## Alternatives considered

**直接部署到 Cloudflare Pages** — 否决：构建链含 pnpm workspace、门禁前置与 sync 生成，
GitHub Actions 已零密钥（OIDC）跑通；迁往 Cloudflare Pages 需新 workflow 与 API token
（或受其构建镜像约束），收益仅是 PR 预览。

**Vercel / Netlify** — 否决：默认域名大陆可达性差，免费额度有限（100 GB/月）；
GitHub Pages 与仓库同源、零密钥，内容站已够用。

**手写全套官网文档** — 否决：概念与规则与仓库 docs/ 重复，违反 one home per fact，
后续任何规则修改都要双处同步。

**Mintlify / GitBook 托管** — 否决：内容离仓不可门禁，SaaS 收费与锁定；与
"全部知识载体为 Markdown + Git"的底座相悖。

**Docusaurus** — 否决：React 栈与团队 Vue 栈不符，i18n 与搜索配置更重；VitePress
对内容型站点足够且心智零成本。

**官网独立安装不进 workspace** — 否决：多一套 lockfile 与 node_modules，根
`pnpm install` 不覆盖官网依赖，CI 流水线多一段；并入 workspace 是 Vite 官方仓库
的既有模式。

**生成物入 Git** — 否决：生成物与源文档必然漂移并污染 diff；改由构建前脚本生成。

## Consequences

- 官网内容零手工维护：源文档改动后 `docs:build` 自动同步，无第二事实源。
- 生成物不被门禁误伤：全部相对链接已重写为官网绝对路径或 GitHub 直链，天然通过
  verify 的链接检查；手写页面的链接同样被门禁覆盖。
- GitHub org `yondren` / 仓库 `yondren-psycho-frame`；官网链接与 workflow 使用该地址
  （repoBase 在 sync 脚本单点定义）。
- 新增权威文档时须同步 MAP，否则官网不展示——作为新文档的发布步骤之一。
- 规范地址是自定义域名 `https://psycho-frame.yondren.com/`（GitHub Pages 绑定该域名后，
  项目页地址 301 到它）；Pages 在自定义域名下按根路径供给产物，[docs.yml](../../../.github/workflows/docs.yml)
  因此固定注入 `DOCS_BASE=/`，VitePress 的 `base` 与之同值。
