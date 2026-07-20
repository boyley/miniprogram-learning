# 14 · 云开发（Cloud Base）

> 微信官方提供的 **Serverless 后端**：不用自己搭服务器、买域名、配数据库，小程序直接调用三大件（云函数 / 云数据库 / 云存储）。适合快速开发、个人项目、中小项目、原型验证。重要度 ⭐⭐。官方：developers.weixin.qq.com/miniprogram/dev/wxcloud

## 🎯 一句话核心

云开发 = **免搭后端的 BaaS（Backend as a Service）**。把"后端服务器 + 数据库 + 文件存储 + 用户鉴权"打包成小程序里开箱即用的 API：`wx.cloud.callFunction`（云函数）、`db.collection().get()`（云数据库）、`wx.cloud.uploadFile`（云存储）。你只写业务代码，**运维、扩容、登录全交给微信**。

## 📖 核心概念 / 讲解

**云开发是什么。** 传统小程序要联网就得**自己有一套后端**：买服务器、备案域名、配 HTTPS、写接口、装数据库、做用户登录（见 [11-login-auth](../11-login-auth/)）——对个人和小团队门槛不低。**云开发（Cloud Base）** 是微信把这一整套后端能力托管到云上，小程序里 `wx.cloud.*` 直接调用，**无需服务器、无需域名备案、无需自己实现登录**。这就是业界说的 **Serverless / BaaS**：你不管服务器在哪、怎么扩容，只管写逻辑。

**三大件。** 云开发主要提供三块能力，覆盖一个后端的核心需求：

| 能力 | 对标传统后端 | 干什么 | 调用入口 |
|---|---|---|---|
| **云函数** Cloud Function | 后端接口 / 服务器 | 跑在云端的 Node.js 函数，放敏感/复杂逻辑 | `wx.cloud.callFunction` |
| **云数据库** Cloud Database | MySQL / MongoDB | 文档型数据库（类 MongoDB），存业务数据 | `db.collection('xx')` |
| **云存储** Cloud Storage | OSS / 文件服务器 | 存图片/视频/文件，返回 `fileID` | `wx.cloud.uploadFile` |

**初始化。** 用任何云能力前，先在 `app.js` 的 `onLaunch` 里 `wx.cloud.init()`（指定环境 ID `env`）。一个小程序可有多个环境（如"测试/正式"）。

```js
// app.js
App({
  onLaunch() {
    wx.cloud.init({
      env: 'my-env-id-xxxx',   // 云开发控制台里的环境 ID
      traceUser: true,         // 是否在控制台记录访问用户
    });
  },
});
```

**★ 云函数 Cloud Function（最重要）。** 一段跑在**云端**的 Node.js 代码，小程序端用 `wx.cloud.callFunction` 触发。两大价值：

- **天然免登录拿 `openid`**：云函数里 `cloud.getWXContext().OPENID` 直接拿到当前用户的 openid，**微信自动完成鉴权**，不用像传统方式那样 `wx.login` → 换 code → 请求自己的服务器换 openid（对比 [11-login-auth](../11-login-auth/) 的 code2session 流程，这里被微信包办了）。
- **敏感逻辑不暴露给前端**：小程序端代码是可被反编译看到的，密钥、扣款、判分、审核等逻辑必须放服务器——云函数就是这个"服务器"。它还能用**管理员权限**绕过数据库的前端权限限制去读写全表。

**★ 云数据库 Cloud Database。** **文档型数据库**（类 MongoDB）：数据是一条条 JSON 文档，放在**集合（collection）** 里，不像 MySQL 那样先建表定字段。链式 API：`db.collection('todos').where({done:false}).get()`。关键是**权限控制**——每条记录有个隐藏字段 `_openid`（创建者），在控制台可设"仅创建者可读写 / 所有人可读 / 仅管理端"等模式。**小程序端可直接读写数据库**（受权限约束，方便但只适合简单场景）；复杂/敏感操作走**云函数**（管理员权限，不受前端权限限制）。

**★ 云存储 Cloud Storage。** 存图片、视频、文件。`wx.cloud.uploadFile` 上传后返回一个 **`fileID`**（形如 `cloud://xxx.png`）。这个 `fileID` **可直接当 `image` 的 `src` 用**，微信会自动解析成可访问链接；也可 `wx.cloud.downloadFile` 下载、`getTempFileURL` 换成临时 https 链接。常见用法：用户上传头像 → 拿 `fileID` → 存进云数据库某条记录 → 渲染时 `<image src="{{fileID}}">`。

**优缺点。**

| | 说明 |
|---|---|
| ✅ 优点 | **免运维**（不管服务器/扩容/备案）、**开发快**（三行代码搞定后端）、**和微信登录无缝**（云函数自动拿 openid）、**免费额度**够小项目起步 |
| ⚠️ 缺点 | **绑定微信生态**（换平台/做 App 不通用）、**复杂业务/大规模受限**（文档型 DB 不擅长复杂关联查询、事务弱）、**成本**（用量上去后按调用/存储/流量计费，可能比自建贵）、**冷启动**（云函数首次调用有延迟） |

**对比传统后端（怎么选）。** 云开发是**免搭后端的 BaaS**，个人项目、原型、Demo、中小项目**首选**——省掉一整套后端和登录鉴权（[11-login-auth](../11-login-auth/)）。而**正式、复杂、需要跨端（也要做 App/H5）、大规模或已有后端团队**的项目，仍常用**自建后端**（`wx.request` 调自己的接口，见 [09-network-storage](../09-network-storage/)），自主可控、不锁死平台。两者也可混用（部分走云开发、部分走自建）。

## 💻 代码示例

**① 云函数：定义 + 小程序端调用**

云函数是独立的一个目录（在 `cloudfunctions/` 下），有自己的 `package.json` 和入口 `index.js`，写完在微信开发者工具里**右键"上传并部署"**到云端。

```js
// cloudfunctions/getProfile/index.js —— 云端 Node.js 代码
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 用当前环境

// event = 小程序端传来的参数；context = 运行上下文
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();   // ★ 免登录直接拿 openid，微信已鉴权
  const { nickname } = event;                 // 前端传的参数
  // 这里可放敏感逻辑：查库、算分、调第三方、用密钥……前端看不到
  return { openid: OPENID, hello: `你好 ${nickname}` };
};
```

```js
// 小程序页面 index.js —— 调用云函数
Page({
  onCallCloud() {
    wx.cloud.callFunction({
      name: 'getProfile',            // 云函数名（目录名）
      data: { nickname: '小明' },    // 传给云函数的 event
    }).then(res => {
      // res.result 就是云函数 return 的内容
      console.log(res.result.openid, res.result.hello);
    });
  },
});
```

**② 云数据库：小程序端读写（受权限约束）**

```js
const db = wx.cloud.database();          // 拿数据库引用
const _ = db.command;                    // 查询指令（$gt/$in 等）

// 新增一条：会自动写入隐藏字段 _openid（当前用户）+ _id
db.collection('todos').add({
  data: { title: '学云开发', done: false, createdAt: db.serverDate() },
}).then(res => console.log('新 _id：', res._id));

// 条件查询：查我未完成的、按时间倒序、取前 10 条
db.collection('todos')
  .where({ done: false })              // 相当于 SQL 的 WHERE
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get()
  .then(res => console.log(res.data)); // res.data 是数组

// 更新 / 删除（默认仅能操作自己 _openid 的记录，除非在云函数里用管理员权限）
db.collection('todos').doc('记录ID').update({ data: { done: true } });
db.collection('todos').doc('记录ID').remove();
```

> 权限：在云开发控制台给集合设"仅创建者可读写"，则前端只能动自己 `_openid` 的数据；要跨用户读写全表，就放进**云函数**（自带管理员权限，不受此限）。

**③ 云存储：上传图片 → 直接当 image src**

```js
Page({
  data: { fileID: '' },
  chooseAndUpload() {
    wx.chooseMedia({ count: 1, mediaType: ['image'] }).then(r => {
      const filePath = r.tempFiles[0].tempFilePath;
      wx.cloud.uploadFile({
        cloudPath: `avatars/${Date.now()}.png`, // 云端存储路径
        filePath,                                 // 本地临时文件
      }).then(up => {
        // up.fileID 形如 cloud://xxx.png，可直接用于 <image src>
        this.setData({ fileID: up.fileID });
        // 常见：把 fileID 存进云数据库，下次渲染直接读出来用
      });
    });
  },
});
```

```html
<!-- fileID 可直接作为 image 的 src，微信自动解析 -->
<image src="{{fileID}}" mode="aspectFill" />
```

## 🔑 要点速记

- 云开发 = 微信托管的 **Serverless / BaaS**：**免服务器、免域名备案、免自己实现登录**，`wx.cloud.*` 直接用。
- 用前先 `wx.cloud.init({ env })`（在 `app.js onLaunch`）。
- **★ 云函数**：云端 Node.js，`wx.cloud.callFunction` 调；`cloud.getWXContext().OPENID` **免登录拿 openid**；放**敏感/复杂逻辑**（前端看不到）+ 管理员权限操作数据库。
- **★ 云数据库**：文档型（类 MongoDB），`db.collection().where().get()`；隐藏字段 `_openid` 做**权限控制**；前端可直接读写（受限），复杂操作走云函数。
- **★ 云存储**：`uploadFile` 返回 **`fileID`**，可**直接当 `<image src>`**；`downloadFile` / `getTempFileURL` 取文件。
- **优**：免运维、快、和微信登录无缝、有免费额度。**缺**：绑死微信生态、复杂/大规模受限、用量大成本高、冷启动。
- 选型：个人/原型/中小项目 → **云开发**；正式/复杂/跨端/已有后端 → **自建后端**（[09-network-storage](../09-network-storage/)、[11-login-auth](../11-login-auth/)），也可混用。

## ⚠️ 易错点 / 最佳实践

- ⚠️ **敏感逻辑千万别只放小程序端**——前端代码可被看到，密钥、扣费、判分、审核必须放**云函数**。
- ⚠️ **别过度信任前端直连数据库**——一定配好集合**权限**（默认"仅创建者可读写"），否则容易被越权读写；批量/跨用户操作走云函数。
- ⚠️ **`fileID` 不是普通 URL**——它是 `cloud://` 协议，能直接给 `image`，但要给外部/浏览器用需 `wx.cloud.getTempFileURL` 换 https 临时链接。
- ⚠️ **云函数改了要"上传并部署"才生效**——它跑在云端，不是本地热更新；`package.json` 里的依赖也要一起部署。
- ⚠️ **文档型 ≠ 关系型**——没有 JOIN、事务弱，复杂关联查询会别扭；数据模型设计上倾向"冗余/内嵌"而非多表关联。
- ✅ **免登录换 openid 用云函数最省事**：省掉 `wx.login` → code2session → 自建服务器那套（对比 [11-login-auth](../11-login-auth/)）。
- ✅ **关注免费额度与计费**：调用次数、数据库读写、存储/CDN 流量都计量，上线前估算用量，避免超额扣费。
- 🔗 深入：官方云开发文档 → <https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html>；不用云开发时的联网与登录 → [09-network-storage](../09-network-storage/)、[11-login-auth](../11-login-auth/)。
