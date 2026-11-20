/**
 * Лаборатория v2: шар катится по полке и бьёт по высокой костяшке.
 * Проверяем, топит ли шар костяшку и доходит ли цепочка до конца.
 *
 * Запуск: node tools/domino-lab2.mjs
 */
import Matter from 'matter-js';

const DT = 1000 / 60;

function run({ h = 58, w = 8, dx = 20, d = 0.002, fric = 0.3, domFric = 0.4,
               n = 9, v0 = 5, ballD = 0.004, ballR = 8, ballFric = 0.02,
               seconds = 8, hitHeight = 0 }) {
  const { Engine, Bodies, Composite, Body } = Matter;
  const engine = Engine.create({ enableSleeping: false });
  engine.gravity.y = 1;
  engine.positionIterations = 8;
  engine.velocityIterations = 6;
  const world = engine.world;

  const ground = Bodies.rectangle(400, 400, 1600, 20,
    { isStatic: true, friction: fric, restitution: 0.02 });
  Composite.add(world, ground);

  const doms = [];
  for (let i = 0; i < n; i++) {
    const d0 = Bodies.rectangle(300 + i * dx, 400 - 10 - h / 2, w, h,
      { density: d, friction: domFric, frictionAir: 0.01, restitution: 0.02 });
    Composite.add(world, d0);
    doms.push(d0);
  }
  // шар едет слева направо; hitHeight — на сколько выше основания он бьёт
  const ball = Bodies.circle(300 - 60 - ballR, 400 - 10 - ballR - hitHeight, ballR,
    { density: ballD, friction: ballFric, frictionAir: 0.001, restitution: 0.2 });
  Composite.add(world, ball);
  Body.setVelocity(ball, { x: v0, y: 0 });

  for (let i = 0; i < seconds * 60; i++) Engine.update(engine, DT);

  return {
    angles: doms.map(d => +d.angle.toFixed(2)),
    fallen: doms.filter(d => Math.abs(d.angle) > 0.5).length,
    toppled: doms.filter(d => Math.abs(d.angle) > 0.2).length,
    ballX: +ball.position.x.toFixed(0)
  };
}

const rows = [];
for (const h of [40, 58, 70]) {
  for (const dx of [18, 20, 24]) {
    for (const d of [0.001, 0.002, 0.004]) {
      for (const v0 of [3, 5, 8, 12]) {
        for (const hit of [0, 20, 35]) {
          const r = run({ h, dx, d, v0, hitHeight: hit });
          rows.push({ h, dx, d, v0, hit, ...r });
        }
      }
    }
  }
}
rows.sort((a, b) => b.fallen - a.fallen || b.toppled - a.toppled);
console.log('h    dx   dens    v0    hit  fell  toppl  ballX');
rows.slice(0, 25).forEach(r => {
  console.log(
    `${String(r.h).padEnd(4)} ${String(r.dx).padEnd(4)} ${String(r.d).padEnd(7)} ` +
    `${String(r.v0).padEnd(4)} ${String(r.hit).padEnd(4)} ${String(r.fallen).padEnd(5)} ` +
    `${String(r.toppled).padEnd(6)} ${r.ballX}`);
});
console.log('\nуглы лучшего:', rows[0].angles.join(' '));
