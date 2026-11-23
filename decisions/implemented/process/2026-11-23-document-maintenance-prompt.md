# Agent Note: 提供按需执行的文档整理提示词

Status: implemented

## Problem

长期任务的批次历史可以同时出现在主题文档、任务卡和执行报告。逐条登记的索引随执行记录
增长，查找当前规则和查找历史批次需要不同入口。

## Decision

在 [Cookbook](../../../docs/cookbook/README.md) 提供可复制的
[文档整理提示词](../../../docs/cookbook/document-maintenance.md)，由 Agent 根据项目的代码、
配置和文档约定判断哪些内容仍然有效。提示词要求保留原文和证据、把常用入口收成主题导航，
并验证现行文档和历史记录分别能经由入口与搜索找到。

[包内模板](../../../packages/psycho-frame/template/docs/cookbook/document-maintenance.md) 分发同一份
提示词、索引条目和预算，沿用既有 init、adopt、upgrade 语义。

## Alternatives considered

**生成逐条目录。** 全量目录随批次增长，关键词和任务号已经能定位有区分度的记录。

**由脚本批量判定归档。** 记录长度、日期和任务状态无法判断一份文档是否仍承载当前合同。

## Consequences

用户可在入口膨胀时直接引用 Cookbook 里的提示词。索引可在保留原文和检索路径的前提下精简，
已有逐条登记约定的项目先按自身流程调整约定。归档和链接修复沿用项目的文档门禁。
