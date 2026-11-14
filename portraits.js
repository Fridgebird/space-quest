// Crew portraits in the ship's amber monitor style: a small, 8-tone dithered picture.
// Mission Control turns each photo into one of these before saving it (a few KB), and
// the tablet draws a matching silhouette for anyone without a photo.

window.Portraits = (function () {
  const W = 120, H = 150; // shown at exactly this size, so each pixel stays crisp
  const PALETTE = [[16, 10, 3], [48, 29, 6], [88, 54, 12], [130, 80, 18], [176, 111, 26], [218, 145, 44], [246, 186, 92], [255, 228, 175]];
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const cache = {};

  // Draws the source (a canvas or image, already cropped to 4:5) as a dithered portrait.
  function dither(source) {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.drawImage(source, 0, 0, W, H);
    const img = x.getImageData(0, 0, W, H), d = img.data;
    // Grey, then stretch the contrast so dim phone photos still read.
    const g = new Float32Array(W * H);
    let lo = 255, hi = 0;
    for (let i = 0; i < W * H; i++) {
      g[i] = 0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2];
      lo = Math.min(lo, g[i]); hi = Math.max(hi, g[i]);
    }
    const span = Math.max(1, hi - lo);
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
      const i = y * W + xx;
      const top = PALETTE.length - 1;
      const v = (g[i] - lo) / span * top + (BAYER[(y % 4) * 4 + (xx % 4)] / 16 - 0.5);
      const col = PALETTE[Math.max(0, Math.min(top, Math.round(v)))];
      d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return c.toDataURL("image/png");
  }

  // A photo file from the phone, cropped to the middle (a little above centre, where faces are).
  function fromFile(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const want = W / H, have = img.width / img.height;
        const sw = have > want ? img.height * want : img.width;
        const sh = have > want ? img.height : img.width / want;
        const crop = document.createElement("canvas");
        crop.width = W * 2; crop.height = H * 2;
        crop.getContext("2d").drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2 * 0.6, sw, sh, 0, 0, crop.width, crop.height);
        URL.revokeObjectURL(img.src);
        resolve(dither(crop));
      };
      img.onerror = () => reject(new Error("That picture couldn't be read."));
      img.src = URL.createObjectURL(file);
    });
  }

  // A drawn head-and-shoulders, with a different hairstyle for each crew slot,
  // or a boxy robot head for the droid.
  function silhouette(n, droid) {
    const key = droid ? "droid" : n;
    if (cache[key]) return cache[key];
    if (droid) return (cache[key] = dither(robot()));
    const c = document.createElement("canvas");
    c.width = 120; c.height = 150;
    const x = c.getContext("2d");
    const bg = x.createLinearGradient(0, 0, 0, 150);
    bg.addColorStop(0, "#777"); bg.addColorStop(1, "#333");
    x.fillStyle = bg; x.fillRect(0, 0, 120, 150);
    x.fillStyle = "#1a1a1a";
    x.beginPath(); x.ellipse(60, 160, 52, 48, 0, 0, Math.PI * 2); x.fill();   // shoulders
    x.fillStyle = "#c8c8c8";
    x.fillRect(50, 88, 20, 26);                                              // neck
    x.beginPath(); x.ellipse(60, 70, 26, 32, 0, 0, Math.PI * 2); x.fill();   // head
    x.fillStyle = "#2a2a2a";
    const hair = n % 8;
    if (hair === 0) { x.beginPath(); x.ellipse(60, 48, 28, 16, 0, Math.PI, 0); x.fill(); }
    if (hair === 1) { x.beginPath(); x.ellipse(60, 56, 31, 30, 0, Math.PI * 1.05, Math.PI * 1.95); x.fill(); x.fillRect(29, 56, 10, 52); x.fillRect(81, 56, 10, 52); }
    if (hair === 2) { for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(36 + i * 6, 44 + (i % 2) * 4, 9, 0, Math.PI * 2); x.fill(); } }
    if (hair === 3) { x.beginPath(); x.ellipse(60, 46, 26, 12, 0, Math.PI, 0); x.fill(); x.beginPath(); x.arc(60, 30, 11, 0, Math.PI * 2); x.fill(); }
    if (hair === 4) { x.fillRect(32, 34, 56, 12); x.fillRect(26, 44, 68, 6); x.beginPath(); x.ellipse(60, 94, 20, 12, 0, 0, Math.PI); x.fill(); }
    if (hair === 5) { x.beginPath(); x.moveTo(34, 52); x.lineTo(44, 30); x.lineTo(54, 46); x.lineTo(62, 26); x.lineTo(72, 44); x.lineTo(84, 30); x.lineTo(88, 54); x.fill(); }
    if (hair === 6) { x.beginPath(); x.ellipse(60, 50, 29, 20, 0, Math.PI, 0); x.fill(); x.fillStyle = "#444"; x.fillRect(32, 62, 56, 9); x.fillStyle = "#2a2a2a"; }
    if (hair === 7) { x.beginPath(); x.ellipse(60, 52, 30, 26, 0, Math.PI * 1.1, Math.PI * 1.9); x.fill(); x.beginPath(); x.arc(84, 84, 10, 0, Math.PI * 2); x.fill(); }
    x.fillRect(47, 68, 7, 4); x.fillRect(66, 68, 7, 4);                      // eyes
    x.fillRect(53, 86, 14, 3);                                               // mouth
    return (cache[key] = dither(c));
  }

  function robot() {
    const c = document.createElement("canvas");
    c.width = 120; c.height = 150;
    const x = c.getContext("2d");
    const bg = x.createLinearGradient(0, 0, 0, 150);
    bg.addColorStop(0, "#777"); bg.addColorStop(1, "#333");
    x.fillStyle = bg; x.fillRect(0, 0, 120, 150);
    x.fillStyle = "#1a1a1a";
    x.fillRect(18, 118, 84, 40);                                             // body
    x.fillStyle = "#9a9a9a";
    x.fillRect(52, 100, 16, 20);                                             // neck
    x.fillStyle = "#d0d0d0";
    x.fillRect(32, 40, 56, 62);                                              // head
    x.fillStyle = "#2a2a2a";
    x.fillRect(38, 56, 44, 14);                                              // visor
    x.fillStyle = "#f0f0f0";
    x.fillRect(44, 60, 8, 6); x.fillRect(68, 60, 8, 6);                      // eyes
    x.fillStyle = "#2a2a2a";
    for (let i = 0; i < 5; i++) x.fillRect(42 + i * 8, 84, 4, 8);            // grille
    x.fillRect(58, 22, 4, 18);                                               // antenna
    x.beginPath(); x.arc(60, 20, 6, 0, Math.PI * 2); x.fill();
    x.fillRect(26, 58, 6, 20); x.fillRect(88, 58, 6, 20);                    // ear bolts
    return c;
  }

  return { fromFile, silhouette };
})();
