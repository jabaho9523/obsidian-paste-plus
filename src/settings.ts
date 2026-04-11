import { App, PluginSettingTab, Setting } from "obsidian";
import PastePlusPlugin from "./main";

export interface PastePlusSettings {
	hasSeenWelcome: boolean;
	enableUrl: boolean;
	enableImage: boolean;
	enableHtml: boolean;
	enableYouTube: boolean;
	enableTwitter: boolean;
	imageNameTemplate: string;
	urlTitleStripPatterns: string[];
	titleFetchTimeoutMs: number;
}

export const DEFAULT_SETTINGS: PastePlusSettings = {
	hasSeenWelcome: false,
	enableUrl: true,
	enableImage: true,
	enableHtml: true,
	enableYouTube: true,
	enableTwitter: true,
	imageNameTemplate: "pasted-{YYYYMMDD-HHmmss}",
	urlTitleStripPatterns: [
		" - YouTube",
		" | Medium",
		" - Wikipedia",
		" - GitHub",
	],
	titleFetchTimeoutMs: 5000,
};

export class PastePlusSettingTab extends PluginSettingTab {
	plugin: PastePlusPlugin;

	constructor(app: App, plugin: PastePlusPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName("Paste transforms").setHeading();

		new Setting(containerEl)
			.setName("Convert urls to titled links")
			.setDesc("Paste a bare URL to get a formatted Markdown link automatically.")
			.addToggle((t) =>
				t.setValue(this.plugin.settings.enableUrl).onChange(async (v) => {
					this.plugin.settings.enableUrl = v;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Save and rename pasted images")
			.setDesc("Pasted images are saved to your attachments folder with a clean name.")
			.addToggle((t) =>
				t.setValue(this.plugin.settings.enableImage).onChange(async (v) => {
					this.plugin.settings.enableImage = v;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Convert HTML to clean Markdown")
			.setDesc("Rich content from web pages is converted to clean Markdown.")
			.addToggle((t) =>
				t.setValue(this.plugin.settings.enableHtml).onChange(async (v) => {
					this.plugin.settings.enableHtml = v;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Convert YouTube links")
			.setDesc("YouTube urls are replaced with the video title.")
			.addToggle((t) =>
				t.setValue(this.plugin.settings.enableYouTube).onChange(async (v) => {
					this.plugin.settings.enableYouTube = v;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Convert Twitter and X links")
			.setDesc("Tweet urls are replaced with the post title.")
			.addToggle((t) =>
				t.setValue(this.plugin.settings.enableTwitter).onChange(async (v) => {
					this.plugin.settings.enableTwitter = v;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl).setName("Advanced").setHeading();

		new Setting(containerEl)
			.setName("Image filename template")
			.setDesc(
				"Template for pasted image filenames. Supports {YYYY}, {MM}, {DD}, {HH}, {mm}, {ss}, {YYYYMMDD-HHmmss}."
			)
			.addText((t) =>
				t
					.setPlaceholder("pasted-{YYYYMMDD-HHmmss}")
					.setValue(this.plugin.settings.imageNameTemplate)
					.onChange(async (v) => {
						this.plugin.settings.imageNameTemplate =
							v || DEFAULT_SETTINGS.imageNameTemplate;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("URL title strip patterns")
			.setDesc("Remove these suffixes from fetched page titles. One per line.")
			.addTextArea((t) => {
				t.setPlaceholder("- YouTube")
					.setValue(this.plugin.settings.urlTitleStripPatterns.join("\n"))
					.onChange(async (v) => {
						this.plugin.settings.urlTitleStripPatterns = v
							.split("\n")
							.map((line) => line.trimEnd())
							.filter((line) => line.length > 0);
						await this.plugin.saveSettings();
					});
				t.inputEl.rows = 5;
				t.inputEl.cols = 40;
			});

		new Setting(containerEl)
			.setName("Title fetch timeout (ms)")
			.setDesc(
				"How long to wait for a page title before falling back to default paste."
			)
			.addText((t) =>
				t
					.setPlaceholder("5000")
					.setValue(String(this.plugin.settings.titleFetchTimeoutMs))
					.onChange(async (v) => {
						const n = parseInt(v, 10);
						this.plugin.settings.titleFetchTimeoutMs =
							Number.isFinite(n) && n > 0
								? n
								: DEFAULT_SETTINGS.titleFetchTimeoutMs;
						await this.plugin.saveSettings();
					})
			);
	}
}
