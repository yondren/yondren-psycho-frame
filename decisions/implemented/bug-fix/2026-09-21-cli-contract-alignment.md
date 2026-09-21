# Agent Note: CLI 路径与版本合同

Status: implemented

## Problem

doctor 默认目录、Markdown 链接分类与版本比较跨模块不一致，可能误报结构、放行本机路径或漏掉稳定版升级。

## Decision

doctor 无目录参数时定位 Git 根，显式目录相对 cwd。文档默认拒绝本机绝对路径，网站目录通过 webRoots
明确声明，只有其站内根链接交给网站构建。轻量 Markdown 子集见 [文档标准](../../../docs/AGENTS.md)。
SemVer 模块由更新检查和发布共享：拒绝非法版本，数字预发布标识按数值比较，稳定版高于同版本预发布，
build metadata 不参与排序。无效 registry 结果和缓存按查询失败/过期处理，不安装不合法版本。

## Alternatives considered

**把所有 / 链接视为外部地址** — 放行仓库本机路径，违背可移植性。

**把全部 / 链接一律拒绝** — 会误伤官网路由，使用显式目录归属缩小豁免面。

**引入完整 Markdown/SemVer 依赖** — 运行时零依赖是产品约束；保留明确子集及有判别力的回归测试。

## Consequences

消费方可配置网站目录；默认模板不授予目录豁免。解析边界明确，复杂渲染插件由其构建工具校验。
发布与自升级使用相同排序及 bump 语义，RC 升稳定版可正确提示。
