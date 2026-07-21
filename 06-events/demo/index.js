// 06 事件系统全演示
Page({
  data: {
    bubbleLog: '（未点击）',                 // 冒泡日志
    fruits: [                                 // dataset 传参用的列表
      { id: 101, name: '🍎 苹果' },
      { id: 102, name: '🍌 香蕉' },
      { id: 103, name: '🍇 葡萄' },
    ],
    picked: '（未选择）',                      // 选中的列表项
    keyword: '',                              // bindinput 实时值
    targetRole: '-',                          // e.target.dataset.role
    currentRole: '-',                         // e.currentTarget.dataset.role
  },

  // ===== 1. 冒泡 vs 阻止冒泡 =====

  // 外层：只要冒泡上来就会触发
  onOuterTap() {
    console.log('🔵 外层 onOuterTap 被触发');
    this.setData({ bubbleLog: this.data.bubbleLog + ' → 外层(冒泡到了)' });
  },

  // 内层 A：bindtap，点完会继续冒泡到外层
  onInnerBind() {
    console.log('🟢 内层 A onInnerBind（bindtap，会冒泡）');
    this.setData({ bubbleLog: '内层A(bindtap)' });
    // 外层 onOuterTap 随后也会被触发，日志会追加 "→ 外层"
  },

  // 内层 B：catchtap，阻止冒泡，外层不会触发
  onInnerCatch() {
    console.log('🔴 内层 B onInnerCatch（catchtap，阻止冒泡）');
    this.setData({ bubbleLog: '内层B(catchtap) —— 外层不会触发 ✋' });
  },

  // ===== 2. dataset 传参 =====

  // 从 currentTarget.dataset 取（data-id → dataset.id）
  onRowTap(e) {
    const { id, name } = e.currentTarget.dataset;
    console.log('📦 dataset 传参：', e.type, id, name);
    this.setData({ picked: `${name}（id=${id}）` });
  },

  // ===== 3. bindinput 实时取值 =====

  // 无 v-model，需从 e.detail.value 取值并手动 setData 回填
  onInput(e) {
    console.log('⌨️ bindinput e.detail.value =', e.detail.value);
    this.setData({ keyword: e.detail.value });
  },

  // ===== 4. e.target vs e.currentTarget =====

  // 点子文字时：target 是被点的源节点(text，没写 data-*)，
  // currentTarget 是绑定处理函数的外层 view(data-role=parent)
  onCompareTap(e) {
    const targetRole = e.target.dataset.role;               // 可能是 undefined
    const currentRole = e.currentTarget.dataset.role;       // 稳定 = 'parent'
    console.log('🎯 e.target      =', e.target);
    console.log('🎯 e.currentTarget =', e.currentTarget);
    console.log('   target.dataset.role      =', targetRole, '（点子节点时取不到 → 所以传参别用 target）');
    console.log('   currentTarget.dataset.role =', currentRole, '（永远是绑定处理函数的节点 → 传参用它最稳）');
    this.setData({
      targetRole: targetRole === undefined ? 'undefined' : targetRole,
      currentRole: currentRole === undefined ? 'undefined' : currentRole,
    });
  },
});
