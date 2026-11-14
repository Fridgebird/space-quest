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

// 4) The ship. Its name and cargo are filled in from Mission Control on the day; these
//    are only shown until then. The header and log-on screen show `shortPrefix` + name
//    (e.g. "JMC Gravy Boat"); About the Ship shows `owner` + `prefix` + name in full.
//    Each `details` row is a line on the About the Ship monitor.
window.SHIP = {
  name: "[Ship name]",
  cargo: "[Cargo]",
  owner: "Jupiter Mining Corporation",
  prefix: "SS",
  shortPrefix: "JMC",
  type: "Solar class bulk carrier",
  details: [
    ["Builder", "Lunar Drydock Co., yard no. 2626"],
    ["Registry", "SCB-2626-0451"],
    ["Home port", "Earth"]
  ],
  plateNote: "Max load 48,000 t · DO NOT EXCEED (again)"
};

// 5) Crew Manifest screen: one entry per post. Names and photos are added from
//    Mission Control on the day. `rank` is shown on the personnel file.
//    `optional: true` posts only appear when you tick "Playing today" in Mission Control.
//    `droid: true` is the ship's own droid: it has no stasis pod. The stowaway is never
//    listed, and stasis pod 5 is skipped, as a clue that someone else used it.
//    Don't change an `id` once names have been entered.
window.CREW = [
  { id: "captain", role: "Captain", rank: "Captain", staff: "2626-0001" },
  { id: "first", role: "First Officer", rank: "Commander", staff: "2626-0117" },
  { id: "engineer", role: "Chief Engineer", rank: "Lieutenant Commander", staff: "2626-0451" },
  { id: "helm", role: "Navigator/Helm", rank: "Lieutenant", staff: "2626-0880" },
  { id: "medical", role: "Medical Officer", rank: "Lieutenant Commander", staff: "2626-1203" },
  { id: "security", role: "Chief of Security", rank: "Lieutenant", staff: "2626-0640" },
  { id: "comms", role: "Communications Officer", rank: "Lieutenant (junior grade)", staff: "2626-0042" },
  { id: "science", role: "Science Officer", rank: "Ensign", staff: "2626-0973", optional: true },
  { id: "droid", role: "Service Droid", rank: "None (ship's property)", staff: "N/A", droid: true }
];
// The stasis pod nobody on the manifest uses.
window.EMPTY_POD = 5;

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
