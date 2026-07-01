export interface BlurbEntry {
	id: number;
	label: string;
	content: string;
	is_default: boolean;
}

export interface KeywordEntry {
	id: number;
	name: string;
	triggers: string[];
	blurbs: BlurbEntry[];
}

export interface RankedMatch {
	keyword: KeywordEntry;
	count: number;
	defaultBlurb: BlurbEntry | null;
}

export function extractText(html: string): string {
	return html
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<!--[\s\S]*?-->/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

export function rankKeywords(text: string, keywords: KeywordEntry[]): RankedMatch[] {
	const lower = text.toLowerCase();

	return keywords
		.map((kw) => {
			const count = kw.triggers.reduce((sum, trigger) => {
				const escaped = trigger.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				const pattern = new RegExp(`\\b${escaped}\\b`, 'g');
				return sum + (lower.match(pattern)?.length ?? 0);
			}, 0);

			const defaultBlurb = kw.blurbs.find((b) => b.is_default) ?? kw.blurbs[0] ?? null;

			return { keyword: kw, count, defaultBlurb };
		})
		.filter((m) => m.count > 0)
		.sort((a, b) => b.count - a.count);
}
