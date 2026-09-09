# 骨架一键升级命令（psycho-frame upgrade）执行报告

- task_key: skeleton-upgrade
- 状态: DONE

## 1. 改了哪些文件

- 新增 `packages/psycho-frame/src/upgrade.mjs`（upgrade 语义：模板优先 + 备份 + 配置增量合并 + --dry-run）
- 改 `packages/psycho-frame/src/cli.mjs`（upgrade 命令 + USAGE）、`init.mjs`（导出 walkFiles/sanitizeName，
  doctor 缺文件提示指向 upgrade）、`verify-docs.mjs`（门禁遍历排除 `.psycho-frame-upgrade/`）
- 配置：根 `.gitignore` 与 `packages/psycho-frame/template/.gitignore` 加 `.psycho-frame-upgrade/`
- 文档：根 `README.md`、`docs/development.md`、`docs/architecture.md`、
  `packages/psycho-frame/README.md` 与 template 的 `docs/development.md`、`docs/architecture.md` 同步
- 决策 `decisions/implemented/feature/2026-09-09-skeleton-upgrade.md`、任务
  `tasks/2026-09-09-skeleton-upgrade.md`

## 2. 实现了什么

`psycho-frame upgrade [目录]`（默认 `.`）把模板骨架文件一键同步进已有项目：缺文件补齐；
与模板一致跳过；不一致的普通文件更新为模板版并先把本地版本备份到
`.psycho-frame-upgrade/<时间戳>/`；配置增量合并（.psycho-frame.json 补模板新增键、
package.json 补缺失 scripts、.gitignore 补新增行），用户值永不覆盖；`--dry-run` 只预览
（有变更退出码 1，可作 CI 预检）。用户自有内容（decisions/tasks/reports 记录、自建文档页）
不在模板内，不受影响。

## 3. 跑了哪些命令

- `node --check` × 3 个 src 文件
- 临时项目（/tmp）冒烟：init → 制造旧版+自定义（删 workMode、加用户键、改 AGENTS.md、
  删 postmortem、删 doctor 脚本、加 gitignore 行）→ `--dry-run`（退出 1、零写入）→
  正式 upgrade → 校验各文件 → 幂等重跑 → verify/doctor
- 边界用例：损坏 .psycho-frame.json（报错退出 1、不写文件）；缺 package.json（新增并
  替换项目名）
- `pnpm change-scope --base 09bb5df`、`pnpm verify:docs`、`pnpm run doctor`、官网 sync

## 4. 验证结果

- 冒烟全绿：workMode 恢复且用户键 ignore 保留；AGENTS.md 更新为模板版且备份内容为改动
  前本地版；postmortem 恢复；doctor 脚本补回且用户脚本 dev 保留；gitignore 用户行保留、
  备份目录忽略行并入；第二次 upgrade 零变更退出 0；升级后 verify/doctor 通过
- 发现并修复：备份目录内的 Markdown 会干扰 verify 链接检查（walk 排除
  `.psycho-frame-upgrade/`）；无覆盖时不再声称"已备份"；有错误且零变更时提示语修正
- verify:docs 通过、doctor 通过、官网 sync 12 页无报错

## 5. 文档与决策是否同步

已同步。决策记录随本提交落地；README×2 命令表、architecture×2 扩展点/门禁层、
development×2 门禁分工与 .gitignore×2 同步；官网经 sync MAP 自动展示 upgrade。

## 6. 还剩什么阻塞

无。版本号 bump 与发布按既有分工留给 release 任务（本任务与 work-modes 同批升 0.2.0）。
