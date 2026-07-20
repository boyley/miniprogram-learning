# 15 · 抖音/字节小程序（Douyin Mini Program）

> 字节跳动的小程序平台，跑在抖音/今日头条等字节 App 里。**架构和开发方式几乎照搬微信**，最大差异是 API 前缀 `wx.*` → `tt.*`；生态偏内容/电商/本地生活，靠短视频、直播挂载引流。重要度 ⭐⭐。官方：微信小程序基础见 [01-overview-architecture](../01-overview-architecture/)，跨端多写一次见 [16-cross-platform](../16-cross-platform/)。

## 🎯 一句话核心

抖音小程序 = **换了个宿主 App 的"微信小程序"**：一样的双线程架构、一样的类 WXML/WXSS/JS、一样的页面四文件、一样的 `Page`/`Component` 构造器——你把 `wx.` 改成 **`tt.`**、换成抖音开发者工具，八成的知识直接迁过来。核心不同在**平台特色能力（视频/直播/POI/团购挂载）、审核、支付**。

## 📖 核心概念 / 讲解

**抖音小程序是什么。** 字节跳动开放平台的小程序，运行在**抖音、今日头条、抖音火山版**等字节系 App 里。和微信"社交裂变"不同，它的核心场景是**内容 / 电商 / 本地生活**：流量入口是**短视频挂载、直播间挂载、POI（地点）页、团购券**——用户看视频/逛直播时点挂载的小程序卡片就进来了。所以做抖音小程序，重点常常是"怎么被短视频/直播带流量 + 转化下单"，而不是通讯录分享。

**★ 和微信几乎一样的部分（迁移成本低的根本原因）。** 如果你已经会微信小程序（[01-overview-architecture](../01-overview-architecture/)），下面这些**原样成立**：

- **双线程架构**：一样是逻辑层（JS 业务）+ 渲染层（视图）分离，不能操作 DOM，更新视图靠 `setData`（[05-logic-setdata](../05-logic-setdata/) 的原则全通用）。
- **模板/样式/逻辑三件套**：抖音叫 **TTML / TTSS**（对应微信 WXML/WXSS），语法几乎一致——`{{}}` 数据绑定、`tt:for`/`tt:if`（对应 `wx:for`/`wx:if`）、`bindtap` 事件、`rpx` 单位全都在。
- **页面 = 四文件**：`.ttml / .ttss / .js / .json`（对应微信 `.wxml/.wxss/.js/.json`），目录同名不同后缀，结构一模一样。
- **构造器**：一样用 `App()` / `Page()` / `Component()`，`data`、生命周期（`onLoad`/`onShow`…）、事件处理写法基本相同。

**★ 和微信不一样的部分（迁移时必须改的）。**

| 维度 | 微信 | 抖音/字节 |
|---|---|---|
| **API 前缀** | `wx.*` | **`tt.*`**（`tt.request`/`tt.login`/`tt.showToast`） |
| 模板文件 | `.wxml` / `.wxss` | **`.ttml` / `.ttss`** |
| 列表/条件 | `wx:for` / `wx:if` | `tt:for` / `tt:if` |
| 开发者工具 | 微信开发者工具 | **抖音开发者工具**（独立 IDE） |
| 账号/AppID | 微信公众平台 | **字节跳动开放平台** |
| 登录 | `wx.login` → code | **`tt.login`** → code（流程同理） |
| 支付 | 微信支付 | **抖音支付 / 担保交易** |
| 特色能力 | 社交分享/公众号 | **视频/直播/POI/团购挂载** |
| 审核规则 | 微信审核 | 字节审核（各自不同，尤其电商/内容类目） |

**★ 登录流程（和微信同构）。** 抖音登录和微信 [11-login-auth](../11-login-auth/) 是一个套路：前端 `tt.login()` 拿临时 **code** → 传给你自己的后端 → 后端拿 code + 字节的 AppID/AppSecret 调字节服务端接口 **换取 openid/session**。前端永远只碰 code，不碰密钥。区别只是"调哪个平台的接口"。

**★ 一套代码多端才是主流做法。** 现实里很少有人"微信写一遍、抖音再手写一遍"。绝大多数团队用 **uni-app / Taro** 写一套代码，编译到微信 + 抖音 + 支付宝等多端（详见 [16-cross-platform](../16-cross-platform/)）。框架帮你把 `wx.` / `tt.` 差异、`.wxml` / `.ttml` 差异在**编译期**磨平，你只写一份业务，各端产物自动生成。**只有平台特色能力（抖音的直播挂载、微信的公众号）才需要按端写条件分支**。

## 💻 代码示例

**tt.* 与 wx.* API 对照（把 wx 换成 tt，签名基本一致）：**

| 能力 | 微信 | 抖音 |
|---|---|---|
| 网络请求 | `wx.request` | `tt.request` |
| 登录取 code | `wx.login` | `tt.login` |
| 轻提示 | `wx.showToast` | `tt.showToast` |
| 本地存储 | `wx.setStorageSync` | `tt.setStorageSync` |
| 页面跳转 | `wx.navigateTo` | `tt.navigateTo` |
| 拉起支付 | `wx.requestPayment` | `tt.pay`（担保交易） |
| 用户信息 | `wx.getUserProfile` | `tt.getUserProfile` |

```js
// 抖音小程序 index.js —— 和微信写法几乎一致，只是 wx. → tt.
Page({
  data: { msg: '你好，抖音小程序' },

  onLoad() {
    // 1) 登录：拿临时 code（对应 wx.login）
    tt.login({
      success: (res) => {
        // res.code 传给自己的后端 → 后端向字节服务端换 openid
        tt.request({
          url: 'https://your.api/login',       // 对应 wx.request
          method: 'POST',
          data: { code: res.code },
          success: () => tt.showToast({ title: '登录成功' }), // 对应 wx.showToast
        });
      },
    });
  },

  onTap() {
    // 更新视图一样靠 setData（双线程，不能操作 DOM）
    this.setData({ msg: '点击了！' });
  },
});
```

```html
<!-- index.ttml —— 对应微信 index.wxml，语法几乎相同 -->
<view class="box">
  <text>{{msg}}</text>
  <!-- 列表用 tt:for（对应 wx:for），条件用 tt:if（对应 wx:if） -->
  <view tt:for="{{list}}" tt:key="id">{{item.name}}</view>
  <button bindtap="onTap">点我</button>
</view>
```

```css
/* index.ttss —— 对应微信 index.wxss，rpx 单位照用（750rpx = 屏宽） */
.box { padding: 20rpx; font-size: 32rpx; }
```

## 🔑 要点速记

- 抖音小程序 = 字节的小程序，跑在**抖音/今日头条**里；生态偏**内容/电商/本地生活**，靠**短视频/直播挂载**引流。
- **架构照搬微信**：双线程、类 WXML/WXSS/JS（叫 **TTML/TTSS**）、页面四文件、`Page`/`Component` 构造器——会微信 + 有 Web 基础，迁移成本低。
- **最大差异是 API 前缀**：`wx.*` → **`tt.*`**（`tt.request`/`tt.login`/`tt.showToast`…），签名基本一致。
- 登录同构：**`tt.login`** 拿 code → 后端换 openid（同 [11-login-auth](../11-login-auth/)）。
- 工具/账号/支付不同：**抖音开发者工具**、字节开放平台、**抖音支付（担保交易）**。
- **实战首选一套代码多端**：uni-app / Taro 编译到微信+抖音（[16-cross-platform](../16-cross-platform/)），别各写一套。

## ⚠️ 易错点 / 最佳实践

- ⚠️ **别直接把 `wx.` 全局替换成 `tt.` 就上线**——部分 API 抖音不支持或参数不同，特色能力（支付、挂载、POI）差异更大，替换后要**逐个核对文档 + 真机测**。
- ⚠️ **文件后缀要一起换**：`.wxml/.wxss` → `.ttml/.ttss`，标签指令 `wx:for/wx:if` → `tt:for/tt:if`，漏改会编译报错。
- ⚠️ **平台特有配置分开管**：AppID、`app.json` 里的能力声明、支付/类目资质，两端各有一套，别混用。
- ⚠️ **审核规则不同**：抖音对**电商/内容/诱导**类目审核口径和微信不一样，迁移别假设"微信过了抖音就过"。
- ✅ **多端优先用框架**：新项目直接上 uni-app/Taro 写一份，平台差异用条件编译隔离，只在特色能力处分端（[16-cross-platform](../16-cross-platform/)）。
- 🔗 上一步能力/API → [10-apis](../10-apis/)、登录 → [11-login-auth](../11-login-auth/)；下一步跨端一套代码多端 → [16-cross-platform](../16-cross-platform/)；官方文档 → <https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/introduction/overview>。
