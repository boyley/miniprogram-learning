# 03 · WXML 模板语法（WXML）

> WXML（WeiXin Markup Language）是小程序的**模板语言**，长得像 HTML 但标签不同、绑定语法不同：用 `{{}}` 绑数据、`wx:for` 渲列表、`wx:if` 控条件。有 Vue 模板基础的人几乎无缝迁移。重要度 ⭐⭐⭐。官方：developers.weixin.qq.com

## 🎯 一句话核心

WXML ≈ **Vue 模板 + 换了一套标签**：`{{}}` 是插值、`wx:for` 是 `v-for`、`wx:if` 是 `v-if`、`view` 是 `div`。最大不同是——**WXML 里的表达式只能"读" data，不能改 data**（改数据一律回 JS 里 `setData`，因为双线程，见 [01-overview-architecture.md](01-overview-architecture.md)）。

## 📖 核心概念 / 讲解

**WXML 是什么。** 它是小程序页面的**结构层**（页面四文件里的 `.wxml`，见 [01-overview-architecture.md](01-overview-architecture.md)）。写法像 HTML：标签 + 属性 + 嵌套。但**没有 div/span/a/img 这些 HTML 标签**，取而代之的是小程序**基础组件**：`view`（块容器，≈div）、`text`（文本，≈span）、`image`（图片，≈img）、`button`、`scroll-view`（滚动容器）、`swiper`（轮播）、`navigator`（跳转，≈a）等。这些组件由宿主（微信/抖音）用原生渲染，能力和样式受平台约束。

**★ 数据绑定 `{{ }}`（≈ Vue 插值）。** 把逻辑层 `data` 里的值"填"进模板。可用于**文本内容**和**属性值**，内部支持简单**运算**和**三元表达式**，但**不能改数据、不能调用你自定义的方法**（只能读、只能做纯表达式）：

```html
<text>{{ msg }}</text>                 <!-- 文本插值 -->
<view class="{{ active ? 'on' : '' }}">  <!-- 属性 + 三元 -->
<text>{{ a + b }} 元</text>             <!-- 运算 -->
<checkbox checked="{{ isChecked }}"/>   <!-- 布尔属性也要用 {{}} 包 -->
```

> ⚠️ 和 Vue 的区别①：Vue 属性绑定要写 `:class`，WXML **统一用 `{{}}`**（`class="{{x}}"`）。区别②：布尔属性 `checked="{{false}}"` 才是假，写成 `checked="false"` 会被当成**字符串 "false"（真值）**。

**★ 列表渲染 `wx:for`（≈ v-for）。** 在组件上写 `wx:for="{{数组}}"`，默认用 `item` 表示每项、`index` 表示下标，可用 `wx:for-item` / `wx:for-index` 改名：

```html
<view wx:for="{{list}}" wx:key="id">
  {{ index }} - {{ item.name }}
</view>
```

**`wx:key` 为什么必须写？** 和 Vue 的 `:key` 同理：它是每项的**唯一标识**，让渲染层在列表变化（增删排序）时能**复用已有节点、只做最小 diff**，而不是全部销毁重建。不写会报警告、且带输入状态的组件（如 `input`）可能错乱。`wx:key` 的值有两种写法：填 `item` 里某个唯一字段名（如 `wx:key="id"`，**不用写 `{{}}`**），或当数组项本身是字符串/数字时用保留字 `wx:key="*this"`。

**★ 条件渲染 `wx:if` vs `hidden`（≈ v-if vs v-show）。** 两种"显示/隐藏"机制，区别是**控制渲染**还是**控制显示**：

| 维度 | `wx:if` / `wx:elif` / `wx:else` | `hidden` |
|---|---|---|
| 本质 | **控制"渲不渲染"**（条件为假**不生成节点**） | **控制"显不显示"**（节点在，加 `display:none`） |
| 类比 Vue | `v-if` / `v-else-if` / `v-else` | `v-show` |
| 初始开销 | 假时**不渲染**，开销小 | 无论真假都**渲染**了 |
| 切换开销 | 每次切换**销毁/重建**节点，开销大 | 只切 CSS 显隐，切换快 |
| 用哪个 | **切换不频繁 / 初始可能不显示**用它 | **频繁切换**用它 |

```html
<view wx:if="{{score >= 90}}">优秀</view>
<view wx:elif="{{score >= 60}}">及格</view>
<view wx:else>不及格</view>

<view hidden="{{!visible}}">频繁开关的用 hidden</view>
```

**事件绑定 `bindtap` / `catchtap`。** WXML 里绑事件不是 `onclick`，而是 `bind*` 系列：`bindtap`（点击）、`bindinput`（输入）等。`bind` 会**冒泡**，`catch`（如 `catchtap`）会**阻止冒泡**。方法写在 JS 的 `Page({})` 里。此处只需知道写法，详见 [06-events.md](06-events.md)：

```html
<button bindtap="onTap" data-id="{{item.id}}">点我</button>
```

**`block` 包裹标签（不渲染真实节点）。** `<block>` 是个"虚拟"容器，**本身不会渲染成任何节点**，专门用来给一组元素套 `wx:if` / `wx:for` 而不额外产生一个 `view`（≈ Vue 的 `<template>`）：

```html
<block wx:for="{{list}}" wx:key="id">
  <text>{{item.name}}</text>
  <view class="line"></view>
</block>
```

**模板 `template` 与引用 `import` / `include`。** 复用一段 WXML 片段：

- `<template name="card">…</template>` 定义模板，用 `<template is="card" data="{{...obj}}"/>` 按名调用并传数据。
- `<import src="…"/>` 引入**另一个 wxml 里定义的 `template`**（只引 template，不引它内部的节点）。
- `<include src="…"/>` 把另一个 wxml **整段"复制"进来**（除 template/wxs 外的全部内容），常用于抽公共头尾。

```html
<!-- tpl.wxml：定义模板 -->
<template name="userCard">
  <view class="card">{{name}} · {{age}}岁</view>
</template>

<!-- page.wxml：引入并使用 -->
<import src="./tpl.wxml"/>
<template is="userCard" data="{{name: '小明', age: 18}}"/>
```

**常用基础组件速查。**

| 组件 | 作用 | ≈ HTML | 关键点 |
|---|---|---|---|
| `view` | 块级容器 | `div` | 布局最常用 |
| `text` | 行内文本 | `span` | 只有它内部文本可长按选中 |
| `image` | 图片 | `img` | **必写 `mode`** 控制裁剪缩放（如 `aspectFill`/`widthFix`），默认会拉伸变形 |
| `button` | 按钮 | `button` | 有 `type`/`size`/`open-type`（如授权、分享） |
| `input` | 输入框 | `input` | 值靠 `bindinput` + `setData` 同步（无 v-model） |
| `scroll-view` | 可滚动区域 | 带 `overflow` 的 div | 纵向滚要设 `scroll-y` + 固定高度 |
| `swiper` | 轮播/滑块 | 无 | 配 `swiper-item` 子项 |
| `navigator` | 页面跳转 | `a` | 用 `url` + `open-type` 跳转（见 [08-route-lifecycle.md](08-route-lifecycle.md)） |

**和 Vue 模板的整体对照。**

| Vue 模板 | WXML | 说明 |
|---|---|---|
| `{{ }}` 插值 | `{{ }}` | 一样，但 WXML 里不能改数据 |
| `:class` / `:attr` | `class="{{}}"` / `attr="{{}}"` | WXML 统一 `{{}}`，无 `:` 前缀 |
| `v-for` + `:key` | `wx:for` + `wx:key` | key 值填字段名，不写 `{{}}` |
| `v-if/v-else-if/v-else` | `wx:if/wx:elif/wx:else` | 控制渲染 |
| `v-show` | `hidden` | 控制 display |
| `@click` | `bindtap` / `catchtap` | catch 阻止冒泡 |
| `<template>` 空包裹 | `<block>` | 不渲染真实节点 |
| `div` / `span` / `img` / `a` | `view` / `text` / `image` / `navigator` | 换标签 |

## 💻 代码示例：列表 + 条件 + 绑定

```html
<!-- pages/list/list.wxml -->
<view class="page">
  <!-- 顶部：数据绑定 + 三元 class -->
  <view class="header {{ loading ? 'is-loading' : '' }}">
    <text>共 {{ list.length }} 条</text>
  </view>

  <!-- 空状态：wx:if 控制渲染 -->
  <view wx:if="{{ list.length === 0 }}" class="empty">
    暂无数据
  </view>

  <!-- 列表：wx:for + wx:key，block 不额外产生节点 -->
  <scroll-view wx:else scroll-y class="list">
    <block wx:for="{{ list }}" wx:key="id">
      <view class="item" bindtap="onTapItem" data-id="{{ item.id }}">
        <image class="avatar" src="{{ item.avatar }}" mode="aspectFill"/>
        <view class="info">
          <text class="name">{{ index + 1 }}. {{ item.name }}</text>
          <!-- wx:if / wx:else 二选一渲染 -->
          <text wx:if="{{ item.vip }}" class="tag">VIP</text>
          <text wx:else class="tag gray">普通</text>
        </view>
      </view>
    </block>
  </scroll-view>

  <!-- hidden：频繁开关用它，节点常驻只切 display -->
  <view class="back-top" hidden="{{ !showBackTop }}">↑ 回顶部</view>
</view>
```

```js
// pages/list/list.js（配套逻辑，改数据一律 setData，见 05-logic-setdata.md）
Page({
  data: {
    loading: false,
    showBackTop: false,
    list: [
      { id: 1, name: '小明', avatar: '/img/a.png', vip: true },
      { id: 2, name: '小红', avatar: '/img/b.png', vip: false },
    ],
  },
  onTapItem(e) {
    const id = e.currentTarget.dataset.id; // 取 data-id
    console.log('点击了', id);
  },
});
```

## 🔑 要点速记

- WXML ≈ **Vue 模板换标签**：`{{}}`≈插值、`wx:for`≈v-for、`wx:if`≈v-if、`view`≈div。
- 标签是**基础组件**（`view`/`text`/`image`/`button`/`scroll-view`/`swiper`/`navigator`），不是 HTML 的 div/span。
- **`{{}}` 只能读 data**，支持运算/三元，**不能改数据、不能调方法**；属性绑定也用 `{{}}`（无 `:` 前缀）。
- `wx:for` 默认 `item`/`index`，可用 `wx:for-item`/`wx:for-index` 改名；**`wx:key` 必写**（复用节点、最小 diff）。
- **`wx:if` 控渲染（v-if）** vs **`hidden` 控显示（v-show）**：频繁切换用 `hidden`，否则用 `wx:if`。
- `<block>` 只做逻辑包裹**不渲染真实节点**（≈Vue `<template>`）；`template`/`import`/`include` 复用片段。
- 事件用 `bindtap`（冒泡）/ `catchtap`（阻断），不是 `onclick`（见 [06-events.md](06-events.md)）。

## ⚠️ 易错点 / 最佳实践

- ⚠️ **布尔属性别写裸字符串**：`checked="false"` 是真值字符串！要写 `checked="{{false}}"`。
- ⚠️ **`wx:key` 不写 `{{}}`**：填字段名 `wx:key="id"`，或数组是原始值时用 `wx:key="*this"`。别误写成 `wx:key="{{item.id}}"`。
- ⚠️ **`image` 一定给 `mode`**：默认 `scaleToFill` 会拉伸变形；等宽高比用 `aspectFill`，按宽自适应高用 `widthFix`。
- ⚠️ **`{{}}` 里不能写复杂逻辑**：不能调用 `Page` 里的方法、不能 `a.map(...)`，需要处理就先在 JS 里算好再 `setData`。
- ⚠️ **想改数据不能在 WXML 里改**：模板只负责展示，改值回 JS `this.setData({...})`（双线程原理见 [01-overview-architecture.md](01-overview-architecture.md)）。
- ✅ **`scroll-view` 纵向滚动**要同时设 `scroll-y` 和**固定高度**，否则不滚。
- ✅ **频繁 toggle 用 `hidden`、偶发/初始隐藏用 `wx:if`**，减少不必要的节点创建销毁。
- 🔗 下一步：样式 → [04-wxss.md](04-wxss.md)；逻辑与 setData → [05-logic-setdata.md](05-logic-setdata.md)；事件 → [06-events.md](06-events.md)；官方组件文档 → <https://developers.weixin.qq.com/miniprogram/dev/component/>。
