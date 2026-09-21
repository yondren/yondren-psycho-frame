# Agent Note: CI 与消费方教程合同

Status: implemented

## Problem

本地 worktree 假设无法用于 CI clone；教程缺少安装、Git 基线与隔离任务步骤，打包/create 链路缺少 PR 检查。

## Decision

显式 verify --ci --base 独立于环境变量和 destroy 模式启用内容门禁：文档、提交绑定（允许多个任务）、
改动中的有效决策、index/工作树/中间提交及当前受跟踪文件凭据。destroy=off 仅 tasks/reports 收尾可免决策，
on 没有该豁免。首次仓库用根提交作基线并扫描全树，不能假称已检查此前历史。
CI 不检查本机 worktree 存在性、不执行配置命令矩阵（仍校验配置）；输出说明职责转移，workflow 承担矩阵。

核心门禁和测试在 Linux/macOS、Node 18.20.0/22 上配置；开发/网站/pnpm 流程使用 Node 22。
PR 执行网站构建及双包 tarball 离线安装、create、完整教程任务生命周期冒烟，不使用发布凭据。
教程的 shell 命令由冒烟直接读取，联网入口替换为本地受测产物。

## Alternatives considered

**检测 CI 环境变量后跳过 destroy** — 会静默关闭内容保护，无法审计。

**在 clone 中伪造 worktree** — 与用户工作事实不符，保留可复现的职责分工。

**只测试源码 init** — 覆盖不到包内文件清单、workspace 依赖固化和 create 转发。

## Consequences

工作模式开关不再意外导致 CI 缺少本地 worktree 而失败；CI 必须提供明确基线和完整历史。
额外全树扫描是保守保护，二进制/超大文件等跳过项仍明确输出。跨平台配置的真实结果以远端 CI 为准。
