import Database from "better-sqlite3";
import { app } from "electron";
import * as path from "path";

let db: Database.Database;

export function initDatabase(): Database.Database {
	const dbPath = path.join(app.getPath("userData"), "applicationinator.db");
	db = new Database(dbPath);

	db.pragma("journal_mode = WAL");
	db.pragma("foreign_keys = ON");

	db.exec(`
		CREATE TABLE IF NOT EXISTS keywords (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS keyword_triggers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			keyword_id INTEGER REFERENCES keywords(id) ON DELETE CASCADE,
			trigger TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS blurbs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			keyword_id INTEGER REFERENCES keywords(id) ON DELETE CASCADE,
			label TEXT NOT NULL,
			content_html TEXT NOT NULL,
			is_default INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS templates (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			content_html TEXT NOT NULL,
			is_default INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS applications (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			company_name TEXT,
			role_title TEXT,
			hiring_manager TEXT,
			job_url TEXT,
			raw_html TEXT,
			scan_date DATETIME DEFAULT CURRENT_TIMESTAMP,
			status TEXT DEFAULT 'draft',
			notes TEXT
		);

		CREATE TABLE IF NOT EXISTS cover_letters (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
			content_html TEXT NOT NULL,
			exported_pdf_path TEXT,
			last_edited DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS app_keyword_match (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
			keyword_id INTEGER REFERENCES keywords(id),
			mention_count INTEGER DEFAULT 1,
			blurb_id INTEGER REFERENCES blurbs(id)
		);
	`);

	return db;
}

export function getDatabase(): Database.Database {
	return db;
}
