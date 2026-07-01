import Database from "better-sqlite3";

export interface TemplateRow {
	id: number;
	name: string;
	content: string;
	is_default: number;
	created_at: string;
}

export function seedTemplates(db: Database.Database, html: string): void {
	const count = (db.prepare("SELECT COUNT(*) as c FROM templates").get() as { c: number }).c;
	if (count > 0) return;
	db.prepare("INSERT INTO templates (name, content, is_default) VALUES (?, ?, 1)").run("Default Template", html);
}

export function getTemplates(db: Database.Database): TemplateRow[] {
	return db.prepare("SELECT * FROM templates ORDER BY created_at DESC").all() as TemplateRow[];
}

export function getDefaultTemplate(db: Database.Database): TemplateRow | null {
	return (
		(db.prepare("SELECT * FROM templates WHERE is_default = 1 LIMIT 1").get() as TemplateRow) ??
		(db.prepare("SELECT * FROM templates ORDER BY created_at DESC LIMIT 1").get() as TemplateRow) ??
		null
	);
}

export function createTemplate(db: Database.Database, name: string, contentHtml: string): number {
	const { lastInsertRowid } = db
		.prepare("INSERT INTO templates (name, content) VALUES (?, ?)")
		.run(name, contentHtml);
	return Number(lastInsertRowid);
}

export function deleteTemplate(db: Database.Database, id: number): void {
	db.prepare("DELETE FROM templates WHERE id = ?").run(id);
}

export function setDefaultTemplate(db: Database.Database, id: number): void {
	const tx = db.transaction(() => {
		db.prepare("UPDATE templates SET is_default = 0").run();
		db.prepare("UPDATE templates SET is_default = 1 WHERE id = ?").run(id);
	});
	tx();
}
