// Copyright (c) 2026 Joshua Chen.
// SPDX-License-Identifier: GPL-3.0-or-later

import { Document, Packer, Paragraph, TextRun } from 'docx';

interface RunSpec {
	text: string;
	bold?: boolean;
	italics?: boolean;
	underline?: boolean;
}

function parseInlineRuns(fragment: string): RunSpec[] {
	const runs: RunSpec[] = [];
	const regex = /<(b|strong|i|em|u)>(.*?)<\/\1>|([^<]+)/gi;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(fragment)) !== null) {
		if (match[3]) {
			runs.push({ text: decodeEntities(match[3]) });
		} else {
			const tag = match[1].toLowerCase();
			const inner = decodeEntities(match[2].replace(/<[^>]+>/g, ''));
			runs.push({
				text: inner,
				bold: tag === 'b' || tag === 'strong',
				italics: tag === 'i' || tag === 'em',
				underline: tag === 'u'
			});
		}
	}
	return runs;
}

function decodeEntities(s: string): string {
	return s
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

export async function htmlToDocxBuffer(html: string): Promise<Buffer> {
	const paragraphHtml = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) ?? [html];

	const paragraphs = paragraphHtml.map((p) => {
		const inner = p.replace(/^<p[^>]*>/i, '').replace(/<\/p>$/i, '');
		const runs = parseInlineRuns(inner).map(
			(r) =>
				new TextRun({
					text: r.text,
					bold: r.bold,
					italics: r.italics,
					underline: r.underline ? {} : undefined
				})
		);
		return new Paragraph({
			children: runs.length ? runs : [new TextRun('')],
			spacing: { after: 200 }
		});
	});

	const doc = new Document({ sections: [{ children: paragraphs }] });
	return Packer.toBuffer(doc);
}
