import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const mode = process.argv[2];
if (!["app", "debug", "tests"].includes(mode))
  throw new Error("Expected app, debug or tests");
const tests = mode === "tests";
const application = fileURLToPath(new URL("../auth-server/", import.meta.url));
const compile = fileURLToPath(new URL("./compile.mjs", import.meta.url));
const initial = spawnSync(
  process.execPath,
  [compile, tests ? "tests" : "build"],
  {
    cwd: application,
    stdio: "inherit",
  },
);
if (initial.error) throw initial.error;
if (initial.status !== 0) process.exit(initial.status ?? 1);

const args = tests
  ? [
      "--experimental-vm-modules",
      "node_modules/jest/bin/jest.js",
      "--config",
      "jest.config.json",
      "--runInBand",
    ]
  : [
      "--enable-source-maps",
      ...(mode === "debug" ? ["--inspect"] : []),
      "dist/main.js",
    ];

// Keep the application under Node's built-in watcher so signals and restarts
// reach the server directly, after a complete, successful compilation.
if (process.platform !== "win32" && typeof process.execve === "function") {
  process.chdir(application);
  process.execve(process.execPath, [process.execPath, ...args], process.env);
}

// Windows does not support execve; Node's watcher owns this child process tree.
const child = spawn(process.execPath, args, {
  cwd: application,
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => child.kill(signal));
child.once("error", (error) => {
  throw error;
});
child.once("exit", (code) => {
  process.exitCode = code ?? 1;
});
