# 官网

yondren-psycho-frame 的官方站点（VitePress）。页面映射（源文件、官网页、标题、分组）在
[scripts/content-map.mjs](scripts/content-map.mjs)，由 [scripts/sync-content.mjs](scripts/sync-content.mjs)
生成页面、由 [.vitepress/config.mts](.vitepress/config.mts) 生成 sidebar；生成物
`src/guide/`、`src/reference/` 不入 Git（每次同步整体重建），手写内容只有首页、VitePress 配置、
[.vitepress/theme/](.vitepress/theme/index.ts) 与本说明——官网不产生第二份事实源。

站点只放使用者向内容：快速上手、使用教程、核心理念、CLI 与配置；维护者向文档留在仓库内，
不上官网。

## 首页 hero 动效

[PsychoFrameHero.vue](.vitepress/theme/components/PsychoFrameHero.vue) 经默认主题的
`home-hero-image` 插槽渲染：一台原创机甲的**侧向头 + 胸半身特写**站在暗色舞台上，开场沿各自
铰链张开外甲（肩甲、领口、胸甲、背包喷口）露出内部骨架，之后扫光每 8 秒横穿一次，一次只推亮
一窄条装甲、其余留在黑暗里；护目镜与缝隙里的精神力框架线以 3～4 秒节奏呼吸。

造型用通用机甲语汇（人形比例、大型肩甲、前后裙甲、背包喷口、单眼面罩、后掠头冠鳍），
**不使用任何作品的识别特征**（V 字天线、面部面罩、特定机体轮廓与配色），代码与文案里也不出现
作品或机体名称。

纯 CSS 动画、零 JS、零依赖。三处改动时容易踩的坑：

- **展开外甲**：所有分片共用一条 `@keyframes pf-open`，铰链点/角度/延迟由 CSS 变量传入。
  静息态（基础样式）就是"已展开"，所以 `prefers-reduced-motion: reduce` 下 `animation: none`
  直接落终态，不会卡在闭合态。
- **扫光**：`mix-blend-mode: screen` 的一条柔光带，靠 `<mask id="pfMechaMask">` 限制在机甲各
  体块上。遮罩必须显式写 `maskUnits="userSpaceOnUse"` 加整个舞台区域——默认区域按被遮罩对象
  （光带矩形）的包围盒算，光带起始在舞台之外，默认区域会把体块全裁掉、遮罩变全黑（扫光静默失效，
  页面上看不出报错）。
- **可见度**：装甲设定为白色，但静止时处于阴影里，所以填充取深蓝灰（`--pf-armor-fill`），
  靠扫光的 screen 混合把它推到接近白。**不要改成白色填充**——那样失去"隐藏在黑暗中"；也
  **不要把扫光压得太低**——那样推不亮，两头都不成立。光带宽度决定"照亮多少"：120 单位时同一
  时刻只有一条被点亮（实测左右半幅亮度差可达 51/255），加宽到 190 就会变成整体刷亮。
  降级态另把 `--pf-armor-fill`、`--pf-armor-edge` 整体抬高，因为降级后不再有扫光来照亮。

hero 自带暗色舞台，所以舞台调色板刻意不进 `.dark`：两套主题下表现一致。全站取色真源是
[style.css](.vitepress/theme/style.css)，站点图标是 [favicon.svg](src/public/favicon.svg)。

## 分享卡片

`src/public/og.svg` 是源文件，`src/public/og.png` 是提交进仓库的栅格产物（社交平台不认 SVG，
CI 里没有 Chromium，所以不随 `docs:build` 生成）。改动卡片后手工重新栅格化：

```sh
cd website/src/public
chrome --headless --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1200,630 --screenshot=og.png "file://$PWD/og.svg"
```

## 命令

```sh
pnpm docs:dev       # 本地预览（根目录）
pnpm docs:build     # 构建（根目录）
```
