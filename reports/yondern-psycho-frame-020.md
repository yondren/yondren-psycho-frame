# yondern-psycho-frame 0.2.0 发布 执行报告

- task_key: yondern-psycho-frame-020
- 状态: DONE

## 1. 改了哪些文件

- 版本 bump：`packages/psycho-frame/package.json` 与 `packages/create-yondern-psycho-frame/package.json`
  0.1.1 → 0.2.0；`packages/psycho-frame/template/package.json` devDependency ^0.1.1 → ^0.2.0。
- 打包缺陷修复：模板 `.gitignore` 改存为 `gitignore`（无点），init/adopt/upgrade 写入宿主时
  映射回 `.gitignore`——npm/pnpm pack 会丢弃名为 .gitignore 的文件且 npm install 会把它
  改名为 .npmignore，此前从 npm init 的新项目一直没有 .gitignore。
- 决策事实同步：`decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md`
  CLI 命令由五命令更新为七命令（+ mode、+ upgrade）。
- 新增本报告与 [tasks/2026-09-09-yondern-psycho-frame-020.md](../tasks/2026-09-09-yondern-psycho-frame-020.md)。

## 2. 实现了什么

自 0.1.1 起两个新功能（work-modes、upgrade）与一个 bug-fix（upgrade-fixes），非破坏性，
按 semver 升 minor 至 0.2.0；按依赖顺序发布两包；推送 origin main；结清上一 release 任务。

## 3. 跑了哪些命令

- `pnpm verify:docs`、`pnpm run doctor`、`node packages/psycho-frame/src/cli.mjs --version`
- `pnpm --filter yondern-psycho-frame pack`、`pnpm --filter create-yondern-psycho-frame pack`
  （tarball 内容与 workspace:^ 转换预检）
- 发布与推送命令待确认后执行

## 4. 验证结果

- tarball 安装冒烟：`npm install <tarball>` 后 init 出的项目 .gitignore 落地（含备份忽略
  行），mode / upgrade / verify / doctor 全过。
- `npm view` 两包版本均为 0.2.0；`git ls-remote origin main` 与本地 7d394e3 一致，
  main 与 origin 对齐。

## 5. 文档与决策是否同步

已同步。architecture 决策的 CLI 命令事实更新为七命令；打包缺陷修复新增
[template-gitignore-rename](../decisions/implemented/bug-fix/2026-09-09-template-gitignore-rename.md)
决策记录；上一 release 任务结清。

## 6. 还剩什么阻塞

无。
