// Copyright (c) 2026 Joshua Chen.
// SPDX-License-Identifier: GPL-3.0-or-later

import { ipcMain, BrowserWindow } from 'electron';

import { scrapeSafari } from '../platform/safari';
import { scrapeCDP } from '../platform/cdp';
import { scrapeClipboard } from '../platform/clipboard';
import { extractText, rankKeywords } from '../engine/keyword-engine';
import { assembleLetterFromTemplate } from '../engine/assembler';

import { getDatabase } from '../db/schema';
import { getDefaultTemplate } from '../db/templates';
import { getKeywordsDetails } from '../db/keywords';
import { createApplication, saveCoverLetter, saveKeywordMatches } from '../db/applications';

export function registerScraperIPC(win: BrowserWindow): void {
	//loadAssets() Not sure if this is still necessary but it works seemingly fine without.

	ipcMain.handle('scan', async (_event, method: 'safari' | 'cdp' | 'clipboard') => {
		const db = getDatabase();
		const log = (msg: string): void => {
			if (!win.isDestroyed()) win.webContents.send('log', msg);
		};

		try {
			log('[S] Starting scan...');

			let raw: { html: string; title: string; url: string };

			if (method === 'safari') {
				log('[S] Connecting to Safari...');
				raw = scrapeSafari();
			} else if (method === 'cdp') {
				log('[S] Connecting to Chrome on Port 9222...');
				raw = await scrapeCDP();
			} else {
				log('[S] Reading from clipboard...');
				raw = scrapeClipboard();
			}

			log(`[S] Grabbed: "${raw.title}"`);
			if (raw.url) log(`[S] URL: ${raw.url}`);

			// TODO: why do these not have semicolons was I drunk while writing this or something???
			log('[S] Extracting text from HTML...');
			const text = extractText(raw.html);
			log(`[S] Extracted ${text.length.toLocaleString()} characters`);

			const keywords = getKeywordsDetails(db);
			log(`[s] Scanning against ${keywords.length} keywords...`);
			const matches = rankKeywords(text, keywords);

			const withBlurbs = matches.filter((m) => m.defaultBlurb !== null);
			const withoutBlurbs = matches.filter((m) => m.defaultBlurb === null);

			if (matches.length === 0) {
				log('[S!] No matches found. Consider adding more keywords to the library.');
			} else {
				const preview = matches
					.slice(0, 8)
					.map((m) => m.keyword.name)
					.join(', ');
				const more = matches.length > 8 ? ` (+${matches.length - 8} more)` : '';
				log(`[S] Found ${matches.length} matches: ${preview}${more}`);
			}

			log('[S] Assembling cover letter...');
			const template = getDefaultTemplate(db);
			const assembled = assembleLetterFromTemplate(
				template?.content ?? '<html><body>{{blurbs}}</body></html>',
				matches
			);
			log(
				`[S] Done: ${withBlurbs.length} blurbs inserted, ` +
					`${withoutBlurbs.length} keyword(s) have no blurb yet`
			);

			log('[S] Saving application...');

			const applicationId = createApplication(db, {
				role_title: raw.title || null,
				job_url: raw.url || null,
				raw_html: raw.html
			});
			saveCoverLetter(db, applicationId, assembled);
			saveKeywordMatches(
				db,
				applicationId,
				matches.map((m) => ({
					keyword_id: m.keyword.id,
					mention_count: m.count,
					blurb_id: m.defaultBlurb?.id ?? null
				}))
			);
			log(`[S] Saved application with ID ${applicationId}`);
			return {
				success: true,
				applicationId,
				title: raw.title,
				url: raw.url,
				matches: matches.map((m) => ({
					name: m.keyword.name,
					count: m.count,
					hasBlurb: m.defaultBlurb !== null,
					blurbHtml: m.defaultBlurb?.content ?? null
				})),
				assembled
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			log(`[S!] ${message}`);
			return { success: false, error: message };
		}
	});
}
