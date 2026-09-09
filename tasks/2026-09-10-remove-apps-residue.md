# 移除 apps/ 残留业务代码，仅保留骨架代码

- task_key: remove-apps-residue
- status: DONE
- created: 2026-09-10
- updated: 2026-09-10
- report: [reports/remove-apps-residue.md](../reports/remove-apps-residue.md)

## 范围

OSS 拆分后 main checkout 仍残留 apps/：被跟踪的 apps/fde-server/data/leads.db（拆分提交误入
跟踪）与被忽略的 node_modules/、dist/、.env、data/uploads/ 产物。从当前树彻底移除，仅保留
骨架代码；git 历史按 OSS 决策保留。

## 进度

- [DONE] 2026-09-10 合流 main：apps/ 当前树与磁盘残留全部清除，git 历史保留。
