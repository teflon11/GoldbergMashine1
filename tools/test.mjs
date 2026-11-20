/**
 * Headless-автотест машины Голдберга.
 * Прогоняет машину N раз подряд на чистом Matter.js (без DOM) и проверяет,
 * что каждый запуск доходит до финала: 11 стадий, звон колокола, хомяк проснулся.
 * Дополнительно проверяется цикл RESET → START на одной и той же машине
 * (именно так работает кнопка «Сброс» в интерфейсе).
 *
 * Запуск:  node tools/test.mjs [количество_прогонов]
 */
import { loadCore, Matter } from './load-core.mjs';

const Core = loadCore();

const RUNS = Number(process.argv[2] || 5);
const MAX_SECONDS = 40;
const DT = 1000 / 60;

/** Прогон одной машины до финала (или до таймаута). */
function runMachine(m) {
  const log = [];
  const seen = new Set();
  m.on((type, data) => {
    if (type === 'stage') {
      log.push({ stage: data.stage, name: data.name, t: +data.time.toFixed(2) });
      seen.add(data.stage);
    }
  });
  m.start();
  const steps = Math.round((MAX_SECONDS * 1000) / DT);
  for (let i = 0; i < steps; i++) {
    m.update(DT);
    if (m.state.awake && m.state.stage >= 10) break;
  }
  return { log, seen };
}

let failures = 0;

/* ---------- 1. пять независимых запусков ---------- */
for (let r = 1; r <= RUNS; r++) {
  const m = Core.createMachine(Matter);
  const { log, seen } = runMachine(m);
  const st = m.state;
  const ok = st.awake && st.bellRung && st.stage >= 10;
  if (!ok) failures++;
  console.log(
    `${ok ? 'OK  ' : 'FAIL'} прогон ${r}: стадия ${st.stage + 1}/${Core.STAGES.length} ` +
    `«${Core.STAGES[st.stage]?.n ?? '—'}» | звон=${st.bellRung ? 'да' : 'нет'} ` +
    `| хомяк=${st.awake ? 'да' : 'нет'} | страховок=${st.rescues} | t=${st.time.toFixed(2)}s`);
  if (!ok) {
    console.log('    пройденные стадии:',
      [...seen].sort((a, b) => a - b).map(i => `${i + 1}:${Core.STAGES[i].n}`).join(' → ') || '—');
    log.forEach(l => console.log(`      t=${String(l.t).padStart(5)}s  ст.${l.stage + 1} ${l.name}`));
  }
}

/* ---------- 2. цикл RESET → START на одной машине ---------- */
{
  const m = Core.createMachine(Matter);
  const first = runMachine(m);
  const firstOk = m.state.awake && m.state.stage >= 10;
  m.reset();
  const afterReset = {
    stage: m.state.stage, awake: m.state.awake,
    bell: m.state.bellRung, phase: m.state.phase
  };
  const second = runMachine(m);
  const secondOk = m.state.awake && m.state.stage >= 10;
  const ok = firstOk && secondOk &&
              afterReset.stage === 0 && !afterReset.awake &&
              !afterReset.bell && afterReset.phase === 'idle';
  if (!ok) failures++;
  console.log(
    `${ok ? 'OK  ' : 'FAIL'} RESET→START: первый=${firstOk ? 'ок' : 'провал'}, ` +
    `после сброса ст.${afterReset.stage + 1} фаза=${afterReset.phase}, второй=${secondOk ? 'ок' : 'провал'}`);
}

console.log(`\nИтого: ${failures === 0 ? 'все проверки пройдены' : failures + ' проверок провалено'}.`);
process.exit(failures ? 1 : 0);
