# 07 · 自定义组件（Custom Component）

> 把一段可复用的 WXML/WXSS/JS 封装成一个"标签"，像用内置组件一样用它。写法从 `Page` 换成 **`Component`** 构造器，**通信靠 `properties`(父→子) + `triggerEvent`(子→父)**。几乎是 Vue 组件的小程序版。重要度 ⭐⭐⭐。官方：developers.weixin.qq.com

## 🎯 一句话核心

自定义组件 = 用 **`Component({...})`** 声明的可复用单元（也是四文件 wxml/wxss/js/json），在页面的 `usingComponents` 里注册后当标签用。父传子用 **`properties`**（≈Vue `props`），子传父用 **`this.triggerEvent('事件名', detail)`**（≈Vue `$emit`），内容分发用 **`slot`**（≈Vue `slot`），逻辑复用用 **`behaviors`**（≈Vue `mixin`）。

## 📖 核心概念 / 讲解

**为什么要组件化。** 页面越写越大，一段"评分星星""带确认的弹窗""商品卡片"会在多处重复。组件化把它抽成独立单元，带来三件事：**复用**（一处写、多处用）、**封装**（内部 data/样式对外隐藏，只暴露 `properties` 和事件这层契约）、**可维护**（改一处即全局生效，职责清晰）。和 Vue 拆组件的动机完全一致。

**★ `Component()` 构造器（把 `Page` 换成 `Component`）。** 页面用 `Page({...})`，组件用 `Component({...})`。核心字段：

| 字段 | 作用 | 对比 Vue |
|---|---|---|
| `properties` | **接收父组件传值**，声明类型/默认值 | ≈ `props` |
| `data` | 组件**内部**私有数据 | ≈ `data` |
| `methods` | 组件方法（事件处理都写这里） | ≈ `methods` |
| `observers` | **数据监听器**，某字段变了触发 | ≈ `watch` |
| `lifetimes` | **组件生命周期**：`attached`/`detached` 等 | ≈ `mounted`/`unmounted` |
| `pageLifetimes` | 监听**所在页面**的生命周期（`show`/`hide`） | Vue 无直接对应 |
| `behaviors` | 混入可复用逻辑 | ≈ `mixins` |
| `options` | 组件选项（`multipleSlots`/`styleIsolation` 等） | — |

> ⚠️ **组件里方法必须写在 `methods` 里**（页面 `Page` 是平铺的，组件不是）。`properties` 在 JS 里也通过 `this.data.xxx` 读取（和 data 合并到一起）。

**★ 注册与使用（`usingComponents`）。** 组件不像 Vue 全局/局部注册那样在 JS 里 import，而是在**用它的页面（或 app.json）的 json 文件**里声明路径：

```json
{ "usingComponents": { "my-card": "/components/my-card/my-card" } }
```

之后在该页面 WXML 里直接写 `<my-card>` 标签即可。写在 `app.json` 的 `usingComponents` 则**全局可用**。

**★ 组件通信（重点，三个方向）。**

- **父 → 子：`properties`**。父在标签上传值，子用 `properties` 接收。静态值直接写 `title="标题"`，动态值用数据绑定 `title="{{pageTitle}}"`。
- **子 → 父：`triggerEvent`**。子组件内 `this.triggerEvent('confirm', { id: 1 })` 抛出自定义事件，父组件在标签上 `bind:confirm="onConfirm"` 监听，回调里用 `e.detail` 取数据。这就是 Vue 的 `$emit` + `@event`。
- **父调子的方法：`selectComponent`**。父在页面里 `this.selectComponent('#myId')` 拿到子组件实例，直接调它的 `methods` 方法或读数据。类似 Vue 的 `ref` + `this.$refs.xxx.method()`。

```
父页面 ──props(标签传值)──►  子组件      父页面 ◄──triggerEvent('ev')── 子组件
        ◄─bind:ev(e.detail)─                selectComponent('#id').method()►
```

**★ `slot` 插槽（内容分发）。** 组件内用 `<slot></slot>` 占位，父组件写在标签**内部**的内容会填进去 —— 和 Vue slot 一模一样。默认单个匿名 slot；要**多个具名 slot** 需开启 `options: { multipleSlots: true }`，然后 `<slot name="header"/>`，父用 `<view slot="header">` 对应填充。

**`behaviors`（≈mixin）。** 把多个组件共用的 `properties`/`data`/`methods`/生命周期抽到 `Behavior({...})` 里，组件用 `behaviors: [myBehavior]` 混入。字段同名时的合并规则和 Vue mixin 类似（生命周期都执行、data/methods 组件覆盖 behavior）。

**样式隔离 `styleIsolation`。** 组件默认样式**互不影响**（这是和普通网页 CSS 全局污染最大的不同）。通过 `options.styleIsolation` 控制：

| 值 | 含义 |
|---|---|
| `isolated`（默认） | **完全隔离**：组件内外样式互不影响 |
| `apply-shared` | 页面样式**能影响**组件，组件样式不影响页面 |
| `shared` | 双向共享，页面与组件样式互相影响 |

## 💻 代码示例：一个完整组件 + 父子通信

**组件四文件**（放 `components/my-card/`）：

```json
// my-card.json —— 必须声明 component:true
{
  "component": true,
  "usingComponents": {}
}
```

```html
<!-- my-card.wxml：properties 直接在模板里用 {{}}；slot 分发内容 -->
<view class="card">
  <view class="title">{{title}}</view>
  <slot></slot>                       <!-- 默认插槽：父标签内部内容填这里 -->
  <button size="mini" bindtap="onConfirm">确定（{{count}}）</button>
</view>
```

```css
/* my-card.wxss：默认 isolated，这里的 .card 不会污染页面 */
.card { padding: 20rpx; border: 1rpx solid #eee; border-radius: 12rpx; }
.title { font-size: 32rpx; font-weight: bold; }
```

```js
// my-card.js —— 用 Component 而不是 Page
Component({
  options: { multipleSlots: false, styleIsolation: 'isolated' },

  properties: {                        // 父→子：接收传值（≈ Vue props）
    title: { type: String, value: '默认标题' }   // 类型 + 默认值
  },

  data: { count: 0 },                  // 组件内部私有数据

  observers: {                         // 数据监听（≈ Vue watch）
    'count': function (n) { console.log('count 变为', n); }
  },

  lifetimes: {                         // 组件生命周期
    attached() { console.log('组件挂载'); },   // ≈ mounted
    detached() { console.log('组件卸载'); }    // ≈ unmounted
  },

  pageLifetimes: {                     // 监听所在页面的生命周期
    show() { console.log('页面显示了'); }
  },

  methods: {                           // 组件方法必须写在 methods 里
    onConfirm() {
      this.setData({ count: this.data.count + 1 });
      // 子→父：抛事件（≈ Vue $emit），父用 bind:confirm 接
      this.triggerEvent('confirm', { count: this.data.count });
    },
    reset() { this.setData({ count: 0 }); }   // 供父组件 selectComponent 调用
  }
});
```

**父页面使用**（`pages/index/`）：

```json
// index.json —— 注册组件
{ "usingComponents": { "my-card": "/components/my-card/my-card" } }
```

```html
<!-- index.wxml -->
<!-- title 传值(父→子)；bind:confirm 收子组件事件(子→父)；标签内内容进 slot -->
<my-card id="card" title="{{pageTitle}}" bind:confirm="onConfirm">
  <text>这段是插槽内容</text>
</my-card>
<button bindtap="callReset">父组件调子组件的 reset()</button>
```

```js
// index.js
Page({
  data: { pageTitle: '商品卡片' },
  onConfirm(e) {                       // e.detail 是 triggerEvent 传的对象
    console.log('子组件点了确定，count =', e.detail.count);
  },
  callReset() {
    // 父调子方法：拿到组件实例再调 method（≈ Vue this.$refs.card.reset()）
    this.selectComponent('#card').reset();
  }
});
```

## 🔑 要点速记

- 组件用 **`Component({...})`**（不是 `Page`）；也是四文件，json 里要 **`"component": true`**。
- 注册：在页面/`app.json` 的 **`usingComponents`** 里写路径，再当标签用（不 import）。
- **父→子 `properties`**（≈props）；**子→父 `this.triggerEvent('ev', detail)` + `bind:ev`**（≈`$emit`），回调取 **`e.detail`**。
- **父调子方法：`this.selectComponent('#id').方法()`**（≈`$refs`）。
- **组件里方法必须放 `methods`**；`observers`≈watch，`lifetimes`(attached/detached)≈mounted/unmounted，`pageLifetimes` 监听所在页生命周期。
- **`slot`** 分发内容，多 slot 要 `options.multipleSlots:true`（≈Vue slot）。
- **`behaviors`** 复用逻辑（≈mixin）；**`styleIsolation`** 控制样式隔离，默认 `isolated`。
- 对照记：properties≈props、triggerEvent≈$emit、slot≈slot、behaviors≈mixin、observers≈watch、selectComponent≈$refs。

## ⚠️ 易错点 / 最佳实践

- ⚠️ **方法没写进 `methods`**：组件里事件处理平铺在顶层会**绑不上**，必须放 `methods: {}` 内（页面 `Page` 才是平铺）。
- ⚠️ **忘了在 `usingComponents` 注册**或路径写错 → 标签不渲染、无报错，检查 json 路径（相对/绝对 `/` 开头）。
- ⚠️ **`properties` 是单向的**：子组件别直接改传进来的 property 期望同步父数据；要变更父状态请 `triggerEvent` 通知父，由父 setData（和 Vue 单向数据流一致）。
- ⚠️ **事件名大小写与 `bind:`**：`triggerEvent('myEvent')` 对应 `bind:myEvent`；小程序自定义事件名建议全小写，避免大小写踩坑。
- ⚠️ **样式隔离**：组件内写页面的 class 选择器不生效是**正常**的（默认 isolated）；需要共享再调 `styleIsolation`，别在组件里用 `!important` 硬怼。
- ✅ **`observers` 支持字段路径/通配**：`'a.b'`、`'a, b'`、`'**'`，比 Vue watch 更细。
- ✅ **`selectComponent` 要等组件已渲染**（attached 之后）再调，否则拿到 `null`。
- ✅ 有 Vue 基础走捷径：把组件当 Vue 组件写，重点适应 **`Component` 结构** + **`triggerEvent`/`e.detail`** + **`usingComponents` 注册** + **默认样式隔离**。
- 🔗 上一步事件机制 → [06-events.md](06-events.md)（`bindtap`/`e.detail` 原理）；架构基础 → [01-overview-architecture.md](01-overview-architecture.md)；官方文档 → <https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/>。
