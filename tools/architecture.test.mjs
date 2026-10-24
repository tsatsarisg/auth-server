import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const cases = [
  [
    "Identity cannot import Authentication",
    "identity/example.ts",
    "../../authentication/login/login.command.js",
    false,
  ],
  [
    "Authentication cannot import private Identity code",
    "authentication/example.ts",
    "../../identity/shared/user.service.js",
    false,
  ],
  [
    "Authentication can import the public Identity surface",
    "authentication/example.ts",
    "../../identity/index.js",
    true,
  ],
  [
    "Authentication can reference the user foreign-key schema",
    "authentication/example.ts",
    "../../identity/shared/adapters/postgres/schema/user.schema.js",
    true,
  ],
];

for (const [name, filename, source, allowed] of cases) {
  test(name, () => {
    const directory = mkdtempSync(
      `auth-server/src/${path.dirname(filename)}/boundary-test-`,
    );
    try {
      const fixture = path.join(directory, "example.ts");
      writeFileSync(fixture, `import '${source}';\n`);
      const result = spawnSync(
        process.execPath,
        ["node_modules/oxlint/bin/oxlint", fixture],
        { encoding: "utf8" },
      );
      assert.ifError(result.error);
      const output = result.stdout + result.stderr;
      assert.equal(result.status, allowed ? 0 : 1, output);
      if (!allowed) assert.match(output, /no-restricted-imports/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
