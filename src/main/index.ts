import { app, BrowserWindow } from 'electron'
import * as path from 'path';
import * as fs from 'fs';
import { initDatabase, getDatabase } from './db/schema'
import { registerScraperIPC } from './ipc/scraper'
import { registerFileIPC } from './ipc/file'
import { registerDatabaseIPC } from './ipc/database'
import { seedKeywords } from './db/keywords';
import { seedTemplates } from './db/templates';

let mainWindow: BrowserWindow | null = null

function assetPath(...parts: string[]): string {
	if (app.isPackaged) {
		return path.join(process.resourcesPath, 'assets', ...parts);
	}
	return path.join(__dirname, '..', '..', 'assets', ...parts);
}

function seedDatabase(): void {
	const db = getDatabase();

	try {
		const raw = fs.readFileSync(assetPath('default-keywords.json'), 'utf8');
		seedKeywords(db, JSON.parse(raw));
	} catch (e) {
		console.error('seed error:', e);
	}

	try {
		const html = fs.readFileSync(assetPath('default-template.html'), 'utf8');
		seedTemplates(db, html);
	} catch (e) {
		console.error('seed error:', e);
	}
}

function createWindow(): void {
	mainWindow = new BrowserWindow({
		width: 1100,
		height: 800,
		minWidth: 800,
		minHeight: 600,
		title: 'JobApplicationinator v2',
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false
		}
	})

	mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'))

	mainWindow.webContents.openDevTools()

	mainWindow.on('closed', () => {
		mainWindow = null
	})
}

app.whenReady().then(() => {
	initDatabase()
	seedDatabase();
	registerFileIPC()
	registerDatabaseIPC();

	createWindow()
	if (mainWindow) registerScraperIPC(mainWindow)

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})
