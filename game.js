const $ = (id) => document.getElementById(id);
const LOGGED_ON_KEY = "quest-logged-on:" + GAME_ID;
const RESET_KEY = "quest-reset:" + GAME_ID;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  remove(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let cleared = {};
let warped = false;
let firstLoad = true;
let openAlert = null;
let stopTyping = null;

// Status lights in the header: they change slowly and never strobe.
const leds = Array.from({ length: 16 }, () => $("blinks").appendChild(document.createElement("i")));
const shuffleLed = (l) => { const r = Math.random(); l.className = r < .35 ? "a" : r < .55 ? "g" : ""; };
leds.forEach(shuffleLed);
if (!reducedMotion) setInterval(() => shuffleLed(leds[Math.floor(Math.random() * leds.length)]), 1400);

// Static screens
$("endTitle").textContent = ENDING.title;
$("endBody").textContent = ENDING.text;

const make = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

// Ship and crew names come from Mission Control (state.names); until then the
// placeholders in config.js are shown.
let namesShown = null;
function renderNames(names) {
  const key = JSON.stringify(names || null);
  if (key === namesShown) return;
  namesShown = key;
  const n = names || {};
  const ship = n.ship || SHIP.name;
  $("logonShip").textContent = ship;
  $("headerShip").textContent = ship;

  // Crew Manifest: a personnel file for each rank. Optional ranks only appear when
  // ticked as playing; the stowaway is never listed.
  const files = $("crewFiles");
  files.innerHTML = "";
  const listed = CREW.filter((c) => !c.optional || n.science);
  listed.forEach((c, i) => {
    const saved = (n.crew && n.crew[c.id]) || {};
    const file = make("article", "file");
    const photo = make("div", "photo");
    const img = make("img");
    img.alt = "";
    img.src = saved.photo || Portraits.silhouette(CREW.indexOf(c));
    photo.appendChild(img);
    const rec = make("div", "rec");
    rec.append(
      make("span", "rk", c.role),
      make("span", "nm", saved.name || "[Name]"),
      make("span", "dim", "STAFF NO. " + c.staff),
      make("span", "dim", "STASIS POD " + (i + 1)),
      make("span", "ok", "STATUS: REVIVED")
    );
    file.append(photo, rec);
    files.appendChild(file);
  });

  // About the Ship: a stamped builder's plate.
  const plate = make("div", "plate");
  plate.append(make("div", "builder engr", SHIP.builder), make("div", "pname engr", ship), make("div", "pclass engr", SHIP.type));
  const dl = make("dl", "engr");
  const rows = SHIP.details.slice();
  rows.splice(1, 0, ["Cargo", n.cargo || SHIP.cargo], ["Crew", listed.length + " (in stasis)"]);
  rows.forEach(([label, value]) => {
    const dd = make("dd");
    if (String(value).toUpperCase() === "UNKNOWN") dd.appendChild(make("span", "unknown", "UNKNOWN"));
    else dd.textContent = value;
    dl.append(make("dt", null, label), dd);
  });
  plate.appendChild(dl);
  const holder = $("shipPlate");
  holder.innerHTML = "";
  holder.appendChild(plate);
  if (SHIP.plateNote) {
    const note = make("div", "plate-note-row");
    note.appendChild(make("span", "plate-note", SHIP.plateNote));
    holder.appendChild(note);
  }
}
renderNames(null);

// Messages. Pass typeFirst to type out the first message.
function renderMessages(typeFirst) {
  if (stopTyping) stopTyping();
  const list = $("messageList");
  list.innerHTML = "";
  MESSAGES.forEach((m, i) => {
    const card = document.createElement("article");
    card.className = "card";
    const head = document.createElement("div");
    head.className = "msg-head";
    head.textContent = "From: " + m.from;
    const subject = document.createElement("div");
    subject.className = "msg-subject";
    subject.textContent = m.subject;
    const body = document.createElement("div");
    body.className = "msg-body";
    const paras = m.body.map((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      body.appendChild(p);
      return p;
    });
    card.append(head, subject, body);
    if (i === 0) {
      const actions = document.createElement("div");
      actions.className = "msg-actions";
      const toAlerts = document.createElement("button");
      toAlerts.className = "key";
      toAlerts.textContent = "View alerts";
      toAlerts.addEventListener("click", () => showView("alerts"));
      actions.appendChild(toAlerts);
      if (typeFirst && !reducedMotion) typeOut(m.body, paras, actions);
      card.appendChild(actions);
    }
    list.appendChild(card);
  });
}

function typeOut(texts, paras, actions) {
  paras.forEach((p) => { p.textContent = ""; });
  const skip = document.createElement("button");
  skip.className = "key";
  skip.textContent = "Skip";
  actions.prepend(skip);
  let pi = 0, ci = 0;
  const finish = () => {
    clearInterval(timer);
    paras.forEach((p, i) => { p.textContent = texts[i]; p.classList.remove("caret"); });
    skip.remove();
    stopTyping = null;
  };
  const timer = setInterval(() => {
    if (pi >= paras.length) return finish();
    ci++;
    paras[pi].textContent = texts[pi].slice(0, ci);
    paras[pi].classList.add("caret");
    if (ci >= texts[pi].length) {
      paras[pi].classList.remove("caret");
      pi++; ci = 0;
    }
  }, 28);
  skip.addEventListener("click", finish);
  stopTyping = finish;
}

// Navigation
const navButtons = document.querySelectorAll("nav button");
navButtons.forEach((b) => b.addEventListener("click", () => { Sfx.click(); showView(b.dataset.view); }));
function showView(view) {
  const navView = view === "checklist" ? "alerts" : view;
  navButtons.forEach((b) => b.classList.toggle("active", b.dataset.view === navView));
  ["messages", "crew", "ship", "alerts", "checklist"].forEach((v) => { $("view-" + v).hidden = v !== view; });
  document.body.classList.toggle("wide-view", view === "checklist");
  window.scrollTo(0, 0);
}

function showConsole(firstTime) {
  $("logon").hidden = true;
  $("console").hidden = false;
  renderMessages(firstTime);
  showView("messages");
}
function showLogon() {
  closeAlert();
  if (stopTyping) stopTyping();
  $("console").hidden = true;
  $("logon").hidden = false;
}
if (store.get(LOGGED_ON_KEY)) showConsole(false);
$("logonBtn").addEventListener("click", () => {
  store.set(LOGGED_ON_KEY, "1");
  Sfx.init();
  Sfx.clunk();
  showConsole(true);
});

// Alert tiles
const tileEls = {};
ALERTS.forEach((a) => {
  const b = document.createElement("button");
  b.className = "tile";
  b.innerHTML = '<div class="sym"></div><div class="name"></div><div class="tag"></div>';
  b.querySelector(".sym").textContent = a.symbol;
  b.querySelector(".name").textContent = a.title;
  b.addEventListener("click", () => {
    if (a.checklist && !cleared[a.id]) return showView("checklist");
    openAlert = a; renderAlert(true);
  });
  $("grid").appendChild(b);
  tileEls[a.id] = b;
});

// The warp core start-up checklist has its own screen of controls.
const checklistAlert = ALERTS.find((a) => a.checklist);
if (checklistAlert) {
  $("checklistTitle").textContent = checklistAlert.title;
  Checklist.mount($("checklistRoot"), () => {
    GameState.setCleared(checklistAlert.id, true).catch(() => {
      $("status").textContent = "⚠ Could not reach the database";
    });
  });
}
$("checklistBack").addEventListener("click", () => showView("alerts"));

function renderAlert(fresh) {
  const a = openAlert;
  if (!a) return;
  const isCleared = !!cleared[a.id];
  $("modal").hidden = false;
  $("mBox").classList.toggle("cleared", isCleared);
  $("mSym").textContent = a.symbol;
  $("mTitle").textContent = a.title;
  $("mState").textContent = isCleared ? "CLEARED" : "ALERT ACTIVE";
  $("mContent").innerHTML = isCleared ? a.clearedText : a.description;
  $("codeForm").hidden = isCleared || !a.code;
  $("mBox").classList.toggle("wide", !!a.wiring);
  if (fresh || isCleared) { $("codeError").textContent = ""; $("codeInput").value = ""; wireSelected = null; }
  renderWiring(a, isCleared);
  if (fresh && a.code && !isCleared) $("codeInput").focus();
}

// Wiring puzzles: tap a left terminal, then a right terminal, to connect them.
const wiring = {}; // alertId -> { leftLabel: rightLabel }
let wireSelected = null;
const WIRE_COLOURS = ["#ff5d73", "#ffd166", "#4be3a0", "#5ee7ff", "#b89cff", "#ff9f43", "#f78fb3", "#a3e635"];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function renderWiring(a, isCleared) {
  $("wirePanel").hidden = !a.wiring;
  if (!a.wiring) return;
  const w = a.wiring;
  const links = isCleared ? w.solution : (wiring[a.id] = wiring[a.id] || {});
  const n = Math.max(w.left.length, w.right.length);
  const LX = 80, RX = 320, y = (i) => 36 + i * 64;
  let svg = "";
  w.left.forEach((L, i) => {
    const j = w.right.map(String).indexOf(String(links[L]));
    if (j < 0) return;
    svg += '<path class="wire' + (isCleared ? " powered" : "") + '" style="color:' + WIRE_COLOURS[i % WIRE_COLOURS.length] + '" d="M' + LX + " " + y(i) +
      " C " + (LX + 120) + " " + y(i) + ", " + (RX - 120) + " " + y(j) + ", " + RX + " " + y(j) + '"/>';
  });
  const term = (side, label, i, x) =>
    '<g class="term' + (side === "L" && wireSelected === label ? " sel" : "") + '" data-side="' + side + '" data-i="' + i + '">' +
    '<circle class="hit" cx="' + x + '" cy="' + y(i) + '" r="30"/>' +
    '<circle class="post" cx="' + x + '" cy="' + y(i) + '" r="15"/>' +
    '<text x="' + (side === "L" ? x - 28 : x + 28) + '" y="' + y(i) + '" text-anchor="' + (side === "L" ? "end" : "start") + '">' + esc(label) + "</text></g>";
  w.left.forEach((L, i) => { svg += term("L", L, i, LX); });
  w.right.forEach((R, i) => { svg += term("R", R, i, RX); });
  $("wireSvg").setAttribute("viewBox", "0 0 400 " + (n * 64 + 8));
  $("wireSvg").innerHTML = svg;
  $("wireActions").hidden = isCleared;
}

$("wireSvg").addEventListener("click", (e) => {
  const g = e.target.closest(".term");
  const a = openAlert;
  if (!g || !a || !a.wiring || cleared[a.id]) return;
  const links = wiring[a.id];
  const i = Number(g.dataset.i);
  if (g.dataset.side === "L") {
    const L = a.wiring.left[i];
    wireSelected = wireSelected === L ? null : L;
  } else {
    const R = a.wiring.right[i];
    // A right terminal takes one wire, so drop any wire already on it.
    for (const k in links) if (links[k] === R) delete links[k];
    if (wireSelected) links[wireSelected] = R;
    wireSelected = null;
  }
  $("codeError").textContent = "";
  renderWiring(a, false);
});
$("wireReset").addEventListener("click", () => {
  if (!openAlert) return;
  wiring[openAlert.id] = {};
  wireSelected = null;
  $("codeError").textContent = "";
  renderWiring(openAlert, false);
});
$("wirePower").addEventListener("click", () => {
  const a = openAlert;
  if (!a || !a.wiring) return;
  const links = wiring[a.id] || {};
  if (a.wiring.left.some((L) => links[L] == null)) {
    $("codeError").textContent = "Connect every terminal first.";
    return;
  }
  if (a.wiring.left.every((L) => String(links[L]) === String(a.wiring.solution[L]))) {
    GameState.setCleared(a.id, true).catch(() => {
      $("codeError").textContent = "Transmission failed. Try again.";
    });
  } else {
    $("codeError").textContent = "CIRCUIT FAULT: POWER FAILED";
    Sfx.buzz();
    const p = $("wirePanel");
    p.classList.remove("shake"); void p.offsetWidth; p.classList.add("shake");
  }
});
function closeAlert() {
  openAlert = null;
  $("modal").hidden = true;
}
$("mClose").addEventListener("click", closeAlert);
$("modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeAlert(); });

const normaliseCode = (s) => String(s).replace(/\s+/g, "").toUpperCase();
$("codeForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const a = openAlert;
  if (!a) return;
  if (normaliseCode($("codeInput").value) === normaliseCode(a.code)) {
    GameState.setCleared(a.id, true).catch(() => {
      $("codeError").textContent = "Transmission failed. Try again.";
    });
  } else {
    $("codeError").textContent = "INVALID CODE";
    Sfx.buzz();
    const form = $("codeForm");
    form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
  }
});

function render(newlyCleared) {
  let active = 0;
  ALERTS.forEach((a) => {
    const el = tileEls[a.id];
    const isCleared = !!cleared[a.id];
    if (!isCleared) active++;
    el.classList.toggle("cleared", isCleared);
    el.querySelector(".tag").textContent = isCleared ? "CLEARED" : "ACTIVE";
    if (newlyCleared.includes(a.id)) {
      el.classList.remove("just"); void el.offsetWidth; el.classList.add("just");
    }
  });
  $("badge").textContent = active;
  $("badge").hidden = active === 0;
  $("warpBtn").disabled = active > 0;
  $("warpBtn").textContent = active > 0
    ? "WARP OFFLINE: " + active + (active === 1 ? " ALERT ACTIVE" : " ALERTS ACTIVE")
    : "ENGAGE WARP DRIVE";
}

$("warpBtn").addEventListener("click", () => {
  GameState.setWarped().catch(() => {
    $("status").textContent = "⚠ Could not reach the database";
  });
});

// Ending: warp streaks, then Earth grows as the ship flies home.
const WARP_END = 3.6, ARRIVAL = 5.5;
let warpFrame = null;

function playEnding(skipToEnd) {
  closeAlert();
  if (warpFrame) cancelAnimationFrame(warpFrame);
  $("ending").hidden = false;
  const canvas = $("warpCanvas");
  const ctx = canvas.getContext("2d");
  const size = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  size();
  window.onresize = size;
  const stars = Array.from({ length: 320 }, () => ({
    x: (Math.random() - .5) * 2000, y: (Math.random() - .5) * 2000, z: Math.random() * 1000 + 1
  }));
  const skip = skipToEnd || reducedMotion;
  const start = performance.now() - (skip ? (WARP_END + ARRIVAL + 1) * 1000 : 0);
  let last = performance.now();
  $("engaging").classList.toggle("show", !skip);
  $("endFinal").classList.toggle("show", skip);
  if (!skip) Sfx.warp();

  function frame(now) {
    const t = (now - start) / 1000;
    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    const w = canvas.width, h = canvas.height, cx = w / 2, cy = h * .42;
    const speed = t < WARP_END ? 60 + Math.pow(t / WARP_END, 3) * 2600 : 40;
    const streak = t < WARP_END ? Math.min(speed * .05, 160) : 1;
    ctx.fillStyle = "#02030c";
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = "round";
    stars.forEach((s) => {
      s.z -= speed * dt;
      if (s.z < 1) { s.z = 1000; s.x = (Math.random() - .5) * 2000; s.y = (Math.random() - .5) * 2000; }
      const sx = cx + s.x / s.z * 300, sy = cy + s.y / s.z * 300;
      const px = cx + s.x / (s.z + streak) * 300, py = cy + s.y / (s.z + streak) * 300;
      ctx.strokeStyle = t < WARP_END ? "#bfefff" : "#ffffff";
      ctx.lineWidth = t < WARP_END ? 1.6 : 1.3;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx + .1, sy); ctx.stroke();
    });
    if (t >= WARP_END - .4 && $("engaging").classList.contains("show")) $("engaging").classList.remove("show");
    if (t >= WARP_END) {
      const e = Math.min((t - WARP_END) / ARRIVAL, 1);
      drawEarth(ctx, cx, cy, Math.min(w, h) * (.02 + .3 * (1 - Math.pow(1 - e, 3))));
      if (e < 1) drawShip(ctx, cx, h * .95 + (cy - h * .95) * e, 70 * (1 - e) + 3);
      if (e >= 1) $("endFinal").classList.add("show");
    }
    const flash = 1 - Math.abs(t - WARP_END) / .35;
    if (flash > 0) {
      ctx.fillStyle = "rgba(255,255,255," + flash + ")";
      ctx.fillRect(0, 0, w, h);
    }
    warpFrame = requestAnimationFrame(frame);
  }
  warpFrame = requestAnimationFrame(frame);
}

function drawEarth(ctx, x, y, r) {
  const glow = ctx.createRadialGradient(x, y, r * .9, x, y, r * 1.3);
  glow.addColorStop(0, "rgba(94,190,255,.55)");
  glow.addColorStop(1, "rgba(94,190,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(x, y, r * 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
  const sea = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
  sea.addColorStop(0, "#4aa8ff");
  sea.addColorStop(1, "#0b3a8c");
  ctx.fillStyle = sea;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = "#3fa35c";
  [[-.35, -.3, .4, .28], [.3, .1, .32, .42], [-.3, .4, .28, .2], [.45, -.5, .22, .14]].forEach(([dx, dy, rx, ry]) => {
    ctx.beginPath(); ctx.ellipse(x + dx * r, y + dy * r, rx * r, ry * r, .5, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = "#f4fbff";
  ctx.beginPath(); ctx.ellipse(x, y - r * .97, r * .5, r * .13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawShip(ctx, x, y, size) {
  ctx.fillStyle = "#ffb347";
  ctx.beginPath(); ctx.ellipse(x, y + size * .62, size * .14, size * .34, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#dfe7ff";
  ctx.beginPath();
  ctx.moveTo(x, y - size * .6);
  ctx.lineTo(x + size * .42, y + size * .5);
  ctx.lineTo(x, y + size * .3);
  ctx.lineTo(x - size * .42, y + size * .5);
  ctx.closePath(); ctx.fill();
}

function hideEnding() {
  if (warpFrame) cancelAnimationFrame(warpFrame);
  warpFrame = null;
  window.onresize = null;
  $("ending").hidden = true;
}

GameState.subscribe((state) => {
  const fresh = Object.keys(state.cleared).filter((id) => state.cleared[id] && !cleared[id]);
  cleared = state.cleared;
  renderNames(state.names);
  render(firstLoad ? [] : fresh);
  if (openAlert) renderAlert(false);
  if (!firstLoad && fresh.length) Sfx.chime();

  // Mission Control pressed Reset: go back to the log-on screen.
  const resetAt = state.resetAt ? String(state.resetAt) : "";
  if (resetAt !== (store.get(RESET_KEY) || "")) {
    store.set(RESET_KEY, resetAt);
    store.remove(LOGGED_ON_KEY);
    Checklist.reset();
    showLogon();
  }

  if (state.warped && !warped) playEnding(firstLoad);
  if (!state.warped && warped) hideEnding();
  warped = !!state.warped;
  firstLoad = false;
}, (connected) => {
  $("status").textContent = (GameState.isDemo ? "Demo mode · " : "") + (connected ? "● Live" : "○ Reconnecting…");
}).catch((err) => {
  $("status").textContent = "⚠ " + err.message;
});
