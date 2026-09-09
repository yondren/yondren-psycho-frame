# 移除 apps/ 残留业务代码 执行报告

- task_key: remove-apps-residue
- 状态: 提交后置 DONE

## 1. 改了哪些文件

- `git rm`：`apps/fde-server/data/leads.db`（被跟踪的业务数据库，blob 保留在 git 历史）。
- 磁盘删除：apps/ 下被忽略的 node_modules/、dist/、.env、data/uploads/、.DS_Store
  （约 145 个文件、2.6 MB，不进入 git）。
- 新增 [tasks/2026-09-10-remove-apps-residue.md](../tasks/2026-09-10-remove-apps-residue.md)、
  [decisions/implemented/simplification/2026-09-10-remove-apps-residue.md](../decisions/implemented/simplification/2026-09-10-remove-apps-residue.md)。

## 2. 实现了什么

当前树彻底移除 apps/ 残留：唯一被跟踪文件 git rm，磁盘产物 rm -rf；骨架代码与文档不变；
git 历史按 OSS 决策保留。

## 3. 跑了哪些命令

- `git worktree add .worktrees/remove-apps-residue -b remove-apps-residue main`
- `git rm apps/fde-server/data/leads.db`
- `pnpm change-scope --base main`
- `pnpm verify:docs`
- `git merge remove-apps-residue`（main checkout，fast-forward）
- `rm -rf apps/`（main checkout，清未跟踪产物）
- `git worktree remove .worktrees/remove-apps-residue`

## 4. 验证结果

change-scope 改动面：1 个删除 + 3 个新增文档；verify:docs 全绿；合并后 `git ls-files`
无 apps/ 路径。

## 5. 文档与决策是否同步

是：决策记录见
[decisions/implemented/simplification/2026-09-10-remove-apps-residue.md](../decisions/implemented/simplification/2026-09-10-remove-apps-residue.md)；
骨架 docs 无 apps/ 引用，无需改动。

## 6. 还剩什么阻塞

无。
