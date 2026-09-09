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
- 指南与参考页由 [sync-content.mjs](../../../website/scripts/sync-content.mjs) 从仓库权威
  Markdown（README、AGENTS.md、docs/、decisions/tasks/reports 的 README、包 README）
  生成：MAP 内目标重写为官网路径，其余仓库内目标重写为 GitHub 直链；生成物
  `website/src/guide/`、`website/src/reference/` 不入 Git，构建前运行。
- 手写内容只有：首页 hero、VitePress 配置、网站说明——官网不产生第二份事实源。
- 部署：GitHub Pages workflow（[docs.yml](../../../.github/workflows/docs.yml)），构建前先跑
  `psycho-frame verify`；基路径经 `DOCS_BASE` 环境变量注入（项目页阶段
  `/yondern-psycho-frame/`，自定义域名下 `/`）。
- CDN 加速：自定义域名经 Cloudflare 代理到 Pages 源站（SSL `Full (strict)`、HTML 短 TTL
  与带哈希资源长 TTL 缓存规则），部署目标不变，灰色云一键回滚；操作与验证步骤见
  [cloudflare-gh-pages.md](../../../docs/cookbook/cloudflare-gh-pages.md)。
- 单语中文首发；VitePress i18n 目录结构已预留，英文站点与英文模板一起列入后续任务。

## Alternatives considered

**直接部署到 Cloudflare Pages** — 否决：构建链含 pnpm workspace、门禁前置与 sync 生成，
GitHub Actions 已零密钥（OIDC）跑通；迁往 Cloudflare Pages 需新 workflow 与 API token
（或受其构建镜像约束），收益仅是 PR 预览，而 CDN 代理已获得同等边缘加速且回滚成本为零。

**Vercel / Netlify** — 否决：默认域名大陆可达性差，免费额度有限（100 GB/月）；
Cloudflare 免费带宽无上限，域名也已托管于 Cloudflare DNS。

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
- GitHub org `yondren` / 仓库 `yondern-psycho-frame`；官网链接与 workflow 使用该地址
  （repoBase 在 sync 脚本单点定义）。
- 大陆可达性由 Cloudflare 边缘承载；故障时把 DNS 切回"仅 DNS"即回纯 GitHub Pages。
- 全链路零密钥：加速层只涉 DNS 代理与缓存规则，无 API token 入 Git 或 CI。
- 自定义域名启用时须同步把 docs.yml 的 `DOCS_BASE` 改为 `/`（切换点见 workflow 注释与
  cookbook）。
- 新增权威文档时须同步 MAP，否则官网不展示——作为新文档的发布步骤之一。
