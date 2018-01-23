# 历史版本
### 0.1.8 (2018-01-23)

* 给`requestType`添加选项'form-data:json',`form-data`形式传递的数据再包装成 `data: JSON.stringify(data)`

### 0.1.5 (2018-01-22)

* 处理`Android Native`, `''` -> `undefined`, 后者`undefined`更加友好；
* 添加主动取消`xhr.__ABORTED__ = true`

### 0.1.3 (2018-01-15)

* 使用`XMLHttpRequest`取代`fetch`, 方便跨域

### 0.1.0 (2018-01-02)

* 添加仓库
