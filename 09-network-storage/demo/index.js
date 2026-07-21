// 09 网络请求 + 本地存储演示
// 注意：wx.request 在开发者工具里需勾选
// 「详情 → 本地设置 → 不校验合法域名、web-view、TLS 版本以及 HTTPS 证书」，
// 否则请求会因域名未配置白名单而 fail（真机/上线则需在小程序后台配合法域名）。

// storage 用到的 key，统一常量管理，避免拼写不一致
const STORAGE_KEY = 'demo_text';
const TOKEN_KEY = 'token';

Page({
  data: {
    result: '',        // wx.request 返回数据（JSON 字符串，方便展示）
    input: '',         // 输入框内容
    storageValue: '',  // 读取到的 storage 值
    token: '',         // 当前登录态 token
  },

  // 页面加载时：回显已存的 token，体现登录态是持久化在 storage 里的
  onLoad() {
    const token = wx.getStorageSync(TOKEN_KEY);
    if (token) this.setData({ token });
  },

  // ==================== 一、网络请求 ====================
  onRequest() {
    // 1) 打开 loading，遮罩防止用户重复点
    wx.showLoading({ title: '加载中', mask: true });

    // 2) 每次请求都从 storage 取 token，有就塞进 header（登录态思路）
    const token = wx.getStorageSync(TOKEN_KEY);

    wx.request({
      url: 'https://jsonplaceholder.typicode.com/todos/1', // 公开测试 API（HTTPS）
      method: 'GET',
      data: {}, // GET 的 data 会拼成 query string
      header: {
        'content-type': 'application/json',
        // 有 token 就带上，后端据此识别登录态；无 token 则不加这个头
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      // success：网络层成功就会进来（注意 4xx/5xx 也算 success，需自己判 statusCode）
      success: (res) => {
        console.log('statusCode:', res.statusCode, 'data:', res.data);
        // 把返回对象格式化成字符串再 setData 显示
        this.setData({
          result: JSON.stringify(res.data, null, 2),
        });
        wx.showToast({ title: '请求成功', icon: 'success' });
      },
      // fail：只有网络层失败（超时/断网/域名非法）才会进来
      fail: (err) => {
        console.error('请求失败', err);
        wx.showToast({ title: '请求失败，检查域名校验设置', icon: 'none' });
      },
      // complete：成功失败都会走，适合收尾（关 loading）
      complete: () => {
        wx.hideLoading();
      },
    });
  },

  // ==================== 二、本地存储 ====================
  // 输入框输入事件：同步到 data.input
  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  // 保存：wx.setStorageSync(key, data)，能直接存字符串/对象/数组
  onSave() {
    if (!this.data.input) {
      wx.showToast({ title: '请先输入内容', icon: 'none' });
      return;
    }
    wx.setStorageSync(STORAGE_KEY, this.data.input);
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  // 读取：wx.getStorageSync(key)，key 不存在时返回空字符串 ''
  onRead() {
    const value = wx.getStorageSync(STORAGE_KEY);
    if (value === '') {
      wx.showToast({ title: '暂无数据', icon: 'none' });
    }
    this.setData({ storageValue: value });
  },

  // 清除：wx.removeStorageSync(key) 删单个 key
  // （wx.clearStorageSync() 会清空全部，慎用）
  onClear() {
    wx.removeStorageSync(STORAGE_KEY);
    this.setData({ storageValue: '', input: '' });
    wx.showToast({ title: '已清除', icon: 'success' });
  },

  // ==================== 三、登录态思路 ====================
  // 真实场景：wx.login 拿 code → 请求后端换 token → setStorageSync 存起来。
  // 这里用假 token 模拟「登录成功后把 token 存进 storage」这一步。
  onMockLogin() {
    const fakeToken = 'demo-token-' + Date.now();
    wx.setStorageSync(TOKEN_KEY, fakeToken); // 存 token
    this.setData({ token: fakeToken });
    wx.showToast({ title: '登录态已保存', icon: 'success' });
    // 之后再点「发起请求」，onRequest 会自动从 storage 读出它，
    // 塞进 header 的 Authorization 里 —— 这就是登录态维持的核心闭环。
  },
});
