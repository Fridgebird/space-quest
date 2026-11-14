// Warp core start-up: the control panel behind the checklist alert.
// Three posters (Electrical, Dilithium, Plasma) are read out by runners; the rules are
// described in checklist-design.md. The panel's state is kept on this device only
// (localStorage), because only the tablet uses it. The switches, knobs and gauges
// themselves are drawn by widgets.js.

window.Checklist = (function () {
  const KEY = "quest-warpcore:" + window.GAME_ID;
  const PLATE_SECONDS = 10;                  // to connect the battery after discharging the plates
  const AMBIENT_F = 70, TARGET_F = 451, HEAT_F_PER_SEC = 10;
  const FULL_PRESSURE = 100, DRAIN_PER_SEC = 100 / 120, TOP_UP = 3, LOW = 10, HIGH = 30;
  const ENGINE_SECONDS = 6;                  // rubidium output climbing to 100
  const REGULATOR_START = 0.5;
  const W = window.Widgets;

  let S, onComplete, engineMsg = "";
  let mounted = false;
  const syncs = [];                          // redraw functions, one per piece of hardware
  const top = {};

  function fresh() {
    return {
      // Electrical
      flux: "Off", crm: "Transmit", resonator: "Nominal", grid: "Off", regulator: REGULATOR_START,
      stirred: false, undervolt: false, relay: "Off",
      // Dilithium
      injection: "Free", bypass: "Enabled", bypassWasDisabled: false, polarity: "Nominal",
      charge: 100, platesAt: 0, battery: false, integrator: "Locked",
      // Plasma
      conduits: "Off", heater: "Off", temp: AMBIENT_F, valves: "Shut", pressure: FULL_PRESSURE,
      rubidium: 100,
      engineAt: 0, fired: false, lastTick: 0
    };
  }
  function load() {
    try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { S = fresh(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }

  const now = () => Date.now();
  const secsLeft = (until) => Math.max(0, Math.ceil((until - now()) / 1000));
  const busy = () => S.fired || S.engineAt > 0;

  // Things that are worked out from the switches rather than set directly.
  const regulatorOK = () => !S.undervolt && S.regulator === 1.21;
  const relayLit = () => S.relay === "On" && S.flux === "On" && S.crm === "Receive"
    && S.resonator === "Override" && regulatorOK() && S.integrator === "Unlocked";
  const manifoldNominal = () => S.integrator === "Unlocked";
  const heating = () => S.heater === "On" && S.grid === "On" && S.conduits === "On";
  const pressureOK = () => S.pressure >= LOW && S.pressure <= HIGH;
  const engineOutput = () => (S.fired ? 100 : S.engineAt ? Math.min(100, (now() - S.engineAt) / (ENGINE_SECONDS * 10)) : 0);

  // The control shakes and buzzes when it doesn't work. It never says why: the crew have
  // to work that out from the posters.
  function fail(id) {
    const c = C[id];
    if (c && c.ui) W.shake(c.ui);
    Sfx.buzz();
    return false;
  }

  function act(fn) {
    if (busy()) return false;
    engineMsg = "";
    const result = fn();
    save();
    update();
    return result !== false;
  }

  // The rules for each control. lock(value) is true while that change isn't allowed yet.
  // bus: true means it's on the main B bus and goes dead in an undervolt.
  const CONTROLS = [
    { id: "flux", options: ["Off", "On"], get: () => S.flux, set: (v) => { S.flux = v; } },
    { id: "crm", options: ["Transmit", "Standby", "Receive"], get: () => S.crm, set: (v) => { S.crm = v; } },
    { id: "resonator", options: ["Nominal", "Override"], get: () => S.resonator, set: (v) => { S.resonator = v; } },
    { id: "grid", options: ["Off", "On"], get: () => S.grid, set: (v) => { S.grid = v; } },
    { id: "regulator", kind: "num", bus: true, min: 0, max: 9.99, decimals: 2, set: (v) => { S.regulator = v; } },
    { id: "oxygen", kind: "btn", lock: () => !S.battery,
      press: () => { if (!S.stirred) { S.stirred = true; S.undervolt = true; } } },
    { id: "relay", options: ["Off", "On"], get: () => S.relay, set: (v) => { S.relay = v; } },
    { id: "injection", options: ["Free", "Inhibited", "Token"], get: () => S.injection, set: (v) => { S.injection = v; } },
    { id: "bypass", options: ["Enabled", "Disabled"], get: () => S.bypass,
      set: (v) => { S.bypass = v; if (v === "Disabled") S.bypassWasDisabled = true; } },
    { id: "polarity", options: ["Nominal", "Reversed"], get: () => S.polarity, set: (v) => { S.polarity = v; },
      lock: (v) => v === "Reversed" && !(S.bypass === "Disabled" && S.resonator === "Override") },
    { id: "plates", kind: "btn",
      lock: () => !(S.injection === "Inhibited" && S.bypass === "Disabled" && S.polarity === "Reversed"),
      press: () => { if (!S.battery && S.charge > 0) { S.charge = 0; S.platesAt = now(); } } },
    { id: "battery", kind: "btn",
      press: () => {
        if (S.battery) return;
        if (!S.platesAt) return fail("battery");
        S.battery = true; S.platesAt = 0;
      } },
    { id: "integrator", options: ["Locked", "Unlocked"], get: () => S.integrator, set: (v) => { S.integrator = v; },
      lock: (v) => v === "Unlocked" && !(S.bypass === "Enabled" && S.battery) },
    { id: "conduits", options: ["Off", "On"], get: () => S.conduits, set: (v) => { S.conduits = v; } },
    { id: "heater", options: ["Off", "On"], get: () => S.heater, set: (v) => { S.heater = v; } },
    { id: "cartridge", options: ["Open", "Shut"], get: () => S.valves, set: (v) => { S.valves = v; },
      lock: (v) => v === "Open" && S.temp < TARGET_F },
    { id: "reserve", kind: "btn", press: () => { S.pressure = Math.min(FULL_PRESSURE, S.pressure + TOP_UP); } },
    { id: "rubidium", kind: "num", min: 0, max: 300, set: (v) => { S.rubidium = v; } },
    // Flipping the breaker always cycles the B bus, so the flux regulator goes back to
    // its starting setting even if the bus was fine.
    { id: "breaker", kind: "btn", press: () => { S.undervolt = false; S.regulator = REGULATOR_START; } },
    { id: "engine", kind: "btn",
      press: () => {
        // The engine waits for the relay and the rubidium limiter. After that, a failed start
        // names the first thing still wrong, so the crew can always finish.
        if (!relayLit() || S.rubidium !== 230) return fail("engine");
        const problem = firstProblem();
        if (problem) { engineMsg = "FAILED: " + problem; return fail("engine"); }
        S.engineAt = now();
      } }
  ];
  const C = {};
  CONTROLS.forEach((c) => { C[c.id] = c; });

  function firstProblem() {
    const checks = [
      [S.stirred, "oxygen tanks not stirred"],
      [S.grid === "On", "power transfer grid off"],
      [S.injection === "Inhibited", "antiproton injection seal not inhibited"],
      [S.bypassWasDisabled, "static containment bypass has not been cycled"],
      [S.bypass === "Enabled", "static containment bypass disabled"],
      [S.polarity === "Reversed", "neutron flow polarity incorrect"],
      [S.battery, "positive plate not connected"],
      [manifoldNominal(), "gravimetric field displacement manifold not nominal"],
      [S.conduits === "On", "plasma conduits off"],
      [S.heater === "On" && S.temp >= TARGET_F, "plasma injector temperature too low"],
      [S.valves === "Shut", "plasma cartridge valves open"],
      [pressureOK(), "plasma pressure out of range"]
    ];
    const failed = checks.find(([ok]) => !ok);
    return failed ? failed[1] : null;
  }

  // Applies a change from a control, checking power and locks first. Returns true if it worked.
  function attempt(id, value) {
    const c = C[id];
    if (busy()) return false;
    if ((c.bus && S.undervolt) || (c.lock && c.lock(value))) return fail(id);
    if (c.kind === "btn") return act(c.press);
    if (c.kind === "num") {
      // Rounded to the control's decimal places, so 1.21 is exactly 1.21.
      const places = c.decimals || 0;
      if (!Number.isFinite(value) || value < c.min || value > c.max) return fail(id);
      value = Math.round(value * 10 ** places) / 10 ** places;
    }
    return act(() => c.set(value));
  }

  // ---------- Building the panel ----------
  const el = W.el;
  function module(grid, title, extraClass) {
    const m = el("section", "cl-mod metal" + (extraClass ? " " + extraClass : ""));
    m.appendChild(el("h3", "cl-mod-title", title));
    grid.appendChild(m);
    return m;
  }

  // A two-position switch. `up` is the option shown with the handle up.
  function addToggle(host, id, name, up, lampFn, lampColour) {
    const c = C[id], down = c.options.find((o) => o !== up);
    const t = W.toggle({ name, up, down, withLamp: !!lampFn, lampColour });
    t.onFlip = () => { if (attempt(id, c.get() === up ? down : up)) Sfx.click(); };
    c.ui = t.el;
    host.appendChild(t.el);
    syncs.push(() => { t.set(c.get() === up); if (lampFn) t.lamp(lampFn()); });
    return t;
  }
  function addSelector(host, id, name) {
    const c = C[id];
    const s = W.selector({ name, options: c.options });
    s.onPick = (o) => { if (o !== c.get() && attempt(id, o)) Sfx.clunk(); };
    c.ui = s.el;
    host.appendChild(s.el);
    syncs.push(() => s.set(c.get()));
  }
  function addPush(host, id, label, colour) {
    const b = W.pushButton({ label, colour });
    b.onPress = () => { if (attempt(id)) Sfx.clunk(); };
    C[id].ui = b.el;
    host.appendChild(b.el);
    return b;
  }
  function screen(host, cls) {
    const s = el("div", "cl-screen" + (cls ? " " + cls : ""));
    host.appendChild(s);
    return s;
  }
  const setText = (node, text) => { if (node.textContent !== text) node.textContent = text; };

  function build(container) {
    container.innerHTML = "";
    syncs.length = 0;

    // Caution and warning lights, pinned to the top. Only B bus and the warp fuse ever light;
    // the rest are there so those two don't stand out until they come on.
    const annun = el("div", "cl-annun");
    const tile = (text) => { const t = el("div", "ann", text); annun.appendChild(t); return t; };
    top.a = tile("Main A bus undervolt");
    top.b = tile("Main B bus undervolt");
    top.fuse = tile("Warp fuse armed");
    ["Coolant loop", "Grav plating", "Hull temp", "Airlock seal", "Docking clamp"].forEach(tile);
    const topBar = el("div", "cl-top");
    topBar.appendChild(annun);
    const grid = el("div", "cl-grid");
    container.append(topBar, grid);

    // The modules are deliberately mixed up, so each poster's controls are scattered around.
    let m = module(grid, "Main power", "bank");
    let row = el("div", "cl-toggles well"); m.appendChild(row);
    addToggle(row, "flux", "Flux capacitor", "On");
    addToggle(row, "conduits", "Plasma conduits", "On", () => S.conduits === "On", "amber");
    addToggle(row, "grid", "Power transfer grid", "On");

    // Temporal flux regulator: coarse and fine knobs, with a red LED readout.
    m = module(grid, "Temporal flux regulator");
    const reg = C.regulator;
    const regRead = el("div", "cl-readout");
    const regSeg = W.sevenSeg(3);
    const regUnit = el("span", "cl-unit", "gigawatts");
    const regDead = el("span", "cl-nopower", "NO POWER");
    regRead.append(regSeg.el, regUnit, regDead);
    const knobs = el("div", "cl-knobs");
    [["Coarse", 0.1], ["Fine", 0.01]].forEach(([name, step]) => {
      const k = W.knob({ name });
      k.onTurn = (n) => { const ok = attempt("regulator", S.regulator + n * step); if (ok) Sfx.tick(); return ok; };
      knobs.appendChild(k.el);
    });
    m.append(regRead, knobs);
    reg.ui = m;
    syncs.push(() => {
      regSeg.set(S.undervolt ? "   " : S.regulator.toFixed(2));
      regDead.hidden = !S.undervolt;
      regUnit.hidden = S.undervolt;
    });

    m = module(grid, "Antiproton injection seal");
    addSelector(m, "injection", "Antiproton injection seal");

    // Rubidium limiter: a fader, a red LED readout and the engine output bar.
    m = module(grid, "Rubidium limiter", "tall");
    const rubRead = el("div", "cl-readout");
    const rubSeg = W.sevenSeg(3);
    rubRead.append(rubSeg.el, el("span", "cl-unit", "einsteins"));
    const fz = W.fader({ name: "Rubidium limiter", min: 0, max: 300, step: 10, ticks: 50 });
    fz.onSlide = (v) => { if (attempt("rubidium", v)) Sfx.tick(); };
    const out = W.ledBar({ vertical: true });
    const outCol = el("div", "cl-barcol");
    outCol.append(out.el, el("span", "w-name", "Output"));
    const faderRow = el("div", "cl-fader-row");
    faderRow.append(fz.el, outCol);
    m.append(rubRead, faderRow);
    C.rubidium.ui = m;
    syncs.push(() => {
      fz.set(S.rubidium);
      rubSeg.set(String(S.rubidium));
      out.set(engineOutput(), "green");
    });

    // Plasma injectors: temperature dial and the heater switch.
    m = module(grid, "Plasma injectors");
    const temp = W.gauge({ min: 0, max: 600, major: 100, minor: 25, unit: "°F", mark: TARGET_F, redFrom: 500 });
    m.appendChild(temp.el);
    addToggle(m, "heater", "Injector heater", "On");
    syncs.push(() => temp.set(S.temp, Math.round(S.temp) + "°F"));

    m = module(grid, "Field control", "bank");
    row = el("div", "cl-toggles well"); m.appendChild(row);
    addToggle(row, "resonator", "Subspace resonator", "Override");
    addToggle(row, "polarity", "Neutron flow polarity", "Reversed");
    addToggle(row, "bypass", "Static containment bypass", "Enabled");

    m = module(grid, "CRM114 discriminator");
    addSelector(m, "crm", "CRM114 discriminator");

    // Dimethyl plates: charge meter, discharge button, and the battery connector.
    m = module(grid, "Dimethyl plates");
    const charge = W.ledBar({ vertical: false });
    const chargeRow = el("div", "cl-meter");
    chargeRow.append(el("span", "w-name", "Charge"), charge.el);
    m.appendChild(chargeRow);
    const plateBtns = el("div", "cl-buttons");
    m.appendChild(plateBtns);
    addPush(plateBtns, "plates", "Discharge", "red");
    const batt = el("div", "cl-labelled");
    addPush(batt, "battery", "Connect", "black");
    batt.appendChild(el("span", "w-name", "6V battery → positive plate"));
    plateBtns.appendChild(batt);
    C.plates.ui = m;
    syncs.push(() => charge.set(S.charge, "amber"));

    // Atmospheric thermal plasma: pressure dial, cartridge valves and the auxiliary reserve.
    m = module(grid, "Atmospheric thermal plasma");
    const press = W.gauge({ min: 0, max: 100, major: 20, minor: 5, unit: "µPa", band: [LOW, HIGH] });
    m.appendChild(press.el);
    const valveRow = el("div", "cl-buttons");
    m.appendChild(valveRow);
    addToggle(valveRow, "cartridge", "Atmospheric thermal plasma cartridge valves", "Open");
    addPush(valveRow, "reserve", "Aux reserve +" + TOP_UP, "black");
    C.cartridge.ui = m;
    syncs.push(() => press.set(S.pressure, S.pressure.toFixed(1) + " µPa"));

    m = module(grid, "Antimatter systems", "bank");
    row = el("div", "cl-toggles well"); m.appendChild(row);
    addToggle(row, "integrator", "Integrator emergency bypass", "Unlocked");
    addToggle(row, "relay", "Antimatter relay", "On", relayLit, "green");

    m = module(grid, "Gravimetric field displacement manifold");
    const mani = screen(m, "status");
    syncs.push(() => {
      setText(mani, manifoldNominal() ? "MANIFOLD: NOMINAL" : "MANIFOLD: FLUCTUATING");
      mani.classList.toggle("good", manifoldNominal());
    });

    m = module(grid, "Oxygen tanks");
    const stir = W.mushroom({ label: "STIR" });
    stir.onPress = () => { if (attempt("oxygen")) Sfx.clunk(); };
    C.oxygen.ui = stir.el;
    m.appendChild(stir.el);

    // Breakers and engine: covered switches and the engine's status screen.
    m = module(grid, "Breakers & engine", "full");
    const guards = el("div", "cl-guards");
    const gb = W.guarded({ name: "Fuse breaker" });
    gb.onThrow = () => attempt("breaker");
    const ge = W.guarded({ name: "Supersonic combustion engine" });
    ge.onThrow = () => attempt("engine");
    C.breaker.ui = gb.el;
    C.engine.ui = ge.el;
    const eng = screen(guards, "engine");
    guards.prepend(gb.el, ge.el);
    m.appendChild(guards);
    syncs.push(() => {
      setText(eng, S.fired ? "ENGINE RUNNING\nWARP CORE ONLINE" : S.engineAt ? "ENGINE STARTING…" : engineMsg ? "START " + engineMsg : "ENGINE: STANDBY");
      eng.classList.toggle("good", S.fired);
    });

    mounted = true;
  }

  function update() {
    if (!mounted) return;
    syncs.forEach((fn) => fn());
    top.b.classList.toggle("alarm", S.undervolt);
    const armed = S.platesAt > 0 && !S.battery;
    top.fuse.classList.toggle("caution", armed);
    setText(top.fuse, armed ? "Warp fuse armed " + secsLeft(S.platesAt + PLATE_SECONDS * 1000) + "s" : "Warp fuse armed");
  }

  // Time passing: the injectors heating or cooling, the plasma draining while the valves
  // are open, the warp fuse, and the engine spinning up.
  function tick() {
    if (!mounted) return;
    const t = now();
    const dt = S.lastTick ? Math.max(0, (t - S.lastTick) / 1000) : 0;
    S.lastTick = t;
    if (!S.fired) {
      const target = heating() ? TARGET_F : AMBIENT_F;
      const step = HEAT_F_PER_SEC * dt;
      S.temp = S.temp < target ? Math.min(target, S.temp + step) : Math.max(target, S.temp - step);
      if (S.valves === "Open") S.pressure = Math.max(0, S.pressure - DRAIN_PER_SEC * dt);
      if (S.platesAt && !S.battery && t - S.platesAt > PLATE_SECONDS * 1000) {
        S.charge = 100; S.platesAt = 0;
        fail("plates");
      }
      if (S.engineAt && t - S.engineAt >= ENGINE_SECONDS * 1000) {
        S.fired = true;
        if (onComplete) onComplete();
      }
    }
    save();
    update();
  }

  return {
    mount(container, complete) {
      onComplete = complete;
      load();
      build(container);
      update();
      setInterval(tick, 250);
    },
    reset() {
      S = fresh();
      engineMsg = "";
      save();
      update();
    }
  };
})();
