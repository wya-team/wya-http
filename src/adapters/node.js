import HttpError, { ERROR_CODE } from '../core/HttpError';
import HttpHelper from '../core/HttpHelper';
import { rebuildURLAndParam } from '../utils/index';

// node 内置模块
import http from 'http';
import https from 'https';
import $url from 'url';
import zlib from 'zlib';
import { http as httpFollow, https as httpsFollow } from 'follow-redirects';

const toString = Object.prototype.toString;
const isStream = val => {
	return val !== null 
		&& typeof val === 'object' 
		&& toString.call(val.pipe) === '[object Function]';
};

class HttpAdapter {
	static http = (opts = {}) => {
		return new Promise((resolve, reject) => {
			const { getInstance } = opts;
			let { transport, body, ...requestOptions } = HttpAdapter.getOptions(opts);

			let request;
			let cancel;
			
			let onSuccess = (data) => {
				HttpHelper.remove(request);
				resolve(data);
			};

			let onError = (error) => {
				HttpHelper.remove(request);
				resolve(error);
			};

			request = transport.request(requestOptions, (res) => {
				if (request.aborted) return;
				if (res.statusCode >= 200 && res.statusCode < 300) {
					let stream = res;
					switch (res.headers['content-encoding']) {
						case 'gzip':
						case 'compress':
						case 'deflate':
							stream = stream.pipe(zlib.createUnzip());
							delete res.headers['content-encoding'];
							break;
					}

					if (opts.responseType === 'stream') {
						onSuccess({
							status: 1,
							data: stream
						});
					} else {
						let responseBuffer = [];
						stream.on('data', (chunk) => {
							responseBuffer.push(chunk);

							// 如果指定，请确保内容长度不超过maxContentLength
							if (
								opts.maxContentLength > -1 
								&& Buffer.concat(responseBuffer).length > opts.maxContentLength
							) {
								onError(new HttpError({
									code: ERROR_CODE.HTTP_CONTENT_EXCEEDED,
									httpStatus: res.statusCode
								}));
							}
						});

						stream.on('error', (error) => {
							if (req.aborted) return;
							onError(new HttpError({
								code: ERROR_CODE.HTTP_STATUS_ERROR,
								httpStatus: res.statusCode,
								exception: error,
								// 通常用于maxRedirects = 0时，获取额外的信息
								data: res
							}));
						});

						stream.on('end', () => {
							let responseData = Buffer.concat(responseBuffer);
							if (opts.responseType !== 'arraybuffer') {
								responseData = responseData.toString('utf8');
							}
							onSuccess(responseData);
						});
					}
				} else {
					onError(new HttpError({
						code: ERROR_CODE.HTTP_STATUS_ERROR,
						httpStatus: res.statusCode,
					}));
				}
			});

			// Handle errors
			request.on('error', error => {
				if (request.aborted) return;
				reject(new HttpError({
					code: ERROR_CODE.HTTP_STATUS_ERROR,
					exception: error
				}));
			});

			cancel = HttpAdapter.cancel.bind(null, { request, reject, options: opts });
			let $param = { cancel, request, options: opts };
			// 用于取消
			getInstance && getInstance($param);	
			HttpHelper.add($param);

			isStream(body) 
				? body.pipe(request)
				: request.end(body);
		});
	}

	static cancel({ request, options, reject }) {
		request && !request.aborted && request.abort();

		let error = new HttpError({
			code: ERROR_CODE.HTTP_CANCEL
		});
		options.setOver && options.setOver(error);

		// TODO: 检验如果不reject会不会造成内存泄漏
		// reject();
	}

	static getOptions = (options) => {
		let { agent, method, requestType, maxRedirects } = options;
		let { url, param, paramArray } = rebuildURLAndParam(options);
		let { protocol = 'http:', port, hostname, auth: parseAuth } = $url.parse(url);

		let headers = {
			'Accept': '*/*',
			'User-Agent': '@wya/http' // TODO 可以携带版本号;
		};
		let body = undefined;

		// GET方式仅适用url构造
		if ((/(PUT|POST|DELETE)$/.test(method))) { // PUT + POST + DELETE
			if (param && !isStream(param)) {
				if (Buffer.isBuffer(param)) {
					body = param;
				} else if (toString.call(param) === '[object ArrayBuffer]') {
					body = Buffer.from(new Uint8Array(param));
				} else if (typeof param === 'object') {
					headers['Content-Type'] = `application/json;charset=utf-8`;
					body = Buffer.from(JSON.stringify(param), 'utf-8');
				} else if (typeof param === 'string') {
					headers['Content-Type'] = `application/x-www-form-urlencoded;charset=utf-8`;
					body = Buffer.from(param, 'utf-8');
				}
				headers['Content-Length'] = body.length;
			}
		}

		headers = { ...headers, ...options.headers };

		// HTTP basic authentication
		let auth = undefined;
		if (options.auth) {
			let { username = '', password = '' }  = options.auth;
			auth = `${username}:${password}`;
		} else if (parseAuth) {
			let [username = '', password = ''] = parseAuth.split(':');
			auth = `${username}:${password}`;
		}
		auth && (delete headers.Authorization);

		/**
		 * 清理headers
		 */
		for (const h in headers) {
			if (headers.hasOwnProperty(h) && !headers[h]) {
				delete headers[h];
			}
		}


		const isHttps = protocol === 'https:';
		let transport;

		// 是否重定向
		if (maxRedirects === 0) {
			transport = isHttps ? https : http;
		} else {
			transport = isHttps ? httpsFollow : httpFollow;
		}

		return {
			// for http or https
			hostname,
			port,
			path: url.replace(/^\?/, ''),
			method,
			body,
			headers,
			agent,
			auth,
			maxRedirects,

			// extra
			transport
		};
	};
}

export default HttpAdapter;
