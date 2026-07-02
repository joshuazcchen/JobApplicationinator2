import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import { getDatabase } from '../db/schema';
import { createKeyword, addBlurb, getKeywordsDetails } from '../db/keywords';

interface V1Blurb {
	keywords: string[];
	description: string;
}
type V1Format = Record<string, V1Blurb>;

interface V2Format {
	keywords: {
		name: string;
		triggers: string[];
		blurbs: { label: string; content_html: string; is_default: boolean }[];
	}[];
}

export function registerLibraryIPC(win: BrowserWindow): void {
	const db = getDatabase();

	ipcMain.handle('kw:importFile', async () => {
		const { filePaths, canceled } = await dialog.showOpenDialog(win, {
			title: 'Import Blurb Library',
			filters: [{ name: 'JSON', extensions: ['json'] }],
			properties: ['openFile']
		});
		if (canceled || !filePaths[0]) return { success: false, cancelled: true };

		try {
			const raw = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'));
			let imported = 0;

			if (Array.isArray(raw.keywords)) {
				const data = raw as V2Format;
				for (const kw of data.keywords) {
					const id = createKeyword(db, kw.name, kw.triggers);
					for (const b of kw.blurbs)
						addBlurb(db, id, b.label, b.content_html, b.is_default);
					imported++;
				}
			} else {
				const data = raw as V1Format;
				for (const [name, entry] of Object.entries(data)) {
					const id = createKeyword(db, name, entry.keywords);
					addBlurb(db, id, 'Imported', entry.description, true);
					imported++;
				}
			}

			return { success: true, imported };
		} catch (e) {
			return { success: false, error: e instanceof Error ? e.message : String(e) };
		}
	});

	ipcMain.handle('kw:exportFile', async () => {
		const { filePath, canceled } = await dialog.showSaveDialog(win, {
			title: 'Export Blurb Library',
			defaultPath: `blurb-library-${new Date().toISOString().slice(0, 10)}.json`,
			filters: [{ name: 'JSON', extensions: ['json'] }]
		});
		if (canceled || !filePath) return { success: false, cancelled: true };

		const keywords = getKeywordsDetails(db);
		fs.writeFileSync(filePath, JSON.stringify({ keywords }, null, 2), 'utf8');
		return { success: true, filePath };
	});
}
