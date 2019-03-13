export default {
	url: '',
	apis: {},
	param: null,
	type: 'GET',
	localData: null,
	loading: true,
	requestType: 'json',
	responseType: 'arraybuffer', // 'arraybuffer' | 'blob' | 'document' ...
	headers: {},
	async: true,
	restful: false,
	emptyStr: false,
	debug: false,
	timeout: 20000,
	onError: () => {},
	onOther: () => {},
	onLoading: () => {},
	onLoaded: () => {},
	onBefore: null,
	onAfter: null,
	onProgress: null,
	getInstance: null
};