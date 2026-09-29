import fs from "node:fs";
import { Wallet } from "ethers";

const configPath = ".env.deploy.local";

if (fs.existsSync(configPath)) {
  throw new Error(`${configPath} already exists; it was left untouched.`);
}

const wallet = Wallet.createRandom();
fs.writeFileSync(
  configPath,
  `DEPLOYER_PRIVATE_KEY=${wallet.privateKey}\nBSC_TESTNET_RPC_URL=https://bsc-testnet-dataseed.bnbchain.org\n`,
  { encoding: "utf8", flag: "wx", mode: 0o600 },
);

console.log(`Test wallet address: ${wallet.address}`);
console.log(`Private key saved locally in ${configPath}; it was not printed.`);
