// Shared game state. Uses Firebase Realtime Database when configured,
// otherwise localStorage (demo mode: syncs between tabs in one browser only).
//
// State shape: { cleared: { "<alertId>": true, ... }, warped: true, resetAt: <timestamp>,
//   names: { ship, cargo, science: true, crew: { "<crewId>": { name, photo } } },
//   unlocked: { log: true } }

window.GameState = (function () {
  // Firebase 8 is built for older browsers too (the tablet's Chrome can't read Firebase 10).
  const FB_VERSION = "8.10.1";
  const isDemo = !window.FIREBASE_CONFIG;
  const demoKey = "quest-game:" + window.GAME_ID;
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
      ready = loadScript(base + "/firebase-app.js")
        .then(() => loadScript(base + "/firebase-database.js"))
        .then(() => {
          firebase.initializeApp(window.FIREBASE_CONFIG);
          ref = firebase.database().ref("games/" + window.GAME_ID);
        });
    }
    return ready;
  }

  function readDemo() {
    try { return JSON.parse(localStorage.getItem(demoKey)) || {}; } catch (e) { return {}; }
  }
  function writeDemo(state) {
    localStorage.setItem(demoKey, JSON.stringify(state));
    window.dispatchEvent(new Event("quest-demo-change"));
  }

  return {
    isDemo,

    // Calls cb(state) now and on every change. Optional onConn(bool) reports connection status.
    subscribe(cb, onConn) {
      return init().then(() => {
        const normalise = (s) => Object.assign({ cleared: {}, warped: false, resetAt: null, names: null, unlocked: {} }, s);
        if (isDemo) {
          const fire = () => cb(normalise(readDemo()));
          window.addEventListener("storage", (e) => { if (e.key === demoKey) fire(); });
          window.addEventListener("quest-demo-change", fire);
          fire();
          if (onConn) onConn(true);
        } else {
          ref.on("value", (snap) => cb(normalise(snap.val())));
          if (onConn) {
            firebase.database().ref(".info/connected").on("value", (s) => onConn(!!s.val()));
          }
        }
      });
    },

    setCleared(id, cleared) {
      return init().then(() => {
        if (isDemo) {
          const s = readDemo();
          s.cleared = s.cleared || {};
          if (cleared) s.cleared[id] = true; else delete s.cleared[id];
          writeDemo(s);
        } else {
          return ref.child("cleared/" + id).set(cleared ? true : null);
        }
      });
    },

    // Unlocks (or locks again) a locked screen, e.g. "log" for the Ship's Log.
    setUnlocked(id, unlocked) {
      return init().then(() => {
        if (isDemo) {
          const s = readDemo();
          s.unlocked = s.unlocked || {};
          if (unlocked) s.unlocked[id] = true; else delete s.unlocked[id];
          writeDemo(s);
        } else {
          return ref.child("unlocked/" + id).set(unlocked ? true : null);
        }
      });
    },

    setWarped() {
      return init().then(() => {
        if (isDemo) {
          const s = readDemo();
          s.warped = true;
          writeDemo(s);
        } else {
          return ref.child("warped").set(true);
        }
      });
    },

    // Saves the ship and crew names (and photos) from Mission Control.
    setNames(names) {
      return init().then(() => {
        if (isDemo) {
          const s = readDemo();
          s.names = names;
          writeDemo(s);
        } else {
          return ref.child("names").set(names);
        }
      });
    },

    // Raises every alert again, locks the Ship's Log and sends the tablet back to the
    // log-on screen. The ship and crew names are kept.
    reset() {
      const resetAt = Date.now();
      return init().then(() => {
        if (isDemo) return writeDemo({ resetAt, names: readDemo().names || null });
        return ref.update({ cleared: null, warped: null, unlocked: null, resetAt });
      });
    }
  };
})();
