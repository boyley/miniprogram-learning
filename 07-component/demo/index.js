// index.js —— 使用 counter 组件的父页面
Page({
  data: {
    lastCount: 0   // 保存从子组件事件里拿到的最新 count
  },

  // 子组件 triggerEvent('change', {count}) 触发，e.detail 是抛出的对象
  onChange(e) {
    // 演示父子通信：用 setData 把子组件的 count 显示到父页面
    this.setData({ lastCount: e.detail.count });
    console.log('子组件计数变化，count =', e.detail.count);
  }
});
