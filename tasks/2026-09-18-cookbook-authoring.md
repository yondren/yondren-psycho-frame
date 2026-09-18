# cookbook 自动整理：命令、技能与共享工具链范例

- task_key: cookbook-authoring
- status: DONE
- created: 2026-09-18
- updated: 2026-09-18
- report: [reports/cookbook-authoring.md](../reports/cookbook-authoring.md)

## 范围

本次包含：`psycho-frame cookbook new <slug> [--title] [--budget]`（生成 cookbook 骨架、登记索引、
登记字数预算）；`docs/cookbook/authoring-cookbooks.md`（把用户大白话描述的重复痛点整理成 cookbook
的判定与五问）；`.agents/skills/author-cookbook/SKILL.md`（触发这条流程的技能）；`docs/cookbook/
shared-toolchain.md`（以 Java/Maven/JDK「一套就够、全员共用」为例的共享工具链范例）；索引、预算、
官网映射、模板镜像、测试与决策记录。

本次不包含：把已有 cookbook 自动改写或合并、把用户痛点自动判定为 decisions/ 或 postmortem/ 的机器
判定（仍由 agent 判断后人工确认）、`psycho-frame pr` / `issue` 命令（任务 `pr-issue-cookbook` 已否决）。

## 进度

- [DONE] 2026-09-18 worktree `cookbook-authoring` 内实现：`cookbook new` 命令、两本 cookbook、
  author-cookbook 技能、索引/预算/官网映射/模板镜像与决策记录。
- [DONE] 2026-09-18 验证：测试 162 项全过、文档门禁 163 个文件通过、`task check` 通过、毁灭模式
  自审全绿、模板落地与 npm 打包检查通过。
- [DONE] 2026-09-18 修掉 dogfooding 抓到的假阳性：任务卡合并视图改为主 checkout 权威（回归测试锁定）。
- [DONE] 2026-09-18 已按用户授权合流到 `main`（`8df7b56`），worktree 已删除。
