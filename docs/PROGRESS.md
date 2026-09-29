# Implementation progress

## Completed

- BNB Smart Chain Testnet contracts deployed. Addresses and deployment transactions are in [`deployments/bsc-testnet.json`](../deployments/bsc-testnet.json).
- `DemoUSD`, `VaultFactory`, and the deployer `MandateVault` source uploaded to Sourcify and verified with exact bytecode matches on chain 97.
- Browser wallet connection, BSC Testnet switching, and live token/vault reads are implemented.
- Wallet transactions support the mUSD faucet, personal vault creation, token approval and deposit, free withdrawal, mandate creation, and mandate pause/resume/revoke.
- Mandate views and the activity ledger read contract state and vault events; explorer links point to the confirmed transaction.
- One deterministic paid invoice-check service now completes an HTTP 402 challenge, merchant EIP-712 quote, agent EIP-712 intent, relayer settlement, and arithmetic delivery.
- A labeled fixture planner accepts invoice arithmetic tasks and rejects unsupported tasks before requesting a merchant quote. Its task text is bound into the signed request hash.
- The Gemini live planner adapter accepts structured service decisions when `AGORA_PLANNER_MODE=live` and a server-side API key are configured. The current demo machine is in live mode. CLI and browser-wallet paid runs passed with Gemini live; retry without another transfer and changed-content rejection also passed.
- The owner authorizes each run with a wallet message. Server signers are separate from the owner wallet and stored only in ignored local environment settings or server deployment settings.
- On-chain request and invoice deduplication protect retries. A paid request can recover the same result from the `PaymentSettled` event; changed content with the same request ID is rejected.
- The demo vault was funded with 100 test mUSD and has a 10 mUSD mandate. Its current balance falls with each paid run. Public signer addresses and transactions are in `deployments/demo-testnet.json`.
- Vercel Production is live at [agora-nine-peach.vercel.app](https://agora-nine-peach.vercel.app), connected to GitHub `main`, with server variables stored as hidden secrets. The deployed health endpoint and Gemini live configuration are ready.

## Verification

| Check | Result |
| --- | --- |
| `npm run verify` | Pass. Four artifact checks passed; Next.js compiled, TypeScript passed, and all app routes were generated. |
| Live paid-service smoke | Pass. Seven 0.02 mUSD settlements confirmed on BSC Testnet, including two browser-wallet Gemini live runs. The latest CLI run verified HTTP 402, result delivery, same-request recovery without another transfer, and changed-content rejection. Proof links are in `docs/DEMO.md`. |
| Vercel production | Pass. Production build is Ready; homepage and paid-task route return HTTP 200, `/api/health` is `ok`, and `/api/demo/config` reports `ready: true` with Gemini live. A browser-wallet payment from the hosted URL is still pending. |
| Sourcify verification | Pass. `DemoUSD`, `VaultFactory`, and `MandateVault` report `exact_match` for BNB Smart Chain Testnet (chain 97). Public records and explorer links are saved in the deployment manifest. |
| `npm audit` via dependency install | Pass at this checkpoint: 0 vulnerabilities reported after unused fixture validation dependency removal. |

## Remaining

- Run one browser-wallet paid invoice check from the hosted production URL, then record the full walkthrough. The owner account must be available in MetaMask on the recording device.
- The serverless demo supports one merchant/service and has no durable database, queue, or general payment indexer. Concurrent relayer attempts and RPC outages need stronger recovery before broader use.
- Contracts are not audited. Foundry unit, fuzz, invariant, and Anvil integration tests remain future work.
- Sourcify returned downstream Etherscan verification jobs; BscScan's verification status was not independently checked from this environment.
