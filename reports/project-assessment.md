# 项目综合评估报告

- task_key: project-assessment
- 日期：2026-09-21
- 对象：yondren-psycho-frame；核心包和 create 入口包均为 0.5.0。
- 基线：main，005b69233c7b2a9a015aa904b512d3331edc280f。
- 环境：macOS / Node v26.7.0 / pnpm 11.20.0。
- 任务状态见[任务卡](../tasks/2026-09-21-project-assessment.md)。

## 结论

**项目具备小团队实际使用的基础，但还不宜被当作可信的提交安全与升级安全保证。**

定位明确、模块规模可控、正常路径测试充分、零运行时依赖，源码打包后的初始化和门禁也能跑通。作为有人工审查的文档工程与任务协作工具，已有实用价值。

本次在基础检查全部通过的前提下，复现三项应优先解决的问题：凭据扫描漏查 Git 暂存区、任务创建绕过既有提交 hook、升级沿符号链接改写目标目录之外的文件。建议先做一轮可靠性加固，再继续增加工作模式或检索功能。

这里没有真实凭据泄露、真实用户文件损失或线上故障的证据。复现全部发生在临时目录，严重度表示修复优先级，不是漏洞利用评分。

## 1. 范围与方法

审查覆盖十个核心模块、create 入口、模板、十个测试文件、发布脚本、两套 GitHub Actions、官网生成流程，以及架构、任务、决策和操作文档；另执行十个临时目录探针。

主 checkout 在开始时已有官网未提交改动：站点配置、网站说明、自定义主题和 public 资源。本报告以已提交 main 为基线，这些改动仅做补充源码观察，不计入版本评价。构建通过结论也只针对已提交网站，没有对未提交主题做视觉、移动端或无障碍验收。

证据分三类：

| 标记 | 含义 |
| --- | --- |
| 实测 | 本机执行得到结果，有命令或可复现脚本 |
| 静态 | 源码、配置、文档直接支持；没有实际执行外部发布 |
| 判断 | 根据证据作出的工程取舍，不代表市场或用户研究 |

[复现脚本](project-assessment/repro.mjs)会创建临时消费方项目及 Git 仓库，结束后清理；[原始结果](project-assessment/evidence.json)记录退出码和回执。仅使用没有密钥正文的合成识别标记，不读取或输出真实凭据。

本次未查询远端 CI、npm 发布状态、下载量或留存，不推断线上部署与商业成熟度；没有在 Node 18/20/22、Linux 或 Windows 上本地重跑矩阵。

## 2. 项目画像与优势

基线有 212 个 Git 跟踪文件，其中 Markdown 163 个；核心源码 10 个模块、2,599 行；测试及辅助代码 1,921 行；决策记录 40 篇、任务卡 34 张、模板文件 33 个。行数含注释和空行，不含评估产物及原有未提交改动。

值得保留的设计：

1. **知识分层清楚。** docs、decisions、tasks、reports 分别承载事实、理由、状态和过程，Markdown + Git 的迁移成本低。
2. **规则已有执行入口。** 链接、锚点、决策结构、任务字段、字数预算和模式取值均有机器检查。
3. **核心模块按职责拆分。** 门禁、改动面、模式、任务、升级、脚手架相互区分，核心包没有第三方运行时依赖。
4. **改动面实现比较谨慎。** scope 要求显式 base，校验唯一 merge-base，使用 NUL 分隔路径并区分四层 Git 改动。
5. **打包设计有实际保障。** create 入口转发核心 CLI，模板处理 gitignore 重命名，发布脚本核对两包版本及模板 pin。
6. **官网映射集中。** 同一 content-map 同时驱动内容同步与侧栏，减少复制。

依据见[架构](../docs/architecture.md)、[改动面实现](../packages/psycho-frame/src/change-scope.mjs)、[包元数据](../packages/psycho-frame/package.json)和[官网映射](../website/scripts/content-map.mjs)。

适用性判断：最适合有 Git/CLI 经验、需要多人或多个 Agent 接手的团队。对一次性脚本、短期实验，任务卡、报告、决策、worktree 与合流的完整成本可能大于收益。

产品定位宜聚焦“可审查的仓库知识与工作流约束”。格式门禁不能证明文档语义正确、每个事实只有一个家，或者 Agent 必然遵守模式；这些仍需审查。

## 3. 验证结果

| 检查 | 实测结果 | 结论边界 |
| --- | --- | --- |
| 工作模式 | plan=on、confirmAmbiguous=true、fleet=off、merge=ask、destroy=off、audience=expert、engineering=off | 没有改变模式 |
| change-scope | 显式 base=main，基线和 HEAD 为报告中的 OID | 初始仅有本次任务和报告占位 |
| 文档门禁 | 初始退出 0，165 个 Markdown 文件 | 含两份评估占位；不保证语义一致 |
| doctor | 退出 0，7 个必需文件齐全 | 源码仓库跳过模板漂移比较 |
| task check | 退出 0 | 当前嵌套 worktree 符合现有检查 |
| 测试 | 162/162 通过，0 失败、0 跳过，约 10.05 秒 | 单机 Node v26.7.0 |
| 官网构建 | 退出 0，8 个文档页面同步完成，VitePress v1.6.4 | 已提交版本；不是体验验收 |
| 核心包 pack | 退出 0，46 个归档条目，52,030 bytes | 有 template/gitignore，无 .gitignore 条目 |
| create 包 pack | 退出 0，4 个条目，1,873 bytes | 核心依赖转换为 ^0.5.0 |
| tarball 消费方 | 解包核心包，init=0、verify=0，25 个 Markdown 文件 | 未经 registry 下载或全局安装 |
| 边界探针 | R1—R10 均完成 | 完成不表示行为合格，结果见附件 |

Node 原生 coverage：总体行覆盖率 **91.57%**、分支覆盖率 **83.68%**、函数覆盖率 **91.50%**。

| 模块 | 行覆盖率 | 分支覆盖率 | 说明 |
| --- | --- | --- | --- |
| CLI | 90.69% | 49.18% | 大段帮助文本也计入行覆盖率，分支覆盖更有参考价值 |
| self-update | 56.60% | 80.43% | 实际自升级、后台检查等路径覆盖不足 |
| destroy | 97.52% | 89.55% | 高覆盖仍遗漏 Git 多快照组合场景 |
| upgrade | 94.09% | 89.02% | 缺符号链接及自定义内容交互场景 |
| worktree | 96.85% | 79.81% | 缺既有 hook 与任务状态复用路径 |
| work-mode | 100% | 100% | 模式表同源，现有取值路径覆盖充分 |

**覆盖率不等于全仓库覆盖率。** 发布脚本、create 入口及网站脚本未出现在这张采集表中，仓库也没有覆盖率阈值。高行覆盖率无法证明跨模块行为可靠。

测试和构建的原始摘要见[验证日志](project-assessment/validation.txt)。

## 4. 优先修复问题

P1 表示可能错误放行提交或改写目标范围外文件，建议下一版本发布前处理；P2 表示主要流程或交付可信度问题；P3 为契约和诊断改进。

### F01 · P1 · 凭据扫描没有检查实际待提交内容〔实测 R1〕

触发：把合成敏感标记 git add，然后只清理工作目录文件，不重新暂存。

结果：index 仍含标记，完整 verify --json --base main 却返回 exit 0、destroy=true、ok=true。普通 git commit 使用 index 内容，因此工作目录已清理并不意味着待提交内容安全。

原因：[destroy.mjs](../packages/psycho-frame/src/destroy.mjs)第 40–62 行只读工作目录文件。scope 虽收集四层路径，后续合并丢失了各层内容快照。

建议：提交前扫描 index blob；针对 base..HEAD 明确是否检查历史提交，不能仅检查最终工作树。未跟踪和未暂存内容单独处理。验收必须包含“index 不安全、工作树安全”的反例，并明确删除、二进制及超大文件策略。

### F02 · P1 · task start 绕过既有提交 hook〔实测 R2〕

触发：消费方已有生效的 pre-commit，然后运行 task start。

结果：原仓库中的拒绝型 hook 使提交退出 1；新 worktree 内提交退出 0，同时 task check 报零问题。

原因：[worktree.mjs](../packages/psycho-frame/src/worktree.mjs)第 321–325 行创建空目录并覆盖 core.hooksPath，没有衔接既有 hook。文档明确“不内置 installer”，但不能因此假定既有格式、测试或凭据检查继续生效。

建议：检测已有 hooks 后明确继承、包装或重装策略；无法安全衔接时中止并给出迁移步骤。验收同时证明“路径隔离”和“原检查继续执行”。

### F03 · P1 · upgrade 可沿符号链接改写项目外文件〔实测 R3〕

触发：消费方 docs 是指向项目外目录的符号链接。

结果：upgrade 退出 0，外部 architecture.md 被模板覆盖。所有操作均发生在本次临时目录。

原因：[upgrade.mjs](../packages/psycho-frame/src/upgrade.mjs)第 143–200 行没有校验目标及父级目录的 realpath 边界，写入会跟随链接。备份不能消除目标范围之外发生修改的事实。

建议：写入前完成全量边界预检，默认拒绝越界 symlink，覆盖目录链接、文件链接和失效链接。建立变更清单及回滚清单，明确允许的目标所有权。

### F04 · P2 · 删除决策也能满足“新增或更新”要求〔实测 R4〕

触发：baseline 有一条决策，任务只删除它并修改代码，不新增或更新决策。

结果：完整毁灭门禁返回 exit 0、ok=true。

原因：[destroy.mjs](../packages/psycho-frame/src/destroy.mjs)第 169 行只检查路径前缀；改动面没有保留 diff 状态，删除路径也算数。

建议：按 diff status 识别新增、修改和有效重命名目标，确认记录仍存在且合法；删除不能充当满足要求的证据。补充“只有删除”“非 Markdown 占位”等反例。

### F05 · P2 · upgrade 丢失 cookbook new 产生的索引项〔实测 R5〕

触发：用 cookbook new 创建自定义手册后执行 upgrade，即使模板版本没有变化。

结果：自定义页面保留，索引条目消失；verify 无错误，doctor 退出 0。

原因：[cookbook.mjs](../packages/psycho-frame/src/cookbook.mjs)修改用户索引，而 [upgrade.mjs](../packages/psycho-frame/src/upgrade.mjs)将同一索引整页恢复成模板。两个合法功能之间存在文件所有权冲突。

建议：对扩展索引采用生成、结构化合并或保留用户区块，检查页存在但未被索引的情况。本次未发现页面正文删除，索引旧版可在升级备份中找到，但需要用户人工恢复。

### F06 · P2 · 上手教程与现行流程不一致〔静态〕

[教程](../docs/cookbook/tutorial.md)第 64 行起仍指导手工建卡，日常循环没有 task start/worktree/合流步骤，第 144 行使用 pnpm doctor；[既有决策](../decisions/implemented/process/2026-09-09-pnpm-doctor-shadowing.md)已说明该命令会被 pnpm 内置命令遮蔽，应使用 pnpm run doctor。

教程前置写 Node ≥18.20，模板却锁定 pnpm 11.20.0，而[开发说明](../docs/development.md)写明该 pnpm 的环境下限为 Node ≥22.13。必须区分 CLI 支持的运行时与推荐完整流程的要求。从空目录到提交也缺少 git init 与基线提交步骤；scaffold 不初始化 Git。

[核心理念](../docs/concepts.md)还写“六把开关”，遗漏 destroy。这些是官网生成源，网站单一来源不会自动修正错误的源内容。

建议：从全新目录实际执行环境准备、初始化 Git/基线、task start、文档、验证、提交和合流全路径；概念页减少重新列举，链接模式真源。

### F07 · P2 · CI 与兼容性、工作模式合同未对齐〔静态 + R10〕

[ci.yml](../.github/workflows/ci.yml)只跑 Ubuntu + Node 20/22；发布包 engines 为 ≥18.20，最低声明版本没有矩阵证据。Windows 和 macOS 也没有该矩阵证据。这是验证缺口，不是已证实不兼容。

[docs.yml](../.github/workflows/docs.yml)只在 main push 和手动触发时构建，PR 不构建网站。发布脚本和 packed create 消费方流程也不在 PR 检查中。

destroy 被描述为本地门禁，但开关写入 Git 跟踪配置，verify 不区分 CI。R10 模拟单一 checkout 加 destroy=on 后，现有 CI 的 verify 调用退出 1，报缺任务及显式 base；直接提交此模式会影响 CI。

建议：对齐 engines 与测试矩阵；在相关 PR 检查中增加网站构建、tarball 安装/create 冒烟。显式区分 CI 静态门禁与本地 worktree 纪律检查，避免靠临时改配置维持。

### F08 · P2 · 发布失败恢复与发布前测试闭环不足〔静态〕

[release.mjs](../scripts/release.mjs)第 218 行后先写版本，执行 verify/doctor/pack，再提交、打 tag 和依次发布。流程没有运行单元测试，也没有验证发布对象对应的测试成功证明。

第二包失败时第一包可能已发布，但脚本没有“继续同版本缺失包”的入口；tag 冲突等问题也未全部提前检查。验证的是临时 tarball，实际 publish 又从工作目录打包，没有直接发布已经验证的那个文件。

第 173–177 行检查的是相对缓存 origin/main 的领先提交，没有验证 HEAD 等于刚获取的远端 OID。远端前进、本地落后时仍可能先发布，再在推送阶段失败。

以上是静态失效路径分析；本次没有真实发布、制造远端落后或模拟 2FA，不声称线上发生过半发布。

建议：建立可恢复的 prepare、validate、publish、verify、push 阶段；发布已验证 tarball，记录摘要，支持同版本补发。预检 tag、任务状态及精确远端 OID，用本地命令替身或假 registry 验证失败恢复。

### F09 · P2 · task start 成功后立即违反自身纪律〔实测 R7〕

触发：main 存在 DONE 卡片，同名分支和 worktree 已清理，再用相同 key 开任务。

结果：startTask 返回 ok=true，卡片仍为 DONE，随后 task check 报“DONE 仍留着 worktree”。

原因：[worktree.mjs](../packages/psycho-frame/src/worktree.mjs)第 329 行仅在卡不存在时写初始状态；存在 worktree 的早返回也不校验完整后置条件。

建议：区分新建与恢复，拒绝 DONE key 或提供显式 reopen；成功前确认任务卡、报告、状态和 hook 都符合合同。半完成创建应可恢复或清理。

## 5. 次优先级问题

| 编号 | 级别 | 证据和影响 | 建议 |
| --- | --- | --- | --- |
| F10 | P3 | R6：在健康仓库 docs 子目录运行 doctor，退出 1 并误报缺文件。CLI 顶部注释承诺 Git 根定位，实际默认 cwd | 无显式目标时统一 resolveRoot，或明确不同语义并修订注释 |
| F11 | P3 | R8：不存在的 Unix 绝对路径链接通过 verify。verify-docs 第 104 行把 / 开头直接视为外部链接，与相对路径规范不一致 | 区分网站根链接和仓库绝对路径，明确 Markdown 支持子集 |
| F12 | P3 | R9：self-update 比较 0.5.0 与 0.5.0-rc.1 得到相等，同版本稳定版不能触发升级提示 | 统一版本语义，覆盖 RC 到 stable；若不支持预发布，应收紧声明 |

其他设计边界：

- 轻量正则解析不等于完整 Markdown 渲染器；复杂围栏、链接与自定义锚点需要合同测试。
- 任务 created/updated 只检查存在，没有完整日期有效性及先后检查。索引完整性、归档正文禁止修改、替代方案非空等规则也不能由当前门禁全面保证。
- ignore 在遍历后过滤，不避免走进大型忽略目录。同步文件读取与多次 Git 调用可能影响规模，但本次未做大型仓库 benchmark，不据此断言性能故障。
- 多数工作模式是给 Agent 的行为约定，配置合法不等于行为执行。
- 自举 doctor 跳过框架源码的模板漂移比较，能避免覆盖富文档，但其通过不能证明模板与源文档一致。
- 本次已有三个不同的根定位实现，以及不同的版本比较逻辑；小规模可维护，继续扩展前宜收敛共用契约。

## 6. 分维度判断

| 维度 | 结论 | 主要依据 |
| --- | --- | --- |
| 产品定位 | 清晰 | 知识分层与 CLI 价值可具体解释 |
| 架构可维护性 | 较好 | 核心规模小、职责拆分、模式表同源 |
| 正常路径可靠性 | 较好 | 162 个测试、构建、打包、消费方冒烟通过 |
| 边界与失败安全 | 需优先加固 | F01–F05、F09 的实测 |
| 测试体系 | 有基础但不完整 | 核心高覆盖，缺交互、发布及承诺环境矩阵 |
| 文档和上手 | 体系好，一致性不足 | 教程落后，环境与命令前置不一致 |
| 发布运维 | 有工具，恢复能力不足 | 两包锁步和预检具备，半发布恢复未闭合 |
| 性能与规模 | 尚不足以判断上限 | 小规模实测顺利，未测大仓库 |
| 商业和社区成熟度 | 无法判断 | 缺外部用户、贡献者与使用数据 |

不提供加权总分：安全边界问题不能由正常路径和文档质量的平均分抵消。是否进入更广泛使用，应以明确发布条件判断。

## 7. 改进路线与验收

以下为单个熟悉仓库维护者的初步人日估计，不含外部发布、跨平台排障及审查等待，拆任务后应重新估算。

| 阶段 | 内容 | 初步工作量 | 验收重点 |
| --- | --- | --- | --- |
| A：下一版本前 | F01–F04、F09 | 3–5 人日 | 暂存区正确扫描、原 hook 继续生效、拒绝越界写入、删除决策不能放行、任务后置条件成立 |
| B：随后一个迭代 | F05–F08 | 4–7 人日 | 升级保留扩展索引、教程全路径可执行、PR 覆盖交付路径、发布可恢复 |
| C：稳定后 | F10–F12、错误码、检索路由与规模基准 | 2–4 人日，不含完整检索实现 | 目录和版本语义一致、机器输出稳定、得到真实规模与上下文成本数据 |

设计和接受条件见[待审加固提案](../decisions/proposed/testing/2026-09-21-project-assessment-hardening.md)，该提案未实施，不代表已批准产品行为变更。

建议持续观察：

- 受支持边界反例的错误放行率。
- 首次用户从空目录完成流程的成功率和失败步骤。
- 升级后的自定义文档与索引保留情况。
- 被验证 tarball 与被发布产物是否一致。
- 中断后恢复同版本发布的操作次数与耗时。
- Agent 接手所需读取文件数、上下文字数和重复补问次数。

已有[上下文检索提案](../decisions/proposed/architecture/2026-09-13-skeleton-context-retrieval.md)可复用，但应先刷新其中的数量和模板现状；它仍为 proposed，不按已实现能力评价。

## 8. 执行记录与交付状态

### 改了哪些文件、实现了什么

仅添加本报告、隔离复现脚本和结果、任务卡、待审提案，并登记索引。产品源码未修改，报告所述缺陷仍然存在。

评估脚本初次执行因自身路径层级计算不对而失败，调整到报告附件目录后重新执行成功；这是评估工具错误，不计为产品缺陷。

### 跑了哪些命令

~~~sh
node packages/psycho-frame/src/cli.mjs mode
pnpm change-scope --base main
pnpm verify:docs
pnpm run doctor
node packages/psycho-frame/src/cli.mjs task check
node --test --experimental-test-coverage packages/psycho-frame/test/*.test.mjs
pnpm docs:build
node reports/project-assessment/repro.mjs
~~~

对两个包分别执行 pnpm --filter <包名> pack --pack-destination <临时目录>，检查归档和 package.json，再解包核心包执行 init 与 verify。临时打包目录已清理，没有 publish。

首次 pnpm 命令自动安装本 worktree 依赖，遇到 registry ECONNRESET 重试后成功。裸 psycho-frame 在本次 shell 中不可用，源码 CLI 和 pnpm 入口可用，不计作 CLI 逻辑缺陷。

交付前按 main 再取改动面，文档门禁扫描 174 个 Markdown 文件并通过，task check 与 git diff --check 通过；数量包含网站构建生成的 8 页和本次新增记录。

### 文档与决策同步

评估事实归本报告及证据附件，修复设计归待审提案。产品状态文档不提前宣称修复。任务卡关联报告，报告与决策索引登记入口。

### 合流与剩余事项

报告交付在 project-assessment 分支及独立 worktree，未合流、未推送。本次是评估请求，产品修复与合流留待后续决定。任务卡保留 IN_PROGRESS，注明评估交付完成、集成未执行，以符合“DONE 不留 worktree”的纪律。

评估没有剩余阻塞；后续工作是审阅并按优先级落实加固。
