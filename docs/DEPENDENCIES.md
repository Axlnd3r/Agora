# Dependency baseline

Verified on 22 September 2026 with Node.js 24.19.0 and npm 11.17.0.

| Area | Package | Pinned or resolved version | Purpose |
| --- | --- | --- | --- |
| Web | Next.js | 16.3.5 | App Router, route handlers, production build |
| UI | React | 19.3.0 | Client interaction and accessible state handling |
| Validation | Zod | 4.1.11 | Fixture API input validation |
| Contracts | Solidity compiler | 0.8.30 | Reproducible local compilation through solc-js |
| Contracts | OpenZeppelin Contracts | 5.4.0 | ERC-20, SafeERC20, EIP-712, ECDSA, reentrancy guard |

Foundry is not installed in the current Windows environment. `npm run contracts:build` compiles the current contract source and `npm run contracts:check` validates required ABI surfaces. This does not replace the Foundry unit, fuzz, invariant, or Anvil integration gates required before testnet deployment.
