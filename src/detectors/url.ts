import { Detector, PasteContext } from "./types";
import { escapeMarkdownLinkText, fetchPageTitle } from "./fetch-title";

const URL_RE = /^https?:\/\/\S+$/i;

export const urlDetector: Detector = {
	id: "enableUrl",
	enabled: (s) => s.enableUrl,
	async run(ctx: PasteContext): Promise<string | null> {
		const text = ctx.evt.clipboardData?.getData("text/plain")?.trim();
		if (!text || !URL_RE.test(text)) return null;

		const title = await fetchPageTitle(
			text,
			ctx.settings.titleFetchTimeoutMs,
			ctx.settings.urlTitleStripPatterns
		);
		if (!title) return null;

		return `[${escapeMarkdownLinkText(title)}](${text})`;
	},
};
