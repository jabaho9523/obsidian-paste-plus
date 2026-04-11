import { Detector, PasteContext } from "./types";
import { escapeMarkdownLinkText, fetchPageTitle } from "./fetch-title";

const TW_RE =
	/^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^/]+\/status\/\d+[^\s]*$/i;

export const twitterDetector: Detector = {
	id: "enableTwitter",
	enabled: (s) => s.enableTwitter,
	async run(ctx: PasteContext): Promise<string | null> {
		const text = ctx.evt.clipboardData?.getData("text/plain")?.trim();
		if (!text || !TW_RE.test(text)) return null;

		const title = await fetchPageTitle(
			text,
			ctx.settings.titleFetchTimeoutMs,
			ctx.settings.urlTitleStripPatterns
		);

		// Fallback: build something from the URL if title fetch fails.
		const fallback = buildFallback(text);
		const label = title ?? fallback;
		if (!label) return null;

		return `[${escapeMarkdownLinkText(label)}](${text})`;
	},
};

function buildFallback(url: string): string | null {
	const m = url.match(/(?:twitter|x)\.com\/([^/]+)\/status\/(\d+)/i);
	if (!m) return null;
	return `Tweet by @${m[1]}`;
}
