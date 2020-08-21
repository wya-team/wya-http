export const getPropByPath = (obj, path) => {
	let target = obj;
	path = path.replace(/\[(\w+)\]/g, '.$1');
	path = path.replace(/^\./, '');

	let keyArr = path.split('.');
	let i = 0;

	for (let len = keyArr.length; i < len - 1; ++i) {
		let key = keyArr[i];
		if (key in target) {
			target = target[key];
		} else {
			throw new Error('[@wya/http]: please transfer a valid prop path to form item!');
		}
	}
	return {
		target: target,
		key: keyArr[i],
		value: target[keyArr[i]]
	};
};


export const isJson = (str) => {
	let state = false;
	try {
		if (typeof JSON.parse(str) == "object") {
			state = true;
		}
	} catch (e) {
		
	}
	return false;
};

/**
 * https://github.com/reduxjs/redux/blob/master/src/compose.js
 */
export const compose = (...funcs) => {
	if (funcs.length === 0) {
		return arg => arg;
	}
	if (funcs.length === 1) {
		return funcs[0];
	}
	return funcs.reduce((a, b) => (...args) => a(b(...args)));
};

export const noop = () => {};

export const rebuildURLAndParam = (opts = {}) => {
	let { url, param, allowEmptyString, method } = opts;

	if (!param) {
		return {
			url,
			param: null,
			paramArray: []
		};
	}
	
	/**
	 * 解析RESTFUL URL 或者动态的;
	 * 支持以下场景:
	 * -> /repo/{books_id}/{article_id}
	 * -> /repo/:books_id/:article_id?page={page}
	 * -> 127.0.0.1:8080/*
	 *
	 * 注：
	 * 1. 当无值会把前缀'/'一起删除，
	 * 2. 如果是 config.article_id 会删除整个config对象
	 */
	let dynamic = /(\/?{[^?\/\&]+|\/?:[^\d][^?\/\&]+)/g;
	if (dynamic.test(url)) {
		let delTmp = [];
		url = url.replace(dynamic, key => {
			let k = key.replace(/({|}|\s|:|\/)/g, '');
			let value = getPropByPath(param, k).value;
			
			delTmp.push(k.split('.')[0]); // 无法删除对应的嵌套，删除整个对象
			return value 
				? `${key.indexOf('/') === 0 ? '/' : ''}${value}` 
				: '';
		});
		
		delTmp.forEach(i => typeof param[i] !== 'undefined' && delete param[i]);
	}
	
	let paramArray = [];
	for (let key in param) {
		/**
		 * 过滤掉值为null, undefined, ''情况
		 */
		if (param[key] || param[key] === false || param[key] === 0  || (allowEmptyString && param[key] === '') ) {
			paramArray.push(key + '=' + encodeURIComponent(param[key]));
		}
	}

	if (/(JSONP|GET|DELETE)$/.test(method) && paramArray.length > 0) {
		url += (url.indexOf('?') > -1 ? '&' : '?') + paramArray.join('&');
	}

	return {
		url,
		param,
		paramArray
	};
};