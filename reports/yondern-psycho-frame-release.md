# yondern-psycho-frame 首次发布 执行报告

- task_key: yondern-psycho-frame-release
- 状态: DONE

## 1. 改了哪些文件

- 合并：yondern-website FF 合入 main（6 个提交：开源化、官网、pnpm doctor 遮蔽修复）。
- 新增本报告与 [tasks/2026-09-09-yondern-psycho-frame-release.md](../tasks/2026-09-09-yondern-psycho-frame-release.md)。
- 发布后同步 [decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md](../decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md) 的发布事实。

## 2. 实现了什么

yondern-psycho-frame 0.1.1 与 create-yondern-psycho-frame 0.1.1 发布到 npmjs.org
（账号 chaocham）；0.1.0 已于 2026-09-08 发布且 npm 禁覆盖同版本号，故升 0.1.1；
模板 devDependency 同步升 ^0.1.1；main 与 origin 对齐。

## 3. 跑了哪些命令

- `git merge --ff-only yondern-website`
- `pnpm verify:docs`
- `pnpm pack` 预检两包 tarball 内容与 workspace:^ 转换
- `pnpm publish`（先 psycho-frame 后 create）
- `git push origin main`

## 4. 验证结果

0.1.1 已在 npm（0.2.0 发布前 `npm view` 返回 0.1.1）；发布与推送由
[yondern-psycho-frame-020.md](yondern-psycho-frame-020.md) 结清，main 与 origin 对齐
7d394e3。

## 5. 文档与决策是否同步

发布事实由 0.2.0 发布报告承载；本任务剩余目标被 020 任务吸收。

## 6. 还剩什么阻塞

无。
