# 官网基路径切根路径（自定义域名规范地址）

- task_key: docs-base-root
- status: DONE
- created: 2026-09-16
- updated: 2026-09-16
- report: [reports/docs-base-root.md](../reports/docs-base-root.md)

## 范围

自定义域名 `psycho-frame.yondren.com` 已绑定 GitHub Pages 并经 Cloudflare 代理加速，Pages 在该
域名下以根路径发布；官网产物仍按项目页基路径 `/yondren-psycho-frame/` 烘焙绝对路径，线上首页
引用的 CSS/JS 与全部站内导航 404（[.github/workflows/docs.yml](../.github/workflows/docs.yml)
的 `DOCS_BASE` 仍是旧值）。本轮把 `DOCS_BASE` 切为 `/`，同步 VitePress 配置注释与官网决策记录
的基址事实。

本次不包含：Cloudflare 后台设置（代理 CNAME、缓存规则、Always Use HTTPS、Pages 的 Enforce
HTTPS）属维护者本地操作，步骤留存在 `.local/deploy/`；不改 sync/content-map 生成逻辑，不改
`packages/`。

## 进度

- [IN_PROGRESS] 2026-09-16 登记任务；`DOCS_BASE` 切 `/`，VitePress 配置注释与官网决策记录的基址
  事实同步；产物检查确认旧基路径引用为 0，门禁与官网构建通过。
- [DONE] 2026-09-16 合流到 `main`（merge commit `c9841e9`），worktree 已删除；推送两个远端后由
  `docs.yml` 重新部署，线上以 Cloudflare purge 后的复验为准。
