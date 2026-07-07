// Copyright (c) 2026 Joshua Chen.
// SPDX-License-Identifier: GPL-3.0-or-later

import { clipboard } from 'electron';

export function scrapeClipboard(): { html: string; title: string; url: string } {
	const text = clipboard.readText().trim();

	if (!text) {
		throw new Error('Clipboard is empty. (ctrl+c -> scan)');
	}

	const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

	const html = `<html><body><pre>${escaped}</pre></body></html>`;

	return { html, title: 'Clipboard paste', url: '' };
}
