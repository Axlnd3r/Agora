import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const projectRoot = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "deployments", "bsc-testnet.json"), "utf8"));
const entries = ["IMandateVault.sol", "DemoUSD.sol", "MandateVault.sol", "VaultFactory.sol"];
const sources = Object.fromEntries(
  entries.map((file) => [
    `contracts/src/${file}`,
    { content: fs.readFileSync(path.join(projectRoot, "contracts", "src", file), "utf8") },
  ]),
);
const importedSources = {};

function findImport(importPath) {
  const candidates = [path.join(projectRoot, importPath), path.join(projectRoot, "node_modules", importPath)];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const content = fs.readFileSync(candidate, "utf8");
      importedSources[importPath] = { content };
      return { contents: content };
    }
  }
  return { error: `Import not found: ${importPath}` };
}

const input = {
  language: "Solidity",
  sources: { ...sources },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    viaIR: true,
    evmVersion: "paris",
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "metadata"] } },
  },
};

const initialOutput = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));
const errors = (initialOutput.errors ?? []).filter((item) => item.severity === "error");
if (errors.length) throw new Error(errors.map((item) => item.formattedMessage).join("\n"));

input.sources = { ...input.sources, ...importedSources };
const fullOutput = JSON.parse(solc.compile(JSON.stringify(input)));
const fullErrors = (fullOutput.errors ?? []).filter((item) => item.severity === "error");
if (fullErrors.length) throw new Error(fullErrors.map((item) => item.formattedMessage).join("\n"));

for (const name of ["DemoUSD", "VaultFactory", "MandateVault"]) {
  const artifact = JSON.parse(fs.readFileSync(path.join(projectRoot, "artifacts", "contracts", `${name}.json`), "utf8"));
  const compiled = fullOutput.contracts?.[artifact.sourceName]?.[name]?.evm.bytecode.object;
  if (!compiled || `0x${compiled}` !== artifact.bytecode) {
    throw new Error(`Complete Standard JSON input does not reproduce the deployed ${name} artifact.`);
  }
}

const verifications = [
  { name: "DemoUSD", tx: manifest.transactions.DemoUSD },
  { name: "VaultFactory", tx: manifest.transactions.VaultFactory },
  { name: "MandateVault" },
];
const compilerVersion = solc.version().replace(".Emscripten.clang", "");

for (const { name, tx } of verifications) {
  const artifact = JSON.parse(fs.readFileSync(path.join(projectRoot, "artifacts", "contracts", `${name}.json`), "utf8"));
  const contractUrl = `https://sourcify.dev/server/v2/contract/${manifest.chainId}/${manifest.contracts[name]}?fields=all`;
  const existingResponse = await fetch(contractUrl);
  if (existingResponse.ok) {
    const existing = await existingResponse.json();
    if (existing.match === "exact_match" || existing.creationMatch === "exact_match" || existing.runtimeMatch === "exact_match") {
      console.log(`${name} already verified: ${existing.match ?? existing.creationMatch ?? existing.runtimeMatch} (${existing.matchId})`);
      continue;
    }
  }

  const response = await fetch(`https://sourcify.dev/server/v2/verify/${manifest.chainId}/${manifest.contracts[name]}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stdJsonInput: input,
      compilerVersion,
      contractIdentifier: `${artifact.sourceName}:${name}`,
      ...(tx ? { creationTransactionHash: tx } : {}),
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.verificationId) {
    throw new Error(`${name}: Sourcify submission failed (${response.status}): ${JSON.stringify(result)}`);
  }
  console.log(`${name} submitted: ${result.verificationId}`);

  let status = null;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const statusResponse = await fetch(`https://sourcify.dev/server/v2/verify/${result.verificationId}`);
    status = await statusResponse.json();
    if (statusResponse.ok && status.isJobCompleted) break;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  console.log(`${name} status: ${JSON.stringify(status)}`);
  const match = status?.contract?.match ?? status?.contract?.creationMatch ?? status?.contract?.runtimeMatch;
  if (!status?.isJobCompleted || status?.error || match !== "exact_match") {
    throw new Error(`${name} verification did not complete successfully.`);
  }
}
