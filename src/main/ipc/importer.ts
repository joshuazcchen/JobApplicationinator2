import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import mammoth from 'mammoth';

if (typeof (globalThis as any).DOMMatrix === 'undefined') {
	(globalThis as any).DOMMatrix = class DOMMatrix {
		a = 1;
		b = 0;
		c = 0;
		d = 1;
		e = 0;
		f = 0;
		constructor(_init?: unknown) {}
	};
}

export function registerImporterIPC(win: BrowserWindow): void {
	ipcMain.handle('import:docx', async () => {
		const { filePaths, canceled } = await dialog.showOpenDialog(win, {
			title: 'Import DOCX',
			filters: [{ name: 'Word Document', extensions: ['docx'] }],
			properties: ['openFile']
		});
		if (canceled || !filePaths[0]) return { success: false, cancelled: true };

		try {
			const result = await mammoth.convertToHtml({ path: filePaths[0] });
			return { success: true, html: result.value };
		} catch (e) {
			return { success: false, error: e instanceof Error ? e.message : String(e) };
		}
	});

	ipcMain.handle('import:pdf', async () => {
		const { filePaths, canceled } = await dialog.showOpenDialog(win, {
			title: 'Import PDF',
			filters: [{ name: 'PDF', extensions: ['pdf'] }],
			properties: ['openFile']
		});
		if (canceled || !filePaths[0]) return { success: false, cancelled: true };

		try {
			const pdfParseModule = await import('pdf-parse');
			const pdfParse =
				(
					pdfParseModule as unknown as {
						default: (buf: Buffer) => Promise<{ text: string }>;
					}
				).default ??
				(pdfParseModule as unknown as (buf: Buffer) => Promise<{ text: string }>);
			const buffer = fs.readFileSync(filePaths[0]);
			const data = await pdfParse(buffer);
			const html = data.text
				.split(/\n{2,}/)
				.map((p: string) => `<p>${p.trim().replace(/\n/g, ' ')}</p>`)
				.join('\n');
			return { success: true, html };
		} catch (e) {
			return { success: false, error: e instanceof Error ? e.message : String(e) };
		}
	});
}
