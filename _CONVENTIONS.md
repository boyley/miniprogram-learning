# 小程序开发学习合集 · 统一规范（所有 sub-agent 必须遵守）

> 面向零基础/有 Web 基础的开发者，系统学**微信小程序（主线）+ 抖音/字节小程序 + 跨端(uni-app/Taro)**。概念讲清 + 代码可跑。
> 权威对标：**微信官方文档 [developers.weixin.qq.com/miniprogram](https://developers.weixin.qq.com/miniprogram/dev/framework/)** + 抖音开放平台 + uni-app/Taro 官方。

## 一、目录结构（扁平编号）

```
miniprogram-learning/
├── README.md          ← 总览 + 全景 + 学习路线 + 进度
├── _CONVENTIONS.md    ← 本文件
├── 01-xxx.md          ← 一个知识点一个 md（两位数字 + kebab-case 英文）
└── ...
```

## 二、每个知识点 md 固定结构

```markdown
# NN · 知识点中文名（English Name）

> 一句话核心 + 重要度（⭐⭐⭐ 核心 / ⭐⭐ 重要 / ⭐ 了解）+（可选）官方出处。

## 🎯 一句话核心
## 📖 核心概念 / 讲解
（讲清是什么/为什么/怎么用，面向有 Web 基础者，多对比 H5/Vue。2~5 段。）
## 💻 代码示例
（WXML/WXSS/JS 或 API 代码，可运行片段、带中文注释；必要处给页面四文件结构。）
## 🔑 要点速记
## ⚠️ 易错点 / 最佳实践
```

## 三、内容语言与质量底线

- 讲解中文；标识符/API/关键字英文（如 `setData`、`wx.request`、`rpx`、`wx:for`）。
- 代码准确可用：以**微信小程序原生**为主线；涉及 `Component`/`Page`/`App` 构造器、`wx.*` API 用真实签名。
- **面向 Web 开发者**：多对比"和 Vue/H5 的异同"（如 WXML≈模板、setData≈响应式但要手动、rpx≈响应式单位、双线程架构 vs 浏览器单线程）。
- 抖音小程序讲"和微信的异同 + tt API"；跨端讲 uni-app/Taro"一套代码多端"的原理与取舍。
- 相关知识点相对链接互引；深入链官方文档。

## 四、覆盖主线

小程序全景与架构 → 项目结构配置 → WXML → WXSS → 逻辑层/setData → 事件 → 组件化 → 路由生命周期 → 网络/存储 → 常用 API → 登录授权 → 支付 → 分包性能 → 云开发 → 抖音小程序 → 跨端 uni-app/Taro → 发布上线。
