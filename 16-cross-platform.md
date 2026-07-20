# 16 · 跨端框架 uni-app / Taro（Cross-Platform）

> 微信/抖音/支付宝…各写一套小程序成本太高；跨端框架让你**一套代码编译到多端**（多小程序 + H5 + App）。uni-app 用 Vue 语法、Taro 用 React 语法，编译时把统一语法/API **转译**成各平台原生小程序代码。重要度 ⭐⭐⭐。官方：uniapp.dcloud.net.cn / taro.jd.com

## 🎯 一句话核心

跨端框架的本质是**一层编译器 + 一层运行时适配层**：你用熟悉的 **Vue（uni-app）或 React（Taro）** 写一套代码，框架在**编译时**把它转译成微信/抖音/支付宝小程序 + H5 + App 各自的原生代码，用 `uni.*` / `Taro.*` 统一 API 屏蔽 `wx.*`/`tt.*` 的差异。**多端覆盖省成本、复用 Vue/React 技能**是它的核心价值。

## 📖 核心概念 / 讲解

**★ 为什么要跨端。** 前面 [01-overview-architecture](01-overview-architecture.md) 讲过，微信、抖音（[15-douyin](15-douyin.md)）、支付宝、百度、快手各有一套小程序，语法**大同小异但不通用**：微信用 `wx.request`、抖音用 `tt.request`，标签/生命周期也有差别。业务要同时上多个平台，用原生就得**维护 N 套代码**，改一个需求改 N 遍，成本爆炸。跨端框架的答案是：**写一套，编译到多端**——目标端不仅是各家小程序，还包括 **H5 网页**和 **Android/iOS App**（这一点是原生小程序做不到的）。

**★ uni-app（重点）。** **DCloud** 出品，基于 **Vue 语法**（Vue 2/3 都支持）。你写标准的 **Vue 单文件组件**（`.vue`，`<template>`/`<script>`/`<style>`），框架编译到微信/抖音/支付宝/百度/快手等**小程序 + H5 + Android/iOS App**。API 用统一的 **`uni.*`**（如 `uni.request`、`uni.navigateTo`、`uni.setStorage`），编译时映射到各端的 `wx.*`/`tt.*`。配套 IDE 是 **HBuilderX**（也可用 CLI + VSCode），有庞大的**插件市场**。**Vue 技术栈团队首选**——模板语法、指令、组件写法几乎零学习成本。

**★ Taro（重点）。** **京东**出品，主打 **React 语法**（`JSX` + Hooks），也支持 Vue。你用 React 的写法写组件，Taro 编译到微信/抖音/支付宝小程序 + H5 + React Native App。API 用统一的 **`Taro.*`**（如 `Taro.request`、`Taro.navigateTo`）。**React 技术栈团队首选**——JSX、Hooks、状态管理（Redux/MobX）全能复用。

**★ 原理（面试常问）。** 跨端框架不是运行时"翻译"，而是**编译时转译 + 运行时适配**两层：

- **编译时（Compile）**：用 **AST（抽象语法树）转换**把你的 Vue/React 组件、模板、样式**转译**成各平台的**原生小程序代码**——`.vue`/`.jsx` → 目标端的 `.wxml`/`.wxss`/`.js`/`.json`（微信）或 `.ttml`/`.ttss`（抖音）。模板语法映射：`v-if`→`wx:if`、`v-for`→`wx:for`、`@tap`→`bindtap`。
- **运行时（Runtime）**：一层**适配层**在运行时抹平差异——把 `uni.*`/`Taro.*` 的调用**桥接**到当前平台真实的 `wx.*`/`tt.*`；组件（`<view>`/`<text>`）、生命周期也由运行时映射到宿主小程序的对应能力。
- **条件编译（Conditional Compile）**：处理无法统一的**平台差异**——用特殊注释标记"这段只在某端生效"，编译时按目标端裁剪。这是跨端的"逃生舱"。

```
        一套代码 (Vue / React)
                │
        ┌───────┴────────┐
        │   编译器        │  AST 转换：v-if→wx:if / @tap→bindtap
        │  (Compile)      │  条件编译裁剪平台差异
        └───────┬────────┘
     ┌──────┬───┼────┬──────┬──────┐
   微信    抖音  支付宝  H5   Android iOS
  wxml    ttml  axml  html   ← 各端原生产物
     └──────┴───┴────┴──────┴──────┘
        运行时适配层：uni.*/Taro.* → wx.*/tt.*
```

**★ 跨端 vs 原生的取舍（重点面试题）。** 不是"跨端一定好"，要看场景：

| 维度 | 跨端（uni-app/Taro） | 原生（wx./tt.） |
|---|---|---|
| 开发成本 | ✅ **一套代码多端**，改一次全端生效 | ❌ 每端一套，维护 N 倍 |
| 技能复用 | ✅ 直接用 **Vue/React** 技能栈 | 要学各端原生语法 |
| 覆盖面 | ✅ 多小程序 + **H5 + App** | ❌ 仅单一小程序平台 |
| 性能 | ⚠️ 多一层转译/适配，**略有损耗** | ✅ 直接原生，性能最优 |
| 平台特有能力 | ⚠️ 要靠**条件编译**单独处理 | ✅ 原生直接调，最全 |
| 跟进新特性 | ⚠️ 依赖框架更新，**可能滞后** | ✅ 第一时间用平台最新特性 |
| 踩坑 | ⚠️ 会踩**框架自身的坑**（编译产物、兼容性） | ✅ 只面对平台本身的问题 |

**一句话决策：深度依赖单平台特性 / 追求极致性能 → 原生；要多端覆盖 / 团队是 Vue-React 栈 → 跨端。**

**uni-app vs Taro 怎么选。** 核心看**团队技术栈**：**会 Vue 用 uni-app、会 React 用 Taro**。uni-app 生态/插件市场更成熟、App 端能力（原生渲染 nvue）更强；Taro 对 React 生态（Hooks/TypeScript/Redux）拥抱更彻底。技术栈匹配是第一决策因素，不必纠结孰优孰劣。

## 💻 代码示例

**uni-app（Vue 语法）** —— 和写 Vue 页面几乎一样，只是标签用 `<view>`/`<text>`、API 用 `uni.*`：

```vue
<!-- pages/index/index.vue -->
<template>
  <!-- v-for/@tap 编译到微信会变成 wx:for/bindtap -->
  <view class="box">
    <text>{{ msg }}</text>
    <button @tap="onTap">点我</button>
  </view>
</template>

<script>
export default {
  data() {
    return { msg: '你好，uni-app' };   // 和 Vue 一样的 data
  },
  methods: {
    onTap() {
      this.msg = '点击了！';           // ✅ Vue 响应式，无需手动 setData
      uni.request({                    // 统一 API：编译到微信=wx.request，抖音=tt.request
        url: 'https://api.example.com/data',
        success: (res) => console.log(res.data),
      });
    },
  },
};
</script>

<style>
.box { padding: 20rpx; font-size: 32rpx; } /* rpx 各端通用 */
</style>
```

**Taro（React 语法）** —— JSX + Hooks，写法就是 React：

```jsx
// src/pages/index/index.jsx
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';

export default function Index() {
  const [msg, setMsg] = useState('你好，Taro');
  const onTap = () => {
    setMsg('点击了！');                 // React 状态，自动更新
    Taro.request({                      // 统一 API → 各端 wx./tt.
      url: 'https://api.example.com/data',
      success: (res) => console.log(res.data),
    });
  };
  return (
    <View className="box">
      <Text>{msg}</Text>
      <Button onClick={onTap}>点我</Button>
    </View>
  );
}
```

**条件编译（Conditional Compile）** —— 处理平台差异的"逃生舱"：

```js
// uni-app：用 #ifdef / #endif 注释包裹，只在指定端编译进去
// #ifdef MP-WEIXIN
uni.login();               // 这段只在【微信小程序】生效
// #endif

// #ifdef H5
console.log('只在 H5 端跑'); // 这段只在【H5】生效
// #endif

// #ifndef MP-ALIPAY
// 除【支付宝小程序】外的所有端都编译这段
// #endif
```

```jsx
// Taro：用环境变量 process.env.TARO_ENV 判断当前目标端
if (process.env.TARO_ENV === 'weapp') {
  // 只在微信小程序执行
} else if (process.env.TARO_ENV === 'h5') {
  // 只在 H5 执行
}
```

> `MP-WEIXIN`=微信小程序、`MP-TOUTIAO`=抖音、`MP-ALIPAY`=支付宝、`H5`=网页、`APP-PLUS`=App。这些平台标识让你在"一套代码"里精准区分各端。

## 🔑 要点速记

- **跨端 = 一套代码编译到多端**：多小程序（微信/抖音/支付宝…）+ H5 + Android/iOS App，省下 N 套维护成本。
- **★ uni-app**：DCloud 出品，**Vue 语法**，写 `.vue` 单文件组件，API 用 **`uni.*`**，IDE 是 HBuilderX。**Vue 栈选它**。
- **★ Taro**：京东出品，**React 语法**（也支持 Vue），API 用 **`Taro.*`**。**React 栈选它**。
- **★ 原理 = 编译时转译 + 运行时适配**：AST 把 Vue/React 转成各端原生小程序代码（`v-if`→`wx:if`），运行时把 `uni.*`/`Taro.*` 桥接到 `wx.*`/`tt.*`。
- **条件编译**处理平台差异：uni-app 用 `#ifdef MP-WEIXIN`、Taro 用 `process.env.TARO_ENV`。
- **取舍**：跨端省成本/复用技能/多端覆盖，但**性能略损、平台特性要条件编译、可能踩框架坑/跟不上新特性**。
- **选型**：深度依赖单平台/极致性能→**原生**；多端覆盖/Vue-React 栈→**跨端**；会 Vue→**uni-app**，会 React→**Taro**。

## ⚠️ 易错点 / 最佳实践

- ⚠️ **别以为跨端零成本**——各端仍有差异（UI、API 支持度、审核），"一套代码"后还需**逐端真机测试**，不能只在一端跑通就上线。
- ⚠️ **平台特有能力要条件编译**——微信登录、抖音特有接口等无法统一，别指望 `uni.*`/`Taro.*` 全覆盖；用 `#ifdef`/`TARO_ENV` 单独写。
- ⚠️ **性能敏感场景慎用**——长列表、复杂动画、高频交互，跨端多一层适配可能卡顿；极致性能场景考虑原生或原生渲染（uni-app 的 nvue）。
- ⚠️ **框架/新特性滞后**——平台出了新能力，框架可能没跟上；深度依赖某端最新特性时，跨端会拖后腿。
- ✅ **技术栈决定选型**：Vue 团队 uni-app、React 团队 Taro，别逆着技术栈选，学习成本会吃掉跨端省下的成本。
- ✅ **先想清楚要不要跨端**：只上微信一个平台、且要极致性能/深用微信能力 → 直接原生（[01-overview-architecture](01-overview-architecture.md)）更省心；要覆盖微信+抖音+H5+App → 跨端才划算。
- 🔗 官方文档：uni-app <https://uniapp.dcloud.net.cn/>、Taro <https://taro.jd.com/>；上一站抖音小程序 → [15-douyin](15-douyin.md)。
