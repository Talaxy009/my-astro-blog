# beercss 可用清单

> 依据：`src/styles/beer.css` 当前引入的 **20 个模块**（beercss v5.0.3）。
> 任意类名/元素都能查：`node .agents/skills/beercss/scripts/audit.mjs --find <名字>`

## 1. 组件

| 组件        | 写法                                                              | 可用修饰                                                                                                                                                                    | 说明                                                                                                |
| ----------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 按钮        | `<button>`、`.button`、`<a class="button">`                       | `.fill` `.border` `.round` `.circle` `.small` `.large` `.transparent` `.extend` `.extra`                                                                                    | 自带 `cursor:pointer`、flex 居中                                                                    |
| 标签        | `.chip`                                                           | `.round` `.circle` `.fill` `.medium` `.large`                                                                                                                               | 图标+文字自带 `gap: .5rem`；默认高 2rem（无 `.small`）                                              |
| 网格        | `.grid` + 子项 `s*` / `m*` / `l*`                                 | `.no-space` `.medium-space` `.large-space`                                                                                                                                  | 12 列；断点 s <601px、m ≥601px、l ≥993px                                                            |
| 行          | `.row`                                                            | —                                                                                                                                                                           | `display:flex`、`gap:1rem`、`min-height:3rem`                                                       |
| 组          | `.group`                                                          | —                                                                                                                                                                           | 去掉组内相邻项间距（`nav.group`、`.row.group`）                                                     |
| 导航/工具栏 | `<nav>`                                                           | `.left` `.right` `.top` `.bottom` `.max` `.toolbar` `.tabbed` `.split` `.connected`                                                                                         | 侧边栏/底栏都靠方向类                                                                               |
| 列表        | `.list`                                                           | `.max`                                                                                                                                                                      | **只对 `.list` 及 `.list > li` 生效**                                                               |
| 下拉菜单    | `<menu>` + `menu > li`                                            | `.no-wrap` `.left` `.right` `.top` `.max` `.no-space`                                                                                                                       | 放在 `button` 或容器内，hover 展开；项目里见 `PostList`                                             |
| 提示气泡    | `.tooltip`                                                        | `.left` `.right` `.bottom` `.max` `.small` `.medium` `.large`                                                                                                               | 写在 `button` 内部；**没有 `.top`**（默认就在上方）。项目里见 `DarkModeButton`                      |
| 媒体        | `.beer` 内的 `img` / `video` / `iframe` / `audio`                 | `.responsive` `.round` `.circle` `.square` `.small` `.medium` `.large`                                                                                                      | `.responsive` = 宽度自适应                                                                          |
| 文本        | `h1`-`h6`、`.h1`-`.h6`、`p`、`ul/ol`、`blockquote`、`code`、`pre` | `.small` `.large` `.truncate` `.link` `.inverse-link` `.bold` `.italic` `.underline` `.upper` `.lower` `.capitalize` `.overline` `.small-text` `.medium-text` `.large-text` | 字阶见第 3 节                                                                                       |
| 分隔线      | `hr`、`[class*=divider]`                                          | —                                                                                                                                                                           | ❌ **未引入**（需要 `elements/divider` 0.9KB）；本项目 `<hr>` 在 `.beer` 之外，由 `global.css` 排版 |

### 不可用的组件（写了不生效）

| 想要的                                                               | 原因                                                                                  | 替代方案                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `.card`                                                              | **beer 里根本没有这个类**，卡片样式写在 `<article>` 上（`elements/card`，本项目未引） | 自己写（本项目：`.recommended-post`、`.post-item-body`） |
| `<dialog>`                                                           | 需要 `elements/dialog`                                                                | 需要时再引                                               |
| `input` / `select` / `textarea` / `.field`                           | 需要 `elements/field`（10.2KB）                                                       | 项目暂无表单；Waline 评论区是独立样式                    |
| `.checkbox` / `.radio` / `.switch`                                   | 需要 `elements/selection`（6.1KB）                                                    | —                                                        |
| `.slider` / `.progress` / `.badge` / `.tabs` / `.stepper` / `.shape` | 各自模块未引入                                                                        | 需要时再引                                               |
| 固定色名 `.red` `.amber` `.teal` `.blue-grey` …                      | 需要 `helpers/color`（12.5KB）                                                        | 用语义色变量：`.primary` `.error` `.surface-container`   |

## 2. 工具类

| 用途      | 类                                                                                                                                                                                                                                                                         | 来源                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 圆角/形状 | `.round` `.small-round` `.large-round` `.circle` `.square` `.no-round` `.top-round` `.bottom-round` `.left-round` `.right-round`                                                                                                                                           | `helpers/form`                                          |
| 阴影      | `.elevate` `.small-elevate` `.medium-elevate` `.large-elevate` `.no-elevate`                                                                                                                                                                                               | `helpers/elevate`                                       |
| 外边距    | `.margin` `.tiny-margin` `.small-margin` `.large-margin` `.auto-margin` `.no-margin` `.vertical-margin` `.horizontal-margin` `.top-margin` `.right-margin` `.bottom-margin` `.left-margin`                                                                                 | `helpers/margin`                                        |
| 定位      | `.left` `.right` `.top` `.bottom` `.center` `.middle` `.front` `.back`                                                                                                                                                                                                     | `helpers/position`                                      |
| 对齐      | `.left-align` `.right-align` `.center-align` `.top-align` `.middle-align` `.bottom-align`                                                                                                                                                                                  | `helpers/alignment`                                     |
| 响应式    | `.responsive`、`.s` `.m` `.l`                                                                                                                                                                                                                                              | `helpers/responsive`                                    |
| 尺寸/换行 | `.auto-width` `.small-width` `.medium-width` `.large-width`、`.auto-height` `.small-height` `.medium-height` `.large-height`、`.wrap` `.no-wrap`                                                                                                                           | `helpers/size`                                          |
| 语义色    | `.fill` `.primary` `.secondary` `.tertiary` `.error` `.inverse-primary` `.inverse-surface` `.surface` `.surface-container` `.surface-container-low/high/highest/lowest` `.surface-dim` `.surface-bright` `.surface-variant` `.background` `.transparent` `.black` `.white` | `settings/theme`（每个大多有 `-text` / `-border` 变体） |
| 状态      | `.active`                                                                                                                                                                                                                                                                  | `settings/theme`                                        |
| 涟漪      | `.ripple`（可配 `.fast-ripple` 200ms / `.slow-ripple` 1800ms）                                                                                                                                                                                                             | `helpers/ripple` + `helpers/ripple.js`                  |

### 涟漪（ripple）

**和自带的 wave 不同，ripple 需要手动给元素加类**，不会自动长在 `button` / `.chip` 上。

- 给元素加 `.ripple`（或 `.fast-ripple` / `.slow-ripple`）
- 行为：hover / focus-visible 叠一层 `currentColor` 0.1 的底色；按下（或聚焦后按空格）时从指针位置扩散一个圆
- 两个前提（本项目已配好）：
    1. **CSS**：`src/styles/beer.css` 里的 `helpers/ripple.scoped.css`（提供 `[class*=ripple]::after`、`.ripple-js`、时长变量）
    2. **JS**：`src/components/BaseHead.astro` 里的
       `import { updateAllRipples } from 'beercss/dist/cdn/helpers/ripple.js'` + `updateAllRipples()`
       —— 它在 `document.body` 上挂 `mousedown` / `keydown` 的**委派**监听，对命中三个 ripple 类的元素注入涟漪 DOM，`animationend` 后自删（幂等，重复调用无副作用）
- 已加 `.ripple` 的地方：`Banner` 的按钮、
  `PostList` 的标签按钮、`Pagination`、`DarkModeButton`、`404` 的按钮
- 涟漪在 `.beer` 之外不生效（reset 提供的 `position: relative` 也只在 `.beer` 内）

**未引入、写了不生效**（本项目）：`.padding*`（`.padding` `.no-padding` 等）、`.space*`（`.space` `.small-space` …）、
`.shadow*`、`.horizontal` / `.vertical`（来自 `helpers/direction`）、`.blur*`、`.opacity*`、`.zoom*`、`.scroll*`、
`.no-wave`（`helpers/wave` 已移除，改用 ripple）。
拿不准就直接查：`audit.mjs --find <类名>`。

> 注：`elements/navigation` 自带 `.space` / `.small-space` / `.tiny-space` 等（用于导航项间距），
> 与 `helpers/space`（通用间距占位）不是一回事；同名类归属多个模块时，脚本会把它们都列出来。

## 3. 字阶与行距（`elements/typography`）

|          | h1        | h2        | h3      | h4     | h5      | h6     |
| -------- | --------- | --------- | ------- | ------ | ------- | ------ |
| 默认     | 3.5625rem | 2.8125rem | 2.25rem | 2rem   | 1.75rem | 1.5rem |
| `.small` | 3.0625rem | 2.3125rem | 1.75rem | 1.5rem | 1.25rem | 1rem   |
| `.large` | 4.0625rem | 3.3125rem | …       |        |         |        |

行距：`.tiny-line` `.small-line` `.medium-line` `.large-line` `.extra-line` `.no-line`；
字号：`.small-text` `.medium-text` `.large-text`。

## 4. 配色与变量

- 主题类挂在 `<html class="dark|light">`；**不要**写 `:is(.beer).dark`（匹配不到）。
- 自定义样式一律用变量，不要硬编码颜色：

| 变量                                                                            | 用途                                 |
| ------------------------------------------------------------------------------- | ------------------------------------ |
| `--primary` / `--on-primary` / `--primary-container` / `--on-primary-container` | 主色（链接、焦点环、`.fill`）        |
| `--surface` / `--on-surface`                                                    | 页面底色与正文色                     |
| `--surface-container` / `-low` / `-high` / `-highest` / `-lowest`               | 卡片、代码块等分层底色               |
| `--surface-variant` / `--on-surface-variant`                                    | 次级文字                             |
| `--outline` / `--outline-variant`                                               | 边框、分隔线                         |
| `--inverse-surface` / `--inverse-on-surface`                                    | tooltip 等反色块                     |
| `--error` / `--error-container`                                                 | 错误色                               |
| `--sys-transition`                                                              | 项目自定义的统一过渡（`global.css`） |

调色板集中在 `src/styles/beer-theme.css`（Material You 青绿色系）；改主题色只改那里。

## 5. 现有页面里可以抄的例子

| 想看什么                                                             | 文件                                                                 |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 大标题横幅 + 按钮 + 右上角图标按钮                                   | `src/components/Banner.astro`                                        |
| 文章头（标题、`row` 元信息、`chip round` 标签）、推荐阅读 `grid`     | `src/layouts/BlogPost.astro`                                         |
| 卡片列表项（封面 + `chip` + 图标）                                   | `src/components/PostItem/index.tsx`                                  |
| 标签筛选 `<button class="border">` + `<menu>` 下拉、分页 `nav.group` | `src/components/PostList/index.tsx`、`src/components/Pagination.tsx` |
| 图标按钮 + `.tooltip` + 主题切换                                     | `src/components/DarkModeButton/index.tsx`                            |
| 网格卡片（`s12 m6 l6`）+ 自写卡片样式                                | `src/components/RecommendedPost.astro`                               |
| 全屏居中布局 + `.button large fill`                                  | `src/pages/404.astro`                                                |
| 链接块                                                               | `src/pages/about.mdx`、`src/components/Link.astro`                   |
