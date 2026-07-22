// Copyright (c) 2026 Joshua Chen.
// SPDX-License-Identifier: GPL-3.0-or-later

import { ipcMain, dialog, app } from 'electron';
import { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { htmlToDocxBuffer } from '../engine/docx';

export function registerFileIPC(win: BrowserWindow): void {
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

	ipcMain.handle('save-pdf', async (_event, html: string) => {
		const timestamp = new Date().toISOString().slice(0, 10);
		const { filePath, canceled } = await dialog.showSaveDialog(win, {
			title: 'Export Cover Letter as PDF',
			defaultPath: path.join(app.getPath('documents'), `cover-letter-${timestamp}.pdf`),
			filters: [{ name: 'PDF', extensions: ['pdf'] }]
		});
		if (canceled || !filePath) return { success: false, cancelled: true };

		const printWin = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
		try {
			await printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
			const pdfBuffer = await printWin.webContents.printToPDF({
				printBackground: true,
				pageSize: 'Letter',
				margins: { marginType: 'custom', top: 48, bottom: 48, left: 48, right: 48 }
			});
			fs.writeFileSync(filePath, pdfBuffer);
			return { success: true, filePath };
		} catch (e) {
			return { success: false, error: e instanceof Error ? e.message : String(e) };
		} finally {
			printWin.destroy();
		}
	});

	ipcMain.handle('save-docx', async (_event, html: string) => {
		const timestamp = new Date().toISOString().slice(0, 10);
		const { filePath, canceled } = await dialog.showSaveDialog(win, {
			title: 'Export Cover Letter as DOCX',
			defaultPath: path.join(app.getPath('documents'), `cover-letter-${timestamp}.docx`),
			filters: [{ name: 'Word Document', extensions: ['docx'] }]
		});
		if (canceled || !filePath) return { success: false, cancelled: true };

		try {
			const buffer = await htmlToDocxBuffer(html);
			fs.writeFileSync(filePath, buffer);
			return { success: true, filePath };
		} catch (e) {
			return { success: false, error: e instanceof Error ? e.message : String(e) };
		}
	});
}
