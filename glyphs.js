// The nine Klatchian glyphs used by the Ship's Log cipher. Each stands for a sudoku digit
// (1 to 9). They're simple strokes on a 40 x 40 grid, so they're easy to copy by hand.
window.GLYPH_NAMES = { 1: "Bolt", 2: "Planet", 3: "Eye", 4: "Spiral", 5: "Delta", 6: "Hourglass", 7: "Moon", 8: "Star", 9: "Trident" };

window.Glyphs = (function () {
  const spiral = (function () {
    let p = "";
    for (let t = 0; t <= 5.6 * Math.PI; t += 0.2) {
      const r = 1.1 * t;
      p += (p ? " L" : "M") + (20 + r * Math.cos(t)).toFixed(1) + " " + (20 + r * Math.sin(t)).toFixed(1);
    }
    return '<path d="' + p + '"/>';
  })();
  const SHAPES = {
    1: '<path d="M24 4 L11 22 H20 L16 36 L30 16 H21 Z"/>',
    2: '<circle cx="20" cy="20" r="8"/><ellipse cx="20" cy="20" rx="17" ry="5.5" transform="rotate(-22 20 20)"/>',
    3: '<path d="M3 20 Q20 5 37 20 Q20 35 3 20 Z"/><circle cx="20" cy="20" r="4.5" fill="currentColor" stroke="none"/>',
    4: spiral,
    5: '<path d="M20 5 L35 33 H5 Z"/><circle cx="20" cy="24" r="3" fill="currentColor" stroke="none"/>',
    6: '<path d="M9 5 H31 L9 35 H31 Z"/>',
    7: '<path d="M26 5 A15 15 0 1 0 26 35 A19 19 0 0 1 26 5 Z"/>',
    8: '<path d="M20 3 L24.5 15.5 L37 20 L24.5 24.5 L20 37 L15.5 24.5 L3 20 L15.5 15.5 Z"/>',
    9: '<path d="M20 37 V9 M9 7 V15 Q9 22 20 22 Q31 22 31 15 V7 M16 12 L20 5 L24 12"/>'
  };
  const STROKE = 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  return {
    // The glyph's strokes, for use inside an SVG.
    shape(n) { return '<g ' + STROKE + ">" + SHAPES[n] + "</g>"; },
    // A standalone SVG of the glyph.
    svg(n) { return '<svg viewBox="0 0 40 40" aria-hidden="true">' + this.shape(n) + "</svg>"; }
  };
})();
