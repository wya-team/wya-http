import { noop } from '../utils';

export default {
	url: '',
	apis: {},
	param: null,
	type: 'GET',
	localData: null, // { status: 1, data: {}}
	loading: true,
	requestType: 'json', // json | form-data | form-data:json
	responseType: 'text', // text | 'arraybuffer' | 'blob' | 'document' ...
	credentials: 'include', // cors下请关闭
	headers: {
		// Accept: 'application/json',
	},
	debug: false,
	timeout: 20, // 单位s
	onOther: noop,
	onLoading: noop,
	onLoaded: noop,
	onBefore: noop, // 全局的onBefore优先执行
	onAfter: noop, // 全局的onAfter最后执行
	onProgress: null,
	getInstance: null,
	allowEmptyString: false,
	/**
	 * 返回延迟
	 */
	delay: undefined, // 单位s


	// for browser
	useXHR: false,
	async: true,
	
	// for node
	maxRedirects: undefined,
	
	/**
	 * TODO
	 */
	interval: 0, // 轮询
	onError: noop,
	onSuccess: noop,
	onErrorRetry: noop, // 失败一次重新请求
};