import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "contracts", "src");
const artifactRoot = path.join(projectRoot, "artifacts", "contracts");
const entries = ["IMandateVault.sol", "DemoUSD.sol", "MandateVault.sol", "VaultFactory.sol"];

const sources = Object.fromEntries(
  entries.map((file) => [`contracts/src/${file}`, { content: fs.readFileSync(path.join(sourceRoot, file), "utf8") }]),
);

function findImport(importPath) {
  const candidates = [path.join(projectRoot, importPath), path.join(projectRoot, "node_modules", importPath)];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return { contents: fs.readFileSync(candidate, "utf8") };
  }
  return { error: `Import not found: ${importPath}` };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    viaIR: true,
    evmVersion: "paris",
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "metadata"] } },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));
const errors = (output.errors ?? []).filter((item) => item.severity === "error");
if (errors.length > 0) {
  for (const error of errors) process.stderr.write(`${error.formattedMessage}\n`);
  process.exit(1);
}

fs.mkdirSync(artifactRoot, { recursive: true });
let count = 0;
for (const [sourceName, contracts] of Object.entries(output.contracts ?? {})) {
  if (!sourceName.startsWith("contracts/src/")) continue;
  for (const [contractName, artifact] of Object.entries(contracts)) {
    fs.writeFileSync(
      path.join(artifactRoot, `${contractName}.json`),
      JSON.stringify({ contractName, sourceName, abi: artifact.abi, bytecode: `0x${artifact.evm.bytecode.object}` }, null, 2),
    );
    count += 1;
  }
}

process.stdout.write(`Compiled ${count} Agora contracts with solc ${solc.version()}\n`);
