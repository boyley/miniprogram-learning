// counter.js —— 计数卡片组件，用 Component 而不是 Page
Component({
  // 组件选项：默认样式隔离 isolated
  options: { styleIsolation: 'isolated' },

  // properties：父 → 子通信（≈ Vue props）
  properties: {
    title: String,                     // 简写：只声明类型
    step: { type: Number, value: 1 }   // 完整写法：类型 + 默认值（父不传时步长为 1）
  },

  // data：组件内部私有数据
  data: {
    count: 0
  },

  // methods：组件方法必须写在这里（否则事件绑不上）
  methods: {
    add() {
      // 读 property 和 data 都用 this.data.xxx（两者合并）
      this.setData({ count: this.data.count + this.properties.step });
      // 子 → 父通信：抛自定义事件（≈ Vue $emit），父用 bind:change 接
      this.triggerEvent('change', { count: this.data.count });
    }
  }
});
