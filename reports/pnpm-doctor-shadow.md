# pnpm doctor 内置命令遮蔽 执行报告

- task_key: pnpm-doctor-shadow
- 状态: 提交后置 DONE

## 1. 改了哪些文件

- [docs/development.md](../docs/development.md)：漂移检查指引 `pnpm doctor` → `pnpm run doctor`。
- [packages/psycho-frame/template/docs/development.md](../packages/psycho-frame/template/docs/development.md)：同上。
- 新增 [tasks/2026-09-09-pnpm-doctor-shadow.md](../tasks/2026-09-09-pnpm-doctor-shadow.md)、
  [decisions/implemented/process/2026-09-09-pnpm-doctor-shadowing.md](../decisions/implemented/process/2026-09-09-pnpm-doctor-shadowing.md)。

## 2. 实现了什么

文档指引的结构漂移检查改走 `pnpm run doctor`，规避 pnpm ≥ 11.14 内置 `pnpm doctor`
对同名 script 的遮蔽；script 与 CLI 子命令不变。

## 3. 跑了哪些命令

- `pnpm doctor` / `pnpm run doctor` 对比实测：前者命中 pnpm 内置诊断，后者命中仓库脚本。
- `pnpm change-scope --base d429948`：改动面仅上述 5 个文件。
- `pnpm verify:docs`：通过。

## 4. 验证结果

change-scope 改动面为文档/任务/报告/决策四类；verify:docs 全绿（链接、任务头字段、
决策记录结构、字数预算）。

## 5. 文档与决策是否同步

是：[docs/development.md](../docs/development.md)、模板 development.md 已改为当前状态；
决策记录见 [decisions/implemented/process/2026-09-09-pnpm-doctor-shadowing.md](../decisions/implemented/process/2026-09-09-pnpm-doctor-shadowing.md)。

## 6. 还剩什么阻塞

无。注意：当前改动在未合入 main 的 `yondern-website` 分支上。
