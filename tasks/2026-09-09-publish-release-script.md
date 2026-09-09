# 发布脚本：零依赖 release.mjs 固化两包锁步发布

- task_key: publish-release-script
- status: DONE
- created: 2026-09-09
- updated: 2026-09-09
- report: [reports/publish-release-script.md](../reports/publish-release-script.md)

## 范围

调研并落地发布脚本：结论为保持 yondern-psycho-frame 与 create-yondern-psycho-frame
两包锁步发布（npm/pnpm create 协议要求独立 create-* 包，见
[2026-09-09-publish-release-script](../decisions/implemented/process/2026-09-09-publish-release-script.md)
决策记录）；新增零依赖 scripts/release.mjs 固化清单（bump 两包 + 模板 pin → 预检 →
pack 检查 → commit/tag → 按序双发 → push，默认不发布不推送）；根 package.json 加
release 脚本；同步 docs/development.md 包发布节与 docs/architecture.md 扩展点。

## 进度

- [DONE] 2026-09-09 脚本实现、临时 clone 全链路自测（bump/门禁/pack 预检/commit/tag
  全过）、文档与决策同步、提交并推送 origin main。
