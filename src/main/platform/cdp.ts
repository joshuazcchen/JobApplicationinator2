/* eslint-disable @typescript-eslint/no-explicit-any */
import CDP from 'chrome-remote-interface';

export async function scrapeCDP(): Promise<{ html: string; title: string; url: string }> {
	let targets: any[];

	try {
		targets = await (CDP as any).List({ port: 9222 });
	} catch (err: any) {
		const isRefused =
			err?.code === 'ECONNREFUSED' || String(err?.message).includes('ECONNREFUSED');

		if (isRefused) {
			throw new Error(
				'Could not connect to Chrome on port 9222.\n\n' // TODO: make proper steps to fix error
			);
		}
		throw err;
	}

	const page = targets.find(
		(t: any) =>
			t.type === 'page' &&
			t.url &&
			!t.url.startsWith('chrome://') &&
			!t.url.startsWith('devtools://')
	);

	if (!page) {
		throw new Error('No job posting found.');
	}

	const client = await (CDP as any)({ port: 9222, target: page.id });

	try {
		await client.DOM.enable();
		await client.Runtime.enable();

		const { root } = await client.DOM.getDocument();
		const { outerHTML } = await client.DOM.getOuterHTML({ nodeId: root.nodeId });

		const titleRes = await client.Runtime.evaluate({ expression: 'document.title' });
		const urlRes = await client.Runtime.evaluate({ expression: 'window.location.href' });

		return {
			html: outerHTML,
			title: String(titleRes.result?.value ?? ''),
			url: String(urlRes.result?.value ?? '')
		};
	} finally {
		await client.close();
	}
}
