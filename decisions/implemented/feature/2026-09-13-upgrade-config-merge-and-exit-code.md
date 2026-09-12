# Agent Note: upgrade 配置深合并与 dry-run 退出码

Status: implemented

## Problem

`upgrade` 的配置合并只补顶层缺失键：模板向既有对象（如 `budgets`）新增子键时，消费方项目
永远拿不到。`--dry-run` 在有变更时退出码为 1，预览在 CI 里表现为失败，无法只做提醒。

## Decision

`mergeConfig` 在两侧同为普通对象时下探一层补缺失子键（`added` 记为 `k.sub`），仍不覆盖任何
用户值，数组不合并。`--dry-run` 默认退出码 0，新增 `--exit-code` 使预览有变更时退出码为 1；
`upgrade` 同时校验参数，未知选项与多目录参数退出码 2。

## Alternatives considered

**递归合并任意深度** — 否决：合并语义越深越难解释，一层足以覆盖配置的既定形状。

**数组也做并集** — 否决：`decisionClasses` 等数组的顺序与裁剪是用户意图，补元素会造成意外。

**保持 dry-run 有变更即退出 1** — 否决：把“预览”与“失败”混为一谈，CI 只能靠解析输出判断。

## Consequences

- 模板新增 `budgets` 条目可随 `upgrade` 进入消费方项目。
- CI 用 `upgrade --dry-run --exit-code` 检测漂移；本地预览不再被当作失败。
