import HttpShell from './core/HttpShell';

const createHttpClient = (registerOptions = {}) => {

	const clientWrapper = new HttpShell(registerOptions);
	
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

export default createHttpClient;
