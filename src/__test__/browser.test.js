import { createHttpClient } from '..';
describe('browser.js', () => {
	test('无URL验证错误', () => {
		let $ = createHttpClient();
		expect(typeof $.ajax).toBe('function');

		$.ajax({

		}).then((res) => {
			console.log(res);
		}).catch((e) => {
			console.log(e);
		});
	});

	test('验证api', () => {
		let $ = createHttpClient();

		$.ajax({
			url: 'https://oa2.ruishan666.com/_sale/sale/statistics-customer/first-page-statistics.json'
		}).then((res) => {
			console.log(res);
		}).catch((e) => {
			console.log(e);
		});
	});
});
