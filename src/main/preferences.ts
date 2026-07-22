// Copyright (c) 2026 Joshua Chen.
// SPDX-License-Identifier: GPL-3.0-or-later

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

interface Preferences {
	suppressBlurbPrompt?: boolean;
}

function prefsPath(): string {
	return path.join(app.getPath('userData'), 'preferences.json');
}

export function getPreferences(): Preferences {
	try {
		return JSON.parse(fs.readFileSync(prefsPath(), 'utf8'));
	} catch {
		return {};
	}
}

export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
	const prefs = getPreferences();
	prefs[key] = value;
	fs.writeFileSync(prefsPath(), JSON.stringify(prefs, null, 2), 'utf8');
}
