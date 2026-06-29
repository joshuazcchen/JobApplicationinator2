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

console.log('Renderer assets copied.');
