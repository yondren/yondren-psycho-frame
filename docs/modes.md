# 工作模式

工作模式是每次会话的行为开关，真源在 [.psycho-frame.json](../.psycho-frame.json) 的 `workMode`：
五把纪律开关（`plan`、`confirmAmbiguous`、`fleet`、`merge`、`destroy`）加两条轴——沟通语域
`audience` 与工程化 `engineering`。取值封闭，非法值由 `pnpm verify:docs` 拦下；调整方式见文末。

## 纪律开关

- `plan=on`（默认）：改动文件前先给出实施计划，经用户确认后才动手；`off` 仍显式说明计划，但不等待
  确认（off 不等于不计划）。
- `confirmAmbiguous=true`（默认）：需求不明确（未确认的需求、歧义、缺失信息）必须先问，禁止自行
  假设；`false` 允许合理假设继续，假设须在计划或报告显式标注。
- `fleet=off`（默认）：`on` 时可独立切分的批量、检索、整理、提取、分类工作优先派发子代理并行，
  主线程保留架构决策与最终验收；派发包与收口见 [cookbook/fleet-mode.md](cookbook/fleet-mode.md)。
- `merge=ask`（默认）：任务分支的本地合流，`auto` 直接合、`ask` 先问、`off` 不合流，都不含推送；
  触发、目标与失败语义见 [cookbook/merge.md](cookbook/merge.md)。
- `destroy=off`（默认）：`on` 时把门禁拉满，见下节。

## 毁灭模式（destroy）

`destroy=on` 时 `psycho-frame verify` 追加一组硬检查，把纪律从文档约定变成可失败的门禁。它只加严，
不改动其他六把开关；默认关闭，常规提交不付这份成本。

追加的检查（缺一即 `verify` 失败）：

1. **worktree 纪律**：`psycho-frame task check` 的全部项——`IN_PROGRESS` 必须有对应 worktree、
   `DONE` 不留 worktree、无孤儿 worktree、根 checkout 不检出任务分支、各 worktree 的
   `core.hooksPath` 互不相同（[cookbook](cookbook/parallel-worktrees.md)）。
2. **任务绑定**：当前分支名取成 task_key，或全仓库只留一个 `IN_PROGRESS` 任务卡，且状态允许提交。
3. **显式基线**：必须 `--base <父分支 ref>`，绝不猜 `origin/<branch>`。
4. **决策记录**：改动面至少新增或更新一条 `decisions/` 记录——微小改动豁免在此不适用。
5. **提交绑定**：`base..HEAD` 的每个非合并提交都含 task_key。
6. **凭据扫描**：改动面内的文本文件不得命中 token 与私钥模式，命中只报位置不回显内容；确认是
   假阳性时在该行加 `psycho-frame:allow-secret`。
7. **本地全量矩阵**：配置 `destroyChecks` 列出的命令逐条执行，任一失败即门禁失败；该字段不写
   `verify` 自身（会自递归）。

```sh
psycho-frame mode set destroy=on
psycho-frame verify --base main
```

代价是 `verify` 变慢、本地全量矩阵成为提交硬要求；本地最窄验证与 CI 全量矩阵的分工
（[development.md](development.md)）仍是默认行为。毁灭模式是本地门禁：CI 只有单一 checkout，
任务分支必然在根 checkout 检出，接进 CI 会恒失败；CI 继续跑自己的 `verify` + `doctor` + `test`。

## 沟通语域（audience）

`audience` 决定对话与报告面向谁：`expert`（默认）、`product`、`novice`。

硬规则：语域只改变措辞与解释深度，不改变结论、取舍与失败细节的完整度；三档都必须给出下一步与
失败怎么办。

| 取值 | 面向 | 术语 | 必须给到 |
| --- | --- | --- | --- |
| `expert` | 工程师 | 直接用（worktree、merge-base、门禁、task_key），不解释常识 | 结论先行；路径、命令、退出码、失败细节 |
| `product` | 产品/业务读者 | 首次出现给一句人话，之后沿用 | 用户影响、范围、风险、优先级、退路 |
| `novice` | 新使用者 | 用类比解释一次并全篇一致 | 每步"在做什么/为什么/看得见的结果"、可复制命令、失败处置 |

## 工程化（engineering）

`engineering=on` 时 Agent 在方案阶段逐项过一遍工程化清单，并在计划或报告中给出结论：允许逐项
"无影响"，不允许整段跳过。

1. 结构边界与依赖方向
2. 失败模式与错误处理
3. 可测试性
4. 可观测性
5. 性能与规模
6. 兼容与迁移
7. 回滚路径
8. 决策记录归属

`off`（默认）不强制，Agent 可自愿过一遍。

## 两条轴如何叠加

静默的是措辞，不是判断：`engineering=on` 时清单始终被过一遍，非专业语域只改变呈现方式。

| engineering | audience | 输出方式 |
| --- | --- | --- |
| `on` | `expert` | 清单逐项写结论，用术语，含失败模式与回滚 |
| `on` | `product` | 清单照过，输出为"用户影响 / 范围 / 风险 / 退路"，术语首次出现解释一次 |
| `on` | `novice` | 清单照过，输出为"这么做以后会怎样、不做会怎样"，给命令与失败处置 |
| `off` | 任意 | 不强制过清单 |

## 调整

```sh
pnpm exec psycho-frame mode                      # 查看七把开关
pnpm exec psycho-frame mode set audience=novice  # 换语域
pnpm exec psycho-frame mode set engineering=on   # 打开工程化
pnpm exec psycho-frame mode set destroy=on       # 门禁拉满
pnpm exec psycho-frame mode reset                # 恢复默认
```

对话中直接要求即可，Agent 用 `mode set` 持久化到配置；配置是唯一真源，对话不产生第二事实源。

门禁只校验取值合法：语域是否真的落地由报告与审查承担，不存在"配置成 product 就算说人话"的机器保证。
