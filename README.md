# yondren-psycho-frame

见山处（Yondren）精神力骨架开发框架：把"现在是什么样""为什么这样定""做到哪一步""这次怎么
做的"分成四层放进仓库，用一条命令挡住文档腐化。零运行时依赖，新项目与旧项目都能装。

## 30 秒跑起来

```sh
npm create yondren-psycho-frame@latest my-project
cd my-project
pnpm install && pnpm verify:docs
```

得到 `docs/`（当前事实）、`decisions/`（理由）、`tasks/`（状态）、`reports/`（过程）与
`AGENTS.md`（AI 每次会话自动读到的规则）。手把手走完整回路见
[使用教程](docs/cookbook/tutorial.md)。

## 三条安装路径

| 场景 | 命令 | 特点 |
| --- | --- | --- |
| 新项目 | `npm create yondren-psycho-frame@latest` | 脚手架，目标目录须为空 |
| 旧项目 | `npx yondren-psycho-frame adopt .` | 只增不改，不覆盖既有文件 |
| 长期使用 | `pnpm add -D yondren-psycho-frame` | 门禁随 devDependency 升级 |

## 门禁：让腐化在提交前失败

```sh
pnpm verify:docs
```

一次校验链接与锚点、决策记录结构、任务头字段、字数预算、工作模式取值；零依赖，仅需
Node ≥ 18.20。全部命令与配置见 [CLI 与配置](packages/psycho-frame/README.md)，设计取舍见
[核心理念](docs/concepts.md)。

## 仓库结构

| 路径 | 职责 |
| --- | --- |
| [packages/psycho-frame/](packages/psycho-frame/README.md) | 核心包：门禁 + CLI + 模板 |
| [packages/create-yondren-psycho-frame/](packages/create-yondren-psycho-frame/README.md) | npm create 入口包 |
| `docs/` `decisions/` `tasks/` `reports/` | 本仓库自举使用的知识四层 |
| [.psycho-frame.json](.psycho-frame.json) | 门禁配置 |
| [website/](website/README.md) | 官网（VitePress，内容由仓库文档生成） |

## 阅读顺序

[AGENTS.md](AGENTS.md) → [docs/AGENTS.md](docs/AGENTS.md) →
[decisions/README.md](decisions/README.md) → [tasks/README.md](tasks/README.md)。

## 许可

MIT（见 [LICENSE](LICENSE)）。
