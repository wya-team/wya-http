// const ERROR_MAP = {
// 	HTTP_URL_EMPTY: '地址为空',
// 	HTTP_SEND_FAILED: '发送失败',
// 	HTTP_TOKEN_EXPIRE: 'token校验失效',
// 	HTTP_FORCE_DESTROY: 'Http释放',
// 	HTTP_RESPONSE_PARSING_FAILED: 'reponse解析出错',
// 	HTTP_RESPONSE_REBUILD_FAILED: 'reponse重构失败',
// 	HTTP_OPTIONS_BUILD_FAILED: 'options重构失败',
// 	HTTP_STATUS_ERROR: '服务器未正常响应',
// 	HTTP_REQUEST_TIMEOUT: '请求超时',
// 	HTTP_CANCEL: '用户取消'
// };

export const ERROR_CODE = {
	HTTP_URL_EMPTY: 'HTTP_URL_EMPTY',
	HTTP_SEND_FAILED: 'HTTP_SEND_FAILED',
	HTTP_TOKEN_EXPIRE: 'HTTP_TOKEN_EXPIRE',
	HTTP_FORCE_DESTROY: 'HTTP_FORCE_DESTROY',
	HTTP_RESPONSE_PARSING_FAILED: 'HTTP_RESPONSE_PARSING_FAILED',
	HTTP_RESPONSE_REBUILD_FAILED: 'HTTP_RESPONSE_REBUILD_FAILED',
	HTTP_OPTIONS_BUILD_FAILED: 'HTTP_OPTIONS_BUILD_FAILED',
	HTTP_STATUS_ERROR: 'HTTP_STATUS_ERROR',
	HTTP_CANCEL: 'HTTP_CANCEL',
	HTTP_REQUEST_TIMEOUT: 'HTTP_REQUEST_TIMEOUT',
};

class HttpError {
	static output = (target = {}, debug) => {
		target.code && debug && console.log(`[@wya/http]: ${target.code}`);
	}
	constructor(options = {}) {
		const {
			status = 0,
			httpStatus,
			msg,
			code,
			exception,
		} = options;

		this.exception = exception;
		this.status = status;
		this.httpStatus = httpStatus;
		this.msg = msg;
		this.code = code;
	}
}

export default HttpError;
