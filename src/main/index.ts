import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import { initDatabase } from './db/schema'
import { registerScraperIPC } from './ipc/scraper'
import { registerFileIPC } from './ipc/file'

let mainWindow: BrowserWindow | null = null

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
	registerFileIPC()

	createWindow()
	if (mainWindow) registerScraperIPC(mainWindow)

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})
