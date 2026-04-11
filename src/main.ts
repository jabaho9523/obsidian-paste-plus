import { Editor, MarkdownFileInfo, MarkdownView, Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	PastePlusSettingTab,
	PastePlusSettings,
} from "./settings";
import { PasteHandler } from "./paste-handler";
import { Detector } from "./detectors/types";
import { imageDetector } from "./detectors/image";
import { youtubeDetector } from "./detectors/youtube";
import { twitterDetector } from "./detectors/twitter";
import { urlDetector } from "./detectors/url";
import { htmlDetector } from "./detectors/html";
import { WelcomeModal } from "./welcome-modal";

export default class PastePlusPlugin extends Plugin {
	settings!: PastePlusSettings;
	private handler!: PasteHandler;

	async onload() {
		await this.loadSettings();

		const detectors: Detector[] = [
			imageDetector,
			youtubeDetector,
			twitterDetector,
			urlDetector,
			htmlDetector,
		];

		this.handler = new PasteHandler(
			this.app,
			() => this.settings,
			detectors
		);

		const onPaste = (
			evt: ClipboardEvent,
			editor: Editor,
			info: MarkdownView | MarkdownFileInfo
		): void => {
			this.handler.handle(evt, editor, info).catch((e: unknown) => {
				console.warn("[Paste Plus] handler error", e);
			});
		};
		this.registerEvent(this.app.workspace.on("editor-paste", onPaste));

		this.addSettingTab(new PastePlusSettingTab(this.app, this));

		if (!this.settings.hasSeenWelcome) {
			// Defer so the workspace is fully ready.
			this.app.workspace.onLayoutReady(() => {
				new WelcomeModal(this.app, () => {
					this.settings.hasSeenWelcome = true;
					this.saveSettings().catch((e: unknown) => {
						console.warn("[Paste Plus] save welcome flag failed", e);
					});
				}).open();
			});
		}
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<PastePlusSettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
