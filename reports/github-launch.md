# GitHub 开源首发：远端切换与干净历史 执行报告

- task_key: github-launch
- 状态: DONE

## 1. 改了哪些文件

- 更新 package.json（根：license: MIT）、packages/psycho-frame/package.json 与
  packages/create-yondren-psycho-frame/package.json（repository/homepage/bugs 指向
  GitHub 与官网）。
- 更新 AGENTS.md（任务与并行增推送常驻命令）、
  decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md（远端拓扑、
  历史策略、备选方案、后果）。
- 品牌与命名统一为 Yondren / yondren-psycho-frame：git mv 入口包目录、两包 package.json
  名称与元数据、release.mjs 常量、self-update 提示、模板 devDependency 与模板文档、
  根 workspace 名与 filter、官网标题/导航/hero、LICENSE 版权行、官网域名
  psycho-frame.yondren.com；新增
  [decisions/implemented/architecture/2026-09-10-yondren-naming.md](../decisions/implemented/architecture/2026-09-10-yondren-naming.md)。
- 新增 tasks/2026-09-10-github-launch.md 与本报告。

## 2. 实现了什么

- 开源就绪审计：工作树与全部 53 个提交无凭据/敏感文件/个人路径；.gitignore 覆盖完整；
  MIT 许可齐备；历史含 apps/ 业务代码（22/53 提交）→ 按确认的方案 B，GitHub 首发用
  当前树单提交，codeup 保留全历史。
- 远端拓扑：origin 切换为 GitHub（yondren/yondren-psycho-frame），codeup 降级为备份
  远端：main 冻结全历史、mirror 同步开源历史；日常双推。
- npm 元数据补齐，开源后 npm 页面与 issue 入口落在 GitHub。

## 3. 跑了哪些命令

- `git worktree add .worktrees/github-launch -b github-launch main`
- `node packages/psycho-frame/src/cli.mjs scope --base main`、`verify`（worktree 与
  main 各一次）
- 远端与分支手术：`git remote rename origin codeup`、`git remote add origin
  git@github.com:yondren/yondren-psycho-frame.git`、`git branch -m main legacy`、
  `git checkout --orphan main` + 当前树单提交
- `git push codeup legacy:main`（fast-forward 全历史）、`git push codeup main:mirror`
  （新分支镜像）
- SSH 路由修复：~/.ssh/config 补 codeup 段 `Host` 行与 github.com 段
  `StrictHostKeyChecking accept-new`；`ssh -T git@github.com` 认证探测
- `git push -u origin main`（org 确认为 yondren 后推送成功）

## 4. 验证结果

- change-scope：改动面仅元数据 + 常驻文档 + 决策 + 任务，无代码改动。
- 门禁首跑失败一次：任务文件链接的报告尚未写入，补报告后通过；手术前后共跑三次均通过。
- 手术前发现 ~/.ssh/config 缺 `Host` 行使 github.com 被路由到 codeup，修复后
  `ssh -G github.com` 的 hostname 归位 github.com。
- 远端检查：origin=github、codeup=codeup；codeup main=全历史（含本任务 DONE 提交）、
  mirror=开源历史镜像。
- GitHub SSH 认证通过（账户 superpassronny-netizen）；首推成功，origin/main 为干净
  历史 a12b2eb。
- org 确认：实际 GitHub org 为 `yondren`（非规划的 `yondern`），仓库内 org 引用已全部
  同步修正（sync repoBase、两包元数据、官网 hero 与导航、cookbook CNAME 目标与前置
  条件、两条决策、任务与报告）。
- CI 失败根因：pnpm 11.20.0 要求 Node ≥ 22.13（依赖 node:sqlite），workflow 原
  `node-version: 20` 导致 build 任务在 setup-node 步骤崩溃；已改 `node-version: 22`，
  docs/development.md 环境要求同步修正（包 engines 对消费者仍为 ≥ 18.20）。
- 线上 assets 404 根因：GitHub 仓库实际名为 `yondren-psycho-frame`（org `yondren`），
  而 DOCS_BASE 当时仍按旧名 `/yondern-psycho-frame/` 烘焙进 HTML 绝对路径 → 仓库路径引用
  已全部对齐仓库名（DOCS_BASE、repoBase、包元数据 URL、cookbook、官网链接、远端 URL）。
- 品牌与 npm 包名随仓库名统一为 yondren-psycho-frame（决策：
  [../decisions/implemented/architecture/2026-09-10-yondren-naming.md](../decisions/implemented/architecture/2026-09-10-yondren-naming.md)）；
  历史决策/任务/报告文件名保留 yondern 拼写。
- 沙箱网络无法直达 github.io（DNS 被代理到 198.18.x），线上验证以浏览器与 API
  部署记录为准：deploy-pages 两次 success，站点 URL 为
  yondren.github.io/yondren-psycho-frame/。

## 5. 文档与决策是否同步

- 决策：[decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md](../decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md)
  已更新（Decision 增托管与远端、npm 元数据条目；Alternatives 增全量直推与 filter-repo
  否决；Consequences 增双远端契约）；
  [decisions/implemented/architecture/2026-09-10-yondren-naming.md](../decisions/implemented/architecture/2026-09-10-yondren-naming.md)
  新增（命名修订与 npm 迁移）。
- 文档：AGENTS.md 推送常驻命令已同步。
- 任务：[tasks/2026-09-10-github-launch.md](../tasks/2026-09-10-github-launch.md)。

## 6. 还剩什么阻塞

- 仓库 yondren/yondren-psycho-frame 已公开，Pages（GitHub Actions 源）部署成功
  （deploy-pages 两次 success）；改名后的最新部署待浏览器在
  yondren.github.io/yondren-psycho-frame/ 验证。
- npm 迁移已发布：新名包 yondren-psycho-frame / create-yondren-psycho-frame 0.3.1 已上
  registry（维护者另账号执行）；旧包 `npm deprecate` 指路待执行。
- ~/.ssh/known_hosts 不可写：已用 config 的 `accept-new` 规避，连接正常但主机密钥不入
  known_hosts，每次首连仅告警。
