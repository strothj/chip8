/**
 * Provide an override to `es-module-shims`'s import shim to transform
 * TypeScript files as they are imported.
 */
window.importShim.fetch = (() => {
	const pageUrl = new URL(window.location.href);

	/**
	 * @param {string} url
	 */
	const hook = async (url) => {
		const sourceUrl = new URL(url);
		const urlSegments = url.split("/");
		let filename = urlSegments[urlSegments.length - 1];
		let adjustedUrl = url;
		if (
			sourceUrl.protocol === pageUrl.protocol &&
			sourceUrl.host === pageUrl.host &&
			!filename.includes(".")
		) {
			filename += ".tsx";
			adjustedUrl += ".tsx";
		}

		const response = await fetch(adjustedUrl);
		if (/\.tsx/.test(response.url)) {
			const source = await response.text();
			const transformed =
				'import { h } from "preact";\n' +
				window.Babel.transform(source, {
					filename,
					presets: ["typescript"],
					plugins: [
						[
							"transform-react-jsx",
							{
								pragma: "h",
								pragmaFrag: "Fragment",
							},
						],
					],
				}).code;
			return new Response(
				new Blob([transformed], {
					type: "application/javascript",
				}),
			);
		}
		return response;
	};

	return hook;
})();
