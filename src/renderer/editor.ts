export const Editor = (() => {
	let root: HTMLElement;
	let textArea: HTMLTextAreaElement;
	let previewFrame: HTMLIFrameElement;
	let mode: 'visual' | 'text' | 'preview' = 'visual';
	let undoStack: string[] = [];
	let redoStack: string[] = [];
	const MAX_STACK = 20; // TODO: migrate this to be its own proper config/settings thing
	let pushTimer: ReturnType<typeof setTimeout> | null = null;
	const KATEX_HEAD = `
	<link rel="stylesheet" href="./vendor/katex/katex.min.css">
	<script defer src="./vendor/katex/katex.min.js"></script>
	<script defer src="./vendor/katex/contrib/auto-render.min.js"></script>
	<script defer src="./katex-init.js"></script>`;

	function stripDocument(html: string): string {
		const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
		const inner = bodyMatch ? bodyMatch[1] : html;
		return inner
			.replace(/<style[\s\S]*?<\/style>/gi, '')
			.replace(/<script[\s\S]*?<\/script>/gi, '')
			.replace(/<\/?(html|head|body)[^>]*>/gi, '')
			.trim();
	}

	function init(elementId: string, textAreaId: string, previewId: string): void {
		root = document.getElementById(elementId) as HTMLElement;
		textArea = document.getElementById(textAreaId) as HTMLTextAreaElement;
		previewFrame = document.getElementById(previewId) as HTMLIFrameElement;
		root.contentEditable = 'true';

		resetWithMarker();
		pushSnapshot(true);

		root.addEventListener('input', () => {
			if (pushTimer) clearTimeout(pushTimer);
			pushTimer = setTimeout(() => pushSnapshot(), 400);
		});

		root.addEventListener('keydown', (e) => {
			const meta = e.metaKey || e.ctrlKey;
			if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
				e.preventDefault();
				undo();
			} else if (
				meta &&
				((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y')
			) {
				e.preventDefault();
				redo();
			}
		});
	}

	function pushSnapshot(seedOnly = false): void {
		const html = root.innerHTML;
		if (!seedOnly && undoStack[undoStack.length - 1] === html) return;
		undoStack.push(html);
		if (undoStack.length > MAX_STACK) undoStack.shift();
		if (!seedOnly) redoStack = [];
	}

	function undo(): void {
		if (undoStack.length <= 1) return;
		redoStack.push(undoStack.pop()!);
		root.innerHTML = undoStack[undoStack.length - 1];
	}

	function redo(): void {
		if (redoStack.length === 0) return;
		const html = redoStack.pop()!;
		undoStack.push(html);
		root.innerHTML = html;
	}

	function exec(command: string, value?: string): void {
		root.focus();
		document.execCommand(command, false, value);
		pushSnapshot();
	}

	function setFontSize(px: number): void {
		root.focus();
		document.execCommand('fontSize', false, '7');
		root.querySelectorAll('font[size="7"]').forEach((el) => {
			const span = el as HTMLElement;
			span.removeAttribute('size');
			span.style.fontSize = `${px}px`;
		});
		pushSnapshot();
	}

	function resetWithMarker(): void {
		root.innerHTML =
			'<p><span class="insertion-marker" contenteditable="false">insert here</span></p>';
	}

	function clear(): void {
		resetWithMarker();
		undoStack = [];
		redoStack = [];
		pushSnapshot(true);
	}

	function insertBlurbAtMarker(html: string): void {
		root.focus();
		const marker = root.querySelector('.insertion-marker');
		const wrapper = document.createElement('div');
		// See comment under setHTML
		wrapper.innerHTML = stripDocument(html);
		const newMarker =
			'<span class="insertion-marker" contenteditable="false">insert here</span>';

		if (marker && marker.parentElement) {
			marker.outerHTML = wrapper.innerHTML + ' ' + newMarker;
		} else {
			root.innerHTML += wrapper.innerHTML + ` <p>${newMarker}</p>`;
		}
		pushSnapshot();
	}

	function insertMarkerAtCursor(): void {
		exec(
			'insertHTML',
			'<span class="insertion-marker" contenteditable="false">insert here</span>'
		);
	}

	function getHTML(): string {
		// strip the marker otherwise it appears on the actual final output
		const source = mode === 'text' ? textArea.value : root.innerHTML;
		return source.replace(/<span class="insertion-marker"[^>]*>.*?<\/span>/g, '');
	}

	function setHTML(html: string): void {
		// Pretty sure the reason why the UI was breaking was because it'd try to render the full base template which
		// had HTML elements of its own, this should now strip it clean.
		const clean = stripDocument(html);
		root.innerHTML = clean;
		textArea.value = clean;
		undoStack = [];
		redoStack = [];
		pushSnapshot(true);
	}

	function insertAtExp(html: string): void {
		const clean = stripDocument(html);
		if (mode === 'text') {
			const start = textArea.selectionStart;
			const end = textArea.selectionEnd;
			textArea.value = textArea.value.slice(0, start) + clean + textArea.value.slice(end);
		} else {
			insertBlurbAtMarker(clean);
		}
	}

	function setMode(next: 'visual' | 'text' | 'preview'): void {
		if (mode === 'visual' && next !== 'visual') syncFromVisual();
		if (mode === 'text' && next !== 'text') syncFromText();

		mode = next;
		root.style.display = mode === 'visual' ? 'block' : 'none';
		textArea.style.display = mode === 'text' ? 'block' : 'none';
		previewFrame.style.display = mode === 'preview' ? 'block' : 'none';

		if (mode === 'preview') {
			previewFrame.srcdoc = `<html><head>${KATEX_HEAD}</head><body>${getHTML()}</body></html>`;
		}
	}

	function syncFromVisual(): void {
		textArea.value = getHTML();
	}

	function syncFromText(): void {
		root.innerHTML = textArea.value;
		pushSnapshot();
	}

	function getMode(): string {
		return mode;
	}

	return {
		init,
		exec,
		setFontSize,
		clear,
		insertBlurbAtMarker,
		insertMarkerAtCursor,
		getHTML,
		setHTML,
		undo,
		redo,
		insertAtExp,
		setMode,
		getMode
	};
})();
