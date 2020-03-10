interface Window {
	process: { env: { NODE_ENV: "production" } };

	Sucrase: Promise<{
		transform: (source: string, options: object) => { code: string };
	}>;

	importShim: {
		<T>(url: string): Promise<T>;
		fetch: (url: string) => Promise<Response>;
	};
}

declare module "https://unpkg.com/sucrase*" {
	const SucraseModule: Window["Sucrase"] extends Promise<infer U> ? U : never;
	export = SucraseModule;
}
