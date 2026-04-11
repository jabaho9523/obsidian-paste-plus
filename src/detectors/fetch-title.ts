import { requestUrl } from "obsidian";

export async function fetchPageTitle(
	url: string,
	timeoutMs: number,
	stripPatterns: string[]
): Promise<string | null> {
	const timeoutPromise = new Promise<null>((resolve) =>
		setTimeout(() => resolve(null), timeoutMs)
	);

	const fetchPromise = (async (): Promise<string | null> => {
		try {
			const res = await requestUrl({
				url,
				method: "GET",
				throw: false,
			});
			if (res.status < 200 || res.status >= 400) return null;
			return extractTitle(res.text, stripPatterns);
		} catch (e) {
			console.warn("[Paste Plus] title fetch failed", url, e);
			return null;
		}
	})();

	return Promise.race([fetchPromise, timeoutPromise]);
}

function extractTitle(html: string, stripPatterns: string[]): string | null {
	// Prefer OpenGraph title when present.
	const ogMatch = html.match(
		/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
	);
	let title = ogMatch?.[1];

	if (!title) {
		const twMatch = html.match(
			/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i
		);
		title = twMatch?.[1];
	}

	if (!title) {
		const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
		title = titleMatch?.[1];
	}

	if (!title) return null;

	title = decodeHtmlEntities(title).trim();
	for (const pat of stripPatterns) {
		if (title.endsWith(pat)) {
			title = title.slice(0, title.length - pat.length).trim();
		}
	}
	return title.length > 0 ? title : null;
}

function decodeHtmlEntities(s: string): string {
	return s
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/&#(\d+);/g, (_, d: string) =>
			String.fromCharCode(parseInt(d, 10))
		)
		.replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) =>
			String.fromCharCode(parseInt(h, 16))
		);
}

export function escapeMarkdownLinkText(text: string): string {
	return text.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
}
