# 骨架打磨：升级合并语义、dry-run 退出码、官网单一真源、verify JSON 执行报告

- task_key: polish
- 状态: DONE

## 1. 改了哪些文件

- `packages/psycho-frame/src/upgrade.mjs`：`mergeConfig` 下探一层补对象子键。
- `packages/psycho-frame/src/cli.mjs`：`verify --json`；`upgrade` 参数校验与 `--exit-code`；
  两处 USAGE 与专属帮助同步。
- `website/scripts/content-map.mjs`（新增）：映射表 + `pageLink` + `sidebarGroups`。
- `website/scripts/sync-content.mjs`：改用 `content-map.mjs`。
- `website/.vitepress/config.mts`：sidebar 由 `sidebarGroups()` 生成。
- `website/package.json`：`docs:preview` 先跑同步。
- 文档：`website/README.md`、`docs/architecture.md`、根 `README.md`、包 README。
- 测试：`test/cli.test.mjs`（新增）与 `test/upgrade.test.mjs`（深合并用例）。
- 决策：`feature/2026-09-13-upgrade-config-merge-and-exit-code.md`、
  `simplification/2026-09-13-website-content-map-single-source.md`、
  `feature/2026-09-13-verify-json-output.md`。

## 2. 实现了什么

`upgrade` 的配置合并能在对象键下补模板新增的子键（如 `budgets` 新条目），仍不覆盖用户值；
`--dry-run` 默认退出码 0，`--exit-code` 让 CI 用退出码检测漂移，未知选项与多目录参数退出 2。
官网页面映射收敛为 `content-map.mjs` 单一真源，sidebar 与内容生成共用，预览前先同步。
`verify --json` 输出 `{ formatVersion, ok, count, errors }`。

## 3. 跑了哪些命令

- `node --test packages/psycho-frame/test/*.test.mjs`
- `node packages/psycho-frame/src/cli.mjs verify`
- `node packages/psycho-frame/src/cli.mjs verify --json`
- `pnpm install --frozen-lockfile && pnpm docs:build`

## 4. 验证结果

- 测试：81/81 通过。
- 文档门禁：通过；`verify --json` 输出结构与退出码符合预期。
- 官网构建：`pnpm docs:build` 成功（vitepress v1.6.4，同步 13 个页面，sidebar 由
  `content-map.mjs` 生成且顺序与旧手写一致）。

## 5. 文档与决策是否同步

- 命令面同步到包 README、根 README 与 CLI 帮助；官网真源同步到 `docs/architecture.md`
  与 `website/README.md`。
- 三条决策记录覆盖升级合并/退出码、官网单一真源、verify JSON。

## 6. 还剩什么阻塞

- 无阻塞。P0 官网基路径由用户处理，不在本任务范围。
