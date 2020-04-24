let HttpAdapter;
if (typeof window !== 'undefined') {
	HttpAdapter = require('./browser').default;
} else if (typeof process !== 'undefined') {
	// TODO
	HttpAdapter = require('./node').default;
}

export default HttpAdapter;
