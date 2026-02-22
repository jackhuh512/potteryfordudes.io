import fs from 'node:fs';

const files = [
  'index.html',
  'styles.css',
  'script.js',
  'README.md',
  'INFRASTRUCTURE_REVAMP.md',
  'src/core/gameLoop.js',
  'src/core/state.js',
  'src/systems/input.js',
  'src/systems/render.js',
  'src/systems/audio.js',
  'src/content/levels.js',
  'src/content/musicProfile.js',
];
let failed = false;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');

  if (!content.endsWith('\n')) {
    console.error(`${file}: must end with a newline.`);
    failed = true;
  }

  if (content.includes('\r\n')) {
    console.error(`${file}: use LF line endings (found CRLF).`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('Format checks passed.');
