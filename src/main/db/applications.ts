// Copyright (c) 2026 Joshua Chen.
// SPDX-License-Identifier: GPL-3.0-or-later

import Database from 'better-sqlite3';

export interface ApplicationSummary {
	id: number;
	company_name: string | null;
	role_title: string | null;
	status: string;
	scan_date: string;
	pinned: number;
}

export interface ApplicationFull extends ApplicationSummary {
	hiring_manager: string | null;
	job_url: string | null;
	raw_html: string | null;
	notes: string | null;
	cover_letter_html: string | null;
	matches: { keyword_id: number; name: string; mention_count: number; blurb_id: number | null }[];
}

// TODO: add more stats and a potential nice graph using MatPlotLib's TS equivalent, gotta research on that what is
// though.
export interface AppStats {
	total: number;
	byStatus: Record<string, number>;
	avgMatches: number;
}

export function createApplication(
	db: Database.Database,
	data: {
		company_name?: string | null;
		role_title?: string | null;
		hiring_manager?: string | null;
		job_url?: string | null;
		raw_html?: string | null;
	}
): number {
	const { lastInsertRowid } = db
		.prepare(
			`INSERT INTO applications (company_name, role_title, hiring_manager, job_url, raw_html)
		VALUES (?, ?, ?, ?, ?)`
		)
		.run(
			data.company_name ?? null,
			data.role_title ?? null,
			data.hiring_manager ?? null,
			data.job_url ?? null,
			data.raw_html ?? null
		);
	return Number(lastInsertRowid);
}

export function saveCoverLetter(
	db: Database.Database,
	applicationId: number,
	contentHtml: string
): void {
	const existing = db
		.prepare('SELECT id FROM cover_letters WHERE application_id = ?')
		.get(applicationId) as { id: number } | undefined;

	if (existing) {
		db.prepare(
			'UPDATE cover_letters SET content = ?, last_edited = CURRENT_TIMESTAMP WHERE id = ?'
		).run(contentHtml, existing.id);
	} else {
		db.prepare('INSERT INTO cover_letters (application_id, content) VALUES (?, ?)').run(
			applicationId,
			contentHtml
		);
	}
}

export function saveKeywordMatches(
	db: Database.Database,
	applicationId: number,
	matches: { keyword_id: number; mention_count: number; blurb_id: number | null }[]
): void {
	const tx = db.transaction(() => {
		db.prepare('DELETE FROM app_keyword_match WHERE application_id = ?').run(applicationId);
		const insert = db.prepare(
			'INSERT INTO app_keyword_match (application_id, keyword_id, mention_count, blurb_id) VALUES (?, ?, ?, ?)'
		);
		for (const m of matches)
			insert.run(applicationId, m.keyword_id, m.mention_count, m.blurb_id);
	});
	tx();
}

export function listApplications(db: Database.Database): ApplicationSummary[] {
	return db
		.prepare(
			'SELECT id, company_name, role_title, status, scan_date, pinned FROM applications ORDER BY pinned DESC, scan_date DESC'
		)
		.all() as ApplicationSummary[];
}

export function getApplication(db: Database.Database, id: number): ApplicationFull | null {
	const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as
		| (ApplicationSummary & {
				hiring_manager: string | null;
				job_url: string | null;
				raw_html: string | null;
				notes: string | null;
		  })
		| undefined;

	if (!app) return null;

	const letter = db
		.prepare('SELECT content FROM cover_letters WHERE application_id = ?')
		.get(id) as { content: string } | undefined;

	const matches = db
		.prepare(
			`SELECT akm.keyword_id, k.name, akm.mention_count, akm.blurb_id
		FROM app_keyword_match akm
		JOIN keywords k ON k.id = akm.keyword_id
		WHERE akm.application_id = ?
			ORDER BY akm.mention_count DESC`
		)
		.all(id) as {
		keyword_id: number;
		name: string;
		mention_count: number;
		blurb_id: number | null;
	}[];

	return { ...app, cover_letter_html: letter?.content ?? null, matches };
}

export function updateApplicationStatus(db: Database.Database, id: number, status: string): void {
	db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, id);
}

export function updateApplicationNotes(db: Database.Database, id: number, notes: string): void {
	db.prepare('UPDATE applications SET notes = ? WHERE id = ?').run(notes, id);
}

export function getStats(db: Database.Database): AppStats {
	const total = (db.prepare('SELECT COUNT(*) as c FROM applications').get() as { c: number }).c;

	const statusRows = db
		.prepare('SELECT status, COUNT(*) as c FROM applications GROUP BY status')
		.all() as { status: string; c: number }[];
	const byStatus: Record<string, number> = {};
	statusRows.forEach((r) => (byStatus[r.status] = r.c));

	const avg = db
		.prepare(
			`SELECT AVG(cnt) as avg FROM (
			SELECT application_id, COUNT(*) as cnt FROM app_keyword_match GROUP BY application_id
		)`
		)
		.get() as { avg: number | null };

	return { total, byStatus, avgMatches: Math.round((avg.avg ?? 0) * 10) / 10 };
}

export function deleteApplication(db: Database.Database, id: number): void {
	db.prepare('DELETE FROM applications WHERE id = ?').run(id);
}

export function nameApplication(
	db: Database.Database,
	id: number,
	roleTitle: string,
	companyName: string
): void {
	db.prepare('UPDATE applications SET role_title = ?, company_name = ? WHERE id = ?').run(
		roleTitle,
		companyName,
		id
	);
}

export function setApplicationPinned(db: Database.Database, id: number, pinned: boolean): void {
	db.prepare('UPDATE applications SET pinned = ? WHERE id = ?').run(pinned ? 1 : 0, id);
}
