# Agent Note: upgrade 命令缺陷修复（README / 根定位 / 空目录 / 异常处理）

Status: implemented

## Problem

`psycho-frame upgrade` 首版有四个缺陷：用户自定义的 README.md 被模板覆盖；无显式目录参数
时按 cwd 定位（在项目子目录运行会把整套骨架撒进子目录）；任意空目录运行会静默生成全套
骨架；目标为文件等异常场景抛原始堆栈而非可读错误。

## Decision

- README.md 属用户内容：与模板不同时保留本地并报告，不覆盖、不备份；缺失时仍补模板
  起始版。
- 无显式目录参数时定位到 git 仓库根（与 verify/mode 一致），非 git 项目回退 cwd；显式
  目录参数仍按用户给定值解析。
- 前置守卫：目标须存在、为目录，且带骨架特征（AGENTS.md / .psycho-frame.json /
  package.json / docs 之一），否则中止并提示 init/adopt。
- upgrade 命令整体包 try/catch，异常输出一行可读错误、退出码 1。

## Alternatives considered

**README 也走模板优先、只靠备份兜底** — 否决：README 是项目门面，用户内容价值高于模板
一致性，覆盖后的恢复成本大于收益；保留本地 + 报告即可。

**根定位与 doctor 保持一致（默认 .）** — 否决：upgrade 会写文件、破坏性大于 doctor，
子目录误跑会散落 21 个文件；与 verify/mode 的 git 根解析一致更安全。

**空目录静默生成全套骨架** — 否决：与 init（空目录脚手架）和 adopt（旧项目只增不改）的
分工混淆，upgrade 只服务已有骨架项目。

**保留原始堆栈** — 否决：CLI 用户需要一行可读错误，堆栈留给开发期调试。

## Consequences

- README 用户内容不再被覆盖；子目录误跑不再污染目录树；非骨架项目得到明确指引。
- 前置守卫使 `--dry-run` 的 CI 用法更稳（对非骨架目录也返回错误而非零散文件）。
- 语义与此前 [skeleton-upgrade](../feature/2026-09-09-skeleton-upgrade.md) 决策互补：
  模板优先的主体不变，本记录只收紧用户内容边界与运行前置条件。
