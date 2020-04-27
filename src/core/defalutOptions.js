import { noop } from '../utils';

export default {
	/**
	 * 请求地址
	 */
	url: '',

	/**
	 * 用于映射url
	 * 如: {
	 * 	HOME_MAIN_GET: '/home/main'
	 * }
	 * url可以写成 -> url: 'HOME_MAIN_GET'
	 *
	 * 适用于全局注册的时候注入
	 */
	apis: {},

	/**
	 * 参数，没有 query 和 body 区分;
	 * GET请求时，param作用在url上
	 * 支持动态参数，如url: '/repo/:books_id?/:article_id?page={page}'
	 */
	param: null,

	/**
	 * 也可以用method
	 */
	type: 'GET',

	/**
	 * 如：{ status: 1, data: {}}
	 */
	localData: null,

	/**
	 * 与onBefore和onAfter语义区分;
	 * 提供onLoading和onLoaded钩子
	 */
	loading: true,

	/**
	 * 请求类型
	 * json | form-data | form-data:json
	 */
	requestType: 'json',

	/**
	 * 默认值text
	 * 如果接收到不是json文本，开发人员可以用onAfter进行额外处理
	 * json | text | arraybuffer | blob | document ...
	 */
	responseType: 'text',
	/**
	 * cors下请关闭
	 */
	credentials: 'include',
	
	/**
	 * browser 和 node 默认值略有区别
	 */
	headers: {},

	/**
	 * 用于打印日志
	 */
	debug: false,

	/**
	 * 超时时间：单位s
	 * type: 'FORM'时，不限制时间
	 */
	timeout: 20,

	/**
	 * 不过滤 ''
	 */
	allowEmptyString: false,

	/**
	 * 特殊场景
	 * 返回延迟, 单位s
	 * 对于请求完，需延迟回调的处理
	 * 取代开发写setTimeout
	 */
	delay: undefined,

	/**
	 * 获取实例的方法
	 * ({ request, options, cancel }) => void 0
	 */
	getInstance: null,

	/**
	 * 返回值中除status: 0 和status: 1 以外的状态
	 * ({ options, response, reject, resolve }) => Promise?
	 */
	onOther: noop,

	/**
	 * 请求发起时
	 */
	onLoading: noop,

	/**
	 * 请求结束时
	 */
	onLoaded: noop,

	/**
	 * 请求前
	 * ({ options }) => Promise?
	 * 全局的onBefore优先执行
	 */
	onBefore: noop,

	/**
	 * 请求后
	 * ({ options, response }) => Promise?
	 * 全局的onAfter最后执行
	 */
	onAfter: noop,

	/**
	 * 进度上传或者下载的回调
	 */
	onProgress: null,

	// --- browser
	
	/**
	 * 在fetch合法的条件下，使用fetch
	 * 而非XMLHttpRequest
	 */
	useXHR: false,

	/**
	 * 是否异步
	 */
	async: true,

	// --- browser end
	
	// --- node
	
	/**
	 * 是否允许重定向
	 */
	maxRedirects: undefined,

	// --- node end
	
	/**
	 * TODO
	 * 轮询下的场景，可以连续触发回调
	 */
	interval: 0,
	onError: noop,
	onSuccess: noop,
	onErrorRetry: noop, // 失败一次重新请求
};