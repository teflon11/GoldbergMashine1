
  /* ---------- панель ступеней (левая нижняя часть) ---------- */
  Scene.prototype.drawStagePanel = function () {
    var ctx = this.ctx, S = this.SCALE;
    var st = this.machine.state;
    var stages = this.machine.STAGES || [];
    var w = 400 * S;
    var x = 24 * S;
    var h = (stages.length * 21 + 38) * S;
    var y = this.L.H * S - h - 24 * S;
    ctx.save();
    ctx.translate(this.offX, this.offY);
    ctx.fillStyle = 'rgba(10,15,28,.80)';
    ctx.strokeStyle = 'rgba(255,255,255,.13)';
    ctx.lineWidth = 1.2 * S;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10 * S);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = C.accent;
    ctx.font = '700 ' + (11.5 * S) + 'px Georgia, serif';
    ctx.fillText('СТУПЕНИ МАШИНЫ', x + 14 * S, y + 23 * S);

    for (var i = 0; i < stages.length; i++) {
      var done = i < st.stage;
      var cur = i === st.stage;
      var yy = y + 41 * S + i * 21 * S;
      ctx.beginPath();
      ctx.arc(x + 20 * S, yy - 4 * S, 5.2 * S, 0, 6.2832);
      if (done) { ctx.fillStyle = '#4cd964'; ctx.fill(); }
      else if (cur) {
        ctx.fillStyle = C.accent; ctx.fill();
        ctx.strokeStyle = 'rgba(255,209,102,.45)'; ctx.lineWidth = 2 * S;
        ctx.beginPath(); ctx.arc(x + 20 * S, yy - 4 * S, 9.5 * S, 0, 6.2832); ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1.4 * S; ctx.stroke();
      }
      ctx.fillStyle = cur ? C.ink : (done ? 'rgba(244,246,251,.62)' : 'rgba(159,176,204,.40)');
      ctx.font = (cur ? '700 ' : '') + (11 * S) + 'px Georgia, serif';
      ctx.fillText(stages[i].n, x + 34 * S, yy);
    }
    ctx.restore();
  };

  /* ---------- панель статуса (правая нижняя часть) ---------- */
  Scene.prototype.drawStatus = function () {
    var ctx = this.ctx, S = this.SCALE;
    var st = this.machine.state;
    var stages = this.machine.STAGES || [];
    var cur = stages[Math.min(st.stage, stages.length - 1)];
    var w = 400 * S, h = 66 * S;
    var x = this.L.W * S - w - 24 * S;
    var y = this.L.H * S - h - 24 * S;
    ctx.save();
    ctx.translate(this.offX, this.offY);
    ctx.fillStyle = 'rgba(10,15,28,.80)';
    ctx.strokeStyle = st.phase === 'done' ? 'rgba(76,217,100,.6)' : 'rgba(255,209,102,.4)';
    ctx.lineWidth = 1.6 * S;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10 * S);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.dim;
    ctx.font = (11 * S) + 'px Georgia, serif';
    ctx.fillText(st.phase === 'done' ? 'МАШИНА СРАБОТАЛА · ПРОБЕЛ — запуск · R — сброс'
                                   : 'СТУПЕНЬ ' + (st.stage + 1) + ' / ' + stages.length,
                 x + 16 * S, y + 21 * S);
    ctx.fillStyle = st.phase === 'done' ? '#4cd964' : C.ink;
    ctx.font = '700 ' + (16 * S) + 'px Georgia, serif';
    ctx.fillText(cur ? cur.n : '', x + 16 * S, y + 45 * S);
    ctx.restore();
  };

  /* ---------- празднование ---------- */
  Scene.prototype.drawCelebration = function () {
    if (!this.machine.state.awake) return;
    var ctx = this.ctx, S = this.SCALE;
    ctx.save();
    ctx.translate(this.offX + this.L.W * S / 2, this.offY + 100 * S);
    var pulse = 1 + Math.sin(this.t * 3) * 0.03;
    ctx.scale(pulse, pulse);
    ctx.textAlign = 'center';
    ctx.font = '700 ' + (44 * S) + 'px Georgia, serif';
    ctx.fillStyle = 'rgba(255,209,102,.95)';
    ctx.fillText('ХОМЯК ПРОСНУЛСЯ!', 0, 0);
    ctx.font = (17 * S) + 'px Georgia, serif';
    ctx.fillStyle = 'rgba(244,246,251,.85)';
    ctx.fillText('…и очень недоволен, что его разбудили', 0, 30 * S);
    ctx.textAlign = 'left';
    ctx.restore();
  };

  /* ---------- вспышка при звоне ---------- */
  Scene.prototype.drawFlash = function () {
    if (this.flash <= 0) return;
    var ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = this.flash;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  };

  /* ---------- главный кадр ---------- */
  Scene.prototype.render = function (dt) {
    this.t += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 3.2);
    this.clear();
    this.drawBackground();
    this.drawDecor();
    this.drawBodies();
    this.drawHamster();
    this.drawPlaque();
    this.drawStagePanel();
    this.drawStatus();
    this.drawCelebration();
    this.drawFlash();
  };

  global.Scene = Scene;
  global.MuseumColors = C;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
