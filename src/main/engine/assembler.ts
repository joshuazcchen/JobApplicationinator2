import type { RankedMatch } from "./keyword-engine";

export function assembleLetterFromTemplate(template: string, matches: RankedMatch[], topN = 7): string {
	const topMatches = matches.filter((m) => m.defaultBlurb !== null).slice(0, topN);

	const blurbSection =
		topMatches.length > 0
			? topMatches.map((m) => m.defaultBlurb!.content).join("\n\n")
			: "<p>[No keywords matched]</p>";

	const today = new Date().toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return template
		.replace("{{blurbs}}", blurbSection)
		.replace(/\{\{date\}\}/g, today)
		.replace(/\{\{company_name\}\}/g, "[Company Name]")
		.replace(/\{\{role_title\}\}/g, "[Role Title]")
		.replace(/\{\{hiring_manager\}\}/g, "[Hiring Manager]")
		.replace(/\{\{user_name\}\}/g, "[Your Name]");
}
