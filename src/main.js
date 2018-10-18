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
export const ajaxFn = (defaultOptions = {}) => userOptions => {
	// 配置；
	let options = { ...defaultOptions, ...userOptions };
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
		 * @param  {Func} onProgress 上传回调
		 */
		const {
			onBefore,
			onAfter,
			onOther,
			onLoading,
			onLoaded,
			onProgress,
			getXHRInstance
		} = options;
		// url配置
		if (onBefore && typeof onBefore === 'function') {
			try {
				options = await onBefore(options) || options;
			} catch (e) {
				console.log(e);
			}

		}
		// -- end --
		/**
		 * @param  {String} url 服务地址
		 * @param  {Object} param 参数
		 * @param  {Object} type 请求类型
		 * @param  {Bool} loading 执行loadFn
		 * @param  {Str} requestType 请求类型 'json' | 'form-data' | 'form-data:json'
		 * @param  {Str} tipMsg 提示文字
		 */
		let {
			url,
			param,
			type = 'GET',
			localData,
			loading = true,
			requestType,
			responseType, // 'arraybuffer' | 'blob' | 'document' ...
			tipMsg,
			headers,
			async = true,
			restful = false,
			emptyStr = false,
		} = options;

		// 历史遗留api - noLoading
		typeof options.noLoading === 'boolean' && (loading = !options.noLoading);
		
		if (!url && !localData) {
			console.error('请求地址不存在');
			reject({
				msg: `开发时提示~参数错误`
			});
			return;
		}

		let messageError = '网络不稳定，请稍后重试';
		let cgiSt = Date.now();
		let method = type.toUpperCase(); // 默认转化为大写
		let isJson = requestType === 'json';
		let isFormDataJson = requestType === 'form-data:json';

		// restful
		if (restful && method !== 'POST' && param && param.id) {
			let urlArr = url.split('?');
			url = `${urlArr[0]}/${param.id}${urlArr[1] ? `?${urlArr[1]}` : ''}`;
			delete param['id'];
		}

		loading && !localData && onLoading && onLoading(tipMsg);
		let onDataReturn = async (response) => {
			if (onAfter && typeof onAfter === 'function') {
				try {
					response = await onAfter(response, options) || response;
				} catch (e) {
					// ...
					return;
				}

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
					onOther && onOther(response, resolve, reject);
			}
		};

		/**
		 * 如果本地已经从别的地方获取到数据，就不用请求了
		 */
		if (localData) {
			loading && !localData && onLoaded && onLoaded();
			onDataReturn(localData);
			return;
		}
		// 创建服务
		xhr = new XMLHttpRequest();
		try {
			xhr.onreadystatechange = () => {
				getXHRInstance && getXHRInstance(xhr);
				if (xhr.readyState == 4) {
					loading && !localData && onLoaded && onLoaded();
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
				 * 过滤掉值为null, undefined, ''情况
				 */
				if (param[key] || param[key] === false || param[key] === 0  || (emptyStr && param[key] === '') ) {
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
				let fileType = Object.prototype.toString.call(param['file']);
				let fileName = undefined;
				if (fileType === '[object Blob]') {
					fileName = param['file'].name || fileName;
				}
				// 文件　param['name'] || param['filename'] 为了兼容历史问题
				formData.append(param['name'] || param['filename'] || 'Filedata', param['file'], fileName);

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

				for (const h in headers) {
					if (headers.hasOwnProperty(h) && headers[h] !== null) {
						xhr.setRequestHeader(h, headers[h]);
					}
				}

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
				let dataForXHRSend = undefined;
				switch (method){
					case 'PUT':
					case 'POST':
						if (isJson) {
							dataForXHRSend = typeof param === 'object'
								? JSON.stringify(param)
								: undefined;
						} else {
							dataForXHRSend = isFormDataJson
								? `data=${encodeURIComponent(JSON.stringify(param))}` // 业务需要
								: paramArray.join('&');
						}
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
				xhr.open(method, url, async);
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
				xhr.send(dataForXHRSend);
			}

		} catch (e) {
			console.error(e);
		}
	});
};
export const ajax = ajaxFn();
