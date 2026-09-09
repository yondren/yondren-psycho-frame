# GitHub Pages + Cloudflare 加速

官网部署在 GitHub Pages（[docs.yml](../../.github/workflows/docs.yml)），自定义域名
`psycho-frame.yondern.com` 经 Cloudflare 代理获得边缘加速；域名已托管于 Cloudflare DNS。
加速只动 DNS 与缓存，部署目标不变，故障时把代理切回"仅 DNS"即可回滚。

前置条件：仓库已存在于 `github.com/yondren/yondren-psycho-frame` 且 Pages workflow 已跑通。

## 1. 添加代理 CNAME

Cloudflare → DNS → 添加记录：类型 `CNAME`、名称 `psycho-frame`、目标 `yondren.github.io`、
代理状态开启（橙色云）。

验证：`dig +short psycho-frame.yondern.com` 返回 Cloudflare 边缘 IP（而非 GitHub 的 IP）。

## 2. GitHub Pages 绑定自定义域名

仓库 Settings → Pages → Custom domain 填 `psycho-frame.yondern.com` → Save；DNS 校验通过后
勾选 Enforce HTTPS。

## 3. SSL 模式设为 Full (strict)

Cloudflare → SSL/TLS → 加密模式选 `Full (strict)`。选 `Flexible` 会与 Pages 的 HTTPS 强制
跳转互相触发，产生重定向循环。

验证：`curl -sI https://psycho-frame.yondern.com` 返回 `HTTP/2 200`，无 301 循环。

## 4. 缓存规则

Cloudflare → Caching → Cache Rules 添加两条：

- Hostname 等于 `psycho-frame.yondern.com`：Cache everything，Edge TTL 1 小时（HTML 短缓存）。
- URI 前缀 `/assets/`：Cache everything，Edge TTL 1 年（VitePress 产物带内容哈希，可长缓存）。

验证：对同一 `assets/` 文件连续两次 `curl -sI`，第二次响应头出现 `cf-cache-status: HIT`。

## 5. 基路径切为根路径

自定义域名下 Pages 以根路径发布：把 [docs.yml](../../.github/workflows/docs.yml) 中
`DOCS_BASE` 从 `/yondren-psycho-frame/` 改为 `/`，提交并等待 workflow 重新部署。

验证：首页与任意子页直接访问均 200，站内链接不含 `/yondren-psycho-frame/` 前缀。

## 6. 回滚演练

Cloudflare → DNS → 该 CNAME 的代理状态改为仅 DNS（灰色云）。

验证：站点仍可访问（直连 GitHub Pages 源站）；确认无误后切回橙色云。
