import Database from 'better-sqlite3';

export interface BlurbRow {
	id: number;
	keyword_id: number;
	label: string;
	content: string;
	is_default: number;
}

export interface KeywordRow {
	id: number;
	name: string;
}

export interface KeywordWithDetails {
	id: number;
	name: string;
	triggers: string[];
	blurbs: { id: number; label: string; content: string; is_default: boolean }[];
}

export function seedKeywords(
	db: Database.Database,
	defaults: {
		keywords: {
			name: string;
			triggers: string[];
			blurbs: { label: string; content: string; is_default: boolean }[];
		}[];
	}
): void {
	const count = (db.prepare('SELECT COUNT(*) as c FROM keywords').get() as { c: number }).c;
	if (count > 0) return;

	const insertKeyword = db.prepare('INSERT INTO keywords (name) VALUES (?)');
	const insertTrigger = db.prepare('INSERT INTO keyword_triggers (keyword_id, trigger) VALUES (?, ?)');
	const insertBlurb = db.prepare(
		'INSERT INTO blurbs (keyword_id, label, content, is_default) VALUES (?, ?, ?, ?)'
	);

	const tx = db.transaction(() => {
		for (const kw of defaults.keywords) {
			const { lastInsertRowid } = insertKeyword.run(kw.name);
			const keywordId = Number(lastInsertRowid);
			for (const trigger of kw.triggers) insertTrigger.run(keywordId, trigger);
			for (const blurb of kw.blurbs) {
				insertBlurb.run(keywordId, blurb.label, blurb.content, blurb.is_default ? 1 : 0);
			}
		}
	});
	tx();
}

export function getKeywordsDetails(db: Database.Database): KeywordWithDetails[] {
	const keywords = db.prepare('SELECT id, name FROM keywords ORDER BY name ASC').all() as KeywordRow[];
	const triggerStmt = db.prepare('SELECT trigger FROM keyword_triggers WHERE keyword_id = ?');
	const blurbStmt = db.prepare(
		'SELECT id, label, content, is_default FROM blurbs WHERE keyword_id = ? ORDER BY id ASC'
	);

	return keywords.map(kw => {
		const triggers = (triggerStmt.all(kw.id) as { trigger: string }[]).map(t => t.trigger);
		const blurbs = (blurbStmt.all(kw.id) as BlurbRow[]).map(b => ({
			id: b.id,
			label: b.label,
			content: b.content,
			is_default: !!b.is_default,
		}));
		return { id: kw.id, name: kw.name, triggers, blurbs };
	});
}

export function createKeyword(db: Database.Database, name: string, triggers: string[]): number {
	const tx = db.transaction(() => {
		const { lastInsertRowid } = db.prepare('INSERT INTO keywords (name) VALUES (?)').run(name);
		const id = Number(lastInsertRowid);
		const insertTrigger = db.prepare('INSERT INTO keyword_triggers (keyword_id, trigger) VALUES (?, ?)');
		for (const t of triggers) insertTrigger.run(id, t);
		return id;
	});
	return tx();
}

export function updateKeyword(db: Database.Database, id: number, name: string, triggers: string[]): void {
	const tx = db.transaction(() => {
		db.prepare('UPDATE keywords SET name = ? WHERE id = ?').run(name, id);
		db.prepare('DELETE FROM keyword_triggers WHERE keyword_id = ?').run(id);
		const insertTrigger = db.prepare('INSERT INTO keyword_triggers (keyword_id, trigger) VALUES (?, ?)');
		for (const t of triggers) insertTrigger.run(id, t);
	});
	tx();
}

export function deleteKeyword(db: Database.Database, id: number): void {
	db.prepare('DELETE FROM keywords WHERE id = ?').run(id);
}

export function addBlurb(
	db: Database.Database,
	keywordId: number,
	label: string,
	contentHtml: string,
	isDefault: boolean
): number {
	const tx = db.transaction(() => {
		if (isDefault) db.prepare('UPDATE blurbs SET is_default = 0 WHERE keyword_id = ?').run(keywordId);
		const { lastInsertRowid } = db
		.prepare('INSERT INTO blurbs (keyword_id, label, content, is_default) VALUES (?, ?, ?, ?)')
		.run(keywordId, label, contentHtml, isDefault ? 1 : 0);
		return Number(lastInsertRowid);
	});
	return tx();
}

export function updateBlurb(db: Database.Database, id: number, label: string, contentHtml: string): void {
	db.prepare('UPDATE blurbs SET label = ?, content = ? WHERE id = ?').run(label, contentHtml, id);
}

export function deleteBlurb(db: Database.Database, id: number): void {
	db.prepare('DELETE FROM blurbs WHERE id = ?').run(id);
}

export function setDefaultBlurb(db: Database.Database, keywordId: number, blurbId: number): void {
	const tx = db.transaction(() => {
		db.prepare('UPDATE blurbs SET is_default = 0 WHERE keyword_id = ?').run(keywordId);
		db.prepare('UPDATE blurbs SET is_default = 1 WHERE id = ?').run(blurbId);
	});
	tx();
}
