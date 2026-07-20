# 08 · 页面路由与生命周期（Routing & Lifecycle）

> 小程序用一个**页面栈（page stack）**管理页面：跳转 API 决定"压栈还是替换、能不能返回"；生命周期钩子（lifecycle hooks）则规定"页面/应用在什么时机执行什么"。搞懂这两条，传参、返回、tab 切换、数据刷新时机全都通了。重要度 ⭐⭐⭐。官方：developers.weixin.qq.com

## 🎯 一句话核心

小程序的路由不是改 URL，而是**操作一个最多 10 层的页面栈**：`navigateTo` 压栈（能返回）、`redirectTo` 替换栈顶（不能返回）、`switchTab` 切 tabBar、`reLaunch` 清空重开。跳转时 url 带 `?query` 传参，目标页在 **`onLoad(options)`** 里接。而**生命周期钩子**决定每段代码"何时跑"——记住 `onLoad`(只一次) → `onShow` → `onReady` 这个顺序，取参、请求、初始化就各就各位。

## 📖 核心概念 / 讲解

**★ 页面栈与路由 API（重点）。** 小程序把打开过的页面压进一个**栈（stack）**，栈顶就是当前显示的页面。类比 Vue Router，但它是"实实在在的一叠页面"，返回就是弹栈。五个路由 API 对应不同的栈操作：

| API | 对栈的操作 | 保留当前页 | 能否返回 | 典型用途 |
|---|---|---|---|---|
| `wx.navigateTo` | 当前页压栈，打开新页 | ✅ 保留 | ✅ 能返回 | 普通"进入详情/下一步"（≈Vue Router `push`） |
| `wx.redirectTo` | 关闭当前页，再打开新页 | ❌ 关闭 | ❌ 不能返回 | 替换当前页，如登录成功跳首页（≈`replace`） |
| `wx.switchTab` | 切到 tabBar 页，**清空非 tab 页栈** | — | — | 跳到底部 tab 页（如"首页/我的"） |
| `wx.reLaunch` | **关闭所有页**，打开新页 | ❌ 全关 | ❌ 不能返回 | 重置整个栈，如退出登录回登录页 |
| `wx.navigateBack` | 出栈，返回上级 | — | — | 返回上一页/上 N 页（`delta`） |

要点：
- **`navigateTo` 不能跳 tabBar 页**——去 tab 页只能用 `switchTab`，否则跳转失败。
- **`switchTab` / `reLaunch` 的 url 不能带 query 参数**（tab 页传参要用全局数据或本地存储，见下）。
- `navigateBack({ delta: 2 })` 一次返回两层；`delta` 大于栈深度时返回到首页。

**页面栈限制：最多 10 层。** 栈超过 10 层后再 `navigateTo` 会失败。所以"列表→详情→详情→详情…"这种可能无限深的场景，深层要改用 `redirectTo`（替换而非叠加）或在合适节点 `reLaunch`，避免一直压栈爆掉。

**★ 传参（页面间传数据）。** 跳转时把参数拼在 url 的 query 里，目标页在 `onLoad(options)` 拿：

- `wx.navigateTo({ url: '/pages/detail/detail?id=1&name=x' })` → 目标页 `onLoad(options)` 里 `options.id === '1'`、`options.name === 'x'`。
- **注意都是字符串**——数字 `id` 拿到的是 `'1'`，要用时自己转。
- **值含特殊字符/中文**（空格、`&`、`?`）必须 `encodeURIComponent` 编码，接收端 `decodeURIComponent` 解码，否则 query 被截断。
- **传复杂对象**：url 只适合传标识（id）。传大对象有三种正规做法：① 拿 id 到目标页再请求接口；② 存**全局数据** `getApp().globalData` 或本地存储；③ 用 **`eventChannel`**（`navigateTo` 打开的页面间通信通道，能双向传对象）。

**★ 生命周期全景（重点）。** 分三层：**应用级（App）**、**页面级（Page）**、**组件级（Component）**。

App（`app.js`，整个小程序共一份，只跑一次）：

- `onLaunch`：小程序**初始化完成**（全局只一次）——做全局初始化、登录、拿 AppID 等。
- `onShow`：小程序**启动或从后台进入前台**——每次切回都触发。
- `onHide`：小程序**从前台进入后台**（切到微信聊天、锁屏）。

Page（每个页面 `xxx.js` 一份）——顺序是记忆重点：

```
进入页面：  onLoad(options)  →  onShow  →  onReady
              ↑只一次·可拿参数      ↑每次显示    ↑渲染完成·只一次
切走再回来： onHide  ⇄  onShow          （不再走 onLoad/onReady）
离开销毁：  onUnload                    （navigateBack/redirectTo 关闭页时）
```

- `onLoad(options)`：页面**加载，只触发一次**；**query 参数在这里拿**。适合读参数、发首屏请求。
- `onShow`：页面**每次显示**都触发（首次进入 + 从别的页返回 + 从后台切回）。适合刷新"可能变了的数据"。
- `onReady`：页面**首次渲染完成，只一次**。此后才能拿到节点、操作 canvas/自定义组件实例。
- `onHide`：页面被**遮挡/切走**（navigateTo 到新页、切 tab）时触发，页面仍在栈里。
- `onUnload`：页面**被销毁**（navigateBack、redirectTo、reLaunch 关闭它）时触发。适合清定时器、取消监听。

> 关键区别：`onLoad`/`onReady` 一个页面**只跑一次**；`onShow`/`onHide` 随**切换来回触发**。所以"每次进页面都要刷新的逻辑放 `onShow`，一次性初始化放 `onLoad`"。

**组件生命周期**是另一套（`lifetimes: { attached, ready, detached }` + `pageLifetimes`），不叫 `onLoad`，一句话记：组件用 `attached`≈页面 `onLoad`，详见 [07-component.md](../07-component/)。

**页面额外钩子（交互相关，需在页面 json 配置或本就支持）：**

- `onPullDownRefresh`：用户**下拉刷新**触发（需 json 里 `enablePullDownRefresh: true`），刷新完调 `wx.stopPullDownRefresh()`。
- `onReachBottom`：**滚到页面底部**触发——做**上拉加载更多/分页**。
- `onPageScroll`：页面**滚动**时触发（带 `scrollTop`）——做吸顶、回到顶部按钮（高频，别在里面 setData 太狠）。
- `onShareAppMessage`：用户**点右上角转发/分享**时触发，return 自定义标题、路径、封面。

**返回上一页传数据。** `navigateBack` 本身不带参数回传，两种常规做法：
- **`eventChannel`（推荐）**：A 页 `navigateTo` 打开 B，B 通过 `this.getOpenerEventChannel().emit('事件名', data)` 把数据发回 A，A 在 `navigateTo` 的 `events` 里监听。
- **`getCurrentPages()`**：拿到页面栈数组，`pages[pages.length - 2]` 是上一页实例，直接调它的方法或 `setData`。简单但耦合，谨慎用。

**对比 Vue Router。** 心智模型基本一致：`navigateTo` ≈ `router.push`（压栈、能后退）、`redirectTo` ≈ `router.replace`（替换、不能后退）、`navigateBack` ≈ `router.back()`。差别：小程序的"栈"是真实页面栈且**有 10 层上限**，url 是**页面路径 + query**（不是前端路由的 hash/history），`switchTab` 是小程序特有的 tabBar 概念。

## 💻 代码示例

**① 路由跳转（各 API 用法）：**

```js
// A 页：跳转到详情页并传参（普通进入，能返回）
wx.navigateTo({
  url: '/pages/detail/detail?id=1&name=' + encodeURIComponent('小明'),
});

// 登录成功，替换当前页去首页（不允许再退回登录页）
wx.redirectTo({ url: '/pages/index/index' });

// 去底部 tab 页（注意：不能带 query，也不能用 navigateTo）
wx.switchTab({ url: '/pages/home/home' });

// 退出登录，清空整个页面栈回到登录页
wx.reLaunch({ url: '/pages/login/login' });

// 返回上一页 / 返回两层
wx.navigateBack();                 // delta 默认 1
wx.navigateBack({ delta: 2 });
```

**② 目标页 onLoad 取参：**

```js
// pages/detail/detail.js
Page({
  data: { id: null, name: '' },
  onLoad(options) {
    // query 都是字符串；中文/特殊字符要解码
    const id = Number(options.id);                       // '1' → 1
    const name = decodeURIComponent(options.name || ''); // 还原“小明”
    this.setData({ id, name });
    this.fetchDetail(id);   // 拿到 id 再请求详情
  },
  fetchDetail(id) { /* wx.request(...) */ },
});
```

**③ 生命周期顺序（打印观察）：**

```js
// pages/detail/detail.js —— 首次进入打印：onLoad → onShow → onReady
Page({
  onLoad(options) { console.log('onLoad 只一次·可取参', options); },
  onShow()        { console.log('onShow 每次显示都触发'); },
  onReady()       { console.log('onReady 渲染完成·只一次'); },
  onHide()        { console.log('onHide 被切走/遮挡'); },
  onUnload()      { console.log('onUnload 页面销毁·清定时器'); },

  // 交互钩子
  onPullDownRefresh() {           // 需 detail.json: { "enablePullDownRefresh": true }
    this.refresh().then(() => wx.stopPullDownRefresh());
  },
  onReachBottom()  { this.loadMore(); },          // 上拉加载更多
  onShareAppMessage() {                            // 转发
    return { title: '看看这个', path: '/pages/detail/detail?id=1' };
  },
});
```

**④ eventChannel：B 页返回时把数据回传给 A 页：**

```js
// A 页：打开 B 并监听 B 回传的事件
wx.navigateTo({
  url: '/pages/picker/picker',
  events: {
    selected(data) { console.log('B 选好了：', data); },  // 收到 B 的数据
  },
});

// B 页（picker.js）：选完把数据发回 A，再返回
onConfirm() {
  const ch = this.getOpenerEventChannel();
  ch.emit('selected', { id: 9, name: '选中项' });
  wx.navigateBack();
}
```

## 🔑 要点速记

- **五个路由 API**：`navigateTo`(压栈·能返回) / `redirectTo`(替换·不能返回) / `switchTab`(切 tab·清非 tab 栈) / `reLaunch`(全关重开) / `navigateBack`(出栈·`delta`)。
- **页面栈最多 10 层**；深层链路用 `redirectTo`/`reLaunch` 防爆栈。
- `navigateTo` **不能**跳 tabBar 页；`switchTab`/`reLaunch` 的 url **不能带 query**。
- **传参**：url 拼 `?id=1&name=x`，目标页 **`onLoad(options)`** 取；值都是**字符串**；含中文/特殊字符用 `encodeURIComponent`；复杂对象走全局数据 / 接口 / **`eventChannel`**。
- **★ Page 生命周期顺序**：`onLoad`(带参·只一次) → `onShow`(每次显示) → `onReady`(渲染完成·只一次)；切走 `onHide`、销毁 `onUnload`。
- **App 生命周期**：`onLaunch`(只一次) → `onShow` → `onHide`。
- 额外钩子：`onPullDownRefresh` / `onReachBottom`(分页) / `onPageScroll` / `onShareAppMessage`。
- **回传数据**：`eventChannel`（推荐）或 `getCurrentPages()` 拿上一页实例。
- 对比 Vue Router：`navigateTo`≈`push`、`redirectTo`≈`replace`、`navigateBack`≈`back`。

## ⚠️ 易错点 / 最佳实践

- ⚠️ **参数全是字符串**——`onLoad` 拿到的 `options.id` 是 `'1'` 不是 `1`，做数值运算/比较前记得转。
- ⚠️ **一直 `navigateTo` 会爆栈**（>10 层跳转失败）——相同页面反复进（详情套详情）用 `redirectTo`。
- ⚠️ **去 tab 页用错 API**——`navigateTo` 跳 tabBar 页会失败，必须 `switchTab`；且 `switchTab` 不能带参。
- ⚠️ **该放 `onShow` 的逻辑放进了 `onLoad`**——从下级页返回时 `onLoad` 不再触发，"返回后要刷新的数据"必须放 `onShow`。
- ⚠️ **`onReady` 之前拿节点/组件实例拿不到**——`createSelectorQuery`、操作 canvas、拿子组件 `selectComponent` 要等 `onReady` 之后。
- ⚠️ **`onPageScroll` 里频繁 `setData`** 会卡——高频回调只在必要时更新最小数据。
- ✅ **传中文/URL/JSON 一律 `encodeURIComponent` 编码**，接收端解码，避免 `&`/`?` 截断 query。
- ✅ **`onUnload` 里清理**：清 `setInterval`/`setTimeout`、`wx.offXxx` 取消事件监听，防止内存泄漏。
- ✅ **`onPullDownRefresh` 记得 `wx.stopPullDownRefresh()`** 收起下拉圈，否则一直转。
- 🔗 相关：逻辑层与 setData → [01-overview-architecture.md](../01-overview-architecture/)；组件生命周期 → [07-component.md](../07-component/)；官方路由文档 → <https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/route.html>。
