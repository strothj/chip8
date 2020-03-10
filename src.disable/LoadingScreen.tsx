import React, { ReactNode } from "react";
import { useRomLists } from "./RomListsContext";

type LoadingScreenProps = {
	children?: ReactNode;
};

export function LoadingScreen({ children }: LoadingScreenProps) {
	const { romLists, error } = useRomLists();

	if (error) {
		return <div>Failed to retrieve rom list: {error.message}</div>;
	}

	if (!romLists) {
		return <div>Loading rom list...</div>;
	}

	return <>{children}</>;
}
