---
name: author-cookbook
description: 用户用大白话描述反复出现的工作方式痛点时（"每次都要…"、"这帮 AI 各自搞一套"、"我希望以后共用一套"），把它整理成 docs/cookbook/ 下的操作手册并登记索引与预算。
---

# 把用户痛点整理成 cookbook

## 1. 判定够格

重复出现、跨会话、可验证、有稳定做法，四条同时满足才写 cookbook；只有一次、或结论还在校验中，
先开 issue 或写报告。

## 2. 五问

问用户，不要替他假设：触发场景 / 现在的做法 / 为什么不行 / 正确做法 / 怎么验证。问不出来就给
草案并标注待确认，不用"应该""大概"填空。

## 3. 落地

```sh
psycho-frame cookbook new <slug> --title "<标题>"
```

命令生成骨架、登记索引、登记字数预算；随后填步骤。重复出现的约束同时在根 `AGENTS.md` 加一条
常驻命令指向该 cookbook。

## 4. 验证

`pnpm verify:docs` 通过；步骤含可复制命令与失败处置；反模式内容（设计理由、事故故事、任务进度）
分别归 decisions/、postmortem/、reports/。

判定标准、五问的展开与反模式对照表见 [authoring-cookbooks.md](../../../docs/cookbook/authoring-cookbooks.md)。
