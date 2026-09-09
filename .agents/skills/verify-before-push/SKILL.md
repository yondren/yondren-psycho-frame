---
name: verify-before-push
description: 推送或声称检查通过前，用 change-scope 取改动面并只跑覆盖该面的最窄验证。
---

# Verify Before Push

## 1. 确认 checkout 与分支

```sh
git status --short --branch
git rev-parse --show-toplevel
```

## 2. 取改动面（base 显式核验，不猜）

```sh
pnpm change-scope --base <已核验的父分支 ref>
# 检视非 HEAD 提交时加 --head <ref>；输出为带版本号的 JSON（formatVersion/repositoryRoot/input/resolved/paths）
```

## 3. 选最窄验证

- 只改文档/决策/任务：`pnpm verify:docs`。
- 改代码：跑覆盖改动面的最窄测试或检查；CI 拥有全量矩阵。

## 4. 推送前核对

- 远程 OID 未变（租约保护）；禁止 raw `--force`。
- 提交信息含 task_key。
