import { ipcMain } from 'electron';
import { getDatabase } from '../db/schema';
import * as KW from '../db/keywords';
import * as TPL from '../db/templates';
import * as APP from '../db/applications';
import * as fs from 'fs';
import * as path from 'path';
import { app, shell } from 'electron';
import { resetDatabase } from '../db/schema';
import { seedKeywords } from '../db/keywords';
import { seedTemplates } from '../db/templates';
import { assetPath } from '../asset-path';

function examplesDir(): string {
	return app.isPackaged
		? path.join(process.resourcesPath, 'assets', 'examples')
		: path.join(__dirname, '..', '..', '..', 'assets', 'examples');
}

export function registerDatabaseIPC(): void {
	const db = getDatabase();

	ipcMain.handle('kw:list', () => KW.getKeywordsDetails(db));
	ipcMain.handle('kw:create', (_e, name: string, triggers: string[]) =>
		KW.createKeyword(db, name, triggers)
	);
	ipcMain.handle('kw:update', (_e, id: number, name: string, triggers: string[]) =>
		KW.updateKeyword(db, id, name, triggers)
	);
	ipcMain.handle('kw:delete', (_e, id: number) => KW.deleteKeyword(db, id));
	ipcMain.handle(
		'kw:addBlurb',
		(_e, keywordId: number, label: string, contentHtml: string, isDefault: boolean) =>
			KW.addBlurb(db, keywordId, label, contentHtml, isDefault)
	);
	ipcMain.handle('kw:updateBlurb', (_e, id: number, label: string, contentHtml: string) =>
		KW.updateBlurb(db, id, label, contentHtml)
	);
	ipcMain.handle('kw:deleteBlurb', (_e, id: number) => KW.deleteBlurb(db, id));
	ipcMain.handle('kw:setDefaultBlurb', (_e, keywordId: number, blurbId: number) =>
		KW.setDefaultBlurb(db, keywordId, blurbId)
	);

	ipcMain.handle('tpl:list', () => TPL.getTemplates(db));
	ipcMain.handle('tpl:getDefault', () => TPL.getDefaultTemplate(db));
	ipcMain.handle('tpl:create', (_e, name: string, contentHtml: string) =>
		TPL.createTemplate(db, name, contentHtml)
	);
	ipcMain.handle('tpl:delete', (_e, id: number) => TPL.deleteTemplate(db, id));
	ipcMain.handle('tpl:setDefault', (_e, id: number) => TPL.setDefaultTemplate(db, id));
	ipcMain.handle('tpl:listExamples', () => {
		try {
			return fs
				.readdirSync(examplesDir())
				.filter((f) => f.endsWith('.html') || f.endsWith('.tex') || f.endsWith('.docx'))
				.map((f) => ({
					name: path.parse(f).name,
					file: f
				}));
		} catch {
			return [];
		}
	});

	ipcMain.handle('tpl:importExamples', (_e, file: string) => {
		const html = fs.readFileSync(path.join(examplesDir(), file), 'utf8');
		return TPL.createTemplate(db, path.parse(file).name, html);
	});

	ipcMain.handle('app:list', () => APP.listApplications(db));
	ipcMain.handle('app:get', (_e, id: number) => APP.getApplication(db, id));
	ipcMain.handle('app:updateStatus', (_e, id: number, status: string) =>
		APP.updateApplicationStatus(db, id, status)
	);
	ipcMain.handle('app:updateNotes', (_e, id: number, notes: string) =>
		APP.updateApplicationNotes(db, id, notes)
	);
	ipcMain.handle('app:stats', () => APP.getStats(db));
	ipcMain.handle('app:saveCoverLetter', (_e, id: number, html: string) =>
		APP.saveCoverLetter(db, id, html)
	);
	// TODO:
	// search.
	ipcMain.handle('app:delete', (_e, id: number) => APP.deleteApplication(db, id));
	ipcMain.handle('app:rename', (_e, id: number, roleTitle: string, companyName: string) =>
		APP.nameApplication(db, id, roleTitle, companyName)
	);
	ipcMain.handle('app:setPinned', (_e, id: number, pinned: boolean) =>
		APP.setApplicationPinned(db, id, pinned)
	);
	ipcMain.handle('app:openDataFolder', () => shell.openPath(app.getPath('userData')));
	ipcMain.handle('app:resetDatabase', () => {
		resetDatabase();
		const freshDb = getDatabase();
		try {
			const raw = fs.readFileSync(assetPath('default-keywords.json'), 'utf8');
			seedKeywords(freshDb, JSON.parse(raw));
			const html = fs.readFileSync(assetPath('default-template.html'), 'utf8');
			seedTemplates(freshDb, html);
		} catch (e) {
			console.error('[reset] reseed failed:', e);
		}
		return { success: true };
	});
}
