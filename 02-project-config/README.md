# 02 · 项目结构与配置（Project & Config）

> 一个小程序 = **三个全局文件（app.js/app.json/app.wxss）+ 若干页面**。其中 **`app.json` 是整个小程序的"大脑"**：页面注册、导航栏、底部 tabBar、分包、权限全在这里配。理解它，等于理解了小程序的"路由 + 全局配置"。重要度 ⭐⭐⭐。官方：developers.weixin.qq.com

## 🎯 一句话核心

小程序项目靠**约定 + 配置**驱动：根目录三件套 **`app.js`（全局逻辑/globalData）、`app.json`（全局配置/路由）、`app.wxss`（全局样式）** 定义整个应用；每个页面又是**四文件**（wxml/wxss/js/json）。**`app.json` ≈ Vue 项目的路由表 + 全局配置文件**——没在 `pages` 里注册的页面，小程序根本看不见。

## 📖 核心概念 / 讲解

**项目整体结构。** 和 Vue/React 靠 `main.js` 手动 import 组装不同，小程序是**目录约定 + 配置注册**：文件放对位置、在 `app.json` 里登记，框架就自动帮你加载。一个典型项目：

```
myapp/
├── app.js              ← ★ App 实例：全局逻辑 + globalData（全局数据）
├── app.json            ← ★ 全局配置：pages/window/tabBar/subpackages…（最重要）
├── app.wxss            ← 全局样式（作用于所有页面，≈ 全局 CSS）
├── project.config.json ← 开发者工具的工程配置（AppID、编译选项，不影响运行）
├── sitemap.json        ← 页面索引配置（给微信搜索用，是否允许被索引）
├── pages/              ← 页面目录（一个页面一个文件夹）
│   ├── index/          ← 首页（index.wxml/wxss/js/json 四文件）
│   └── logs/
├── components/         ← 自定义组件目录（见 07-component）
└── utils/              ← 工具函数（普通 JS 模块，自己 require）
```

**三个全局文件（app.*）**。文件名固定，必须放在**项目根目录**：

| 文件 | 作用 | Web 类比 |
|---|---|---|
| `app.js` | App 实例，全局生命周期 + `globalData` | `main.js` + 全局 store |
| `app.json` | 全局配置：页面注册、窗口、tabBar… | 路由表 + 全局 config |
| `app.wxss` | 全局样式，自动应用到每个页面 | 全局 `global.css` |

**★ `app.json` 全局配置（重点，逐字段拆）。** 这是**唯一必需**的配置文件，纯 JSON（不能写注释、不能有多余逗号）。核心字段：

- **`pages`**：页面路径数组，**每一个页面都必须在这里注册**（不含 `.wxml` 后缀，写路径前缀）。**数组第一项 = 小程序首页**（启动页）。新建页面忘了登记 → 页面打不开。
- **`window`**：全局窗口外观。常用：`navigationBarTitleText`（导航栏标题）、`navigationBarBackgroundColor`（导航栏背景，仅 `#000000`/`#ffffff` 等）、`navigationBarTextStyle`（`black`/`white` 二选一）、`backgroundColor`（窗口背景）、`enablePullDownRefresh`（开启下拉刷新，配合页面 `onPullDownRefresh`）、`onReachBottomDistance`（上拉触底距离）。
- **`tabBar`**：底部/顶部标签栏。配了它才有原生底部导航。`list` 数组 **2~5 项**，每项 `pagePath`（必须是已注册页面）+ `text` + 图标。**tabBar ≈ App 底部导航配置**（类似 uni-app 的 tabBar、原生 App 的 TabController）。
- **`usingComponents`**：**全局**注册自定义组件（所有页面免声明直接用）。局部只在某页用则写在**页面 json** 里，见下文。
- **`subpackages`**（分包）：把部分页面拆成独立包，**主包只装启动必需的**，其余按需下载，突破 2MB 主包限制、加快启动。详见 [13-subpackage-performance](../13-subpackage-performance/)。
- **`permission` / `requiredPrivateInfos`**：权限声明。`permission.scope.userLocation` 配定位授权的说明文案；`requiredPrivateInfos` 声明要调用的**敏感隐私接口**（如 `getLocation`、`chooseAddress`），**不声明直接调用会失败**（新规）。

**页面四文件 + 页面 json 覆盖。** 每个页面一个目录，四个同名文件：`.wxml`（结构）、`.wxss`（样式）、`.js`（`Page` 逻辑）、`.json`（**该页面**配置）。**页面 json 里的 `window` 字段会覆盖 `app.json` 的全局 window**——比如全局标题叫"我的 App"，详情页想显示"商品详情"，就在详情页 json 写 `navigationBarTitleText`。页面 json 还能写局部 `usingComponents`、`enablePullDownRefresh` 等。**注意页面 json 直接写窗口字段，不用再包一层 `window`**（这是和 app.json 的区别）。

**`App()` 构造器。** `app.js` 里调用**一次** `App({...})` 注册全局实例，只能有一个。核心：
- **生命周期**：`onLaunch`（小程序**初始化，全局只触发一次**，适合读缓存、登录）、`onShow`（小程序进入前台，如从后台切回）、`onHide`（退到后台）。注意区别于**页面**的 `onLoad`/`onShow`（页面级，见 08 路由生命周期）。
- **`globalData`**：挂在 App 实例上的**全局数据共享**对象。任意页面用 `getApp().globalData.xxx` 读写，是最轻量的跨页面共享方案（≈ 一个简易全局 store，但**无响应式**，改了不会自动刷新界面，仍要各页面自己 `setData`）。

**`project.config.json` / `sitemap.json`。** 前者是**开发者工具**的工程配置（`appid`、编译/预览选项、`miniprogramRoot`），只影响开发环境、不参与运行时逻辑；`appid` 决定用哪个小程序账号（没有可填测试号）。`sitemap.json` 配置页面是否允许被**微信搜索索引**，`{ "action": "allow" }` 表示允许。

## 💻 代码示例

**① `app.json`（带注释讲解——真实文件里请删掉注释，JSON 不支持注释）：**

```jsonc
{
  // ★ 页面注册：数组第一项是首页；新建页面必须加到这里
  "pages": [
    "pages/index/index",   // 首页（启动页）
    "pages/list/list",
    "pages/mine/mine"
  ],
  // 全局窗口外观（可被页面 json 覆盖）
  "window": {
    "navigationBarTitleText": "我的小程序",     // 导航栏标题
    "navigationBarBackgroundColor": "#ffffff",  // 导航栏背景色
    "navigationBarTextStyle": "black",          // 标题颜色：仅 black/white
    "backgroundColor": "#f5f5f5",               // 窗口背景色
    "enablePullDownRefresh": false,             // 全局下拉刷新开关
    "onReachBottomDistance": 50                 // 上拉触底触发距离(px)
  },
  // ★ 底部标签栏：list 2~5 项，pagePath 必须是已注册页面
  "tabBar": {
    "color": "#999999",                         // 未选中文字色
    "selectedColor": "#07c160",                 // 选中文字色（微信绿）
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/index/index",        // 对应 pages 里的页面
        "text": "首页",
        "iconPath": "images/home.png",          // 未选中图标
        "selectedIconPath": "images/home-on.png"// 选中图标
      },
      { "pagePath": "pages/mine/mine", "text": "我的" }
    ]
  },
  // 全局自定义组件（所有页面免声明直接用）
  "usingComponents": {
    "van-button": "@vant/weapp/button/index"
  },
  // 分包：主包只放启动必需，其余按需加载（见 13-subpackage-performance）
  "subpackages": [
    { "root": "packageActivity", "pages": ["pages/promo/promo"] }
  ],
  // 定位授权说明文案
  "permission": {
    "scope.userLocation": { "desc": "用于展示附近的门店" }
  },
  // 声明要调用的敏感隐私接口（不声明直接调用会失败）
  "requiredPrivateInfos": ["getLocation", "chooseAddress"],
  "sitemapLocation": "sitemap.json"
}
```

**② 页面 json（覆盖全局 window + 局部组件）：**

```json
{
  "navigationBarTitleText": "商品详情",
  "enablePullDownRefresh": true,
  "usingComponents": {
    "goods-card": "/components/goods-card/goods-card"
  }
}
```

> 注意：页面 json 里窗口字段**直接写、不包 `window`**（`app.json` 才包 `window`）。

**③ `app.js`（`App()` 构造器 + globalData）：**

```js
// app.js —— 整个小程序只调用一次 App()
App({
  // 全局生命周期：初始化只触发一次，适合登录、读缓存
  onLaunch(options) {
    // 例：静默登录拿 code（见 11 登录授权）
    wx.login({
      success: (res) => {
        console.log('登录 code:', res.code);
      }
    });
    // 读本地缓存写入 globalData
    this.globalData.token = wx.getStorageSync('token') || '';
  },
  onShow(options) {
    // 小程序切到前台（如从后台恢复）
  },
  onHide() {
    // 小程序退到后台
  },
  // ★ 全局数据：任意页面用 getApp().globalData.xxx 读写
  globalData: {
    userInfo: null,
    token: ''
  }
});
```

**④ 页面里读写 globalData：**

```js
// pages/mine/mine.js
const app = getApp();               // 拿到 App 实例
Page({
  onLoad() {
    const token = app.globalData.token;      // 读全局数据
    app.globalData.userInfo = { name: 'Ann' }; // 写全局数据
    // ⚠️ 改 globalData 不会自动刷新界面，要展示仍需 setData
    this.setData({ token });
  }
});
```

## 🔑 要点速记

- 项目 = 根目录**三件套** `app.js`/`app.json`/`app.wxss` + `pages/` 下各页面（四文件）。
- **★ `app.json` 是全局配置中枢**（唯一必需、纯 JSON 不能带注释）：`pages`(注册页面) / `window`(窗口外观) / `tabBar`(底部导航) / `usingComponents`(全局组件) / `subpackages`(分包) / `permission`+`requiredPrivateInfos`(权限)。
- **`pages` 第一项 = 首页**；新建页面**必须登记**，否则打不开。
- **`tabBar.list` 2~5 项**，`pagePath` 必须是已注册页面；配了才有原生底部导航。
- **页面 json 覆盖全局 `window`**；页面 json 写窗口字段**不包 `window`**，app.json 才包。
- **`App()` 只调用一次**：`onLaunch`(全局仅一次) / `onShow` / `onHide`；`globalData` 是最轻量跨页共享（`getApp().globalData`）。
- `project.config.json` 存 **AppID + 工具配置**（不影响运行）；`sitemap.json` 管**搜索索引**。

## ⚠️ 易错点 / 最佳实践

- ⚠️ **`app.json` 不能写注释、不能有尾逗号**——它是严格 JSON，写错工具直接报错、编译不过（本文示例的注释仅供讲解，实际要删）。
- ⚠️ **新建页面别只建文件夹**——必须同时在 `app.json` 的 `pages` 里加路径，否则页面不存在（开发者工具新建页面会自动帮你登记）。
- ⚠️ **`tabBar` 的 `pagePath` 不能带参数、必须是已注册页面**，且 tab 页之间只能用 `wx.switchTab` 跳转（见 08 路由生命周期）。
- ⚠️ **`globalData` 无响应式**——`app.globalData.x = 1` 只是改了个普通对象，界面不会变；要显示仍得在页面里 `setData`。它也不持久化（小程序关闭即丢），要持久用 `wx.setStorageSync`（见 09 网络与存储）。
- ⚠️ **敏感接口忘了 `requiredPrivateInfos`**——如 `wx.getLocation` 现在必须在 app.json 声明，否则调用直接失败。
- ✅ **区分 App 生命周期与页面生命周期**：`onLaunch` 全局只一次（放登录/初始化），页面 `onLoad`/`onShow` 每次进页面触发（见 08）。
- ✅ **导航栏颜色只认 black/white**：`navigationBarTextStyle` 不能填任意色值，想要彩色标题得用自定义导航栏（`"navigationStyle": "custom"`）。
- ✅ **全局用 `app.wxss` 放通用样式**（如重置、公共类），页面 `.wxss` 放页面专属，避免每页重复。
- 🔗 下一步：页面结构语言 → [03-wxml](../03-wxml/)（若未创建以实际编号为准）；分包 → [13-subpackage-performance](../13-subpackage-performance/)；上一篇：[01-overview-architecture](../01-overview-architecture/)。官方配置文档 → <https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html>。
```
