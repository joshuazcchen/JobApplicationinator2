export interface ExtractedMeta {
	company_name: string | null;
	hiring_manager: string | null;
}

const HM_PAT = [
	/hiring manager[:\s]+([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,2})/i,
	/reports to[:\s]+([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,2})/i,
	/contact[:\s]+([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,2})/i
];

const TITLE_PAT = [
	/^(.+?)\s+is hiring/i,
	/\bat\s+([A-Z][A-Za-z0-9&.,'\- ]{1,40})(?:\s*[-|–]|\s*$)/,
	/^([A-Z][A-Za-z0-9&.,'\- ]{1,40})\s*[-|–]\s*/
];

export function extractData(bodyText: string, pageTitle: string): ExtractedMeta {
	let hiring_manager: string | null = null;
	for (const pattern of HM_PAT) {
		const match = bodyText.match(pattern);
		if (match) {
			hiring_manager = match[1].trim();
			break;
		}
	}

	let company_name: string | null = null;
	for (const pattern of TITLE_PAT) {
		const match = pageTitle.match(pattern);
		if (match) {
			company_name = match[1].trim();
			break;
		}
	}

	return { company_name, hiring_manager };
}
