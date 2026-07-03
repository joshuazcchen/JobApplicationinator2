import { app } from 'electron';
import * as path from 'path';

// stupid helper because its used in both reset database and index init.
export function assetPath(...parts: string[]): string {
	if (app.isPackaged) return path.join(process.resourcesPath, 'assets', ...parts);
	return path.join(__dirname, '..', '..', 'assets', ...parts);
}
