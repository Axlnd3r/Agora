import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const artifactRoot = path.join(process.cwd(), "artifacts", "contracts");

function artifact(name) {
  return JSON.parse(fs.readFileSync(path.join(artifactRoot, `${name}.json`), "utf8"));
}

function functionNames(contractArtifact) {
  return new Set(contractArtifact.abi.filter((entry) => entry.type === "function").map((entry) => entry.name));
}

test("production contracts contain deployable bytecode", () => {
  for (const name of ["DemoUSD", "MandateVault", "VaultFactory"]) {
    const compiled = artifact(name);
    assert.match(compiled.bytecode, /^0x[0-9a-f]+$/i);
    assert.ok(compiled.bytecode.length > 200, `${name} bytecode is unexpectedly short`);
  }
});

test("vault ABI exposes the blueprint settlement and recovery surface", () => {
  const names = functionNames(artifact("MandateVault"));
  for (const required of [
    "deposit",
    "withdrawFree",
    "createMandate",
    "pauseMandate",
    "resumeMandate",
    "revokeMandate",
    "closeExpiredMandate",
    "settlePayment",
    "hashInvoice",
    "hashIntent",
    "paidInvoiceDigest",
    "paidRequestDigest",
    "isIntentConsumed",
  ]) {
    assert.ok(names.has(required), `MandateVault ABI is missing ${required}`);
  }
});

test("demo token exposes one faucet and six decimals", () => {
  const names = functionNames(artifact("DemoUSD"));
  assert.ok(names.has("faucet"));
  assert.ok(names.has("nextFaucetAt"));
  assert.ok(names.has("decimals"));
  assert.ok(!names.has("mint"));
});

test("factory only creates a vault for the caller", () => {
  const names = functionNames(artifact("VaultFactory"));
  assert.ok(names.has("createVault"));
  assert.ok(names.has("vaultOf"));
  assert.ok(names.has("token"));
  assert.ok(!names.has("createVaultFor"));
});
