const app = document.getElementById("app");
const key = new URLSearchParams(location.search).get("key");

if (key !== ADMIN_KEY) {
  app.innerHTML = '<p class="denied">Nothing to see here 👽</p>';
} else {
  app.innerHTML =
    "<h1>🛰️ Mission Control</h1>" +
    '<div class="sub"><span id="count"></span> · <span class="status" id="status">Connecting…</span></div>' +
    '<details class="names" id="names"><summary>Name the ship &amp; crew</summary><form id="namesForm" autocomplete="off"></form></details>' +
    '<div id="list"></div>' +
    '<div class="warp" id="warp"></div>' +
    '<button class="reset" id="reset">Reset game (raise all alerts, back to log-on)</button>';

  let cleared = {};
  const rows = {};

  ALERTS.forEach((a) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML =
      '<div class="sym"></div>' +
      '<div class="info"><div class="t"></div><div class="r"></div></div>' +
      '<button class="toggle"></button>';
    row.querySelector(".sym").textContent = a.symbol;
    row.querySelector(".t").textContent = a.title;
    row.querySelector(".r").textContent =
      a.code ? "Crew enter code: " + a.code
      : a.wiring ? "Crew wire: " + a.wiring.left.map((L) => L + "→" + a.wiring.solution[L]).join(", ")
      : a.checklist ? "Crew complete the checklist on the tablet"
      : "You clear this one";
    const btn = row.querySelector(".toggle");
    btn.addEventListener("click", () => {
      const clear = !cleared[a.id];
      if (!clear && !confirm("Raise \"" + a.title + "\" again?")) return;
      GameState.setCleared(a.id, clear);
    });
    rows[a.id] = { row, btn };
    document.getElementById("list").appendChild(row);
  });

  // ---------- Name the ship & crew (after the warm-up) ----------
  const form = document.getElementById("namesForm");
  const field = (label, id) => {
    const wrap = document.createElement("label");
    wrap.className = "field";
    wrap.innerHTML = "<span></span><input type=\"text\">";
    wrap.querySelector("span").textContent = label;
    const input = wrap.querySelector("input");
    input.id = id;
    form.appendChild(wrap);
    return input;
  };
  const shipInput = field("Ship name", "nShip");
  const cargoInput = field("Cargo", "nCargo");
  const picker = Object.assign(document.createElement("input"), { type: "file", accept: "image/*", hidden: true });
  form.appendChild(picker);
  let pickingFor = null, dirty = false, filled = false;
  const markDirty = () => { dirty = true; saved.textContent = "Not sent yet"; saved.className = "saved pending"; };

  const crewRows = CREW.map((c, i) => {
    const row = document.createElement("div");
    row.className = "crew";
    row.innerHTML =
      '<button type="button" class="photo"><img alt=""><span>Photo</span></button>' +
      '<div class="who"><div class="rank"></div><input type="text"></div>' +
      '<button type="button" class="unphoto" hidden>Remove photo</button>';
    row.querySelector(".rank").textContent = c.role;
    const input = row.querySelector("input");
    input.setAttribute("aria-label", c.role + " name");
    input.placeholder = "Name";
    const img = row.querySelector("img");
    const unphoto = row.querySelector(".unphoto");
    const r = { c, row, input, img, unphoto, photo: null, playing: null };
    if (c.optional) {
      const lab = document.createElement("label");
      lab.className = "playing";
      lab.innerHTML = '<input type="checkbox"> Playing today';
      r.playing = lab.querySelector("input");
      r.playing.addEventListener("change", () => { refreshRow(r); markDirty(); });
      row.querySelector(".rank").appendChild(lab);
    }
    row.querySelector(".photo").addEventListener("click", () => { pickingFor = r; picker.value = ""; picker.click(); });
    unphoto.addEventListener("click", () => { r.photo = null; refreshRow(r); markDirty(); });
    input.addEventListener("input", markDirty);
    form.appendChild(row);
    return r;
  });
  function refreshRow(r) {
    const i = CREW.indexOf(r.c);
    r.img.src = r.photo || Portraits.silhouette(i);
    r.unphoto.hidden = !r.photo;
    const on = !r.playing || r.playing.checked;
    r.row.classList.toggle("off", !on);
    r.input.disabled = !on;
  }
  crewRows.forEach(refreshRow);
  picker.addEventListener("change", () => {
    const f = picker.files && picker.files[0];
    if (!f || !pickingFor) return;
    const r = pickingFor;
    Portraits.fromFile(f).then((url) => { r.photo = url; refreshRow(r); markDirty(); }).catch((e) => alert(e.message));
  });
  shipInput.addEventListener("input", markDirty);
  cargoInput.addEventListener("input", markDirty);

  const send = Object.assign(document.createElement("button"), { type: "submit", className: "send", textContent: "Send to ship" });
  const saved = Object.assign(document.createElement("div"), { className: "saved" });
  form.append(send, saved);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const crew = {};
    crewRows.forEach((r) => { crew[r.c.id] = { name: r.input.value.trim(), photo: r.photo || null }; });
    const science = crewRows.find((r) => r.playing);
    const names = { ship: shipInput.value.trim(), cargo: cargoInput.value.trim(), crew, science: science ? science.playing.checked : false };
    saved.textContent = "Sending…"; saved.className = "saved pending";
    GameState.setNames(names).then(() => {
      dirty = false;
      saved.textContent = "✓ Sent to the ship"; saved.className = "saved ok";
    }).catch(() => { saved.textContent = "⚠ Couldn't send. Try again."; saved.className = "saved bad"; });
  });

  // Fills the form from what's saved, unless you're part-way through editing it.
  function fillNames(n) {
    if (dirty) return;
    n = n || {};
    shipInput.value = n.ship || "";
    cargoInput.value = n.cargo || "";
    crewRows.forEach((r) => {
      const saved = (n.crew && n.crew[r.c.id]) || {};
      r.input.value = saved.name || "";
      r.photo = saved.photo || null;
      if (r.playing) r.playing.checked = !!n.science;
      refreshRow(r);
    });
    // Open the section until the ship has a name.
    if (!filled) document.getElementById("names").open = !n.ship;
    filled = true;
  }

  document.getElementById("reset").addEventListener("click", () => {
    if (confirm("Reset the whole game and send the tablet back to the log-on screen? (Names and photos are kept.)")) GameState.reset();
  });

  GameState.subscribe((state) => {
    fillNames(state.names);
    cleared = state.cleared;
    let n = 0;
    ALERTS.forEach((a) => {
      const on = !!cleared[a.id];
      if (on) n++;
      rows[a.id].row.classList.toggle("done", on);
      rows[a.id].btn.classList.toggle("on", on);
      rows[a.id].btn.textContent = on ? "Cleared" : "Clear";
    });
    document.getElementById("count").textContent = n + "/" + ALERTS.length + " alerts cleared";
    const warp = document.getElementById("warp");
    warp.classList.toggle("on", state.warped || n === ALERTS.length);
    warp.textContent = state.warped ? "🚀 Warp engaged: game complete"
      : n === ALERTS.length ? "Warp button is live on the tablet"
      : "Warp offline until all alerts are cleared";
  }, (connected) => {
    document.getElementById("status").textContent = (GameState.isDemo ? "Demo mode · " : "") + (connected ? "● Live" : "○ Reconnecting…");
  }).catch((err) => {
    document.getElementById("status").textContent = "⚠ " + err.message;
  });
}
