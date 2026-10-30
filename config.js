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
window.GAME_ID = "christmas-2026";

// 3) The admin page only opens with ?key=<this>, e.g. admin.html?key=rudolph
window.ADMIN_KEY = "rudolph";

// 4) Text shown on the start screen.
window.GAME = {
  title: "The Great Christmas Quest",
  intro: [
    "Welcome, elves! Santa needs your help.",
    "Each tile below stands for a task hidden around the house. Work out what each symbol means and complete the task as a team.",
    "When the Games Master is happy that a task is done, that tile will unlock on this screen. Tap an unlocked tile to reveal what's inside.",
    "Unlock every tile to win!"
  ],
  finale: "You did it! Every tile is unlocked. Merry Christmas! 🎉"
};

// 5) The tiles. `symbol` is shown while locked (any emoji or short text).
//    `reveal` is shown when an unlocked tile is tapped (it can contain HTML).
window.TILES = [
  { id: "tree",    symbol: "🎄", title: "The Tree",      reveal: "Clue #1: Look where the cold things live." },
  { id: "fridge",  symbol: "🧊", title: "The Fridge",    reveal: "Clue #2: Count the stockings and remember the number." },
  { id: "sock",    symbol: "🧦", title: "The Stockings", reveal: "Clue #3: Sing a carol, all 8 of you, in tune!" },
  { id: "music",   symbol: "🎶", title: "The Carol",     reveal: "Clue #4: Find the star that isn't on the tree." },
  { id: "star",    symbol: "⭐", title: "The Star",      reveal: "Clue #5: Wrap something without using tape." },
  { id: "gift",    symbol: "🎁", title: "The Wrapping",  reveal: "Clue #6: Build the tallest tower of mince pies." },
  { id: "pie",     symbol: "🥧", title: "The Pies",      reveal: "Clue #7: Find the reindeer hiding in the garden." },
  { id: "deer",    symbol: "🦌", title: "The Reindeer",  reveal: "Clue #8: Last one! Ask the Games Master for the final prize." },
  { id: "bell",    symbol: "🔔", title: "The Bell",      reveal: "The prize is under the sofa cushion! 🏆" }
];
