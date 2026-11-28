// Bio sensors diagnostic: a core dump that's really a text stereogram, and a command line
// built by tapping words. Each dump row repeats every PERIOD characters. In the rows set in
// BIO_SENSORS.spots, a space jumps from in front of a word to behind it, so with the eyes
// fused that whole word floats forward. Read top to bottom, the floating words are the
// command. The dump is made of the same words as the tiles, so the flat page gives nothing away.
window.BioSensors = (function () {
  const B = BIO_SENSORS;
  const WIDTH = 90, ROWS = 22, PERIOD = 15;
  const JUNK = ["0x3F", "0xA1", "::", ";", "#", "%%", "<>", "~", "[!]", "@", "^", "07", "9B", "&", "=="];
  const ERRORS = ["Bad command or file name", "Abort, Retry, Fail?", "Syntax error", "Access denied", "Not ready reading drive B:"];
  const SEED = 2626;
  B.command.forEach((w) => {
    if (/(.)\1/.test(w) || w.length > PERIOD - 3) console.warn("Bio sensors: \"" + w + "\" can't float cleanly (doubled letter or too long)");
  });

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  function rng(seed) {
    return () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  }
  const pick = (rand, list) => list[Math.floor(rand() * list.length)];

  // Exactly `len` characters of whole words and junk, separated by spaces.
  function filler(rand, len) {
    let s = "";
    for (let tries = 0; tries < 30; tries++) {
      const add = (s ? " " : "") + (rand() < .6 ? pick(rand, B.words) : pick(rand, JUNK));
      if (s.length + add.length <= len) s += add;
    }
    while (s.length < len) s += rand() < .5 ? " " : pick(rand, ["~", ";", ":", "#", "."]);
    return s;
  }

  function dumpRows() {
    const rand = rng(SEED);
    const rows = [];
    for (let r = 0; r < ROWS; r++) {
      const spot = B.spots.findIndex((s) => s[0] === r);
      const block = new Array(PERIOD);
      let x = -1, word = "";
      if (spot >= 0) {
        // The word sits after a space in the repeating block, starting at column x's slot.
        x = B.spots[spot][1]; word = B.command[spot];
        const text = " " + word + " " + filler(rand, PERIOD - word.length - 2);
        for (let i = 0; i < PERIOD; i++) block[(x % PERIOD + i) % PERIOD] = text[i];
      } else {
        const text = filler(rand, PERIOD - 1) + " ";
        const rot = Math.floor(rand() * PERIOD);
        for (let i = 0; i < PERIOD; i++) block[(rot + i) % PERIOD] = text[i];
      }
      // src[y]: which character of the block position y shows.
      const src = [];
      for (let y = 0; y < WIDTH; y++) {
        if (y < PERIOD) src[y] = y;
        else if (y === x) {
          for (let i = 0; i < word.length; i++) src[y + i] = src[y - PERIOD + 1 + i];
          src[y + word.length] = src[y - PERIOD];
          y += word.length;
        } else src[y] = src[y - PERIOD];
      }
      rows.push(src.slice(0, WIDTH).map((i) => block[i]).join(""));
    }
    return rows;
  }

  let root = null, onSolved = null, cleared = null, found = false, dump = null;
  let typed = [], cmd = null, reply = null;

  function render() {
    root.innerHTML = "";
    const screen = el("div", "crt bio-screen");
    screen.appendChild(el("p", "dos-cmd", "C:\\JMC> DIAG BIOSENS.SYS"));
    root.appendChild(screen);
    if (cleared) {
      screen.appendChild(el("p", "bio-ok", "BIO SENSOR ARRAY: ONLINE."));
      screen.appendChild(el("p", null, B.clearedText));
      if (found && B.foundText) screen.appendChild(el("p", "bio-bad", B.foundText));
      screen.appendChild(el("p", "dos-cmd caret", "C:\\JMC>"));
      dump = null;
      return;
    }
    screen.appendChild(el("p", "bio-bad", "BIO SENSOR ARRAY: OFFLINE. AUTO-RECOVERY FAILED."));
    screen.appendChild(el("p", null, "Core dump follows:"));
    dump = el("pre", "bio-dump", dumpRows().join("\n"));
    screen.appendChild(dump);

    // The command line: tap words to build it.
    const line = el("div", "crt bio-line");
    cmd = el("p", "caret");
    reply = el("p", "bio-reply");
    reply.setAttribute("role", "status");
    line.append(cmd, reply);
    const tiles = el("div", "bio-tiles");
    tiles.setAttribute("aria-label", "Command words");
    B.words.slice().sort().forEach((w) => {
      const b = el("button", "bio-tile", w);
      b.type = "button";
      b.addEventListener("click", () => { Sfx.click(); if (typed.length < 6) typed.push(w); say(""); show(); });
      tiles.appendChild(b);
    });
    const back = el("button", "key", "⌫ Delete");
    back.type = "button";
    back.addEventListener("click", () => { Sfx.click(); typed.pop(); say(""); show(); });
    const enter = el("button", "btn", "Enter");
    enter.type = "button";
    enter.addEventListener("click", run);
    const keys = el("div", "bio-keys");
    keys.append(back, enter);
    root.append(line, tiles, keys);
    show();
    fit();
  }

  function show() { if (cmd) cmd.textContent = "C:\\JMC> " + typed.join(" "); }
  function say(text) { if (reply) reply.textContent = text; }
  function run() {
    if (!typed.length) return;
    if (typed.join(" ") === B.command.join(" ")) {
      say("RUNNING...");
      if (onSolved) onSolved();
      return;
    }
    say(ERRORS[Math.floor(Math.random() * ERRORS.length)]);
    Sfx.buzz();
    typed = [];
    show();
  }

  // Size the dump so a whole row fits the screen width (only works while it's visible).
  function fit() {
    if (!dump || !dump.parentElement.clientWidth) return;
    const box = dump.parentElement.clientWidth - 40;
    dump.style.fontSize = "20px";
    dump.style.fontSize = Math.max(7, 20 * box / dump.scrollWidth) + "px";
  }
  window.addEventListener("resize", fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  return {
    mount(container, solved) { root = container; onSolved = solved; },
    fit,
    // Whether the scan has found something (the stowaway alert has been raised).
    setFound(on) {
      on = !!on;
      if (on === found) return;
      found = on;
      if (cleared) render();
    },
    // Called with the shared state; only redraws when it changes.
    setCleared(on) {
      on = !!on;
      if (on === cleared) return;
      cleared = on;
      typed = [];
      render();
    }
  };
})();
