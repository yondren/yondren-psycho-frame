# cli-contract-alignment 执行报告

- task_key: cli-contract-alignment
- 状态: DONE

## 1. 改了哪些文件

CLI、文档解析、自升级、共用 SemVer、发布脚本；相关测试、配置与文档标准（含模板）。

## 2. 实现了什么

F10：doctor 无参数定位 Git 根，显式目标仍相对 cwd。
F11：仓库链接拒绝 Unix/Windows 绝对路径，网站目录通过 webRoots 声明；匹配围栏字符/长度，支持尖括号路径和平衡括号。
F12：版本比较与 bump 共用严格 SemVer，RC→stable、数字预发布与 build metadata 有一致处理，非法缓存/registry 结果失效。

## 3. 跑了哪些命令

- node packages/psycho-frame/src/cli.mjs scope --base main
- node --test packages/psycho-frame/test/*.test.mjs
- node packages/psycho-frame/src/cli.mjs verify

## 4. 验证结果

179/179 测试通过，文档门禁通过。新增文案首次超预算，精简后通过；没有调高预算。

## 5. 文档与决策是否同步

CLI README、文档标准、配置及 CLI 合同决策同步；模板不默认授予网站豁免。

## 6. 合流状态

已合入 main，worktree 已移除。

## 7. 还剩什么阻塞

无。Markdown 明确为轻量子集，完整渲染插件由网站构建检查。
