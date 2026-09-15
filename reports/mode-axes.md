# 会话模式新增语域与工程化两条轴 执行报告

- task_key: mode-axes
- 状态: IN_PROGRESS（实现与验证完成，待合流）

## 1. 改了哪些文件

门禁与 CLI：

- `packages/psycho-frame/src/work-mode.mjs`：开关表 `MODES`（默认值与封闭取值同源），新增
  `audience`（expert/product/novice，默认 `expert`）与 `engineering`（on/off，默认 `off`）；
  `DEFAULT_WORK_MODE`、`validateWorkMode`、`readWorkMode` 全部由该表派生。
- `packages/psycho-frame/src/cli.mjs`：usage 与 `help mode` 文案更新为六把开关，语义真源指向
  `docs/modes.md`。
- `.psycho-frame.json` 与 `packages/psycho-frame/template/.psycho-frame.json`：workMode 两条新键、
  `docs/modes.md` 预算 850。

文档：

- 新增 `docs/modes.md`（829 字）与 `packages/psycho-frame/template/docs/modes.md`：工作模式语义
  唯一家——纪律四开关、语域三档差异、工程化八项清单、叠加矩阵、调整方式与门禁边界。
- `docs/development.md`（778 → 613）与模板同名文件：工作模式节收敛为指针。
- `AGENTS.md`（480 → 505）、`packages/psycho-frame/template/AGENTS.md`：键名清单 + 开工前先
  `psycho-frame mode` 读一次。
- `docs/AGENTS.md` 与模板同名文件：分层表新增 modes.md 行。
- `docs/architecture.md`（577 → 584）、`docs/concepts.md`、
  `packages/psycho-frame/README.md`：扩展点、理念页与配置表同步。
- `website/scripts/content-map.mjs`：新增「工作模式」官网页。

测试：

- `work-mode.test.mjs`：两条新轴的合法/非法/缺省/增量合并。
- `cli.test.mjs`：六项回显、一次设置两条新轴、`reset`、非法取值、help 含新轴与语义页。
- `init.test.mjs`：新增模板落地断言（modes.md、AGENTS.md 与 docs/AGENTS.md 索引、两条新键与
  预算），原两条断言的目标文件改指 `docs/modes.md`。

决策与流程：

- 提案转 implemented：
  `decisions/implemented/feature/2026-09-15-communication-and-engineering-modes.md`。
- 三条既有 implemented 记录的事实同步（语义家链接 `docs/development.md` → `docs/modes.md`）：
  `2026-09-09-work-modes.md`、`2026-09-13-fleet-work-mode.md`、`2026-09-14-work-mode-merge.md`。
- `tasks/2026-09-15-mode-axes.md`（本任务卡）与本报告。

## 2. 实现了什么

`workMode` 从四把纪律开关扩到六把。`audience` 决定对话与报告的措辞和解释深度：`expert` 直接用
术语，`product` 讲用户影响与取舍，`novice` 从零解释并给可复制命令；三档都必须给出下一步与失败
处置——措辞可变，结论与失败细节的完整度不可变。`engineering=on` 时方案阶段逐项过八项清单
（结构边界、失败模式、可测试性、可观测性、性能与规模、兼容与迁移、回滚路径、决策记录归属），
允许逐项"无影响"，不允许整段跳过；非 `expert` 语域下清单照过，只把结论翻译成用户听得懂的说法。

门禁只校验取值合法，不新增章节级必填：语域是否真的落地由报告审查承担，不用形式合规冒充真合规。

## 3. 跑了哪些命令

```sh
node packages/psycho-frame/src/cli.mjs verify      # 126 个 Markdown 文件
node --test packages/psycho-frame/test/*.test.mjs  # 103 项
node packages/psycho-frame/src/cli.mjs scope --base main
node website/scripts/sync-content.mjs              # 生成 5 页，含新页 /guide/modes
```

## 4. 验证结果

- 门禁通过：链接与锚点、决策结构与格式、任务头字段、字数预算、工作模式取值全绿。
- 测试 103 项全通过，其中新增 4 项（audience 默认与配置优先、audience 非法不落盘、一次设置两条
  新轴与 reset、mode help 展示新轴与语义页）。
- 预算：`docs/modes.md` 829/850、`docs/development.md` 613/780、`AGENTS.md` 505/550、
  `docs/architecture.md` 584/600、`docs/AGENTS.md` 549/650。
- 官网同步：`docs/modes.md` 生成 `/guide/modes`；`docs/concepts.md` 与
  `packages/psycho-frame/README.md` 的站内链接正确，其余仓库内目标重写为 GitHub 直链。

## 5. 文档与决策是否同步

同步。语义唯一家在 `docs/modes.md`，其余位置只放键名与链接；模板与自举实例同批更新
（AGENTS.md、docs/development.md、docs/modes.md、docs/AGENTS.md、.psycho-frame.json）；
决策记录由提案转 implemented，并同步三条既有记录的事实链接。

## 6. 合流状态

分支 `mode-axes`（worktree `.worktrees/mode-axes`）尚未合流，等用户确认后 merge-forward 到 `main`。

## 7. 还剩什么阻塞

无。骨架维护模式任务在本次合流后开工——两任务同改模板、AGENTS.md 与 cookbook，串行避免冲突。
