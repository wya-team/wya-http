export default {
	url: '',
	apis: {},
	param: null,
	type: 'GET',
	localData: null, // { status: 1, data: {}}
	loading: true,
	requestType: 'json',
	responseType: 'arraybuffer', // 'arraybuffer' | 'blob' | 'document' ...
	credentials: 'include', // cors下请关闭
	headers: {
		// Accept: 'application/json',
	},
	useXHR: false,
	async: true,
	restful: false,
	debug: false,
	timeout: 20, // 单位s
	onError: () => {},
	onOther: () => {},
	onLoading: () => {},
	onLoaded: () => {},
	onBefore: null,
	onAfter: null,
	onProgress: null,
	getInstance: null,
	allowEmptyString: false,
	/**
	 * 返回延迟
	 */
	delay: undefined, // 单位s
};