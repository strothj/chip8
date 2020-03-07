interface Window {
	importShim: {
		fetch: (url: string) => Promise<Response>;
	};

	Babel: {
		transform: (source: string, options: object) => { code: string };
	};
}
