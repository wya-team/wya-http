class HttpSuccess {
	constructor(options = {}) {
		const {
			data,
			httpStatus,
			headers,
			request,
			responseExtra
		} = options;

		this.httpStatus = httpStatus;
		this.data = data;

		if (!responseExtra) return;
		if (responseExtra instanceof Array) {
			responseExtra.forEach((key) => {
				this[key] = options[key];
			});
		} else {
			this.headers = headers || {};
			this.request = request;
		}
	}
}

export default HttpSuccess;
