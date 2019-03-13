import HttpShell from './core/HttpShell';
import HttpServer from './core/HttpServer';

const createHttpServer = (globalOptions = {}) => {

	const { 
		apis, 
		baseUrl,
		http = HttpServer.http,
		...defaultOptions 
	} = globalOptions;
	const clientWrapper = new HttpShell({ http, apis, baseUrl });
	
	const allowMethod = ['ajax']; // get, delete

	const client = {};
	allowMethod.forEach(m => {
		client[m] = async (userOptions) => {
			return clientWrapper[m]({ ...defaultOptions, ...userOptions });
		};
	});

	return client;
};

export const { ajax } = createHttpServer();

export default createHttpServer;
