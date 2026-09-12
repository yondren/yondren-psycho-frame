# Agent Note: 官网内容映射收敛为单一真源

Status: implemented

## Problem

官网的页面映射写在 `website/scripts/sync-content.mjs` 的 MAP，sidebar 又手抄在
`website/.vitepress/config.mts`：新增或排序页面要改两处，两处顺序已经不一致（sidebar 把
decisions/tasks/reports 提前）；`docs:preview` 不跑同步，预览的是旧内容。

## Decision

映射表抽为 `website/scripts/content-map.mjs`（`src` / `dest` / `title` / `group`，数组顺序即
sidebar 顺序），并导出 `pageLink` 与 `sidebarGroups`；`sync-content.mjs` 与 `config.mts` 都从
这里取。`docs:preview` 先跑同步脚本。

## Alternatives considered

**让 config.mts 继续手写 sidebar** — 否决：两处真源必然漂移，顺序不一致已经是证据。

**解析生成页面的 frontmatter 来生成 sidebar** — 否决：生成物由脚本产出，再解析回来多一层依赖。

## Consequences

- 新增文档页只改 `content-map.mjs` 一处，sidebar 顺序随数组确定。
- 预览与构建都先同步，不会展示过期页面。
