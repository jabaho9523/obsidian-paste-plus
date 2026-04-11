import { App, Editor, MarkdownFileInfo, MarkdownView } from "obsidian";
import { PastePlusSettings } from "../settings";

export interface PasteContext {
	evt: ClipboardEvent;
	editor: Editor;
	info: MarkdownView | MarkdownFileInfo;
	app: App;
	settings: PastePlusSettings;
}

export interface Detector {
	id: string;
	enabled: (settings: PastePlusSettings) => boolean;
	run: (ctx: PasteContext) => Promise<string | null>;
}
