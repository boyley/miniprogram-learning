# 01 · 小程序全景与架构（Overview & Architecture）

> 小程序是"无需安装、用完即走"的轻应用，跑在微信/抖音等超级 App 里。它最核心的特点是**双线程架构**（逻辑层 JS 与渲染层视图分离），这决定了它和普通 H5 的一切不同（为什么不能操作 DOM、为什么要 `setData`）。重要度 ⭐⭐⭐。官方：developers.weixin.qq.com

## 🎯 一句话核心

小程序不是"跑在浏览器里的网页"，而是**跑在两条独立线程上的受限应用**：你的 JS 逻辑在**逻辑层**跑、界面在**渲染层**跑，两者不能直接互相访问，只能通过微信客户端（Native）**通信**。理解这条，`setData`、不能操作 DOM、性能优化全都通了。

## 📖 核心概念 / 讲解

**小程序是什么。** 依托微信/抖音等宿主 App 的轻应用：**无需下载安装、扫码/搜索即用、用完即走**。技术上用类 Web 的 WXML/WXSS/JS 开发，但运行在宿主提供的**小程序运行环境**里，能力受平台管控、可调用宿主的原生能力（支付、定位、扫码等）。

**★ 双线程架构（最核心，务必理解）。** 普通网页是单线程：JS 和渲染在同一个线程，JS 能直接操作 DOM。小程序把它拆成**两条线程**：

- **逻辑层（App Service）**：跑你的 JS 业务代码（`Page`、`data`、事件处理、`wx.*` 调用）。运行在一个独立 JS 引擎里（微信用 V8/JSCore，无浏览器 DOM/BOM）。
- **渲染层（View / WebView）**：负责界面渲染（WXML/WXSS 解析成视图）。一个页面一个 WebView。
- **两层不能直接通信**，都要经过 **微信客户端（Native）中转**：逻辑层要更新界面 → 调 `setData` → 数据经 Native 序列化传给渲染层 → 渲染层 diff 后更新视图。

```
┌─────────────┐   setData(数据)    ┌──────────────┐   渲染层
│  逻辑层      │ ───────────────►  │  Native      │ ──────► WebView
│ (你的JS/Page)│                    │ (微信客户端) │        (WXML/WXSS→视图)
│  wx.* API   │ ◄─────────────── │  中转/通信   │ ◄────── 用户事件(点击)
└─────────────┘   事件回调         └──────────────┘
```

**为什么这么设计？** ①**安全管控**：逻辑层没有 DOM/BOM，无法像网页那样随意操纵页面、跳转、执行危险操作，平台可管控；②**性能与体验**：渲染层独立，JS 长任务不会直接卡住界面；预加载、原生组件混合渲染更可控。**代价**：逻辑层和渲染层通信有开销 → **`setData` 传输的数据要尽量小、频率要低**，这是小程序性能优化的头号原则（详见 [05-logic-setdata](05-logic-setdata.md)、[13-subpackage-performance](13-subpackage-performance.md)）。

**和 H5 / Vue 的关键区别（有 Web 基础对照记）：**

| 维度 | H5 / Vue | 小程序 |
|---|---|---|
| 线程 | 单线程，JS 直接操作 DOM | 双线程，**不能操作 DOM**，靠 setData |
| 更新视图 | Vue 响应式自动 / 手动改 DOM | **手动 `setData(...)`** |
| 标签/样式 | HTML / CSS | **WXML / WXSS** |
| 单位 | px/rem | **rpx**（自动适配屏宽） |
| 能力 | 浏览器全部 API | 受限 **`wx.*`** + 需授权 |
| 分发 | 部署服务器、URL 访问 | **提审上架**到平台 |

**主流小程序平台。** 微信（生态最大、主线）、抖音/字节（tt API，[15-douyin](15-douyin.md)）、支付宝、百度、快手等。语法大同小异，跨端可用 uni-app/Taro 一套代码多端（[16-cross-platform](16-cross-platform.md)）。

**开发工具。** **微信开发者工具**（官方 IDE，写代码 + 模拟器预览 + 调试 + 真机预览 + 上传）。需注册小程序账号拿 **AppID**。

## 💻 代码示例：一个页面长什么样

小程序一个页面 = **四个文件**（同名不同后缀，放同一目录）：

```
pages/index/
├── index.wxml   ← 结构（相当于 HTML 模板）
├── index.wxss   ← 样式（相当于 CSS）
├── index.js     ← 逻辑（Page 对象：data + 事件 + 生命周期）
└── index.json   ← 该页面配置（标题、引用的组件等）
```

```html
<!-- index.wxml：数据绑定 {{}} + 事件 bindtap（不是 onclick） -->
<view class="box">
  <text>{{msg}}</text>
  <button bindtap="onTap">点我</button>
</view>
```

```css
/* index.wxss：用 rpx 自动适配屏宽（750rpx = 屏幕宽） */
.box { padding: 20rpx; font-size: 32rpx; }
```

```js
// index.js：不是操作 DOM，而是改 data 再 setData
Page({
  data: { msg: '你好，小程序' },       // 初始数据（会渲染到视图）
  onTap() {
    // ❌ 不能 document.querySelector；✅ 用 setData 更新视图
    this.setData({ msg: '点击了！' });   // 数据 → Native → 渲染层更新
  },
  onLoad() { /* 页面生命周期：加载时触发 */ }
});
```

> 对比 Vue：`data` 像 Vue 的 data，但**不会自动响应**——改数据必须用 `this.setData({...})` 才会更新视图。

## 🔑 要点速记

- 小程序 = **无需安装、用完即走**的轻应用，跑在微信/抖音等宿主里，能力受平台管控。
- **★ 双线程架构**：逻辑层(JS 业务)+ 渲染层(视图)分离，**不能直接通信**，经 Native 中转。
- **不能操作 DOM**；更新视图必须 **`setData`**（数据经 Native 传渲染层）。
- 三件套 **WXML / WXSS / JS**；单位 **rpx**（750rpx=屏宽）；API 是受限的 **`wx.*`**。
- 页面 = **四文件**（wxml/wxss/js/json）；事件用 `bindtap` 不是 `onclick`。
- 优化头号原则：**setData 数据小、频率低**（双线程通信有开销）。
- 有 **Vue/H5 基础学得快**；核心适应双线程 + setData + 平台能力 + 审核上架。

## ⚠️ 易错点 / 最佳实践

- ⚠️ **别想着操作 DOM**——没有 `document`/`window` 那套；一切界面变化走 `setData`。
- ⚠️ **`setData` 不是越多越好**——每次都跨线程传输，频繁/大数据量 setData 是卡顿主因；只 set 变化的最小字段（详见 [05-logic-setdata](05-logic-setdata.md)）。
- ⚠️ **data 改了不 setData 视图不变**——直接 `this.data.x = 1` 不会更新界面，必须 `this.setData`。
- ✅ **先装微信开发者工具 + 注册拿 AppID**（没 AppID 可先用"测试号"）。
- ✅ **有 Vue 基础走捷径**：WXML≈模板语法、组件化≈Vue 组件、生命周期类似，重点砸 setData 机制和 wx.* 能力。
- 🔗 下一步：项目结构与配置 → [02-project-config](02-project-config.md)；官方文档 → <https://developers.weixin.qq.com/miniprogram/dev/framework/>。
