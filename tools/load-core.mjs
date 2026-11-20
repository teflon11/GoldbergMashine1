/**
 * Единая загрузка ядра для инструментов.
 *
 * Ядро физики хранится по частям в src/parts/*.js — это ЕДИНСТВЕННЫЙ
 * источник правды. Здесь части склеиваются и подгружаются в память,
 * поэтому инструменты всегда работают с актуальным кодом и не зависят
 * от промежуточных сборочных файлов.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Matter from 'matter-js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');

/** Склеивает src/parts/*.js в один исходник. */
export function concatParts(dirName = 'parts') {
  const dir = path.join(root, 'src', dirName);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
  return files.map(f =>
    `/* ===== ${dirName}/${f} ===== */\n` +
    fs.readFileSync(path.join(dir, f), 'utf8').replace(/\s+$/, '') + '\n'
  ).join('\n');
}

/** Загружает ядро (createMachine, LAYOUT, STAGES) из частей. */
export function loadCore() {
  const src = concatParts('parts');
  const module_ = { exports: {} };
  new Function('module', 'exports', 'require', src)(module_, module_.exports, () => Matter);
  return module_.exports;
}

export { Matter, root };
