import { spawnSync } from "node:child_process";

function die(msg) {
  console.error(`[tauri-build] ${msg}`);
  process.exit(1);
}

const target = process.argv[2];
if (!target) {
  die("Usage: node scripts/tauri-build.mjs <mac|win|both>");
}

const platform = process.platform; // darwin | win32 | linux

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: "inherit" });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

function buildHere() {
  run("npm", ["-C", "frontend", "run", "tauri:build"]);
}

// Tauri packaging is OS-native:
// - macOS builds macOS bundles (.app/.dmg)
// - Windows builds Windows bundles (.exe/.msi)
// - Linux builds Linux bundles (.AppImage/.deb/.rpm depending on setup)
//
// Cross-compiling Windows from macOS is possible but non-trivial and not the default.
// This script makes it explicit and safe.

if (target === "mac") {
  if (platform !== "darwin") die("tauri:build:mac must be run on macOS (darwin).");
  buildHere();
} else if (target === "win") {
  if (platform !== "win32") die("tauri:build:win must be run on Windows (win32).");
  buildHere();
} else if (target === "both") {
  if (platform === "darwin") {
    console.log("[tauri-build] Building macOS bundle locally. For Windows, run the same command on Windows or use CI.");
    buildHere();
    console.log("[tauri-build] Windows bundle was NOT built on macOS. Run `npm run tauri:build:win` on Windows.");
  } else if (platform === "win32") {
    console.log("[tauri-build] Building Windows bundle locally. For macOS, run the same command on macOS or use CI.");
    buildHere();
    console.log("[tauri-build] macOS bundle was NOT built on Windows. Run `npm run tauri:build:mac` on macOS.");
  } else {
    die("tauri:build:both must be run on macOS or Windows (or use CI matrix builds).");
  }
} else {
  die(`Unknown target "${target}". Use mac|win|both.`);
}


