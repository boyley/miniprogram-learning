// 抖音/字节小程序页面：和微信几乎一样，只是 wx.* → tt.*
Page({
  data: { code: '', info: '' },
  // 登录：tt.login 拿 code（对比微信 wx.login，流程一致）
  onLogin() {
    tt.login({ success: (res) => { this.setData({ code: res.code }); } });
  },
  // 请求：tt.request（对比 wx.request）
  onRequest() {
    tt.request({
      url: 'https://httpbin.org/get',
      success: (res) => { this.setData({ info: JSON.stringify(res.data).slice(0, 100) }); }
    });
  },
  // 提示：tt.showToast（对比 wx.showToast）
  onToast() { tt.showToast({ title: '抖音小程序', icon: 'success' }); }
});
