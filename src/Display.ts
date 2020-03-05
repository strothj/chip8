export class Display {
	private readonly rects: SVGRectElement[];

	constructor(width: number, height: number) {
		const svg = document.querySelector("svg");
		if (!svg) {
			throw new Error("Unable to acquire svg element.");
		}

		svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
		svg.innerHTML = "";
		const rects: SVGRectElement[] = [];
		for (let y = 0; y < height; y += 1) {
			for (let x = 0; x < width; x += 1) {
				const rect = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"rect",
				);
				rect.setAttribute("x", x.toString());
				rect.setAttribute("y", y.toString());
				rect.setAttribute("width", "1");
				rect.setAttribute("height", "1");
				rect.setAttribute("fill", "#fff");
				rects.push(rect);
				svg.appendChild(rect);
			}
		}

		this.rects = rects;
	}

	get(pixelOffset: number) {
		if (pixelOffset < 0 || pixelOffset >= this.rects.length) {
			throw new Error("Attempt to draw on out of range pixel.");
		}
		return this.rects[pixelOffset].getAttribute("fill") === "#fff" ? 0 : 1;
	}

	set(pixelOffset: number, value: number) {
		const currentValue = this.get(pixelOffset);
		if (value > 0 && currentValue === 1) {
			return;
		}
		this.rects[pixelOffset].setAttribute(
			"fill",
			value > 0 ? "#000" : "#fff",
		);
	}
}
