// Ship's Log: locked with the Klatchian cipher (a sudoku drawn in glyphs). The crew solve
// the coloured squares and enter their glyphs to unlock it. Whether it's unlocked is shared
// game state, so Mission Control sees it and Reset locks it again.
window.Cipher = (function () {
  const C = SHIP_LOG.cipher;
  const COLOURS = { Blue: "#3fd8ff", Pink: "#ff5fd2", Green: "#8dff5a" };
  const colourOf = (m) => COLOURS[m.colour] || m.colour;
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  let root = null, onSolved = null, unlocked = null;
  let entered = [], active = 0, slots = [], verdict = null, slotRow = null;

  // The whole grid is one SVG, so it scales cleanly on any screen.
  function gridSvg() {
    const S = 40, O = 4, N = 9 * S;
    let g = "";
    for (let i = 1; i < 9; i++) {
      const thick = i % 3 === 0, p = O + i * S;
      const attrs = thick ? 'stroke-width="3" stroke-opacity="1"' : 'stroke-width="1" stroke-opacity=".35"';
      g += '<path d="M' + p + " " + O + " V" + (O + N) + " M" + O + " " + p + " H" + (O + N) + '" stroke="currentColor" ' + attrs + "/>";
    }
    g += '<rect x="' + O + '" y="' + O + '" width="' + N + '" height="' + N + '" fill="none" stroke="currentColor" stroke-width="3"/>';
    // The coloured squares go on top of the grid lines, so their whole outline shows.
    C.marks.forEach((m) => {
      g += '<rect x="' + (O + (m.c - 1) * S) + '" y="' + (O + (m.r - 1) * S) + '" width="' + S + '" height="' + S +
        '" fill="' + colourOf(m) + '" fill-opacity=".22" stroke="' + colourOf(m) + '" stroke-width="3.5"/>';
    });
    C.puzzle.forEach((row, r) => row.split("").forEach((ch, c) => {
      if (ch === "0") return;
      g += '<g transform="translate(' + (O + c * S + 7) + " " + (O + r * S + 7) + ') scale(.65)">' + Glyphs.shape(+ch) + "</g>";
    }));
    const marked = C.marks.map((m) => m.colour.toLowerCase()).join(", ");
    return '<svg class="cipher-grid" viewBox="0 0 ' + (N + 2 * O) + " " + (N + 2 * O) + '" role="img" aria-label="Cipher grid of glyphs, 9 by 9, with ' +
      C.marks.length + " squares marked: " + marked + '">' + g + "</svg>";
  }

  function render() {
    root.innerHTML = "";
    const screen = el("div", "crt cipher-screen");
    screen.appendChild(el("p", "dos-cmd", "C:\\JMC> TYPE SHIPLOG.DAT"));
    root.appendChild(screen);
    if (unlocked) {
      screen.appendChild(el("p", "log-ok", "CIPHER ACCEPTED. LOG UNLOCKED."));
      const dl = el("dl", "log-rows");
      SHIP_LOG.entries.forEach(([time, text]) => dl.append(el("dt", null, time), el("dd", null, text)));
      screen.append(dl, el("p", "dos-cmd caret", "C:\\JMC>"));
      return;
    }
    screen.appendChild(el("p", "log-denied", "ACCESS DENIED: LOG LOCKED BY KLATCHIAN UKODUS CIPHER"));
    screen.appendChild(el("p", null, "Lock applied by: UNKNOWN USER"));
    const holder = el("div", "cipher-grid-wrap");
    holder.innerHTML = gridSvg();
    screen.appendChild(holder);

    // The answer slots, one per coloured square, then the glyph keypad.
    entered = C.marks.map(() => null);
    active = 0;
    slotRow = el("div", "cipher-slots");
    slots = C.marks.map((m, i) => {
      const b = el("button", "cipher-slot");
      b.type = "button";
      b.style.setProperty("--hc", colourOf(m));
      b.appendChild(el("span", "cipher-well"));
      b.addEventListener("click", () => { Sfx.click(); active = i; drawSlots(); });
      slotRow.appendChild(b);
      return b;
    });
    const keys = el("div", "cipher-keys");
    keys.setAttribute("aria-label", "Glyph keypad");
    for (let n = 1; n <= 9; n++) {
      const k = el("button", "cipher-key");
      k.type = "button";
      k.setAttribute("aria-label", "Glyph " + GLYPH_NAMES[n]);
      k.innerHTML = Glyphs.svg(n);
      k.addEventListener("click", () => {
        Sfx.click();
        entered[active] = n;
        active = Math.min(active + 1, entered.length - 1);
        say("");
        drawSlots();
      });
      keys.appendChild(k);
    }
    const clear = el("button", "key", "Clear");
    clear.type = "button";
    clear.addEventListener("click", () => { entered = entered.map(() => null); active = 0; say(""); drawSlots(); });
    const unlock = el("button", "btn", "Unlock log");
    unlock.type = "button";
    unlock.addEventListener("click", tryUnlock);
    const actions = el("div", "cipher-actions");
    actions.append(clear, unlock);
    verdict = el("div", "cipher-verdict");
    verdict.setAttribute("role", "status");
    const entry = el("div", "cipher-entry");
    entry.append(slotRow, keys, actions, verdict);
    root.appendChild(entry);
    drawSlots();
  }

  function drawSlots() {
    slots.forEach((s, i) => {
      s.classList.toggle("active", i === active);
      s.querySelector(".cipher-well").innerHTML = entered[i] ? Glyphs.svg(entered[i]) : "";
      s.setAttribute("aria-label", C.marks[i].colour + " square: " + (entered[i] ? GLYPH_NAMES[entered[i]] : "empty"));
    });
  }
  function say(text) { if (verdict) verdict.textContent = text; }

  function tryUnlock() {
    if (entered.indexOf(null) >= 0) return say("ENTER A GLYPH FOR EVERY SQUARE");
    if (C.marks.every((m, i) => entered[i] === m.answer)) {
      say("");
      if (onSolved) onSolved();
      return;
    }
    say("CIPHER REJECTED");
    Sfx.buzz();
    slotRow.classList.remove("shake"); void slotRow.offsetWidth; slotRow.classList.add("shake");
  }

  return {
    isUnlocked() { return !!unlocked; },
    mount(container, solved) { root = container; onSolved = solved; },
    // Called with the shared state; only redraws when it changes, so entries in progress are kept.
    setUnlocked(on) {
      on = !!on;
      if (on === unlocked) return;
      unlocked = on;
      render();
    }
  };
})();
