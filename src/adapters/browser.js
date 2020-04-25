import HttpError, { ERROR_CODE } from '../core/HttpError';
import HttpHelper from '../core/HttpHelper';
import { rebuildURLAndParam } from '../utils/index';

class HttpAdapter {
	static http = (opts = {}) => {
		let {
			getInstance,
			method,
			useXHR
		} = opts;

		let fn = (useXHR || /(JSONP|FORM)$/.test(method) || typeof fetch === 'undefined')  
			? HttpAdapter.XHRInvoke 
			: HttpAdapter.fetchInvoke;

		// let fn = HttpAdapter.XHRInvoke;
		return fn(opts);
	}

	static XHRInvoke = (opts = {}) => {
		return new Promise((resolve, reject) => {
			let {
				getInstance,
				onProgress,
				url,
				param,
				method,
				headers,
				async,
				debug,
				credentials
			} = opts;

			let xhr = new XMLHttpRequest();
			let cancel = HttpAdapter.cancel.bind(null, { xhr, options: opts, reject });
			let $param = { xhr, cancel, request: xhr, options: opts };

			let tag = `${url}: ${new Date().getTime()}`;

			debug && console.time(`[@wya/http]: ${tag}`);
			// 用于取消
			getInstance && getInstance($param);
			HttpHelper.add($param);

			xhr.onreadystatechange = () => {
				if (xhr.readyState == 4) {
					if (xhr.status >= 200 && xhr.status < 300) {
						debug && console.timeEnd(`[@wya/http]: ${tag}`);
						/**
						 * TODO: 内部解析XML
						 */
						resolve(xhr.responseText || { httpStatus: xhr.status });
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
					HttpHelper.remove(xhr);
					xhr = null;
				}
			};

			const result = HttpAdapter.getOptions(opts); 

			if (method === 'JSONP') {
				if (!param['callback']) {
					reject({
						status: 0
					});
				}

				window[param['callback']] = (data) => {
					resolve(data);
				};
				let script = document.createElement("script");
				let head = document.getElementsByTagName("head")[0];
				script.src = result.url;
				head.appendChild(script);
				return;
			} 

			if (method === 'FORM') {
				xhr.upload.onprogress = (e) => {
					// e.lengthComputable
					if (e.total > 0) {
						e._percent = e.loaded / e.total * 100;
						e.percent = (e._percent).toFixed(2);
					}
					onProgress && onProgress(e);
				};
			}
			xhr.open(result.method, result.url, async);
			xhr.withCredentials = credentials === 'omit' ? false : !!credentials;

			for (const h in result.headers) {
				if (result.headers.hasOwnProperty(h)) {
					xhr.setRequestHeader(h, result.headers[h]);
				}
			}

			xhr.send(result.body);
		});
	}
	static cancel({ xhr, options, reject }) {
		if (xhr instanceof XMLHttpRequest) {
			xhr.__ABORTED__ = true;
			xhr.abort();
			xhr = null;
		}
		options.setOver && options.setOver(new HttpError({
			code: ERROR_CODE.HTTP_CANCEL
		}));

		// TODO: 检验如果不reject会不会造成内存泄漏
		// reject();
	}
	static fetchInvoke = (opts = {}) => {
		const {
			debug,
			credentials,
			getInstance
		} = opts;
		let { url, headers, body, method } = HttpAdapter.getOptions(opts);

		let tag = `${opts.url}: ${new Date().getTime()}`;

		debug && console.time(`[@wya/http]: ${tag}`);

		return new Promise((resolve, reject) => {
			let request;
			let cancel; 
			/**
			 * bug fix
			 * iOS 10 fetch() 没有finally方法
			 * 使用@babel/polyfill修复Promise，无法修复fetch，可以是fetch内部实现了一套Promise
			 */
			let finallyHack = () => {
				HttpHelper.remove(request);
				debug && console.timeEnd(`[@wya/http]: ${tag}`);
			};
							
			request = fetch(url, { headers, body, credentials, method }).then((res = {}) => {
				if (res.status >= 200 && res.status < 300) {
					// 这里不用res.json, 与xhr同步
					res.text()
						.then(responseText => {
							resolve(responseText);
						})
						.catch(error => {
							reject(new HttpError({
								code: ERROR_CODE.HTTP_RESPONSE_PARSING_FAILED,
								httpStatus: res.status,
								exception: error
							}));
						});
				} else {
					reject(new HttpError({
						code: ERROR_CODE.HTTP_STATUS_ERROR,
						httpStatus: res.status,
					}));
				}
				finallyHack();
			}).catch((res) => { // 跨域或其他
				reject(new HttpError({
					code: ERROR_CODE.HTTP_STATUS_ERROR,
					httpStatus: res.status,
				}));
				finallyHack();
			});

			cancel = HttpAdapter.cancel.bind(null, { options: opts, reject });
			let $param = { cancel, request, options: opts };
			// 用于取消
			getInstance && getInstance($param);	
			HttpHelper.add($param);
		});
	}
	static getOptions = (options) => {
		let { requestType, method } = options;

		let isJson = requestType === 'json';
		let isFormDataJson = requestType === 'form-data:json';

		let { url, param, paramArray } = rebuildURLAndParam(options);

		let headers = {
			'Accept': '*/*',
			'X-Requested-With': 'XMLHttpRequest'
		};
		let body = undefined;

		// 主动添加Header
		if ((/(PUT|POST|DELETE)$/.test(method))) { // PUT + POST + DELETE
			headers['Content-Type'] = `application/json${isJson ? ';charset=utf-8' : 'x-www-form-urlencoded' }`;
			if (isJson) {
				body = typeof param === 'object'
					? JSON.stringify(param)
					: undefined;
			} else {
				body = isFormDataJson
					? `data=${encodeURIComponent(JSON.stringify(param))}` // 业务需要
					: paramArray.join('&');
			}
		} else if (method === 'FORM') {
			// 自动生成代码片段‘multipart/form-data’, 携带boundary=[hash], 否则后端无法接受
			headers['Content-Type'] = null;
			method = 'POST';

			let formData = new FormData();

			// 参数
			if (param) {
				Object.keys(param).map(key => {
					let fileName = undefined;
					if (param[key] instanceof Blob) { // File or Blob
						fileName = param[key].name || fileName;
					}
					fileName 
						? formData.append(key, param[key], fileName)
						: formData.append(key, param[key]); // 特殊处理
				});
			}
			body = formData;
		}

		// HTTP basic authentication
		if (options.auth) {
			let { username = '', password = '' }  = options.auth;
			headers.Authorization = 'Basic ' + window.btoa(username + ':' + password);
		}

		headers = { ...headers, ...options.headers };
		/**
		 * 清理headers
		 */
		for (const h in headers) {
			if (headers.hasOwnProperty(h) && !headers[h]) {
				delete headers[h];
			}
		}

		return {
			url,
			method,
			headers,
			body
		};
	};
}

export default HttpAdapter;
