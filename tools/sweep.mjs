/**
 * Подбор параметров цепочки домино: перебирает сетку значений и считает,
 * сколько костяшек реально падает и доходит ли цепочка до второго шара.
 * Запуск: node tools/sweep.mjs
 */
import { loadCore, Matter } from './load-core.mjs';

const Core = loadCore();

const DT = 1000 / 60;

function trial(patch) {
  const m = Core.createMachine(Matter, { layout: patch });
  m.start();
  for (let i = 0; i < 60 * 12; i++) {
    m.update(DT);
    if (m.state.awake) break;
  }
  const b = m.getBodies();
  const fallen = b.dominoes.filter(d => Math.abs(d.angle) > 0.5).length;
  const toppled = b.dominoes.filter(d => Math.abs(d.angle) > 0.2).length;
  return {
    fallen, toppled, total: b.dominoes.length,
    ballAx: b.ballA.position.x, ballBx: b.ballB.position.x,
    stage: m.state.stage, rescues: m.state.rescues
  };
}

const results = [];
for (const h of [24, 30, 36]) {
  for (const dx of [14, 16, 18, 20, 22]) {
    for (const d of [0.0004, 0.0008, 0.0015]) {
      for (const fric of [0.6, 0.9]) {
        const r = trial({ dom: { h, dx, d, w: 9 }, shelfA: { fric } });
        results.push({ h, dx, d, fric, ...r });
      }
    }
  }
}
results.sort((a, b) => b.fallen - a.fallen || b.toppled - a.toppled || a.rescues - b.rescues);
console.log('h    dx   dens    fric  fell  toppl  ballA  ballB  stage  resc');
results.slice(0, 30).forEach(r => {
  console.log(
    `${String(r.h).padEnd(4)} ${String(r.dx).padEnd(4)} ${String(r.d).padEnd(7)} ` +
    `${String(r.fric).padEnd(5)} ${String(r.fallen).padEnd(5)} ${String(r.toppled).padEnd(6)} ` +
    `${r.ballAx.toFixed(0).padEnd(6)} ${r.ballBx.toFixed(0).padEnd(6)} ` +
    `${String(r.stage).padEnd(6)} ${r.rescues}`);
});
