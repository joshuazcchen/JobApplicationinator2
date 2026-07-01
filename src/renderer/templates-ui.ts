import type { TemplateDTO } from './types.ts';

export const TemplatesUI = (() => {
	let listEl: HTMLElement;
	let previewEl: HTMLIFrameElement;
	let uploadInput: HTMLInputElement;
	let templates: TemplateDTO[] = [];
	let selectedId: number | null = null;

	function init(): void {
		listEl = document.getElementById('tpl-list') as HTMLElement;
		previewEl = document.getElementById('tpl-preview') as HTMLIFrameElement;
		uploadInput = document.getElementById('tpl-upload-input') as HTMLInputElement;

		uploadInput.addEventListener('change', async () => {
			const file = uploadInput.files?.[0];
			if (!file) return;
			const text = await file.text();
			const name = file.name.replace(/\.html?$/i, '');
			const id = await window.electronAPI.templates.create(name, text);
			uploadInput.value = '';
			await refresh(id);
		});
	}

	async function refresh(selectAfter?: number): Promise<void> {
		templates = await window.electronAPI.templates.list();
		if (selectAfter) selectedId = selectAfter;
		if (!selectedId && templates.length > 0) selectedId = templates[0].id;
		renderList();
		renderPreview();
	}

	function renderList(): void {
		if (templates.length === 0) {
			listEl.innerHTML = '<p class="hint-text">No templates found.</p>';
			return;
		}

		listEl.innerHTML = templates
			.map((t) => {
				const active = t.id === selectedId ? ' active' : '';
				const defaultBadge = t.is_default
					? '<span class="tpl-default-badge">Default</span>'
					: '';
				return `
          <div class="tpl-row${active}" data-id="${t.id}">
            <span class="tpl-row-name">${esc(t.name)} ${defaultBadge}</span>
            <div class="tpl-row-actions">
              <button class="btn btn-secondary tpl-set-default-btn" data-id="${t.id}">Set default</button>
              <button class="btn btn-danger-text tpl-delete-btn" data-id="${t.id}">Delete</button>
            </div>
          </div>`;
			})
			.join('');

		listEl.querySelectorAll<HTMLElement>('.tpl-row').forEach((el) => {
			el.addEventListener('click', (e) => {
				if ((e.target as HTMLElement).closest('button')) return;
				selectedId = Number(el.dataset.id);
				renderList();
				renderPreview();
			});
		});

		listEl.querySelectorAll<HTMLButtonElement>('.tpl-set-default-btn').forEach((btn) => {
			btn.addEventListener('click', async () => {
				await window.electronAPI.templates.setDefault(Number(btn.dataset.id));
				await refresh(Number(btn.dataset.id));
			});
		});

		listEl.querySelectorAll<HTMLButtonElement>('.tpl-delete-btn').forEach((btn) => {
			btn.addEventListener('click', async () => {
				if (!confirm('Delete this template?')) return;
				await window.electronAPI.templates.delete(Number(btn.dataset.id));
				selectedId = null;
				await refresh();
			});
		});
	}

	function renderPreview(): void {
		const tpl = templates.find((t) => t.id === selectedId);
		if (!tpl) {
			previewEl.srcdoc =
				'<p style="font-family:sans-serif;color:#A8A8A8;padding:20px;">No template selected.</p>';
			return;
		}
		const highlighted = tpl.content.replace(
			/\{\{(\w+)\}\}/g,
			'<mark style="background:#FFF3B3;padding:1px 3px;border-radius:2px;">{{$1}}</mark>'
		);
		previewEl.srcdoc = highlighted;
	}

	function esc(s: string): string {
		return s.replace(
			/[&<>"']/g,
			(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
		);
	}

	return { init, refresh };
})();
