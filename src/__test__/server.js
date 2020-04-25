const http = require('http');
const hostname = '0.0.0.0';
const port = 8833;

http
	.createServer((req, res) => {
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