// Copyright (c) 2026 Joshua Chen.
// SPDX-License-Identifier: GPL-3.0-or-later

window.addEventListener('load', function () {
	if (window.renderMathInElement) {
		renderMathInElement(document.body, {
			delimiters: [
				{ left: '$$', right: '$$', display: true },
				{ left: '$', right: '$', display: false },
			],
		});
	}
});
