# 13 · 分包与性能优化（Subpackage & Performance）

> 小程序性能优化的两条主线：**空间上分包**（把代码拆成"主包 + 按需下载的分包"，让首屏只下最小的主包，启动更快）和**时间上省通信/省渲染**（少而小的 `setData`、长列表虚拟化、图片懒加载）。全都根植于 [01-overview-architecture](../01-overview-architecture/) 的双线程与包体加载模型。重要度 ⭐⭐⭐。官方：developers.weixin.qq.com

## 🎯 一句话核心

小程序启动要先**下载整个代码包**再执行，包越大启动越慢，所以微信限制**单包 ≤ 2MB、总包 ≤ 20MB**。**分包（Subpackage）** 就是把不常用的功能拆成独立的包，启动时**只下载主包**、进到某功能时才**按需下载**它所在的分包——首屏更快、总体积上限更高。运行期的优化则围绕一条老规矩：**让跨线程传输的数据更小、更少，让渲染的节点更少**。

## 📖 核心概念 / 讲解

**★ 为什么要分包（先理解加载模型）。** 小程序不像网页那样"边访问边加载资源"——它启动时要把**代码包整体下载**到本地再运行。如果所有页面、图片、库都塞进一个包，用户第一次打开就得等**整包**下载完，首屏白屏时间长。微信因此对包体积做了硬限制：

| 限制项 | 上限 | 说明 |
|---|---|---|
| **单个包大小** | **2MB** | 主包或任一分包，单个都不能超过 2MB |
| **整个小程序** | **20MB** | 主包 + 所有分包加起来的总上限 |

> 光有单包 2MB 装不下复杂应用，所以必须**分包**：把体积摊到多个包里逼近 20MB 总上限，同时让首屏只下主包。

**★ 分包 Subpackage：拆包 + 按需下载。** 在 `app.json` 里用 `subpackages`（也可写 `subPackages`）声明分包：每个分包有自己的 `root` 目录和 `pages` 列表。构建后：

- **主包（main package）**：放 **启动页 / TabBar 页面 / 公共资源**（`app.js`、公共组件、公共库）。启动时**只下载主包**。
- **分包（sub package）**：放某个功能模块的页面。用户**首次跳进该分包的某个页面时，才下载这个分包**（下载后缓存，二次进入无需再下）。
- 主包能访问分包吗？**主包不能引用分包内的资源**；**分包可以引用主包的公共内容**（公共组件、工具函数放主包）。分包之间**不能互相引用**对方的私有资源。

```
下载时机：
启动 ──► 只下【主包】(启动页/TabBar/公共库)         ← 首屏快
  │
  └─ 用户点进"订单"页 ──► 此时才下【subA 分包】       ← 按需
  └─ 用户点进"客服"页 ──► 此时才下【subB 分包】       ← 按需
```

**★ 分包预下载 `preloadRule`。** 按需下载有个副作用：用户**第一次**进分包时要等它下载，可能有短暂延迟。**预下载**就是"在用户还在 A 页面时，提前偷偷把他大概率要去的分包下好"。在 `app.json` 用 `preloadRule` 配置：以某个页面为 key，声明"进入此页时预下载哪些分包"，还能限定网络类型（`network: "wifi"` 只在 WiFi 下预下，省流量）。这样用户点过去时分包已就绪、秒开。

**★ 独立分包（Independent Subpackage）。** 普通分包**依赖主包**——进分包前必须先下主包。**独立分包**加 `"independent": true`，它**不依赖主包**，可以**单独运行**：从分享卡片、扫码等直接进入独立分包的页面时，**不必先下载主包**，启动更快。适合"活动页 / 落地页"这类独立入口、追求极致秒开的场景。代价：独立分包**用不了主包的公共内容**（`App` 实例、主包的公共组件/JS 都拿不到），要自带资源。

**★ 分包异步化（分包异步引用）。** 进阶能力：允许**跨分包**引用组件/JS，被引用的分包会**异步加载**。可用于把一些大而不常用的模块（如某个重型 SDK、编辑器组件）单独拆包，需要时才异步拉取，进一步压小主包。了解即可，配置见官方文档。

**★ 启动性能优化（首屏加载）。** 目标是**减少首屏要下载和要执行的东西**：

1. **减小主包体积**：非首屏功能全部**分包**；主包只留启动必需；删无用依赖、压缩代码（开发者工具"上传时压缩/混淆/Tree-Shaking"）。
2. **图片走 CDN + 压缩 + 懒加载**：大图不要打进代码包（占体积），放 **CDN** 用网络地址；用 `<image lazy-load>` 首屏外的图延迟加载；用 **WebP** 等高压缩格式、按显示尺寸出图。
3. **骨架屏（Skeleton）**：首屏数据没回来前先渲染一版灰色占位骨架，缓解白屏焦虑（开发者工具可一键生成骨架屏）。
4. **避免首屏大量 `setData`**：`onLoad` 里别一次性 `setData` 巨大数据；首屏请求尽量并行、只 set 首屏可见的量。
5. **首屏请求提前/并行**：`onLoad` 里尽早发起数据请求（别等 `onReady`）；多个独立请求并行发。

**★ setData 优化（呼应 [05-logic-setdata](../05-logic-setdata/)）。** 运行期最大的性能杠杆。核心五条，此处速记，展开与代码见 05：

| 原则 | 做法 |
|---|---|
| 只 set 最小数据 | 改一个字段就用**数据路径** `'list[3].done'`，别整包 `setData({list})` |
| 降低频率 | 多次合并成一次；高频回调（scroll/input）**节流** |
| 数据路径更新 | `'user.profile.name'`、`'list[i].price'` 精准更新某项 |
| 不上屏的别放 data | 定时器 id、原始响应挂 `this`，别进 `data` 白白参与序列化 |
| 避免一次传大数据 | 长列表**分页**追加，一次只 set 一屏 |

> 统一原理（同 05）：每次 `setData` 都要**序列化 + 经 Native 跨线程传输 + 渲染层 diff**，数据越大越多越卡。

**★ 长列表优化。** 成千上万条数据全渲染到 WXML，节点太多会**内存暴涨 + 滚动卡顿**：

- **分页加载（onReachBottom）**：上拉触底时才加载下一页并**追加**，一次只渲染一屏多的量（见 05 的 `onReachBottom`）。这是最常用、最简单的方案。
- **虚拟列表 / `recycle-view`**：官方 `recycle-view`（配合 `recycle-item`）组件**只渲染可视区域附近的节点**，滚出屏幕的节点**回收复用**，无论数据多少节点数恒定。适合超长列表、聊天记录、瀑布流。
- **及时释放**：图片列表可给不可见项 `image` 加懒加载；避免在列表项里放过重的自定义组件。

**★ 图片优化。** 图片往往是体积和流量大户：

- **合适尺寸**：按显示区域大小出图，别用 2000px 大图显示成 100px 缩略图（浪费下载 + 解码）。
- **CDN**：图片放 CDN，不要打进代码包（占主包/分包 2MB 额度）。
- **懒加载**：`<image lazy-load>` 让视口外的图延迟到滚动接近时才加载。
- **WebP / 压缩**：优先 WebP 等高压缩格式；上传前压缩。
- **`mode` 用对**：`aspectFill`/`widthFix` 等避免拉伸变形和重排。

**★ 体验评分（Audits / 体验评分）。** 微信开发者工具内置 **"体验评分（Audits）"** 面板：真机或模拟器跑一遍，自动检测性能/体验问题并**打分 + 列出扣分项**。常见扣分项：

- `setData` **数据过大**（单次 > 一定 KB）或**调用过于频繁**。
- 图片**尺寸远大于显示尺寸**、未压缩、未用 CDN。
- **首屏渲染时间过长**、白屏时间长。
- 存在**未使用的 WXSS 选择器 / 过深的 WXML 节点层级**。
- **主包体积过大**（提示分包）。
- **频繁触发**的定时器/事件未清理。

**其它优化。**

- **合理使用缓存**：`wx.setStorageSync` 缓存不常变的数据（配置、上次列表），二次进入先用缓存渲染再后台刷新，减少等待与请求（见 [09-network-storage](../09-network-storage/)）。
- **避免频繁 `wx.request`**：合并接口、加本地缓存、加载态防重复请求；搜索联想等用**防抖（debounce）**。
- **节流 / 防抖**：滚动、输入、拖动等高频操作用 throttle/debounce 控制触发频率，减少 `setData` 与请求。
- **分包异步化**：重型且不常用的模块拆成异步分包，进一步压小主包。

**和 H5 的对照。** 网页是"按需请求资源、浏览器缓存"，没有"整包下载"和 2MB 硬限制的概念；小程序因为**双线程 + 包体整体下载**模型，才有了分包这套独有机制。运行期"少 `setData`、虚拟列表"的思路则和 Web 性能优化（少重排重绘、虚拟滚动）一脉相承。

## 💻 代码示例

### 1）`app.json`：subpackages 分包配置

```json
{
  "pages": [
    "pages/index/index",        
    "pages/user/user"           
  ],
  "subpackages": [
    {
      "root": "packageOrder",             
      "name": "order",                    
      "pages": [
        "pages/list/list",                
        "pages/detail/detail"
      ]
    },
    {
      "root": "packageActivity",
      "name": "activity",
      "pages": ["pages/promo/promo"],
      "independent": true                 
    }
  ]
}
```

> 目录结构对应：`packageOrder/pages/list/list.js` 等。主包的 `pages` 只放**启动页 + TabBar 页**，其余功能进分包。分包页面路径要写**分包内相对 root 的路径**。

### 2）`app.json`：preloadRule 分包预下载

```json
{
  "preloadRule": {
    "pages/index/index": {                
      "packages": ["order"],              
      "network": "wifi"                   
    },
    "pages/user/user": {
      "packages": ["__APP__"],            
      "network": "all"                    
    }
  }
}
```

> key 是**进入的页面路径**，`packages` 用分包的 `root` 或 `name`。含义："用户进入首页时，就在后台预下载 order 分包，仅 WiFi 下"。这样点进订单页时秒开。`network` 可选 `all` / `wifi`（默认 wifi）。

### 3）图片懒加载 + 合适 mode（WXML）

```html
<!-- lazy-load：视口外的图延迟加载；图片走 CDN 网络地址不打进包 -->
<image
  src="https://cdn.example.com/goods/123_400x400.webp"
  mode="aspectFill"
  lazy-load
/>
```

### 4）长列表：分页加载（呼应 05 的 onReachBottom）

```js
// pages/list/list.js —— 一次只 set 一页，追加而非整包重传
Page({
  data: { list: [], page: 1, loading: false, noMore: false },

  onReachBottom() {                       // 上拉触底钩子
    if (this.data.loading || this.data.noMore) return;
    this.setData({ page: this.data.page + 1 }, () => this.fetchPage());
  },

  fetchPage() {
    this.setData({ loading: true });
    wx.request({
      url: 'https://api.example.com/goods?page=' + this.data.page,
      success: (res) => {
        const start = this.data.list.length;
        // 用数据路径「追加」，只传新增的一页，而非把整个 list 重传（见 05 优化④）
        const patch = { loading: false };
        res.data.forEach((item, k) => { patch['list[' + (start + k) + ']'] = item; });
        if (res.data.length === 0) patch.noMore = true;
        this.setData(patch);
      },
    });
  },
});
```

### 5）搜索输入防抖（避免频繁 wx.request）

```js
onInput(e) {
  clearTimeout(this._t);                  // 定时器 id 挂 this，不进 data（见 05 优化⑤）
  const kw = e.detail.value;
  this._t = setTimeout(() => {            // 停止输入 300ms 后才发一次请求
    wx.request({ url: 'https://api.example.com/search?kw=' + kw });
  }, 300);
}
```

## 🔑 要点速记

- **★ 包体积硬限制**：**单包 ≤ 2MB、整个小程序 ≤ 20MB**——这是分包存在的根本原因。
- **★ 分包 Subpackage**：`app.json` 的 `subpackages`（`root` + `pages`），启动**只下主包**，进分包页时**按需下载**该分包 → 首屏快。
- 主包放**启动页 / TabBar / 公共资源**；**分包可引用主包公共内容，主包不能引分包，分包间不互引**。
- **★ 预下载 `preloadRule`**：进某页时提前下好将要用的分包（可限 `network: wifi`），到时秒开。
- **★ 独立分包 `independent: true`**：不依赖主包、可单独启动（分享/扫码直达秒开），但用不了主包公共内容。
- **★ 启动优化**：减小主包（拆分包）+ 图片 CDN/压缩/懒加载/WebP + 骨架屏 + 首屏别大量 `setData` + 请求并行。
- **★ setData 优化**（详见 [05-logic-setdata](../05-logic-setdata/)）：只 set 最小数据、降频/节流、数据路径更新、不上屏的放 `this`、分页避免一次传大数据。
- **★ 长列表**：`onReachBottom` **分页追加** / `recycle-view` **虚拟列表**（只渲染可视区、回收节点）。
- **图片**：合适尺寸 + CDN + `lazy-load` + WebP + 正确 `mode`。
- **体验评分（Audits）**：开发者工具跑分，常见扣分——setData 过大/过频、图片过大、首屏慢、主包过大、无用样式。
- **其它**：缓存复用、防抖节流、避免频繁 `wx.request`、分包异步化。

## ⚠️ 易错点 / 最佳实践

- ⚠️ **什么都堆进主包 → 超 2MB 上传失败 / 启动慢**：把非首屏功能一律拆进 `subpackages`，主包只留启动必需。
- ⚠️ **分包里引用主包组件却写错路径**：分包**可以**用主包公共内容，但公共组件/JS 应放在**主包**目录；分包间私有资源**不能互引**。
- ⚠️ **独立分包里调 `getApp()` / 主包公共组件拿不到**：独立分包不依赖也**访问不到**主包，需要的资源要**自带**。
- ⚠️ **首次进分包卡一下**：这是按需下载的正常现象，用 **`preloadRule` 预下载**大概率要去的分包来消除。
- ⚠️ **大图打进代码包**：图片占用 2MB 包额度，应放 **CDN** 用网络地址，并压缩 / 用 WebP。
- ⚠️ **长列表一次渲染上万条**：内存暴涨、滚动卡死；用**分页**（`onReachBottom`）或 **`recycle-view` 虚拟列表**。
- ⚠️ **首屏 `onLoad` 里 `setData` 巨大对象**：拆小、只 set 首屏可见量，避免启动就卡（呼应 [05-logic-setdata](../05-logic-setdata/)）。
- ✅ **上传前跑一遍"体验评分（Audits）"**，按扣分项逐条优化，比凭感觉调更准。
- ✅ **合理缓存 + 防抖节流**：不常变数据 `wx.setStorageSync` 缓存先渲染再刷新；搜索/滚动加 debounce/throttle。
- 🔗 相关：双线程与加载模型 → [01-overview-architecture](../01-overview-architecture/)；setData 机制与优化详解 → [05-logic-setdata](../05-logic-setdata/)；缓存与网络 → [09-network-storage](../09-network-storage/)；官方性能优化 → <https://developers.weixin.qq.com/miniprogram/dev/framework/performance/tips.html>；官方分包 → <https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/basic.html>。
