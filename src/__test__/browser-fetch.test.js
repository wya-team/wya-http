import createHttpClient, { HttpHelper } from '..';
import { ERROR_CODE } from '../core/HttpError';

/**
 * TODO
 * jsdom下暂无fetch
 */
describe('browser-fetch.js', () => {
	// 设置20秒超时
	jest.setTimeout(20000); 
	let $ = createHttpClient({
		useXHR: false,
		onAfter: (res) => {
			expect(typeof res).toBe('object');
		},
		onBefore: (res) => {
			expect(typeof res).toBe('object');
		}
	});

	test('Basic', async () => {
		expect(typeof $.ajax).toBe('function');
	});

	if (IS_SERVER) return;
});
