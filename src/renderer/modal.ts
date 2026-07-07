// Copyright (c) 2026 Joshua Chen.
// SPDX-License-Identifier: GPL-3.0-or-later

export const Modal = (() => {
	const overlay = document.getElementById('modal-overlay') as HTMLElement;
	const titleEl = document.getElementById('modal-title') as HTMLElement;
	const bodyEl = document.getElementById('modal-body') as HTMLElement;
	const cancelBtn = document.getElementById('modal-cancel') as HTMLButtonElement;
	const confirmBtn = document.getElementById('modal-confirm') as HTMLButtonElement;

	function close(): void {
		overlay.style.display = 'none';
		bodyEl.innerHTML = '';
	}

	function prompt(title: string, placeholder = '', initialValue = ''): Promise<string | null> {
		return new Promise((resolve) => {
			titleEl.textContent = title;
			bodyEl.innerHTML = `<input id="modal-input" type="text" placeholder="${placeholder}" value="${initialValue.replace(/"/g, '&quot;')}">`;
			overlay.style.display = 'flex';

			const input = document.getElementById('modal-input') as HTMLInputElement;
			input.focus();
			input.select();

			const onConfirm = (): void => {
				cleanup();
				resolve(input.value);
			};
			const onCancel = (): void => {
				cleanup();
				resolve(null);
			};
			const onKey = (e: KeyboardEvent): void => {
				if (e.key === 'Enter') onConfirm();
				if (e.key === 'Escape') onCancel();
			};

			function cleanup(): void {
				confirmBtn.removeEventListener('click', onConfirm);
				cancelBtn.removeEventListener('click', onCancel);
				input.removeEventListener('keydown', onKey);
				close();
			}

			confirmBtn.addEventListener('click', onConfirm);
			cancelBtn.addEventListener('click', onCancel);
			input.addEventListener('keydown', onKey);
		});
	}

	function confirmMsg(title: string, warning: string, requiredPhrase: string): Promise<boolean> {
		return new Promise((resolve) => {
			titleEl.textContent = title;
			bodyEl.innerHTML = `
			<p>${warning}</p>
			<p>Type <strong>${requiredPhrase}</strong> to confirm:</p>
			<input id="modal-input" type="text">`;
			overlay.style.display = 'flex';
			confirmBtn.disabled = true;

			const input = document.getElementById('modal-input') as HTMLInputElement;
			input.focus();

			const onInput = (): void => {
				confirmBtn.disabled = input.value !== requiredPhrase;
			};
			const onConfirm = (): void => {
				if (input.value !== requiredPhrase) return;
				cleanup();
				resolve(true);
			};
			const onCancel = (): void => {
				cleanup();
				resolve(false);
			};
			const onKey = (e: KeyboardEvent): void => {
				if (e.key === 'Enter') onConfirm();
				if (e.key === 'Escape') onCancel();
			};

			function cleanup(): void {
				confirmBtn.disabled = false;
				confirmBtn.removeEventListener('click', onConfirm);
				cancelBtn.removeEventListener('click', onCancel);
				input.removeEventListener('input', onInput);
				input.removeEventListener('keydown', onKey);
				close();
			}

			input.addEventListener('input', onInput);
			confirmBtn.addEventListener('click', onConfirm);
			cancelBtn.addEventListener('click', onCancel);
			input.addEventListener('keydown', onKey);
		});
	}

	return { prompt, confirmMsg };
})();
