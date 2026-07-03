const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'renderer');
const dest = path.join(__dirname, '..', 'dist', 'renderer');

fs.mkdirSync(dest, { recursive: true });

['index.html', 'styles.css'].forEach(file => {
  const s = path.join(src, file);
  const d = path.join(dest, file);
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, d);
    console.log(` copied ${file} to dist/renderer/`);
  }
});

const loadingSrc = path.join(src, 'loading');
const loadingDest = path.join(dest, 'loading');
if (fs.existsSync(loadingSrc)) {
	fs.mkdirSync(loadingDest, { recursive: true });
	fs.readdirSync(loadingSrc).forEach(file => {
		fs.copyFileSync(path.join(loadingSrc, file), path.join(loadingDest, file));
	});
}

console.log('Renderer assets copied.');
