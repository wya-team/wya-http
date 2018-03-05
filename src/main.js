/**
 * ajax
 * @param  {Func} loadingFn 加载时回调
 * @param  {Func} loadedFn  结束时回调
 * @param  {Func} setCb     结束时且200状态回调，可以设置配置信息，如果返回true，则终止
 * @param  {Func} otherCb   结束时且200状态回调，status其他以外的值回调
 * @param  {Object} opts   	参数
 * @return {type}
 */
// class HotPomise extends Promise { // babel编译会出错，暂时不用
// 	constructor(xhr, fn){
// 		super(fn);
// 		this.xhr = xhr;
// 	}
// 	cancel(){
// 		this.xhr instanceof XMLHttpRequest && (
// 			this.xhr.abort(), 
// 			this.xhr = null, 
// 			console.log(`XMLHttpRequest Abort`)
// 		);
// 	}
// }
const HotPromise = Promise;

export const ajaxFn = (loadingFn, loadedFn, setCb, otherCb, opts = {}) => _opts => {
	// 配置；
	_opts = {
		...opts,
		..._opts	
	};

	let xhr;
	HotPromise.prototype.cancel = () => {
		xhr instanceof XMLHttpRequest && (
			xhr.__ABORTED__ = true,
			xhr.abort(), 
			xhr = null, 
			console.log(`XMLHttpRequest Abort`)
		);
	};
	return new HotPromise(async (resolve, reject) => {
		/**
		 * @param  {String} url 服务地址
		 * @param  {Object} param 参数
		 * @param  {Object} type 请求类型
		 * @param  {Func} onProgress 上传回调
		 * @param  {Bool} noLoading 不执行loadFn
		 * @param  {Str} requestType 请求类型 'json' | 'form-data' | 'form-data:json'
		 * @param  {Str} tipMsg 提示文字
		 */
		const { onBefore, onAfter } = _opts;
		// url配置
		if (onBefore && typeof onBefore === 'function') {
			try {
				_opts = await onBefore(_opts) || _opts;
			} catch (e) {
				console.log(e);
			}
			
		}
		// -- end -- 
		let {
			url,
			param,
			type = 'GET',
			localData,
			onProgress,
			noLoading = false,
			requestType,
			tipMsg,
			headers
		} = _opts;
		let messageError = '网络不稳定，请稍后重试';
		if (!url && !localData) {
			console.error('请求地址不存在');
			reject({
				msg: `开发时提示~参数错误`
			});
			return;
		}
		!noLoading && loadingFn && loadingFn(tipMsg);
		let onDataReturn = async (response) => {
			if (onAfter && typeof onAfter === 'function') {
				try {
					response = await onAfter(response) || response;
				} catch (e) {
					return;
				}
				
			}
			if (setCb) {
				let isExit = setCb(response);
				if (isExit) return;
			}
			// 图片上传时候，调用外部，不太一样
			if (response.state) {
				if (response.state === 'SUCCESS') {
					resolve({
						status: 1,
						data: {
							...response
						}
					});
				} else {
					reject({
						msg: response.state,
						...response
					});
				}
				return;
			}

			// 正常业务流程
			switch (response.status) {
				case 1:
				case true:
					resolve(response);
					return;
				case 0:
				case false:
					reject({
						msg: messageError,
						...response
					});
					return;
				default:
					otherCb && otherCb(response, resolve, reject);
			}
		};

		/**
		 * 如果本地已经从别的地方获取到数据，就不用请求了
		 */
		if (localData) {
			!noLoading && loadedFn && loadedFn();
			onDataReturn(localData);
			return;
		}
		let cgiSt = Date.now();
		let method = type.toUpperCase(); // 默认转化为大写
		let isJson = requestType === 'json';
		let isFormDataJson = requestType === 'form-data:json';
		// 创建服务
		xhr = new XMLHttpRequest();
		try {
			xhr.onreadystatechange = () => {
				if (xhr.readyState == 4) {
					!noLoading && loadedFn && loadedFn(noLoading);
					if (xhr.status >= 200 && xhr.status < 300) {
						// 可以加上try-catch
						try {
							let data = JSON.parse(xhr.responseText);
							onDataReturn(data);
						} catch (e) {
							reject({
								retcode: xhr.status,
								msg: `${messageError}.`
							});
						}
					} else {
						if (xhr.status === 0 && xhr.__ABORTED__ === true){
							// 主动取消
							return;
						}
						reject({
							retcode: xhr.status,
							msg: `${messageError}..`
						});
					}
					xhr = null;
				}
			};

			let paramArray = [],
				paramString = '';
			for (let key in param) {
				/**
						 * 过滤掉值为null,undefined,''情况
						 */
				if (param[key] || param[key] === false || param[key] === 0) {
					paramArray.push(key + '=' + encodeURIComponent(param[key]));
				}
			}
			
			if (method === 'FORM') {
				let formData = new FormData();
				
				// 参数
				if (param.data) {
					Object.keys(param.data).map(key => {
						formData.append(key, param.data[key]);
					});
				}
				
				// 文件　　
				formData.append(param['filename'] || 'Filedata', param['file']);

				xhr.upload.onprogress = (e) => {
					// e.lengthComputable
					if (e.total > 0) {
						e._percent = e.loaded / e.total * 100;
						e.percent = (e._percent).toFixed(2);
					}
					onProgress && onProgress(e);
				};
				xhr.open('POST', url);
				xhr.withCredentials = true;
				
				xhr.setRequestHeader(
					'X-Requested-With', 'XMLHttpRequest'
				);
				xhr.send(formData);
			} else if (method === 'JSONP') {
				method = 'GET';

				if (!param['callback']) {
					reject({
						status: 0
					});
				}

				window[param['callback']] = (data) => {
					onDataReturn(data);
				};
				if (paramArray.length > 0) {
					url += (url.indexOf('?') > -1 ? '&' : '?') + paramArray.join('&');
				}
				let script = document.createElement("script");
				let head = document.getElementsByTagName("head")[0];
				script.src = url;
				head.appendChild(script);
			} else {
				let req = undefined;
				switch (method){
					case 'PUT':
					case 'POST':
						req = typeof param === 'object'
							? JSON.stringify(param)
							: undefined;
						break;
					case 'DELETE':
					case 'GET':
						if (paramArray.length > 0) {
							url += (url.indexOf('?') > -1 ? '&' : '?') + paramArray.join('&');
						}
						break;
					default:
						break;
				}
				xhr.open(method, url, true);
				xhr.withCredentials = true; // 允许发送cookie
				// 跨域资源请求会发生两次 一次是204 可以参考cors // 无视就好
				xhr.setRequestHeader(
					'Content-Type', isJson ? `application/json;charset=utf-8` : `application/x-www-form-urlencoded`
				);
				xhr.setRequestHeader(
					'X-Requested-With', 'XMLHttpRequest'
				);
				for (const h in headers) {
					if (headers.hasOwnProperty(h) && headers[h] !== null) {
						xhr.setRequestHeader(h, headers[h]);
					}
				}
				isJson
					? xhr.send(req)
					: xhr.send(
						method === 'POST' 
							? isFormDataJson 
								? `data=${encodeURIComponent(JSON.stringify(param))}` // 业务需要
								: paramArray.join('&') 
							: undefined);
			}

		} catch (e) {
			console.error(e);
		}
	});
};
export const ajax = ajaxFn();