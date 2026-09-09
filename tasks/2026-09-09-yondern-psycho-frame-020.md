# yondern-psycho-frame 0.2.0 发布：bump、预检、npm publish、push origin

- task_key: yondern-psycho-frame-020
- status: DONE
- created: 2026-09-09
- updated: 2026-09-09
- report: [reports/yondern-psycho-frame-020.md](../reports/yondern-psycho-frame-020.md)

## 范围

自 0.1.1 起两个新功能（work-modes、upgrade）与一个 bug-fix（upgrade-fixes），非破坏性，
升 minor：yondern-psycho-frame 与 create-yondern-psycho-frame 0.1.1 → 0.2.0，模板
devDependency 同步 ^0.2.0；修复打包缺陷（模板 .gitignore 改存无点 gitignore，写入宿主
映射回 .gitignore，规避 npm pack 丢弃与 npm install 改名）；预检（verify:docs / doctor /
pack + tarball 安装冒烟）；按依赖顺序发布两包；推送 origin main；同步 architecture 决策
的 CLI 命令事实；结清上一 release 任务。

## 进度

- [DONE] 2026-09-09 两包 0.2.0 已发布 npm，origin/main 与本地 7d394e3 对齐。
