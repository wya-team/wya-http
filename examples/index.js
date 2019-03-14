import createHttpClient, { ajax } from '@wya/http';

window.createHttpClient = createHttpClient;
window.$ = createHttpClient();

let cancelCb;

ajax({
	url: 'https://wyaoa.ruishan666.com/uploadfile/upimg.json?action=uploadimage&encode=utf-8&code=xcx',
	type: "GET",
	param: {
		page: '2'
	},
	requestType: "json",
	getInstance: ({ xhr, cancel }) => cancelCb = cancel,
	debug: true,
}).then((res) => {
	console.log(res, 0);
}).catch((res) => {
	console.log(res);
});

setTimeout(() => {
	// cancelCb();
}, 100);

document.querySelector('input').addEventListener('change', (e) => {
	const request = ajax({
		url: 'https://wyaoa.ruishan666.com/uploadfile/upimg.json?action=uploadimage&encode=utf-8&code=xcx',
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
