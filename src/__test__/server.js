const http = require('http');
const url = require('url');
const hostname = '0.0.0.0';
const port = 8833;

http
	.createServer(async (req, res) => {
		console.log(req.method, req.url);

		// 处理CORS 
		res.setHeader('Access-Control-Allow-Origin', "*");
		res.setHeader('Access-Control-Allow-Credentials', true);
		res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'x-requested-with');

		if (req.method === 'OPTIONS') {
			res.writeHead(204); // No Content
		}

		// 也可以用searchParams
		let query = (url.parse(req.url).query || '')
			.split('&')
			.filter(i => !!i)
			.reduce((pre, cur) => {
				let [key, value] = cur.split('=');

				pre[key] = value;
				return pre;
			}, {});
		
		let body = {};

		if (req.method === 'POST') {
			body = await new Promise((resolve) => {
				let postData = '';
				req.on('data', chuck =>  {  
					postData += chuck;
				});
				req.on('end', () => resolve(postData));
			});
		}

		let { delay = 0.1, result } = { ...query, ...body };

		setTimeout(() => {

			res.end(
				result || 
				JSON.stringify({
					user: 'wya',
					login: 'wya-team',
					method: req.method,
					url: req.url,
				})
			);
		}, delay * 1000);
	}).listen(port, hostname, () => {
		console.log(`Server running at http://${hostname}:${port}/`);
	});