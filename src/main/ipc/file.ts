import { ipcMain, dialog, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export function registerFileIPC(): void {
	ipcMain.handle('save-output', async (_event, content: string, format: 'html' | 'txt') => {
		const ext = format === 'html' ? 'html' : 'txt';
		const timestamp = new Date().toISOString().slice(0, 10);
		const defaultName = `cover-letter-${timestamp}.${ext}`;

		const { filePath, canceled } = await dialog.showSaveDialog({
			title: 'Save',
			defaultPath: path.join(app.getPath('documents'), defaultName),
			filters:
				format === 'html'
					? [{ name: 'HTML', extensions: ['html'] }]
					: // TODO: reimplement export to pdf but the library refuses to work here for some reason
						[{ name: 'Plain Text', extensions: ['txt'] }]
		});

		if (canceled || !filePath) return { success: false, cancelled: true };

		try {
			let output = content;
			if (format === 'txt') {
				output = content
					.replace(/<[^>]+>/g, '')
					.replace(/\s+/g, ' ')
					.trim();
			}
			fs.writeFileSync(filePath, output, 'utf8');
			return { success: true, filePath };
		} catch (e) {
			const error = e instanceof Error ? e.message : String(e);
			return { success: false, error };
		}
	});
}
