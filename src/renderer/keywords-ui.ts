import type { KeywordDTO, BlurbDTO } from './types.js';

export const KeywordsUI = (() => {
	let listEl: HTMLElement;
	let detailEl: HTMLElement;
	let newNameInput: HTMLInputElement;
	let newTriggersInput: HTMLInputElement;
	let addBtn: HTMLButtonElement;
	let keywords: KeywordDTO[] = [];
	let selectedId: number | null = null;

	function init(): void {
		listEl = document.getElementById('kw-list') as HTMLElement;
		detailEl = document.getElementById('kw-detail') as HTMLElement;
		newNameInput = document.getElementById('kw-new-name') as HTMLInputElement;
		newTriggersInput = document.getElementById('kw-new-triggers') as HTMLInputElement;
		addBtn = document.getElementById('kw-add-btn') as HTMLButtonElement;

		addBtn.addEventListener('click', async () => {
			const name = newNameInput.value.trim();
			const triggers = newTriggersInput.value
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean);
			if (!name || triggers.length === 0) return;
			const id = await window.electronAPI.keywords.create(name, triggers);
			newNameInput.value = '';
			newTriggersInput.value = '';
			await refresh(id);
		});
	}

	async function refresh(selectAfter?: number): Promise<void> {
		keywords = await window.electronAPI.keywords.list();
		renderList();
		if (selectAfter) {
			selectedId = selectAfter;
		}
		if (selectedId && keywords.some((k) => k.id === selectedId)) {
			renderDetail(selectedId);
		} else {
			detailEl.innerHTML = '<p class="hint-text">Select a keyword to edit its blurbs.</p>';
		}
	}

	function renderList(): void {
		listEl.innerHTML = keywords
			.map((k) => {
				const active = k.id === selectedId ? ' active' : '';
				const blurbCount = k.blurbs.length;
				return `
			<div class="kw-row${active}" data-id="${k.id}">
			<span class="kw-row-name">${esc(k.name)}</span>
			<span class="kw-row-count">${blurbCount} blurb${blurbCount === 1 ? '' : 's'}</span>
			</div>`;
			})
			.join('');

		listEl.querySelectorAll<HTMLElement>('.kw-row').forEach((el) => {
			el.addEventListener('click', () => {
				selectedId = Number(el.dataset.id);
				renderList();
				renderDetail(selectedId);
			});
		});
	}

	function renderDetail(id: number): void {
		const kw = keywords.find((k) => k.id === id);
		if (!kw) return;

		detailEl.innerHTML = `
		<div class="kw-detail-header">
		<input id="kw-edit-name" class="kw-edit-name" value="${esc(kw.name)}">
		<button id="kw-delete-btn" class="btn btn-danger-text">Delete keyword</button>
		</div>
		<div class="control-group">
		<label>Triggers (comma-separated)</label>
		<input id="kw-edit-triggers" class="kw-edit-triggers" value="${esc(kw.triggers.join(', '))}">
		<button id="kw-save-meta-btn" class="btn btn-secondary">Save name &amp; triggers</button>
		</div>

		<h3 class="kw-blurbs-heading">Blurbs</h3>
		<div id="kw-blurb-list" class="kw-blurb-list">
		${kw.blurbs
			.map(
				(b: BlurbDTO) => `
				<div class="blurb-card" data-blurb-id="${b.id}">
				<div class="blurb-card-header">
				<input class="blurb-label" value="${esc(b.label)}">
				<label class="blurb-default-toggle">
				<input type="radio" name="kw-default-${kw.id}" ${b.is_default ? 'checked' : ''} class="blurb-default-radio">
				Default
				</label>
				<button class="btn btn-danger-text blurb-delete-btn">Delete</button>
				</div>
				<textarea class="blurb-content">${esc(b.content)}</textarea>
				<button class="btn btn-secondary blurb-save-btn">Save blurb</button>
				</div>`
			)
			.join('')}
			</div>

			<div class="kw-new-blurb">
			<h3 class="kw-blurbs-heading">Add a blurb</h3>
			<input id="kw-new-blurb-label" placeholder="Label (e.g. Short, Casual)">
			<textarea id="kw-new-blurb-content" placeholder="Your blurb HTML, in your own voice…"></textarea>
			<button id="kw-new-blurb-btn" class="btn btn-primary">Add blurb</button>
			</div>
			`;

		document.getElementById('kw-delete-btn')!.addEventListener('click', async () => {
			if (!confirm(`Delete "${kw.name}" and all its blurbs?`)) return;
			await window.electronAPI.keywords.delete(kw.id);
			selectedId = null;
			await refresh();
		});

		document.getElementById('kw-save-meta-btn')!.addEventListener('click', async () => {
			const name = (document.getElementById('kw-edit-name') as HTMLInputElement).value.trim();
			const triggers = (document.getElementById('kw-edit-triggers') as HTMLInputElement).value
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean);
			await window.electronAPI.keywords.update(kw.id, name, triggers);
			await refresh();
		});

		detailEl.querySelectorAll<HTMLElement>('.blurb-card').forEach((card) => {
			const blurbId = Number(card.dataset.blurbId);

			card.querySelector('.blurb-save-btn')!.addEventListener('click', async () => {
				const label = (card.querySelector('.blurb-label') as HTMLInputElement).value.trim();
				const content = (card.querySelector('.blurb-content') as HTMLTextAreaElement).value;
				await window.electronAPI.keywords.updateBlurb(blurbId, label, content);
				await refresh();
			});

			card.querySelector('.blurb-delete-btn')!.addEventListener('click', async () => {
				await window.electronAPI.keywords.deleteBlurb(blurbId);
				await refresh();
			});

			card.querySelector('.blurb-default-radio')!.addEventListener('change', async () => {
				await window.electronAPI.keywords.setDefaultBlurb(kw.id, blurbId);
				await refresh();
			});
		});

		document.getElementById('kw-new-blurb-btn')!.addEventListener('click', async () => {
			const label =
				(document.getElementById('kw-new-blurb-label') as HTMLInputElement).value.trim() ||
				'Default';
			const content = (
				document.getElementById('kw-new-blurb-content') as HTMLTextAreaElement
			).value.trim();
			if (!content) return;
			const isFirst = kw.blurbs.length === 0;
			await window.electronAPI.keywords.addBlurb(kw.id, label, content, isFirst);
			await refresh();
		});
	}

	function esc(s: string): string {
		return s.replace(
			/[&<>"']/g,
			(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
		);
	}

	return { init, refresh };
})();
