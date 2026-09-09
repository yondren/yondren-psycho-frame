# GitHub 开源首发：远端切换与干净历史 执行报告

- task_key: github-launch
- 状态: IN_PROGRESS

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
- `node packages/psycho-frame/src/cli.mjs scope --base main`
- `node packages/psycho-frame/src/cli.mjs verify`
- 后续：远端重命名与分支手术、双远端推送（见第 4 节）。

## 4. 验证结果

- change-scope：改动面仅元数据 + 常驻文档 + 决策 + 任务。
- 门禁首跑失败一次：任务文件链接的报告尚未写入，补报告后通过（见第 6 节同步结果）。
- 远端手术验证：`git remote -v` 两远端就位；codeup main 与 mirror 双分支齐全；
  GitHub 侧待仓库创建后推送验证。

## 5. 文档与决策是否同步

- 决策：[decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md](../decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md)
  已更新（Decision 增托管与远端、npm 元数据条目；Alternatives 增全量直推与 filter-repo
  否决；Consequences 增双远端契约）。
- 文档：AGENTS.md 推送常驻命令已同步。
- 任务：[tasks/2026-09-10-github-launch.md](../tasks/2026-09-10-github-launch.md)。

## 6. 还剩什么阻塞

- GitHub org `yondern` 与仓库 `yondern-psycho-frame` 尚未创建：创建并配置 Pages 源为
  GitHub Actions 后，首次推送触发 docs.yml 部署。
- 本机到 GitHub 的推送凭据（SSH key / gh CLI）需在 GitHub 侧配置后验证。
