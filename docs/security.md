# Security Notes

- Use chain-id, contract address and per-wallet nonces in registration signatures to reduce replay risk.
- Keep documents off-chain and store only hashes/commitments on-chain.
- Encrypt documents before IPFS persistence with AES-256-GCM or envelope encryption backed by HSM/KMS.
- Use short-lived JWT access tokens and wallet-signature authentication.
- Restrict smart-contract mutating functions with RBAC, `Pausable` and `ReentrancyGuard`.
- Generate production `ZKVerifier.sol` from SnarkJS verifier output before live deployment.
- Run Slither/Mythril and independent audit before any production or real personal-data use.
