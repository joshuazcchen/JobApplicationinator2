export interface BlurbDTO {
	id: number;
	label: string;
	content: string;
	is_default: boolean;
}

export interface KeywordDTO {
	id: number;
	name: string;
	triggers: string[];
	blurbs: BlurbDTO[];
}

export interface TemplateDTO {
	id: number;
	name: string;
	content: string;
	is_default: number;
	created_at: string;
}

export interface ApplicationSummaryDTO {
	id: number;
	company_name: string | null;
	role_title: string | null;
	status: string;
	scan_date: string;
}

export interface ApplicationFullDTO extends ApplicationSummaryDTO {
	hiring_manager: string | null;
	job_url: string | null;
	raw_html: string | null;
	notes: string | null;
	cover_letter_html: string | null;
	matches: {
		keyword_id: number;
		name: string;
		mention_count: number;
		blurb_id: number | null;
	}[];
}

export type ScanMethod = 'safari' | 'cdp' | 'clipboard';

export interface MatchDTO {
	name: string;
	count: number;
	hasBlurb: boolean;
	blurbHtml: string | null;
}

export interface ScanResult {
	success: boolean;
	error?: string;
	applicationId?: number;
	title?: string;
	url?: string;
	matches?: MatchDTO[];
	assembled?: string;
}

export interface SaveResult {
	success: boolean;
	cancelled?: boolean;
	filePath?: string;
	error?: string;
}

export interface ElectronAPI {
	scan: (method: ScanMethod) => Promise<ScanResult>;
	saveOutput: (content: string, format: 'html' | 'txt') => Promise<SaveResult>;
	onLog: (cb: (msg: string) => void) => void;
	clearLogListeners: () => void;

	keywords: {
		list: () => Promise<KeywordDTO[]>;
		create: (name: string, triggers: string[]) => Promise<number>;
		update: (id: number, name: string, triggers: string[]) => Promise<void>;
		delete: (id: number) => Promise<void>;
		addBlurb: (
			keywordId: number,
			label: string,
			contentHtml: string,
			isDefault: boolean,
		) => Promise<number>;
		updateBlurb: (id: number, label: string, contentHtml: string) => Promise<void>;
		deleteBlurb: (id: number) => Promise<void>;
		setDefaultBlurb: (keywordId: number, blurbId: number) => Promise<void>;
	};

	templates: {
		list: () => Promise<TemplateDTO[]>;
		getDefault: () => Promise<TemplateDTO | null>;
		create: (name: string, contentHtml: string) => Promise<number>;
		delete: (id: number) => Promise<void>;
		setDefault: (id: number) => Promise<void>;
	};

	applications: {
		list: () => Promise<ApplicationSummaryDTO[]>;
		get: (id: number) => Promise<ApplicationFullDTO | null>;
		updateStatus: (id: number, status: string) => Promise<void>;
		updateNotes: (id: number, notes: string) => Promise<void>;
		saveCoverLetter: (id: number, html: string) => Promise<void>;
	};
}

declare global {
	interface Window {
		electronAPI: ElectronAPI;
	}
}
