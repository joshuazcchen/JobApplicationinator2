import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { initDatabase, getDatabase } from './db/schema';
import { registerScraperIPC } from './ipc/scraper';
import { registerFileIPC } from './ipc/file';
import { registerDatabaseIPC } from './ipc/database';
import { registerImporterIPC } from './ipc/importer';
import { registerLibraryIPC } from './ipc/library';
import { seedKeywords } from './db/keywords';
import { seedTemplates } from './db/templates';
import { assetPath } from './asset-path';

let mainWindow: BrowserWindow | null = null;
let loadWindow: BrowserWindow | null = null;

function loadScreen(): void {
	loadWindow = new BrowserWindow({
		width: 320,
		height: 220,
		frame: false,
		resizable: false,
		transparent: false,
		backgroundColor: '#1a1a2e',
		show: true,
		webPreferences: { contextIsolation: true, nodeIntegration: false }
	});
	loadWindow.loadFile(path.join(__dirname, '..', 'renderer', 'loading', 'loading.html'));
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
	});

	mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

	mainWindow.webContents.openDevTools();

	mainWindow.once('ready-to-show', () => {
		mainWindow!.show();
		if (loadWindow && !loadWindow.isDestroyed()) {
			loadWindow.close();
			loadWindow = null;
		}
	});

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

app.whenReady().then(() => {
	loadScreen();
	initDatabase();
	seedDatabase();
	registerFileIPC();
	registerDatabaseIPC();

	createWindow();
	if (mainWindow) {
		registerScraperIPC(mainWindow);
		registerImporterIPC(mainWindow);
		registerLibraryIPC(mainWindow);
	}

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
