import { ajax } from '../src/main';
const request = ajax({
	url: `http://localhost:3000/api/test`
}).then((res) => {
	console.log(res, 0);
}).catch((res) => {
	console.log(res);
});
setTimeout(() => {
	request.cancel();
}, Math.random() * 700);


