# Agent Note: 模板 gitignore 改存无点文件名

Status: implemented

## Problem

npm/pnpm pack 会丢弃名为 `.gitignore` 的文件，且 npm install 会把包内的 `.gitignore`
改名为 `.npmignore`；模板里直接存 `.gitignore` 导致从 npm init 的新项目一直没有
.gitignore（dist/、node_modules 等不被忽略）。

## Decision

模板内改存无点文件 `gitignore`，init / adopt / upgrade 写入宿主时经 RENAMES 映射回
`.gitignore`，文件内容不变；映射表在 `packages/psycho-frame/src/init.mjs` 与
`packages/psycho-frame/src/upgrade.mjs`。

## Alternatives considered

**files 字段显式列入 template/.gitignore** — 否决：pack 阶段可纳入 tarball，但消费者
npm install 时仍会把文件改名 .npmignore，问题照旧。

**安装脚本在宿主生成 .gitignore** — 否决：postinstall 隐式写入被安全审查反感且 pnpm
默认禁止，违反"一律走显式 CLI 命令"的既有决策。

## Consequences

- 从 npm init 的新项目首次获得完整 .gitignore；升级路径同样生效（缺失补齐、行级合并）。
- 模板内文件名与宿主文件名不同，修改模板时需经 RENAMES 映射，init 与 upgrade 共用该表。
