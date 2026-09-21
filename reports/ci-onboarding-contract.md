# ci-onboarding-contract 执行报告

- task_key: ci-onboarding-contract
- 状态: DONE

## 1. 改了哪些文件

CI/网站/模板 workflow、CI 内容门禁、CLI、教程与安装提示、分发冒烟脚本、模式文档和决策。

## 2. 实现了什么

F06：显式安装、Git 基线、task start、决策/报告、验证、提交、合流与 DONE 的完整教程。
F07：verify --ci --base 在 clone 保留内容/决策/提交绑定，独立于 destroy 开关；不执行本地 worktree 与矩阵，说明职责转移。
PR 配置 Linux/macOS Node 18.20.0/22 核心测试；增加网站与双包 tarball/create/完整教程冒烟。
本地 registry 只提供本次 tarball，避免同版本间接依赖落入已有 registry 包。

## 3. 跑了哪些命令

- node packages/psycho-frame/src/cli.mjs scope --base main
- node --test packages/psycho-frame/test/*.test.mjs
- pnpm dlx node@18.20.0 --test packages/psycho-frame/test/*.test.mjs
- pnpm install --frozen-lockfile
- node scripts/smoke-package.mjs
- pnpm docs:build
- node packages/psycho-frame/src/cli.mjs verify --ci --base main --json

## 4. 验证结果

Node 26 与 Node 18.20.0 各 180/180 测试通过；网站构建、完整 tarball 教程和 CI 内容门禁通过。
初次 tarball 本地安装仍解析到旧版间接依赖，改为专用本地 registry 后证明使用当前产物。
教程最后工作区干净、仅主 worktree、任务 DONE。远端 Linux/macOS 矩阵尚未运行（未推送）。

## 5. 文档与决策是否同步

同步模式/CLI/教程/安装入口与模板，并登记 CI 合同决策。首次提交基线边界明确：扫描当前树，不宣称扫描更早历史。

## 6. 合流状态

已合入 main，worktree 已移除。

## 7. 还剩什么阻塞

无本地阻塞；远端 CI 等待后续推送。
