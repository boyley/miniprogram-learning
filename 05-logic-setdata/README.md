# 05 · 逻辑层与 setData（Logic & setData）

> 逻辑层是你写业务 JS 的地方（`Page` 对象：`data` + 事件 + 生命周期），而 `setData` 是它把数据**跨线程**送到界面的**唯一**通道。理解了 [01-overview-architecture](../01-overview-architecture/) 的双线程，`setData` 为什么异步、为什么要优化就全通了。重要度 ⭐⭐⭐。官方：developers.weixin.qq.com

## 🎯 一句话核心

界面上的数据都放在 `Page` 的 `data` 里，但它**不像 Vue 会自动响应**——你必须调用 `this.setData({...})`，数据才会从**逻辑层经 Native 序列化传到渲染层**更新视图。而每一次 `setData` 都是一次**跨线程通信**，有序列化 + 传输开销，所以小程序性能优化的头号法则就是：**只传变化的最小数据、尽量降低调用频率**。

## 📖 核心概念 / 讲解

**Page() 构造器：一个页面的逻辑主体。** 每个页面的 `.js` 文件里调用一次 `Page({...})`，传入一个配置对象，它描述了这个页面的数据、行为和生命周期。核心成员分三类：

- **`data`（页面初始数据）**：一个纯对象，页面首次渲染时会被送到渲染层参与初次渲染。可以理解成"这个页面界面上所有会变的数据的初始快照"。类比 Vue 的 `data`，但**不会自动响应**（见下文）。
- **事件处理函数**：WXML 里 `bindtap="onTap"` 绑定的方法就写在这里，和 `data` 平级（详见 [06-events](../06-events/)）。函数里用 `this.data.x` 读数据、用 `this.setData()` 改数据。
- **生命周期钩子**：页面从创建到销毁各阶段自动触发的回调。

**页面生命周期（Lifecycle）。** 按触发顺序理解：

| 钩子 | 触发时机 | 典型用途 |
|---|---|---|
| `onLoad(options)` | 页面**加载时（只一次）**，`options` 是路由参数 | 接收上个页面传来的 `id` 等参数、发起首屏请求 |
| `onShow()` | 页面**每次显示**（含从后台切回、其他页返回） | 刷新可能已变化的数据（如从详情页返回列表） |
| `onReady()` | 页面**首次渲染完成（只一次）** | 此时才能拿到节点、操作 canvas/video 等 |
| `onHide()` | 页面**被隐藏**（跳转到其他页、切后台） | 暂停音视频、停止定时器 |
| `onUnload()` | 页面**卸载**（`redirectTo`/`navigateBack` 离开） | 清理定时器、取消监听、释放资源 |

> 记忆线：`onLoad`（拿参数、只一次）→ `onShow`（每次露脸）→ `onReady`（渲染好了、只一次），返回/切走时 `onHide`，彻底离开 `onUnload`。**`onLoad`/`onReady` 一次，`onShow`/`onHide` 可多次**。

**其它常用页面钩子。** 还有一批交互/滚动/分享类钩子，也写在 `Page` 里：`onPullDownRefresh`（下拉刷新，需在页面 json 开 `enablePullDownRefresh`）、`onReachBottom`（上拉触底，做分页加载）、`onPageScroll(e)`（页面滚动，`e.scrollTop`；高频，慎用）、`onShareAppMessage`（用户点转发，返回自定义标题/路径）、`onShareTimeline`（分享到朋友圈）、`onResize`（横竖屏切换/窗口尺寸变化）。

**★ setData 机制（呼应双线程，重点）。** 这是整篇的核心。回顾 [01-overview-architecture](../01-overview-architecture/)：逻辑层（你的 JS）和渲染层（视图 WebView）是**两条独立线程，不能直接互访**，一切界面更新都要经**微信客户端 Native 中转**。`setData` 就是这条通道：

```
this.setData({msg:'x'})
      │  ①逻辑层：把数据变更打包
      ▼
┌──────────────┐  ②JSON 序列化  ┌──────────────┐  ③渲染层：与旧数据 diff
│  逻辑层 JS    │ ─────────────► │   Native     │ ─────────────► WebView
│ this.data 更新│                │ (微信客户端)  │                更新对应节点
└──────────────┘                └──────────────┘                （只更新变化处）
```

三件事同时发生：①把传入的字段**合并进 `this.data`**（逻辑层本地数据被更新）；②数据**序列化后经 Native 传给渲染层**；③渲染层拿到后和当前视图 diff，**只更新真正变化的节点**。

**为什么不能直接 `this.data.x = 1`？** 因为直接赋值只改了**逻辑层内存里的那个对象**，**根本没有触发跨线程通信**——Native 和渲染层完全不知道数据变了，视图纹丝不动。（更糟的是：这样改还会让 `this.data` 和视图状态**不一致**，埋下 bug。）所以规矩是：**改要显示的数据，必须走 `setData`**；`setData` 会替你既更新 `this.data` 又更新视图。

**★ setData 是异步的。** `setData` 只是"发起"一次数据传输，视图更新是**异步**完成的——调用后**下一行代码里 DOM/视图还没更新好**。如果你需要在视图更新完成后做事，用它的**第二个参数回调**：`this.setData({...}, () => { /* 此时视图已更新 */ })`。注意：`this.data` 的值本身是**同步**就被合并好的（调用后立刻能读到新值），异步的是**视图渲染**这一步。

**和 Vue 的关键对比。** `data` 像 Vue 的 `data`，写法几乎一样；但 Vue 靠响应式（`Object.defineProperty`/`Proxy`）**自动追踪并更新视图**，你改 `this.count++` 界面就变。小程序**没有这层自动响应**——因为视图在另一条线程，逻辑层改内存对象无从被"监听"。所以你必须**手动 `setData` 显式发起一次跨线程同步**。一句话：**Vue 是"改数据→框架帮你同步视图"，小程序是"改数据→你自己 `setData` 同步视图"**。

## 💻 代码示例

### 一个完整的 Page（data + 事件 + 生命周期 + 分享）

```js
// pages/list/list.js
Page({
  // ① 页面初始数据（会参与首屏渲染）
  data: {
    title: '待办清单',
    list: [],              // 列表数据
    loading: false,
    page: 1,
  },

  // ② 生命周期：加载（只一次），options 是路由参数 ?type=xxx
  onLoad(options) {
    this.type = options.type || 'all';   // 不用渲染的参数放 this，别放 data（见优化⑤）
    this.fetchList();
  },

  // 每次显示（从详情页返回也会触发）——刷新数据
  onShow() { /* 如需每次回来都刷新，放这里 */ },

  // 首次渲染完成（只一次）——要操作节点/canvas 在这
  onReady() {},

  onHide() {},                            // 被隐藏
  onUnload() { clearTimeout(this.timer); }, // 卸载，清理资源

  // ③ 事件处理函数（WXML 里 bindtap="onAdd" 绑定）
  onAdd(e) {
    const item = { id: Date.now(), name: '新任务', done: false };
    // 追加一项：用「数据路径 + 当前长度」只传新增的一项，别整包 setData（见优化①③）
    this.setData({ [`list[${this.data.list.length}]`]: item });
  },

  // 勾选某一项完成——只更新那一项的 done 字段（数据路径）
  onToggle(e) {
    const i = e.currentTarget.dataset.index;     // WXML 里 data-index="{{index}}"
    this.setData({ [`list[${i}].done`]: !this.data.list[i].done });
  },

  // 下拉刷新钩子（需页面 json 里 "enablePullDownRefresh": true）
  onPullDownRefresh() {
    this.setData({ page: 1 }, () => this.fetchList(true));
  },

  // 上拉触底钩子——分页加载
  onReachBottom() {
    if (this.data.loading) return;
    this.setData({ page: this.data.page + 1 }, () => this.fetchList());
  },

  // 转发/分享
  onShareAppMessage() {
    return { title: '快来看我的清单', path: '/pages/list/list?type=' + this.type };
  },

  // 自定义业务方法（不是钩子，自己调）
  fetchList(refresh) {
    this.setData({ loading: true });
    wx.request({
      url: 'https://api.example.com/todos',
      success: (res) => {
        const list = refresh ? res.data : this.data.list.concat(res.data);
        this.setData({ list, loading: false });   // 合并成「一次」setData（见优化②）
        wx.stopPullDownRefresh();
      },
    });
  },
});
```

### setData 优化：改前 → 改后对比

**① 只 set 变化的最小数据（别整包传大对象/数组）**

```js
// ❌ 改前：只改了一项的 done，却把整个上千条的 list 重新序列化跨线程传输
this.data.list[3].done = true;         // 顺手还犯了「直接改 data」的错
this.setData({ list: this.data.list });

// ✅ 改后：用数据路径，只传变化的那一个字段，通信量从「整个数组」降到「一个布尔值」
this.setData({ 'list[3].done': true });
```

**② 降低调用频率（合并多次 setData）**

```js
// ❌ 改前：连调 3 次 = 3 次跨线程通信
this.setData({ a: 1 });
this.setData({ b: 2 });
this.setData({ c: 3 });

// ✅ 改后：合并成 1 次
this.setData({ a: 1, b: 2, c: 3 });

// ❌ 高频场景：onPageScroll / input / 拖动里每次回调都 setData → 疯狂卡顿
onPageScroll(e) { this.setData({ scrollTop: e.scrollTop }); }

// ✅ 改后：节流（throttle），或先攒着、必要时才 set；能不进 data 就别进
onPageScroll(e) {
  if (Date.now() - (this._last || 0) < 100) return;  // 100ms 一次
  this._last = Date.now();
  this.setData({ scrollTop: e.scrollTop });
}
```

**③ 用数据路径更新数组/对象的某一项**

```js
// 语法：把「路径字符串」当 key。支持 obj.a.b、arr[0]、arr[0].name 混合
this.setData({
  'user.profile.name': 'Tom',   // 更新嵌套对象的一个字段
  'list[0].price': 99,          // 更新数组第 0 项的 price
  ['list[' + i + '].done']: true // 索引是变量时用「计算属性名 []」拼
});
// ⚠️ 数组不能用 push/splice 后再整包 set；用路径「新增」：list[当前长度] = 新项（见示例 onAdd）
```

**④ 避免一次 setData 大量数据（序列化开销）**

```js
// ❌ 改前：一次性把 1000 条渲染数据塞进去，序列化 + 传输 + diff 都很重
this.setData({ list: bigArrayOf1000 });

// ✅ 改后：分页/虚拟列表，一次只 set 一屏的量（配合 onReachBottom 追加）
this.setData({ ['list[' + start + ']']: pageData });  // 或分批 append
```

**⑤ 不需要渲染的数据别放 data（放 this 自定义属性）**

```js
// ❌ 改前：定时器 id、原始响应、临时标志位都塞进 data —— 每次 setData 白白参与序列化对比
this.setData({ timerId: id, rawResp: res, flag: true });

// ✅ 改后：不上屏的数据挂在实例 this 上，完全不走跨线程
this.timerId = id;        // WXML 里用不到，就别进 data
this.rawResp = res;
this._flag = true;
// 只有「要显示在界面上」的数据才放 data
```

> **为什么这些优化有效——一句话统一解释**：`data` 里的每个字段、每次 `setData` 的每个值，都要**在逻辑层序列化成字符串、经 Native 跨线程传给渲染层、再反序列化 + diff**。数据越大、次数越多，这条链路上的 CPU 和传输开销就越大，直接表现为**界面卡顿、点击延迟**。所有优化本质都在做一件事：**让跨线程传输的数据更小、更少**。

## 🔑 要点速记

- **`Page({...})`** = 页面逻辑主体：`data`（初始数据）+ 事件处理函数 + 生命周期钩子。
- 生命周期顺序：**`onLoad`（拿参数,一次）→ `onShow`（每次显示）→ `onReady`（渲染完,一次）**；离开 `onHide`，卸载 `onUnload`。
- 交互钩子：`onPullDownRefresh` / `onReachBottom`（分页）/ `onPageScroll`（高频慎用）/ `onShareAppMessage`。
- **★ 改要显示的数据必须 `this.setData({...})`**：数据经 **Native 序列化跨线程**传到渲染层更新视图。
- **直接 `this.data.x = 1` 不更新视图**（没触发跨线程通信），还会造成数据与视图不一致。
- **`setData` 视图更新是异步的**：要在更新后做事用第二参回调 `setData(data, cb)`；但 `this.data` 是同步就合并好的。
- **★ 优化五连**：①只 set 最小变化数据 ②合并/节流降频率 ③数据路径更新某项 ④避免一次传大数据（分页）⑤不上屏的数据放 `this` 别放 `data`。
- 优化统一原理：**跨线程通信有序列化 + 传输开销 → 数据小、频率低**。
- 对比 Vue：`data` 写法像，但**不自动响应**，必须手动 `setData`。

## ⚠️ 易错点 / 最佳实践

- ⚠️ **忘了 `setData`，直接改 `this.data`**：界面不更新，是新手第一大坑。凡是"改了要上屏"的数据，一律走 `setData`。
- ⚠️ **`setData` 后立刻读视图/节点拿到旧值**：视图更新是异步的，需要更新后逻辑放**第二参回调**里。
- ⚠️ **整包 `setData` 大数组只为改一个字段**：用**数据路径** `'list[i].xxx'`，别 `setData({list: 整个数组})`。
- ⚠️ **在 `onPageScroll`/`input`/拖动等高频回调里裸 `setData`**：必须**节流**或合并，否则跨线程通信被打爆，界面卡死。
- ⚠️ **把定时器 id、原始响应等不渲染的数据塞进 `data`**：白增序列化成本，挂到 `this` 上即可。
- ⚠️ **数组用 `push`/`splice` 改完再整包 set**：小程序对数组无响应式，正确姿势是**数据路径新增/改项**。
- ✅ **`onLoad` 里接路由参数**（`options`），首屏请求也放这；**`onShow` 做"每次回来要刷新"**的逻辑（如从详情页返回更新列表）。
- ✅ **一次交互能合并的 `setData` 就合并成一次**，减少跨线程往返。
- 🔗 相关：双线程为什么要这样 → [01-overview-architecture](../01-overview-architecture/)；事件与 `dataset` → [06-events](../06-events/)；性能与分包 → [13-subpackage-performance](../13-subpackage-performance/)；官方 setData 文档 → <https://developers.weixin.qq.com/miniprogram/dev/framework/performance/tips.html>。
