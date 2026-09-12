# yondern-psycho-frame 官网（VitePress） 执行报告

- task_key: yondern-website
- 状态: DONE

## 1. 改了哪些文件

- 新增 website/：package.json（private，vitepress devDep）、.vitepress/config.mts、
  src/index.md（首页 hero）、scripts/sync-content.mjs（内容生成，零依赖）、README.md。
- 新增 .github/workflows/docs.yml（GitHub Pages：门禁 → 构建 → 部署）。
- 更新：根 package.json（docs:dev/docs:build）、pnpm-workspace.yaml（并入 website +
  allowBuilds esbuild）、.gitignore（生成物与缓存）、README.md 与 docs/architecture.md
  （网站层登记）。

## 2. 实现了什么

- docs-as-code 官网：指南 11 页 + 参考 1 页全部由 sync-content.mjs 从仓库权威文档
  生成，生成物不入 Git；手写只有首页与站点配置。
- 链接重写：MAP 内目标 → 官网路径，其余仓库内目标 → GitHub 直链，同文件锚点保留；
  分段重建链接避免标签与 URL 同串误替换。
- VitePress：local 搜索、cleanUrls、中文单语；DOCS_BASE 环境变量切换项目页/自定义域名。
- 部署：GitHub Pages workflow，构建前先跑 psycho-frame verify。

## 3. 跑了哪些命令

- `node website/scripts/sync-content.mjs`（12 页生成）
- `pnpm install`（vitepress + esbuild 白名单）
- `pnpm docs:build`（vitepress v1.6.4）
- `node packages/psycho-frame/src/cli.mjs verify`
- `vitepress preview --port 4173` + curl 冒烟

## 4. 验证结果

- 构建：成功（client+server bundles + 13 页渲染，1.24s）；期间修复两处：sync 脚本链接
  重写改为分段重建（标签与 URL 同串时误替换标签）、config 显式 `srcDir: './src'`
  （默认 srcDir 导致页面挂 /src/ 前缀、首页 404）；修复后 VitePress dead-link 检查 0 报错。
- 仓库门禁：通过（生成页面链接全部外部化，不触门禁误报）。
- preview 冒烟：首页/指南/参考页 HTTP 200，首页含品牌标题。

## 5. 文档与决策是否同步

- 决策：[decisions/implemented/feature/2026-09-09-yondern-psycho-frame-website.md](../decisions/implemented/feature/2026-09-09-yondern-psycho-frame-website.md)。
- 文档：README.md、docs/architecture.md、website/README.md 同步更新。
- 任务：[tasks/2026-09-09-yondern-website.md](../tasks/2026-09-09-yondern-website.md)。

## 6. 还剩什么阻塞

- GitHub org `yondern` 与仓库尚未创建：官网 GitHub 链接、repoBase、workflow 均为
  规划地址，创建后仅改 sync 脚本 repoBase 单点。
- 英文站点与 i18n 未做（与英文模板合并为同一后续任务）。
