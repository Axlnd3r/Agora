# Agora submission facts

## Before submission

The local paid flow works with the owner account imported into MetaMask, but the public demo is not yet deployed. After Vercel hosting resumes, configure the three separate server signer keys and internal token, verify a fresh paid run on the hosted URL, and record the walkthrough in [`VIDEO_SCRIPT_ID.md`](VIDEO_SCRIPT_ID.md). Keep the owner private key out of Vercel.

## Track fit

Agora demonstrates bounded token spending for a delegated agent on BNB Smart Chain Testnet. The paid task is a deterministic invoice arithmetic check selected by a Gemini live planner or labeled fixture planner. The live Gemini path has been verified through the browser wallet. Describe the Finance & Commerce use case through the working payment flow; the model chooses only the supported service.

## What works now

- Owner wallet creates and controls a testnet vault and mandates.
- One merchant service responds with x402 v2 HTTP 402 requirements under custom scheme `mandatepay`.
- Merchant and agent sign EIP-712 data for the deployed Agora vault; a relayer settles the payment on chain.
- The service delivers its arithmetic result after settlement, and a repeated request ID recovers the same confirmed payment.
- Deployment addresses and source verification links are in [`deployments/bsc-testnet.json`](../deployments/bsc-testnet.json). Demo signer addresses and mandate ID are in [`deployments/demo-testnet.json`](../deployments/demo-testnet.json).

## Evidence and limits

The paid flow was exercised seven times on BNB Smart Chain Testnet, including four Gemini live runs and two through the browser wallet. Transaction links and the recording sequence are in [`docs/DEMO.md`](DEMO.md). `npm run verify` compiles contracts, checks ABI/artifact surfaces, and builds the Next.js app. `npm run demo:smoke` verifies one fresh payment, same-request recovery, and changed-content rejection against the live service.

Gemini live has been verified through the local API, browser wallet, and paid testnet settlement. A full recorded walkthrough remains open. There is no arbitrary merchant support, durable worker queue, full EVM security test suite, or contract audit. The `mandatepay` scheme is implemented by Agora's own client and merchant; it is not a drop-in `exact` integration.

## Source and reuse

The project uses Next.js, React, ethers, solc-js, and OpenZeppelin Contracts. Dependency details are in [`docs/DEPENDENCIES.md`](DEPENDENCIES.md). The earlier MandatePay blueprint is the working design document; Agora is the deployed product identity. Describe any additional reused source accurately in the final submission form.
