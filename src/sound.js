/* ============================================================================
   ЗВУК: колокол и прочие эффекты синтезируются через WebAudio.
   Никаких внешних файлов — всё генерируется.
   ========================================================================== */
(function (global) {
  'use strict';

  var ctx = null;

  function audio() {
    if (!ctx) {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* Звон колокола: несколько негармоничных partial + затухание. */
  function bell() {
    var a = audio();
    if (!a) return;
    var now = a.currentTime;
    var master = a.createGain();
    master.gain.value = 0.0001;
    master.connect(a.destination);

    var partials = [
      { f: 1046.5, g: 0.55, d: 2.4 },   /* основной тон */
      { f: 1567.98, g: 0.30, d: 1.9 },  /* квинта */
      { f: 2093.0, g: 0.20, d: 1.5 },   /* октава */
      { f: 2637.0, g: 0.12, d: 1.1 },
      { f: 3135.96, g: 0.07, d: 0.8 }
    ];
    partials.forEach(function (p) {
      var o = a.createOscillator();
      var g = a.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(p.f, now);
      o.frequency.exponentialRampToValueAtTime(p.f * 0.995, now + p.d);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(p.g, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + p.d);
      o.connect(g); g.connect(master);
      o.start(now); o.stop(now + p.d + 0.05);
    });
    master.gain.exponentialRampToValueAtTime(0.55, now + 0.01);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
  }

  /* Короткий «тик» для домино. */
  function tick() {
    var a = audio();
    if (!a) return;
    var now = a.currentTime;
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(880 + Math.random() * 260, now);
    g.gain.setValueAtTime(0.09, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    o.connect(g); g.connect(a.destination);
    o.start(now); o.stop(now + 0.09);
  }

  /* Финальный аккорд — «праздник». */
  function fanfare() {
    var a = audio();
    if (!a) return;
    var now = a.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
      var o = a.createOscillator();
      var g = a.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      var st = now + i * 0.10;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.20, st + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.9);
      o.connect(g); g.connect(a.destination);
      o.start(st); o.stop(st + 1.0);
    });
  }

  global.Sound = { bell: bell, tick: tick, fanfare: fanfare, unlock: audio };
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
