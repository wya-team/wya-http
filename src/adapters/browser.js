import HttpError, { ERROR_CODE } from '../core/HttpError';
import HttpSuccess from '../core/HttpSuccess';
import HttpHelper from '../core/HttpHelper';
import { rebuildURLAndParam } from '../utils/index';

class HttpAdapter {
	static http = (options = {}) => {
		let {
			getInstance,
			method,
			useXHR,
			onProgress,
			async,
			responseType,
		} = options;

		let fn = (
			useXHR
			|| async === false
			|| typeof onProgress === 'function' 
			|| /(JSONP|FORM)$/.test(method) 
			|| typeof fetch === 'undefined'
			|| responseType === 'arraybuffer'
		)  
			? HttpAdapter.XHRInvoke 
			: HttpAdapter.fetchInvoke;

		// let fn = HttpAdapter.XHRInvoke;
		return fn(options);
	}

	static XHRInvoke = (options = {}) => {
		return new Promise((resolve, reject) => {
			const { getInstance, onProgress, async, debug, timeout, credentials, responseType, responseExtra } = options;
			const { url, method, headers, body } = HttpAdapter.getOptions(options); 

			let request = new XMLHttpRequest();
			let cancel = HttpAdapter.cancel.bind(null, { request, options, reject });
			let $param = { cancel, request, options };

			let tag = `${options.url}: ${new Date().getTime()}`;

			debug && console.time(`[@wya/http]: ${tag}`);
			// 用于取消
			getInstance && getInstance($param);
			HttpHelper.add($param);

			let onSuccess = (data) => {
				HttpHelper.remove(request);
				resolve(new HttpSuccess({
					data,
					responseExtra,
					httpStatus: request.status,
					headers: {},
					request
				}));

				request = null;
			};

			let onError = (code, exception) => {
				HttpHelper.remove(request);
				reject(new HttpError({
					code,
					exception,
					responseExtra,
					httpStatus: request.status,
					headers: {},
					request,
				}));

				request = null;
			};

			request.onreadystatechange = () => {
				if (
					!request 
					|| request.readyState !== 4
					|| (request.status === 0 && request.__ABORTED__ === true) // 主动取消
				) return;

				if (request.status >= 200 && request.status < 300) {
					debug && console.timeEnd(`[@wya/http]: ${tag}`);
					
					let data = !responseType || responseType === 'text' 
						? request.responseText
						: request.response;

					onSuccess(data);
				} else {
					onError(ERROR_CODE.HTTP_STATUS_ERROR);
				}
			};

			// Clean up request
			let createClean = (code) => (error) => {
				if (!request || request.__ABORTED__) return;
				onError(code, error);
			};
			request.onabort = createClean(ERROR_CODE.HTTP_CANCEL);
			request.onerror = createClean(ERROR_CODE.HTTP_STATUS_ERROR);
			request.ontimeout = createClean(ERROR_CODE.HTTP_REQUEST_TIMEOUT);

			if (options.method === 'JSONP') {
				if (!options.param['callback']) {
					onError(ERROR_CODE.HTTP_CODE_ILLEGAL);
				}

				window[options.param['callback']] = onSuccess;
				let script = document.createElement("script");
				let head = document.getElementsByTagName("head")[0];
				script.src = url;
				head.appendChild(script);
				return;
			} 

			if (typeof onProgress === 'function') {
				if (options.method === 'FORM') {
					request.upload && request.upload.addEventListener('progress', (e) => {
						// e.lengthComputable
						if (e.total > 0) {
							e._percent = e.loaded / e.total * 100;
							e.percent = (e._percent).toFixed(2);
						}
						onProgress(e);
					});
				} else {
					request.addEventListener('progress', onProgress);
				}
			}
			
			request.open(method, url, async);
			request.withCredentials = credentials === 'omit' ? false : !!credentials;

			if (options.method !== 'FORM') {
				try {
					request.timeout = timeout * 1000;
				} catch (e) {
					// 目前发现async下是不支持的
					process.env.NODE_ENV !== 'test' 
						&& console.error(`[@wya/http]: timeout not allowed`);
				}
			}

			if (responseType) {
				try {
					request.responseType = responseType;
				} catch (e) {
					process.env.NODE_ENV !== 'test' 
						&& console.error(`[@wya/http]: ${responseType} responseType not allowed`);
				}
			}

			for (const h in headers) {
				if (headers.hasOwnProperty(h)) {
					request.setRequestHeader(h, headers[h]);
				}
			}

			// 可以不注入：用于取消，主要考虑如果已经超时了，没有强制取消，造成资源浪费; 
			options._abort = () => {
				if (
					!request 
					|| request.status !== 0 // 是否结束状态，异常Error时也是0
					|| request.__ABORTED__ === true
				) return;

				try {
					request.abort && request.abort();
				} catch (e) { 
					console.error(`[@wya/http]: abort ${e.message}`);
				}
			};

			request.send(body);
		});
	}
	static cancel({ request, options, reject, controller }) {
		HttpHelper.remove(request);

		let error = new HttpError({
			code: ERROR_CODE.HTTP_CANCEL,
			responseExtra: options.responseExtra,
			request,
		});
		options._setOver && options._setOver(error);
		reject(error);

		// xhr
		if (request instanceof XMLHttpRequest) {
			request.__ABORTED__ = true;
			request.abort();
		}

		// fetch
		if (controller) {
			controller.__ABORTED__ = true;
			controller.abort();
		}
	}
	static fetchInvoke = (options = {}) => {
		const { debug, credentials, responseExtra, getInstance } = options;
		const { url, headers, body, method, mode } = HttpAdapter.getOptions(options);

		let tag = `${options.url}: ${new Date().getTime()}`;

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

			let onSuccess = (res, data) => {
				resolve(new HttpSuccess({
					data,
					responseExtra,
					httpStatus: res.status,
					headers: {},
					request
				}));

				finallyHack();
				request = null;
			};

			let onError = (res, code, exception) => {
				reject(new HttpError({
					code,
					exception,
					responseExtra,
					httpStatus: res.status,
					headers: {},
					request,
				}));

				finallyHack();
				request = null;
			};
			let controller = { signal: undefined };

			if (typeof AbortController !== 'undefined') {
				controller = new AbortController();
			}
							
			request = fetch(url, { 
				headers, 
				body, 
				credentials, 
				method,
				mode,
				signal: controller.signal,
			}).then((res = {}) => {
				if (res.status >= 200 && res.status < 300) {
					res.text()
						.then(data => {
							onSuccess(res, data);
						})
						.catch(error => {
							onError(res, ERROR_CODE.HTTP_RESPONSE_PARSING_FAILED, error);
						});
				} else {
					onError(res, ERROR_CODE.HTTP_STATUS_ERROR);
				}
			}).catch((error) => { // 跨域或其他
				// 主动取消
				if (controller.__ABORTED__ !== true) {
					onError({}, ERROR_CODE.HTTP_STATUS_ERROR, error);
				}
			});

			cancel = HttpAdapter.cancel.bind(null, { 
				options, 
				reject, 
				request,
				controller 
			});
			let $param = { cancel, request, options };
			// 用于取消
			getInstance && getInstance($param);	
			HttpHelper.add($param);
		});
	}
	static getOptions = (options = {}) => {
		let { requestType, method, mode } = options;

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
			headers['Content-Type'] = `application/${isJson ? 'json' : 'x-www-form-urlencoded' };charset=utf-8`;
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

		// XMLHttpRequest 不支持 no-cors mode, 只有 fetch 支持
		// https://stackoverflow.com/questions/68800892/how-to-add-mode-no-cors-to-xmlhttprequest
		return {
			url,
			method,
			headers,
			body,
			mode
		};
	};
}

export default HttpAdapter;
