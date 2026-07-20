# 10 · 常用 API 与能力（Common APIs）

> 小程序把"访问系统能力"收口成一套受限的 `wx.*` API：弹窗、跳转、定位、扫码、相册、分享……都走它。核心要记两件事：**多数是回调式（success/fail/complete），可 Promise 化**；**涉及隐私的能力要先授权，还要处理"用户拒绝"**。重要度 ⭐⭐。官方：developers.weixin.qq.com

## 🎯 一句话核心

浏览器里你直接 `navigator.geolocation`、`alert()`、`<input type=file>` 就能用；小程序里这些统统换成 **`wx.xxx({ success, fail })`**——能力受平台管控、**需授权的先申请**、**拒绝了要引导用户去设置页**。API 长得像 jQuery Ajax 时代的回调，现代写法用 `await` Promise 化。

## 📖 核心概念 / 讲解

**★ API 的统一风格（务必先理解）。** 绝大多数 `wx.*` API 都是同一个"回调对象"形状：

```js
wx.someApi({
  // 业务参数（各 API 不同）
  key: 'value',
  success(res) { /* 成功回调，res 里是结果 */ },
  fail(err)    { /* 失败/被拒回调 */ },
  complete()   { /* 无论成败都执行（收尾） */ },
});
```

这和 Web 的 `fetch().then()` 不同——它是**回调式**，不是原生 Promise。好在**大部分 `wx.*` 在不传 `success/fail/complete` 时会返回 Promise**，可直接 `await`（下面示例演示）。少数同步 API 以 `Sync` 结尾（如 `wx.getSystemInfoSync`），直接返回值、可能抛异常。

**★ 能力分两类：免授权 vs 需授权。** 弹窗、跳转、剪贴板、扫码这类**不碰用户隐私**的 API 调了就用；而**定位、相册、麦克风、摄像头**等涉及隐私的能力，微信要求**用户授权**，且要在 `app.json` 里声明用途（`permission` 字段）。授权只弹一次——用户点了"拒绝"后，再调 `wx.authorize` **不会再弹窗**、直接 `fail`，只能引导用户去**设置页**手动打开（见下方权限流程）。

**和 H5 的关键区别（对照记）：**

| 能力 | H5 / 浏览器 | 小程序 |
|---|---|---|
| 弹窗 | `alert` / `confirm` | `wx.showModal` / `showToast` |
| 页面跳转 | `location.href` / router | `wx.navigateTo`（[08-routing-lifecycle](../08-routing-lifecycle/)） |
| 定位 | `navigator.geolocation` | `wx.getLocation`（需授权+配置） |
| 选文件/拍照 | `<input type=file>` | `wx.chooseMedia` / `chooseImage` |
| 剪贴板 | `navigator.clipboard` | `wx.setClipboardData` |
| 授权模型 | 浏览器弹权限、可反复问 | **一次性授权**，拒绝后只能去设置页 |

**★ 权限与授权流程（三步固定套路）。**

```
① wx.getSetting  →  查 authSetting['scope.xxx'] 当前授权状态
        │
        ├─ 已授权(true)   → 直接调用能力 API
        ├─ 未问过(undefined) → 直接调 wx.getLocation 等（会自动弹授权框）
        └─ 已拒绝(false)  → wx.showModal 说明 → wx.openSetting 让用户手动开
                                                    │
                              用户在设置页打开后 ────┘→ 再调用能力 API
```

关键点：**不要一上来就 `wx.authorize` 轰炸用户**；能力 API（如 `wx.getLocation`）首次调用本身就会触发授权框。真正需要 `getSetting`/`openSetting` 的场景，是**判断是否曾被拒绝**、以及**拒绝后的补救引导**。登录/`getUserProfile`/手机号等授权细节见 [11-login-auth](../11-login-auth/)。

## 💻 代码示例

### 1）界面交互：Toast / Modal / Loading / ActionSheet

```js
// 轻提示（1.5s 自动消失）——最常用
wx.showToast({ title: '保存成功', icon: 'success' }); // icon: success/error/none/loading

// 确认对话框（回调式，也可 await 版见下）
wx.showModal({
  title: '提示', content: '确定删除吗？',
  success(res) {
    if (res.confirm) { /* 点了确定 */ }
    else if (res.cancel) { /* 点了取消 */ }
  },
});

// 加载中：show 和 hide 必须成对
wx.showLoading({ title: '加载中', mask: true }); // mask 防止误触
// ...异步完成后
wx.hideLoading();

// 底部菜单
wx.showActionSheet({
  itemList: ['拍照', '从相册选择'],
  success(res) { console.log('点了第', res.tapIndex, '项'); },
});
```

### 2）Promise 化：用 async/await 写更顺（推荐）

```js
// 大多数 wx.* 不传 success/fail 即返回 Promise
async function onDelete() {
  const res = await wx.showModal({ title: '提示', content: '确定删除？' });
  if (!res.confirm) return;               // 用户取消
  wx.showLoading({ title: '删除中' });
  try {
    await deleteApi();                     // 你的业务请求（见 09-network-storage）
    wx.showToast({ title: '已删除', icon: 'success' });
  } catch (e) {
    wx.showToast({ title: '失败了', icon: 'error' });
  } finally {
    wx.hideLoading();                      // 无论成败都收尾
  }
}
```

### 3）设备能力：定位 / 扫码 / 拨号 / 震动 / 系统信息

```js
// 定位：需授权 + app.json 声明用途（见下方 app.json）
wx.getLocation({
  type: 'gcj02', // 坐标系；用于地图选 gcj02
  success(res) { console.log(res.latitude, res.longitude); },
  fail(err) { console.log('定位失败或被拒', err); },
});

// 扫码（免授权，会打开扫码界面）
wx.scanCode({ success(res) { console.log('扫到：', res.result); } });

// 拨打电话（拉起系统拨号盘）
wx.makePhoneCall({ phoneNumber: '10086' });

// 短震动（反馈手感）
wx.vibrateShort({ type: 'medium' });

// 系统/设备信息（同步版直接返回；新版推荐 getDeviceInfo/getWindowInfo 拆分 API）
const info = wx.getSystemInfoSync();
console.log(info.platform, info.windowWidth, info.safeArea);
```

### 4）媒体：选图 / 选媒体 / 预览 / 存相册

```js
// 选图片（chooseImage 老 API，仍常用）
wx.chooseImage({
  count: 3, sizeType: ['compressed'], sourceType: ['album', 'camera'],
  success(res) { console.log(res.tempFilePaths); }, // 临时路径，需上传后端持久化
});

// chooseMedia：新版统一图片+视频（推荐）
wx.chooseMedia({
  count: 1, mediaType: ['image', 'video'], sourceType: ['album', 'camera'],
  success(res) { console.log(res.tempFiles[0].tempFilePath); },
});

// 预览大图（点击缩略图放大）
wx.previewImage({ current: url, urls: [url1, url2, url3] });

// 保存图片到相册（需授权 scope.writePhotosAlbum）
wx.saveImageToPhotosAlbum({ filePath: localPath });
```

### 5）分享：转发好友 / 分享朋友圈

```js
// 页面 Page 内定义，不是 wx.* 调用，而是生命周期钩子
Page({
  // 右上角"转发给好友"/ button open-type="share" 触发
  onShareAppMessage() {
    return { title: '快来看看', path: '/pages/detail/detail?id=1', imageUrl: '/img/share.png' };
  },
  // 分享到朋友圈（需在后台开启该能力）
  onShareTimeline() {
    return { title: '朋友圈标题', query: 'id=1' };
  },
});
```

### 6）剪贴板 / 文件系统

```js
// 复制到剪贴板（复制邀请码、订单号常用）——免授权
wx.setClipboardData({
  data: 'INVITE-8888',
  success() { wx.showToast({ title: '已复制' }); }, // 微信会自动提示"已复制"
});
wx.getClipboardData({ success(res) { console.log(res.data); } });

// 文件系统：临时文件（如 chooseImage 得到的路径）用完即清；
// 需长期保存用 FileSystemManager，saveFile/写入 usr 目录（有配额上限）。
const fs = wx.getFileSystemManager();
fs.saveFile({ tempFilePath, success(res) { console.log(res.savedFilePath); } });
```

### 7）★ 授权处理完整套路：getSetting → authorize → openSetting

```js
// 目标：安全地拿定位；处理"从未授权 / 已拒绝"两种情况
async function useLocation() {
  const { authSetting } = await wx.getSetting();
  const status = authSetting['scope.userLocation'];

  if (status === false) {
    // 曾被拒绝：再调 getLocation 也不会弹框 → 引导去设置页
    const modal = await wx.showModal({
      title: '需要定位权限', content: '请在设置中打开"位置"权限', confirmText: '去设置',
    });
    if (!modal.confirm) return;
    const setRes = await wx.openSetting();          // 打开权限设置页
    if (!setRes.authSetting['scope.userLocation']) return; // 仍未开
  }

  // 未问过(undefined) 或 已授权(true)：直接调用（未问过会自动弹框）
  try {
    const loc = await wx.getLocation({ type: 'gcj02' });
    console.log(loc.latitude, loc.longitude);
  } catch (e) {
    wx.showToast({ title: '定位失败', icon: 'none' });
  }
}
```

### 8）配套 app.json：需授权能力要声明用途

```json
{
  "permission": {
    "scope.userLocation": {
      "desc": "用于展示你附近的门店"
    }
  },
  "requiredPrivateInfos": ["getLocation"]
}
```

> 定位类 API 从基础库某版本起还需在 `requiredPrivateInfos` 里声明，否则调用直接失败。相册写入对应 `scope.writePhotosAlbum`，麦克风 `scope.record` 等。

## 🔑 要点速记

- **统一形状**：`wx.api({ 业务参数, success, fail, complete })`；不传回调则返回 **Promise**，可 `await`。
- **同步 API** 以 `Sync` 结尾（`getSystemInfoSync`），直接返回值、可能抛异常。
- **界面交互**：`showToast`（轻提示）/`showModal`（确认框）/`showLoading`+`hideLoading`（成对）/`showActionSheet`。跳转看 [08-routing-lifecycle](../08-routing-lifecycle/)。
- **设备**：`getLocation`（授权+配置）、`scanCode`、`makePhoneCall`、`vibrateShort`、`getSystemInfo(Sync)`。
- **媒体**：`chooseMedia`（新，图+视频）/`chooseImage`（旧）/`previewImage`/`saveImageToPhotosAlbum`；拿到的是**临时路径**，要上传后端才持久。
- **分享**：`onShareAppMessage`（转发好友）/`onShareTimeline`（朋友圈）是**页面钩子**，不是 `wx.*`。
- **剪贴板** `setClipboardData`；文件长期存用 `getFileSystemManager`（有配额）。
- **授权三步**：`getSetting` 查 → 首次调能力 API 自动弹框 → **拒绝后 `openSetting`** 引导，不能反复弹。授权登录细节见 [11-login-auth](../11-login-auth/)。

## ⚠️ 易错点 / 最佳实践

- ⚠️ **别把回调当 Promise 混用**：既传了 `success` 又 `await`，回调会跑但 `await` 拿不到值。要么全回调、要么全 `await`（不传回调）。
- ⚠️ **`showLoading` / `hideLoading` 必须成对**，且 loading 期间不能被 `showToast` 顶掉；异步失败也要在 `finally` 里 `hideLoading`，否则界面卡住转圈。
- ⚠️ **授权被拒后再调 `wx.authorize` 不弹框**——直接 `fail`。正确补救是 `showModal` 说明 + `openSetting`，绝不能循环调 authorize。
- ⚠️ **定位/相册等要在 `app.json` 声明用途**（`permission.desc`、`requiredPrivateInfos`），漏了新版基础库直接调用失败。
- ⚠️ **`chooseImage`/`chooseMedia` 拿到的是临时文件路径**，小程序重启后失效；要么立刻上传后端，要么 `saveFile` 持久化。
- ✅ **优先用新 API**：`chooseMedia` 替代 `chooseImage`、`getDeviceInfo`/`getWindowInfo` 替代重型的 `getSystemInfo`。
- ✅ **封装一层 `promisify` 或统一 `request` 工具**，把 `showLoading`、错误 `showToast` 收口，页面代码更干净（配合 [09-network-storage](../09-network-storage/) 的请求封装）。
- 🔗 授权登录（`wx.login`→code→openid、`getUserProfile`、手机号）→ [11-login-auth](../11-login-auth/)；官方 API 索引 → <https://developers.weixin.qq.com/miniprogram/dev/api/>。
