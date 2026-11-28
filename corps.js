// Space Corps menu item: a terminal with the Entrance Examination and some screens that are
// just there for atmosphere. The exam answers are shared game state (so Mission Control can
// see them and a refresh keeps them). Marking only ever says PASS or FAIL.
window.SpaceCorps = (function () {
  const Q = EXAM.questions;
  const LETTERS = "ABCDEFGH";
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const button = (cls, text, onClick) => {
    const b = el("button", cls, text);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  };

  let root = null, onPass = null;
  let exam = { answers: {}, passed: false }, examKey = null;
  let page = "menu"; // "menu", "exam", or the number of a screen in SPACE_CORPS.screens
  let current = 0, verdict = "", marking = false, lockUntil = 0, lockTimer = null;

  function render() {
    if (!root) return;
    root.innerHTML = "";
    if (page === "menu") return renderMenu();
    root.appendChild(button("key back-btn", "← Space Corps menu", () => { Sfx.click(); page = "menu"; verdict = ""; render(); }));
    if (page === "exam") return renderExam();
    const sc = SPACE_CORPS.screens[page];
    const screen = el("div", "crt corps-screen");
    screen.append(el("p", "dos-cmd", "C:\\SPACECORP> TYPE " + sc.title.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8) + ".TXT"),
      el("p", "corps-title", sc.title.toUpperCase()));
    sc.lines.forEach((t) => screen.appendChild(el("p", null, t)));
    screen.appendChild(el("p", "dos-cmd caret", "C:\\SPACECORP>"));
    root.appendChild(screen);
  }

  function renderMenu() {
    const screen = el("div", "crt corps-screen");
    screen.append(el("p", "dos-cmd", "C:\\SPACECORP> MENU.EXE"), el("p", "corps-title", "SPACE CORPS CENTRAL DATABANK"),
      el("p", null, "Select an option:"));
    const list = el("div", "corps-menu");
    const items = [["Entrance Examination", "exam"]].concat(SPACE_CORPS.screens.map((sc, i) => [sc.title, i]));
    items.forEach(([title, target], i) => {
      list.appendChild(button("corps-item", (i + 1) + ". " + title.toUpperCase(), () => { Sfx.click(); page = target; verdict = ""; render(); }));
    });
    screen.append(list, el("p", "dos-cmd caret", "C:\\SPACECORP>"));
    root.appendChild(screen);
  }

  function renderExam() {
    const head = el("div", "crt corps-screen");
    head.append(el("p", "dos-cmd", "C:\\SPACECORP> EXAM.EXE"), el("p", "corps-title", "SPACE CORPS ENTRANCE EXAMINATION"));
    root.appendChild(head);
    if (exam.passed) {
      head.append(el("p", "corps-pass", "RESULT: PASS"),
        el("p", null, "Congratulations, Ensign. Welcome to the Space Corps. Your details have been added to the crew manifest."),
        el("p", "dos-cmd caret", "C:\\SPACECORP>"));
      return;
    }
    head.appendChild(el("p", null, "Candidate status: UNREGISTERED. Answer all " + Q.length + " questions, then submit your paper for marking. You may change any answer before you submit."));

    // Question numbers: lit once answered (never shows right or wrong).
    const nav = el("div", "corps-nav");
    Q.forEach((q, i) => {
      const b = button("corps-num", String(i + 1), () => { Sfx.click(); saveTyped(); current = i; render(); });
      b.classList.toggle("done", hasAnswer(i));
      b.classList.toggle("on", i === current);
      b.setAttribute("aria-label", "Question " + (i + 1) + (hasAnswer(i) ? ", answered" : ", not answered"));
      nav.appendChild(b);
    });
    root.appendChild(nav);

    const q = Q[current];
    const box = el("div", "crt corps-screen corps-q");
    box.append(el("p", "dim", "QUESTION " + (current + 1) + " OF " + Q.length), el("p", "corps-qtext", q.q));
    if (q.options) {
      const opts = el("div", "corps-opts");
      q.options.forEach((o, j) => {
        const b = button("corps-opt", LETTERS[j] + ". " + o, () => { Sfx.click(); answer(current, j); });
        b.classList.toggle("sel", Number(exam.answers["q" + current]) === j && hasAnswer(current));
        opts.appendChild(b);
      });
      box.appendChild(opts);
    } else {
      const form = el("form", "corps-typed");
      form.setAttribute("autocomplete", "off");
      const input = el("input");
      input.id = "corpsTyped";
      input.setAttribute("aria-label", "Your answer");
      input.placeholder = "Type your answer";
      input.value = exam.answers["q" + current] || "";
      input.addEventListener("change", saveTyped);
      form.addEventListener("submit", (e) => { e.preventDefault(); saveTyped(); input.blur(); });
      form.appendChild(input);
      box.appendChild(form);
    }
    root.appendChild(box);

    const actions = el("div", "corps-actions");
    actions.append(
      button("key", "← Previous", () => { Sfx.click(); saveTyped(); current = (current + Q.length - 1) % Q.length; render(); }),
      button("key", "Next →", () => { Sfx.click(); saveTyped(); current = (current + 1) % Q.length; render(); })
    );
    const submit = button("btn corps-submit", "", submitPaper);
    submit.id = "corpsSubmit";
    actions.appendChild(submit);
    root.appendChild(actions);
    const v = el("div", "corps-verdict", verdict);
    v.id = "corpsVerdict";
    v.setAttribute("role", "status");
    root.appendChild(v);
    updateSubmit();
  }

  const hasAnswer = (i) => exam.answers["q" + i] != null && exam.answers["q" + i] !== "";
  function answer(i, value) {
    exam.answers["q" + i] = value; // show it straight away; the shared state catches up
    verdict = "";
    GameState.setExamAnswer(i, value).catch(() => { verdict = "TRANSMISSION FAILED. TRY AGAIN."; render(); });
    render();
  }
  function saveTyped() {
    const input = document.getElementById("corpsTyped");
    if (!input || !Q[current] || Q[current].options) return;
    const value = input.value.trim();
    if (value === (exam.answers["q" + current] || "")) return;
    exam.answers["q" + current] = value || null;
    GameState.setExamAnswer(current, value || null).catch(() => {});
  }

  function updateSubmit() {
    const b = document.getElementById("corpsSubmit");
    if (!b) return;
    const wait = Math.ceil((lockUntil - Date.now()) / 1000);
    b.disabled = marking || wait > 0;
    b.textContent = marking ? "Marking..." : wait > 0 ? "Resubmit in " + wait + "s" : "Submit for marking";
  }

  function submitPaper() {
    saveTyped();
    if (marking || lockUntil > Date.now()) return;
    if (ExamMarking.answered(exam.answers) < Q.length) {
      verdict = "ANSWER EVERY QUESTION BEFORE SUBMITTING.";
      Sfx.buzz();
      return render();
    }
    Sfx.clunk();
    marking = true;
    verdict = "YOUR PAPER IS BEING MARKED BY THE SPACE CORPS EXAMINATION BOARD...";
    render();
    setTimeout(() => {
      marking = false;
      if (ExamMarking.passes(exam.answers)) {
        verdict = "";
        if (onPass) onPass();
      } else {
        Sfx.buzz();
        verdict = "RESULT: FAIL. The candidate has not met the required standard. Review your answers and resubmit.";
        lockUntil = Date.now() + EXAM.retrySeconds * 1000;
        clearInterval(lockTimer);
        lockTimer = setInterval(() => { updateSubmit(); if (lockUntil <= Date.now()) clearInterval(lockTimer); }, 1000);
      }
      render();
    }, 3000);
  }

  return {
    mount(container, passed) { root = container; onPass = passed; render(); },
    // Called with the shared state; redraws only when the exam has changed.
    setExam(state) {
      const next = { answers: Object.assign({}, (state && state.answers) || {}), passed: !!(state && state.passed) };
      const key = JSON.stringify(next);
      if (key === examKey) return;
      examKey = key;
      // Keep anything typed but not yet saved.
      const input = document.getElementById("corpsTyped");
      const typing = input && document.activeElement === input ? input.value : null;
      exam = next;
      render();
      const again = document.getElementById("corpsTyped");
      if (typing != null && again) { again.value = typing; again.focus(); }
    },
    // Back to the menu (used when the game is reset).
    reset() { page = "menu"; current = 0; verdict = ""; marking = false; lockUntil = 0; render(); }
  };
})();
