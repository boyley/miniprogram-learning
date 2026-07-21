// Taro：用 React 语法写，一套代码编译到多端小程序 + H5 + RN
import { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default function Counter() {
  const [count, setCount] = useState(0);         // React Hooks，不用 setData
  return (
    <View>
      <Text>{count}</Text>
      <Button onClick={() => { setCount(count + 1); Taro.showToast({ title: '点击了' }); }}>+1</Button>
    </View>
  );
}
