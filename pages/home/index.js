// 首页逻辑：data 里放 demo 列表，wxml 用 wx:for 渲染（详见 05-logic-setdata）
Page({
  data: {
    demos: [
      { no: '01', name: '双线程架构/setData', desc: 'setData 更新视图', path: '/01-overview-architecture/demo/index' },
      { no: '03', name: 'WXML 模板语法', desc: '数据绑定/wx:for/wx:if', path: '/03-wxml/demo/index' },
      { no: '04', name: 'WXSS 样式', desc: 'rpx + flex', path: '/04-wxss/demo/index' },
      { no: '05', name: '逻辑层与 setData', desc: '计数器 + 优化', path: '/05-logic-setdata/demo/index' },
      { no: '06', name: '事件系统', desc: 'bind/catch/dataset', path: '/06-events/demo/index' },
      { no: '07', name: '自定义组件', desc: '父子通信/slot', path: '/07-component/demo/index' },
      { no: '08', name: '路由与生命周期', desc: 'navigateTo 传参', path: '/08-routing-lifecycle/demo/index' },
      { no: '09', name: '网络与存储', desc: 'wx.request/storage', path: '/09-network-storage/demo/index' },
      { no: '10', name: '常用 API', desc: 'toast/modal/scan', path: '/10-apis/demo/index' },
      { no: '11', name: '登录授权', desc: 'wx.login 流程', path: '/11-login-auth/demo/index' },
      { no: '12', name: '微信支付', desc: 'requestPayment(模拟)', path: '/12-payment/demo/index' }
    ]
  }
});
