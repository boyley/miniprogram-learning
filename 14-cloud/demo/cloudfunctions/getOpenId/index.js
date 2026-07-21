// 云函数 getOpenId —— 部署到云端，天然拿到调用者 openid（免 code 换取）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
exports.main = async (event, context) => {
  const { OPENID, APPID } = cloud.getWXContext(); // 微信自动注入
  return { openid: OPENID, appid: APPID, msg: '云函数返回' };
};
