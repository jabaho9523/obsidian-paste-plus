import { App, Modal, Setting } from "obsidian";

export class WelcomeModal extends Modal {
	private onDone: () => void;

	constructor(app: App, onDone: () => void) {
		super(app);
		this.onDone = onDone;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Welcome" });

		contentEl.createEl("p", {
			text: "Your paste key just got smarter. From now on:",
		});

		const list = contentEl.createEl("ul");
		list.createEl("li", { text: "Pasted urls become titled Markdown links." });
		list.createEl("li", {
			text: "Pasted images are saved and renamed automatically.",
		});
		list.createEl("li", {
			text: "Rich web content becomes clean Markdown.",
		});
		list.createEl("li", {
			text: "YouTube and Twitter links are replaced with their titles.",
		});

		contentEl.createEl("p", {
			text: "You can disable any of this in the plugin settings tab.",
		});

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Got it")
				.setCta()
				.onClick(() => {
					this.close();
					this.onDone();
				})
		);
	}

	onClose() {
		this.contentEl.empty();
	}
}
