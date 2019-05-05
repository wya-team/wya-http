import createHttpClient from '..';
import { ERROR_CODE } from '../core/HttpError';
describe('browser.js', () => {
	let $ = createHttpClient();
	expect(typeof $.ajax).toBe('function');

	test('无URL验证错误', async () => {
		try {
			let response = await $.ajax();
		} catch (e) {
			expect(e.code).toBe(ERROR_CODE.HTTP_URL_EMPTY);
		}
	});

	test('localData验证: status = 1', async () => {
		let options = {
			localData: {
				status: 1,
				data: {
					user: 'wya'
				}
			}
		};
		let response = await $.ajax(options);
		expect(response.data.user).toBe('wya');
	});

	test('localData验证: status = 0', async () => {
		try {
			let options = {
				localData: {
					status: 0,
					data: {
						user: 'wya'
					}
				}
			};
			await $.ajax(options);
		} catch (response) {
			expect(response.data.user).toBe('wya');
		}
	});

	test('localData验证: status = null', async () => {
		try {
			let options = {
				localData: {
					status: null,
					data: {
						user: 'wya'
					}
				}
			};
			await $.ajax(options);
		} catch (response) {
			expect(response.data.user).toBe('wya');
		}
	});

	// 设置20秒超时
	jest.setTimeout(20000); 
	test('server验证', async () => {
		try {
			let options = {
				url: 'https://api.github.com/users/wya-team',
				credentials: false, // cors下关闭
				onAfter: ({ response }) => {
					return {
						status: 1,
						data: {
							...response
						}
					};
				}
			};

			let res = await $.ajax(options);
			expect(res.data.login).toBe('wya-team');
		} catch (response) {
			expect(response.status).toBe(0);
		}
	});
});
