# 04 · WXSS 样式（WXSS）

> WXSS（WeiXin Style Sheets）是小程序的样式语言，**绝大部分和 CSS 一模一样**，只需记住一个扩展（`rpx` 响应式单位）+ 几条限制（不支持部分选择器、不能用本地图片背景、样式隔离）。重要度 ⭐⭐。官方：developers.weixin.qq.com

## 🎯 一句话核心

会写 CSS 就会写 WXSS——语法、Flex、盒模型全都一样。真正要新学的只有：**`rpx` 这个"按屏宽自动换算"的单位**（规定屏幕宽永远 = 750rpx），外加几个"不能这么写"的限制。把 rpx 和限制记牢，剩下全靠你的 CSS 老底。

## 📖 核心概念 / 讲解

**WXSS 是什么。** WXSS 是小程序的样式语言，用来给 WXML（结构，见 [03-wxml](../03-wxml/)）上色排版，作用等同于网页里的 CSS。它**在 CSS 基础上做了扩展和限制**：扩展了 `rpx` 尺寸单位和 `@import` 导入；限制了部分选择器、本地资源引用等。你已有的 CSS 知识（Flex、盒模型、`color`、`padding`、`transition` 动画……）几乎可以原样搬过来。

**★ rpx 响应式单位（本章重点）。** 手机屏幕物理宽度千差万别（iPhone SE 窄、Plus 宽），若用 `px` 写死，同一个 `200px` 的盒子在小屏上显得很大、大屏上显得很小。CSS 时代靠 `rem`/媒体查询/百分比适配，小程序则内置了一个更省心的单位 **`rpx`（responsive pixel，响应式像素）**：

- **核心规定：不管什么手机，屏幕宽度都被视为 `750rpx`。** 于是 `rpx` 是一个"相对屏宽的比例单位"——写 `375rpx` 就是"半个屏宽"，在任何手机上都占半屏。
- **换算关系：** 系统按 `屏幕实际宽度 / 750` 自动把 rpx 折算成 px。以设计稿基准机 **iPhone 6（宽 375px）** 为例：`750rpx = 375px`，所以 **`1rpx = 0.5px`**、`2rpx = 1px`。换到宽 414px 的手机上，`1rpx ≈ 0.552px`，盒子自动变大，比例不变。
- **为什么方便：** UI 设计稿通常以 750 宽出图（iPhone 6 的 2 倍图），设计标注多少 px，你**直接把数字当 rpx 写**即可，一套尺寸自动适配所有机型，无需媒体查询。
- **何时用 rpx，何时用 px：**

| 场景 | 用什么 | 原因 |
|---|---|---|
| 布局尺寸：宽高、间距、字号、圆角 | **rpx** | 要随屏宽等比缩放 |
| 需要"物理精细"的细线（1px 边框/分割线） | **px** | rpx 在某些屏会渲染成 0.5px 或模糊，`1px` 更清晰锐利 |
| 需要固定不缩放的元素 | **px** | 不希望随屏宽变化 |

> 对比 CSS：rpx ≈ 一个"内置好基准、免配置的 rem"。用 rem 你得自己设 `html { font-size }` 并写换算；rpx 直接规定屏宽=750，拿设计稿数字就能用。

**样式导入 `@import`。** 和 CSS 的 `@import` 用法一致，用来复用公共样式文件。路径为相对路径，需带 `.wxss` 后缀：

```css
@import "common/base.wxss";   /* 引入公共样式，须放在文件顶部 */
```

**★ 全局样式 vs 页面样式（作用域）。** 这是新手常问的"我的样式为什么没生效/为什么到处生效"：

| 文件 | 作用范围 | 类比 |
|---|---|---|
| **`app.wxss`** | **全局**，作用于**所有页面** | 全局 CSS |
| 页面的 `xxx.wxss`（如 `index.wxss`） | **只作用于该页面** | 局部 CSS |

页面 wxss 里的规则**优先级高于** `app.wxss` 的同名规则（就近覆盖）。全局放通用主题色、reset、公共类；页面私有样式放页面自己的 wxss。

**★ 和 CSS 的区别 / 限制（重点记忆）。** 语法虽同，但有几条"不能这么写"，踩了会静默失效：

| 限制项 | 说明 |
|---|---|
| **选择器受限** | **不支持通配符 `*`**；属性选择器、`::before/::after` 等支持有限；**没有 DOM，选择器基于组件标签/class**（`.class`、`#id`、`view`、`view > text` 后代/子代仍可用，但复杂选择器慎用）。日常以 **class 选择器**为主。 |
| **不能用本地图片作背景** | `background-image: url('/images/bg.png')` **本地路径无效**；`background` 只能用**网络图片 URL** 或 **base64**。（`<image>` 组件可以直接引本地图，见下） |
| **样式隔离（组件）** | 自定义组件默认**样式隔离**：组件内外样式互不影响，页面的 class 管不到组件内部，组件的样式也不外泄。可通过 `styleIsolation` 配置调整。详见 [07-component](../07-component/)。 |
| **无 DOM / 无浏览器差异** | 没有 `document`，样式只作用于 WXML 组件；也没有各浏览器前缀那套烦恼。 |

**Flex 布局（小程序里最常用）。** 小程序**没有** H5 里 `float`、`inline-block` 那些"祖传排版"的历史包袱，官方推荐、实际最常用的就是 **Flex 布局**，用法与 CSS Flex **完全一致**（`display: flex`、`justify-content`、`align-items`、`flex: 1`……）。横向排布、水平垂直居中、等分列表全靠它。

**内联样式 `style` vs class。** 和 HTML 一样两种上样式的方式：`class` 走 wxss（静态样式首选，性能好、可复用）；`style` 写内联样式，**可用 `{{}}` 绑定动态值**（颜色、宽度随数据变化时用）。能用 class 就别用 style，动态部分才走 style。

## 💻 代码示例

一个"横向卡片列表 + 动态高亮"的样式，覆盖 rpx / flex / class / 动态 style：

```html
<!-- list.wxml：class 走静态样式；style 用 {{}} 绑动态色 -->
<view class="card-list">
  <view
    class="card {{item.hot ? 'card--hot' : ''}}"
    style="border-left-color: {{item.color}};"
    wx:for="{{cards}}"
    wx:key="id"
  >
    <text class="card__title">{{item.title}}</text>
    <text class="card__desc">{{item.desc}}</text>
  </view>
</view>
```

```css
/* list.wxss：尺寸用 rpx 自动适配屏宽；布局用 flex */
.card-list {
  display: flex;               /* Flex 布局，和 CSS 完全一致 */
  flex-direction: column;
  padding: 20rpx;              /* 20rpx = iPhone6 上 10px，随屏宽缩放 */
}

.card {
  display: flex;
  flex-direction: column;
  padding: 24rpx 32rpx;
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  border-left: 8rpx solid #ddd;      /* 左侧色条，颜色由内联 style 动态覆盖 */
  border-bottom: 1px solid #eee;     /* 细分割线用 px：更清晰锐利 */
  background: #fff;
}

/* 修饰类：热门卡片高亮（BEM 风格 class，选择器以 class 为主） */
.card--hot {
  background: #fff8e6;
}

.card__title {
  font-size: 32rpx;            /* 字号也用 rpx，等比缩放 */
  font-weight: bold;
  color: #333;
}

.card__desc {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #999;
}
```

```css
/* app.wxss：全局样式，作用于所有页面 */
@import "styles/reset.wxss";   /* @import 导入公共样式，路径带后缀 */

page {                          /* page 是小程序的根节点，类似 body */
  background: #f5f5f5;
  font-size: 28rpx;
}
```

> ⚠️ 想给 `.card` 加背景图时，`background-image: url('/images/bg.png')` 这种**本地路径无效**；要么换成网络图 URL / base64，要么改用 `<image src="/images/bg.png">` 组件铺图。

## 🔑 要点速记

- WXSS ≈ CSS，**语法几乎一样**；真正要记的是 **rpx + 几条限制**。
- **★ rpx**：规定**屏幕宽 = 750rpx**，按屏宽自动换算，一套尺寸适配所有机型；iPhone6 上 **`1rpx = 0.5px`**。
- **尺寸/字号用 rpx**（要缩放）；**1px 细线用 px**（更清晰）。
- **`app.wxss` 全局**（所有页面），**页面 wxss 局部**（仅本页，优先级更高）；`@import` 导入公共样式（路径带后缀）。
- **限制**：不支持 `*` 通配符等复杂选择器（**以 class 为主**）；**背景图不能用本地路径**（用网络图/base64，或改 `<image>` 组件）；自定义组件默认**样式隔离**（[07-component](../07-component/)）。
- **Flex 是主力布局**，和 CSS Flex 完全一致；没有 float/inline-block 的历史包袱。
- 静态样式用 **class**（首选）；动态样式用 **`style="{{}}"`** 绑定。

## ⚠️ 易错点 / 最佳实践

- ⚠️ **通配符 `*` 无效**——想全局 reset 别写 `* { margin: 0 }`，要么用 `page` 选择器，要么逐个组件（`view, text, button {...}`）。
- ⚠️ **`background-image` 用本地图不显示**——最常见的"样式没生效"，改网络图 / base64 / `<image>` 组件。
- ⚠️ **页面样式管不到自定义组件内部**——因为组件默认样式隔离，别指望在页面 wxss 里改组件内的 class（见 [07-component](../07-component/)）。
- ⚠️ **全屏 100% 宽用 `750rpx` 或 `100%`**，别用 `375px` 写死——那样只在 iPhone6 上对。
- ✅ **设计稿按 750 宽标注时，标多少直接写多少 rpx**，最省心。
- ✅ **能 class 就别 style**：class 可复用、性能好；`style="{{}}"` 只留给随数据变化的动态样式。
- ✅ **公共主题色 / reset 放 `app.wxss`**，页面私有样式放各自 wxss，避免全局污染。
- 🔗 上一步：结构层 → [03-wxml](../03-wxml/)；下一步：逻辑层与 setData → [05-logic-setdata](../05-logic-setdata/)；官方文档 → <https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxss.html>。
