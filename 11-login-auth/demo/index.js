// 11 登录授权 · 微信登录流程演示（前端部分，后端用注释/模拟）
// 核心链路：wx.login 拿 code → 发后端 → 后端 code+AppSecret 调 code2Session
//          换 openid+session_key → 后端签发 token → 前端存 storage → 请求带 token

const TOKEN_KEY = 'token'; // 存 storage 的 key（登录态，见 09-network-storage）

Page({
  data: {
    code: '',          // wx.login 拿到的一次性凭证
    token: '',         // 后端签发的登录态 token
    tokenShort: '',    // token 截断展示
    userInfo: null,    // getUserProfile 返回的昵称头像
    phoneCipher: ''    // getPhoneNumber 回调拿到的密文/凭证
  },

  onLoad() {
    // 进页面先读本地已存的 token，恢复登录态
    const token = wx.getStorageSync(TOKEN_KEY) || '';
    this.setData({ token, tokenShort: this._short(token) });
    // 提示：wx.login 无需授权、可尽早做（甚至 onLaunch）先把 token 换好；
    // 这里为了演示按钮点击流程，不在 onLoad 里静默登录。
  },

  // ① 微信登录：拿 code → 发后端换 token（后端用注释/模拟）
  doLogin() {
    wx.login({
      success: (res) => {
        if (!res.code) {
          console.error('wx.login 失败', res);
          return wx.showToast({ title: 'login 失败', icon: 'none' });
        }
        // 拿到 code（5 分钟过期、只能换一次、本身不含用户信息）
        this.setData({ code: res.code });
        console.log('拿到 code：', res.code);

        // ↓↓↓ 真实项目：把 code 发给自己的后端换 token ↓↓↓
        // wx.request({
        //   url: 'https://api.你的域名.com/login',
        //   method: 'POST',
        //   data: { code: res.code },        // 只传 code，不传别的
        //   success: (r) => {
        //     const token = r.data.token;    // 后端签发的登录态
        //     wx.setStorageSync('token', token);
        //   }
        // });
        //
        // ↓↓↓ 后端 /login 伪代码（AppSecret 只存在后端！）↓↓↓
        // app.post('/login', async (req, res) => {
        //   const { code } = req.body;
        //   const wxRes = await fetch(
        //     'https://api.weixin.qq.com/sns/jscode2session?' +
        //     `appid=${APP_ID}&secret=${APP_SECRET}` +   // AppSecret 绝不进前端
        //     `&js_code=${code}&grant_type=authorization_code`
        //   ).then(r => r.json());
        //   const { openid, session_key } = wxRes;   // session_key 留后端，不下发！
        //   const user = await db.findOrCreateByOpenid(openid);
        //   const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        //   res.json({ token });                     // 只把 token 给前端
        // });

        // —— 这里用模拟返回代替后端：假装后端换好并下发了一个 token ——
        this._mockLoginRequest(res.code);
      },
      fail: (err) => {
        console.error('wx.login 出错', err);
        wx.showToast({ title: 'login 出错', icon: 'none' });
      }
    });
  },

  // 模拟：把 code 发后端，后端返回 token（真实项目替换成 wx.request）
  _mockLoginRequest(code) {
    wx.showLoading({ title: '换取 token…' });
    setTimeout(() => {
      // 模拟后端签发的 token（真实是 JWT，这里随便造一个）
      const token = 'mock_token_' + Date.now();
      wx.setStorageSync(TOKEN_KEY, token); // 存本地（见 09-network-storage）
      this.setData({ token, tokenShort: this._short(token) });
      wx.hideLoading();
      wx.showToast({ title: '登录成功' });
      console.log('（模拟）后端用 code 换回 openid，并下发 token：', token);
    }, 600);
  },

  // ② 获取用户信息：必须用户点击触发，不能静默调
  getProfile() {
    wx.getUserProfile({
      desc: '用于完善资料', // 必填，声明用途，会弹授权框
      success: (res) => {
        // userInfo 含昵称、头像 url 等，不含 openid（头像昵称只是展示，不是身份）
        this.setData({ userInfo: res.userInfo });
        console.log('用户信息：', res.userInfo);
      },
      fail: (err) => {
        // 用户拒绝授权会走这里
        console.warn('用户拒绝或取消授权', err);
        wx.showToast({ title: '已取消授权', icon: 'none' });
      }
    });
  },

  // ③ 获取手机号：button open-type=getPhoneNumber 的回调
  onPhone(e) {
    // 用户拒绝：errMsg 里不含 'ok'
    if (!e.detail.errMsg || e.detail.errMsg.indexOf('ok') === -1) {
      console.warn('用户拒绝手机号授权', e.detail.errMsg);
      return wx.showToast({ title: '已拒绝授权', icon: 'none' });
    }
    // 新版拿到的是 code；旧版是 encryptedData + iv。都是密文，前端解不开！
    const cipher = e.detail.code || e.detail.encryptedData || '(密文)';
    this.setData({ phoneCipher: cipher });
    console.log('手机号密文/凭证：', e.detail);

    // ↓↓↓ 真实项目：把密文发后端，后端用 session_key 解密出手机号 ↓↓↓
    // wx.request({
    //   url: 'https://api.你的域名.com/bind-phone',
    //   method: 'POST',
    //   header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
    //   data: { code: e.detail.code },   // 密文/凭证，前端解不开
    //   success: () => wx.showToast({ title: '绑定成功' })
    // });
    // 后端用 session_key / access_token 调微信接口解密 → 拿到明文手机号
    wx.showToast({ title: '已拿到密文', icon: 'none' });
  },

  // 退出登录：清掉本地 token（演示登录态清除）
  logout() {
    wx.removeStorageSync(TOKEN_KEY);
    this.setData({ token: '', tokenShort: '', code: '', userInfo: null, phoneCipher: '' });
    wx.showToast({ title: '已退出', icon: 'none' });
  },

  // 工具：token 太长，截断展示
  _short(t) {
    if (!t) return '';
    return t.length > 16 ? t.slice(0, 16) + '…' : t;
  }
});
