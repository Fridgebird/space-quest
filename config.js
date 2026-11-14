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

// 8) The alerts. Each one is a red warning light on the Alerts screen (green once
//    cleared), with a rubber button beside it that shows `instructions` on the monitor.
//    id            A unique short name. Don't change it during a game.
//    title         The words on the warning light.
//    clearedTitle  OPTIONAL. The words on the light once it's cleared and green.
//    instructions  What the monitor shows while the alert is active. Each string is a paragraph.
//    clearedText   What the monitor shows once it's cleared.
//    code          OPTIONAL. If set, the crew clear this alert themselves by entering
//                  this code under the monitor (capitals and spaces don't matter).
//    wiring        OPTIONAL. If set, the crew clear this alert by wiring terminals together
//                  under the monitor. `left` and `right` are the terminal labels, and
//                  `solution` says which right terminal each left terminal connects to.
//    checklist     OPTIONAL. If true, the monitor has a button to the warp core start-up
//                  controls (see checklist-design.md), and the crew clear it there.
//    If none of these is set, only you can clear the alert, from Mission Control.
window.ALERTS = [
  {
    id: "warp-core", title: "Warp core offline", clearedTitle: "Warp core online",
    instructions: [
      "Placeholder: the warp core is offline. Complete the Electrical, Dilithium and Plasma checklists to bring it online.",
      "Open the warp core controls below."
    ],
    clearedText: "Supersonic combustion engine running. Warp core online.",
    checklist: true
  },
  {
    id: "control-rods", title: "Warp drive control rods depleted", clearedTitle: "Warp drive control rods",
    instructions: ["Placeholder: instructions for transporting the control rods."],
    clearedText: "Control rods installed. Warp drive fuelled."
  },
  {
    id: "power-coupling", title: "Main power coupling",
    instructions: [
      "Placeholder: the main power coupling is disconnected. Restore the wiring using the ship's wiring diagram.",
      "Tap a terminal on the left, then a terminal on the right, to connect them."
    ],
    clearedText: "Main power coupling restored.",
    wiring: {
      left: ["A", "B", "C", "D", "E", "F"],
      right: ["1", "2", "3", "4", "5", "6"],
      solution: { A: "4", B: "1", C: "6", D: "2", E: "5", F: "3" }
    }
  },
  {
    id: "navicom", title: "Navicom destination not set", clearedTitle: "Navicom destination set",
    instructions: ["Placeholder: plot a course using the astronavigation charts, then enter the course code below."],
    clearedText: "Destination set: Earth. Course plotted.",
    code: "2626"
  },
  {
    id: "bio-sensors", title: "Ship-wide bio sensors offline", clearedTitle: "Ship-wide bio sensors",
    instructions: ["Placeholder: instructions for restoring the bio sensors."],
    clearedText: "Bio sensors online."
  },
  {
    id: "logging", title: "Log & Monitoring error", clearedTitle: "Log & Monitoring",
    instructions: ["Placeholder: instructions for the log & monitoring system."],
    clearedText: "Log & monitoring restored."
  }
];
// The title of the warp core start-up controls screen.
window.CONTROLS_TITLE = "Warp Core Start-up";

// 9) The status board on the Alerts screen. Lights are shown in this order: an
//    `{ alert: "<id>" }` entry is that alert's light; every other entry is a ship system
//    that's always green (nominal), just for show, with `text` paragraphs for the monitor.
window.SYSTEMS = [
  { alert: "warp-core" },
  { id: "life-support", title: "Life support", text: ["Oxygen 20.9%. CO2 0.04%. Cabin pressure 101 kPa.", "Placeholder: all within limits."] },
  { id: "hull", title: "Hull integrity", text: ["Hull integrity 98.2%.", "Placeholder: minor dents on the cargo bay doors. Still there from last time."] },
  { alert: "control-rods" },
  { id: "gravity", title: "Artificial gravity", text: ["Gravity 1.00 g.", "Placeholder: nominal."] },
  { alert: "power-coupling" },
  { id: "dampers", title: "Inertial dampers", text: ["Placeholder: inertial dampers nominal."] },
  { id: "stasis", title: "Stasis bay", text: ["Placeholder: stasis pods powered down. Revival complete."] },
  { alert: "navicom" },
  { id: "reclamation", title: "Waste reclamation", text: ["Placeholder: waste reclamation nominal. Do not ask what's in the soup."] },
  { alert: "bio-sensors" },
  { id: "galley", title: "Galley food dispenser", text: ["Placeholder: food dispenser nominal. Menu: curry, curry or curry."] },
  { alert: "logging" },
  { id: "hot-water", title: "Hot water", text: ["Placeholder: hot water available. Showers limited to 3 minutes."] }
];
