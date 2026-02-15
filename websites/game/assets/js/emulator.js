// assets/js/emulator.js

(() => {
  if (window.__EMULATOR_INIT__) return;
  window.__EMULATOR_INIT__ = true;

  const romInput = document.getElementById("romFile");
  const startBtn = document.getElementById("startGame");
  const gameDiv = document.getElementById("game");
  const padStatus = document.getElementById("padStatus");

  if (!romInput || !startBtn || !gameDiv) return;

  let romFile = null;
  let romUrl = null;

  /* ---------------------------
     Gamepad detection
  --------------------------- */
  function updatePadStatus() {
    const pads = navigator.getGamepads?.() || [];
    const pad = [...pads].find(p => p && p.connected);

    padStatus.textContent = pad
      ? `Controller connected: ${pad.id}`
      : "Controller: not detected (keyboard works)";
  }

  window.addEventListener("gamepadconnected", updatePadStatus);
  window.addEventListener("gamepaddisconnected", updatePadStatus);
  window.addEventListener("click", updatePadStatus);
  window.addEventListener("keydown", updatePadStatus);
  setInterval(updatePadStatus, 1000);

  /* ---------------------------
     Core detection (from demo)
  --------------------------- */
  function detectCore(filename) {
    const ext = filename.split(".").pop().toLowerCase();

    if (["smc", "sfc", "fig", "swc"].includes(ext)) return "snes";
    if (["gb"].includes(ext)) return "gb";
    if (["gbc"].includes(ext)) return "gbc";
    if (["gba"].includes(ext)) return "gba";
    if (["z64", "n64"].includes(ext)) return "n64";
    if (["zip"].includes(ext)) return "auto";

    return null;
  }

  romInput.addEventListener("change", () => {
    romFile = romInput.files?.[0] || null;
    startBtn.disabled = !romFile;
  });

  /* ---------------------------
     Start emulator
  --------------------------- */
  startBtn.addEventListener("click", () => {
    if (!romFile) return;

    const core = detectCore(romFile.name);
    if (!core) {
      alert("Unsupported ROM type");
      return;
    }

    gameDiv.innerHTML = "";
    if (romUrl) URL.revokeObjectURL(romUrl);
    romUrl = URL.createObjectURL(romFile);
window.EJS_player = "#game";
window.EJS_gameName = romFile.name.replace(/\.[^/.]+$/, "");
window.EJS_gameUrl = romUrl;
window.EJS_core = core;

// REQUIRED when using CDN
window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";

window.EJS_gamepad = true;
window.EJS_startOnLoaded = true;
window.EJS_fullscreenOnLoaded = false;

    // window.EJS_disableDatabases = false;

    console.log("Starting emulator:", {
      game: window.EJS_gameName,
      core
    });
  });

  updatePadStatus();
})();
