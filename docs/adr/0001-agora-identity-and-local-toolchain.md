# ADR 0001: Agora identity and local contract toolchain

Status: accepted for the current local-ready checkpoint.

## Decision

The public product name and EIP-712 domain name are `Agora`. The original blueprint uses the working name MandatePay, but the product owner explicitly renamed the project before implementation.

The repository compiles Solidity with solc-js 0.8.30 and OpenZeppelin Contracts 5.4.0 because Foundry is unavailable in the current environment. The compiler uses optimizer runs 200, via IR, and the Paris EVM target.

## Consequences

- Frontend copy, token name, contracts, and EIP-712 domain use one product identity.
- Generated artifacts can support frontend ABI work immediately.
- Runtime contract correctness is not yet proven. Foundry unit, fuzz, invariant, and Anvil tests remain a release gate.
- No deployment manifest exists until a real local or chain 97 deployment produces addresses and receipts.
