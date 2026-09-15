# Agent Note: 工作模式新增沟通语域与工程化两条轴

Status: implemented

## Problem

[workMode](2026-09-09-work-modes.md) 原有的开关全是**行为纪律**（是否先出计划、歧义是否必问、是否派
子代理、分支是否合流），没有一把描述"对谁说话、用什么语域"。同一套骨架同时被工程师、产品经理与新手
使用，Agent 的口径却只有工程语域一种（worktree、merge-base、task_key、门禁）：非工程读者读不懂，
工程读者又不想要常识解释。

工程化同样只有 Agent 自觉：骨架强制的是文档纪律（决策记录、任务卡、门禁），没有任何一条要求在方案里
过一遍结构边界、失败模式、可测试性、兼容与迁移、回滚路径。文档整齐而代码失守时无人拦截。

两条诉求还相互耦合：非专业语域下把工程化判断原样输出，等于加高术语墙；专业语域下静默做工程化，等于
让专家看不到判断依据。这个耦合此前没有家。

## Decision

在 `workMode` 内新增两条与纪律开关正交的轴。键、默认值与封闭取值集中在
[work-mode.mjs](../../../packages/psycho-frame/src/work-mode.mjs) 的 `MODES` 表——`DEFAULT_WORK_MODE`
与校验、读取均由该表派生，`mode` CLI 的解析、回显与 reset 自动覆盖；语义与耦合矩阵的唯一家在
[docs/modes.md](../../../docs/modes.md)。

- 沟通语域 `audience`：`expert`（默认）/ `product` / `novice`。语域只改变**措辞与解释深度**，不改变
  结论、取舍与失败细节的完整度，三档都必须给出下一步与失败处置。
  - `expert`：直接用工程术语，不解释常识；结论先行，给路径、命令、退出码与失败细节。
  - `product`：先说"这对用户、范围、风险意味着什么"，再说怎么做；工程术语首次出现给一句人话，不用
    内部机制回答"为什么"。
  - `novice`：默认读者不知道 git / Node / pnpm 与骨架名词；每步说明在做什么、为什么、看得见的结果，
    给可直接复制的命令与失败处置，术语用类比解释一次并全篇一致。
- 工程化 `engineering`：`on` / `off`（默认 `off`，既有仓库行为不变）。`on` 时 Agent 在方案阶段逐项
  过工程化清单——结构边界与依赖方向、失败模式与错误处理、可测试性、可观测性、性能与规模、兼容与
  迁移、回滚路径、决策记录归属——并在计划或报告中给出结论；允许逐项"无影响"，不允许整段跳过。
- 叠加规则：静默的是措辞，不是判断。`engineering=on` 且语域非 `expert` 时清单照过，只把结论转成
  用户听得懂的说法。
- 门禁只校验取值合法：不新增章节级必填校验，语域是否真的落地由报告与审查承担，不用形式合规冒充
  真合规。
- 常驻触发：根 [AGENTS.md](../../../AGENTS.md) 与
  [template/AGENTS.md](../../../packages/psycho-frame/template/AGENTS.md) 要求开工前先
  `psycho-frame mode` 读一次，按 `audience` 决定措辞、按 `engineering` 决定是否过清单。
- 同步面：[concepts.md](../../../docs/concepts.md)、[docs/AGENTS.md](../../../docs/AGENTS.md)、
  [architecture.md](../../../docs/architecture.md)、
  [packages/psycho-frame/README.md](../../../packages/psycho-frame/README.md)、
  [content-map.mjs](../../../website/scripts/content-map.mjs)（新增官网页）与两处 `.psycho-frame.json`；
  语义从 [docs/development.md](../../../docs/development.md) 搬出后，后者只留指针。

## Alternatives considered

**做成预设命名模式（"专业模式/产品经理模式/新手模式"一次切换一组开关）** — 否决：预设命名模式在
[workMode 决策](2026-09-09-work-modes.md) 中已被否决（一个值切全套、组合不灵活、扩展需新预设）；
语域是一条独立轴，与 `plan` / `fleet` 的组合应由用户自行搭配。

**另开配置对象 `communication` / `engineering`** — 否决：`mode` 的解析、回显与 reset、verify 校验、
doctor 提示都从 `DEFAULT_WORK_MODE` 的键集合派生，第二个对象要在多处各开一套派生；语义上 `workMode`
就是"每次会话的行为开关"。

**不落配置，只在 AGENTS.md 里让 Agent 自行判断读者** — 否决：没有真源、换 Agent 即失效、用户无法
确认当前口径，也无法在对话中切换。

**语域加第四值 `adaptive`（Agent 自动判断读者）** — 否决：省一次配置，但结果不可预期、不可确认，
且"自动判断"无从复核；确有需求时再作为第四值增补。

**工程化只写文档、不落开关** — 否决：无法按项目或会话开关，也就无法给"非专业语域静默工程化"这条
耦合一个一致行为。

**把工程化结论做成章节级门禁校验（决策记录或报告必填小节）** — 否决：门禁只能校验"写了没"，不能
校验"想过没"，会把工程化退化成打勾；代价还包括改决策记录格式合同与存量记录迁移。

## Consequences

- 六把开关同表派生：新增开关只改
  [work-mode.mjs](../../../packages/psycho-frame/src/work-mode.mjs) 的 `MODES` 表，CLI 与门禁不再各自
  维护键列表。
- [docs/modes.md](../../../docs/modes.md)（预算 850）是工作模式语义、语域差异与耦合矩阵的唯一家；
  [docs/development.md](../../../docs/development.md) 只留一段指针与调整方式，常驻文档预算重新留出
  余量。
- 老项目零迁移：配置缺 `audience` / `engineering` 时用内置默认；`upgrade` 的配置增量合并会把两条新键
  与 `docs/modes.md` 预算补进消费者配置，并把新页写进项目。
- 官网新增「工作模式」页（[content-map.mjs](../../../website/scripts/content-map.mjs)）；
  [concepts.md](../../../docs/concepts.md) 与 `packages/psycho-frame/README.md` 指向它的链接在构建
  时重写为站内页。
- 测试看护：work-mode 覆盖两条新轴的合法/非法/缺省/增量合并，cli 覆盖六项回显、一次设置两条新轴与
  reset，init 覆盖模板副本、`docs/modes.md` 预算与索引落地。
- 残余风险：语域不可机器校验，配置成 `product` 不等于输出是人话；工程化清单也可能被打勾了事。两者
  都只能靠报告审查与"清单至少否决或修正一个方案点，或写明无一项触发"的验收纪律约束，不制造机器
  保证的假象。
