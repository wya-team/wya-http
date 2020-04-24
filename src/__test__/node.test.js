// import createHttpClient, { HttpHelper } from '..';
// import { ERROR_CODE } from '../core/HttpError';

describe('browser.js', () => {
	if (IS_SERVER) return;
	// let $ = createHttpClient({
	// 	onAfter: (res) => {
	// 		expect(typeof res).toBe('object');
	// 	},
	// 	onBefore: (res) => {
	// 		expect(typeof res).toBe('object');
	// 	}
	// });
	test('test', () => {
		expect(1).toBe(1);
	});
});
