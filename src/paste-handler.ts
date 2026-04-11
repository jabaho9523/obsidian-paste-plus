import { App, Editor, MarkdownFileInfo, MarkdownView } from "obsidian";
import { PastePlusSettings } from "./settings";
import { Detector, PasteContext } from "./detectors/types";

const BARE_URL_RE = /^https?:\/\/\S+$/i;

export class PasteHandler {
	constructor(
		private app: App,
		private getSettings: () => PastePlusSettings,
		private detectors: Detector[]
	) {}

	async handle(
		evt: ClipboardEvent,
		editor: Editor,
		info: MarkdownView | MarkdownFileInfo
	): Promise<void> {
		if (evt.defaultPrevented) return;
		if (!evt.clipboardData) return;

		const settings = this.getSettings();
		const plain = evt.clipboardData.getData("text/plain") ?? "";
		const trimmedPlain = plain.trim();

		// Quick synchronous pre-check: will any detector want this paste?
		// If not, leave the event alone and let Obsidian do its default paste.
		const hasImage = hasImageItem(evt.clipboardData);
		const hasBareUrl = BARE_URL_RE.test(trimmedPlain);
		const hasMeaningfulHtml =
			Array.from(evt.clipboardData.types).includes("text/html") &&
			!hasBareUrl;

		const mightTransform =
			(settings.enableImage && hasImage) ||
			(settings.enableUrl && hasBareUrl) ||
			(settings.enableYouTube && hasBareUrl) ||
			(settings.enableTwitter && hasBareUrl) ||
			(settings.enableHtml && hasMeaningfulHtml);

		if (!mightTransform) return;

		// Claim the event synchronously so Obsidian's built-in handler
		// doesn't also paste before our async work completes.
		evt.preventDefault();

		const ctx: PasteContext = {
			evt,
			editor,
			info,
			app: this.app,
			settings,
		};

		for (const detector of this.detectors) {
			if (!detector.enabled(settings)) continue;
			try {
				const result = await detector.run(ctx);
				if (result == null) continue;
				editor.replaceSelection(result);
				return;
			} catch (e) {
				console.warn(`[Paste Plus] detector "${detector.id}" error`, e);
			}
		}

		// No detector wanted it — fall back to the plain text so the paste
		// still happens (we already preventDefault'd the native paste).
		editor.replaceSelection(plain);
	}
}

function hasImageItem(data: DataTransfer): boolean {
	const items = data.items;
	if (!items) return false;
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (item && item.kind === "file" && item.type.startsWith("image/")) {
			return true;
		}
	}
	return false;
}
