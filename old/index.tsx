import { h, render } from "preact";

function Something() {
	return <div>Test</div>;
}

render(<Something />, document.querySelector("#root")!);
