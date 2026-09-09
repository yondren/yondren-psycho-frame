# 官网 Cloudflare CDN 加速 执行报告

- task_key: cloudflare-gh-pages
- 状态: DONE

## 1. 改了哪些文件

- 新增 docs/cookbook/cloudflare-gh-pages.md（部署 cookbook：DNS 代理、SSL、缓存规则、
  基路径切换、回滚演练，每步带验证）。
- 更新 docs/cookbook/README.md（索引登记）、website/README.md（部署段指向 cookbook）、
  website/scripts/sync-content.mjs（MAP 登记新页）、
  decisions/implemented/feature/2026-09-09-yondern-psycho-frame-website.md（CDN 层事实、
  备选方案、后果）。
- 新增 tasks/2026-09-10-cloudflare-gh-pages.md 与本报告。

## 2. 实现了什么

- 部署架构在 GitHub Pages 基础上增加 Cloudflare CDN 加速层：自定义域名
  psycho-frame.yondern.com（已托管于 Cloudflare DNS）经代理到 Pages 源站，SSL Full (strict)，
  HTML 短 TTL、带哈希资源长 TTL；部署目标不变，灰色云一键回滚，全链路零密钥。
- 后台操作固化为带验证步骤的 cookbook，等 GitHub 仓库创建后照做即可；本轮只落仓库侧文档。

## 3. 跑了哪些命令

- `git worktree add .worktrees/cloudflare-gh-pages -b cloudflare-gh-pages main`
- `node packages/psycho-frame/src/cli.mjs scope --base main`
- `node website/scripts/sync-content.mjs`（13 页生成，含新 cookbook 页）
- `node packages/psycho-frame/src/cli.mjs verify`

## 4. 验证结果

- change-scope：改动面仅 docs/、decisions/、tasks/、website/README.md 与 sync MAP，无代码改动。
- 门禁首跑失败一次：任务文件链接的 reports/cloudflare-gh-pages.md 尚未写入，补报告后通过。
- sync：新 MAP 条目源文件存在，生成 `src/guide/cloudflare-gh-pages.md`，13 页全部生成。

## 5. 文档与决策是否同步

- 决策：[decisions/implemented/feature/2026-09-09-yondern-psycho-frame-website.md](../decisions/implemented/feature/2026-09-09-yondern-psycho-frame-website.md)
  已更新（Decision 增 CDN 层条目，Alternatives 增 Cloudflare Pages / Vercel / Netlify 否决，
  Consequences 增大陆可达性与 DOCS_BASE 契约）。
- 文档：docs/cookbook/README.md 索引、website/README.md 部署段已同步。
- 任务：[tasks/2026-09-10-cloudflare-gh-pages.md](../tasks/2026-09-10-cloudflare-gh-pages.md)。

## 6. 还剩什么阻塞

- GitHub 仓库尚未创建（远端仍为 codeup）：Cloudflare 后台与 Pages 自定义域名绑定等
  cookbook 步骤须等仓库迁移后执行，届时同步把 docs.yml 的 DOCS_BASE 改为 `/`。
