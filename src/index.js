import HttpShell from './core/HttpShell';
import HttpError from './core/HttpError';
import HttpHelper from './core/HttpHelper';
// 以上可以作为@wya/http-core

import HttpAdapter from './adapters';

const createHttpClient = (registerOptions = {}) => {

	const clientWrapper = new HttpShell({
		http: HttpAdapter.http,
		...registerOptions,
	});
	
	const allowMethod = ['ajax', 'get', 'post', 'put', 'delete', 'option', 'form'];

	const client = {};
	allowMethod.forEach(m => {
		client[m] = async (userOptions) => {
			return clientWrapper[m](userOptions);
		};
	});

	return client;
};

export const { ajax } = createHttpClient();
export {
	HttpShell,
	HttpAdapter,
	HttpError,
	HttpHelper
};
export default createHttpClient;
