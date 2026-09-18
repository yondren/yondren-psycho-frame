# Agent Note: 提 issue 与 PR 的 cookbook 与模板

Status: implemented

## Problem

骨架管到提交与本地合流为止，跨仓协作这一段没有合同：agent 被要求"提个 issue / PR"时，标题格式、
正文结构、验证证据怎么写全凭临场发挥，凭据写进正文也没有提示，审查者拿到的是格式各异的单子。
`.github/` 只有 CI 配置，没有可填的 PR 与 issue 模板。

## Decision

新增 [cookbook/submit-pr.md](../../../docs/cookbook/submit-pr.md)：该开什么（issue / PR / 都不开）、
正文结构（范围、改动面、验证证据含退出码、决策记录、风险与回退、未包含项、task_key）、`gh` 命令
范式（`--body-file`，草稿写 `.local/`）、无 `gh` 或远端非 GitHub 时打印正文交人粘贴、等 CI 与回应
review 的规则（追加提交、租约保护、不自动合并、不自动关闭）。

仓库与模板同步落地 `.github/PULL_REQUEST_TEMPLATE.md` 与 `.github/ISSUE_TEMPLATE/`（bug_report、
feature_request）：模板只承载小节骨架，规则与理由的唯一家在 cookbook。

配套两处：`verify-docs.mjs` 的目录遍历把 `.local/` 与依赖、缓存、worktree 副本、升级备份一起跳过，
草稿里的临时坏链接不会让门禁失败；模板 `.gitignore` 同步预留 `.local/`。

## Alternatives considered

**做成 `psycho-frame pr` / `issue` 薄封装命令** — 否决：forge 适配（gh / glab / codeup）是长期维护
面，而自动化收益主要来自正文结构与纪律而不是拼命令；先把合同写下来，命令留作后续候选。

**正文结构直接写进模板文件，cookbook 只写命令** — 否决：模板是骨架形状，规则与理由需要唯一家
（[文档标准](../../../docs/AGENTS.md)）；两处都写会让小节一改就要同步两个家。

**允许 agent 自动合并已过 CI 的 PR** — 否决：合并牵涉范围与时机判断，仍由人决定；自动合并会把
"提 PR"变成绕过审查的通道。

## Consequences

- agent 可以直接开 issue 与 PR，正文与验证证据有统一形状；不自动合并、不自动关闭。
- `.local/` 成为草稿的默认位置，已被 .gitignore 与门禁共同跳过。
- 模板与仓库共用同一套模板文件，消费者 `upgrade` 后拿到 `.github/` 三个新文件（doctor 先报骨架
  漂移属预期）。
- 非 GitHub 远端只有回退路径（打印正文交人粘贴），不承诺自动开单。
