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
//    `droid: true` is the ship's own droid: it has no stasis pod.
//    `stowaway: true` is the stowaway: only listed once they pass the Space Corps exam,
//    and then in the stasis pod nobody else used. The stowaway is otherwise never
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
  { id: "droid", role: "Service Droid", rank: "None (ship's property)", staff: "N/A", droid: true },
  { id: "stowaway", role: "Ensign (enlisted in flight)", rank: "Ensign", staff: "2626-1225", stowaway: true }
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
//    biosensors    OPTIONAL. If true, the monitor has a button to the bio sensors
//                  diagnostic (see BIO_SENSORS below), and the crew clear it there.
//    If none of these is set, only you can clear the alert, from Mission Control.
//
//    Alerts can also start on standby: an unlit light that doesn't count against the warp
//    drive until it's raised. Raising it lights it red with an alarm.
//    standby       If true, the alert starts on standby.
//    standbyTitle  The words on the light while it's on standby.
//    standbyText   What the monitor shows while it's on standby.
//    raisedBy      OPTIONAL. The id of another alert: this one is raised automatically a few
//                  seconds after that one is cleared. Otherwise you raise it from Mission Control.
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
    instructions: ["Placeholder: the bio sensor array is offline and auto-recovery has failed. Run the diagnostic below."],
    clearedText: "Bio sensors online. Scanning ship...",
    biosensors: true
  },
  {
    id: "stowaway", title: "Unregistered life-form", standbyTitle: "Intruder detection", clearedTitle: "Intruder detection",
    standby: true, raisedBy: "bio-sensors",
    standbyText: ["No data: the ship-wide bio sensors are offline."],
    instructions: ["Unregistered humanoid life-form detected on crew deck.", "Possible stowaway. Alert security team."],
    clearedText: "Stowaway situation resolved."
  },
  {
    id: "infestation", title: "Infestation detected", standbyTitle: "Biohazard monitor", clearedTitle: "Biohazard monitor",
    standby: true,
    standbyText: ["No biohazards detected."],
    instructions: ["Placeholder: details of the infestation."],
    clearedText: "Infestation contained."
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
  { alert: "stowaway" },
  { id: "galley", title: "Galley food dispenser", text: ["Placeholder: food dispenser nominal. Menu: curry, curry or curry."] },
  { alert: "infestation" },
  { id: "airlocks", title: "Airlock seals", text: ["Placeholder: all airlock seals holding."] },
  { id: "hot-water", title: "Hot water", text: ["Placeholder: hot water available. Showers limited to 3 minutes."] }
];

// 10) Ship's Log menu item. It's locked with the Klatchian cipher: a sudoku in glyphs
//     (see glyphs.js for which glyph is which digit). `puzzle` is the grid row by row,
//     0 for a blank square. Each mark is a coloured square the crew must solve: `r` and
//     `c` count from 1 (row from the top, column from the left), and `answer` is its digit.
//     Once unlocked, the log shows `entries` (time, text).
window.SHIP_LOG = {
  cipher: {
    puzzle: [
      "024380000", "000006007", "058000400",
      "400010000", "000705000", "000020008",
      "001000670", "300500000", "000049210"
    ],
    marks: [
      { colour: "Blue", r: 2, c: 3, answer: 9 },
      { colour: "Pink", r: 6, c: 7, answer: 3 },
      { colour: "Green", r: 8, c: 5, answer: 7 }
    ]
  },
  entries: [
    ["2626-12-21 22:04", "Placeholder: log entry."],
    ["2626-12-22 03:17", "Placeholder: log entry."],
    ["2626-12-22 03:41", "Placeholder: log entry."],
    ["2626-12-23 09:00", "Placeholder: log entry."]
  ]
};

// 11) Bio sensors diagnostic. The core dump is a text stereogram: each word of `command`
//     floats out of it at its `spots` entry ([row, column], row 0 to 21, column 15 to 75),
//     top to bottom. The crew build the command from the `words` tiles, which also make
//     up the rest of the dump. A command word mustn't have a doubled letter (like the OO in
//     REBOOT) or be longer than 12 characters, or it won't float cleanly.
window.BIO_SENSORS = {
  command: ["RESTART", "LIFESIGNS", "/FORCE"],
  spots: [[4, 33], [11, 50], [17, 23]],
  words: ["RUN", "REBOOT", "RESTART", "PURGE", "FLUSH", "SCAN", "BIOSCAN", "LIFESIGNS", "CACHE", "SENSORS", "ARRAY",
    "KERNEL", "NODE", "DECK7", "/ALL", "/FORCE", "/QUIET", "/Y", "-RF"],
  clearedText: "Scanning ship for life-forms...",
  // Added on the diagnostic screen once the stowaway alert has been raised.
  foundText: "WARNING: 1 UNREGISTERED HUMANOID LIFE-FORM DETECTED ON CREW DECK. SEE ALERTS."
};

// 12) Space Corps menu item: a terminal with the Entrance Examination and some screens
//     that are just there for atmosphere. Each screen has a `title` and `lines` (paragraphs).
window.SPACE_CORPS = {
  screens: [
    { title: "Space Corps Directives", lines: [
      "Directive 001: All stowaways must be ejected into space prior to hyperwarp.",
      "Directive 002: Penalties for harbouring stowaways are severe.",
      "Directive 003: During space travel, the captain may make any civilian an ensign on completion of the Space Corps Entrance Examination.",
      "Directive 147: Crew must not eat the cargo. (Placeholder)",
      "Directive 595: Do not feed the kibbles. (Placeholder)"
    ] },
    { title: "Galley Menu", lines: [
      "MONDAY: Curry. TUESDAY: Curry. WEDNESDAY: Leftover curry.",
      "THURSDAY: Chef's surprise (curry). FRIDAY: Fish-shaped protein bar.",
      "Placeholder: please do not ask the food dispenser for a cup of tea. It will try."
    ] },
    { title: "Duty Rota", lines: [
      "Hull scrubbing: ALL CREW (in stasis, so: nobody).",
      "Toilet descaling: SERVICE DROID.",
      "Polishing the captain's chair: SERVICE DROID.",
      "Everything else: SERVICE DROID. (Placeholder)"
    ] },
    { title: "Holo-Film Library", lines: [
      "1. Attack of the Space Kibbles (cert. 15)",
      "2. Love Among the Asteroids",
      "3. Mining Safety Procedures, Volume 9 (4 hours)",
      "Placeholder: tapes 4 to 212 have been chewed by something."
    ] }
  ]
};

// 13) Space Corps Entrance Examination. The crew can change any answer at any time; marking
//     only ever says PASS or FAIL, never the score or which answers are wrong.
//     passMark      How many answers must be right to pass.
//     retrySeconds  How long they must wait to resubmit after a fail.
//     clears        The alert that clears on a pass (the stowaway then joins the manifest).
//     Each question has `q`, then either `options` (multiple choice) and `answer` (the
//     right option, counting from 0), or `accept` (typed answers that count as right;
//     capitals, spaces and punctuation don't matter).
//     These are placeholders, to be replaced.
window.EXAM = {
  passMark: 8,
  retrySeconds: 30,
  clears: "stowaway",
  questions: [
    { q: "What is the approximate speed of light in a vacuum?", options: ["30,000 km per second", "300,000 km per second", "3,000,000 km per second", "1,235 km per hour"], answer: 1 },
    { q: "This ship's cargo hold is three quarters full. Using the ship's maximum load, how many tonnes of cargo are on board?", options: ["12,000 t", "32,000 t", "36,000 t", "40,000 t"], answer: 2 },
    { q: "How many chambers does the human heart have?", options: ["2", "3", "4", "6"], answer: 2 },
    { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], answer: 1 },
    { q: "According to Space Corps regulations, when must stowaways be ejected into space?", options: ["On sight", "After a fair trial", "Prior to hyperwarp", "Never"], answer: 2 },
    { q: "Roughly how much would a 60 kg crew member weigh on the Moon?", options: ["The same", "About half", "About a sixth", "Nothing at all"], answer: 2 },
    { q: "A shuttle travels 600 km in 2 hours. What is its average speed?", options: ["120 km/h", "300 km/h", "600 km/h", "1,200 km/h"], answer: 1 },
    { q: "Which gas do plants take in to make their food?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"], answer: 2 },
    { q: "Placeholder poster question: what colour is the warp fuse cover?", options: ["Red", "Yellow and black", "Blue", "Green"], answer: 1 },
    { q: "What is the Space Corps motto?", accept: ["Placeholder motto"] }
  ]
};
