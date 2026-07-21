// 页面里调用云函数 / 云数据库 / 云存储（需先 wx.cloud.init）
wx.cloud.init({ env: 'your-env-id' });

// 1) 调云函数
wx.cloud.callFunction({ name: 'getOpenId' })
  .then(res => console.log('openid =', res.result.openid));

// 2) 云数据库：查
const db = wx.cloud.database();
db.collection('todos').where({ done: false }).get()
  .then(res => console.log('未完成待办', res.data));
// 云数据库：增
db.collection('todos').add({ data: { title: '学云开发', done: false } });

// 3) 云存储：上传文件，返回 fileID 可直接当 image src
wx.cloud.uploadFile({ cloudPath: 'a.png', filePath: '临时路径' })
  .then(res => console.log('fileID =', res.fileID));
