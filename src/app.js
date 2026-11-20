/* ============================================================================
   ТОЧКИ ВХОДА: кнопки START / RESET, игровой цикл, связь физики и звука.
   ========================================================================== */
(function (global) {
  'use strict';

  var canvas = document.getElementById('stage');
  var btnStart = document.getElementById('start');
  var btnReset = document.getElementById('reset');
  var statusEl = document.getElementById('status');

  var machine = global.MachineCore.createMachine(global.Matter);
  var scene = new global.Scene(canvas, machine);
  var last = performance.now();
  var acc = 0;
  var STEP = 1000 / 60;

  /* ---------------- события машины ---------------- */
  machine.on(function (type, data) {
    if (type === 'stage') {
      if (data.stage > 0 && data.stage < 10) global.Sound.tick();
    } else if (type === 'bell') {
      global.Sound.bell();
      scene.flash = 0.55;
    } else if (type === 'wake') {
      global.Sound.fanfare();
      scene.flash = 0.35;
    } else if (type === 'start') {
      statusEl.textContent = 'Машина запущена';
    } else if (type === 'reset') {
      statusEl.textContent = 'Готов к запуску';
    }
  });

  /* ---------------- кнопки ---------------- */
  btnStart.addEventListener('click', function () {
    global.Sound.unlock();
    if (machine.state.phase === 'running') return;
    machine.start();
  });

  btnReset.addEventListener('click', function () {
    machine.reset();
  });

  global.addEventListener('keydown', function (e) {
    if (e.code === 'Space') { e.preventDefault(); global.Sound.unlock(); machine.start(); }
    if (e.code === 'KeyR') machine.reset();
  });

  global.addEventListener('resize', function () { scene.resize(); });

  /* ---------------- игровой цикл ----------------
     Физика идёт фиксированным шагом (детерминизм), рендер — каждый кадр. */
  function frame(now) {
    var dt = Math.min(now - last, 100);
    last = now;

    acc += dt;
    var guard = 0;
    while (acc >= STEP && guard < 6) {
      machine.update(STEP);
      acc -= STEP;
      guard++;
    }
    if (guard >= 6) acc = 0;

    scene.render(dt / 1000);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
