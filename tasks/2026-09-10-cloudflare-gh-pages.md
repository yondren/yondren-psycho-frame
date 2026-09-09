# 官网 Cloudflare CDN 加速

- task_key: cloudflare-gh-pages
- status: DONE
- created: 2026-09-10
- updated: 2026-09-10
- report: [reports/cloudflare-gh-pages.md](../reports/cloudflare-gh-pages.md)

## 范围

官网部署在 GitHub Pages 基础上增加 Cloudflare CDN 加速层：自定义域名
psycho-frame.yondern.com 经 Cloudflare 代理到 Pages 源站。本轮落地仓库侧文档与决策：
新增部署 cookbook（DNS/SSL/缓存/回滚步骤），更新部署决策记录与 website/README.md。
