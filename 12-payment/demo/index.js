// 12-payment/demo/index.js
// 微信支付流程演示（模拟版）
// -------------------------------------------------------------------
// 真实支付前提：已认证小程序 + 商户号(mch_id) + 二者关联 + 后端签名。
// 本 demo 用「模拟支付参数」调 wx.requestPayment，只为展示前端代码结构与流程。
// 在开发者工具/真机上因参数是假的，会走 fail 回调并报参数错误——这是正常现象。
// -------------------------------------------------------------------

Page({
  data: {
    paying: false,

    // ⚠️ 下面是「模拟」的支付参数 5 件套，仅用于演示前端调用结构。
    // 真实场景中这 5 个值全部由【后端】完成：
    //   后端调微信「统一下单」拿到 prepay_id →
    //   再用【商户密钥】在后端算出 paySign（签名）→ 一起返回给前端。
    // 前端永远拿不到、也不该碰商户密钥。
    payParams: [
      { k: 'timeStamp', v: '1717000000' },              // 后端返回的时间戳（秒）
      { k: 'nonceStr',  v: 'A1B2C3D4E5F6G7H8' },         // 后端返回的随机串
      { k: 'package',   v: 'prepay_id=wx_MOCK_1234567890' }, // 'prepay_id=xxx'，prepay_id 来自统一下单
      { k: 'signType',  v: 'RSA' },                      // 'RSA'(v3) 或 'MD5'(旧版)
      { k: 'paySign',   v: '★MOCK_后端用商户密钥算的签名★' }, // ★ 关键：后端签名，前端只搬运
    ],

    result: { show: false, type: '', title: '', msg: '' },
  },

  // 「立即支付」——演示完整流程的前端部分
  pay() {
    this.setData({
      paying: true,
      result: { show: false, type: '', title: '', msg: '' },
    });

    // ============================================================
    // 第 1 步（真实流程）：调后端下单接口，拿支付参数。
    // 下面是伪代码，演示 demo 里直接用 data 里的模拟参数代替。
    // ------------------------------------------------------------
    // const { data } = await wx.request({
    //   url: 'https://your.server.com/api/pay/create',
    //   method: 'POST',
    //   data: { orderId: this.data.orderId },  // 只传业务订单号，金额由后端定
    // });
    // 后端内部：创建订单(out_trade_no) → 调微信统一下单 → 拿 prepay_id
    //          → 用【商户密钥】签名 → 返回下面这 5 个参数。
    // const { timeStamp, nonceStr, package: pkg, signType, paySign } = data;
    // ============================================================

    // 把数组形式的模拟参数转成 requestPayment 需要的对象
    const p = this.data.payParams.reduce((acc, it) => {
      acc[it.k] = it.v;
      return acc;
    }, {});

    // ============================================================
    // 第 2 步：调 wx.requestPayment 拉起微信收银台。
    // 注意：这里用的是【模拟参数】，真机 + 真实参数才能真正拉起收银台。
    // 开发者工具里会因为参数校验失败而报错、走 fail —— 这是预期内的，
    // 本 demo 的重点是让你看清「前端怎么调、回调里做什么」。
    // ============================================================
    wx.requestPayment({
      timeStamp: p.timeStamp,   // 后端返回的时间戳（秒）
      nonceStr:  p.nonceStr,    // 后端返回的随机串
      package:   p.package,     // 'prepay_id=xxx'
      signType:  p.signType,    // 'RSA' / 'MD5'
      paySign:   p.paySign,     // ★ 后端用商户密钥算的签名

      // 成功回调：⚠️ 只代表「用户点了支付/收银台流程走完」，不代表钱到账！
      success: () => {
        this.setData({
          paying: false,
          result: {
            show: true,
            type: 'success',
            title: '✅ requestPayment success',
            msg: '收银台流程走完。但这不等于到账——需再向后端查真实订单状态。',
          },
        });
        // 真实流程：主动向后端查订单，后端以微信 notify 回调结果为准。
        // this.queryOrderStatus();
      },

      // 失败回调：用户取消 / 支付失败 / 参数错误都会到这。
      // 本 demo 用模拟参数，通常会命中「参数错误」——属于正常演示现象。
      fail: (err) => {
        const isCancel = err && /cancel/.test(err.errMsg || '');
        this.setData({
          paying: false,
          result: {
            show: true,
            type: 'fail',
            title: isCancel ? '用户取消支付' : '⚠️ requestPayment fail',
            msg: isCancel
              ? '常见 errMsg: requestPayment:fail cancel'
              : '因是模拟参数，多为参数错误 —— 这是本 demo 的预期现象，' +
                '真机 + 后端真实签名参数才能真正拉起收银台。errMsg: ' + (err && err.errMsg),
          },
        });
      },
    });
  },

  // 查订单状态：真实流程里前端支付返回后应主动查一次，
  // 以【后端库里的真实状态】（后端以 notify 为准更新）来展示结果。
  // 本 demo 仅保留结构，注释掉网络请求。
  queryOrderStatus() {
    // wx.request({
    //   url: 'https://your.server.com/api/order/status',
    //   data: { orderId: this.data.orderId },
    //   success: ({ data }) => {
    //     const paid = data.status === 'PAID';
    //     wx.showToast({ title: paid ? '支付成功' : '处理中', icon: 'none' });
    //   },
    // });
  },
});
