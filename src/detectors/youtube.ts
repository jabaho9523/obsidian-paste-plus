import { Detector, PasteContext } from "./types";
import { escapeMarkdownLinkText, fetchPageTitle } from "./fetch-title";

const YT_RE =
	/^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/)[\w-]+|youtu\.be\/[\w-]+)[^\s]*$/i;

export const youtubeDetector: Detector = {
	id: "enableYouTube",
	enabled: (s) => s.enableYouTube,
	async run(ctx: PasteContext): Promise<string | null> {
		const text = ctx.evt.clipboardData?.getData("text/plain")?.trim();
		if (!text || !YT_RE.test(text)) return null;

		const title = await fetchPageTitle(
			text,
			ctx.settings.titleFetchTimeoutMs,
			ctx.settings.urlTitleStripPatterns
		);
		if (!title) return null;

		return `[${escapeMarkdownLinkText(title)}](${text})`;
	},
};
