# 项目评估加固验收报告

基于 [原始评估](project-assessment.md) 与[加固决策](../decisions/implemented/testing/2026-09-21-project-assessment-hardening.md)。
原始评估证据保留为历史快照；本报告记录 2026-09-21 实施后的结果。

## 修复范围与效果

| 发现 | 交付 | 效果与证据 |
| --- | --- | --- |
| F01、F04 | [commit-content-guard](commit-content-guard.md) | 扫描 index/工作树/中间提交；只删除决策无法过门禁，跳过项有回执 |
| F02、F09 | [task-hook-lifecycle](task-hook-lifecycle.md) | 原拒绝型 hook 保持生效；DONE key 不隐式重开；缺失报告/hooks 可恢复 |
| F03、F05 | [upgrade-boundaries](upgrade-boundaries.md) | 全量路径/配置预检；拒绝链接与错误节点；自定义索引不丢失，备份及恢复清单可用 |
| F10—F12 | [cli-contract-alignment](cli-contract-alignment.md) | doctor 子目录定位一致；仓库/网站路径规则分明；严格 SemVer 共用 |
| F06、F07 | [ci-onboarding-contract](ci-onboarding-contract.md) | 显式 CI 内容合同；完整教程可执行；PR 校验最低 Node、网站与双包消费方链路 |
| F08 | [release-resume](release-resume.md) | 保存并发布同一受测 tarball；摘要核对；半发布/镜像失败同版本恢复，过期基线拒绝 |

## 验证

- Node 26 核心及发布全套：187/187 通过。
- Node 18.20.0 全套 187/187 通过；追加 hook 改树/tag 写入中断复合反例后，发布测试 8/8 复验通过（当前合计 188 项）。
- 文档/预算门禁、显式 CI 内容门禁、网站构建、双包 tarball 的完整教程均通过。
- 在独立临时仓库运行真实 release prepare，完成 0.5.1 临时 bump、当前测试、pack、同产物教程、commit/tag。
  主仓库包版本保持 0.5.0，无真实 npm 发布或远端推送。
- 回归测试使用临时 Git/bare 仓库和 npm/pnpm 替身验证不可逆边界；消费方测试使用只提供本次产物的本地 registry。

## 边界与后续

远端 Linux/macOS × Node 18.20/22 CI 矩阵已配置，未推送，因此没有远端成功回执。
真实 npm 身份/2FA、公网分发、网站部署未验证。Windows 尚无 CI 回执，不将本机通过外推成 Windows 保证。
扫描对二进制/超大文件明确报告跳过；轻量 Markdown 并非完整 CommonMark。
升级 I/O 中断可能部分完成；发布跨 registry/Git 无事务，恢复记录不能撤销已发布版本。
已有 branch-hygiene 任务维持 DEFERRED，未借此次修复启动其流程变更。

## 收尾

六个修复任务各自提交并合流；最终 main/worktree/任务检查结果在收尾提交中登记。
下一步可派发新任务；正式发布或推送另行执行。
