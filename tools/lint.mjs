import fs from 'node:fs';

const targets = ['index.html', 'styles.css', 'script.js', 'README.md', 'INFRASTRUCTURE_REVAMP.md'];
let failed = false;

for (const file of targets) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    failed = true;
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('\t')) {
    console.error(`${file}: contains tab characters; use spaces for consistency.`);
    failed = true;
  }

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (/\s+$/.test(lines[i])) {
      console.error(`${file}:${i + 1}: trailing whitespace.`);
      failed = true;
      break;
    }
  }
}

const scriptContent = fs.readFileSync('script.js', 'utf8');
if (!scriptContent.includes('requestAnimationFrame(gameLoop)')) {
  console.error('script.js: expected requestAnimationFrame(gameLoop) call not found.');
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log('Lint checks passed.');
