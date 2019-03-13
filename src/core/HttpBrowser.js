import HttpError, { ERROR_CODE } from './HttpError';

class HttpBrowser {
	static http = (opts = {}) => {
		let {
			getInstance,
			onProgress
		} = opts;

		// let fn = (getInstance || onProgress || typeof fetch === 'undefined')  
		// 	? HttpBrowser.xhrInvoke 
		// 	: HttpBrowser.fetchInvoke;

		let fn = HttpBrowser.xhrInvoke;
		return fn(opts);
	}
	static xhrInvoke = (opts = {}) => {
		return new Promise((resolve, reject) => {
			let {
				onLoaded,
				onLoading,
				getInstance,
				onProgress,
				setOver,
				url,
				param,
				method,
				loading = true,
				headers,
				async = true,
				emptyStr = false,
				debug = false,
				isJson,
				isFormDataJson
			} = opts;
			let xhr = new XMLHttpRequest();

			let tag = url;

			debug && console.time(`[@wya/http]: ${tag}`);
			// 用于取消
			getInstance && getInstance({
				xhr,
				options: opts,
				cancel: HttpBrowser.cancel.bind(null, { xhr, options: opts, reject }), 
			});

			xhr.onreadystatechange = () => {
				if (xhr.readyState == 4) {
					loading && onLoaded({ options: opts, xhr });
					if (xhr.status >= 200 && xhr.status < 300) {

						debug && console.timeEnd(`[@wya/http]: ${tag}`);
						resolve(xhr.responseText || "{}");
					} else {
						if (xhr.status === 0 && xhr.__ABORTED__ === true){
							// 主动取消
							return;
						}
						reject(new HttpError({
							code: ERROR_CODE.HTTP_STATUS_ERROR,
							httpStatus: xhr.status,
						}));
					}
					xhr = null;
				}
			};

			let paramArray = [];
			let paramString = '';
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
		});
	}
	static cancel({ xhr, options, reject }) {
		if (xhr instanceof XMLHttpRequest) {
			xhr.__ABORTED__ = true;
			xhr.abort();
			xhr = null;
		} else {
			options.setOver();
		}
		!options.getOver() && reject(new HttpError({
			code: ERROR_CODE.HTTP_CANCEL
		}));
	}
	static fetchInvoke = (opts = {}) => {
		return fetch(opts.url, opts).then((res) => {
			if (typeof res.json === 'function') {
				return res.json();
			}
			return res;
		});
	}
}

export default HttpBrowser;
