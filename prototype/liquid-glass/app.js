// ScreenBuddy — "Liquid Glass" prototype (Direction A: Daylight Frost)
// Isolated front-end prototype. No electron/backend wiring — state lives in localStorage.

(function () {
  const STORAGE_KEY = "sb-liquidglass-prototype";

  const RECENT_APPS = ["Chrome", "VS Code", "Slack", "Notion", "Figma", "Terminal", "Spotify"];

  const defaultState = {
    pursuits: [
      { name: "Learn to Cook", keywords: ["cooking", "recipe", "youtube", "kitchen"] },
      { name: "Tech Job", keywords: ["code", "github", "claude", "vscode", "terminal"] },
      { name: "Fitness", keywords: ["workout", "gym", "run", "health"] },
    ],
    jarvis: { mode: "jarvis", activePursuit: "Tech Job", driftLimit: 25, countdownSeconds: 10 },
    recentAppsScanned: false,
    drifsCaught: 0,
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(defaultState);
      const parsed = JSON.parse(raw);
      return Object.assign(structuredClone(defaultState), parsed);
    } catch {
      return structuredClone(defaultState);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  let state = loadState();
  let selectedPursuitIndex = 0;
  const sessionStart = Date.now();

  // ---------- toast ----------
  const toastEl = document.getElementById("toast");
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  function flashSaved(el) {
    el.textContent = "Saved ✓";
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1800);
  }

  // ---------- nav ----------
  document.querySelectorAll(".navitem").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      if (page === "disabled") {
        toast("Not part of this prototype — only Life Pursuits + Jarvis Mode are wired up.");
        return;
      }
      document.querySelectorAll(".navitem").forEach((b) => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".page").forEach((p) => (p.hidden = p.id !== `page-${page}`));
    });
  });

  // ---------- life pursuits ----------
  const pursuitListEl = document.getElementById("pursuitList");
  const recentAppsEl = document.getElementById("recentApps");

  function renderPursuits() {
    pursuitListEl.innerHTML = "";
    state.pursuits.forEach((p, i) => {
      const card = document.createElement("div");
      card.className = "pcard" + (i === selectedPursuitIndex ? " selected" : "");
      card.dataset.index = i;

      const top = document.createElement("div");
      top.className = "pcard-top";

      const nameInput = document.createElement("input");
      nameInput.className = "pcard-name";
      nameInput.value = p.name;
      nameInput.addEventListener("change", () => {
        p.name = nameInput.value.trim() || p.name;
        saveState();
        renderJarvisPursuitOptions();
      });

      const xBtn = document.createElement("button");
      xBtn.className = "pcard-x";
      xBtn.textContent = "×";
      xBtn.title = "Remove pursuit";
      xBtn.addEventListener("click", () => {
        state.pursuits.splice(i, 1);
        if (selectedPursuitIndex >= state.pursuits.length) selectedPursuitIndex = Math.max(0, state.pursuits.length - 1);
        saveState();
        renderPursuits();
        renderJarvisPursuitOptions();
      });

      top.appendChild(nameInput);
      top.appendChild(xBtn);

      const kwrow = document.createElement("div");
      kwrow.className = "kwrow";
      p.keywords.forEach((kw, kwi) => {
        const chip = document.createElement("span");
        chip.className = "kw";
        chip.textContent = kw + " ";
        const rm = document.createElement("button");
        rm.textContent = "×";
        rm.addEventListener("click", (e) => {
          e.stopPropagation();
          p.keywords.splice(kwi, 1);
          saveState();
          renderPursuits();
        });
        chip.appendChild(rm);
        kwrow.appendChild(chip);
      });

      const addKw = document.createElement("input");
      addKw.className = "kw-add";
      addKw.placeholder = "+ keyword";
      addKw.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && addKw.value.trim()) {
          p.keywords.push(addKw.value.trim().toLowerCase());
          addKw.value = "";
          saveState();
          renderPursuits();
        }
      });
      kwrow.appendChild(addKw);

      card.appendChild(top);
      card.appendChild(kwrow);
      card.addEventListener("click", () => {
        selectedPursuitIndex = i;
        renderPursuits();
      });

      pursuitListEl.appendChild(card);
    });
  }

  document.getElementById("addPursuit").addEventListener("click", () => {
    state.pursuits.push({ name: "New pursuit", keywords: [] });
    selectedPursuitIndex = state.pursuits.length - 1;
    saveState();
    renderPursuits();
    renderJarvisPursuitOptions();
  });

  document.getElementById("savePursuits").addEventListener("click", () => {
    saveState();
    flashSaved(document.getElementById("saveMsg"));
  });

  document.getElementById("scanApps").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    const scanMsg = document.getElementById("scanMsg");
    btn.disabled = true;
    btn.textContent = "Scanning…";
    scanMsg.textContent = "";
    setTimeout(() => {
      state.recentAppsScanned = true;
      saveState();
      renderRecentApps();
      btn.disabled = false;
      btn.textContent = "🔍 Scan my PC for apps";
      scanMsg.textContent = `Found ${RECENT_APPS.length} apps.`;
      scanMsg.classList.add("show");
      setTimeout(() => scanMsg.classList.remove("show"), 2000);
    }, 900);
  });

  function renderRecentApps() {
    recentAppsEl.innerHTML = "";
    if (!state.recentAppsScanned) {
      recentAppsEl.innerHTML = '<span class="empty">Scan to see recent apps.</span>';
      return;
    }
    RECENT_APPS.forEach((app) => {
      const chip = document.createElement("button");
      chip.className = "rchip";
      chip.textContent = app;
      chip.addEventListener("click", () => {
        const target = state.pursuits[selectedPursuitIndex];
        if (!target) {
          toast("Add a pursuit first.");
          return;
        }
        const kw = app.toLowerCase();
        if (!target.keywords.includes(kw)) target.keywords.push(kw);
        saveState();
        renderPursuits();
        toast(`Added "${app}" to ${target.name}.`);
      });
      recentAppsEl.appendChild(chip);
    });
  }

  // ---------- jarvis mode ----------
  const modeSel = document.getElementById("jarvisMode");
  const pursuitSel = document.getElementById("activePursuit");
  const driftInput = document.getElementById("focusDriftLimit");
  const secondsInput = document.getElementById("wardenSeconds");

  function renderJarvisPursuitOptions() {
    const current = state.jarvis.activePursuit;
    pursuitSel.innerHTML = "";
    state.pursuits.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.name;
      opt.textContent = p.name;
      pursuitSel.appendChild(opt);
    });
    if (state.pursuits.some((p) => p.name === current)) pursuitSel.value = current;
    document.getElementById("guardGoal").textContent = `Guarding · ${pursuitSel.value || "—"}`;
  }

  modeSel.value = state.jarvis.mode;
  driftInput.value = state.jarvis.driftLimit;
  secondsInput.value = state.jarvis.countdownSeconds;
  renderJarvisPursuitOptions();

  pursuitSel.addEventListener("change", () => {
    document.getElementById("guardGoal").textContent = `Guarding · ${pursuitSel.value}`;
  });

  document.getElementById("saveJarvis").addEventListener("click", () => {
    state.jarvis = {
      mode: modeSel.value,
      activePursuit: pursuitSel.value,
      driftLimit: Number(driftInput.value) || 25,
      countdownSeconds: Number(secondsInput.value) || 10,
    };
    saveState();
    flashSaved(document.getElementById("jarvisMsg"));
  });

  // ---------- warden countdown simulation ----------
  const guardCard = document.getElementById("guardCard");
  const guardHead = document.getElementById("guardHead");
  const guardDetail = document.getElementById("guardDetail");
  const countrow = document.getElementById("countrow");
  const guardCount = document.getElementById("guardCount");
  const guardFill = document.getElementById("guardFill");
  const simulateBtn = document.getElementById("simulateDrift");
  const stayBtn = document.getElementById("guardStay");
  const hideBtn = document.getElementById("guardHide");

  let countdownTimer = null;
  let secondsLeft = 0;
  let totalSeconds = 0;

  function setGuardState(kind) {
    guardCard.classList.remove("state-idle", "state-guarding", "state-resolved");
    guardCard.classList.add(`state-${kind}`);
  }

  function stopCountdown() {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  function startDrift() {
    totalSeconds = Number(secondsInput.value) || 10;
    secondsLeft = totalSeconds;
    setGuardState("guarding");
    guardHead.textContent = "This looks like drift.";
    guardDetail.textContent = "I can hide it safely. Nothing gets closed.";
    countrow.hidden = false;
    simulateBtn.hidden = true;
    stayBtn.hidden = false;
    hideBtn.hidden = false;
    tick();
    stopCountdown();
    countdownTimer = setInterval(tick, 1000);
  }

  function tick() {
    guardCount.textContent = String(secondsLeft).padStart(2, "0");
    guardFill.style.width = `${(secondsLeft / totalSeconds) * 100}%`;
    if (secondsLeft <= 0) {
      stopCountdown();
      resolveDrift(true);
      return;
    }
    secondsLeft -= 1;
  }

  function resolveDrift(autoHidden) {
    setGuardState("resolved");
    guardHead.textContent = autoHidden ? "Minimized ✓" : "Nice — back on track.";
    guardDetail.textContent = autoHidden
      ? "The distracting window was minimized. Your work is still exactly where you left it."
      : "You've got 5 more minutes before Jarvis checks again.";
    countrow.hidden = true;
    stayBtn.hidden = true;
    hideBtn.hidden = true;
    simulateBtn.hidden = false;
    simulateBtn.textContent = "Simulate drift again";
    if (autoHidden) {
      state.drifsCaught += 1;
      saveState();
      updateStats();
    }
    setTimeout(() => {
      setGuardState("idle");
      guardHead.textContent = "Watching for drift…";
      guardDetail.textContent = "Simulate a distraction to see how the countdown works.";
    }, 2600);
  }

  simulateBtn.addEventListener("click", startDrift);
  stayBtn.addEventListener("click", () => {
    stopCountdown();
    resolveDrift(false);
  });
  hideBtn.addEventListener("click", () => {
    stopCountdown();
    resolveDrift(true);
  });

  function updateStats() {
    const mins = Math.max(1, Math.round((Date.now() - sessionStart) / 60000));
    document.getElementById("statGuarded").textContent = `${Math.floor(mins / 60)}h ${mins % 60}m`;
    document.getElementById("statDrifts").textContent = String(state.drifsCaught);
  }

  // ---------- init ----------
  renderPursuits();
  renderRecentApps();
  updateStats();
  setInterval(updateStats, 30000);
})();
