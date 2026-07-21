// index.js —— 列表页（路由与生命周期 Demo）
// 演示：navigateTo（压栈·能返回）、redirectTo（替换·不能返回）、
//       navigateBack（返回）、列表点项跳详情传参，以及页面生命周期打印。
Page({
  data: {
    // 模拟一份列表数据，点击后跳详情并把 id/name 传过去
    list: [
      { id: 1, name: '小明' },
      { id: 2, name: '小红' },
      { id: 3, name: '张三' },
    ],
  },

  // ===== 生命周期钩子（打开控制台观察触发顺序）=====
  // 进入页面顺序：onLoad → onShow → onReady
  onLoad(options) {
    // 页面加载，只触发一次；query 参数在这里拿（options）
    console.log('[index] onLoad 只触发一次·可取参', options);
  },
  onShow() {
    // 每次显示都触发（首次进入 + 从详情页返回 + 从后台切回）
    // “返回后需要刷新的数据”应放这里
    console.log('[index] onShow 每次显示都触发');
  },
  onReady() {
    // 首次渲染完成，只一次；此后才能拿到节点、操作 canvas
    console.log('[index] onReady 渲染完成·只一次');
  },
  onHide() {
    // 被切走/遮挡（navigateTo 到详情页）时触发，页面仍在栈里
    console.log('[index] onHide 被切走/遮挡');
  },
  onUnload() {
    // 页面被销毁（被 redirectTo/reLaunch 关闭）时触发，适合清定时器
    console.log('[index] onUnload 页面销毁·清定时器');
  },

  // ===== 路由跳转方法 =====

  // ① navigateTo：压栈打开详情页，带 query 参数（能返回）
  //   注意：中文/特殊字符要 encodeURIComponent 编码，接收端解码
  goDetailByNavigate() {
    wx.navigateTo({
      url: '/08-routing-lifecycle/demo/detail?id=1&name=' + encodeURIComponent('小明'),
    });
  },

  // ② redirectTo：关闭当前页再打开详情页（替换·不能返回）
  //   典型用途：登录成功替换掉登录页
  goDetailByRedirect() {
    wx.redirectTo({
      url: '/08-routing-lifecycle/demo/detail?id=2&name=' + encodeURIComponent('小红'),
    });
  },

  // ③ 列表点项：拿到当前项的 id/name，navigateTo 跳详情传参
  onTapItem(e) {
    // data-* 通过 e.currentTarget.dataset 取
    const { id, name } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/08-routing-lifecycle/demo/detail?id=${id}&name=${encodeURIComponent(name)}`,
    });
  },

  // ④ navigateBack：返回上一页（本页作为列表页一般是栈底，仅作演示）
  //   若栈中只有本页则无上一页，控制台会有提示，属正常
  goBack() {
    wx.navigateBack({ delta: 1 });
  },
});
