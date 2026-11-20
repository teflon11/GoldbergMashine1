
    /* ---------------- управление ---------------- */
    function start() {
      if (state.phase === 'running') return;
      state.phase = 'running';
      state.started = true;
      lastProgress = 0;
      emit('start', {});
    }

    function reset() {
      state.phase = 'idle';
      state.stage = 0;
      state.time = 0;
      state.bellRung = false;
      state.awake = false;
      state.started = false;
      state.rescues = 0;
      lastProgress = 0;
      stuckAt = null;
      stuckFor = 0;
      build();
      emit('reset', {});
    }

    function advance(stage) {
      if (stage <= state.stage || stage >= STAGES.length) return;
      state.stage = stage;
      lastProgress = state.time;
      emit('stage', { stage: stage, name: STAGES[stage].n, desc: STAGES[stage].d, time: state.time });
    }

    /* Страховка: физический толчок, если шар объективно застрял. */
    function rescue() {
      state.rescues++;
      var dirs = [
        { x: 1.0, y: 0.0 },   // 1 пуск
        { x: 1.0, y: 0.5 },   // 2 скат
        { x: 1.0, y: 0.0 },   // 3 домино
        { x: 1.0, y: 0.0 },   // 4 последнее домино
        { x: 1.0, y: 0.0 },   // 5 второй шар
        { x: 0.6, y: 0.9 },   // 6 воронка
        { x: 0.8, y: 0.6 },   // 7 качели
        { x: 1.0, y: 0.5 },   // 8 жёлоб
        { x: 1.0, y: 0.1 },   // 9 колокол
        { x: 0.6, y: 0.5 }    // 10 хомяк
      ];
      var d = dirs[Math.min(state.stage, dirs.length - 1)];
      var target = (state.stage <= 2) ? b.ballA : b.ballB;
      if (target) Body.applyForce(target, target.position, { x: d.x * 0.0026, y: d.y * 0.0026 });
      // если застрял не шар, а механизм — раскачиваем и его
      if (state.stage === 6 && b.swing) Body.applyForce(b.swing, b.swing.position, { x: 0.0018, y: 0 });
      if (state.stage === 8 && b.bell) Body.applyForce(b.bell, b.bell.position, { x: 0.0022, y: 0 });
      if (state.stage === 9 && b.hamster) Body.applyForce(b.hamster, b.hamster.position, { x: -0.0014, y: -0.0026 });
      emit('rescue', { stage: state.stage });
    }

    function spawnConfetti() {
      var colors = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#b892ff', '#ff9f1c', '#f15bb5'];
      for (var i = 0; i < 110; i++) {
        var c = Bodies.rectangle(
          160 + Math.random() * 1160, 40 + Math.random() * 320,
          7 + Math.random() * 8, 5 + Math.random() * 6,
          { density: 0.0005, frictionAir: 0.02, restitution: 0.5, angle: Math.random() * 6.28 });
        Body.setVelocity(c, { x: (Math.random() - 0.5) * 11, y: -Math.random() * 9 });
        Body.setAngularVelocity(c, (Math.random() - 0.5) * 0.6);
        Composite.add(world, c);
        confetti.push(c);
      }
    }

    function wakeHamster() {
      if (state.awake) return;
      state.awake = true;
      if (b.hamster) {
        /* Хомяк просыпается на месте: короткий прыжок вверх и лёгкое
           покачивание. Никакого «телепорта» — только импульс по-настоящему. */
        Body.applyForce(b.hamster, b.hamster.position, { x: 0.0004, y: -0.0026 });
        Body.setAngularVelocity(b.hamster, -0.06);
      }
      emit('wake', {});
      spawnConfetti();
      advance(10);          // стадия «САЛЮТ»
      state.phase = 'done';
    }

    function ringBell() {
      if (state.bellRung) return;
      state.bellRung = true;
      emit('bell', {});
    }
