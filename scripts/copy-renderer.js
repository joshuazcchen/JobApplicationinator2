const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'renderer');
const dest = path.join(__dirname, '..', 'dist', 'renderer');

fs.mkdirSync(dest, { recursive: true });

function cpDirR(srcDir, destDir) {
	fs.mkdirSync(destDir, { recursive: true });
	for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
		const s = path.join(srcDir, entry.name);
		const d = path.join(destDir, entry.name);
		if (entry.isDirectory()) cpDirR(s, d);
		else fs.copyFileSync(s, d);
	}
}

const katexDistSrc = path.join(__dirname, '..', 'node_modules', 'katex', 'dist');
const katexDest = path.join(dest, 'vendor', 'katex');
cpDirR(katexDistSrc, katexDest);

['index.html', 'styles.css'].forEach(file => {
  const s = path.join(src, file);
  const d = path.join(dest, file);
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, d);
  }
});

const stylesSrcDir = path.join(src, 'styles');
const stylesDestDir = path.join(dest, 'styles');
if (fs.existsSync(stylesSrcDir)) {
	cpDirR(stylesSrcDir, stylesDestDir);
}

const loadingSrc = path.join(src, 'loading');
const loadingDest = path.join(dest, 'loading');
if (fs.existsSync(loadingSrc)) {
	fs.mkdirSync(loadingDest, { recursive: true });
	fs.readdirSync(loadingSrc).forEach(file => {
		fs.copyFileSync(path.join(loadingSrc, file), path.join(loadingDest, file));
	});
}

['katex-init.js'].forEach(file => {
	const s = path.join(src, file);
	const d = path.join(dest, file);
	if (fs.existsSync(s)) {
		fs.copyFileSync(s, d);
	}
});
