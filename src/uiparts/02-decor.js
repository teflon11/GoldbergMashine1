
  /* ---------- декорации ---------- */
  Scene.prototype.drawDecor = function () {
    var ctx = this.ctx, L = this.L, S = this.SCALE;
    ctx.save();
    ctx.translate(this.offX, this.offY);
    ctx.lineCap = 'round';

    /* деревянные опоры под этажами */
    var posts = [[210, 96], [352, 158], [604, 160], [860, 322], [960, 352], [1252, 300]];
    for (var i = 0; i < posts.length; i++) {
      var p = posts[i];
      ctx.strokeStyle = C.woodDark;
      ctx.lineWidth = 7 * S;
      ctx.beginPath();
      ctx.moveTo(p[0] * S, p[1] * S);
      ctx.lineTo(p[0] * S, L.floorY * S);
      ctx.stroke();
    }

    /* подвесы маятников */
    var pivots = [[L.swing.fulcrum, L.swing.top], [L.bell.px, L.bell.py]];
    ctx.strokeStyle = C.metalDark;
    ctx.lineWidth = 3 * S;
    for (var j = 0; j < pivots.length; j++) {
      ctx.beginPath();
      ctx.moveTo(pivots[j][0] * S, pivots[j][1] * S);
      ctx.lineTo(pivots[j][0] * S, (pivots[j][1] - 14) * S);
      ctx.stroke();
      ctx.fillStyle = C.metal;
      ctx.beginPath();
      ctx.arc(pivots[j][0] * S, (pivots[j][1] - 14) * S, 6 * S, 0, 6.2832);
      ctx.fill();
    }

    /* кровать хомяка */
    ctx.fillStyle = C.bed;
    var bw = L.bed.w * S, bh = L.bed.h * S;
    ctx.fillRect((L.bed.cx - L.bed.w / 2) * S, (L.bed.y - L.bed.h / 2) * S, bw, bh);
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    ctx.fillRect((L.bed.cx - L.bed.w / 2) * S, (L.bed.y - L.bed.h / 2) * S, bw, 3 * S);

    ctx.restore();
  };

  /* ---------- хомяк ---------- */
  Scene.prototype.drawHamster = function () {
    var b = this.machine.getBodies();
    if (!b.hamster) return;
    var ctx = this.ctx, S = this.SCALE, L = this.L;
    var p = b.hamster.position, r = L.hamster.r;
    ctx.save();
    ctx.translate(this.offX + p.x * S, this.offY + p.y * S);
    ctx.rotate(b.hamster.angle);

    var asleep = !this.machine.state.awake;
    ctx.fillStyle = C.hamster;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * S, r * 0.88 * S, 0, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = C.hamsterDark;
    ctx.beginPath();
    ctx.ellipse(-r * 0.28 * S, r * 0.42 * S, r * 0.62 * S, r * 0.42 * S, 0, 0, 6.2832);
    ctx.fill();

    /* ушки */
    ctx.fillStyle = C.hamsterDark;
    ctx.beginPath(); ctx.arc(-r * 0.62 * S, -r * 0.52 * S, r * 0.28 * S, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.55 * S, -r * 0.5 * S, r * 0.26 * S, 0, 6.2832); ctx.fill();

    /* мордочка */
    ctx.fillStyle = '#fdf1e0';
    ctx.beginPath(); ctx.ellipse(r * 0.42 * S, r * 0.12 * S, r * 0.44 * S, r * 0.36 * S, 0, 0, 6.2832); ctx.fill();

    /* нос и усы */
    ctx.fillStyle = '#e07a7a';
    ctx.beginPath(); ctx.ellipse(r * 0.68 * S, r * 0.02 * S, r * 0.11 * S, r * 0.09 * S, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 1.2 * S;
    for (var w = 0; w < 3; w++) {
      var wy = (r * 0.05 + (w - 1) * r * 0.13) * S;
      ctx.beginPath();
      ctx.moveTo(r * 0.76 * S, wy);
      ctx.lineTo(r * 1.42 * S, wy - 5 * S);
      ctx.stroke();
    }

    /* глаза: спит — закрытые, проснулся — открытые */
    ctx.fillStyle = '#241a12';
    if (asleep) {
      ctx.strokeStyle = '#241a12';
      ctx.lineWidth = 2.4 * S;
      ctx.beginPath(); ctx.arc(r * 0.24 * S, -r * 0.2 * S, r * 0.12 * S, 0.35, 2.79); ctx.stroke();
      ctx.beginPath(); ctx.arc(r * 0.52 * S, -r * 0.2 * S, r * 0.12 * S, 0.35, 2.79); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(r * 0.24 * S, -r * 0.2 * S, r * 0.11 * S, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.52 * S, -r * 0.2 * S, r * 0.11 * S, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(r * 0.21 * S, -r * 0.24 * S, r * 0.04 * S, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.49 * S, -r * 0.24 * S, r * 0.04 * S, 0, 6.2832); ctx.fill();
    }
    ctx.restore();

    /* «Zzz» над спящим хомяком */
    if (asleep) {
      ctx.save();
      ctx.translate(this.offX + p.x * S, this.offY + (p.y - r) * S);
      for (var z = 0; z < 3; z++) {
        var ph = this.t * 1.1 - z * 0.55;
        var zo = (Math.sin(ph) * 0.5 + 0.5) * 8 * S;
        ctx.globalAlpha = 0.30 + 0.55 * (1 - z / 3);
        ctx.fillStyle = C.ink;
        ctx.font = '700 ' + ((11 + z * 4) * S) + 'px Georgia, serif';
        ctx.fillText('Z', zo + z * 13 * S, -zo);
      }
      ctx.restore();
    }
  };
