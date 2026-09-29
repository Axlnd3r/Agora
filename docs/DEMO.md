# Agora demo runbook

This runbook covers the single paid `invoice-check:v1` service on BNB Smart Chain Testnet. Planner mode is shown in the run UI: `fixture` is deterministic, while `live` calls Gemini before a new payment.

For a spoken walkthrough, use [`VIDEO_SCRIPT_ID.md`](VIDEO_SCRIPT_ID.md).
Gemini setup is in [`GEMINI_PLANNER.md`](GEMINI_PLANNER.md). Live paid runs have been verified through both the CLI and browser wallet; show the mode actually displayed by the recording browser.

## Before recording

1. Keep `.env.deploy.local` and `.env.local` on this computer. Both are ignored by Git. Never enter a private key in chat, a commit, or a screenshot. The owner key in `.env.deploy.local` must stay out of server settings; only the separate demo agent, merchant, and relayer keys from `.env.local` belong in server settings when deployment resumes.
2. In the MetaMask browser extension, open the account selector, choose **Add wallet → Import an account**, and use the `DEPLOYER_PRIVATE_KEY` value from `.env.deploy.local` on this device. The public address must be `0xDcF6FA998Ba319eDf790e243E100C2f48210282E`. Keep the key out of chat, screenshots, and recordings.
3. Select BNB Smart Chain Testnet, chain ID `97`. The app uses `https://bnb-testnet.api.onfinality.io/public` for historical event reads and `https://bsc-testnet-rpc.publicnode.com` for regular chain calls; the explorer is `https://testnet.bscscan.com`.
4. Run `npm run demo:chain` to inspect owner tBNB, relayer tBNB, wallet mUSD, and vault mUSD. The vault and demo mandate were seeded by `npm run demo:seed`; the public details are in [`deployments/demo-testnet.json`](../deployments/demo-testnet.json).
5. Run `npm run verify` and `npm run dev`, or open the deployed Vercel URL after it has the four `AGORA_*` server variables, `SERVER_RPC_URL`, and the Gemini planner settings configured. Never upload `DEPLOYER_PRIVATE_KEY` to Vercel.

## Screen flow

1. Show the landing page and explain that mUSD is a test token with no monetary value.
2. Connect the owner wallet at `/app`. Show the vault balance and the reserved amount.
3. Open `/app/mandates`, select the active mandate, and show its agent, merchant, service ID, per-payment cap, and pause/revoke controls. The seeded mandate ID is in the demo manifest.
4. Select **Run invoice check**. Keep the default synthetic invoice: 2 × 100000 IDR minor units, declared total 200000. Approve the owner authorization message. The server receives a signed merchant quote through HTTP 402, creates an agent intent, settles 20000 atomic mUSD (`0.02 mUSD`) via the relayer, and returns the arithmetic result.
5. Open the BscScan transaction link. The `PaymentSettled` event and token transfer are the payment evidence. Refresh Activity to see the vault event.
6. Show a rejection by pausing the mandate and trying a **new** invoice-check request. Resume before continuing. A failed request must not be presented as an on-chain reverted transaction unless a transaction was actually broadcast.

Recorded testnet settlements:

- [First paid check](https://testnet.bscscan.com/tx/0x4fd61a879744b21f43403ccef90666d717ee9e57c3beeb9c52cc27f41a0ae532)
- [Second paid check](https://testnet.bscscan.com/tx/0x5891f3a62a0787e6bc078430f3b896e0349c2d571de9c82f5a1fcbc7c9244ec2)
- [Fixture planner paid check](https://testnet.bscscan.com/tx/0x53457be304fab2ad6e09a5018d5214faa08974b8ffa0465c56d9eaa6126409e4)
- [First Gemini live paid check](https://testnet.bscscan.com/tx/0x60c37b3726c3ddb8892e13d41b46592fa13fb06f0eaf84d6c9b368b14929884c)
- [Gemini live smoke run](https://testnet.bscscan.com/tx/0x8de4526cbadb0617c35a8a12250af1b77a0d25071ad8ee45124bd875b81fd18b)
- [First browser wallet Gemini live run](https://testnet.bscscan.com/tx/0xca0b298f540413f140b348b85d11806d6f8452f9f5811f1ec7e88e91c7026a81)
- [Second browser wallet Gemini live run](https://testnet.bscscan.com/tx/0x722b3afecb99e22888a7fe894711be27099b87d46befa546e31cc2372296f03e)

The balance changes as new runs are made. Read the current values on screen instead of narrating a fixed post-payment balance.

## Recovery evidence

`npm run demo:smoke` performs one real paid check, retries its request ID, and changes the content while reusing that ID. It verifies that the retry returns the same transaction and merchant balance, while changed content is rejected. Each invocation makes one new testnet payment. `npm run demo:retry -- <confirmed-tx-hash>` verifies recovery for an existing paid request without paying again.

If an RPC call fails after a transaction is broadcast, retry with the same request ID and unchanged invoice. The UI preserves the ID and invoice across page refreshes in the current browser tab. Select **New request** only when you intend to pay for another run. The contract's paid-request mapping and `PaymentSettled` event are used to recover the result.

## Honest scope for narration

- x402 v2 HTTP transport is used with the project's custom `mandatepay` scheme and `upfront` flow. Generic `exact` merchants or public facilitators do not automatically support it.
- The planner selects one service from supported task text. The agent signer follows a fixed policy; Gemini never sets payment terms. The CLI and browser-wallet live paths are verified.
- The invoice checker validates arithmetic and schema for synthetic IDR data. It does not verify a real invoice, tax compliance, or a business identity.
- Serverless functions recompute deterministic delivery from the chain proof. There is no separate durable queue or database, and concurrent relayer attempts need further hardening.
- Contracts are not audited; existing contract tests cover ABI and artifact surfaces, while EVM fuzz and invariant tests remain open.
