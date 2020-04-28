import HttpError, { ERROR_CODE } from '../core/HttpError';
import HttpSuccess from '../core/HttpSuccess';
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
	static http = (options = {}) => {
		return new Promise((resolve, reject) => {
			const { getInstance, responseType, responseExtra, maxContentLength } = options;
			let { transport, body, ...requestOptions } = HttpAdapter.getOptions(options);

			let request;
			let cancel;
			
			let onSuccess = (res = {}, data) => {
				HttpHelper.remove(request);
				resolve(new HttpSuccess({
					data,
					responseExtra,
					httpStatus: res.statusCode,
					headers: res.headers,
					request: res.req || request
				}));
			};

			let onError = (res, code, exception) => {
				HttpHelper.remove(request);
				reject(new HttpError({
					code,
					exception,
					responseExtra,
					httpStatus: res.statusCode,
					headers: res.headers,
					request: res.req || request,
				}));
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

					if (responseType === 'stream') {
						onSuccess(res, { status: 1, data: stream });
					} else {
						let responseBuffer = [];
						stream.on('data', (chunk) => {
							responseBuffer.push(chunk);

							// 如果指定，请确保内容长度不超过maxContentLength
							if (
								maxContentLength > -1 
								&& Buffer.concat(responseBuffer).length > maxContentLength
							) {
								onError(res, ERROR_CODE.HTTP_CONTENT_EXCEEDED);
							}
						});

						stream.on('error', (error) => {
							if (req.aborted) return;
							onError(res, ERROR_CODE.HTTP_STATUS_ERROR, error);
						});

						stream.on('end', () => {
							let responseData = Buffer.concat(responseBuffer);
							if (responseType !== 'arraybuffer') {
								responseData = responseData.toString('utf8');
							}
							onSuccess(res, responseData);
						});
					}
				} else {
					onError(res, ERROR_CODE.HTTP_STATUS_ERROR);
				}
			});

			// Handle errors
			request.on('error', error => {
				if (request.aborted) return;
				onError({}, ERROR_CODE.HTTP_STATUS_ERROR, error);
			});

			cancel = HttpAdapter.cancel.bind(null, { request, reject, options });

			let $param = { cancel, request, options };
			// 用于取消
			getInstance && getInstance($param);	
			HttpHelper.add($param);

			// 可以不注入：用于取消，主要考虑如果已经超时了，没有强制取消，造成资源浪费; 
			options._abort = () => {
				if (
					!request 
					|| request.aborted === true
				) return;

				try {
					request.abort && request.abort();
				} catch (e) { 
					console.error(`[@wya/http]: abort ${e.message}`);
				}
			};

			isStream(body) 
				? body.pipe(request)
				: request.end(body);
		});
	}

	static cancel({ request, options, reject }) {
		HttpHelper.remove(request);
		let error = new HttpError({
			responseExtra: options.responseExtra,
			code: ERROR_CODE.HTTP_CANCEL
		});
		options._setOver && options._setOver(error);
		reject(error);

		request && !request.aborted && request.abort();
	}

	static getOptions = (options = {}) => {
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
			agent, // TODO: Keep-Alive选项
			auth,
			maxRedirects,

			// extra
			transport
		};
	};
}

export default HttpAdapter;
