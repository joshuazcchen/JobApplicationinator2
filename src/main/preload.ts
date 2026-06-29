import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
	scan: (method: 'safari' | 'cdp' | 'clipboard') => ipcRenderer.invoke('scan', method),

	saveOutput: (content: string, format: 'html' | 'txt') =>
		ipcRenderer.invoke('save-output', content, format),

	onLog: (callback: (message: string) => void) => {
		ipcRenderer.on('log', (_event, message: string) => callback(message))
	},

	clearLogListeners: () => {
		ipcRenderer.removeAllListeners('log')
	}
})
