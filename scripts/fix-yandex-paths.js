import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distIndex = resolve(__dirname, '../dist/index.html');

let html = readFileSync(distIndex, 'utf-8');

// Заменяем абсолютные пути /assets/ на относительные ./assets/
html = html.replace(/\/(assets\/[^"']+)/g, './$1');

writeFileSync(distIndex, html);
console.log('✅ Yandex paths fixed: /assets/ → ./assets/');
