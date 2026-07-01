import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
	scan: (method: 'safari' | 'cdp' | 'clipboard') => ipcRenderer.invoke('scan', method),
	saveOutput: (content: string, format: 'html' | 'txt') =>
		ipcRenderer.invoke('save-output', content, format),
	onLog: (callback: (message: string) => void) => {
		ipcRenderer.on('log', (_event, message: string) => callback(message));
	},
	clearLogListeners: () => ipcRenderer.removeAllListeners('log'),

	keywords: {
		list: () => ipcRenderer.invoke('kw:list'),
		create: (name: string, triggers: string[]) =>
			ipcRenderer.invoke('kw:create', name, triggers),
		update: (id: number, name: string, triggers: string[]) =>
			ipcRenderer.invoke('kw:update', id, name, triggers),
		delete: (id: number) => ipcRenderer.invoke('kw:delete', id),
		addBlurb: (keywordId: number, label: string, contentHtml: string, isDefault: boolean) =>
			ipcRenderer.invoke('kw:addBlurb', keywordId, label, contentHtml, isDefault),
		updateBlurb: (id: number, label: string, contentHtml: string) =>
			ipcRenderer.invoke('kw:updateBlurb', id, label, contentHtml),
		deleteBlurb: (id: number) => ipcRenderer.invoke('kw:deleteBlurb', id),
		setDefaultBlurb: (keywordId: number, blurbId: number) =>
			ipcRenderer.invoke('kw:setDefaultBlurb', keywordId, blurbId)
	},

	templates: {
		list: () => ipcRenderer.invoke('tpl:list'),
		getDefault: () => ipcRenderer.invoke('tpl:getDefault'),
		create: (name: string, contentHtml: string) =>
			ipcRenderer.invoke('tpl:create', name, contentHtml),
		delete: (id: number) => ipcRenderer.invoke('tpl:delete', id),
		setDefault: (id: number) => ipcRenderer.invoke('tpl:setDefault', id)
	},

	applications: {
		list: () => ipcRenderer.invoke('app:list'),
		get: (id: number) => ipcRenderer.invoke('app:get', id),
		updateStatus: (id: number, status: string) =>
			ipcRenderer.invoke('app:updateStatus', id, status),
		updateNotes: (id: number, notes: string) =>
			ipcRenderer.invoke('app:updateNotes', id, notes),
		saveCoverLetter: (id: number, html: string) =>
			ipcRenderer.invoke('app:saveCoverLetter', id, html)
	}
});
