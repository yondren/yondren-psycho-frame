# yondren-psycho-frame

见山处（Yondren）精神力骨架开发框架：文档优先的工程骨架，任务、决策、报告、事实四层
分离，门禁机器可校验，零运行时依赖。任何新项目或旧项目都可以通过 npm 安装使用。

## 安装

```sh
npm create yondren-psycho-frame@latest   # 新项目
npx yondren-psycho-frame init 目录        # 等价脚手架
npx yondren-psycho-frame adopt 目录       # 旧项目：只增不改
pnpm add -D yondren-psycho-frame          # devDependency，门禁随版本升级
```

## 命令

| 命令 | 作用 |
| --- | --- |
| `verify` | 文档门禁：链接/锚点、决策格式、任务头字段、字数预算、工作模式取值 |
| `scope --base <ref>` | 四层改动面报告 |
| `mode` | 查看 / 设置工作模式（plan、confirmAmbiguous），写回配置 |
| `upgrade` | 骨架文件一键升级（模板优先 + 本地改动自动备份，配置增量合并，README 保留本地），`--dry-run` 预览 |
| `init` / `adopt` | 新项目脚手架 / 旧项目 add-only 采纳 |
| `doctor` | 结构漂移检查 |

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
