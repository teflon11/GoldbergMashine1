
  /* ---------- тела Matter.js ---------- */
  Scene.prototype.drawBodies = function () {
    var ctx = this.ctx, S = this.SCALE;
    var bodies = this.machine.engine.world.bodies;
    ctx.save();
    ctx.translate(this.offX, this.offY);
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (b.label === 'hamster') continue;          /* хомяка рисуем отдельно */
      if (b.isStatic) this.drawStatic(b, b.label || '');
      else this.drawDynamic(b, b.label || '');
    }
    ctx.restore();
  };

  Scene.prototype.drawStatic = function (b, label) {
    var ctx = this.ctx, S = this.SCALE;
    var v = b.vertices;
    ctx.beginPath();
    ctx.moveTo(v[0].x * S, v[0].y * S);
    for (var i = 1; i < v.length; i++) ctx.lineTo(v[i].x * S, v[i].y * S);
    ctx.closePath();

    /* невидимые границы мира */
    if (label === 'floor' || label === 'wallL' || label === 'wallR') { ctx.fill(); return; }

    /* металлические рельсы и воронка */
    if (label.indexOf('chute') === 0 || label === 'rampA' || label === 'drop') {
      ctx.fillStyle = C.metal; ctx.fill();
      ctx.strokeStyle = C.metalDark; ctx.lineWidth = 1.4 * S; ctx.stroke();
      return;
    }
    if (label.indexOf('funnel') === 0) {
      ctx.fillStyle = C.metalDark; ctx.fill();
      ctx.strokeStyle = C.metal; ctx.lineWidth = 1.6 * S; ctx.stroke();
      return;
    }
    /* толкатель и фиксатор */
    if (label === 'pusher' || label === 'latch') { ctx.fillStyle = C.accent; ctx.fill(); return; }
    /* качели */
    if (label === 'swing') {
      ctx.fillStyle = C.woodLight; ctx.fill();
      ctx.strokeStyle = C.woodDark; ctx.lineWidth = 1.4 * S; ctx.stroke();
      return;
    }
    /* кровать */
    if (label === 'bed' || label === 'bedPost') { ctx.fillStyle = C.bed; ctx.fill(); return; }
    /* кронштейны */
    if (label === 'bobPivot' || label === 'bellPivot' || label === 'swingPivot' || label === 'ropeAnchor') {
      ctx.fillStyle = C.metalDark; ctx.fill(); return;
    }
    /* полки, столы, подставки под домино — дерево */
    ctx.fillStyle = C.wood; ctx.fill();
    ctx.strokeStyle = C.woodDark; ctx.lineWidth = 1.2 * S; ctx.stroke();
  };

  Scene.prototype.drawDynamic = function (b, label) {
    var ctx = this.ctx, S = this.SCALE;
    var x = b.position.x * S, y = b.position.y * S;

    /* шары */
    if (label === 'ballA' || label === 'ballB') {
      var r = b.circleRadius * S;
      var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.15, x, y, r);
      if (label === 'ballA') { g.addColorStop(0, '#ff8a80'); g.addColorStop(1, '#c62828'); }
      else { g.addColorStop(0, '#82d8ff'); g.addColorStop(1, '#1565c0'); }
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.lineWidth = 1.5 * S;
      ctx.stroke();
      return;
    }
    /* домино */
    if (label.indexOf('domino') === 0) {
      var dv = b.vertices;
      ctx.beginPath();
      ctx.moveTo(dv[0].x * S, dv[0].y * S);
      for (var d = 1; d < dv.length; d++) ctx.lineTo(dv[d].x * S, dv[d].y * S);
      ctx.closePath();
      ctx.fillStyle = '#f2e6d0'; ctx.fill();
      ctx.strokeStyle = '#b9a887'; ctx.lineWidth = 1.2 * S; ctx.stroke();
      ctx.fillStyle = '#b9a887';
      ctx.beginPath(); ctx.arc(x, y, 2.4 * S, 0, 6.2832); ctx.fill();
      return;
    }
    /* толкатель */
    if (label === 'pusher') {
      var pv = b.vertices;
      ctx.beginPath();
      ctx.moveTo(pv[0].x * S, pv[0].y * S);
      for (var q = 1; q < pv.length; q++) ctx.lineTo(pv[q].x * S, pv[q].y * S);
      ctx.closePath();
      ctx.fillStyle = C.accent; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1.2 * S; ctx.stroke();
      return;
    }
    /* качели (динамическое тело) */
    if (label === 'swing') {
      var swv = b.vertices;
      ctx.beginPath();
      ctx.moveTo(swv[0].x * S, swv[0].y * S);
      for (var sw = 1; sw < swv.length; sw++) ctx.lineTo(swv[sw].x * S, swv[sw].y * S);
      ctx.closePath();
      ctx.fillStyle = C.woodLight; ctx.fill();
      ctx.strokeStyle = C.woodDark; ctx.lineWidth = 1.4 * S; ctx.stroke();
      return;
    }
    /* колокол */
    if (label === 'bell') { this.drawBell(b); return; }
    /* конфетти */
    var cv = b.vertices;
    ctx.beginPath();
    ctx.moveTo(cv[0].x * S, cv[0].y * S);
    for (var k = 1; k < cv.length; k++) ctx.lineTo(cv[k].x * S, cv[k].y * S);
    ctx.closePath();
    ctx.fillStyle = (b.render && b.render.fillStyle) ? b.render.fillStyle : '#ffd166';
    ctx.fill();
  };

  /* ---------- колокол ---------- */
  Scene.prototype.drawBell = function (b) {
    var ctx = this.ctx, S = this.SCALE, L = this.L;
    var x = b.position.x * S, y = b.position.y * S, r = L.bell.r * S;
    var a = Math.atan2(b.position.x - L.bell.px, b.position.y - L.bell.py);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-a);
    ctx.strokeStyle = C.metalDark;
    ctx.lineWidth = 3 * S;
    ctx.beginPath(); ctx.moveTo(0, -r * 1.1); ctx.lineTo(0, 0); ctx.stroke();
    var g = ctx.createLinearGradient(-r, -r, r, r);
    g.addColorStop(0, '#ffe9a8'); g.addColorStop(0.5, '#e0b355'); g.addColorStop(1, '#a87a25');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.85);
    ctx.quadraticCurveTo(-r * 0.92, -r * 0.85, 0, -r);
    ctx.quadraticCurveTo(r * 0.92, -r * 0.85, r, r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7c5a17'; ctx.lineWidth = 1.6 * S; ctx.stroke();
    ctx.fillStyle = '#7c5a17';
    ctx.beginPath(); ctx.arc(0, r * 0.7, r * 0.2, 0, 6.2832); ctx.fill();
    ctx.restore();
  };
