# \@wya/http
[![npm][npm-image]][npm-url] [![changelog][changelog-image]][changelog-url]

## [Demo](https://wya-team.github.io/wya-http/demo/index.html)

## 安装
```
npm install @wya/http --save
```
## 用法例子
```js
import createHttpClient, { ajax } from '@wya/http';

let cancelCb;

ajax({
	url: 'http://***.com/{id}?userName={user.name}', // 支持动态路由
	type: "GET",
	param: {
		id: '2',
		user: {
			name: 'wya-team',
			age: ''
		}
	},
	requestType: "form-data:json",
	getInstance: ({ xhr, cancel }) => cancelCb = cancel,
	debug: true
}).then((res) => {
	console.log(res, 0);
}).catch((res) => {
	console.log(res);
});

setTimeout(() => {
	cancelCb();
}, 100);
```
## API

属性 | 说明 | 类型 | 默认值
---|---|---|---
createHttpClient | 注册函数 | `(globalOptions = {}) => Func` | -
ajax | ajax函数 | `(userOptions = {}) => Promise` | -

```js
const { ajax } = createHttpClient();
```

- `createHttpClient` - 参数说明

属性 | 说明 | 类型 | 默认值
---|---|---|---
globalOptions | 可以给下面的`userOptions`设置些默认值 | obj | -

- 参数配置原则: `userOptions(single)` > `registerOptions(HOF)` >  `defaultOptions(single)`

- `ajax` - 参数说明 - 属性

属性 | 说明 | 类型 | 默认值
---|---|---|---
url | 请求地址`path` | str | -
type | 请求类型 | str | `GET`
param | 参数 | obj | -
async | 请求是否是异步 | bool | `true`
debug | 测试 | bool | `false`
requestType | `form-data`、`json`、`form-data:json`(POST方式以 `data: JSON.stringify(data)`传递) | str | `form-data`
allowEmptyString | 是否接收空字符串 | bool | `false`
loading | 执行`loadingFn`和`loadedFn` | boolean | true
localData | 假如数据有缓存，不请求ajax | obj | -
apis | - | - | -
responseType | - | - | -
credentials | - | - | -
headers | - | - | -
useXHR | - | - | -
restful | - | - | -
timeout | 单位s | - | - 
delay | 单位s | - | -
 
- `ajax` - 参数说明 - 方法

属性 | 说明 | 类型 | 默认值
---|---|---|---
onLoading | 请求时回调 | `({  options }) => void` | -
onLoaded | 请求完回调，可以把`loading`移除 | `({  options }) => void` | -
onBefore | 在调用前改变`options` - 拦截options | `({ options }) => Promise` | -
onAfter | 在调用后改变`response` - 拦截response | `({ response, options }) => Promise` | -
onOther | `status` !1或!0，以外的情  | `({ response, options }) => void` | -
onProgress | 上传进度回调 | `(e) => void` | -
getInstance | 获取XHR实例 | `({ xhr, options, cancel }) => void` | -



<!--  以下内容无视  -->
[changelog-image]: https://img.shields.io/badge/changelog-md-blue.svg
[changelog-url]: CHANGELOG.md

[npm-image]: https://img.shields.io/npm/v/@wya/http.svg
[npm-url]: https://www.npmjs.com/package/@wya/http
