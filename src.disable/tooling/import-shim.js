const sucraseDirectories = [
	"dist/parser/plugins/jsx",
	"dist/parser/tokenizer",
	"dist/parser",
];

/**
 * @param {URL} url
 * @returns {boolean}
 */
function sucraseResolver(url) {
	if (
		sucraseDirectories
			.map((directory) => new RegExp(`/sucrase.+/${directory}$`))
			.some((regex) => regex.test(url.pathname))
	) {
		url.pathname += "/index.mjs";
		return true;
	}

	if (/\/sucrase.+\/dist.+/.test(url.pathname)) {
		url.pathname += ".mjs";
		return true;
	}

	return false;
}

/**
 * @param {URL} pageUrl
 * @returns {(url: URL) => boolean}
 */
function createTypeScriptResolver(pageUrl) {
	return (url) => {
		if (url.protocol === pageUrl.protocol && url.host === pageUrl.host) {
			const urlSegments = url.href.split("/");
			if (!urlSegments[urlSegments.length - 1].includes(".")) {
				url.pathname += ".tsx";
				return true;
			}
		}
		return false;
	};
}

/**
 * @param {Response} response
 */
async function typescriptTransform(response) {
	const source = await response.text();
	const Sucrase = await window.Sucrase;
	const transformed = Sucrase.transform(source, {
		transforms: ["jsx", "typescript"],
	}).code;
	return new Response(
		new Blob([transformed], { type: "application/javascript" }),
	);
}

/**
 * @param {string} urlParam
 */
window.importShim.fetch = async (urlParam) => {
	const typescriptResolver = createTypeScriptResolver(
		new URL(window.location.href),
	);
	const url = new URL(urlParam);
	[sucraseResolver, typescriptResolver].some((resolver) => resolver(url));

	const response = await fetch(url.href);
	if (/\.tsx$/.test(url.pathname)) {
		return typescriptTransform(response);
	}
	return response;
};

window.Sucrase = window.importShim("https://unpkg.com/sucrase@3.9.5?module");
