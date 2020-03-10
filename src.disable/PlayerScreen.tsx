import React, { useRef } from "react";
import { Display, DisplayRef } from "./Display";

const DISPLAY_WIDTH = 64;
const DISPLAY_HEIGHT = 32;

export function PlayerScreen() {
	const displayRef = useRef<DisplayRef>(null);

	return (
		<Display
			ref={displayRef}
			width={DISPLAY_WIDTH}
			height={DISPLAY_HEIGHT}
		/>
	);
}
