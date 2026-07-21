// detail.js —— 详情页
// 演示：onLoad(options) 取 query 参数、navigateBack 返回、生命周期打印。
Page({
  data: {
    id: '',
    name: '',
  },

  // onLoad 只触发一次，query 参数在这里拿
  onLoad(options) {
    console.log('[detail] onLoad 取参', options);
    // 注意：query 拿到的都是字符串（id 是 '1' 不是 1）
    // 中文/特殊字符跳转时做了 encodeURIComponent，这里 decodeURIComponent 还原
    this.setData({
      id: options.id,
      name: decodeURIComponent(options.name || ''),
    });
  },
  onShow() {
    console.log('[detail] onShow 每次显示都触发');
  },
  onReady() {
    console.log('[detail] onReady 渲染完成·只一次');
  },
  onHide() {
    console.log('[detail] onHide 被切走/遮挡');
  },
  onUnload() {
    // 被 navigateBack/redirectTo 关闭时触发，适合清定时器、取消监听
    console.log('[detail] onUnload 页面销毁·清定时器');
  },

  // navigateBack 返回上一页（列表页）
  goBack() {
    wx.navigateBack({ delta: 1 });
  },
});
