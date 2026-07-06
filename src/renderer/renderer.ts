import { Editor } from './editor.js';
import { Sidebar } from './sidebar.js';
import { KeywordsUI } from './keywords-ui.js';
import { TemplatesUI } from './templates-ui.js';
import type { ScanMethod, MatchDTO } from './types.js';
import { Modal } from './modal.js';

const scanBtn = document.getElementById('scan-btn') as HTMLButtonElement;
const methodSelect = document.getElementById('method-select') as HTMLSelectElement;
const logPanel = document.getElementById('log-panel') as HTMLPreElement;
const matchesContainer = document.getElementById('matches-container') as HTMLElement;
const saveHtmlBtn = document.getElementById('save-html-btn') as HTMLButtonElement;
const saveTxtBtn = document.getElementById('save-txt-btn') as HTMLButtonElement;
const saveEditsBtn = document.getElementById('save-edits-btn') as HTMLButtonElement;
const statusBar = document.getElementById('status-bar') as HTMLElement;
const newScanBtn = document.getElementById('new-scan-btn') as HTMLButtonElement;

const navButtons = document.querySelectorAll<HTMLButtonElement>('.nav-btn');
const views = document.querySelectorAll<HTMLElement>('.view');

let currentApplicationId: number | null = null;
let lastMatches: MatchDTO[] = [];

function showView(name: string): void {
	views.forEach((v) => (v.style.display = v.dataset.view === name ? 'flex' : 'none'));
	navButtons.forEach((b) => b.classList.toggle('active', b.dataset.view === name));

	if (name === 'keywords') KeywordsUI.refresh();
	if (name === 'templates') TemplatesUI.refresh();
}

navButtons.forEach((btn) => {
	btn.addEventListener('click', () => showView(btn.dataset.view!));
});

type StatusType = 'idle' | 'running' | 'success' | 'error';

function setStatus(msg: string, type: StatusType): void {
	statusBar.textContent = msg;
	statusBar.className = `status-bar status-${type}`;
}

function appendLog(msg: string): void {
	logPanel.textContent += msg + '\n';
	logPanel.scrollTop = logPanel.scrollHeight;
}

const isMac = navigator.platform.toLowerCase().startsWith('mac');
methodSelect.value = isMac ? 'safari' : 'cdp';

Editor.init('letter-editor', 'letter-textarea', 'letter-preview');
Sidebar.init('sidebar-list', openApplication);
KeywordsUI.init();
TemplatesUI.init();

document.getElementById('btn-bold')!.addEventListener('click', () => Editor.exec('bold'));
document.getElementById('btn-italic')!.addEventListener('click', () => Editor.exec('italic'));
document.getElementById('btn-underline')!.addEventListener('click', () => Editor.exec('underline'));
document.getElementById('btn-undo')!.addEventListener('click', () => Editor.undo());
document.getElementById('btn-redo')!.addEventListener('click', () => Editor.redo());
document
	.getElementById('btn-marker')!
	.addEventListener('click', () => Editor.insertMarkerAtCursor());

document.getElementById('font-select')!.addEventListener('change', (e) => {
	Editor.exec('fontName', (e.target as HTMLSelectElement).value);
});
document.getElementById('size-select')!.addEventListener('change', (e) => {
	Editor.exec('fontSize', (e.target as HTMLSelectElement).value);
});

document.querySelectorAll<HTMLButtonElement>('.mode-tab').forEach((tab) => {
	tab.addEventListener('click', () => {
		document.querySelectorAll('.mode-tab').forEach((t) => t.classList.remove('active'));
		tab.classList.add('active');
		Editor.setMode(tab.dataset.mode as 'visual' | 'text' | 'preview');
	});
});

document.getElementById('btn-import-docx')!.addEventListener('click', async () => {
	const result = await window.electronAPI.importFile.docx();
	if (result.success && result.html) Editor.insertAtExp(result.html);
	else if (!result.cancelled) setStatus(`Import failed: ${result.error}`, 'error');
});

document.getElementById('btn-import-pdf')!.addEventListener('click', async () => {
	const result = await window.electronAPI.importFile.pdf();
	if (result.success && result.html) Editor.insertAtExp(result.html);
	else if (!result.cancelled) setStatus(`Import failed: ${result.error}`, 'error');
});

document.querySelectorAll<HTMLButtonElement>('.mode-tab').forEach((tab) => {
	tab.addEventListener('click', () => {
		document.querySelectorAll('.mode-tab').forEach((t) => t.classList.remove('active'));
		tab.classList.add('active');
		Editor.setMode(tab.dataset.mode as 'visual' | 'text' | 'preview');
	});
});

document.getElementById('btn-import-docx')!.addEventListener('click', async () => {
	const result = await window.electronAPI.importFile.docx();
	if (result.success && result.html) Editor.insertAtExp(result.html);
	else if (!result.cancelled) setStatus(`Import failed: ${result.error}`, 'error');
});

document.getElementById('btn-import-pdf')!.addEventListener('click', async () => {
	const result = await window.electronAPI.importFile.pdf();
	if (result.success && result.html) Editor.insertAtExp(result.html);
	else if (!result.cancelled) setStatus(`Import failed: ${result.error}`, 'error');
});

document.getElementById('reset-db-btn')!.addEventListener('click', async () => {
	const confirmed = await Modal.confirmMsg(
		'Reset Database',
		'This will reset everything.',
		'RESET'
	);
	if (!confirmed) return;
	await window.electronAPI.resetDatabase();
	currentApplicationId = null;
	Editor.clear();
	logPanel.textContent = '';
	matchesContainer.innerHTML = '';
	await Sidebar.refresh();
	await refreshStats();
	setStatus('Database reset.', 'success');
});

newScanBtn.addEventListener('click', () => {
	currentApplicationId = null;
	logPanel.textContent = '';
	matchesContainer.innerHTML = '';
	Editor.clear();
	setStatus('Ready for a new scan.', 'idle');
	showView('scan');
	Sidebar.refresh();
});

function renderMatches(matches: MatchDTO[]): void {
	lastMatches = matches;

	if (matches.length === 0) {
		matchesContainer.innerHTML = '<p class="no-matches">No keyword matches found.</p>';
		return;
	}

	const maxCount = Math.max(...matches.map((m) => m.count));

	matchesContainer.innerHTML = matches
		.slice(0, 25)
		.map((m: MatchDTO, i: number) => {
			const pct = Math.round((m.count / maxCount) * 100);
			const cls = m.hasBlurb ? 'has-blurb' : 'no-blurb';
			const action = m.hasBlurb
				? `<button class="btn-insert" data-idx="${i}">+ Insert</button>`
				: `<button class="btn-write" data-name="${m.name}">Write blurb</button>`;
			return `
			<div class="match-row">
			<div class="bar-track"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div>
			<span class="match-name">${m.name}</span>
			<span class="match-count">×${m.count}</span>
			${action}
			</div>`;
		})
		.join('');

	matchesContainer.querySelectorAll<HTMLButtonElement>('.btn-insert').forEach((btn) => {
		btn.addEventListener('click', () => {
			const blurb = lastMatches?.[Number(btn.dataset.idx)]?.blurbHtml;
			if (blurb) Editor.insertBlurbAtMarker(blurb);
		});
	});

	matchesContainer.querySelectorAll<HTMLButtonElement>('.btn-write').forEach((btn) => {
		btn.addEventListener('click', () => {
			showView('keywords');
			(document.getElementById('kw-new-name') as HTMLInputElement).value =
				btn.dataset.name ?? '';
		});
	});
}

scanBtn.addEventListener('click', async () => {
	const method = methodSelect.value as ScanMethod;

	logPanel.textContent = '';
	matchesContainer.innerHTML = '';
	Editor.clear();
	scanBtn.disabled = true;
	setStatus('Scanning…', 'running');

	window.electronAPI.clearLogListeners();
	window.electronAPI.onLog(appendLog);

	try {
		const result = await window.electronAPI.scan(method);

		if (!result.success) {
			setStatus(`Error: ${result.error ?? 'Unknown error'}`, 'error');
			return;
		}

		currentApplicationId = result.applicationId ?? null;
		renderMatches(result.matches ?? []);
		Editor.setHTML(result.assembled ?? '');

		const matchCount = result.matches?.length ?? 0;
		setStatus(
			`Done — ${matchCount} keyword${matchCount !== 1 ? 's' : ''} matched` +
				(result.title ? ` from "${result.title}"` : ''),
			'success'
		);

		await Sidebar.refresh(currentApplicationId ?? undefined);
		// TODO: wondering if its worthwhile to consolidate this function so that we just have one await here but I
		// doubt it actually affects performance in any meaningful way.
		await refreshStats();
	} finally {
		scanBtn.disabled = false;
	}
});

async function openApplication(id: number): Promise<void> {
	const app = await window.electronAPI.applications.get(id);
	if (!app) return;

	currentApplicationId = app.id;
	logPanel.textContent = `[I] Reopened application ${app.id}: "${app.role_title ?? 'Untitled'}"`;

	renderMatches(
		app.matches.map((m) => ({
			name: m.name,
			count: m.mention_count,
			hasBlurb: m.blurb_id !== null,
			blurbHtml: null
		}))
	);

	Editor.setHTML(app.cover_letter_html ?? '');
	setStatus(`Viewing application #${app.id}`, 'idle');
	showView('scan');
	await Sidebar.refresh(app.id);
}

async function handleSave(format: 'html' | 'txt'): Promise<void> {
	const html = Editor.getHTML();
	if (!html.trim()) {
		setStatus('Nothing to save, scan first.', 'error');
		return;
	}
	const result = await window.electronAPI.saveOutput(html, format);
	if (result.success) setStatus(`Saved to ${result.filePath}`, 'success');
	else if (!result.cancelled) setStatus(`Save failed: ${result.error}`, 'error');
}

async function refreshStats(): Promise<void> {
	const s = await window.electronAPI.applications.stats();
	const statusText = Object.entries(s.byStatus)
		.map(([k, v]) => `${k}: <strong>${v}</strong>`)
		.join(' · ');
	document.getElementById('stats-bar')!.innerHTML =
		`Total: <strong>${s.total}</strong> &nbsp;·&nbsp; Avg matches: <strong>${s.avgMatches}</strong>` +
		(statusText ? ` &nbsp;·&nbsp; ${statusText}` : '');
}

saveHtmlBtn.addEventListener('click', () => handleSave('html'));
saveTxtBtn.addEventListener('click', () => handleSave('txt'));

saveEditsBtn.addEventListener('click', async () => {
	if (!currentApplicationId) {
		setStatus('Run a scan first, nothing to save.', 'error');
		return;
	}
	await window.electronAPI.applications.saveCoverLetter(currentApplicationId, Editor.getHTML());
	setStatus('Edits saved to database.', 'success');
});

document.getElementById('save-pdf-btn')!.addEventListener('click', async () => {
	const html = Editor.getHTML();
	if (!html.trim()) {
		setStatus('nothing to export', 'error');
		return;
	}
	const currentFont =
		(document.getElementById('font-select') as HTMLSelectElement).value || 'Georgia, serif';
	const full = `<html><head><style>body{font-family:${currentFont};font-size:11pt;line-height:1.6;max-width:680px;margin:48px auto;}</style></head><body>${html}</body></html>`;
	const result = await window.electronAPI.savePdf(full);
	if (result.success) setStatus(`Saved → ${result.filePath}`, 'success');
	else if (!result.cancelled) setStatus(`PDF export failed: ${result.error}`, 'error');
});

Sidebar.refresh();
refreshStats();
showView('scan');

document.getElementById('open-data-folder-btn')!.addEventListener('click', () => {
	window.electronAPI.openDataFolder();
});
