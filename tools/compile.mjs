import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const kind = process.argv[2];
if (kind !== "build" && kind !== "tests")
  throw new Error("Expected build or tests");
const application = fileURLToPath(new URL("../auth-server/", import.meta.url));
const output = new URL(
  `../auth-server/${kind === "build" ? "dist" : "dist-test"}/`,
  import.meta.url,
);
rmSync(output, { recursive: true, force: true });
const compiler = fileURLToPath(
  new URL("../node_modules/typescript/bin/tsc", import.meta.url),
);
const result = spawnSync(
  process.execPath,
  [
    compiler,
    "-p",
    kind === "build" ? "tsconfig.build.json" : "tsconfig.test.json",
  ],
  {
    cwd: application,
    stdio: "inherit",
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
