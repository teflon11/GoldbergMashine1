
    /* ---------------- построение сцены ---------------- */
    function build() {
      Composite.clear(world, false);
      confetti.length = 0;
      b = {};

      add(box(L.W / 2, L.floorY + 40, L.W * 2, 80, { friction: 0.5, label: 'floor' }));
      add(box(-30, L.H / 2, 60, L.H * 2, { label: 'wallL' }));
      add(box(L.W + 30, L.H / 2, 60, L.H * 2, { label: 'wallR' }));

      /* 1. ПУСКОВОЙ МЕХАНИЗМ */
      add(topSeg(L.table.x1, L.table.y, L.table.x2, L.table.y, L.table.th,
        { friction: 0.015, label: 'table' }));
      b.pusher = add(Bodies.rectangle(L.pusher.x, L.pusher.y, L.pusher.w, L.pusher.h,
        { density: 0.012, friction: 0.01, frictionAir: 0.004, restitution: 0.02, label: 'pusher' }));
      b.ballA = add(ball(L.ballA.x, L.ballA.y, L.ballA.r, { label: 'ballA', density: 0.004 }));

      /* 2. ДЛИННЫЙ СКАТ (рельс) */
      add(topSeg(L.rampA[0][0], L.rampA[0][1], L.rampA[1][0], L.rampA[1][1], 16,
        { friction: 0.02, label: 'rampA' }));

      /* 3. Полка с цепью домино и спуск для второго шара.
         Полка начинается левее конца рельса (300 против 332), а слева стоит
         отбойник: шар A, отскочивший от костяшки, не сваливается с полки
         на пол — а просто остаётся на месте. */
      add(topSeg(L.shelfA.x1, L.shelfA.y1, L.shelfA.x2, L.shelfA.y2, L.shelfA.th,
        { friction: L.shelfA.fric, label: 'shelfA' }));
      add(box(304, L.shelfA.y1 - 13, 12, 26, { friction: 0.4, label: 'lip' }));
      b.dominoes = [];
      for (var i = 0; i < L.dom.n; i++) {
        var dx0 = L.dom.x0 + i * L.dom.dx;
        /* высота полки в этой точке (по наклону) */
        var t = (dx0 - L.shelfA.x1) / (L.shelfA.x2 - L.shelfA.x1);
        var shelfY = L.shelfA.y1 + t * (L.shelfA.y2 - L.shelfA.y1);
        var d = add(Bodies.rectangle(dx0, shelfY - L.dom.h / 2, L.dom.w, L.dom.h,
          { density: L.dom.d, friction: 0.4, frictionAir: 0.01, restitution: 0.02, label: 'domino' + i }));
        d.__i = i;
        b.dominoes.push(d);
      }

      /* 3b. Крутой скат, по которому второй шар уезжает к воронке */
      add(topSeg(L.drop.x1, L.drop.y1, L.drop.x2, L.drop.y2, 14,
        { friction: 0.02, label: 'drop' }));

      /* 4. Второй шар — у края полки; его выбивает последнее домино */
      b.ballB = add(ball(L.ballB.x, L.ballB.y, L.ballB.r, { label: 'ballB', density: 0.0022 }));

      /* 5. ВОРОНКА */
      add(topSeg(L.funnelL[0][0], L.funnelL[0][1], L.funnelL[1][0], L.funnelL[1][1], 12,
        { friction: 0.02, label: 'funnelL' }));
      add(topSeg(L.funnelR[0][0], L.funnelR[0][1], L.funnelR[1][0], L.funnelR[1][1], 12,
        { friction: 0.02, label: 'funnelR' }));

      /* 6. КАЧЕЛИ — площадка на шарнире в центре */
      b.swing = add(Bodies.rectangle((L.swing.x1 + L.swing.x2) / 2, L.swing.top + L.swing.th / 2,
        L.swing.x2 - L.swing.x1, L.swing.th,
        { density: 0.0006, friction: 0.45, frictionAir: 0.01, restitution: 0.04, label: 'swing' }));
      add(Constraint.create({
        pointA: { x: L.swing.fulcrum, y: L.swing.top + L.swing.th / 2 }, bodyB: b.swing,
        pointB: { x: 0, y: 0 }, length: 0, stiffness: 1, damping: 0.08
      }));
      add(box(L.swing.fulcrum, L.swing.top + L.swing.th / 2 + 30, 22, 48, { label: 'swingStand' }));

      /* 7. ДЛИННЫЙ ЖЁЛОБ */
      for (var c = 0; c < L.chute.length - 1; c++) {
        add(topSeg(L.chute[c][0], L.chute[c][1], L.chute[c + 1][0], L.chute[c + 1][1], 14,
          { friction: 0.015, label: 'chute' + c }));
      }

      /* 8/9. КОЛОКОЛ на шарнире: купол висит напротив конца жёлоба,
         чтобы шар БИЛ его напрямую (это и есть звон). Раскачавшись
         вправо, купол достаёт до спящего хомяка. */
      b.bell = add(Bodies.circle(L.bell.px, L.bell.py + L.bell.len, L.bell.r,
        { density: L.bell.d, friction: 0.05, frictionAir: 0.001, restitution: 0.6, label: 'bell' }));
      add(Constraint.create({
        pointA: { x: L.bell.px, y: L.bell.py }, bodyB: b.bell,
        pointB: { x: 0, y: 0 }, length: L.bell.len, stiffness: 1, damping: 0.004
      }));
      add(box(L.bell.px, L.bell.py - 8, 34, 14, { label: 'bellPivot' }));

      /* 10. СПЯЩИЙ ХОМЯК в гамаке на полке.
         Полка начинается правее дуги качания колокола, поэтому колокол
         достаёт до хомяка и не цепляет саму полку. */
      /* 10. Кровать со спинкой: хомяк спит на кровати, бортик справа
         не даёт ему укатиться, когда колокол его разбудит. */
      add(box(L.bed.cx, L.bed.y, L.bed.w, L.bed.h, { friction: 0.9, label: 'bed' }));
      add(box(L.bed.cx + L.bed.w / 2 - 5, L.bed.y - 16, 10, 34, { friction: 0.5, label: 'bedPost' }));
      b.hamster = add(Bodies.circle(L.hamster.x, L.hamster.y, L.hamster.r,
        { density: 0.0025, friction: 0.7, frictionAir: 0.08, restitution: 0.05, label: 'hamster' }));
    }
