# 官网基路径切根路径 执行报告

- task_key: docs-base-root
- 状态: DONE

## 1. 改了哪些文件

- [.github/workflows/docs.yml](../.github/workflows/docs.yml)：`DOCS_BASE` 由
  `/yondren-psycho-frame/` 改为 `/`，注释改为自定义域名规范地址。
- [website/.vitepress/config.mts](../website/.vitepress/config.mts)：基路径注释同步为根路径事实。
- [decisions/implemented/feature/2026-09-09-yondern-psycho-frame-website.md](../decisions/implemented/feature/2026-09-09-yondern-psycho-frame-website.md)：
  `Consequences` 增规范地址与根基址事实。
- 新增本报告与 [tasks/2026-09-16-docs-base-root.md](../tasks/2026-09-16-docs-base-root.md)。

## 2. 实现了什么

线上诱因（本轮外网实测）：HTML 产物内绝对路径为 `/yondren-psycho-frame/...`，而 Pages 在自定义
域名下按根路径供给站点产物——`/yondren-psycho-frame/assets/app.D9Y9wFyU.js` 返回 404、
`/assets/app.D9Y9wFyU.js` 返回 200，站内导航同理，页面因此无样式、点不动。修复是把基路径固定
为根路径，使产物路径与 Pages 的供给路径一致。

## 3. 跑了哪些命令

worktree `.worktrees/docs-base-root`（分支 `docs-base-root`，base `main`）内：

```sh
CI=true pnpm install --frozen-lockfile      # 仅供官网构建取 workspace 链接
pnpm docs:build                             # sync 生成 5 页 + vitepress 构建
node packages/psycho-frame/src/cli.mjs scope --base main
node packages/psycho-frame/src/cli.mjs verify
```

产物检查（`website/.vitepress/dist/`）：

```sh
grep -oE '(href|src)="/[^"]*"' website/.vitepress/dist/index.html | sort -u
grep -rhoE '"/yondren-psycho-frame/' website/.vitepress/dist | wc -l
grep -rhoE '.{18}yondren-psycho-frame/' website/.vitepress/dist | sort -u
```

## 4. 验证结果

- 构建通过：`build complete in 1.35s`，产出 7 个 HTML。
- 产物基路径已为根路径：`index.html` 绝对引用为 `href="/"`、`/assets/app.Cx0WSSV9.js`、
  `/assets/style.DFpvEkNb.css`、`/guide/getting-started`、`/vp-icons.css` 等。
- 旧基路径引用清零：`"/yondren-psycho-frame/` 匹配数 **0**。
- 残留的 `yondren-psycho-frame/` 字符串全部是内容里的 GitHub 直链与包名
  （`github.com/yondren/yondren-psycho-frame/`、`packages/create-yondren-psycho-frame/`），
  与基路径无关。
- `change-scope --base main`：merge-base `f53f8e0` = `main` HEAD；改动面 3 个修改
  （workflow、VitePress 配置、决策记录）+ 2 个新增（任务卡、本报告），未触及 `packages/`，
  故不跑 `pnpm test`。
- 门禁：`verify` 通过（132 个 Markdown，链接与锚点、决策结构、任务头字段、预算、工作模式取值全部合规）。

## 5. 文档与决策是否同步

- 决策：更新
  [decisions/implemented/feature/2026-09-09-yondern-psycho-frame-website.md](../decisions/implemented/feature/2026-09-09-yondern-psycho-frame-website.md)
  的 `Consequences`（规范地址为自定义域名、根基址与 `DOCS_BASE=/` 契约），只改事实不改决策。
- 文档：`website/.vitepress/config.mts` 注释同步；无索引变更（未新增/移动文档页）。
- 任务：[tasks/2026-09-16-docs-base-root.md](../tasks/2026-09-16-docs-base-root.md)。

## 6. 合流状态

- 已合流到 `main`：`git merge --no-ff docs-base-root -m "merge: 官网基路径切根路径 [docs-base-root]"`
  （merge commit `c9841e9`）；worktree `.worktrees/docs-base-root` 已删除。
- 推送：`origin main` 与 `codeup main:mirror`（推送前核对远端 OID 未变）。

## 7. 还剩什么阻塞

- 无阻塞。收尾复验（推送后）：等 `docs.yml` 部署完成，在 Cloudflare 侧 Purge Everything（旧 HTML
  有 1 小时边缘 TTL，`/yondren-psycho-frame/...` 的 404 也已被边缘缓存），再确认首页绝对路径为
  `/assets/...`、站内导航 200、`cf-cache-status` MISS→HIT。
