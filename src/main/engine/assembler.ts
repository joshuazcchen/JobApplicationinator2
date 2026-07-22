// Copyright (c) 2026 Joshua Chen.
// SPDX-License-Identifier: GPL-3.0-or-later

import type { RankedMatch } from './keyword-engine';

export interface TemplateVariables {
	company_name?: string;
	role_title?: string;
	hiring_manager?: string;
	user_name?: string;
}

export function assembleLetterFromTemplate(
	template: string,
	matches: RankedMatch[],
	vars: TemplateVariables = {},
	topN = 7
): string {
	const topMatches = matches.filter((m) => m.defaultBlurb !== null).slice(0, topN);

	const blurbSection =
		topMatches.length > 0
			? topMatches.map((m) => m.defaultBlurb!.content).join('\n\n')
			: '<p>[No keywords matched]</p>';

	const today = new Date().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	function fill(placeholder: keyof TemplateVariables, fallbackLabel: string): string {
		const value = vars[placeholder];
		return value
			? value
			: `<span class="unfilled-var" data-var="${placeholder}">[${fallbackLabel}]</span>`;
	}

	return template
		.replace('{{blurbs}}', blurbSection)
		.replace(/\{\{date\}\}/g, today)
		.replace(/\{\{company_name\}\}/g, fill('company_name', 'Company Name'))
		.replace(/\{\{role_title\}\}/g, fill('role_title', 'Role Title'))
		.replace(/\{\{hiring_manager\}\}/g, fill('hiring_manager', 'Hiring Manager'))
		.replace(/\{\{user_name\}\}/g, fill('user_name', 'Your Name'));
}
