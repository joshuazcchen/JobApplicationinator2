import type { DailyCountDTO, BlurbUsageDTO } from './types.js';

export const AnalyticsUI = (() => {
	let container: HTMLElement;

	function init(): void {
		container = document.getElementById('analytics-container') as HTMLElement;
	}

	async function refresh(): Promise<void> {
		const [daily, blurbUsage, apps] = await Promise.all([
			window.electronAPI.applications.dailyCounts(30),
			window.electronAPI.applications.blurbUsage(),
			window.electronAPI.applications.list()
		]);

		const statusCounts = new Map<string, number>();
		apps.forEach((a) => statusCounts.set(a.status, (statusCounts.get(a.status) ?? 0) + 1));

		container.innerHTML = `
		<div class="panel">
		<h2>Applications per Day (last 30 days)</h2>
		${renderBarChart(daily)}
		</div>
		<div class="panel">
		<h2>Statuses</h2>
		${renderStatusBreakdown(statusCounts)}
		</div>
		<div class="panel">
		<h2>Blurb Usage</h2>
		${renderBlurbUsage(blurbUsage)}
		</div>
		`;
	}

	function renderBarChart(daily: DailyCountDTO[]): string {
		if (daily.length === 0) return '<p class="hint-text">No scans yet.</p>';
		const max = Math.max(...daily.map((d) => d.count), 1);
		return `
		<div class="chart-bars">
		${daily
			.map((d) => {
				const h = Math.round((d.count / max) * 100);
				return `<div class="chart-bar-col" title="${d.date}: ${d.count}">
				<div class="chart-bar" style="height:${h}%"></div>
				<span class="chart-bar-label">${d.date.slice(5)}</span>
				</div>`;
			})
			.join('')}
			</div>`;
	}

	function renderStatusBreakdown(counts: Map<string, number>): string {
		if (counts.size === 0) return '<p class="hint-text">No applications yet.</p>';
		const total = [...counts.values()].reduce((a, b) => a + b, 0);
		return `
		<div class="status-breakdown">
		${[...counts.entries()]
			.map(([status, count]) => {
				const pct = Math.round((count / total) * 100);
				return `
				<div class="status-row">
				<span class="status-row-label">${status}</span>
				<div class="bar-track"><div class="bar-fill has-blurb" style="width:${pct}%"></div></div>
				<span class="status-row-count">${count}</span>
				</div>`;
			})
			.join('')}
			</div>`;
	}

	function renderBlurbUsage(usage: BlurbUsageDTO[]): string {
		if (usage.length === 0) return '<p class="hint-text">No blurbs used yet.</p>';
		return `
		<div class="blurb-usage-list">
		${usage
			.map(
				(u) => `
				<div class="match-row">
				<span class="match-name">${u.keyword_name} — ${u.blurb_label}</span>
				<span class="match-count">×${u.times_used}</span>
				</div>`
			)
			.join('')}
			</div>`;
	}

	return { init, refresh };
})();
