export const Editor = (() => {
	let root: HTMLElement;
	let undoStack: string[] = [];
	let redoStack: string[] = [];
	const MAX_STACK = 20; // TODO: migrate this to be its own proper config/settings thing
	let pushTimer: ReturnType<typeof setTimeout> | null = null;

	function init(elementId: string): void {
		root = document.getElementById(elementId) as HTMLElement;
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
		wrapper.innerHTML = html;
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
		return root.innerHTML.replace(/<span class="insertion-marker"[^>]*>.*?<\/span>/g, '');
	}

	function setHTML(html: string): void {
		root.innerHTML = html;
		undoStack = [];
		redoStack = [];
		pushSnapshot(true);
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
		redo
	};
})();
