/**
 * Диагностика: печатает траекторию шара по времени, чтобы понять, где он встаёт.
 * Запуск: node tools/trace.mjs [секунды]
 */
import { loadCore, Matter } from './load-core.mjs';

const Core = loadCore();

const SECONDS = Number(process.argv[2] || 20);
const m = Core.createMachine(Matter);
let b = null;
m.on((t, d) => { if (t === 'stage') console.log(`  stage ${d.stage + 1} ${d.name} @${d.time.toFixed(2)}s`); });
m.start();

const DT = 1000 / 60;
const rows = [];
for (let i = 0; i < SECONDS * 60; i++) {
  m.update(DT);
  b = m.getBodies();
  if (i % 15 === 0) {
    rows.push([
      (i / 60).toFixed(2).padStart(6),
      'A(' + (b.ballA ? b.ballA.position.x.toFixed(0) + ',' + b.ballA.position.y.toFixed(0) : '-') + ')',
      'B(' + (b.ballB ? b.ballB.position.x.toFixed(0) + ',' + b.ballB.position.y.toFixed(0) : '-') + ')',
      'v=' + (b.ballB ? b.ballB.speed.toFixed(2) : '-'),
      'st=' + m.state.stage
    ].join(' '));
  }
}
console.log(rows.join('\n'));
console.log('\n--- финальные углы домино (рад) ---');
b.dominoes.forEach((d, i) => {
  console.log(`  dom${i} x=${d.position.x.toFixed(0)} y=${d.position.y.toFixed(0)} angle=${d.angle.toFixed(2)}`);
});
console.log('ballA', b.ballA.position.x.toFixed(0), b.ballA.position.y.toFixed(0));
console.log('ballB', b.ballB.position.x.toFixed(0), b.ballB.position.y.toFixed(0));
console.log('rescues', m.state.rescues);

