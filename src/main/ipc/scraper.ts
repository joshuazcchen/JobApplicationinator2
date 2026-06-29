import { ipcMain, BrowserWindow, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

import { scrapeSafari } from '../platform/safari'
import { scrapeCDP } from '../platform/cdp'
import { scrapeClipboard } from '../platform/clipboard'
import { extractText, rankKeywords } from '../engine/keyword-engine'
import type { KeywordEntry } from '../engine/keyword-engine'
import { assembleLetterFromTemplate } from '../engine/assembler'

function assetPath(...parts: string[]): string {
	if (app.isPackaged) {
		return path.join(process.resourcesPath, 'assets', ...parts)
	}
	return path.join(__dirname, '..', '..', '..', 'assets', ...parts)
}

let keywords: KeywordEntry[] = []
let defaultTemplate = '<html><body>{{blurbs}}</body></html>'

function loadAssets(): void {
	try {
		const raw = fs.readFileSync(assetPath('default-keywords.json'), 'utf8')
		keywords = (JSON.parse(raw) as { keywords: KeywordEntry[] }).keywords
	} catch (e) {
		console.error('[S!] failed to load default-keywords.json: ', e)
	}

	try {
		defaultTemplate = fs.readFileSync(assetPath('default-template.html'), 'utf8')
	} catch (e) {
		console.error('[S!] failed to load default-template.html:', e)
	}
}

export function registerScraperIPC(win: BrowserWindow): void {
	loadAssets()

	ipcMain.handle('scan', async (_event, method: 'safari' | 'cdp' | 'clipboard') => {
		const log = (msg: string): void => {
			if (!win.isDestroyed()) win.webContents.send('log', msg)
		}

		try {
			log('[S] Starting scan...')

			let raw: { html: string; title: string; url: string }

			if (method === 'safari') {
				log('[S] Connecting to Safari...')
				raw = scrapeSafari()
			} else if (method === 'cdp') {
				log('[S] Connecting to Chrome on Port 9222...')
				raw = await scrapeCDP()
			} else {
				log('[S] Reading from clipboard...')
				raw = scrapeClipboard()
			}

			log(`[S] Grabbed: "${raw.title}"`)
			if (raw.url) log(`[S] URL: ${raw.url}`)

			log('[S] Extracting text from HTML...')
			const text = extractText(raw.html)
			log(`[S] Extracted ${text.length.toLocaleString()} characters`)

			log(`[s] Scanning against ${keywords.length} keywords...`)
			const matches = rankKeywords(text, keywords)

			const withBlurbs = matches.filter((m) => m.defaultBlurb !== null)
			const withoutBlurbs = matches.filter((m) => m.defaultBlurb === null)

			if (matches.length === 0) {
				log('[S!] No matches found. Consider adding more keywords to the library.')
			} else {
				const preview = matches
					.slice(0, 8)
					.map((m) => m.keyword.name)
					.join(', ')
				const more = matches.length > 8 ? ` (+${matches.length - 8} more)` : ''
				log(`[S] Found ${matches.length} matches: ${preview}${more}`)
			}

			log('[S] Assembling cover letter...')
			const assembled = assembleLetterFromTemplate(defaultTemplate, matches)
			log(
				`[S] Done: ${withBlurbs.length} blurbs inserted, ` +
					`${withoutBlurbs.length} keyword(s) have no blurb yet`
			)

			return {
				success: true,
				title: raw.title,
				url: raw.url,
				matches: matches.map((m) => ({
					name: m.keyword.name,
					count: m.count,
					hasBlurb: m.defaultBlurb !== null
				})),
				assembled
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err)
			log(`[S!] ${message}`)
			return { success: false, error: message }
		}
	})
}
