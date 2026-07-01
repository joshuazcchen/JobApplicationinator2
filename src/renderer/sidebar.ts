export const Sidebar = (() => {
	let listEl: HTMLElement;
	let onSelect: (id: number) => void = () => {};

	function init(elementId: string, selectHandler: (id: number) => void): void {
		listEl = document.getElementById(elementId) as HTMLElement;
		onSelect = selectHandler;
	}

	const STATUS_COLORS: Record<string, string> = {
		// TODO: set up a proper file where I can just call upon for standardized colour schemes.
		draft: "#CCCCED",
		sent: "#A8A8FF",
		interviewing: "#FFFEA8",
		offer: "#61FF73",
		rejected: "#FF8161",
	};

	async function refresh(activeId?: number): Promise<void> {
		const apps = await window.electronAPI.applications.list();

		if (apps.length === 0) {
			listEl.innerHTML = '<div class="sidebar-empty">No scans yet.</div>';
			return;
		}

		listEl.innerHTML = apps
			.map((a) => {
				const date = new Date(a.scan_date).toLocaleDateString();
				const color = STATUS_COLORS[a.status] ?? "#CCCCED";
				const active = a.id === activeId ? " active" : "";
				return `
			<div class="sidebar-item${active}" data-id="${a.id}">
			<span class="status-dot" style="background:${color}"></span>
			<div class="sidebar-item-text">
			<div class="sidebar-item-title">${escapeHtml(a.role_title ?? "Untitled scan")}</div>
			<div class="sidebar-item-sub">${escapeHtml(a.company_name ?? date)}</div>
			</div>
			</div>`;
			})
			.join("");

		listEl.querySelectorAll<HTMLElement>(".sidebar-item").forEach((el) => {
			el.addEventListener("click", () => {
				const id = Number(el.dataset.id);
				onSelect(id);
			});
		});
	}

	function escapeHtml(s: string): string {
		return s.replace(
			/[&<>"']/g,
			(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
		);
	}

	return { init, refresh };
})();
