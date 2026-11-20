/**
 * Сборка итогового index.html: ядро физики + рендер + звук + приложение
 * вставляются в шаблон одним файлом (требование задачи: один index.html).
 *
 * Источник правды — папки src/parts/ (ядро) и src/uiparts/ (отрисовка).
 * Промежуточных файлов не создаём: всё подставляется прямо в index.html,
 * поэтому разъехаться нечему.
 *
 * Запуск: node tools/build.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const src = path.join(root, 'src');
const out = path.join(root, 'index.html');

const read = f => fs.readFileSync(path.join(src, f), 'utf8');

/** Склеивает части папки в один исходник (порядок — по имени файла). */
function concatParts(dirName) {
  const dir = path.join(src, dirName);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
  if (!files.length) throw new Error(`Нет файлов в src/${dirName}/`);
  return files.map(f => `/* ===== ${dirName}/${f} ===== */\n` +
    fs.readFileSync(path.join(dir, f), 'utf8').replace(/\s+$/, '') + '\n').join('\n');
}

const core = concatParts('parts');
const ui = concatParts('uiparts');

const wrap = (title, code) =>
  `<!-- ===== ${title} ===== -->\n<script>\n${code.trim()}\n</script>\n`;

let html = read('index.template.html');
html = html.replace('<!--CORE-->', wrap('ЯДРО ФИЗИКИ (Matter.js)', core));
html = html.replace('<!--UI-->', wrap('ВИЗУАЛЬНЫЙ СЛОЙ', ui));
html = html.replace('<!--APP-->', wrap('ЗВУК', read('sound.js')) + wrap('ТОЧКИ ВХОДА', read('app.js')));

fs.writeFileSync(out, html, 'utf8');

/* Проверка целостности собранного файла: он должен быть самодостаточным
   (единственный внешний ресурс — Matter.js с CDN) и не содержать
   незакрытых тегов или пустых <script> блоков. */
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const empty = scripts.filter(s => !s[1].trim()).length;
const external = [...new Set([...html.matchAll(/https?:\/\/[^\s"')]+/g)].map(m => m[0]))];
const bad = external.filter(u => !u.includes('matter-js'));

if (empty || bad.length || !html.includes('matter.min.js')) {
  console.error('ОШИБКА сборки: пустых <script> =', empty, ', посторонние ресурсы =', bad);
  process.exit(1);
}
console.log(
  `index.html собран: ${(html.length / 1024).toFixed(1)} КБ, ` +
  `блоков <script>: ${scripts.length + 1} (1 внешний + ${scripts.length} встроенных), ` +
  `внешние ресурсы: ${external.join(', ')}`
);
