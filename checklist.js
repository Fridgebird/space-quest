// Technobabble Checklist: the control panel behind the checklist alert.
// The rules are described in checklist-design.md. The panel's state is kept on
// this device only (localStorage), because only the tablet uses it.

window.Checklist = (function () {
  const KEY = "quest-checklist:" + window.GAME_ID;
  const PLATE_SECONDS = 10, TURBINE_COOL_SECONDS = 20, PRIME_SECONDS = 5;
  const DRAIN_SECONDS = 120, VALVE_TARGET = 30, DEPLETED = 10;

  let S, onComplete, pulseMsg = "";
  const els = {};

  function fresh() {
    return {
      wipers: 0, polarity: "Normal", stirred: false, undervolt: false,
      gamma: false, co: false, bypass: "Enabled", bypassWasDisabled: false,
      rubidium: 100, flux: "Off", plates: "Dirty", platesAt: 0, battery: false,
      radio: 980, crm: "Transmit", erbium: false, turbineCoolUntil: 0,
      plasma: 20, deuterium: 10, valves: "Open", drainStart: 0, drainFrom: 100, frozenP: 100,
      integrator: "ON", primeUntil: 0, fired: false
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

  function pressure() {
    if (!S.drainStart || S.valves === "Shut") return S.frozenP;
    return Math.max(0, S.drainFrom - (now() - S.drainStart) / 1000 * (100 / DRAIN_SECONDS));
  }
  const emitterCharged = () => S.plasma === 451 || (S.primeUntil > 0 && now() >= S.primeUntil);
  const priming = () => S.primeUntil > 0 && now() < S.primeUntil;

  // Gives a control's card one shake and a red edge, when a press doesn't work.
  // It never says why: the crew have to work that out from the posters.
  function fail(id) {
    const c = CONTROLS.find((x) => x.id === id);
    if (!c || !c.card) return;
    c.card.classList.remove("nope");
    void c.card.offsetWidth;
    c.card.classList.add("nope");
  }

  // Runs a change, then brings the erbium warp online if this change completed its conditions.
  function act(fn) {
    if (S.fired) return;
    pulseMsg = "";
    const before = S.flux === "On" && S.crm === "Receive";
    fn();
    if (!before && S.flux === "On" && S.crm === "Receive" && !S.erbium) {
      S.erbium = true;
    }
    save();
    update();
  }

  // Each control: kind is "seg" (choose an option), "num" (type a value), "step" (- / +),
  // "btn" (press) or "light" (read-only). bus: true means it's on the main B bus.
  // lock(value) returns a reason the change isn't allowed yet, or nothing.
  const CONTROLS = [
    { id: "wipers", label: "Wipers", kind: "step", min: 0, max: 10,
      show: () => S.wipers, set: (v) => { S.wipers = v; } },
    { id: "gamma", label: "Gamma wave collectors", kind: "btn", action: "Clean",
      show: () => (S.gamma ? "CLEAN" : "DIRTY"),
      press: () => { S.gamma = true; } },
    { id: "flux", label: "Flux capacitor", kind: "seg", options: ["Off", "On"],
      show: () => S.flux.toUpperCase(), get: () => S.flux, set: (v) => { S.flux = v; },
      lock: (v) => v === "On" && S.polarity !== "Reversed" },
    { id: "radio", label: "Sub-ether radio", kind: "num", bus: true, min: 0, max: 2000, unit: "kHz",
      show: () => S.radio + " kHz", set: (v) => { S.radio = v; } },
    { id: "plates", label: "Dimethyl plates", kind: "btn", action: "Clean",
      show: () => (S.battery ? "CONNECTED" : S.plates === "Clean" ? "CLEAN" : "DIRTY"),
      lock: () => S.rubidium !== 230,
      press: () => { if (S.plates !== "Clean" && !S.battery) { S.plates = "Clean"; S.platesAt = now(); } } },
    { id: "battery", label: "6V battery → positive plate", kind: "btn", action: "Connect",
      show: () => (S.battery ? "CONNECTED" : "DISCONNECTED"),
      press: () => {
        if (S.battery) return;
        if (S.plates !== "Clean") return fail("battery");
        S.battery = true;
      } },
    { id: "polarity", label: "Neutron flow polarity", kind: "seg", options: ["Normal", "Reversed"],
      show: () => S.polarity.toUpperCase(), get: () => S.polarity, set: (v) => { S.polarity = v; } },
    { id: "rubidium", label: "Rubidium limiter", kind: "num", bus: true, min: 0, max: 300,
      show: () => S.rubidium, set: (v) => { S.rubidium = v; },
      lock: () => S.bypass !== "Disabled" },
    { id: "crm", label: "CRM114 discriminator", kind: "seg", bus: true, options: ["Transmit", "Standby", "Receive"],
      show: () => S.crm.toUpperCase(), get: () => S.crm, set: (v) => { S.crm = v; },
      lock: () => S.radio !== 1422 },
    { id: "oxygen", label: "Oxygen tanks", kind: "btn", action: "Stir",
      show: () => (S.stirred ? "STIRRED" : "NOT STIRRED"),
      press: () => { if (!S.stirred) { S.stirred = true; S.undervolt = true; } } },
    { id: "bypass", label: "Static containment bypass", kind: "seg", options: ["Enabled", "Disabled"],
      show: () => S.bypass.toUpperCase(), get: () => S.bypass,
      set: (v) => { S.bypass = v; if (v === "Disabled") S.bypassWasDisabled = true; },
      lock: (v) => (v === "Disabled" && !S.gamma) || (v === "Enabled" && !S.battery) },
    { id: "plasma", label: "Plasma injectors", kind: "num", min: 0, max: 1000, unit: "°C",
      show: () => S.plasma + "°C", set: (v) => { S.plasma = v; },
      lock: () => !S.co },
    { id: "erbium", label: "Erbium warp", kind: "light",
      show: () => (S.erbium ? "ONLINE" : "OFFLINE"), good: () => S.erbium },
    { id: "turbine", label: "Cadmium turbine", kind: "btn", action: "Restart",
      show: () => (now() < S.turbineCoolUntil ? "COOLING " + secsLeft(S.turbineCoolUntil) + "s" : "READY"),
      press: () => {
        if (now() < S.turbineCoolUntil) return fail("turbine");
        if (!S.erbium) { S.erbium = true; return; }
        // Overspeed: restarting a turbine that's already running knocks the erbium warp offline.
        S.erbium = false; S.turbineCoolUntil = now() + TURBINE_COOL_SECONDS * 1000;
        fail("turbine");
      } },
    { id: "deuterium", label: "Deuterium tank pressure", kind: "num", min: 0, max: 100,
      show: () => S.deuterium, lock: () => S.plasma !== 451,
      set: (v) => {
        S.deuterium = v;
        if (v === 42 && !S.drainStart) { S.drainStart = now(); S.drainFrom = S.frozenP; }
      } },
    { id: "fuel", label: "Fuel cell 3 valves", kind: "seg", options: ["Open", "Shut"], gauge: true,
      show: () => S.valves.toUpperCase() + " · " + pressure().toFixed(1) + " µSv", get: () => S.valves,
      set: (v) => {
        if (v === "Shut") { S.frozenP = pressure(); S.valves = "Shut"; }
        else { S.valves = "Open"; if (S.drainStart) { S.drainFrom = S.frozenP; S.drainStart = now(); } }
      } },
    { id: "co", label: "Carbon monoxide pins", kind: "btn", action: "Scrub",
      show: () => (S.co ? "SCRUBBED" : "DIRTY"),
      press: () => { S.co = true; } },
    { id: "integrator", label: "Fused matter/antimatter integrator: emergency bypass", kind: "btn", action: "Toggle",
      show: () => S.integrator,
      lock: () => !(S.bypass === "Enabled" && S.bypassWasDisabled),
      press: () => { S.integrator = S.integrator === "ON" ? "OFF" : "ON"; } },
    { id: "emitter", label: "Tachyon emitter", kind: "btn", action: "Prime",
      show: () => (emitterCharged() ? "CHARGED" : priming() ? "CHARGING " + secsLeft(S.primeUntil) + "s" : "UNCHARGED"),
      press: () => { if (!emitterCharged() && !priming()) S.primeUntil = now() + PRIME_SECONDS * 1000; } },
    { id: "pulse", label: "Tachyon pulse", kind: "btn", action: "Initiate", wide: true,
      show: () => (S.fired ? "FIRED" : pulseMsg || "STANDING BY"),
      press: () => {
        // A failed pulse names the first thing still wrong, so the crew can always finish.
        const problem = firstProblem();
        if (problem) { pulseMsg = "FAILED: " + problem; return fail("pulse"); }
        S.fired = true;
        if (onComplete) onComplete();
      } }
  ];

  function firstProblem() {
    const p = pressure();
    const checks = [
      [S.wipers === 7, "wipers setting incorrect"],
      [S.polarity === "Reversed", "neutron flow polarity incorrect"],
      [S.stirred, "oxygen tanks not stirred"],
      [!S.undervolt, "main B bus undervolt"],
      [S.gamma, "gamma wave collectors dirty"],
      [S.co, "carbon monoxide pins dirty"],
      [S.bypassWasDisabled, "static containment bypass has not been cycled"],
      [S.bypass === "Enabled", "static containment bypass disabled"],
      [S.rubidium === 230, "rubidium limiter setting incorrect"],
      [S.flux === "On", "flux capacitor off"],
      [S.battery, "dimethyl plates not connected"],
      [S.radio === 1422, "sub-ether radio frequency incorrect"],
      [S.crm === "Receive", "CRM114 discriminator setting incorrect"],
      [S.erbium, "erbium warp offline"],
      [S.plasma === 451, "plasma injector temperature incorrect"],
      [S.deuterium === 42, "deuterium tank pressure incorrect"],
      [S.valves === "Shut" && p < VALVE_TARGET && p > DEPLETED, "fuel cell 3 pressure out of range"],
      [S.integrator === "OFF", "integrator emergency bypass active"],
      [emitterCharged(), "tachyon emitter not charged"]
    ];
    const failed = checks.find(([ok]) => !ok);
    return failed ? failed[1] : null;
  }

  // Applies a change from a control, checking power and locks first.
  function attempt(c, value) {
    if (S.fired) return;
    if ((c.bus && S.undervolt) || (c.lock && c.lock(value))) return fail(c.id);
    if (c.kind === "btn") return act(c.press);
    if ((c.kind === "num" || c.kind === "step")
      && (!Number.isInteger(value) || value < c.min || value > c.max)) return fail(c.id);
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
    els.banner = el("div", "cl-banner");
    els.bannerText = el("span");
    els.breaker = el("button", "cl-btn cl-breaker", "Reset B bus breaker");
    els.breaker.addEventListener("click", () => act(() => {
      S.undervolt = false; S.rubidium = 100; S.radio = 980; S.crm = "Transmit";
    }));
    els.banner.append(els.bannerText, els.breaker);
    const grid = el("div", "cl-grid");
    // The banner stays pinned to the top, so it's visible while scrolled down.
    const top = el("div", "cl-top");
    top.append(els.banner);
    container.append(top, grid);

    CONTROLS.forEach((c) => {
      const card = el("div", "cl-card" + (c.wide ? " wide" : ""));
      const head = el("div", "cl-head");
      head.append(el("span", "cl-label", c.label));
      const tags = el("span", "cl-tags");
      if (c.bus) tags.append(el("span", "cl-bus", "⚡ B BUS"));
      c.lockEl = el("span", "cl-lock", "🔒");
      tags.append(c.lockEl);
      head.append(tags);
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
        input.inputMode = "numeric";
        input.placeholder = c.min + "–" + c.max;
        input.setAttribute("aria-label", c.label);
        const set = el("button", "cl-btn", "Set");
        const go = () => { attempt(c, input.value.trim() === "" ? NaN : Number(input.value)); input.value = ""; };
        set.addEventListener("click", go);
        input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
        row.append(input, set);
      } else if (c.kind === "step") {
        const minus = el("button", "cl-btn", "−");
        const plus = el("button", "cl-btn", "+");
        minus.setAttribute("aria-label", c.label + " down");
        plus.setAttribute("aria-label", c.label + " up");
        minus.addEventListener("click", () => attempt(c, S[c.id] - 1));
        plus.addEventListener("click", () => attempt(c, S[c.id] + 1));
        row.append(minus, plus);
      } else if (c.kind === "btn") {
        const b = el("button", "cl-btn" + (c.id === "pulse" ? " cl-fire" : ""), c.action);
        b.addEventListener("click", () => attempt(c));
        row.append(b);
      }
      if (c.gauge) {
        c.gaugeFill = el("div", "cl-gauge-fill");
        const gauge = el("div", "cl-gauge");
        gauge.append(c.gaugeFill, el("div", "cl-gauge-mark"));
        card.append(head, c.valEl, gauge, row);
      } else {
        card.append(head, c.valEl, row);
      }
      c.card = card;
      card.addEventListener("animationend", () => card.classList.remove("nope"));
      grid.append(card);
    });
  }

  function update() {
    CONTROLS.forEach((c) => {
      const dead = !!(c.bus && S.undervolt);
      c.card.classList.toggle("dead", dead);
      const text = dead ? "NO POWER" : String(c.show());
      if (c.valEl.textContent !== text) c.valEl.textContent = text;
      c.valEl.classList.toggle("good", !!(c.good && c.good()));
      // Show the padlock while the control's next useful change is locked.
      const target = c.kind === "seg" ? c.options.find((o) => o !== c.get()) : undefined;
      c.lockEl.hidden = !(c.lock && c.lock(target));
      if (c.optEls) c.optEls.forEach((b, i) => b.classList.toggle("on", c.options[i] === c.get()));
      if (c.gaugeFill) {
        const p = pressure();
        c.gaugeFill.style.width = p + "%";
        c.gaugeFill.classList.toggle("in-range", p < VALVE_TARGET && p > DEPLETED);
      }
    });
    const armed = S.plates === "Clean" && !S.battery;
    els.banner.hidden = !(S.undervolt || armed);
    els.banner.classList.toggle("armed", armed && !S.undervolt);
    els.breaker.hidden = !S.undervolt;
    els.bannerText.textContent = S.undervolt
      ? "⚠ MAIN B BUS UNDERVOLT"
      : "⚠ WARP FUSE ARMED: connect the 6V battery in " + secsLeft(S.platesAt + PLATE_SECONDS * 1000) + "s";
  }

  // Timed rules: the plate fuse, the fuel cell running dry, and the countdown readouts.
  function tick() {
    if (!els.banner) return;
    let changed = false;
    if (S.plates === "Clean" && !S.battery && now() - S.platesAt > PLATE_SECONDS * 1000) {
      S.plates = "Dirty"; changed = true;
      fail("plates");
    }
    if (S.drainStart && S.valves === "Open" && pressure() <= DEPLETED) {
      S.drainFrom = 100; S.drainStart = now(); changed = true;
      fail("fuel");
    }
    if (changed) save();
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
      pulseMsg = "";
      save();
      if (els.banner) update();
    }
  };
})();
