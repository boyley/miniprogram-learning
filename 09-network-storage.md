# 09 · 网络请求与本地存储（Network & Storage）

> 小程序靠 `wx.request` 发 HTTP 请求（**回调式、必须 HTTPS + 配置合法域名**），靠 `wx.setStorageSync` 等做本地存储（≈ `localStorage`）。二者一合，就是"发请求拿 token → 存 storage → 每次请求带上"的登录态闭环。重要度 ⭐⭐⭐。官方：developers.weixin.qq.com

## 🎯 一句话核心

**网络**：`wx.request` 相当于小程序版 `fetch`/`axios`，但它是**回调式**（success/fail 而非 Promise），且**上线必须走 HTTPS 且域名要在后台配置白名单**——所以实战第一步永远是"封一个 Promise 化的 request 工具"。**存储**：`wx.setStorageSync`/`getStorageSync` ≈ `localStorage`，用来存 token、用户信息、缓存。两者合起来撑起登录态维持。

## 📖 核心概念 / 讲解

**★ wx.request：发 HTTP 请求（重点）。** 小程序没有 `XMLHttpRequest`、没有 `fetch`、也没有 `axios`，唯一的 HTTP 入口就是 `wx.request`。它一次发一个请求，通过 `success`/`fail`/`complete` 三个回调返回结果——这是**回调式**风格，天然没有 Promise，所以实战里几乎人人都要自己 Promise 化。核心参数：`url`（必填）、`method`（GET/POST/PUT/DELETE…，默认 GET）、`data`（请求体/查询参数）、`header`（请求头，默认 `content-type: application/json`）、`success(res)`（`res.data` 是响应体、`res.statusCode` 是状态码）、`fail(err)`（网络层失败，如超时/断网/域名非法）。

**★ 必须 HTTPS + 合法域名（最大的坑）。** 和网页 `fetch` 随便请求任意 URL 不同，小程序**正式环境只允许请求 HTTPS 且在小程序后台"开发设置 → 服务器域名 → request 合法域名"里配置过的域名**（`http://` 一律被拒、`ws://` 走另一栏）。域名白名单每月可改次数有限、不支持 IP、不支持端口白名单外的端口。**开发阶段**可在微信开发者工具"详情 → 本地设置"里勾选 **"不校验合法域名、web-view、TLS 版本以及 HTTPS 证书"** 临时绕过，但真机/上线不生效——很多"开发好好的、真机白屏"就是忘了配域名。

**★ 请求封装（实战核心）。** 裸用 `wx.request` 会到处是回调地狱、每个页面都重复写 baseURL 和 header。工程里一定要封一个统一的 `request` 工具，职责：①拼 `baseURL`；②统一注入 `header`（尤其带 token）；③**Promise 化**（配合 `async/await`）；④统一 loading（`wx.showLoading`/`hideLoading`）；⑤统一错误处理（网络错误、业务码非 0、401 未登录）；⑥**拦截器思路**（请求前加工、响应后统一解包/报错）。这就是小程序版的"axios 实例 + 拦截器"。

**其它网络 API。** `wx.uploadFile`（上传文件，把本地临时路径 + 表单字段 POST 到服务器，常配合 `wx.chooseImage`/`chooseMedia`）；`wx.downloadFile`（下载文件到本地临时路径，再用 `previewImage`/`saveFile` 等）；`wx.connectSocket`（WebSocket，配合 `onSocketOpen`/`sendSocketMessage`/`onSocketMessage`，域名走 **socket 合法域名**栏）。上传/下载同样受合法域名约束。

**★ 本地存储 Storage。** 小程序用 `wx.setStorageSync(key, data)` / `wx.getStorageSync(key)` / `wx.removeStorageSync(key)` / `wx.clearStorageSync()` 做**同步**读写（还有对应的异步版 `wx.setStorage`/`getStorage`…带 success/fail）。它≈ 浏览器 `localStorage`，但更强：**能直接存对象/数组/布尔/数字**（内部帮你序列化，取出来还是原类型，不用手动 `JSON.stringify`）。限制：**单个 key ≤ 1MB，单个小程序总上限 ≤ 10MB**，超了会 `fail`。用途：存 token、用户信息、缓存的接口数据、草稿等。

**★ 登录态维持（实战闭环）。** 小程序没有 Cookie 自动带、没有浏览器 Session，登录态**全靠自己维护**：登录接口成功后拿到后端返的 `token` → `wx.setStorageSync('token', token)` 存起来 → 之后**每次请求在 `header` 里带上 `Authorization`（或自定义头）** → 后端校验 token；一旦返回 **401**（token 过期/无效），在 request 工具里统一拦截：清掉本地 token → 跳登录页重新走登录。这套完整流程见 [11-login-auth.md](11-login-auth.md)。

**和 Web 的对照（有基础对照记）：**

| 维度 | Web / H5 | 小程序 |
|---|---|---|
| 发请求 | `fetch` / `axios`（Promise） | **`wx.request`（回调式）**，要自己 Promise 化 |
| 域名限制 | 任意 URL（受 CORS） | **必须 HTTPS + 后台白名单**，开发可勾"不校验" |
| 上传/下载 | `FormData` / `<a download>` | `wx.uploadFile` / `wx.downloadFile` |
| WebSocket | `new WebSocket()` | `wx.connectSocket`（socket 合法域名） |
| 本地存储 | `localStorage`（只存字符串） | `wx.setStorageSync`（**直接存对象**，单 key≤1MB/总≤10MB） |
| 登录态 | Cookie/Session 自动带 | **手动**：token 存 storage + 每次 header 带上 |

## 💻 代码示例

**① 裸用 wx.request（先看回调式长什么样）：**

```js
wx.request({
  url: 'https://api.example.com/user/info',  // 必须 https + 已配合法域名
  method: 'GET',
  data: { id: 1 },                            // GET 会拼成 ?id=1
  header: { 'content-type': 'application/json' },
  success(res) {
    // res.statusCode 状态码；res.data 响应体（已按 content-type 自动解析）
    console.log(res.statusCode, res.data);
  },
  fail(err) {
    // 网络层失败：超时/断网/域名非法才会进这里（业务错误码要自己在 success 里判）
    console.error('请求失败', err);
  },
  complete() { /* 成功失败都会走，适合收尾 */ }
});
```

**② 请求封装（实战核心：baseURL + token + Promise 化 + loading + 拦截）——`utils/request.js`：**

```js
// utils/request.js
const BASE_URL = 'https://api.example.com';   // 统一 baseURL

function request(options) {
  return new Promise((resolve, reject) => {
    // —— 请求拦截：统一加工 ——
    if (options.loading !== false) {
      wx.showLoading({ title: '加载中', mask: true });
    }
    const token = wx.getStorageSync('token');  // 从 storage 取 token

    wx.request({
      url: BASE_URL + options.url,             // 拼 baseURL
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        // 有 token 就带上（后端据此识别登录态）
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...options.header,
      },
      // —— 响应拦截：统一解包/错误处理 ——
      success(res) {
        const { statusCode, data } = res;

        // 401：登录态失效 → 清 token + 跳登录（呼应 11-login-auth.md）
        if (statusCode === 401) {
          wx.removeStorageSync('token');
          wx.showToast({ title: '登录已过期', icon: 'none' });
          wx.navigateTo({ url: '/pages/login/login' });
          return reject(res);
        }

        // HTTP 层非 2xx
        if (statusCode < 200 || statusCode >= 300) {
          wx.showToast({ title: '服务异常(' + statusCode + ')', icon: 'none' });
          return reject(res);
        }

        // 业务码约定：{ code, message, data }，code!==0 视为业务错误
        if (data.code !== undefined && data.code !== 0) {
          wx.showToast({ title: data.message || '请求出错', icon: 'none' });
          return reject(data);
        }

        resolve(data.data !== undefined ? data.data : data);  // 解包返回业务数据
      },
      fail(err) {
        wx.showToast({ title: '网络异常，请重试', icon: 'none' });
        reject(err);
      },
      complete() {
        if (options.loading !== false) wx.hideLoading();
      },
    });
  });
}

// 语法糖：get / post
const http = {
  get: (url, data, opt) => request({ url, method: 'GET', data, ...opt }),
  post: (url, data, opt) => request({ url, method: 'POST', data, ...opt }),
};

module.exports = { request, http };
```

**③ 页面里用（配合 async/await，像 axios 一样清爽）：**

```js
// pages/user/user.js
const { http } = require('../../utils/request.js');

Page({
  data: { user: null },
  async onLoad() {
    try {
      const user = await http.get('/user/info', { id: 1 });  // 自动带 token
      this.setData({ user });                                // 拿到数据再 setData
    } catch (e) {
      console.error('加载失败', e);   // 错误已统一 toast，这里只兜底
    }
  },
});
```

**④ 本地存储 Storage：**

```js
// 存（可直接存对象/数组，无需 JSON.stringify）
wx.setStorageSync('token', 'abc123');
wx.setStorageSync('userInfo', { id: 1, name: '小明', vip: true });

// 取（取出来还是原类型；key 不存在返回 ''）
const token = wx.getStorageSync('token');        // 'abc123'
const user  = wx.getStorageSync('userInfo');     // { id:1, name:'小明', vip:true }

// 删 / 清空
wx.removeStorageSync('token');
// wx.clearStorageSync();                         // 清空全部（慎用）

// 异步版（不阻塞，适合大数据）
wx.setStorage({ key: 'draft', data: { text: '草稿' },
  success() { console.log('已存'); } });
wx.getStorage({ key: 'draft', success(res) { console.log(res.data); } });
```

**⑤ 登录态闭环（存 token → 带 token → 401 重登，串起来）：**

```js
// 登录成功后：拿 token 存 storage
async function login(code) {
  const { token } = await http.post('/login', { code });  // 后端换 token
  wx.setStorageSync('token', token);                      // 存起来
}
// 之后每次 http.get/post 会自动从 storage 读 token 塞进 header；
// token 过期后端返 401 → request 工具里已统一清 token + 跳登录页。
// 完整登录流程（wx.login/code2session/getUserProfile）见 11-login-auth.md
```

## 🔑 要点速记

- **`wx.request`** 是唯一 HTTP 入口，**回调式**（success/fail/complete），无 Promise，要自己封。
- 参数：`url`(必填) / `method`(默认 GET) / `data` / `header` / `success(res)` / `fail`；`res.data` 是响应体、`res.statusCode` 是状态码。
- **上线必须 HTTPS + 后台配"合法域名"白名单**；开发可在工具里勾**"不校验合法域名…"**临时绕过（真机不生效）。
- **★ 封 request 工具**：baseURL + header 带 token + Promise 化 + loading + 统一错误/401 拦截 ≈ axios 实例+拦截器。
- 其它：`wx.uploadFile`（上传）/ `wx.downloadFile`（下载）/ `wx.connectSocket`（WebSocket，走 socket 合法域名）。
- **Storage**：`setStorageSync`/`getStorageSync`/`removeStorageSync`（同步）+ 异步版；**能直接存对象**，单 key ≤1MB、总 ≤10MB。
- **登录态**：token 存 storage → 每次请求 header 带上 → 401 清 token 跳登录（详见 [11-login-auth.md](11-login-auth.md)）。
- 对照 Web：`wx.request`≈`fetch`/`axios`（但回调式+要配域名）、storage≈`localStorage`（但能存对象、有容量限制）。

## ⚠️ 易错点 / 最佳实践

- ⚠️ **忘配合法域名 → 真机请求失败/白屏**：开发者工具好用不代表上线好用；上线前务必去小程序后台配 request/socket/upload/download 各栏域名。
- ⚠️ **`fail` 只在网络层失败时触发**：HTTP 200 但业务 `code!==0`、或状态码 4xx/5xx 都走 `success`，业务错误要自己在 `success` 里判（封装里已处理）。
- ⚠️ **别在每个页面裸写 `wx.request`**：一定封统一工具，否则 token/baseURL/错误处理到处重复、难维护。
- ⚠️ **同步 Storage 会阻塞**：`getStorageSync` 简单快，但存大数据/频繁读写用异步版，避免卡 UI 线程。
- ⚠️ **Storage 不是加密的**：token 明文存在本地，敏感数据别裸存；容量超 10MB 会 `fail`，缓存要定期清理。
- ✅ **`content-type` 大小写敏感坑**：小程序里请求头习惯用小写 `content-type`；POST JSON 时确保它是 `application/json`，否则后端可能收不到 body。
- ✅ **Promise 化 + `async/await`** 让异步代码线性可读；配合 `try/catch` 兜底，错误提示统一在拦截器里 `toast`。
- 🔗 下一步：常用 API → [10-apis.md](10-apis.md)；登录授权完整流程 → [11-login-auth.md](11-login-auth.md)；官方：<https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html>。
