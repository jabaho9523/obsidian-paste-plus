import { Detector, PasteContext } from "./types";

const MIME_EXT: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/gif": "gif",
	"image/webp": "webp",
	"image/svg+xml": "svg",
	"image/bmp": "bmp",
	"image/avif": "avif",
};

export const imageDetector: Detector = {
	id: "enableImage",
	enabled: (s) => s.enableImage,
	async run(ctx: PasteContext): Promise<string | null> {
		const items = ctx.evt.clipboardData?.items;
		if (!items) return null;

		let imageFile: File | null = null;
		let mime = "";
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (item && item.kind === "file" && item.type.startsWith("image/")) {
				imageFile = item.getAsFile();
				mime = item.type;
				break;
			}
		}
		if (!imageFile) return null;

		const ext = MIME_EXT[mime] ?? "png";
		const baseName = renderTemplate(ctx.settings.imageNameTemplate);
		const desiredName = `${baseName}.${ext}`;

		const sourcePath = ctx.info.file?.path ?? "";
		const targetPath = await ctx.app.fileManager.getAvailablePathForAttachment(
			desiredName,
			sourcePath
		);

		const buffer = await imageFile.arrayBuffer();
		const created = await ctx.app.vault.createBinary(targetPath, buffer);

		// Use Obsidian's own link generator so it respects user link settings (wiki vs md).
		// Prefix with "!" to make it an embed — works for both [[file]] and [alt](file) styles.
		return `!${ctx.app.fileManager.generateMarkdownLink(created, sourcePath)}`;
	},
};

function renderTemplate(template: string): string {
	const d = new Date();
	const YYYY = String(d.getFullYear());
	const MM = pad(d.getMonth() + 1);
	const DD = pad(d.getDate());
	const HH = pad(d.getHours());
	const mm = pad(d.getMinutes());
	const ss = pad(d.getSeconds());
	return template
		.replace(/\{YYYYMMDD-HHmmss\}/g, `${YYYY}${MM}${DD}-${HH}${mm}${ss}`)
		.replace(/\{YYYY\}/g, YYYY)
		.replace(/\{MM\}/g, MM)
		.replace(/\{DD\}/g, DD)
		.replace(/\{HH\}/g, HH)
		.replace(/\{mm\}/g, mm)
		.replace(/\{ss\}/g, ss);
}

function pad(n: number): string {
	return n < 10 ? `0${n}` : String(n);
}
