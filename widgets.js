// Panel hardware for the checklist: toggle switches, knobs, a fader, selector knobs,
// push buttons, covered switches, dial gauges, lamps and seven-segment readouts.
// Each widget only draws itself and reports what the player tried to do; checklist.js
// decides whether that's allowed and then tells the widget what to show.

window.Widgets = (function () {
  const NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Metal gradients shared by every switch and knob.
  const defs = svgEl("svg", { width: 0, height: 0, "aria-hidden": "true", style: "position:absolute" });
  defs.innerHTML =
    '<defs><linearGradient id="w-chrome" x1="0" x2="1"><stop offset="0" stop-color="#6c6e68"/><stop offset=".45" stop-color="#e9ebe4"/><stop offset=".6" stop-color="#a9aba3"/><stop offset="1" stop-color="#4a4c47"/></linearGradient>' +
    '<radialGradient id="w-knob" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#4a4b47"/><stop offset="1" stop-color="#151614"/></radialGradient>' +
    '<radialGradient id="w-nut" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#c9cbc4"/><stop offset="1" stop-color="#5b5d57"/></radialGradient></defs>';
  document.body.appendChild(defs);

  function shake(node) {
    node.classList.remove("w-shake");
    void node.offsetWidth;
    node.classList.add("w-shake");
  }
  document.addEventListener("animationend", (e) => { if (e.target.classList) e.target.classList.remove("w-shake"); });

  // ---------- Seven-segment readout ----------
  const SEGS = { a: [4, 1, 16, 3], b: [20, 4, 3, 15], c: [20, 21, 3, 15], d: [4, 36, 16, 3], e: [1, 21, 3, 15], f: [1, 4, 3, 15], g: [4, 18.5, 16, 3] };
  const DIGITS = { 0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcdfg", "-": "g", " ": "" };
  function sevenSeg(digits) {
    const host = el("span", "w-seg");
    let last = null;
    return {
      el: host,
      set(text) {
        if (text === last) return;
        last = text;
        const chars = [];
        for (const ch of text) { if (ch === ".") { if (chars.length) chars[chars.length - 1].dp = true; } else chars.push({ ch, dp: false }); }
        while (chars.length < digits) chars.unshift({ ch: " ", dp: false });
        host.innerHTML = "";
        const svg = svgEl("svg", { viewBox: "0 0 " + chars.length * 28 + " 40", "aria-hidden": "true" }, host);
        chars.forEach((c, i) => {
          const on = DIGITS[c.ch] || "";
          for (const s in SEGS) {
            const [x, y, w, h] = SEGS[s];
            svgEl("rect", { x: x + i * 28, y, width: w, height: h, rx: 1.4, class: on.includes(s) ? "on" : "off" }, svg);
          }
          svgEl("circle", { cx: 25.5 + i * 28, cy: 37.5, r: 1.8, class: c.dp ? "on" : "off" }, svg);
        });
        host.setAttribute("aria-label", text.trim() || "blank");
      }
    };
  }

  // ---------- Indicator lamp ----------
  function lamp(colour) {
    const l = el("span", "w-lamp " + (colour || "amber"));
    l.setAttribute("role", "img");
    return { el: l, set(on) { l.classList.toggle("lit", !!on); l.setAttribute("aria-label", on ? "Light on" : "Light off"); } };
  }

  // ---------- Toggle switch (bat handle; up or down) ----------
  function toggle({ name, up, down, withLamp, lampColour }) {
    const wrap = el("div", "w-tgl down");
    const lp = withLamp ? lamp(lampColour) : null;
    wrap.appendChild(lp ? lp.el : el("span", "w-lamp blank"));
    wrap.appendChild(el("span", "w-pos", up));
    const b = el("button", "w-tgl-btn");
    b.type = "button";
    b.setAttribute("aria-label", name);
    const svg = svgEl("svg", { viewBox: "0 0 60 90", "aria-hidden": "true" }, b);
    svgEl("rect", { x: 9, y: 22, width: 42, height: 46, rx: 4, fill: "#262824", stroke: "#0c0d0b" }, svg);
    svgEl("polygon", { points: "30,31 42,38 42,52 30,59 18,52 18,38", fill: "url(#w-nut)", stroke: "#2c2d2a" }, svg);
    svgEl("circle", { cx: 30, cy: 45, r: 6, fill: "#3b3d38" }, svg);
    const bat = svgEl("g", { class: "w-bat" }, svg);
    svgEl("polygon", { points: "27,45 33,45 35,12 25,12", fill: "url(#w-chrome)", stroke: "#2a2b28", "stroke-width": 0.6 }, bat);
    svgEl("circle", { cx: 30, cy: 11, r: 6.5, fill: "url(#w-chrome)", stroke: "#2a2b28", "stroke-width": 0.6 }, bat);
    wrap.appendChild(b);
    wrap.appendChild(el("span", "w-pos", down));
    if (name) wrap.appendChild(el("span", "w-name", name));
    const api = {
      el: wrap, button: b, onFlip: null,
      set(isUp) {
        wrap.classList.toggle("down", !isUp);
        b.setAttribute("aria-pressed", String(!!isUp));
        b.setAttribute("aria-label", name + ": " + (isUp ? up : down));
      },
      lamp(on) { if (lp) lp.set(on); }
    };
    b.addEventListener("click", () => { if (api.onFlip) api.onFlip(); });
    return api;
  }

  // ---------- Rotary selector (chicken-head knob between labelled positions) ----------
  function selector({ name, options }) {
    const wrap = el("div", "w-sel");
    const n = options.length;
    const angles = options.map((_, i) => (n === 1 ? 0 : -55 + (110 * i) / (n - 1)));
    const optEls = options.map((o, i) => {
      const b = el("button", "w-sel-opt", o);
      b.type = "button";
      const a = (angles[i] - 90) * Math.PI / 180;
      b.style.left = 50 + Math.cos(a) * 44 + "%";
      b.style.top = 58 + Math.sin(a) * 58 + "%";
      b.addEventListener("click", () => { if (api.onPick) api.onPick(o); });
      wrap.appendChild(b);
      return b;
    });
    const svg = svgEl("svg", { viewBox: "0 0 110 110", class: "w-sel-knob", role: "button", tabindex: 0, "aria-label": name + ": next setting" }, wrap);
    svgEl("circle", { cx: 55, cy: 57, r: 44, fill: "#000", opacity: 0.45 }, svg);
    svgEl("circle", { cx: 55, cy: 55, r: 44, fill: "#20221e", stroke: "#0a0a09", "stroke-width": 2 }, svg);
    const g = svgEl("g", { class: "w-sel-g" }, svg);
    svgEl("path", { d: "M47 92 L49 20 Q55 6 61 20 L63 92 Q55 100 47 92 Z", fill: "url(#w-knob)", stroke: "#000", "stroke-width": 1.5 }, g);
    svgEl("rect", { x: 53.5, y: 16, width: 3, height: 26, rx: 1.5, fill: "#f2eedf" }, g);
    let current = 0;
    const next = () => { if (api.onPick) api.onPick(options[(current + 1) % n]); };
    svg.addEventListener("click", next);
    svg.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next(); } });
    const api = {
      el: wrap, onPick: null,
      set(option) {
        current = Math.max(0, options.indexOf(option));
        g.style.transform = "rotate(" + angles[current] + "deg)";
        optEls.forEach((b, i) => b.classList.toggle("on", i === current));
      }
    };
    return api;
  }

  // ---------- Knob turned by dragging round; each 20 degrees is one click ----------
  function knob({ name }) {
    const wrap = el("div", "w-knob");
    const svg = svgEl("svg", { viewBox: "0 0 104 104", tabindex: 0, role: "slider", "aria-label": name }, wrap);
    for (let i = 0; i < 24; i++) {
      const a = (i * 15 - 90) * Math.PI / 180, r2 = i % 2 ? 42 : 39;
      svgEl("line", { x1: 52 + Math.cos(a) * 46, y1: 52 + Math.sin(a) * 46, x2: 52 + Math.cos(a) * r2, y2: 52 + Math.sin(a) * r2, stroke: "#d8d3bf", "stroke-width": i % 2 ? 1 : 2, opacity: 0.7 }, svg);
    }
    const g = svgEl("g", {}, svg);
    svgEl("circle", { cx: 52, cy: 54, r: 34, fill: "#000", opacity: 0.45 }, g);
    svgEl("circle", { cx: 52, cy: 52, r: 34, fill: "#1b1c1a", stroke: "#000", "stroke-width": 2 }, g);
    svgEl("circle", { cx: 52, cy: 52, r: 31, fill: "none", stroke: "#3a3b37", "stroke-width": 4, "stroke-dasharray": "2 2.3" }, g);
    svgEl("circle", { cx: 52, cy: 52, r: 24, fill: "url(#w-knob)" }, g);
    svgEl("rect", { x: 50, y: 20, width: 4, height: 20, rx: 2, fill: "#f2eedf" }, g);
    wrap.appendChild(el("span", "w-name", name));
    let angle = 0, last = null, acc = 0;
    const api = { el: wrap, onTurn: null };
    // onTurn(+1 or -1) returns true if the click was accepted; only then does the knob move.
    const turn = (n) => {
      if (!api.onTurn || !api.onTurn(n)) { last = null; return; }
      angle += n * 20;
      g.setAttribute("transform", "rotate(" + angle + " 52 52)");
    };
    const ang = (e) => { const r = svg.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
    svg.addEventListener("pointerdown", (e) => { try { svg.setPointerCapture(e.pointerId); } catch (err) {} last = ang(e); acc = 0; });
    svg.addEventListener("pointermove", (e) => {
      if (last === null) return;
      const a = ang(e);
      let d = a - last;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      last = a; acc += d;
      while (last !== null && acc >= 20) { acc -= 20; turn(1); }
      while (last !== null && acc <= -20) { acc += 20; turn(-1); }
    });
    const end = () => { last = null; };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
    svg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowRight") { e.preventDefault(); turn(1); }
      if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); turn(-1); }
    });
    return api;
  }

  // ---------- Vertical fader ----------
  function fader({ name, min, max, step, ticks }) {
    const wrap = el("div", "w-fader");
    wrap.tabIndex = 0;
    wrap.setAttribute("role", "slider");
    wrap.setAttribute("aria-label", name);
    wrap.setAttribute("aria-valuemin", min);
    wrap.setAttribute("aria-valuemax", max);
    wrap.appendChild(el("div", "w-fader-slot"));
    const pos = (v) => "calc(10px + (100% - 20px) * " + (1 - (v - min) / (max - min)) + ")";
    for (let v = min; v <= max; v += ticks) {
      const t = el("span", "w-fader-tick", String(v));
      t.style.top = pos(v);
      wrap.appendChild(t);
    }
    const cap = el("div", "w-fader-cap");
    wrap.appendChild(cap);
    const api = { el: wrap, onSlide: null, value: min };
    const snap = (v) => Math.max(min, Math.min(max, Math.round(v / step) * step));
    const fromY = (e) => { const r = wrap.getBoundingClientRect(); return min + (1 - (e.clientY - r.top - 10) / (r.height - 20)) * (max - min); };
    const slide = (v) => { v = snap(v); if (v !== api.value && api.onSlide) api.onSlide(v); };
    let dragging = false;
    wrap.addEventListener("pointerdown", (e) => { dragging = true; try { wrap.setPointerCapture(e.pointerId); } catch (err) {} slide(fromY(e)); });
    wrap.addEventListener("pointermove", (e) => { if (dragging) slide(fromY(e)); });
    wrap.addEventListener("pointerup", () => { dragging = false; });
    wrap.addEventListener("pointercancel", () => { dragging = false; });
    wrap.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") { e.preventDefault(); slide(api.value + step); }
      if (e.key === "ArrowDown") { e.preventDefault(); slide(api.value - step); }
    });
    api.set = (v) => { api.value = v; cap.style.top = pos(v); wrap.setAttribute("aria-valuenow", v); };
    return api;
  }

  // ---------- Push buttons ----------
  function pushButton({ label, colour }) {
    const b = el("button", "w-push " + (colour || ""), label);
    b.type = "button";
    const api = { el: b, onPress: null };
    b.addEventListener("click", () => { if (api.onPress) api.onPress(); });
    return api;
  }
  function mushroom({ label }) {
    const b = el("button", "w-mushroom", label);
    b.type = "button";
    const api = { el: b, onPress: null };
    b.addEventListener("click", () => { if (api.onPress) api.onPress(); });
    return api;
  }

  // ---------- Covered switch: lift the striped cover, then throw the switch ----------
  function guarded({ name }) {
    const wrap = el("div", "w-guard");
    const housing = el("div", "w-guard-housing");
    const cover = el("button", "w-guard-cover");
    cover.type = "button";
    cover.setAttribute("aria-label", "Lift the " + name + " cover");
    const t = toggle({ name, up: "", down: "" });
    t.el.querySelectorAll(".w-pos, .w-name, .w-lamp").forEach((n) => n.remove());
    housing.append(cover, t.el);
    wrap.append(housing, el("span", "w-name", name));
    let timer = null;
    const close = () => { wrap.classList.remove("open"); Sfx.clunk(); };
    cover.addEventListener("click", () => {
      wrap.classList.add("open"); Sfx.clunk();
      clearTimeout(timer); timer = setTimeout(close, 6000);
    });
    const api = { el: wrap, onThrow: null };
    // It's a momentary switch: it springs back down after being thrown, then the cover drops.
    t.onFlip = () => {
      t.set(true); Sfx.click();
      setTimeout(() => t.set(false), 450);
      clearTimeout(timer); timer = setTimeout(close, 1200);
      if (api.onThrow) api.onThrow();
    };
    return api;
  }

  // ---------- Dial gauge ----------
  function gauge({ min, max, major, minor, unit, band, mark, redFrom }) {
    const wrap = el("div", "w-gauge");
    const svg = svgEl("svg", { viewBox: "0 0 220 216", "aria-hidden": "true" }, wrap);
    const A0 = -210, A1 = 30;
    const deg = (v) => A0 + (A1 - A0) * ((v - min) / (max - min));
    const pt = (d, r) => [110 + Math.cos(d * Math.PI / 180) * r, 110 + Math.sin(d * Math.PI / 180) * r];
    const arc = (from, to, r, colour, w) => {
      const [x1, y1] = pt(deg(from), r), [x2, y2] = pt(deg(to), r);
      svgEl("path", { d: "M" + x1 + " " + y1 + " A" + r + " " + r + " 0 " + (deg(to) - deg(from) > 180 ? 1 : 0) + " 1 " + x2 + " " + y2, stroke: colour, "stroke-width": w, fill: "none" }, svg);
    };
    svgEl("circle", { cx: 110, cy: 110, r: 98, fill: "#e8e2cc", stroke: "#111", "stroke-width": 6 }, svg);
    if (redFrom != null) arc(redFrom, max, 84, "#c0201b", 8);
    if (band) arc(band[0], band[1], 84, "#138a3a", 8);
    for (let v = min; v <= max + 1e-9; v += minor) {
      const isMajor = Math.abs((v - min) % major) < 1e-9 || Math.abs(((v - min) % major) - major) < 1e-9;
      const [x1, y1] = pt(deg(v), 88), [x2, y2] = pt(deg(v), isMajor ? 75 : 81);
      svgEl("line", { x1, y1, x2, y2, stroke: "#1b1b18", "stroke-width": isMajor ? 2.4 : 1.2 }, svg);
      if (isMajor) {
        const [tx, ty] = pt(deg(v), 62);
        svgEl("text", { x: tx, y: ty + 4, "text-anchor": "middle", class: "w-gauge-num" }, svg).textContent = Math.round(v);
      }
    }
    if (mark != null) {
      const [x1, y1] = pt(deg(mark), 90), [x2, y2] = pt(deg(mark), 72);
      svgEl("line", { x1, y1, x2, y2, stroke: "#0b6b2a", "stroke-width": 3 }, svg);
    }
    svgEl("text", { x: 110, y: 146, "text-anchor": "middle", class: "w-gauge-unit" }, svg).textContent = unit;
    const needle = svgEl("g", { class: "w-needle" }, svg);
    svgEl("polygon", { points: "106,110 114,110 111,30 109,30", fill: "#c0201b" }, needle);
    svgEl("circle", { cx: 110, cy: 110, r: 9, fill: "#1b1b18" }, svg);
    svgEl("ellipse", { cx: 80, cy: 70, rx: 34, ry: 16, fill: "#fff", opacity: 0.12, transform: "rotate(-30 80 70)" }, svg);
    const read = el("span", "w-gauge-read");
    wrap.appendChild(read);
    return {
      el: wrap,
      set(v, text) {
        needle.style.transform = "rotate(" + (deg(Math.max(min, Math.min(max, v))) + 90) + "deg)";
        if (read.textContent !== text) read.textContent = text;
      }
    };
  }

  // ---------- Segmented LED bar ----------
  function ledBar({ vertical }) {
    const wrap = el("div", "w-bar" + (vertical ? " vertical" : ""));
    const fill = el("i");
    wrap.appendChild(fill);
    return {
      el: wrap,
      set(pct, colour) {
        fill.style[vertical ? "height" : "width"] = "calc((100% - 6px) * " + Math.max(0, Math.min(100, pct)) / 100 + ")";
        wrap.dataset.colour = colour || "";
      }
    };
  }

  return { el, svgEl, shake, sevenSeg, lamp, toggle, selector, knob, fader, pushButton, mushroom, guarded, gauge, ledBar };
})();
