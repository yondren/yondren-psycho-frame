# upgrade-boundaries 执行报告

- task_key: upgrade-boundaries
- 状态: DONE

## 1. 改了哪些文件

升级、漂移检测、索引合并模块及 upgrade 测试；升级 cookbook（含模板）和既有升级决策。

## 2. 实现了什么

F03：全部目标和配置预检后写入；拒绝目录/文件/失效符号链接、共享硬链接和非普通文件。
F05：cookbook 索引保留本地说明及链接，只补模板条目；doctor 使用相同合同。
每次生成唯一备份目录和 manifest.json，备份全部修改前内容，单文件原子替换并复查并发修改。
运行时 I/O 中断仍可能部分完成，可按清单恢复；不承诺跨文件事务或对抗恶意并发目录替换。

## 3. 跑了哪些命令

- node packages/psycho-frame/src/cli.mjs scope --base main
- node --test packages/psycho-frame/test/*.test.mjs
- node packages/psycho-frame/src/cli.mjs verify

## 4. 验证结果

173/173 测试通过。路径反例验证外部内容不变、预检失败没有部分计划写入；自定义索引保留且升级幂等。
文档门禁通过。首次测试暴露新增文案超预算及测试误用返回对象，修正后全套通过。

## 5. 文档与决策是否同步

同步升级 cookbook 与既有骨架升级决策，修正 dry-run 退出码说明。

## 6. 合流状态

分支 upgrade-boundaries 已合入 main；worktree 已移除。

## 7. 还剩什么阻塞

无；真实发布与推送不在本任务范围。
