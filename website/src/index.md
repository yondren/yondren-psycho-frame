---
layout: home

hero:
  name: yondren-psycho-frame
  text: 见山处精神力骨架
  tagline: 把四层知识放进 Git：Agent 之间共享同一份记忆，多个任务在本地 worktree 并行，一条命令挡住文档腐化。
  actions:
    - theme: brand
      text: 快速上手
      link: /guide/getting-started
    - theme: alt
      text: 使用教程
      link: /guide/tutorial
    - theme: alt
      text: 查看 GitHub
      link: https://github.com/yondren/yondren-psycho-frame

features:
  - title: "Agent 之间共享同一份记忆"
    details: "记忆不留在会话里，而是落在仓库：事实、理由、状态、过程各归其位，规则写在 AGENTS.md。换 Agent、换工具、开新 worktree，读到的都是同一份——知识随仓库走，交接不用重新交代上下文。"
    link: /guide/concepts
    linkText: 核心理念
  - title: "本地多 worktree 并行"
    details: "一个任务一个 checkout，并行任务永不共享工作区。<code>psycho-frame task start &lt;task_key&gt;</code> 一条命令建分支、worktree、任务卡与报告占位，并隔离各 worktree 的 hooks。"
    link: https://github.com/yondren/yondren-psycho-frame/blob/main/docs/cookbook/parallel-worktrees.md
    linkText: 并行 worktree 工作流
  - title: "无需复杂配置"
    details: "零运行时依赖，只跑 Node 内置模块；没有 <code>.psycho-frame.json</code> 也能用内置默认跑门禁，要调再写一个 JSON。没有数据库、没有 SaaS 看板、没有私有格式。"
    link: /reference/cli
    linkText: CLI 与配置
  - title: "文档不再腐化"
    details: "docs/ 存当前事实、decisions/ 存理由、tasks/ 存状态、reports/ 存过程；每个事实只有一个家，改动只发生在一处。"
    link: /guide/concepts
    linkText: 核心理念
  - title: "一条命令挡住漂移"
    details: "verify 一次校验链接与锚点、决策结构、任务头字段、字数预算与工作模式；零依赖，Node ≥ 18.20 即可运行。"
    link: /reference/cli
    linkText: CLI 与配置
  - title: "新项目旧项目都能装"
    details: "npm create 起新项目、adopt 只增不改地改造旧项目、devDependency 让门禁随版本升级。"
    link: /guide/getting-started
    linkText: 快速上手
---

## 解放生产力

把该机器管的交给机器：规则常驻 `AGENTS.md`，状态有唯一真源，腐化由门禁在提交前挡下。人和 Agent
的时间花在判断与取舍上，而不是同步上下文与维护文档。

装上骨架只要一条命令，见[快速上手](/guide/getting-started)。
