# Agent Note: 沟通语域与工程化：两条新的会话模式轴

Status: proposed

## Problem

[workMode](../../implemented/feature/2026-09-09-work-modes.md) 现有四把开关全是**行为纪律**（是否先出
计划、歧义是否必问、是否派子代理、分支是否合流），没有一把描述"对谁说话、用什么语域"。同一套骨架
同时被工程师、产品经理与新手使用，Agent 的口径却只有工程语域一种（worktree、merge-base、task_key、
门禁）：非工程读者读不懂，工程读者又不想要常识解释。

工程化同样只有 Agent 自觉：骨架强制的是文档纪律（决策记录、任务卡、门禁），没有任何一条要求在方案
里过一遍结构边界、失败模式、可测试性、兼容与迁移、回滚路径。文档整齐而代码失守时无人拦截。

两条诉求还相互耦合：非专业语域下把工程化判断原样输出，等于加高术语墙；专业语域下静默做工程化，
等于让专家看不到判断依据。这个耦合目前没有家。

## Proposal

在 `workMode` 内新增两条与既有四把开关正交的轴，沿用同一真源、同一 `mode` CLI、同一封闭校验：键与
默认值由 [work-mode.mjs](../../../packages/psycho-frame/src/work-mode.mjs) 的 `DEFAULT_WORK_MODE`
派生，CLI 的解析、回显与 reset 自动覆盖，无需另开派生。

- 沟通语域 `audience`：`expert`（默认）/ `product` / `novice`。语域只改变**措辞与解释深度**，不改变
  结论、取舍与失败细节的完整度——这是语域合同的硬规则。
  - `expert`：直接用工程术语，不解释常识；结论先行，给路径、命令、退出码与失败细节。
  - `product`：先说"这对用户、范围、风险意味着什么"，再说怎么做；工程术语首次出现给一句人话；不用
    内部机制回答"为什么"。
  - `novice`：默认读者不知道 git / Node / pnpm 与骨架名词；每步说明在做什么、为什么、看得见的结果；
    给可直接复制的命令与失败时怎么办；术语用类比解释并保持一致。
- 工程化 `engineering`：`on` / `off`（默认 `off`，既有仓库行为不变）。`on` 时 Agent 在方案阶段逐项
  过工程化清单——结构边界与依赖方向、失败模式与错误处理、可测试性、可观测性、性能与规模、兼容与
  迁移、回滚路径、决策记录归属——并在方案或报告中给出结论；允许逐项"无影响"，不允许整段跳过。
- 耦合矩阵（唯一家：[development.md](../../../docs/development.md)）：

  | engineering | audience | 输出方式 |
  | --- | --- | --- |
  | `on` | `expert` | 清单逐项写结论，用术语，含失败模式与回滚 |
  | `on` | `product` | 清单照过，输出转成"用户影响 / 范围 / 风险 / 退路"，术语首次出现解释一次 |
  | `on` | `novice` | 清单照过，输出转成"这么做以后会怎样、不做会怎样"，给命令与失败处置 |
  | `off` | 任意 | 不强制过清单，Agent 可自愿 |

  静默的是措辞，不是判断：`engineering=on` 时"想过"始终发生，只是非专业语域下用用户听得懂的说法
  呈现。
- 切换：对话中直接要求（"用新手模式说"），Agent 用 `psycho-frame mode set audience=novice` 持久化，
  配置仍是唯一真源。
- 同步面：[development.md](../../../docs/development.md)（语义家与耦合矩阵）、
  [concepts.md](../../../docs/concepts.md) 与 [AGENTS.md](../../../AGENTS.md)（键名 + 链接）、
  [packages/psycho-frame/README.md](../../../packages/psycho-frame/README.md) 配置表（经
  [content-map.mjs](../../../website/scripts/content-map.mjs) 上官网）、
  [template/](../../../packages/psycho-frame/template/AGENTS.md) 副本与
  [work-mode.test.mjs](../../../packages/psycho-frame/test/work-mode.test.mjs)。

## Alternatives considered

**做成预设命名模式（"专业模式/产品经理模式/新手模式"一次切换一组开关）** — 否决：预设命名模式在
[workMode 决策](../../implemented/feature/2026-09-09-work-modes.md) 中已被否决（一个值切全套、组合不
灵活、扩展需新预设）；语域是一条独立轴，与 plan / fleet 的组合应由用户自行搭配。

**另开配置对象 `communication` / `engineering`** — 否决：`mode` 的解析、回显与 reset、verify 校验、
doctor 提示都从 `DEFAULT_WORK_MODE` 的键集合派生，第二个对象要在多处各开一套派生；语义上 `workMode`
就是"每次会话的行为开关"，两条新轴属于该定义。

**不落配置，只在 AGENTS.md 里让 Agent 自行判断读者** — 否决：没有真源、换 Agent 即失效、用户无法
确认当前口径，也无法在对话中切换。

**语域加第四值 `adaptive`（Agent 自动判断读者）** — 暂不采纳：省一次配置，但结果不可预期、不可确认，
且"自动判断"无从复核；若后续确有需求，作为第四值增补优于现在猜测。

**工程化只写文档、不落开关** — 否决：无法按项目或会话开关，也就无法给"非专业语域静默工程化"这条
耦合一个一致行为。

## Acceptance criteria

- `workMode` 支持 `audience`（expert/product/novice）与 `engineering`（on/off）且可缺省；`verify`
  对非法取值报错；`mode` / `mode set` / `mode reset` 自动覆盖新键。
- 门禁只校验配置：`verify` 不新增章节级必填校验，语域是否真的落地由报告审查与演练证据承担。
- [development.md](../../../docs/development.md) 是语域差异与耦合矩阵的唯一家，其余位置只放键名与
  链接。
- 预算冲突先于语义落地：[development.md](../../../docs/development.md) 现 778/780、[AGENTS.md](../../../AGENTS.md)
  现 480/550，按"先搬迁、再精简、最后才提预算"处理；新语义页（如 `docs/modes.md`）先建，再写语义。
- 模板与自举实例同批更新：`template/AGENTS.md`、`template/docs/development.md` 与对应 cookbook 页；
  否则 `upgrade` 会把消费者文档换成"提到新键但语义家缺失"的版本。
- [work-mode.test.mjs](../../../packages/psycho-frame/test/work-mode.test.mjs) 覆盖新键的合法/非法/
  缺省/reset 回显。
- 至少一次真实演练：同一需求分别在 `audience=product` 与 `audience=expert` 下产出的方案与报告片段
  进入 reports/，作为语域可区分的证据。
- `pnpm verify:docs` 与 `pnpm test` 通过。

## Risks

- **语域不可机器校验**：门禁只能证明配置是 `product`，不能证明输出是产品语言。取舍已定：门禁只校验
  配置取值，不新增任何章节必填；"人话摘要"只作为报告层的文档合同与审查项，不用形式合规冒充真合规。
- **工程化清单形式主义**：逐项打勾却不影响设计。缓解是验收要求清单至少否决或修正一个方案点，或在报告
  中说明"无一项触发"的理由。
- **术语墙反弹**：新手档被用来掩饰啰嗦或回避技术细节。缓解是语域合同那条硬规则——措辞可变，结论、
  取舍与失败细节的完整度不可变。
- **开关组合膨胀**：六条轴让行为难预期。缓解是各轴取值封闭、语义各家唯一，并明确不做组合预设。
- **最紧的预算先爆**：[development.md](../../../docs/development.md) 只剩 2 字余量，若先写语义再想
  搬迁，门禁会卡在实现中途；缓解是把搬迁作为实现任务的第一步。
