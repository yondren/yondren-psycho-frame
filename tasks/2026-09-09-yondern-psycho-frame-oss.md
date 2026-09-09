# yondern-psycho-frame 开源化与 npm 分发

- task_key: yondern-psycho-frame-oss
- status: DONE
- created: 2026-09-09
- updated: 2026-09-09
- report: [reports/yondern-psycho-frame-oss.md](../reports/yondern-psycho-frame-oss.md)

## 范围

将文档优先骨架开源化为独立项目 yondern-psycho-frame（Yondern 见山处，精神力骨架开发
框架）：pnpm monorepo 拆分（核心包 + create 入口包）、门禁泛化（cwd 根解析 +
.psycho-frame.json 配置）、CLI 四命令（verify/scope/init/adopt/doctor）、模板与
add-only 采纳模式、业务代码 apps/ 不随项目迁移（保留在 git 历史）、MIT 许可。
