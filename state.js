// Shared unlock state. Uses Firebase Realtime Database when configured,
// otherwise localStorage (demo mode: syncs between tabs in one browser only).
//
// State shape: { "<tileId>": true, ... } for each unlocked tile.

window.GameState = (function () {
  const FB_VERSION = "10.12.2";
  const isDemo = !window.FIREBASE_CONFIG;
  const demoKey = "xmas-game:" + window.GAME_ID;
  let ref = null;
  let ready = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Could not load " + src));
      document.head.appendChild(s);
    });
  }

  function init() {
    if (ready) return ready;
    if (isDemo) {
      ready = Promise.resolve();
    } else {
      const base = "https://www.gstatic.com/firebasejs/" + FB_VERSION;
      ready = loadScript(base + "/firebase-app-compat.js")
        .then(() => loadScript(base + "/firebase-database-compat.js"))
        .then(() => {
          firebase.initializeApp(window.FIREBASE_CONFIG);
          ref = firebase.database().ref("games/" + window.GAME_ID + "/unlocked");
        });
    }
    return ready;
  }

  function readDemo() {
    try { return JSON.parse(localStorage.getItem(demoKey)) || {}; } catch (e) { return {}; }
  }
  function writeDemo(state) {
    localStorage.setItem(demoKey, JSON.stringify(state));
    window.dispatchEvent(new Event("xmas-demo-change"));
  }

  return {
    isDemo,

    // Calls cb(state) now and on every change. Optional onConn(bool) reports connection status.
    subscribe(cb, onConn) {
      return init().then(() => {
        if (isDemo) {
          const fire = () => cb(readDemo());
          window.addEventListener("storage", (e) => { if (e.key === demoKey) fire(); });
          window.addEventListener("xmas-demo-change", fire);
          fire();
          if (onConn) onConn(true);
        } else {
          ref.on("value", (snap) => cb(snap.val() || {}));
          if (onConn) {
            firebase.database().ref(".info/connected").on("value", (s) => onConn(!!s.val()));
          }
        }
      });
    },

    setUnlocked(id, unlocked) {
      return init().then(() => {
        if (isDemo) {
          const s = readDemo();
          if (unlocked) s[id] = true; else delete s[id];
          writeDemo(s);
        } else {
          return ref.child(id).set(unlocked ? true : null);
        }
      });
    },

    reset() {
      return init().then(() => (isDemo ? writeDemo({}) : ref.remove()));
    }
  };
})();
