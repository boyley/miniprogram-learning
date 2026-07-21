// 03 WXML 语法演示 —— 逻辑层
// 记住：模板只能读 data，改数据一律回这里 setData
Page({
  data: {
    title: 'WXML 核心语法全演示',
    a: 3,
    b: 5,
    show: true,        // 开关：给 wx:if / hidden / 属性绑定共用
    count: 75,         // 分数：给 wx:if/elif/else 演示
    // 列表：每项有唯一 id 供 wx:key 使用
    list: [
      { id: 1, name: '小明', vip: true },
      { id: 2, name: '小红', vip: false },
      { id: 3, name: '小刚', vip: true },
    ],
    nextId: 4,         // 自增 id，保证新增项 key 唯一
  },

  // 切换开关：wx:if / hidden / 三元 class 都会随之变化
  toggleShow() {
    this.setData({ show: !this.data.show });
  },

  // 分数 +15 / -15，触发条件渲染分支切换
  addCount() {
    this.setData({ count: Math.min(this.data.count + 15, 100) });
  },
  minusCount() {
    this.setData({ count: Math.max(this.data.count - 15, 0) });
  },

  // 新增一项（先算好数据再 setData）
  addItem() {
    const id = this.data.nextId;
    const list = this.data.list.concat({
      id,
      name: '同学' + id,
      vip: id % 2 === 0,
    });
    this.setData({ list, nextId: id + 1 });
  },

  // 删除某项：从 data-id 取到 id 再过滤
  removeItem(e) {
    const id = e.currentTarget.dataset.id;
    const list = this.data.list.filter((item) => item.id !== id);
    this.setData({ list });
  },

  // 重置回初始三条
  resetList() {
    this.setData({
      list: [
        { id: 1, name: '小明', vip: true },
        { id: 2, name: '小红', vip: false },
        { id: 3, name: '小刚', vip: true },
      ],
      nextId: 4,
    });
  },
});
