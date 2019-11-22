<p align="center"><image src="https://avatars1.githubusercontent.com/u/34465004?s=400&u=25c4b1279b2f092b368102edac8b7b54dc708d00&v=4" width="128"></p>

# @wya/http
[![npm][npm-image]][npm-url] [![changelog][changelog-image]][changelog-url]

<!--  以下内容无视  -->
[changelog-image]: https://img.shields.io/badge/changelog-md-blue.svg
[changelog-url]: CHANGELOG.md

[npm-image]: https://img.shields.io/npm/v/@wya/http.svg
[npm-url]: https://www.npmjs.com/package/@wya/http

**@wya/http** 是轻量的网络请求库

## 安装
``` shell
$ npm install @wya/http --save
```

## 示例

```javascript
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
	requestType: "json",
	getInstance: ({ xhr, cancel }) => cancelCb = cancel,
	debug: true
}).then((res) => {
	console.log(res, 0);
}).catch((res) => {
	console.log(res);
});

/**
 * 取消回调
 */
cancelCb();
```

## 设置开发环境
克隆仓库之后，运行：

```shell
$ yarn install # 是的，推荐使用 yarn。 :)
```

```shell
# 监听并自动重新构建
$ npm run dev

# 单元测试
$ npm run test

# 构建所有发布文件
$ npm run lib
```

## 项目结构
+ **`assets`**: logo 文件。
+ **`config`**: 包含所有和构建过程相关的配置文件。
+ **`docs`**: 项目主页及文档。
+ **`lib`**: 包含用来发布的文件，执行 `npm run lib` 脚本后，这个目录不会被上传。
+ **`tests`**: 包含所有的测试，单元测试使用
+ **`src`**: 源代码目录。
+ **`demo`**: 在线运行的例子。
+ **`examples`**: 在线运行的源代码。

## API

---

### `createHttpClient` 

`createHttpClient(registerOptions: Object)`

全局注册ajax

+ **registerOptions**: 可配置的参数

*registerOptions:* 规则:
+ **apis**: *String* 全局API的映射
+ **...defaultOptions**: 用于初始化默认的参数

**示例**
```javascript
import createHttpClient from '@wya/http';

let { ajax } = createHttpClient({});

ajax({});
```

---

### `ajax` 

`ajax(userOptions: Object)`

使用默认值，直接使用ajax

+ **userOptions**: 用户的配置信息

**示例**
```javascript
import { ajax } from '@wya/http';

ajax({});
```

---

## Options

### `apis` 

- type: `Object`
- 默认值: `{}`

全局注册的后端接口，

**示例**
```javascript
import createHttpClient from '@wya/http';

let { ajax } = createHttpClient({
	// ...
	apis: {
		'HOME_MAIN_GET': 'github.com'
	}
});
```
---

### `url` 

- type: `String`
- 默认值: `''`

网络请求地址地址

**示例**
```javascript
ajax({
	url: 'http://***.com/{id}?userName={user.name}',
	url: 'HOME_MAIN_GET',
	url: 'github.com'
});
```

---

### `type/method` 

- type: `String`
- 默认值: `GET`

参数

**示例**
```javascript
ajax({
	// ...,
	type: 'GET',
});
```

---

### `param` 

- type: `Object`
- 默认值: `null`

参数

**示例**
```javascript
ajax({
	// ...,
	param: {
		id: 1,
		name: 'wya-team'
	}
});
```

---

### `localData` 

- type: `Object`
- 默认值: `null`

本地数据存在时，不发起请求，直接走相关回调

**示例**
```javascript
ajax({
	// ...,
	localData: {
		status: 1,
		data: {}
	}
});
```

---

### `loading` 

- type: `Boolean`
- 默认值: `true`

用于控制`onLoading`, `onLoaded`两个API

**示例**
```javascript
ajax({
	// ...,
	loading: true
});
```

---

### `requestType` 

- type: `String`
- 默认值: `json`

请求的类型（`form-data|json|form-data:json`）

**示例**
```javascript
ajax({
	// ...,
	requestType: 'json'
});
```

---

### `responseType` 

- type: `String`
- 默认值: `arraybuffer`

`arraybuffer|blob|document`

**示例**
```javascript
ajax({
	// ...,
	responseType: 'arraybuffer'
});
```
---

### `credentials` 

- type: `String`
- 默认值: `include`

请求时相关证书，`include/omit/...`

**示例**
```javascript
ajax({
	// ...,
	credentials: 'include'
});
```

---

### `headers` 

- type: `Object`
- 默认值: `{}`

请求头

**示例**
```javascript
ajax({
	// ...,
	headers: {
		'Accept': '*/*',
		'X-Requested-With': 'XMLHttpRequest'
	}
});
```

---

### `useXHR` 

- type: `Boolean`
- 默认值: `false`

使用XMLHttpRequest

**示例**
```javascript
ajax({
	// ...,
	useXHR: true
});
```

--- 

### `async` 

- type: `Boolean`
- 默认值: `true`

异步请求

**示例**
```javascript
ajax({
	// ...,
	async: true
});
```

--- 

### `restful` 

- type: `Boolean`
- 默认值: `false`

restful风格

**示例**
```javascript
ajax({
	// ...,
	restful: true
});
```

--- 

### `debug` 

- type: `Boolean`
- 默认值: `false`

调试模式（目前是输出错误日志和时间）

**示例**
```javascript
ajax({
	// ...,
	debug: true
});
```

--- 

### `timeout` 

- type: `Number`
- 默认值: `20`
- 单位秒

超时时间设置

**示例**
```javascript
ajax({
	// ...,
	timeout: 20
});
```

--- 

### `allowEmptyString` 

- type: `Boolean`
- 默认值: `false`

允许支持空字符串

**示例**
```javascript
ajax({
	// ...,
	allowEmptyString: true
});
```

--- 

### `delay` 

- type: `Number`
- 默认值: `0`

延迟返回结果

**示例**
```javascript
ajax({
	// ...,
	delay: true
});
```

---

### `getInstance` 
### `getInstance({ options: Object， xhr: Object?, cancel: Function })` 

- type: `Function`
- 默认值: `null`

获取当前实例，可用取消

**示例**
```javascript
ajax({
	// ...,
	getInstance: () => {
		
	}
});
```

### `onLoading` 

- `onLoading(options: Object)` 
- type: `Function`

加载时的回调

**示例**
```javascript
ajax({
	// ...,
	onLoading: () => {}
});
```

### `onLoaded` 
- `onLoaded(options: Object)` 
- type: `Function`

加载后的回调

**示例**
```javascript
ajax({
	// ...,
	onLoaded: () => {}
});
```
---

### `onBefore`
- `onBefore(options: Object)` 
- type: `Function`

加载前可以构造options;

**示例**
```javascript
ajax({
	// ...,
	onBefore: (options: opts) => {}
});
```
---

### `onAfter`

`onAfter(options: Object)` 

- type: `Function`

数据加载完成后的触发;

**示例**
```javascript
ajax({
	// ...,
	onAfter: (options: opts) => {}
});
```

--- 

### `onSuccess`

- `onSuccess(response: Object, resolve: Function, reject: Function)` 

- type: `Function`

成功的状态回调，目前采用then的形式
TODO: 成功场景下，取代then用onSuccess

**示例**
```javascript
ajax({
	// ...,
	onSuccess: () => {}
});
```

--- 

### `onError`

- `onError(response: Object, resolve: Function, reject: Function)` 
- type: `Function`

失败的状态回调，目前采用catch的形式

**示例**
```javascript
ajax({
	// ...,
	onError: () => {}
});
```

--- 

### `onOther`

- `onOther(response: Object, resolve: Function, reject: Function)` 

- type: `Function`

status 不为0或1执行的回调

TODO: 结合轮询场景下，取代then用onSuccess

**示例**
```javascript
ajax({
	// ...,
	onOther: () => {}
});
```

---

### `onProgress`

- `onProgress(options: Object)` 
- type: `Function`
- 默认值: `null`

数据加载完成后的触发;

**示例**
```javascript
ajax({
	// ...,
	onProgress: (options: opts) => {}
});
```

## 开源许可类型
MIT

## FAQ
Q: ？  
A: 。


