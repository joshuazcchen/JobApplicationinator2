import type { ApplicationSummaryDTO } from './types.js';

export const Sidebar = (() => {
	let listEl: HTMLElement;
	let onSelect: (id: number) => void = () => {};
	let apps: ApplicationSummaryDTO[] = [];

	function init(elementId: string, selectHandler: (id: number) => void): void {
		listEl = document.getElementById(elementId) as HTMLElement;
		onSelect = selectHandler;
	}

	const STATUS_COLORS: Record<string, string> = {
		// TODO: set up a proper file where I can just call upon for standardized colour schemes.
		draft: '#CCCCED',
		sent: '#A8A8FF',
		interviewing: '#FFFEA8',
		offer: '#61FF73',
		rejected: '#FF8161'
	};

	async function refresh(activeId?: number): Promise<void> {
		apps = await window.electronAPI.applications.list();

		if (apps.length === 0) {
			listEl.innerHTML = '<div class="sidebar-empty">No scans yet.</div>';
			return;
		}

		// TODO: rename the default name so that Software Engineer doesnt take up 30129 of my slots
		listEl.innerHTML = apps
			.map((a) => {
				const date = new Date(a.scan_date).toLocaleDateString();
				const color = STATUS_COLORS[a.status] ?? '#CCCCED';
				const active = a.id === activeId ? ' active' : '';
				const pinIcon = a.pinned ? '* ' : '';
				return `
			<div class="sidebar-item${active}" data-id="${a.id}">
			<span class="status-dot" style="background:${color}"></span>
			<div class="sidebar-item-text">
			<div class="sidebar-item-title">${pinIcon}${escapeHtml(a.role_title ?? 'Untitled scan')}</div>
			<div class="sidebar-item-sub">${escapeHtml(a.company_name ?? date)}</div>
			</div>
			<div class="sidebar-item-menu-wrap">
			<button class="sidebar-item-menu-btn" data-menu-id="${a.id}" title="Options">...</button>
			<div class="sidebar-item-menu" data-menu-for="${a.id}" style="display:none">
			<button class="menu-option" data-action="pin" data-id="${a.id}">${a.pinned ? 'Unpin' : 'Pin'}</button>
			<button class="menu-option" data-action="rename" data-id="${a.id}">Rename</button>
			<button class="menu-option menu-option-danger" data-action="delete" data-id="${a.id}">Delete</button>
			</div>
			</div>
			</div>`;
			})
			.join('');

		listEl.querySelectorAll<HTMLElement>('.sidebar-item').forEach((el) => {
			el.addEventListener('click', (e) => {
				if ((e.target as HTMLElement).closest('.sidebar-item-menu-wrap')) return;
				onSelect(Number(el.dataset.id));
			});
		});

		listEl.querySelectorAll<HTMLButtonElement>('.sidebar-item-menu-btn').forEach((btn) => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				toggleMenu(btn.dataset.menuId!);
			});
		});

		listEl.querySelectorAll<HTMLElement>('.sidebar-item').forEach((el) => {
			el.addEventListener('contextmenu', (e) => {
				e.preventDefault();
				e.stopPropagation();
				toggleMenu(el.dataset.id!);
			});
		});

		listEl.querySelectorAll<HTMLButtonElement>('.menu-option').forEach((btn) => {
			btn.addEventListener('click', async (e) => {
				e.stopPropagation();
				const id = Number(btn.dataset.id);
				const action = btn.dataset.action;

				if (action === 'delete') {
					if (!confirm('Delete this application?')) return;
					await window.electronAPI.applications.delete(id);
					await refresh();
				} else if (action === 'pin') {
					const app = apps.find((a) => a.id === id);
					await window.electronAPI.applications.setPinned(id, !app?.pinned);
					await refresh(activeId);
				} else if (action === 'rename') {
					const app = apps.find((a) => a.id === id);
					const newTitle = prompt('Role title:', app?.role_title ?? '');
					if (newTitle === null) return;
					const newCompany = prompt('Company name:', app?.company_name ?? '');
					if (newCompany === null) return;
					await window.electronAPI.applications.rename(id, newTitle, newCompany);
					await refresh(activeId);
				}
			});
		});

		document.addEventListener(
			'click',
			() =>
				listEl
					.querySelectorAll<HTMLElement>('.sidebar-item-menu')
					.forEach((m) => (m.style.display = 'none')),
			{ once: true }
		);
	}

	function toggleMenu(id: string): void {
		listEl.querySelectorAll<HTMLElement>('.sidebar-item-menu').forEach((menu) => {
			menu.style.display =
				menu.dataset.menuFor === id && menu.style.display === 'none' ? 'flex' : 'none';
		});
	}

	function escapeHtml(s: string): string {
		return s.replace(
			/[&<>"']/g,
			(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
		);
	}

	return { init, refresh };
})();
