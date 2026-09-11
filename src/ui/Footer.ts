import van from "vanjs-core";

const { footer, span, a } = van.tags;

export const Footer = () =>
	footer(
		{ class: "footer" },
		span(
			"Made with <3 by ",
			a({ class: "hover-glow", href: "https://x.com/vladkrutenyuk", target: "_blank" }, "Vlad Krutenyuk"),
			"\u00a0using ",
			a({ class: "hover-glow", href: "https://threejs.org/", target: "_blank" }, "three.js")
		)
	);
