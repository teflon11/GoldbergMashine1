/**
 * Аудит каталога на секреты перед публикацией.
 * Значения не выводятся целиком — только маска, чтобы не «утопить» ключ в лог.
 *
 * Запуск: node tools/audit-secrets.mjs [каталог]
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const SKIP_DIRS = new Set(['node_modules', '.git', 'shots']);
const SKIP_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.zip']);

/* Паттерны: имя -> регулярка. Порядок важен — частные случаи первыми. */
const PATTERNS = [
  ['Приватный ключ (PEM)', /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  ['Токен GitHub (classic)', /\bgh[pousr]_[A-Za-z0-9]{16,}\b/g],
  ['Токен GitHub (fine-grained)', /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g],
  ['Ключ AWS Access ID', /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g],
  ['Ключ OpenAI', /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ['Ключ Anthropic', /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g],
  ['Ключ Google API', /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ['Токен Slack', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g],
  ['Ключ Stripe (live)', /\b[sr]k_live_[A-Za-z0-9]{16,}\b/g],
  ['JWT', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g],
  ['npm-токен', /\b_npm[A-Za-z0-9]{20,}\b/g],
  ['URL с логином/паролем', /\b[a-z][a-z0-9+.-]*:\/\/[^\s/@:]+:[^\s/@]+@/gi],
  ['Строка подключения БД', /\b(postgres|mysql|mongodb|redis|amqp|ftp):\/\/[^\s'"]{6,}/gi],
  ['Заголовок Authorization', /\b(authorization|bearer)\s*[:=]\s*['"]?[A-Za-z0-9._-]{16,}/gi],
  ['Присвоение секрета', /\b(api[_-]?key|apikey|secret[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|password|passwd|pwd)\b\s*[:=]\s*['"][^'"]{6,}['"]/gi],
  ['npm authToken в .npmrc', /_authToken\s*=\s*\S+/g]
];

const mask = s => {
  const t = String(s).trim();
  if (t.length <= 10) return t.slice(0, 2) + '…';
  return t.slice(0, 4) + '…' + t.slice(-2) + ` (${t.length} симв.)`;
};

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(full, acc); }
    else acc.push(full);
  }
  return acc;
}

const files = walk(root);
let findings = 0;

console.log(`Проверяю ${files.length} файлов в ${root}\n`);

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (SKIP_EXT.has(ext)) continue;
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  const rel = path.relative(root, file);
  for (const [name, re] of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      findings++;
      const line = text.slice(0, m.index).split('\n').length;
      console.log(`!! ${name}\n   ${rel}:${line}  →  ${mask(m[0])}`);
      if (m[0].length === 0) re.lastIndex++;
    }
  }
}

/* Персональные данные: почта и домашние пути */
const PII = [
  ['Email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g],
  ['Домашний путь Windows', /\b[A-Z]:\\\\Users\\\\[^\\\\\s"']+/g]
];
for (const [name, re] of PII) {
  for (const file of files) {
    if (SKIP_EXT.has(path.extname(file).toLowerCase())) continue;
    let text; try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const rel = path.relative(root, file);
      const line = text.slice(0, m.index).split('\n').length;
      console.log(`?? ${name}\n   ${rel}:${line}  →  ${mask(m[0])}`);
      findings++;
    }
  }
}

console.log(`\nИтого подозрительных совпадений: ${findings}`);
