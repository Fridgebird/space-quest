// ============================================================
//  GAME SETTINGS: edit this file to set up your game
// ============================================================

// 1) Paste your Firebase config here (see SETUP.md).
//    While this is null, the game runs in DEMO MODE: unlocks only work
//    between tabs in the same browser on the same computer. That's handy for testing.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBwn0jBFqtQF--tG1056Rk7rr46CQp2UCc",
  authDomain: "space-quest-2626.firebaseapp.com",
  databaseURL: "https://space-quest-2626-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "space-quest-2626",
  storageBucket: "space-quest-2626.firebasestorage.app",
  messagingSenderId: "196760443741",
  appId: "1:196760443741:web:673bcc5035a7c2acfde6b4",
  measurementId: "G-S09XHQ4KTS"
};

// 2) A name for this game's data. Change it to start a completely fresh game.
window.GAME_ID = "space-quest-2626";

// 3) The admin page only opens with ?key=<this>, e.g. admin.html?key=rudolph
window.ADMIN_KEY = "rudolph";

// 4) Text shown on the start screen.
window.GAME = {
  title: "Space Quest 2626",
  intro: [
    "Welcome aboard, crew. Your mission needs all of you working as one team.",
    "Each tile stands for a task to complete around the house. Work out what each symbol means and complete the task together.",
    "When Mission Control confirms a task is done, its tile will unlock on this screen. Tap an unlocked tile to receive its transmission.",
    "Unlock every tile to complete the mission!"
  ],
  finale: "Mission complete! Every system is online. Well done, crew! 🚀"
};

// 5) The tiles. `symbol` is shown while locked (any emoji or short text).
//    `reveal` is shown when an unlocked tile is tapped (it can contain HTML).
window.TILES = [
  { id: "rocket",    symbol: "🚀", title: "Rocket",    reveal: "Placeholder transmission 1" },
  { id: "moon",      symbol: "🌙", title: "Moon",      reveal: "Placeholder transmission 2" },
  { id: "satellite", symbol: "🛰️", title: "Satellite", reveal: "Placeholder transmission 3" },
  { id: "alien",     symbol: "👽", title: "Alien",     reveal: "Placeholder transmission 4" },
  { id: "planet",    symbol: "🪐", title: "Planet",    reveal: "Placeholder transmission 5" },
  { id: "comet",     symbol: "☄️", title: "Comet",     reveal: "Placeholder transmission 6" },
  { id: "telescope", symbol: "🔭", title: "Telescope", reveal: "Placeholder transmission 7" },
  { id: "ufo",       symbol: "🛸", title: "UFO",       reveal: "Placeholder transmission 8" },
  { id: "earth",     symbol: "🌍", title: "Earth",     reveal: "Placeholder transmission 9" }
];
