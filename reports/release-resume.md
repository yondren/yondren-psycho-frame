# release-resume 执行报告

- task_key: release-resume
- 状态: DONE

## 1. 改了哪些文件

发布脚本、支持输入现有 tarball 的消费方冒烟、发布状态回归测试、发布 cookbook/决策与架构说明。

## 2. 实现了什么

F08：prepare 校验任务状态、主 checkout、干净 main、远端精确 OID、版本与本地/远端 tag。
bump 后验证文档/内容、源码测试、doctor、包元数据与同一份 tarball 消费方教程，再 commit/tag。
Git common-dir 保存版本、原文件、验证阶段、产物 SHA-512、受测树/HEAD/tag、registry 与发布阶段。
resume 校验所有前提，逐包核对 registry 摘要，跳过相同包，只发缺失包；origin/mirror 失败可恢复。
本地锁、原子状态更新、明确租约与受测提交树校验防止错误继续。没有真实发布或外部推送。

## 3. 跑了哪些命令

- node packages/psycho-frame/src/cli.mjs scope --base main
- node --test packages/psycho-frame/test/*.test.mjs
- pnpm dlx node@18.20.0 --test packages/psycho-frame/test/release.test.mjs
- node scripts/smoke-package.mjs
- node packages/psycho-frame/src/cli.mjs verify --ci --base main --json
- 独立临时 Git 仓库（origin 为本机 bare repo）：node scripts/release.mjs patch --prepare --task-key=release-resume

## 4. 验证结果

全部 187 个测试通过；Node 18.20.0 全套 187/187 通过；追加 hook/tag 中断复合反例后，发布测试 8/8 通过。涵盖第二包失败、产物篡改、摘要冲突、
远端前进、本地/远端 tag 冲突、认证错误、测试失败、镜像推送失败后恢复、hook 改动提交树和 tag 写入中断。
真实 prepare 在隔离仓库完成 bump 到 0.5.1、当前测试、pack、同产物教程、commit/tag；产品仓库版本未变。
包消费方冒烟与文档门禁通过。首次 cookbook 文案超预算，精简后通过。

## 5. 文档与决策是否同步

发布 cookbook、原发布决策、架构与开发说明同步；总加固计划进入已实施记录。

## 6. 合流状态

已合入 main，任务 worktree 已移除。

## 7. 还剩什么阻塞

没有本地阻塞。真实 registry 凭据/2FA、远端 CI 和网站部署未验证；跨 Git/registry 无全局事务，
准备中断保留 originals 供人工恢复，已发布版本不可覆盖。
