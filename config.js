// ============================================================
//  GAME SETTINGS: edit this file to set up your game
// ============================================================

// 1) Your Firebase config (see SETUP.md).
//    If this is null, the game runs in DEMO MODE: alerts only sync
//    between tabs in the same browser on the same computer.
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

// 4) About the Ship screen. Add, remove or rename any of these rows.
//    `name` is also shown in the header of the ship's computer.
window.SHIP = {
  name: "[Ship name]",
  details: [
    ["Type", "Solar class bulk carrier"],
    ["Registry", "[Registry number]"],
    ["Home port", "Earth"],
    ["Cargo", "[Cargo]"],
    ["Current position", "UNKNOWN"]
  ]
};

// 5) Crew Manifest screen. One row per player.
window.CREW = [
  { name: "[Crew member 1]", role: "[Role]" },
  { name: "[Crew member 2]", role: "[Role]" },
  { name: "[Crew member 3]", role: "[Role]" },
  { name: "[Crew member 4]", role: "[Role]" },
  { name: "[Crew member 5]", role: "[Role]" },
  { name: "[Crew member 6]", role: "[Role]" },
  { name: "[Crew member 7]", role: "[Role]" },
  { name: "[Crew member 8]", role: "[Role]" }
];

// 6) Messages screen. The first message types itself out when the crew log on.
//    Each string in `body` is a paragraph.
window.MESSAGES = [
  {
    from: "Ship's Computer",
    subject: "Emergency stasis revival",
    body: [
      "Crew, you have been awoken from stasis because this ship is lost in deep space.",
      "Prolonged stasis has caused memory loss. This is expected. Your identities can be found in the Crew Manifest.",
      "Multiple ship systems have raised alerts. All alerts must be cleared before the warp drive can be engaged.",
      "Clear every alert, engage the warp drive, and you can still reach Earth in time for Christmas."
    ]
  }
];

// 7) Text for the ending, shown after the Warp button is pressed.
window.ENDING = {
  title: "Welcome home, crew",
  text: "You made it back to Earth in time for Christmas!"
};

// 8) The alerts. Each one needs:
//    id           A unique short name. Don't change it during a game.
//    symbol       The emoji on the tile.
//    title        The alert's name.
//    description  What the crew see when they tap the active alert.
//    clearedText  What they see when they tap it after it's cleared.
//    code         OPTIONAL. If set, the crew clear this alert themselves by entering
//                 this code (capitals and spaces don't matter).
//    wiring       OPTIONAL. If set, the crew clear this alert by wiring terminals together
//                 on screen. `left` and `right` are the terminal labels, and `solution`
//                 says which right terminal each left terminal connects to.
//    checklist    OPTIONAL. If true, tapping the alert opens the warp core start-up
//                 control panel (see checklist-design.md), and the crew clear it there.
//    If none of these is set, only you can clear the alert, from Mission Control.
window.ALERTS = [
  {
    id: "checklist", symbol: "🎛️", title: "Warp Core Start-up",
    description: "The warp core is offline. Complete the Electrical, Dilithium and Plasma checklists to bring it online.",
    clearedText: "Supersonic combustion engine running. Warp core online.",
    checklist: true
  },
  {
    id: "infestation", symbol: "🐛", title: "Infestation",
    description: "Placeholder: details of the infestation task.",
    clearedText: "Infestation contained."
  },
  {
    id: "navigation", symbol: "🧭", title: "Navigation",
    description: "Navigation system offline. Enter a valid navigation code to restore it.",
    clearedText: "Navigation restored. Course plotted for Earth.",
    code: "2626"
  },
  {
    id: "life-support", symbol: "💨", title: "Life Support",
    description: "Placeholder: details of the life support task.",
    clearedText: "Life support stable."
  },
  {
    id: "reactor", symbol: "☢️", title: "Reactor",
    description: "Placeholder: details of the reactor task.",
    clearedText: "Reactor stable."
  },
  {
    id: "comms", symbol: "📡", title: "Communications",
    description: "Placeholder: details of the communications task.",
    clearedText: "Communications restored."
  },
  {
    id: "hull", symbol: "🛡️", title: "Hull Breach",
    description: "Placeholder: details of the hull breach task.",
    clearedText: "Hull sealed."
  },
  {
    id: "wiring", symbol: "⚡", title: "Warp Core Wiring",
    description: "Warp core power coupling disconnected. Restore the wiring using the ship's wiring schematic. Tap a terminal on the left, then a terminal on the right, to connect them.",
    clearedText: "Power restored to the warp core.",
    wiring: {
      left: ["A", "B", "C", "D", "E", "F"],
      right: ["1", "2", "3", "4", "5", "6"],
      solution: { A: "4", B: "1", C: "6", D: "2", E: "5", F: "3" }
    }
  }
];
