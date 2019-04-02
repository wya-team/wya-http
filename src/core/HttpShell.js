import HttpError, { ERROR_CODE } from './HttpError';
import HttpAdapter from './HttpAdapter';
import defaultOptions from './defalutOptions';

class HttpShell {
	constructor(registerOptions = {}) {
		const { 
			apis, 
			baseUrl,
			http,
			...globalOptions 
		} = registerOptions;

		this.apis = apis || {};

		// 默认fetch
		this.http = http || HttpAdapter.http;

		// 与全局配置, 重新生成默认配置
		this.defaultOptions = {
			...defaultOptions,
			...globalOptions
		};

		const allowMethod = ['get', 'post', 'put', 'delete', 'option', 'form'];

		allowMethod.forEach(i => {
			this[i] = (opts = {}) => {
				return this.ajax({ ...opts, type: i.toUpperCase() });
			};
		});
	}

	ajax(userOptions = {}) {
		return this._sendRequest({ ...this.defaultOptions, ...userOptions });
	}

	async _getRequestOptions(opts = {}) {
		try {
			const { onBefore } = opts;

			// before
			if (onBefore && typeof onBefore === 'function') {
				try {
					opts = await onBefore({ options: opts }) || opts;
				} catch (e) {
					throw new HttpError({ 
						code: ERROR_CODE.HTTP_OPTIONS_BUILD_FAILED, 
						exception: e 
					});
				}
			}

			let { url, param, type, localData, requestType, restful } = opts;

			if (!/[a-zA-z]+:\/\/[^\s]*/.test(url)){
				url = this.apis[url];
			}


			if (!url && !localData) {
				throw new HttpError({ 
					code: ERROR_CODE.HTTP_URL_EMPTY, 
				});
			}
			let method = type.toUpperCase();

			return {
				...opts,
				url,
				method
			};
		} catch (e) {
			// 强制.catch
			throw new HttpError({ code: ERROR_CODE.HTTP_CODE_ILLEGAL, exception: e });
		}
	}

	async _sendRequest(opts) {
		// 超时或者取消请求（会有数据，但不操作)
		let setOver = null;
		try {
			opts = await this._getRequestOptions(opts);
			const request = this._getApiPromise(opts);

			const cancel = new Promise((_, reject) => setOver = e => (delete opts.setOver, reject(e)));
			opts.setOver = setOver;

			if (opts.method === 'FORM') {
				return Promise.race([request, cancel]);
			} else {
				return Promise.race([
					request,
					cancel,
					new Promise((_, reject) => {
						setTimeout(() => {
							reject(new HttpError({
								code: ERROR_CODE.HTTP_REQUEST_TIMEOUT,
							}));
						}, opts.timeout);
					}),
				]);
			}
		} catch (e) {
			setOver && setOver();
			// 强制.catch
			throw new HttpError({ code: ERROR_CODE.HTTP_CODE_ILLEGAL, exception: e });
		}
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
					// 参数解析错误, 网络状态错误
					return new HttpError({
						code: ERROR_CODE.HTTP_RESPONSE_PARSING_FAILED,
						exception: e,
					});
				}).then((response) => {
					this._disposeResponse({
						response, 
						options, 
						resolve, 
						reject
					}).catch((res) => {
						reject(res);
					});
				});
		});
	}

	async _disposeResponse(opts = {}) {
		try {
			let { options, response, resolve, reject } = opts;
			
			// 已经取消
			if (!options.localData && !options.setOver) return;

			let { onOther, onAfter } = options;
			if (onAfter && typeof onAfter === 'function') {
				try {
					response = await onAfter({ response, options }) || response;
				} catch (e) {
					throw new HttpError({
						code: ERROR_CODE.HTTP_RESPONSE_REBUILD_FAILED,
						exception: e,
					});
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
					reject(response);
					HttpError.output(response, options.debug);
					return;
				default:
					let other = onOther && onOther({ response, resolve, reject });
					if (!other || typeof other !== 'object' || !other.then) {
						let error = {
							...new HttpError({
								code: ERROR_CODE.HTTP_FORCE_DESTROY,
							}),
							...response
						};
						// 强制释放内存
						reject(error);
						HttpError.output(error, options.debug);
					} else {
						// 用户自行处理res的值
						other.then(res => {
							(res && typeof res === 'object' && (res.status === 1 || res.status === true))
								? resolve(res)
								: reject(res);
						}).catch(e => reject(e));
					}
			}
		} catch (e) {
			throw new HttpError({ code: ERROR_CODE.HTTP_CODE_ILLEGAL, exception: e });
		}
	}
}

export default HttpShell;