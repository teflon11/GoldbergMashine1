/* ============================================================================
   ВИЗУАЛЬНЫЙ СЛОЙ: рисуем сцену на canvas.
   Физика (Matter.js) даёт нам координаты тел; всё остальное — декорации
   музейного экспоната: подписи, рамы, хомяк, «Zzz», лучи света.
   ========================================================================== */
(function (global) {
  'use strict';

  var C = {
    bgTop: '#1b2440', bgBot: '#0d1220', floor: '#2a3550',
    wood: '#8b5e3c', woodDark: '#6b4526', woodLight: '#a9713f',
    metal: '#9aa7bd', metalDark: '#5a6478',
    ink: '#f4f6fb', dim: '#9fb0cc', accent: '#ffd166',
    hamster: '#f0a868', hamsterDark: '#d18a4e', bed: '#5b7fb5'
  };

  function Scene(canvas, machine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.machine = machine;
    this.t = 0;
    this.shake = 0;
    this.flash = 0;
    this.L = machine.LAYOUT;
    this.SCALE = 1;
    this.resize();
  }

  Scene.prototype.resize = function () {
    var c = this.canvas;
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var w = global.innerWidth, h = global.innerHeight;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    c.style.width = w + 'px';
    c.style.height = h + 'px';
    this.dpr = dpr;
    /* масштабируем логические 1440x810 так, чтобы сцена целиком влезла */
    var s = Math.min(w / this.L.W, h / this.L.H);
    this.SCALE = s * dpr;
    this.offX = (w * dpr - this.L.W * this.SCALE) / 2;
    this.offY = (h * dpr - this.L.H * this.SCALE) / 2;
  };

  /* очистка кадра */
  Scene.prototype.clear = function () {
    var ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };

  /* ---------- фон музея ---------- */
  Scene.prototype.drawBackground = function () {
    var ctx = this.ctx, S = this.SCALE;
    var w = this.canvas.width, h = this.canvas.height;
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, C.bgTop);
    g.addColorStop(1, C.bgBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    /* стена с точечным узором */
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#8fb0ff';
    for (var x = 0; x < w; x += 46 * S) {
      for (var y = 0; y < h; y += 46 * S) {
        ctx.beginPath();
        ctx.arc(x, y, 2.2 * S, 0, 6.2832);
        ctx.fill();
      }
    }
    ctx.restore();

    /* пол музея */
    var fy = this.offY + this.L.floorY * S;
    var fg = ctx.createLinearGradient(0, fy, 0, h);
    fg.addColorStop(0, C.floor);
    fg.addColorStop(1, '#151b2c');
    ctx.fillStyle = fg;
    ctx.fillRect(0, fy, w, h - fy);
    ctx.strokeStyle = 'rgba(255,255,255,.10)';
    ctx.lineWidth = 2 * S;
    ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(w, fy); ctx.stroke();
  };

  /* ---------- табличка экспоната (правый верхний угол) ---------- */
  Scene.prototype.drawPlaque = function () {
    var ctx = this.ctx, S = this.SCALE;
    var w = 420 * S, h = 74 * S;
    var x = this.L.W * S - w - 24 * S, y = 24 * S;
    ctx.save();
    ctx.translate(this.offX, this.offY);
    ctx.fillStyle = 'rgba(12,18,32,.72)';
    ctx.strokeStyle = 'rgba(255,209,102,.55)';
    ctx.lineWidth = 2 * S;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10 * S);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.accent;
    ctx.font = '700 ' + (17 * S) + 'px Georgia, serif';
    ctx.fillText('ЭКСПОНАТ №7', x + 16 * S, y + 27 * S);
    ctx.fillStyle = C.ink;
    ctx.font = '700 ' + (14 * S) + 'px Georgia, serif';
    ctx.fillText('«БУДИЛЬНИК ДЛЯ ХОМЯКА»', x + 16 * S, y + 49 * S);
    ctx.fillStyle = C.dim;
    ctx.font = (12 * S) + 'px Georgia, serif';
    ctx.fillText('Машина Голдберга · 11 ступеней', x + 16 * S, y + 66 * S);
    ctx.restore();
  };
