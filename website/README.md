# 官网

yondren-psycho-frame 的官方站点（VitePress）。页面映射（源文件、官网页、标题、分组）在
[scripts/content-map.mjs](scripts/content-map.mjs)，由 [scripts/sync-content.mjs](scripts/sync-content.mjs)
生成页面、由 [.vitepress/config.mts](.vitepress/config.mts) 生成 sidebar；生成物
`src/guide/`、`src/reference/` 不入 Git（每次同步整体重建），手写内容只有首页、VitePress 配置
与本说明——官网不产生第二份事实源。

站点只放使用者向内容：快速上手、使用教程、核心理念、CLI 与配置；维护者向文档留在仓库内，
不上官网。

## 命令

```sh
pnpm docs:dev       # 本地预览（根目录）
pnpm docs:build     # 构建（根目录）
```
