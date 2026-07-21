// 05 逻辑层与 setData —— 可运行 demo
// 主题：setData 机制与优化演示
// 演示点：① 计数器（+1/-1/重置）② 数据路径更新对象/数组某一项
//         ③ 生命周期 onLoad/onShow/onReady 打印顺序 ④ setData 优化注释

Page({
  // ===== ① 页面初始数据（会参与首屏渲染）=====
  // 只把「要显示在界面上」的数据放进 data；不上屏的数据挂到 this（见 onLoad 里的 _createTime）
  data: {
    count: 0, // 计数器当前值

    // 一个嵌套对象：演示 'user.xxx' 数据路径更新
    user: {
      name: '小明',
      age: 18,
    },

    // 一个数组：演示 'list[i].xxx' 数据路径更新
    list: [
      { id: 1, title: '学习双线程架构', done: true },
      { id: 2, title: '搞懂 setData 机制', done: false },
      { id: 3, title: '掌握数据路径更新', done: false },
    ],

    // 记录最近一次操作说明，方便在界面上直观看到「改了什么」
    lastAction: '（还没有操作）',
  },

  // ===== ② 生命周期钩子：观察控制台打印顺序 =====
  // 正常顺序：onLoad → onShow → onReady（其中 onLoad/onReady 只一次，onShow 每次显示都触发）
  onLoad(options) {
    console.log('【生命周期】1. onLoad —— 页面加载(只一次)，可在此接收路由参数：', options);
    // ⑤ 优化：不需要渲染的数据别放 data，挂在实例 this 上，完全不走跨线程序列化
    this._createTime = Date.now(); // 页面创建时间戳，界面用不到 → 放 this 而非 data
  },

  onShow() {
    console.log('【生命周期】2. onShow —— 页面每次显示都触发（含从后台切回 / 其他页返回）');
  },

  onReady() {
    console.log('【生命周期】3. onReady —— 首次渲染完成(只一次)，此时才能操作节点 / canvas');
  },

  onHide() {
    console.log('【生命周期】onHide —— 页面被隐藏（跳转其他页 / 切后台）');
  },

  onUnload() {
    console.log('【生命周期】onUnload —— 页面卸载，可在此清理定时器等资源');
  },

  // ===== ③ 计数器：演示 setData 更新视图 =====
  // 关键点：不能写 this.data.count++（那样只改逻辑层内存，不触发跨线程通信，视图纹丝不动）
  //         必须用 this.setData 把变化「跨线程」送到渲染层才会更新视图
  onIncrement() {
    const next = this.data.count + 1;
    // ② 优化：一次交互能合并的字段合并成一次 setData，减少跨线程往返
    this.setData({
      count: next,
      lastAction: `count +1 → ${next}`,
    });
    // 注意：setData 是异步刷新「视图」，但 this.data 是同步就合并好的，下一行立刻能读到新值
    console.log('setData 后同步读取 this.data.count =', this.data.count);
  },

  onDecrement() {
    const next = this.data.count - 1;
    this.setData({
      count: next,
      lastAction: `count -1 → ${next}`,
    });
  },

  onReset() {
    // setData 第二参回调：视图更新完成后才执行（演示异步刷新）
    this.setData({ count: 0, lastAction: 'count 重置为 0' }, () => {
      console.log('【回调】视图已更新完成，此时 count 已渲染为', this.data.count);
    });
  },

  // ===== ④ 数据路径更新对象的某一个字段 =====
  // ✅ 只传 'user.name' 这一个字段，而不是整包 setData({ user: 整个对象 })
  //    通信量从「整个 user 对象」降到「一个字符串」，这就是数据路径优化的核心
  onChangeName() {
    const names = ['小明', '小红', '小刚', '阿伟'];
    const cur = names.indexOf(this.data.user.name);
    const nextName = names[(cur + 1) % names.length];
    this.setData({
      'user.name': nextName, // 只更新嵌套对象里的 name 字段
      lastAction: `数据路径更新 user.name → ${nextName}`,
    });
  },

  onGrowUp() {
    this.setData({
      'user.age': this.data.user.age + 1, // 只更新 user.age
      lastAction: `数据路径更新 user.age → ${this.data.user.age + 1}`,
    });
  },

  // ===== ④ 数据路径更新数组的某一项 =====
  // WXML 里 data-index="{{index}}" 传下标；这里用「计算属性名」拼出 'list[i].done'
  // ✅ 只传变化的那一项的 done 字段，而不是把整个 list 数组重新序列化跨线程传输
  onToggle(e) {
    const i = e.currentTarget.dataset.index;
    const key = `list[${i}].done`; // 数据路径：数组第 i 项的 done
    this.setData({
      [key]: !this.data.list[i].done,
      lastAction: `数据路径更新 ${key}`,
    });
  },

  // 演示「数据路径新增一项」：用 list[当前长度] 追加，而不是 push 后再整包 set
  // ⚠️ 小程序对数组无响应式，push/splice 后整包 set 既慢又易错，正确姿势是路径新增
  onAppend() {
    const len = this.data.list.length;
    const newItem = { id: Date.now(), title: `新任务 ${len + 1}`, done: false };
    this.setData({
      [`list[${len}]`]: newItem, // 只传新增的这一项
      lastAction: `数据路径新增 list[${len}]`,
    });
  },

  // ===== 反面教材：直接改 this.data 不会更新视图（演示常见坑）=====
  // 点这个按钮，你会发现界面上的 count 完全没变——因为没走 setData，没触发跨线程通信
  onWrongWay() {
    this.data.count = 999; // ❌ 只改了逻辑层内存对象，Native 和渲染层根本不知道
    console.warn('❌ 直接改 this.data.count = 999，但没调 setData → 视图不会更新！当前 this.data.count =', this.data.count);
    this.setData({ lastAction: '❌ 直接改 this.data（视图不更新，见控制台警告）' });
  },
});
