/**
 * Проверка в реальном браузере: открывает index.html, ждёт загрузки CDN,
 * нажимает START и снимает скриншоты на нескольких этапах.
 * Также ловит ошибки консоли — если что-то сломано, тест это покажет.
 *
 * Запуск: node tools/browser-check.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const shots = path.join(root, 'shots');
fs.mkdirSync(shots, { recursive: true });

/* Ищем установленный браузер: явный путь через переменную окружения,
   затем типичные места для Windows/macOS/Linux. Путь к Chrome/Edge на
   машине разработчика в проекте не хардкодим. */
function findBrowser() {
  if (process.env.BROWSER_PATH) return process.env.BROWSER_PATH;
  const home = os.homedir();
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(home, 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return undefined;   /* puppeteer сам найдёт свой Chromium */
}

const browser = await puppeteer.launch({
  executablePath: findBrowser(),
  headless: 'new',
  args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required']
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 810, deviceScaleFactor: 1 });

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));

await page.goto('file:///' + path.join(root, 'index.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1200));

/* проверяем, что физика жива */
const ready = await page.evaluate(() => !!(window.MachineCore && window.Scene));
console.log('окружение загрузилось:', ready ? 'да' : 'НЕТ');

/* кликаем START */
await page.click('#start');

const marks = [
  { name: '1-start',  wait: 700 },
  { name: '2-domino', wait: 1200 },
  { name: '3-funnel', wait: 5200 },
  { name: '4-chute',  wait: 2200 },
  { name: '5-bell',   wait: 1400 },
  { name: '6-awake',  wait: 1200 }
];
for (const m of marks) {
  await new Promise(r => setTimeout(r, m.wait));
  await page.screenshot({ path: path.join(shots, m.name + '.png') });
}

/* RESET: сцена обязана вернуться к исходному состоянию */
await page.click('#reset');
await new Promise(r => setTimeout(r, 900));
await page.screenshot({ path: path.join(shots, '7-reset.png') });

/* и повторный запуск после сброса тоже обязан сработать */
await page.click('#start');
await new Promise(r => setTimeout(r, 13500));
await page.screenshot({ path: path.join(shots, '8-second-run.png') });

const errors2 = errors.length;
console.log(errors2 ? 'ОШИБКИ:\n' + errors.join('\n') : 'ошибок в консоли нет');

await browser.close();
process.exit(errors2 ? 1 : 0);
