import createHttpClient, { ajax } from '@wya/http';

window.createHttpClient = createHttpClient;
window.$ = createHttpClient({
	apis: {
		TEST_GET: "https://api.github.com/users/wya-team?page={page}",
		UPLOAD_POST: "https://api.github.com/users/wya-team"
	}
});

let cancelCb;
$.ajax({
	url: 'TEST_GET',
	type: "GET",
	param: {
		page: '2',
		empty: ''
	},
	requestType: "json",
	allowEmptyString: true,
	credentials: 'omit', // cors下关闭
	getInstance: ({ xhr, cancel }) => cancelCb = cancel,
	debug: true,
	// useXHR: true,
	onBefore: ({ options }) => {
		// return new Promise((resolve, reject) => {
		// 	// resolve({
		// 	// 	...options,
		// 	// 	localData: {
		// 	// 		status: 0,
		// 	// 		data: {}
		// 	// 	}
		// 	// });
		// });
	},
	onAfter: ({ response }) => {
		
	},
	onOther: ({ response }) => {
		// return new Promise((resolve, reject) => {
		// 	resolve({
		// 		status: 0,
		// 		data: response
		// 	});
		// });
	} 
}).then((res) => {
	console.log('response success', res);
}).catch((res) => {
	console.log('response error', res);
});

setTimeout(() => {
	cancelCb && cancelCb();
}, Math.random() * 100 + 100);

document.querySelector('input').addEventListener('change', (e) => {
	const request = $.ajax({
		url: 'UPLOAD_POST',
		type: "FORM",
		param: {
			// filename: Date.now(),
			file: e.target.files[0]
		},
		credentials: 'omit', // cors下关闭
		onBefore: ({ options }) => {
			let url = options.url;
			let paramArray = [`token=${2222}`];
			return Promise.resolve({
				...options,
				url: url += (url.indexOf('?') > -1 ? '&' : '?') + paramArray.join('&')
			});

		},
		onAfter: ({ response }) => {
			return {
				status: 1,
				data: {
					...response
				}
			};

		},
		onProgress: (e) => {
			console.log(e.percent);
		}
	}).then((res) => {
		console.log(res, 0);
	}).catch((res) => {
		console.log(res);
	});
});
