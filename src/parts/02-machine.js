
  /* Глубокое слияние раскладки: {dom:{dx:20}} перезаписывает dom целиком. */
  function mergeLayout(base, patch) {
    var out = {};
    for (var k in base) {
      var v = base[k];
      out[k] = (v && typeof v === 'object' && !Array.isArray(v)) ? Object.assign({}, v) : v;
    }
    for (var p in patch) {
      var pv = patch[p];
      if (pv && typeof pv === 'object' && !Array.isArray(pv) &&
          out[p] && typeof out[p] === 'object' && !Array.isArray(out[p])) {
        out[p] = Object.assign({}, out[p], pv);
      } else {
        out[p] = pv;
      }
    }
    return out;
  }

  function createMachine(Matter, options) {
    options = options || {};
    var Engine = Matter.Engine, Composite = Matter.Composite, Bodies = Matter.Bodies,
        Body = Matter.Body, Constraint = Matter.Constraint, Events = Matter.Events;
    var topSeg = makeTopSeg(Matter);
    /* Раскладку можно переопределить — этим пользуется инструмент подбора
       параметров (tools/sweep.mjs): он прогоняет сотни вариантов и выбирает
       устойчивый, вместо того чтобы гадать. */
    var L = options.layout ? mergeLayout(LAYOUT, options.layout) : LAYOUT;

    var engine = Engine.create({ enableSleeping: false });
    engine.gravity.y = 1;
    engine.positionIterations = 8;
    engine.velocityIterations = 6;
    var world = engine.world;

    var state = {
      phase: 'idle', stage: 0, time: 0,
      bellRung: false, awake: false, started: false, rescues: 0
    };

    var b = {};
    var listeners = [];
    var confetti = [];
    var lastProgress = 0;
    var stuckAt = null;   // где шар стоит, если не двигается
    var stuckFor = 0;    // сколько мс шар не двигается

    function on(fn) { listeners.push(fn); }
    function emit(type, data) { for (var i = 0; i < listeners.length; i++) listeners[i](type, data || {}); }

    function box(x, y, w, h, opts) {
      var o = { isStatic: true, friction: 0.3, restitution: 0.05 };
      for (var k in (opts || {})) o[k] = opts[k];
      return Bodies.rectangle(x, y, w, h, o);
    }
    function ball(x, y, r, opts) {
      var o = { density: 0.003, friction: 0.02, frictionAir: 0.0012, restitution: 0.25, label: 'ball' };
      for (var k in (opts || {})) o[k] = opts[k];
      return Bodies.circle(x, y, r, o);
    }
    function add(body) { Composite.add(world, body); return body; }
    /* Угол отклонения маятника от вертикали (рад). */
    function swingAngle(body, px, py) {
      return Math.atan2(body.position.x - px, body.position.y - py);
    }
