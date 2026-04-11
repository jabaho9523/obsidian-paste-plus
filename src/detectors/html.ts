import TurndownService from "turndown";
import { Detector, PasteContext } from "./types";

let turndown: TurndownService | null = null;

function getTurndown(): TurndownService {
	if (turndown) return turndown;
	const t = new TurndownService({
		headingStyle: "atx",
		codeBlockStyle: "fenced",
		bulletListMarker: "-",
		emDelimiter: "_",
		strongDelimiter: "**",
	});
	// Preserve fenced code blocks from <pre><code class="language-x">...</code></pre>
	t.addRule("fencedCodeBlock", {
		filter: (node) =>
			node.nodeName === "PRE" &&
			node.firstChild != null &&
			node.firstChild.nodeName === "CODE",
		replacement: (_content, node) => {
			const code = node.querySelector("code");
			if (!code) return "";
			const className = code.getAttribute("class") ?? "";
			const langMatch = className.match(/language-(\S+)/);
			const lang = langMatch?.[1] ?? "";
			const text = code.textContent ?? "";
			return `\n\n\`\`\`${lang}\n${text.replace(/\n$/, "")}\n\`\`\`\n\n`;
		},
	});
	turndown = t;
	return t;
}

export const htmlDetector: Detector = {
	id: "enableHtml",
	enabled: (s) => s.enableHtml,
	async run(ctx: PasteContext): Promise<string | null> {
		const types = ctx.evt.clipboardData?.types;
		if (!types || !Array.from(types).includes("text/html")) return null;

		const html = ctx.evt.clipboardData?.getData("text/html");
		if (!html) return null;

		const plain = ctx.evt.clipboardData?.getData("text/plain") ?? "";

		// Skip bare URL pastes — those belong to the URL detector (or default paste).
		if (/^https?:\/\/\S+$/i.test(plain.trim())) return null;

		// Skip trivial HTML that's just a wrapped plain-text node.
		if (isTrivialHtml(html, plain)) return null;

		try {
			const md = getTurndown().turndown(html).trim();
			if (!md) return null;
			return md;
		} catch (e) {
			console.warn("[Paste Plus] turndown failed", e);
			return null;
		}
	},
};

function isTrivialHtml(html: string, plain: string): boolean {
	// Strip wrapper/meta tags and whitespace, compare to plain text.
	const stripped = html
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/<meta[^>]*>/gi, "")
		.replace(/<\/?html[^>]*>/gi, "")
		.replace(/<\/?body[^>]*>/gi, "")
		.replace(/<\/?head[^>]*>/gi, "")
		.replace(/<(\/?span|\/?p|\/?div)[^>]*>/gi, "")
		.replace(/\s+/g, " ")
		.trim();
	if (!/<[a-zA-Z]/.test(stripped)) {
		// No meaningful tags remain — it was just plain text in a wrapper.
		return true;
	}
	// If the markup contains only whitespace and matches plain text exactly.
	const textOnly = stripped.replace(/<[^>]+>/g, "").trim();
	return textOnly === plain.trim() && !/[<][a-zA-Z]/.test(stripped.slice(stripped.indexOf(">") + 1));
}
