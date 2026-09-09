# 官网

yondern-psycho-frame 的官方站点（VitePress）。指南与参考页由
[scripts/sync-content.mjs](scripts/sync-content.mjs) 从仓库权威文档生成
（生成物 `src/guide/`、`src/reference/` 不入 Git），手写内容只有首页、VitePress 配置
与本说明——官网不产生第二份事实源。

## 命令

```sh
pnpm docs:dev       # 本地预览（根目录）
pnpm docs:build     # 构建（根目录）
```

## 部署

GitHub Pages 构建见 [.github/workflows/docs.yml](../.github/workflows/docs.yml)；
自定义域名经 Cloudflare 代理加速，配置与验证步骤见
[docs/cookbook/cloudflare-gh-pages.md](../docs/cookbook/cloudflare-gh-pages.md)。
基路径由 workflow 注入 `DOCS_BASE`：项目页阶段 `/yondren-psycho-frame/`，自定义域名下 `/`。
