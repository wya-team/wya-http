# \@wya/http
[![npm][npm-image]][npm-url] [![changelog][changelog-image]][changelog-url]

## [Demo](https://wya-team.github.io/wya-http/demo/index.html)

> 0.3.0 改写了`ajaxFn` 调用，默认使用`defaultOptions`

## 安装
```
npm install @wya/http --save
```
## 用法例子
```js
// --- regiserNet.js ---
import { ajaxFn } from '@wya/http';
const loadingFn = (msg) => {
	// loading
};
const loadedFn = () => {
	// loaded
};
const otherFn = () => {
	// to do
};
const defaultOptions = {
	// onLoading: loadingFn,
	// onLoaded: loadedFn,
	// onBefore: beforeFn,
	// onAfter: afterFn,
	// onOther: otherFn,
};
const ajax = ajaxFn(defaultOptions);
let net = {
	ajax
};
export default net;

// --- example ---
import net from './regiserNet';
let cancel;
const request = net.ajax({
	url: `http://localhost:3000/api/test`,
	getCancel: cb => cancel = cb
}).then((res) => {
	console.log(res);
}).catch((res) => {
	console.log(res);
});
// cancel();
```
## API

属性 | 说明 | 类型 | 默认值
---|---|---|---
ajaxFn | 注册函数 | `(defaultOptions = {}) => Func` | -
ajax | ajax函数，请求后可用`.cancel()`取消请求 | `(userOptions = {}) => HotPromise` | -

```js
ajax = ajaxFn();
```

- `ajaxFn` - 参数说明

属性 | 说明 | 类型 | 默认值
---|---|---|---
defaultOptions | 可以给下面的`userOptions`设置些默认值 | obj | -

- `ajax` - 参数说明 - 属性

属性 | 说明 | 类型 | 默认值
---|---|---|---
url | 请求地址`path` | str | -
type | 请求类型 | str | `GET`
param | 参数 | obj | -
async | 请求是否是异步 | bool | `true`
restful | 是否是`restful`, 主动提取`id`字段 | bool | `false`
emptyStr | 是否接收空字符串 | bool | `false`
requestType | `form-data`、`json`、`form-data:json`(POST方式以 `data: JSON.stringify(data)`传递) | str | `form-data`
tipMsg | `提示框` | str | `加载中...`
loading | 执行`loadingFn`和`loadedFn` | boolean | true
localData | 假如数据有缓存，不请求ajax | obj | -

 
- `ajax` - 参数说明 - 方法

属性 | 说明 | 类型 | 默认值
---|---|---|---
onLoading | 请求时回调 | `(options, xhr) => void` | -
onLoaded | 请求完回调，可以把`loading`移除 | `(options, xhr) => void` | -
onBefore | 在调用前改变`options` - 拦截options | `(options, xhr) => Promise` | -
onAfter | 在调用后改变`response` - 拦截response | `(response, options, xhr) => Promise` | -
onOther | `status` !1或!0，以外的情  | `(response, resolve, reject) => void` | -
onProgress | 上传进度回调 | `(e) => void` | -
getInstance | 获取XHR实例 | `(xhr, cancelFn, options) => void` | -



<!--  以下内容无视  -->
[changelog-image]: https://img.shields.io/badge/changelog-md-blue.svg
[changelog-url]: CHANGELOG.md

[npm-image]: https://img.shields.io/npm/v/@wya/http.svg
[npm-url]: https://www.npmjs.com/package/@wya/http
