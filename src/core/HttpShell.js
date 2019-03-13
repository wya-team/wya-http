import HttpError, { ERROR_CODE } from './HttpError';
import defaultOptions from './defalutOptions';
class HttpShell {
	constructor(opts = {}) {
		const {
			apis,
			baseUrl,
			http,
		} = opts;
		this.apis = apis || {};

		// 默认fetch
		this.http = http;

		const allowMethod = ['get', 'post', 'put', 'delete', 'option', 'form'];

		allowMethod.forEach(i => {
			this[i] = (opts = {}) => {
				return this.ajax({ ...opts, type: i.toUpperCase() });
			};
		});
	}

	ajax(opts = {}) {
		return this._sendRequest({ ...defaultOptions, ...opts });
	}

	async _getRequestOptions(opts = {}) {
		try {
			const { onBefore } = opts;

			// before
			if (onBefore && typeof onBefore === 'function') {
				try {
					opts = await onBefore({ options: opts }) || opts;
				} catch (e) {
					throw new Error(ERROR_CODE.HTTP_OPTIONS_BUILD_FAILED);
				}
			}

			let { url, apis = {}, param, type, localData, requestType, restful } = opts;

			if (!/[a-zA-z]+:\/\/[^\s]*/.test(url)){
				url = apis[url];
			}


			if (!url && !localData) {
				throw new Error(ERROR_CODE.HTTP_URL_EMPTY);
			}

			// todo 是否移入HttpBrowser
			let method = type.toUpperCase();
			let isJson = requestType === 'json';
			let isFormDataJson = requestType === 'form-data:json';

			if (restful && method !== 'POST' && param && param.id) {
				let urlArr = url.split('?');
				url = `${urlArr[0]}/${param.id}${urlArr[1] ? `?${urlArr[1]}` : ''}`;
				delete param['id'];
			}

			return {
				...opts,
				url,
				method,
				isJson,
				isFormDataJson
			};
		} catch (e) {
			// 强制.then
			return {
				...opts,
				localData: new HttpError({ code: e.message, exception: e })
			};
		}
	}

	async _sendRequest(opts) {
		// 超时或者取消请求（会有数据，但不操作）
		let isOver = false;
		const setOver = (error) => {
			isOver = true;
		};

		opts.setOver = setOver;
		opts.getOver = () => isOver;

		try {
			opts = await this._getRequestOptions(opts);
			const request = this._getApiPromise(opts);
			if (opts.method === 'FORM') {
				return request;
			} else {
				return this._sendRequestWithTimeOut(opts, request);
			}
		} catch (e) {
			setOver();
			// 强制.then
			return {
				...opts,
				localData: new HttpError({ code: ERROR_CODE.HTTP_SEND_FAILED, exception: e })
			};
		}
	}

	_sendRequestWithTimeOut(options, request) {
		return Promise.race([
			request,
			new Promise((_, reject) => { // eslint-disable-line
				setTimeout(() => {
					const error = new HttpError({
						code: ERROR_CODE.HTTP_REQUEST_TIMEOUT,
					});
					reject(error);
					options.setOver(error);
				}, options.timeout);
			}),
		]);
	}

	_getApiPromise(options) {

		const { localData } = options;

		return new Promise((resolve, reject) => {
			if (localData) {
				this._disposeResponse({
					response: localData, 
					options, 
					resolve, 
					reject,
				});
				return;
			}
			this.http(options)
				.then((response) => {
					return typeof response === 'object' 
						? response
						: JSON.parse(response);
				}).catch((e) => {
					const error = e instanceof HttpError
						? e 
						: new HttpError({
							code: ERROR_CODE.HTTP_RESPONSE_PARSING_FAILED,
							exception: e,
						});
					HttpError.output(error, options.debug);
					reject(error);
					options.setOver(error);
				}).then((response) => {
					this._disposeResponse({
						response, 
						options, 
						resolve, 
						reject
					});
				});
		});
	}

	async _disposeResponse(opts = {}) {
		let { options, response, resolve, reject } = opts;
		let { onOther, onAfter, getOver, setOver } = options;
		if (onAfter && typeof onAfter === 'function') {
			try {
				response = await onAfter({ response, options }) || response;
			} catch (e) {
				const error = new HttpError({
					code: ERROR_CODE.HTTP_RESPONSE_REBUILD_FAILED,
					exception: e,
				});
				reject(error);
			}
		}
		// http 已被取消
		if (getOver && getOver()) return;
		getOver && setOver();
		// 正常业务流程
		switch (response.status) {
			case 1:
			case true:
				resolve(response);
				return;
			case 0:
			case false:
				reject(response);
				HttpError.output(response, options.debug);
				return;
			default:
				let error = {
					...new HttpError({
						code: ERROR_CODE.HTTP_FORCE_DESTROY,
					}),
					...response
				};
				// 强制释放内存
				reject(error);
				HttpError.output(error, options.debug);
				
				// reject(response);
				onOther && onOther({
					response, 
				});
		}
	}
}

export default HttpShell;