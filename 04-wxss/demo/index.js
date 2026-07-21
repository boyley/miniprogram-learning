// index.js：演示如何用 data + setData 驱动动态样式（style="{{}}"）

// 一组可循环切换的主题色
const THEME_COLORS = ['#07c160', '#576b95', '#fa5151', '#ff8f1f', '#6467f0']

Page({
  data: {
    themeColor: THEME_COLORS[0], // 当前主题色，绑定到各处 style="{{}}"
    colorIndex: 0,               // 当前色号下标
    boxSize: 160,                // ③ 动态盒子的边长（单位 rpx，绑定到 style）
  },

  // 切换主题色：循环取下一个颜色，setData 后页面上所有绑了 themeColor 的地方自动更新
  switchTheme() {
    const next = (this.data.colorIndex + 1) % THEME_COLORS.length
    this.setData({
      colorIndex: next,
      themeColor: THEME_COLORS[next],
    })
  },

  // 放大动态盒子（上限 240rpx）
  grow() {
    this.setData({
      boxSize: Math.min(this.data.boxSize + 40, 240),
    })
  },

  // 缩小动态盒子（下限 80rpx）
  shrink() {
    this.setData({
      boxSize: Math.max(this.data.boxSize - 40, 80),
    })
  },
})
