// 常用交互 / 设备 API 演示
// 说明：每个方法演示一个 wx.* API，回调里用 setData 把结果写到页面 result 区域。
// ⚠️ 标注「真机」的 API 在开发者工具里可能无效或弹提示，需在真机预览/体验版验证。

Page({
  data: {
    result: '', // 结果展示文本
  },

  // 统一把结果写到页面
  showResult(text) {
    this.setData({ result: text });
  },

  // ① wx.showToast —— 轻提示，1.5s 自动消失。icon: success/error/none/loading
  onToast() {
    wx.showToast({
      title: '操作成功',
      icon: 'success',
      duration: 1500,
    });
    this.showResult('已弹出 showToast（成功提示）');
  },

  // ② wx.showModal —— 确认对话框，回调里读 res.confirm / res.cancel
  onModal() {
    wx.showModal({
      title: '提示',
      content: '确定要执行这个操作吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.showResult('showModal：用户点了【确定】(res.confirm === true)');
        } else if (res.cancel) {
          this.showResult('showModal：用户点了【取消】(res.cancel === true)');
        }
      },
    });
  },

  // ③ wx.showLoading / wx.hideLoading —— 必须成对；mask 防止误触
  onLoading() {
    wx.showLoading({ title: '加载中...', mask: true });
    this.showResult('已显示 showLoading，2 秒后自动 hideLoading');
    // 模拟异步任务完成后关闭 loading
    setTimeout(() => {
      wx.hideLoading();
      this.showResult('showLoading 已关闭（hideLoading）');
    }, 2000);
  },

  // ④ wx.showActionSheet —— 底部弹出菜单，回调里读 res.tapIndex
  onActionSheet() {
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择', '保存图片'],
      success: (res) => {
        this.showResult('showActionSheet：点了第 ' + res.tapIndex + ' 项');
      },
      fail: (err) => {
        // 用户点击遮罩取消也会进 fail
        this.showResult('showActionSheet：已取消（' + err.errMsg + '）');
      },
    });
  },

  // ⑤ wx.setClipboardData —— 复制文本到剪贴板（免授权），微信会自动提示"已复制"
  onCopy() {
    const text = 'INVITE-8888';
    wx.setClipboardData({
      data: text,
      success: () => {
        this.showResult('已复制到剪贴板：' + text + '（可长按输入框粘贴验证）');
      },
    });
  },

  // ⑥ wx.getSystemInfoSync —— 同步 API，直接返回值。展示机型/系统/屏幕信息
  // 注：新版推荐拆分的 wx.getDeviceInfo / wx.getWindowInfo，这里用经典同步版演示
  onSystemInfo() {
    const info = wx.getSystemInfoSync();
    const text =
      '机型：' + info.brand + ' ' + info.model + '\n' +
      '系统：' + info.system + '（' + info.platform + '）\n' +
      '微信版本：' + info.version + ' / 基础库 ' + info.SDKVersion + '\n' +
      '屏幕：' + info.screenWidth + ' x ' + info.screenHeight + ' px\n' +
      '可用窗口：' + info.windowWidth + ' x ' + info.windowHeight + ' px\n' +
      '像素比 pixelRatio：' + info.pixelRatio;
    this.showResult(text);
  },

  // ⑦ wx.makePhoneCall —— 拉起系统拨号盘。⚠️ 首次可能弹权限询问；真机才会真正拨号
  onPhone() {
    wx.makePhoneCall({
      phoneNumber: '10086',
      success: () => this.showResult('makePhoneCall：已拉起拨号盘（真机有效）'),
      fail: (err) => this.showResult('makePhoneCall：已取消或失败（' + err.errMsg + '）'),
    });
  },

  // ⑧ wx.scanCode —— 打开扫码界面（免授权）。⚠️ 真机可用；开发者工具可选模拟图片
  onScan() {
    wx.scanCode({
      success: (res) => {
        this.showResult('scanCode 扫描结果：' + res.result + '（类型 ' + res.scanType + '）');
      },
      fail: (err) => {
        this.showResult('scanCode：已取消或失败（' + err.errMsg + '）');
      },
    });
  },

  // ⑨ wx.previewImage —— 预览大图，可左右滑动。current 为默认展示图，urls 为图片列表
  onPreview() {
    const urls = [
      'https://mmbiz.qpic.cn/mmbiz_jpg/1.jpg',
      'https://mmbiz.qpic.cn/mmbiz_jpg/2.jpg',
    ];
    // 这里用微信官方文档的占位图，真实项目替换成你自己的图片地址
    const demoUrls = [
      'https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg',
      'https://res.wx.qq.com/wxdoc/dist/assets/img/demo.8e0d95c7.jpg',
    ];
    wx.previewImage({
      current: demoUrls[0],
      urls: demoUrls,
      success: () => this.showResult('previewImage：已打开图片预览'),
      fail: (err) => this.showResult('previewImage 失败：' + err.errMsg + '（检查图片地址/网络）'),
    });
  },
});
