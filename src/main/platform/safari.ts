import { execSync } from 'child_process'

export function scrapeSafari(): { html: string; title: string; url: string } {
	if (process.platform !== 'darwin') {
		throw new Error('Safari scraping requires macOS.')
	}

	const run = (script: string): string =>
		execSync(`osascript -e '${script}'`, {
			timeout: 10_000,
			maxBuffer: 1024 * 1024 * 50
		})
			.toString()
			.trim()

	const html = run('tell application "Safari" to get source of document 1')
	const title = run('tell application "Safari" to get name of document 1')
	const url = run('tell application "Safari" to get URL of document 1')

	return { html, title, url }
}
