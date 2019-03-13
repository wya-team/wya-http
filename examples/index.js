import createHttpClient, { ajax } from '../src/index';

let cancelCb;

ajax({
	url: 'https://wyaoa.ruishan666.com/uploadfile/upimg.json?action=uploadimage&encode=utf-8&code=xcx',
	type: "GET",
	param: {
		home_decorate_id: '2'
	},
	requestType: "form-data:json",
	getInstance: ({ xhr, cancel }) => cancelCb = cancel,
	debug: true
}).then((res) => {
	console.log(res, 0);
}).catch((res) => {
	console.log(res);
});

setTimeout(() => {
	cancelCb();
}, 100);


//


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
