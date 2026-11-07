// Technobabble Checklist: the control panel behind the checklist alert.
// The rules are described in checklist-design.md. The panel's state is kept on
// this device only (localStorage), because only the tablet uses it.

window.Checklist = (function () {
  const KEY = "quest-checklist:" + window.GAME_ID;
  const PLATE_SECONDS = 10, TURBINE_COOL_SECONDS = 20, PRIME_SECONDS = 5;
  const DRAIN_SECONDS = 120, VALVE_TARGET = 30, DEPLETED = 10;

  let S, onComplete, log = [];
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

  function say(text, type) {
    log.unshift({ text, type: type || "info" });
    log = log.slice(0, 5);
    renderLog();
  }

  // Runs a change, then brings the erbium warp online if this change completed its conditions.
  function act(fn) {
    if (S.fired) return say("All systems nominal. Checklist complete.", "ok");
    const before = S.flux === "On" && S.crm === "Receive";
    fn();
    if (!before && S.flux === "On" && S.crm === "Receive" && !S.erbium) {
      S.erbium = true;
      say("Erbium warp online.", "ok");
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
      press: () => { if (S.gamma) return say("Gamma wave collectors already clean."); S.gamma = true; say("Gamma wave collectors cleaned.", "ok"); } },
    { id: "flux", label: "Flux capacitor", kind: "seg", options: ["Off", "On"],
      show: () => S.flux.toUpperCase(), get: () => S.flux, set: (v) => { S.flux = v; },
      lock: (v) => v === "On" && S.polarity !== "Reversed" && "LOCKED: neutron flow polarity must be reversed" },
    { id: "radio", label: "Sub-ether radio", kind: "num", bus: true, min: 0, max: 2000, unit: "kHz",
      show: () => S.radio + " kHz", set: (v) => { S.radio = v; } },
    { id: "plates", label: "Dimethyl plates", kind: "btn", action: "Clean",
      show: () => (S.battery ? "CONNECTED" : S.plates === "Clean" ? "CLEAN" : "DIRTY"),
      lock: () => S.rubidium !== 230 && "LOCKED: rubidium limiter must be set to 230",
      press: () => {
        if (S.battery) return say("Dimethyl plates already connected.");
        if (S.plates === "Clean") return say("Dimethyl plates already clean. Connect the battery!", "warn");
        S.plates = "Clean"; S.platesAt = now();
        say("Dimethyl plates clean. Connect the 6V battery within " + PLATE_SECONDS + " seconds!", "warn");
      } },
    { id: "battery", label: "6V battery → positive plate", kind: "btn", action: "Connect",
      show: () => (S.battery ? "CONNECTED" : "DISCONNECTED"),
      press: () => {
        if (S.battery) return say("Battery already connected.");
        if (S.plates !== "Clean") return say("Plates contaminated: clean first.", "err");
        S.battery = true;
        say("6V battery connected to the positive plate.", "ok");
      } },
    { id: "polarity", label: "Neutron flow polarity", kind: "seg", options: ["Normal", "Reversed"],
      show: () => S.polarity.toUpperCase(), get: () => S.polarity, set: (v) => { S.polarity = v; } },
    { id: "rubidium", label: "Rubidium limiter", kind: "num", bus: true, min: 0, max: 300,
      show: () => S.rubidium, set: (v) => { S.rubidium = v; },
      lock: () => S.bypass !== "Disabled" && "LOCKED: static containment bypass must be disabled" },
    { id: "crm", label: "CRM114 discriminator", kind: "seg", bus: true, options: ["Transmit", "Standby", "Receive"],
      show: () => S.crm.toUpperCase(), get: () => S.crm, set: (v) => { S.crm = v; },
      lock: () => S.radio !== 1422 && "LOCKED: sub-ether radio must be tuned to 1422 kHz" },
    { id: "oxygen", label: "Oxygen tanks", kind: "btn", action: "Stir",
      show: () => (S.stirred ? "STIRRED" : "NOT STIRRED"),
      press: () => {
        if (S.stirred) return say("Oxygen tanks already stirred.");
        S.stirred = true; S.undervolt = true;
        say("MAIN B BUS UNDERVOLT! B bus systems have lost power.", "err");
      } },
    { id: "bypass", label: "Static containment bypass", kind: "seg", options: ["Enabled", "Disabled"],
      show: () => S.bypass.toUpperCase(), get: () => S.bypass,
      set: (v) => { S.bypass = v; if (v === "Disabled") S.bypassWasDisabled = true; },
      lock: (v) => (v === "Disabled" && !S.gamma && "LOCKED: gamma wave collectors must be cleaned")
        || (v === "Enabled" && !S.battery && "LOCKED: dimethyl plates must be connected to the 6V battery") },
    { id: "plasma", label: "Plasma injectors", kind: "num", min: 0, max: 1000, unit: "°C",
      show: () => S.plasma + "°C", set: (v) => { S.plasma = v; },
      lock: () => !S.co && "LOCKED: carbon monoxide pins must be scrubbed" },
    { id: "erbium", label: "Erbium warp", kind: "light",
      show: () => (S.erbium ? "ONLINE" : "OFFLINE"), good: () => S.erbium },
    { id: "turbine", label: "Cadmium turbine", kind: "btn", action: "Restart",
      show: () => (now() < S.turbineCoolUntil ? "COOLING " + secsLeft(S.turbineCoolUntil) + "s" : "READY"),
      press: () => {
        if (now() < S.turbineCoolUntil) return say("Cadmium turbine cooling: " + secsLeft(S.turbineCoolUntil) + " seconds.", "err");
        if (!S.erbium) { S.erbium = true; return say("Cadmium turbine restarted. Erbium warp online.", "ok"); }
        S.erbium = false; S.turbineCoolUntil = now() + TURBINE_COOL_SECONDS * 1000;
        say("CADMIUM TURBINE OVERSPEED! Erbium warp offline. Turbine cooling for " + TURBINE_COOL_SECONDS + " seconds.", "err");
      } },
    { id: "deuterium", label: "Deuterium tank pressure", kind: "num", min: 0, max: 100,
      show: () => S.deuterium, lock: () => S.plasma !== 451 && "LOCKED: plasma injectors must be at 451°C",
      set: (v) => {
        S.deuterium = v;
        if (v === 42 && !S.drainStart) {
          S.drainStart = now(); S.drainFrom = S.frozenP;
          say("Fuel cell 3 pressure dropping.", "warn");
        }
      } },
    { id: "fuel", label: "Fuel cell 3 valves", kind: "seg", options: ["Open", "Shut"], gauge: true,
      show: () => S.valves.toUpperCase() + " · " + pressure().toFixed(1) + " µSv", get: () => S.valves,
      set: (v) => {
        if (v === "Shut") { S.frozenP = pressure(); S.valves = "Shut"; }
        else { S.valves = "Open"; if (S.drainStart) { S.drainFrom = S.frozenP; S.drainStart = now(); } }
      } },
    { id: "co", label: "Carbon monoxide pins", kind: "btn", action: "Scrub",
      show: () => (S.co ? "SCRUBBED" : "DIRTY"),
      press: () => { if (S.co) return say("Carbon monoxide pins already scrubbed."); S.co = true; say("Carbon monoxide pins scrubbed.", "ok"); } },
    { id: "integrator", label: "Fused matter/antimatter integrator: emergency bypass", kind: "btn", action: "Toggle",
      show: () => S.integrator,
      lock: () => !(S.bypass === "Enabled" && S.bypassWasDisabled) && "LOCKED: static containment bypass must be re-enabled",
      press: () => { S.integrator = S.integrator === "ON" ? "OFF" : "ON"; say("Integrator emergency bypass " + S.integrator + ".", "ok"); } },
    { id: "emitter", label: "Tachyon emitter", kind: "btn", action: "Prime",
      show: () => (emitterCharged() ? "CHARGED" : priming() ? "CHARGING " + secsLeft(S.primeUntil) + "s" : "UNCHARGED"),
      press: () => {
        if (emitterCharged()) return say("Tachyon emitter already charged.");
        if (priming()) return say("Tachyon emitter is charging.");
        S.primeUntil = now() + PRIME_SECONDS * 1000;
        say("Priming tachyon emitter…", "warn");
      } },
    { id: "pulse", label: "Tachyon pulse", kind: "btn", action: "Initiate", wide: true,
      show: () => (S.fired ? "FIRED" : "STANDING BY"),
      press: () => {
        const problem = firstProblem();
        if (problem) return say("TACHYON PULSE FAILED: " + problem, "err");
        S.fired = true;
        say("Tachyon pulse initiated. All systems nominal. Checklist complete!", "ok");
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
    if (S.fired) return say("All systems nominal. Checklist complete.", "ok");
    if (c.bus && S.undervolt) return say("NO POWER: main B bus undervolt.", "err");
    const reason = c.lock && c.lock(value);
    if (reason) return say(reason + ".", "err");
    if (c.kind === "btn") return act(c.press);
    if (c.kind === "num" || c.kind === "step") {
      if (!Number.isInteger(value) || value < c.min || value > c.max) {
        return say(c.label + ": value must be between " + c.min + " and " + c.max + ".", "err");
      }
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
    els.banner = el("div", "cl-banner");
    els.bannerText = el("span");
    els.breaker = el("button", "cl-btn cl-breaker", "Reset B bus breaker");
    els.breaker.addEventListener("click", () => act(() => {
      S.undervolt = false; S.rubidium = 100; S.radio = 980; S.crm = "Transmit";
      say("B bus breaker reset. B bus systems restored to factory settings.", "warn");
    }));
    els.banner.append(els.bannerText, els.breaker);
    els.log = el("div", "cl-log");
    els.log.setAttribute("aria-live", "polite");
    const grid = el("div", "cl-grid");
    // The banner and log stay pinned to the top, so messages are visible while scrolled down.
    const top = el("div", "cl-top");
    top.append(els.banner, els.log);
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
      grid.append(card);
    });
    renderLog();
  }

  function renderLog() {
    if (!els.log) return;
    els.log.innerHTML = "";
    if (!log.length) log = [{ text: "Checklist console ready. Awaiting instructions.", type: "info" }];
    log.forEach((m, i) => els.log.append(el("div", "cl-msg " + m.type + (i ? " old" : ""), "> " + m.text)));
  }

  function update() {
    CONTROLS.forEach((c) => {
      const dead = c.bus && S.undervolt;
      c.card.classList.toggle("dead", dead);
      c.valEl.textContent = dead ? "NO POWER" : String(c.show());
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
    if (!els.log) return;
    let changed = false;
    if (S.plates === "Clean" && !S.battery && now() - S.platesAt > PLATE_SECONDS * 1000) {
      S.plates = "Dirty"; changed = true;
      say("WARP FUSE TRIPPED! Dimethyl plates contaminated. Clean them and try again.", "err");
    }
    if (S.drainStart && S.valves === "Open" && pressure() <= DEPLETED) {
      S.drainFrom = 100; S.drainStart = now(); changed = true;
      say("FUEL CELL 3 DEPLETED! Refilling. Pressure dropping again.", "err");
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
      log = [];
      save();
      if (els.log) { renderLog(); update(); }
    }
  };
})();
