# wya-fetch
[![npm][npm-image]][npm-url] [![changelog][changelog-image]][changelog-url]

## API

属性 | 说明 | 类型 | 默认值
---|---|---|---
ajaxFn | 注册函数 | `(loadingFn, loadedFn, setCb, otherCb, opts = {}) => Func` | -
ajax | ajax函数，请求后可用`.cancel()`取消请求 | `(_opts = {}) => HotPromise` | -

```js
ajax = ajaxFn();
```

- `ajaxFn` - 参数说明

属性 | 说明 | 类型 | 默认值
---|---|---|---
loadingFn | 请求时回调，`msg`由 `_opts.tipMsg`决定 | `(msg) => void` | -
loadedFn | 请求完回调，可以把`loading`移除 | `() => void` | -
setCb | 请求完回调执行，有response，返回true会中断执行执行 | `(response) => Bool` | -
otherCb | `status` !1或!0，以外的情  | `(response, resolve, reject) => void` | -


- `ajax` - 参数说明

属性 | 说明 | 类型 | 默认值
---|---|---|---
url | 请求地址`path` | str | -
param | 参数 | obj | -
type | 请求类型 | str | -
noLoading | 不执行`loadingFn`和`loadedFn` | str | -
requestType | `form-data`|`json` | str | `form-data`
tipMsg | - | str | -
uploadProgress | - | `() => void` | -
localData | 假如数据有缓存，不请求ajax | obj | -


<!--  以下内容无视  -->
[changelog-image]: https://img.shields.io/badge/changelog-md-blue.svg
[changelog-url]: CHANGELOG.md

[npm-image]: https://img.shields.io/npm/v/wya-fetch.svg
[npm-url]: https://www.npmjs.com/package/wya-fetch
