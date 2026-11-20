
    /* ------------------------------------------------------------------
       ДЕТЕКТ СТАДИЙ ПО ФАКТИЧЕСКОМУ СОСТОЯНИЮ ТЕЛ.
       Каждая стадия подтверждается измеримым признаком: координатой,
       углом падения домино, отклонением маятника. Поэтому переходы
       не срабатывают ложно и одинаковы при каждом запуске.
    ------------------------------------------------------------------ */
    function checkStages() {
      var A = b.ballA, B = b.ballB;

      /* 0 → 1: пружинный толкатель сдвинул шар A */
      if (state.stage === 0 && A && A.position.x > 150) advance(1);

      /* 1 → 2: шар A выехал на рельс и поехал к костяшкам */
      if (state.stage === 1 && A && A.position.x > 240) advance(2);

      /* 2 → 3: шар A ударил по верхушкам костяшек — цепочка пошла */
      if (state.stage === 2 && b.dominoes.length &&
          Math.abs(b.dominoes[0].angle) > 0.28) advance(3);

      /* 4 → 5: последняя костяшка упала и выбила второй шар */
      if (state.stage === 3) {
        var last = b.dominoes[b.dominoes.length - 1];
        if ((last && Math.abs(last.angle) > 0.5) || (B && B.position.x > 582)) advance(4);
      }

      /* 5 → 6: второй шар скатился по склону и начал падать в воронку */
      if (state.stage === 4 && B && B.position.x > 640) advance(5);

      /* 6 → 7: шар соскользнул по воронке вправо */
      if (state.stage === 5 && B && B.position.x > 800 && B.position.y > 260) advance(6);

      /* 7 → 8: шар перевесил качели и покатился вправо */
      if (state.stage === 6 && B && B.position.x > 950 && B.position.y > 310) advance(7);

      /* 8 → 9: шар скатился по жёлобу к колоколу */
      if (state.stage === 7 && B && B.position.x > 1150) advance(8);

      /* 8 → 9: шар БИЛ по колоколу — он зазвонил и раскачался */
      if (state.stage === 8) {
        var bellSwing = Math.abs(swingAngle(b.bell, L.bell.px, L.bell.py));
        if (bellSwing > 0.22 || (B && B.position.x > 1216)) {
          ringBell();
          advance(9);
        }
      }

      /* 9 → 10: раскачавшийся колокол достал до спящего хомяка */
      if (state.stage === 9) {
        var d = Math.hypot(b.bell.position.x - b.hamster.position.x,
                           b.bell.position.y - b.hamster.position.y);
        if (d < 44) wakeHamster();
      }
    }

    /* ---------------- обновление ---------------- */
    function update(dt) {
      var step = dt || 1000 / 60;
      Engine.update(engine, step);
      state.time += step / 1000;

      if (state.phase === 'running') {
        /* Пружинный толкатель давит на шар A, пока тот не поехал */
        if (state.stage === 0 && b.pusher && b.ballA && b.ballA.position.x < 120) {
          Body.applyForce(b.pusher, b.pusher.position, { x: 0.0075, y: 0 });
        }

        checkStages();

        /* Детектор застревания.
           Важно: ждать можно (шар B стоит на полке, пока домино падают) —
           застреванием считается только ситуация, когда шар НЕ МОЖЕТ
           продолжить путь: он неподвижен, при этом впереди нет препятствия
           и его несёт не вперёд. Поэтому сравниваем не «паузу стадии»,
           а прогресс: сместился ли шар относительно места, где застрял. */
        var probe = (state.stage <= 2) ? b.ballA : b.ballB;
        if (probe) {
          if (!stuckAt) stuckAt = { x: probe.position.x, y: probe.position.y };
          var moved = Math.abs(probe.position.x - stuckAt.x) + Math.abs(probe.position.y - stuckAt.y);
          if (moved > 12) {
            stuckAt = { x: probe.position.x, y: probe.position.y };
            stuckFor = 0;
          } else {
            stuckFor += step;
            /* страховка только если шар и правда стоит и этап не «ждёт» */
            if (stuckFor > 2600 && !stageWaits()) {
              stuckFor = 0;
              stuckAt = { x: probe.position.x, y: probe.position.y };
              rescue();
            }
          }
        }
      }

      /* конфетти живут своей жизнью (обычная физика) */
      for (var i = confetti.length - 1; i >= 0; i--) {
        var c = confetti[i];
        if (c.position.y > L.H + 80) { Composite.remove(world, c); confetti.splice(i, 1); }
      }
    }

    /* Этапы, на которых шар закономерно ЖДЁТ удара (домино, маятник):
       там отсутствие движения — норма, а не застревание. */
    function stageWaits() {
      return state.stage === 3 || state.stage === 4 || state.stage === 8;
    }
    /* ------------------------------------------------------------------
       Столкновения: молототок → колокол → хомяк.
       Эти два звена нельзя надёжно отследить по координатам, поэтому
       они отслеживаются по факту удара.
    ------------------------------------------------------------------ */
    Events.on(engine, 'collisionStart', function (ev) {
      if (state.phase !== 'running') return;
      var pairs = ev.pairs;
      for (var i = 0; i < pairs.length; i++) {
        var a = pairs[i].bodyA, bb = pairs[i].bodyB;
        var la = a.label || '', lb = bb.label || '';

        /* шар ударил купол колокола — звон.
           Проверяем стадию, чтобы случайное касание не перепрыгнуло
           вперёд всю цепочку. */
        if ((la === 'bell' && lb === 'ballB') || (lb === 'bell' && la === 'ballB')) {
          if (state.stage === 8) { ringBell(); advance(9); lastProgress = state.time; }
        }
        /* купол (или шар) дотронулся до спящего хомяка — он просыпается */
        if ((la === 'hamster' && (lb === 'bell' || lb === 'ballB')) ||
            (lb === 'hamster' && (la === 'bell' || la === 'ballB'))) {
          if (state.stage >= 9) { ringBell(); wakeHamster(); }
        }
      }
    });

    build();

    return {
      engine: engine,
      world: world,
      state: state,
      LAYOUT: L,
      STAGES: STAGES,
      getBodies: function () { return b; },
      getConfetti: function () { return confetti; },
      on: on,
      start: start,
      reset: reset,
      update: update
    };
  }

  var API = { createMachine: createMachine, LAYOUT: LAYOUT, STAGES: STAGES };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else global.MachineCore = API;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
