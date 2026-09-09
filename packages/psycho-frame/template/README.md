# {{PROJECT_NAME}}

基于 [yondern-psycho-frame](https://www.npmjs.com/package/yondern-psycho-frame)
（见山处精神力骨架开发框架）的文档优先工程：知识全部以 Markdown + Git 承载，
任务、决策、报告三者分离，门禁机器可校验。

## 快速开始

```sh
pnpm install
pnpm verify:docs
pnpm change-scope --base main
```

阅读顺序：[AGENTS.md](AGENTS.md) → [docs/AGENTS.md](docs/AGENTS.md) →
[decisions/README.md](decisions/README.md) → [tasks/README.md](tasks/README.md)。

## 目录结构

| 目录 | 职责 |
| --- | --- |
| `docs/` | 当前事实：架构、开发流程、cookbook、事故 |
| `decisions/` | 决策记录：为什么、放弃了什么（唯一允许存"理由"的地方） |
| `reports/` | 单次执行的过程产物 |
| `tasks/` | 任务状态真源 |
| `.psycho-frame.json` | 门禁配置：封闭集合、字数预算、忽略路径 |
