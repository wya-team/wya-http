import HttpError, { ERROR_CODE } from './HttpError';
import defaultOptions from './defalutOptions';
import { compose, noop } from '../utils';

class HttpShell {
	constructor(registerOptions = {}) {
		const { 
			apis, 
			baseUrl,
			http,
			onBefore,
			onAfter,
			...globalOptions 
		} = registerOptions;

		if (!http) {
			throw new Error('[@wya/http:] http is required');
		}

		this.apis = apis || {};
		this.http = http;
		this.onBefore = onBefore || noop;
		this.onAfter = onAfter || noop;

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
		let options = { ...this.defaultOptions, ...userOptions };

		return this._sendRequest(options)
			.catch((e) => {
				options.debug && HttpError.output(e);
				return Promise.reject(e);
			});
	}

	async _sendRequest(options) {

		this._beforeRequest(options);

		// 超时或者取消请求（会有数据，但不操作)
		let _setOver = null;
		let _timer = null;
		try {
			options = await this._getRequestOptions(options);
			const request = this._getApiPromise(options);

			const cancel = new Promise((_, reject) => {
				_setOver = e => {
					delete options._setOver;
					this._clearTimer(options);
					this._beforeOver(options);
					reject(e);
				};
			});

			// 强制写入，用于结束操作
			options._setOver = _setOver;

			if (options.method === 'FORM') {
				return Promise.race([request, cancel]);
			} else {
				return Promise.race([
					request,
					cancel,
					new Promise((_, reject) => {
						// 强制写入，用于结束超时操作
						options._timer = setTimeout(() => {
							this._beforeOver(options);
							reject(new HttpError({
								code: ERROR_CODE.HTTP_REQUEST_TIMEOUT,
							}));

							// 如果有实例可以取消，强制取消
							options._abort && options._abort();
						}, options.timeout * 1000);
					}),
				]);
			}
		} catch (e) {
			_setOver && _setOver();
			// 强制.catch
			throw new HttpError({ code: ERROR_CODE.HTTP_CODE_ILLEGAL, exception: e });
		}
	}

	_beforeRequest(options = {}) {
		const { localData, loading, onLoading } = options;

		if (!localData && loading) {
			onLoading({ options });
		}
	}

	_beforeOver(options = {}) {
		const { localData, loading, onLoaded } = options;

		if (!localData && loading) {
			onLoaded({ options });
		}
	}

	_clearTimer(options = {}) {
		if (options._timer) {
			clearTimeout(options._timer);
			delete options._timer;
		}
	}

	async _getRequestOptions(options = {}) {
		try {
			const { onBefore } = options;

			// before
			try {
				options = await this.onBefore({ options }) || options;
				options = await onBefore({ options }) || options;
			} catch (e) {
				throw new HttpError({ 
					code: ERROR_CODE.HTTP_OPTIONS_BUILD_FAILED, 
					exception: e 
				});
			}

			let { url, param, type, method, localData, requestType } = options;

			if (!/[a-zA-z]+:\/\/[^\s]*/.test(url)){
				let combo = url.split('?'); // 避免before带上?token=*之类
				url = `${this.apis[combo[0]] || ''}${combo[1] ? `?${combo[1]}` : '' }`;
			}

			if (!url && !localData) {
				throw new HttpError({ 
					code: ERROR_CODE.HTTP_URL_EMPTY, 
				});
			}
			method = (method || type).toUpperCase();

			return {
				...options,
				url,
				method
			};
		} catch (e) {
			// 强制.catch
			throw new HttpError({ code: ERROR_CODE.HTTP_CODE_ILLEGAL, exception: e });
		}
	}

	_getApiPromise(options = {}) {
		const { localData, delay } = options;

		return new Promise((onSuccess, onError) => {
			let temp; // 通常用于请求返回的参数解析不是json时用（结合onAfter强制status: 1）
			let target = localData 
				? Promise.resolve({ 
					data: localData, 
					headers: {}, 
					request: null 
				}) 
				: this.http(options);

			let done = next => res => {
				this._clearTimer(options);
				this._beforeOver(options);
				next(res);
			};

			let delayDone = next => res => {
				typeof delay === 'number' 
					? setTimeout(() => next(res), delay * 1000)
					: next(res);
			};

			let resolve = compose(delayDone, done)(onSuccess);
			let reject = compose(delayDone, done)(onError);

			// 不使用async/await 直观一些
			target
				.then((res) => {
					temp = res;
					let { data, ...extraOptions } = res;
					data = typeof data === 'object' 
						? data
						: JSON.parse(data);

					return {
						...extraOptions,
						...data,
					};
				})
				.catch((e) => {
					return new HttpError({
						...(temp !== null ? temp : {}),
						code: ERROR_CODE.HTTP_RESPONSE_PARSING_FAILED,
						exception: e,
					});
				})
				.then((response) => {
					temp = null;
					// 重新构成结果
					return this._disposeResponse({
						options, 
						response, 
						resolve, 
						reject
					});
				})
				.catch(e => {
					reject(e);
				});
		});
	}

	async _disposeResponse(opts = {}) {
		try {
			let { options, response, resolve, reject } = opts;
			
			// 已经取消
			if (!options.localData && !options._setOver) return;

			let { onOther, onAfter } = options;

			// after
			try {
				response = await onAfter({ response, options }) || response;
				response = await this.onAfter({ response, options }) || response;
			} catch (e) {
				throw new HttpError({
					code: ERROR_CODE.HTTP_RESPONSE_REBUILD_FAILED,
					exception: e,
				});
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
					} else {
						try {
							// 用户自行处理res的值
							let res = await other;
							(res && typeof res === 'object' && (res.status === 1 || res.status === true))
								? resolve(res)
								: reject(res);
						} catch (error) {
							reject(error);
						}
					}
			}
		} catch (e) {
			throw new HttpError({ code: ERROR_CODE.HTTP_CODE_ILLEGAL, exception: e });
		}
	}
}

export default HttpShell;