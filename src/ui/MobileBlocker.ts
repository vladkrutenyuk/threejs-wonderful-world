import van from "vanjs-core";

const { div, code } = van.tags;

export const MobileBlocker = () =>
	div(
		{ class: "mobile-blocker" },
		code("mobile version is not available"),
		code("-"),
		code("try it on desktop please")
	);
