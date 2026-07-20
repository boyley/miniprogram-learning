# 06 · 事件系统（Events）

> 小程序里用户的一切操作（点击、输入、滑动…）都通过**事件**回传给逻辑层。没有 `onclick`、不能直接给函数传参——绑定用 `bindtap`，传参靠 `data-xxx` + `dataset`。核心是搞懂 **bind vs catch（冒泡）** 和 **event 事件对象**。重要度 ⭐⭐。官方：developers.weixin.qq.com

## 🎯 一句话核心

事件是**渲染层 → 逻辑层**的唯一入口：WXML 上写 `bind事件名="方法名"`，方法定义在 `Page`/`Component` 里，触发时收到一个 **event 对象**（里面有 `detail` 输入值、`currentTarget.dataset` 你传的参数）。要不要向父节点**冒泡**，由 `bind`（冒泡）还是 `catch`（拦截）决定。

## 📖 核心概念 / 讲解

**★ 事件绑定：`bind` 系列，没有 `onclick`。** Web 里点击是 `onclick`、输入是 `oninput`；小程序统一改成 WXML 属性 `bind + 事件名`，值是**逻辑层里方法的名字**（字符串），不是像 Vue 那样写表达式/传参。常用：`bindtap`（点击，最常用）、`bindinput`（输入框实时输入）、`bindchange`（值改变，如 picker/switch/radio）、`bindsubmit`（form 提交）、`bindconfirm`（键盘"完成/回车"）、`bindlongpress`（长按）、`bindscroll`（滚动）。写法有两种等价形式：`bindtap="fn"` 和带连字符的 `bind:tap="fn"`（后者在事件名含连字符时更清晰）。

**★ bind vs catch（重点：冒泡）。** 小程序事件和 DOM 一样会**冒泡**（子节点触发 → 逐层向父节点传递）。区别只在绑定前缀：

- **`bind`**：正常绑定，**事件会继续冒泡**给父节点。
- **`catch`**：绑定并**阻止冒泡**（相当于 Web 里 `e.stopPropagation()`），父节点的同名事件不再触发。
- **捕获阶段**：`capture-bind` / `capture-catch` 在**捕获阶段**（从外向内）触发；`capture-catch` 会中断整个捕获+冒泡链。日常 99% 用 `bind`/`catch` 即可。

典型场景：点击列表项跳详情用 `bindtap`，但项里的"删除"按钮要用 `catchtap`，否则点删除会**顺带触发**外层跳详情。

**★ 事件对象 event（重点）。** 事件方法的第一个参数就是 `e`（event），关键字段：

- `e.type`：事件类型，如 `"tap"`。
- `e.detail`：**事件的额外信息**。`bindinput`/`bindchange` 里用 `e.detail.value` 拿输入/选中值；`bindsubmit` 里 `e.detail.value` 是整个表单对象；tap 里有触点坐标。**≈ Web 里从 `e.target.value` 拿输入值**。
- `e.target` vs `e.currentTarget`（必考区别）：`target` 是**真正触发事件的那个源节点**（可能是子节点），`currentTarget` 是**当前绑定这个事件处理函数的节点**。事件冒泡上来时两者可能不同 → **取传参用 `currentTarget.dataset` 更稳**。
- `e.touches` / `e.changedTouches`：触摸点数组（touch 类事件才有），含 `clientX/clientY` 坐标。

**★ dataset 传参（重点：小程序主要传参方式）。** 小程序**不能**像 Vue 那样写 `@click="fn(item.id)"` 直接给方法传参。要传参就在 WXML 元素上写 `data-` 开头的自定义属性，逻辑层从 `e.currentTarget.dataset` 里取：

- WXML：`<view data-id="{{item.id}}" data-name="{{item.name}}" bindtap="onTap">`
- JS：`e.currentTarget.dataset.id`、`e.currentTarget.dataset.name`
- 命名规则：`data-` 后**连字符命名会转成小驼峰**——`data-user-id` → `dataset.userId`；且**全部转小写**，所以属性名别用大写。
- 另一种方式 **`mark`**：`mark:id="{{item.id}}"` → `e.mark.id`。和 dataset 类似，但 `mark` 会带上**冒泡路径上所有节点**的 mark 合并结果，适合冒泡场景；日常传参 `dataset` 用得最多。

**和 Web / Vue 的关键区别（对照记）：**

| 维度 | H5 / Vue | 小程序 |
|---|---|---|
| 点击绑定 | `onclick` / `@click` | **`bindtap`** |
| 输入绑定 | `oninput` / `v-model` | **`bindinput`** + 手动 setData |
| 拿输入值 | `e.target.value` | **`e.detail.value`** |
| 阻止冒泡 | `e.stopPropagation()` | 换成 **`catch`** 前缀 |
| 给回调传参 | `@click="fn(item.id)"` 直接传 | **不能**；`data-id` → **`dataset`** 取 |
| 自定义属性 | `data-*` + `dataset` | 一样 **`data-*`** + **`dataset`**（主力传参） |

**常见事件一览。** 点击 `tap`、长按 `longpress`（旧名 `longtap`）；触摸三连 `touchstart` / `touchmove` / `touchend`（做拖拽/手势）；输入 `input`、确认 `confirm`（键盘回车）；表单 `submit` / `reset`；滚动 `scroll`（`scroll-view`/`page` 上）。

## 💻 代码示例：事件绑定 + dataset 传参 + 冒泡

```html
<!-- list.wxml -->
<!-- 1) 输入框：bindinput 实时拿值（没有 v-model，要手动 setData） -->
<input placeholder="搜索" bindinput="onInput" value="{{keyword}}" />

<!-- 2) dataset 传参：整行 bindtap 跳详情；行内删除按钮用 catchtap 阻止冒泡 -->
<view
  wx:for="{{list}}"
  wx:key="id"
  data-id="{{item.id}}"
  data-name="{{item.name}}"
  bindtap="onRowTap"
>
  <text>{{item.name}}</text>
  <!-- ★ 用 catchtap：点删除不会冒泡到外层 onRowTap -->
  <button size="mini" data-id="{{item.id}}" catchtap="onDelete">删除</button>
</view>

<!-- 3) 表单：bindsubmit 一次拿到所有带 name 的字段 -->
<form bindsubmit="onSubmit">
  <input name="phone" placeholder="手机号" />
  <switch name="agree" />
  <button form-type="submit">提交</button>
</form>
```

```js
// list.js
Page({
  data: { keyword: '', list: [{ id: 1, name: '苹果' }, { id: 2, name: '香蕉' }] },

  // bindinput：从 e.detail.value 拿输入值，再手动同步到 data
  onInput(e) {
    this.setData({ keyword: e.detail.value }); // ≈ Web 的 e.target.value
  },

  // dataset 传参：从 currentTarget.dataset 取（小驼峰）
  onRowTap(e) {
    const { id, name } = e.currentTarget.dataset; // data-id → id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
    console.log(e.type, id, name); // "tap" 1 苹果
  },

  // catchtap：只触发这里，不会再触发外层 onRowTap
  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ list: this.data.list.filter(it => it.id !== id) });
  },

  // bindsubmit：e.detail.value 是整个表单对象 { phone, agree }
  onSubmit(e) {
    console.log(e.detail.value); // { phone: '138...', agree: true }
  },
});
```

> `target` vs `currentTarget`：点上例的"删除"按钮时，若事件冒泡到外层 `view`，则 `e.target` 是 `<button>`、`e.currentTarget` 是绑定该处理函数的节点。**传参一律用 `currentTarget.dataset`** 才不会因为点到子节点而取错。

## 🔑 要点速记

- 绑定用 **`bind事件名`**（`bindtap`/`bindinput`/`bindchange`/`bindsubmit`…），**没有 `onclick`**；值是方法名字符串。
- **★ `bind` 冒泡、`catch` 阻止冒泡**；捕获阶段用 `capture-bind`/`capture-catch`。`catch` ≈ Web 的 `stopPropagation`。
- **★ event 对象**：`e.type` 类型、`e.detail`（输入值/表单值）、`e.touches` 触点。
- **★ `target`（触发源节点）≠ `currentTarget`（绑定处理函数的节点）**；传参取 `currentTarget.dataset` 最稳。
- **★ dataset 传参**：WXML `data-xxx="{{值}}"` → JS `e.currentTarget.dataset.xxx`；连字符转**小驼峰**、名字**转小写**。这是小程序主力传参方式（不能像 Vue 直接传函数参数）。
- 拿输入值：`bindinput` + **`e.detail.value`**（≈ Web 的 `e.target.value`），且要手动 `setData`（无 `v-model`）。
- 常见事件：tap / longpress / touchstart-move-end / input / confirm / scroll。

## ⚠️ 易错点 / 最佳实践

- ⚠️ **点子节点却用了 `e.target.dataset` 取参 → 取到 `undefined`**：因为 `target` 可能是没写 `data-*` 的子节点。**传参统一用 `e.currentTarget.dataset`**。
- ⚠️ **列表项内部按钮忘了用 `catch` → 误触发外层事件**（如点"删除"却跳了详情）。内层要拦截就用 `catchtap`。
- ⚠️ **`data-` 属性名用了大写取不到**：`data-userId` 会被转成全小写 `dataset.userid`；请写 `data-user-id` → `dataset.userId`。
- ⚠️ **`bindinput` 只是拿到值，视图不会自动变**——必须 `this.setData({ ... })` 回填，否则受控 `value` 不更新（小程序无 `v-model`，详见 [05-logic-setdata](../05-logic-setdata/)）。
- ⚠️ **`dataset` 只在渲染时快照**：`data-*` 里绑的是渲染那一刻的值，别指望它实时反映后续 data 变化；需要最新值就用 id 去 `this.data` 里查。
- ✅ **高频事件（`bindinput`/`bindscroll`/`touchmove`）注意节流**：每次触发都会跨线程回调，频繁 `setData` 是卡顿主因（详见 [05-logic-setdata](../05-logic-setdata/)）。
- 🔗 事件也是**自定义组件**父子通信的基础（子组件 `triggerEvent` → 父用 `bind` 接收），见 [07-components](../07-component/)；官方事件文档 → <https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/event.html>。
