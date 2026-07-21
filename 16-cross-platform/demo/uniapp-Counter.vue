<!-- uni-app：用 Vue 语法写，一套代码编译到微信/抖音/支付宝小程序 + H5 + App -->
<template>
  <view class="box">
    <text>{{ count }}</text>
    <button @click="add">+1</button>
    <!-- #ifdef MP-WEIXIN -->
    <text>这段只在微信小程序编译（条件编译）</text>
    <!-- #endif -->
  </view>
</template>
<script>
export default {
  data() { return { count: 0 }; },
  methods: {
    add() {
      this.count++;                 // uni-app 用 Vue 响应式，不用 setData
      uni.showToast({ title: '点击了' }); // uni.* 统一 API，编译时映射到各端
    }
  }
};
</script>
