import createHttpClient, { ajax } from '@wya/http';

window.createHttpClient = createHttpClient;
window.$ = createHttpClient({
	apis: {
		_TEST_GET: "https://wyaoa.ruishan666.com/uploadfile/upimg.json?action=uploadimage&encode=utf-8&code=xcx&page={page}&pageSize={page}",
		UPLOAD_POST: "https://wyaoa.ruishan666.com/uploadfile/upimg.json?action=uploadimage&encode=utf-8&code=xcx"
	}
});

let cancelCb;

$.ajax({
	url: '_TEST_GET',
	type: "GET",
	param: {
		page: '2',
		empty: ''
	},
	requestType: "json",
	allowEmptyString: true,
	getInstance: ({ xhr, cancel }) => cancelCb = cancel,
	debug: true,
	onBefore: ({ options }) => {
		// return new Promise((resolve, reject) => {
		// 	resolve({
		// 		...options,
		// 		localData: {
		// 			status: 1,
		// 			data: {}
		// 		}
		// 	});
		// });
	},
	onAfter: ({ response }) => {
		return new Promise((resolve, reject) => {
			resolve({
				status: 1,
				data: response
			});
		});
	}
}).then((res) => {
	console.log(res, 0);
}).catch((res) => {
	console.log(res);
});

setTimeout(() => {
	cancelCb();
}, 100);

document.querySelector('input').addEventListener('change', (e) => {
	const request = $.ajax({
		url: 'UPLOAD_POST',
		type: "FORM",
		param: {
			// filename: Date.now(),
			file: e.target.files[0]
		},
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
