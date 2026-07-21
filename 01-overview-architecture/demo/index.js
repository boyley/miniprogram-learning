// index.js：逻辑层（App Service），跑在独立 JS 引擎里
// 注意：这里没有 document / window，不能操作 DOM，一切界面变化走 setData

Page({
  // data：页面初始数据，会被渲染到 WXML 的 {{}} 里（类似 Vue 的 data，但不会自动响应）
  data: {
    message: '你好，小程序 👋',
    count: 0, // 记录 setData 触发次数
  },

  // ✅ 正确示范：点击按钮 → 用 setData 更新视图
  onTap() {
    const next = '点击了！时间：' + new Date().toLocaleTimeString();

    // setData：把数据从【逻辑层】经 Native 序列化传给【渲染层】，渲染层 diff 后刷新视图
    // 这是唯一能更新界面的方式，只传变化的最小字段
    this.setData({
      message: next,
      count: this.data.count + 1, // 读 data 可以，但改视图必须 setData
    });

    console.log('[逻辑层] 调用 setData，数据将经 Native 传给渲染层 →', next);
  },

  // ❌ 错误示范：直接修改 this.data 不会刷新视图
  onWrongTap() {
    // 下面这行只改了逻辑层内存里的值，渲染层收不到通知，界面【不会变】
    this.data.message = '我被直接改了，但你在界面上看不到我 🙈';

    // 证明：data 里的值确实变了，但视图没刷新（因为没跨线程通信）
    console.warn(
      '[逻辑层] 直接改 this.data.message =',
      this.data.message,
      '→ 但视图不会更新！必须用 setData 才会跨线程同步到渲染层'
    );
  },

  // onLoad：页面生命周期，加载时触发（在逻辑层执行）
  onLoad() {
    console.log('==============================================');
    console.log('[双线程架构] 逻辑层(JS) 与 渲染层(视图) 是两条独立线程');
    console.log('[双线程架构] 逻辑层无 DOM/BOM，不能 document.querySelector');
    console.log('[双线程架构] 更新视图：data → setData → Native 中转 → 渲染层 diff 刷新');
    console.log('[双线程架构] 用户点击：渲染层 → Native → 逻辑层事件回调');
    console.log('==============================================');
  },
});
