# GitHub 开源首发：远端切换与干净历史 执行报告

- task_key: github-launch
- 状态: DONE

## 1. 改了哪些文件

- 更新 package.json（根：license: MIT）、packages/psycho-frame/package.json 与
  packages/create-yondern-psycho-frame/package.json（repository/homepage/bugs 指向
  GitHub 与官网）。
- 更新 AGENTS.md（任务与并行增推送常驻命令）、
  decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md（远端拓扑、
  历史策略、备选方案、后果）。
- 新增 tasks/2026-09-10-github-launch.md 与本报告。

## 2. 实现了什么

- 开源就绪审计：工作树与全部 53 个提交无凭据/敏感文件/个人路径；.gitignore 覆盖完整；
  MIT 许可齐备；历史含 apps/ 业务代码（22/53 提交）→ 按确认的方案 B，GitHub 首发用
  当前树单提交，codeup 保留全历史。
- 远端拓扑：origin 切换为 GitHub（yondern/yondern-psycho-frame），codeup 降级为备份
  远端：main 冻结全历史、mirror 同步开源历史；日常双推。
- npm 元数据补齐，开源后 npm 页面与 issue 入口落在 GitHub。

## 3. 跑了哪些命令

- `git worktree add .worktrees/github-launch -b github-launch main`
- `node packages/psycho-frame/src/cli.mjs scope --base main`、`verify`（worktree 与
  main 各一次）
- 远端与分支手术：`git remote rename origin codeup`、`git remote add origin
  git@github.com:yondern/yondern-psycho-frame.git`、`git branch -m main legacy`、
  `git checkout --orphan main` + 当前树单提交
- `git push codeup legacy:main`（fast-forward 全历史）、`git push codeup main:mirror`
  （新分支镜像）
- SSH 路由修复：~/.ssh/config 补 codeup 段 `Host` 行与 github.com 段
  `StrictHostKeyChecking accept-new`；`ssh -T git@github.com` 认证探测
- `git push -u origin main`（阻塞于仓库不存在，见第 6 节）

## 4. 验证结果

- change-scope：改动面仅元数据 + 常驻文档 + 决策 + 任务，无代码改动。
- 门禁首跑失败一次：任务文件链接的报告尚未写入，补报告后通过；手术前后共跑三次均通过。
- 手术前发现 ~/.ssh/config 缺 `Host` 行使 github.com 被路由到 codeup，修复后
  `ssh -G github.com` 的 hostname 归位 github.com。
- 远端检查：origin=github、codeup=codeup；codeup main=全历史（含本任务 DONE 提交）、
  mirror=开源历史镜像。
- GitHub SSH 认证通过（账户 superpassronny-netizen）；推送阻塞于仓库不存在。

## 5. 文档与决策是否同步

- 决策：[decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md](../decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md)
  已更新（Decision 增托管与远端、npm 元数据条目；Alternatives 增全量直推与 filter-repo
  否决；Consequences 增双远端契约）。
- 文档：AGENTS.md 推送常驻命令已同步。
- 任务：[tasks/2026-09-10-github-launch.md](../tasks/2026-09-10-github-launch.md)。

## 6. 还剩什么阻塞

- github.com/yondern/yondern-psycho-frame 尚未创建：创建后执行 `git push -u origin main`，
  并把 Pages 源设为 GitHub Actions，docs.yml 自动部署到 yondern.github.io/yondern-psycho-frame/。
- ~/.ssh/known_hosts 不可写：已用 config 的 `accept-new` 规避，连接正常但主机密钥不入
  known_hosts，每次首连仅告警。
