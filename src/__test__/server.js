const http = require('http');
const hostname = '0.0.0.0';
const port = 8833;

http
	.createServer((req, res) => {
		console.log(req.method, req.url);

		// 处理CORS
		res.setHeader('Access-Control-Allow-Origin', "*");
		res.setHeader('Access-Control-Allow-Credentials', true);
		res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');

		setTimeout(() => {
			res.end(JSON.stringify({
				user: 'wya',
				login: 'wya-team',
				method: req.method,
				url: req.url,
			}));
		}, 100);
	}).listen(port, hostname, () => {
		console.log(`Server running at http://${hostname}:${port}/`);
	});