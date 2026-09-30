---
name: beercss
description: '用 Beer CSS（beercss v5）写页面样式：用 beer 的组件与工具类搭 Astro/React 组件和 Markdown 内容。适用于写 chip、button、grid、nav、menu、tooltip、row、卡片列表，判断某个 beer 类在本项目能否使用（已引入哪些模块），排查 beer 类写了没生效、`.beer` 作用域不对、暗色下颜色不对等场景。Use when: writing pages or components with Beer CSS, using beer components (chips, buttons, grids, nav, menu, tooltips, rows), checking whether a beer class is available in this project, debugging beer classes that have no effect, working with the `.beer` scope or dark theme colors.'
---

# 用 beercss 写页面

本项目用 Beer CSS 作为样式框架：**加语义化 HTML + 少量类名**，而不是写大量自定义 CSS。
更细的样式再用组件 `<style>` 配合 beer 的 CSS 变量补。

## 三条铁律（先记住，能避免 90% 的「写了没生效」）

1. **样式只在 `.beer` 容器内生效。** beer 的每条规则都被 `:is(.beer, beer-css)` 包着。
   项目里已带 `.beer` 的地方：`BlogPost` 的 `<header>` 与「推荐阅读」`<section>`、`Banner` 根节点、
   `PostList` 根节点、`404` 根节点、`about` 的链接块。
   **新写一块用 beer 样式的内容，要自己包一层 `<div class="beer">`。**
2. **文章正文不在 `.beer` 内。** `<article>` 里的 Markdown 由 `global.css` / `article.css` 排版，
   在 Markdown 里写 beer 类**不会生效**；要生效就用 `<div class="beer">…</div>` 包起来。
3. **项目只引入了 20 个模块，没引入的类写了就是死的（不会报错）。** 落笔前先查：

```bash
node .agents/skills/beercss/scripts/audit.mjs --find chip card article padding left-shadow
```

输出三种结果：

- `✅ 可用      来自 elements/chip、helpers/form`
- `⚠️ 未引入    需要：elements/card（0.5KB）` ← 要用就得先引模块
- `❌ beercss 里没有这个类/元素` ← 比如 `.card`：**beer 里卡片就是 `<article>`，没有 `.card`**

## 能用的东西

完整清单（组件 / 工具类 / 字阶 / 不可用清单）见 [references/available.md](./references/available.md)。速记：

| 类别        | 能用的                                                                                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 组件        | `<button>` / `.button`、`.chip`、`.grid` + `s12 m6 l6`、`.row`、`.group`、`<nav>`、`<menu>`、（下拉）、`.list`、`.tooltip`、`img`/`video`、`h1`-`h6`/`p`/`code` |
| 形状        | `.round` `.circle` `.square` `.no-round` `.small-round` `.large-round`                                                                                          |
| 间距        | `.margin` 系列、`.vertical-margin`、`.horizontal-margin`、`.no-margin`                                                                                          |
| 定位/对齐   | `.left` `.right` `.top` `.bottom` `.center` `.middle`、`.center-align` 等                                                                                       |
| 阴影        | `.elevate` `.small-elevate` `.medium-elevate` `.large-elevate`                                                                                                  |
| 颜色        | `.fill` `.primary` `.surface-container` `.transparent` …（都有 `-text` / `-border` 变体）                                                                       |
| 尺寸/响应式 | `.responsive` `.small-width` `.large-width` `.wrap` `.no-wrap`                                                                                                  |
| 涟漪        | 给元素加 `.ripple`（可配 `.fast-ripple` / `.slow-ripple`）—— **不自动生效**，需手动加类            |

**没有的**（写了不生效，需要先引模块或换做法）：
`.card`（卡片＝`<article>`，需 `elements/card`）、`.padding`/`.space`、`.shadow`、`.horizontal`/`.vertical`、
`.no-wave`（wave 已移除）、固定色名（`.red` `.amber` `.teal` …）、`.shape`、`<dialog>`、`input`/`select`/`.field`、
`.checkbox`/`.radio`/`.switch`、`.slider`、`.progress`、`.badge`、`.tabs`、`<hr>`

> **涟漪需要手动加类**（与 wave 不同）：`<button class="chip round ripple">`。
> CSS 在 `helpers/ripple.scoped.css`，JS 在 `BaseHead.astro`（`updateAllRipples()` 挂委派监听）。
> 详见 [references/available.md](./references/available.md#涟漪ripple)。

## 写法惯例（跟现有组件对齐）

```astro
<!-- 1) 标签：chip + 圆形；图标与文字之间自带 gap；加 ripple 才有按下的涟漪 -->
<div class="row">
	{tags.map((tag) => <button class="chip round ripple">{tag}</button>)}
</div>

<!-- 2) 文章头信息行：row + vertical-margin -->
<div class="row vertical-margin">
	<time datetime={iso}>{date}</time>
	•<span>{minutesRead}</span>
</div>

<!-- 3) 卡片网格：grid + 断点类（s 是手机、m 平板、l 桌面） -->
<section class="beer">
	<div class="grid">
		{#each posts as post}<a class="s12 m6 l6">…</a>{/each}
	</div>
</section>

<!-- 4) 图标按钮 + 提示气泡 -->
<button class="chip circle large no-border no-margin ripple">
	<Icon />
	<div class="tooltip bottom">夜间模式</div>
</button>

<!-- 5) 下拉菜单：menu 放在 button 里，靠 hover 展开 -->
<button className="border">
	<span>{current}</span>
	<menu className="no-wrap">
		{tags.map((tag) => <li><a onClick={...}>{tag.name}</a></li>)}
	</menu>
</button>
```

补充惯例：

- **优先用 beer 的工具类解决布局/间距**（`.row`、`.vertical-margin`、`.grid` + `m6 l6`），
  不要在 `<style>` 里手写 flex 只为对齐。
- **可点击的元素记得加 `.ripple`**（按钮、chip、可点的卡片链接），否则按下没有反馈。
- **组件自有样式写在组件 `<style>` 里**（Astro 会自动加作用域），并且**用 beer 的变量**：
  `var(--surface-container)`、`var(--on-surface-variant)`、`var(--primary)`、`var(--outline)`、
  `var(--sys-transition)`。
- **不要为了套 beer 而硬凑类名**：`global.css` / `article.css` 就是文章正文的排版层。
- 需要极少的额外样式时，直接对齐现有组件（`Banner`、`PostItem`、`RecommendedPost`）的写法。

## 暗色/浅色

- 主题类是 **`<html class="dark|light">`**（`BaseHead.astro` 内联脚本防 FOUC，`DarkModeButton` 负责切换）。
- 所以**不要**用 `:is(.beer).dark` 这类选择器，也不要引 `settings/dark.scoped.css`——
  它匹配不到 `<html>`。要按主题改样式就用 `html.dark` / `.dark` 前缀，或直接依赖变量。
- 颜色**一律用变量**，调色板集中在 `src/styles/beer-theme.css`（Material You 青绿色系）。
- 改完样式**切一次主题**看看。

## 想要的东西没有怎么办

| 情况                       | 做法                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| 差一个类，且有对应模块     | 引入该模块（顺序：`settings → helpers → elements`，本地主题文件放最后），再跑 `audit.mjs` 确认 |
| 差一个类，但没对应模块好用 | 用组件 `<style>` + beer 变量自己写（本项目的卡片、链接卡就是这么做的）                         |
| 想确认清单是否还合理       | `node .agents/skills/beercss/scripts/audit.mjs`（体检模式，退出码 1 = 有确定性问题）           |
| 改动了 beercss 的引入清单  | 必须做视觉回归：对比改动前后的计算样式，别只看「页面看起来差不多」                             |

## 参考

- 可用组件/工具类/字阶/不可用清单：[references/available.md](./references/available.md)
- 类名与元素查询、清单体检：[scripts/audit.mjs](./scripts/audit.mjs)
