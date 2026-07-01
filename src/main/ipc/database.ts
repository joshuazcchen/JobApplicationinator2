import { ipcMain } from 'electron';
import { getDatabase } from '../db/schema';
import * as KW from '../db/keywords';
import * as TPL from '../db/templates';
import * as APP from '../db/applications';

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

	ipcMain.handle('app:list', () => APP.listApplications(db));
	ipcMain.handle('app:get', (_e, id: number) => APP.getApplication(db, id));
	ipcMain.handle('app:updateStatus', (_e, id: number, status: string) =>
		APP.updateApplicationStatus(db, id, status)
	);
	ipcMain.handle('app:updateNotes', (_e, id: number, notes: string) =>
		APP.updateApplicationNotes(db, id, notes)
	);
	ipcMain.handle('app:saveCoverLetter', (_e, id: number, html: string) =>
		APP.saveCoverLetter(db, id, html)
	);
}
