# 历史版本

### 1.0.12 (2019-03-18)
* `xhr.responseText`为空时, 返回 -> `{ httpStatus }` 
* `emptyStr` -> `allowEmptyString`

### 1.0.4 (2019-03-18)
* 移除 restful API -> `/{books_id}/{article_id}` 
* `emptyStr` -> `allowEmptyString`

### 1.0.0 (2019-03-10)
* `wya-fetch` -> `@wya/http`

- ajaxFn -> createHTTPClient
- 所有的错误状态都会进入catch
- 除onProgress, 其他hook参数均接受对象, 参考文档

### 0.3.0 (2018-08-07)

* ajaxFn 只接收 `defaultOptions`

### 0.2.0 (2018-08-06)

* 增加API`emptyStr`
* 增加API`restful`
* 增加API`async`
* 去除API`setCb`

### 0.1.12 (2018-01-23)

* 增加API`onBefore`, 类型`func`, 返回值必须是`Promise`; `async/await`去兼容RN/AsyncStorage返回是Promise的情况；即`(opts) => Promise`
* 增加API`onAfter`, 类型`func`, 返回值必须是`Promise`;

### 0.1.8 (2018-01-23)

* 给`requestType`添加选项'form-data:json',`form-data`形式传递的数据再包装成 `data: JSON.stringify(data)`

### 0.1.5 (2018-01-22)

* 处理`Android Native`, `''` -> `undefined`, 后者`undefined`更加友好；
* 添加主动取消`xhr.__ABORTED__ = true`

### 0.1.3 (2018-01-15)

* 使用`XMLHttpRequest`取代`fetch`, 方便跨域

### 0.1.0 (2018-01-02)

* 添加仓库
