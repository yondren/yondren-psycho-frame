# 发布两包到 npm

两包锁步同版本；准备动作由 [scripts/release.mjs](../../scripts/release.mjs) 完成，发布本身需维护者
npm 凭据与 2FA（设计理由见
[2026-09-09-publish-release-script.md](../../decisions/implemented/process/2026-09-09-publish-release-script.md)）。

## 1. 准备

在根 checkout 的 `main` 上（脚本拒绝其它分支、脏工作区与未推送提交），先登记 `tasks/` 任务并置
`IN_PROGRESS`，再执行：

```sh
pnpm release:prepare <major|minor|patch|X.Y.Z> --task-key=<task_key>
```

脚本按序：预检 → `pnpm install --frozen-lockfile` → bump 两包 `version` 与模板 devDep pin →
`verify:docs` 与 `doctor` → pack 预检（tarball 无 `.gitignore` 条目、shim 依赖已固化 `^x.y.z`、
模板 pin 一致）→ commit（含 task_key）+ 注解 tag `vX.Y.Z`，结尾打印发布交接块。
`--preview` 全程只读；`--prepare` 与 `--publish`/`--push` 互斥。

## 2. 发布

按交接块顺序，两包按依赖序（先核心后 shim）：

```sh
pnpm publish --filter yondren-psycho-frame --no-git-checks
pnpm publish --filter create-yondren-psycho-frame --no-git-checks
```

## 3. 验证

```sh
npm view yondren-psycho-frame version dist-tags
npm view create-yondren-psycho-frame version dist-tags
```

两包 `dist-tags.latest` 与本次版本一致才算成功；版本一旦发布不可覆盖，失败只能升版本重发。

## 4. 推送

核对通过后再推送，发布前失败可删 tag 与 commit 重做：

```sh
git push origin main
git push origin vX.Y.Z
git push codeup main:mirror
```

## 5. 留痕

任务置 `DONE`、写 `reports/<task_key>.md`；README 与官网用 `@latest`，无需改动。
