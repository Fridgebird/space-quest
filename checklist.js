// Warp core start-up: the control panel behind the checklist alert.
// Three posters (Electrical, Dilithium, Plasma) are read out by runners; the rules are
// described in checklist-design.md. The panel's state is kept on this device only
// (localStorage), because only the tablet uses it.

window.Checklist = (function () {
  const KEY = "quest-warpcore:" + window.GAME_ID;
  const PLATE_SECONDS = 10;                  // to connect the battery after discharging the plates
  const AMBIENT_F = 70, TARGET_F = 451, HEAT_F_PER_SEC = 10;
  const FULL_PRESSURE = 100, DRAIN_PER_SEC = 100 / 120, TOP_UP = 3, LOW = 10, HIGH = 30;
  const ENGINE_SECONDS = 6;                  // rubidium gauge climbing to 100

  let S, onComplete, engineMsg = "";
  const els = {};

  function fresh() {
    return {
      // Electrical
      flux: "Off", crm: "Transmit", resonator: "Nominal", grid: "Off", regulator: 0.5,
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

  // Gives a control's card one shake and a red edge, when a press doesn't work.
  // It never says why: the crew have to work that out from the posters.
  function fail(id) {
    const c = CONTROLS.find((x) => x.id === id);
    if (!c || !c.card) return;
    c.card.classList.remove("nope");
    void c.card.offsetWidth;
    c.card.classList.add("nope");
  }

  function act(fn) {
    if (busy()) return;
    engineMsg = "";
    fn();
    save();
    update();
  }

  // Each control: kind is "seg" (choose an option), "num" (type a value), "btn" (press)
  // or "light" (read-only). bus: true means it's on the main B bus.
  // lock(value) is true while that change isn't allowed yet; the card just shakes.
  // lamp() gives a switch its own indicator light. The order here is the order on screen,
  // deliberately mixed up so the posters' controls are scattered around the panel.
  const CONTROLS = [
    { id: "flux", label: "Flux capacitor", kind: "seg", options: ["Off", "On"],
      get: () => S.flux, set: (v) => { S.flux = v; } },
    { id: "injection", label: "Antiproton injection seal", kind: "seg", options: ["Free", "Inhibited", "Token"],
      get: () => S.injection, set: (v) => { S.injection = v; } },
    { id: "conduits", label: "Plasma conduits", kind: "seg", options: ["Off", "On"],
      get: () => S.conduits, set: (v) => { S.conduits = v; }, lamp: () => S.conduits === "On" },
    { id: "regulator", label: "Temporal flux regulator", kind: "num", bus: true, min: 0, max: 10, decimals: 2,
      show: () => S.regulator.toFixed(2) + " jigawatts", set: (v) => { S.regulator = v; } },
    { id: "polarity", label: "Neutron flow polarity", kind: "seg", options: ["Nominal", "Reversed"],
      get: () => S.polarity, set: (v) => { S.polarity = v; },
      lock: (v) => v === "Reversed" && !(S.bypass === "Disabled" && S.resonator === "Override") },
    { id: "rubidium", label: "Rubidium limiter", kind: "num", min: 0, max: 300,
      show: () => S.rubidium + " einsteins", set: (v) => { S.rubidium = v; },
      gauge: () => engineOutput(), gaugeOk: () => engineOutput() >= 100 },
    { id: "resonator", label: "Subspace resonator", kind: "seg", options: ["Nominal", "Override"],
      get: () => S.resonator, set: (v) => { S.resonator = v; } },
    { id: "plates", label: "Dimethyl plates", kind: "btn", action: "Discharge",
      show: () => "CHARGE " + S.charge + "%", gauge: () => S.charge,
      lock: () => !(S.injection === "Inhibited" && S.bypass === "Disabled" && S.polarity === "Reversed"),
      press: () => { if (!S.battery && S.charge > 0) { S.charge = 0; S.platesAt = now(); } } },
    { id: "heater", label: "Plasma injectors", kind: "seg", options: ["Off", "On"],
      show: () => Math.round(S.temp) + "°F", get: () => S.heater, set: (v) => { S.heater = v; } },
    { id: "crm", label: "CRM114 discriminator", kind: "seg", options: ["Transmit", "Standby", "Receive"],
      get: () => S.crm, set: (v) => { S.crm = v; } },
    { id: "bypass", label: "Static containment bypass", kind: "seg", options: ["Enabled", "Disabled"],
      get: () => S.bypass,
      set: (v) => { S.bypass = v; if (v === "Disabled") S.bypassWasDisabled = true; } },
    { id: "oxygen", label: "Oxygen tanks", kind: "btn", action: "Stir",
      lock: () => !S.battery,
      press: () => { if (!S.stirred) { S.stirred = true; S.undervolt = true; } } },
    { id: "battery", label: "6V battery → positive plate", kind: "btn", action: "Connect",
      press: () => {
        if (S.battery) return;
        if (!S.platesAt) return fail("battery");
        S.battery = true; S.platesAt = 0;
      } },
    { id: "cartridge", label: "Atmospheric thermal plasma", kind: "seg", options: ["Open", "Shut"],
      show: () => S.pressure.toFixed(1) + " µPa", get: () => S.valves, set: (v) => { S.valves = v; },
      rowLabel: "Atmospheric thermal plasma cartridge valves",
      lock: (v) => v === "Open" && S.temp < TARGET_F,
      gauge: () => S.pressure, band: [LOW, HIGH], gaugeOk: pressureOK,
      extra: { action: "Auxiliary reserve +" + TOP_UP,
        press: () => { S.pressure = Math.min(FULL_PRESSURE, S.pressure + TOP_UP); } } },
    { id: "grid", label: "Power transfer grid", kind: "seg", options: ["Off", "On"],
      get: () => S.grid, set: (v) => { S.grid = v; } },
    { id: "integrator", label: "Fused matter/antimatter integrator: emergency bypass", kind: "seg", options: ["Locked", "Unlocked"],
      get: () => S.integrator, set: (v) => { S.integrator = v; },
      lock: (v) => v === "Unlocked" && !(S.bypass === "Enabled" && S.battery) },
    // Flipping the breaker always cycles the B bus, so the flux regulator goes back to
    // its starting setting even if the bus was fine.
    { id: "breaker", label: "Fuse breaker", kind: "btn", action: "Flip",
      press: () => { S.undervolt = false; S.regulator = 0.5; } },
    { id: "manifold", label: "Gravimetric field displacement manifold", kind: "light",
      show: () => (manifoldNominal() ? "NOMINAL" : "FLUCTUATING"), good: manifoldNominal },
    { id: "relay", label: "Antimatter relay", kind: "seg", options: ["Off", "On"],
      get: () => S.relay, set: (v) => { S.relay = v; }, lamp: relayLit },
    { id: "engine", label: "Supersonic combustion engine", kind: "btn", action: "Start", wide: true,
      show: () => (S.fired ? "RUNNING · WARP CORE ONLINE" : S.engineAt ? "STARTING…" : engineMsg || "STANDBY"),
      good: () => S.fired,
      press: () => {
        // The engine waits for the relay and the rubidium limiter. After that, a failed start
        // names the first thing still wrong, so the crew can always finish.
        if (!relayLit() || S.rubidium !== 230) return fail("engine");
        const problem = firstProblem();
        if (problem) { engineMsg = "FAILED: " + problem; return fail("engine"); }
        S.engineAt = now();
      } }
  ];

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

  // Applies a change from a control, checking power and locks first.
  function attempt(c, value) {
    if (busy()) return;
    if ((c.bus && S.undervolt) || (c.lock && c.lock(value))) return fail(c.id);
    if (c.kind === "btn") return act(c.press);
    if (c.kind === "num") {
      // Whole numbers, or up to `decimals` places (rounded, so 1.21 is exactly 1.21).
      const places = c.decimals || 0;
      if (!Number.isFinite(value) || value < c.min || value > c.max) return fail(c.id);
      if (!places && !Number.isInteger(value)) return fail(c.id);
      value = Math.round(value * 10 ** places) / 10 ** places;
    }
    act(() => c.set(value));
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function build(container) {
    container.innerHTML = "";
    // Two warning lights that are always there. Only B ever lights up, and nothing on
    // screen says how to fix it: that's on the Plasma poster.
    const lights = el("div", "cl-lights");
    els.lightA = el("div", "cl-light", "MAIN A BUS UNDERVOLT");
    els.lightB = el("div", "cl-light", "MAIN B BUS UNDERVOLT");
    lights.append(els.lightA, els.lightB);
    els.banner = el("div", "cl-banner");
    const grid = el("div", "cl-grid");
    // The lights and banner stay pinned to the top, so they're visible while scrolled down.
    const top = el("div", "cl-top");
    top.append(lights, els.banner);
    container.append(top, grid);

    CONTROLS.forEach((c) => {
      const card = el("div", "cl-card" + (c.wide ? " wide" : ""));
      const head = el("div", "cl-head");
      head.append(el("span", "cl-label", c.label));
      if (c.lamp) {
        c.lampEl = el("span", "cl-lamp");
        c.lampEl.setAttribute("role", "img");
        head.append(c.lampEl);
      }
      c.valEl = el("div", "cl-val");
      const row = el("div", "cl-row");
      if (c.kind === "seg") {
        c.optEls = c.options.map((o) => {
          const b = el("button", "cl-seg", o);
          b.addEventListener("click", () => { if (o !== c.get()) attempt(c, o); });
          row.append(b);
          return b;
        });
      } else if (c.kind === "num") {
        const input = el("input", "cl-input");
        input.inputMode = c.decimals ? "decimal" : "numeric";
        input.placeholder = c.min + "–" + c.max;
        input.setAttribute("aria-label", c.label);
        const set = el("button", "cl-btn", "Set");
        // Some tablets type a comma for the decimal point.
        const go = () => { const t = input.value.trim().replace(",", "."); attempt(c, t === "" ? NaN : Number(t)); input.value = ""; };
        set.addEventListener("click", go);
        input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
        row.append(input, set);
      } else if (c.kind === "btn") {
        const b = el("button", "cl-btn" + (c.id === "engine" ? " cl-fire" : ""), c.action);
        b.addEventListener("click", () => attempt(c));
        row.append(b);
      }
      if (c.extra) {
        const b = el("button", "cl-btn", c.extra.action);
        b.addEventListener("click", () => act(c.extra.press));
        row.append(b);
      }
      card.append(head, c.valEl);
      if (c.gauge) {
        c.gaugeFill = el("div", "cl-gauge-fill");
        const gauge = el("div", "cl-gauge");
        if (c.band) {
          const band = el("div", "cl-gauge-band");
          band.style.left = c.band[0] + "%";
          band.style.width = (c.band[1] - c.band[0]) + "%";
          gauge.append(band);
        }
        gauge.append(c.gaugeFill);
        card.append(gauge);
      }
      if (c.rowLabel) card.append(el("div", "cl-rowlabel", c.rowLabel));
      card.append(row);
      c.card = card;
      card.addEventListener("animationend", () => card.classList.remove("nope"));
      grid.append(card);
    });
  }

  function update() {
    CONTROLS.forEach((c) => {
      const dead = !!(c.bus && S.undervolt);
      c.card.classList.toggle("dead", dead);
      // Switches and buttons have no readout: they only say something when they lose power.
      const text = dead ? "NO POWER" : c.show ? String(c.show()) : "";
      if (c.valEl.textContent !== text) c.valEl.textContent = text;
      c.valEl.hidden = !text;
      c.valEl.classList.toggle("good", !!(c.good && c.good()));
      if (c.lampEl) {
        const lit = !!c.lamp();
        c.lampEl.classList.toggle("lit", lit);
        c.lampEl.setAttribute("aria-label", lit ? "Light on" : "Light off");
      }
      if (c.optEls) c.optEls.forEach((b, i) => b.classList.toggle("on", c.options[i] === c.get()));
      if (c.gaugeFill) {
        c.gaugeFill.style.width = Math.max(0, Math.min(100, c.gauge())) + "%";
        c.gaugeFill.classList.toggle("in-range", !!(c.gaugeOk && c.gaugeOk()));
      }
    });
    els.lightB.classList.toggle("on", S.undervolt);
    const armed = S.platesAt > 0 && !S.battery;
    els.banner.hidden = !armed;
    els.banner.textContent = "⚠ WARP FUSE ARMED · " + secsLeft(S.platesAt + PLATE_SECONDS * 1000) + "s";
  }

  // Time passing: the injectors heating or cooling, the plasma draining while the valves
  // are open, the warp fuse, and the engine spinning up.
  function tick() {
    if (!els.banner) return;
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
      if (els.banner) update();
    }
  };
})();
