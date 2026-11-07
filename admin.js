const app = document.getElementById("app");
const key = new URLSearchParams(location.search).get("key");

if (key !== ADMIN_KEY) {
  app.innerHTML = '<p class="denied">Nothing to see here 👽</p>';
} else {
  app.innerHTML =
    "<h1>🛰️ Mission Control</h1>" +
    '<div class="sub"><span id="count"></span> · <span class="status" id="status">Connecting…</span></div>' +
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

  document.getElementById("reset").addEventListener("click", () => {
    if (confirm("Reset the whole game and send the tablet back to the log-on screen?")) GameState.reset();
  });

  GameState.subscribe((state) => {
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
