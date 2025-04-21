# BLS Preconfirmations for Rollups

## TL;DR (key findings)

- Based rollups inherit L1 liveness because the next L1 proposer can permissionlessly include the next rollup block.
- Preconfirmations give UX comparable to Web2 (< 100 ms) by letting validators issue slashable promises before the L1 block is final.
- A clear taxonomy of guarantees & slashing conditions is emerging, ranging from "inclusion" to "post‑state execution".
- "Timely‑fair exchange" research shows users can pay proposers for speed while keeping provable recourse.
- Shared sequencers (Espresso, Succinct, Radius, etc.) reduce fragmentation and centralisation across L2s.
- Espresso's BFT HotShot layer already exports BFT preconfirmations + slashable commitments.
- EigenLayer lets us bootstrap security by "renting" re‑staked ETH to new AVSs.
- The OP‑Stack and other modular blueprints are increasingly plug‑and‑play for such L2 building blocks.
- VC & ecosystem attention (e.g. a16z's $28 M for Espresso) signals real demand for a marketplace of shared sequencing slots + preconfs.

## Architecture Overview

### 1. Multi‑Validator BLS Preconf Committee
Validators register a BLS public key; a HotStuff‑like leader aggregates their individual signatures into one 96‑byte aggregate. Gas usage is constant no matter how many signers.

### 2. Dynamic, Risk‑Weighted Stake
Collateral = α × txValue where α is governance‑tunable. Validators can bond native ETH or EigenLayer restaked LSTs to minimise capital cost.

### 3. Timely‑Fair‑Exchange Fee Market
Users attach a "speed tip" + execution bounds (gasPriceLimit, desired post‑state root). Validators either:

- Accept → sign the typed‑data commitment.
- Reject → user tries the next validator.

If the promise is broken after deadlineBlock, anyone can slash via a single proof.

### 4. MEV‑Aware Commit‑Reveal
To prevent frontrunning, the commitment only reveals the keccak(txHash‖blindedSalt) during signing; the full tx + salt are revealed in L1 block payload.

### 5. Interop With Shared Sequencers
An ISharedSequencerAdapter interface lets Espresso or Radius forward already‑aggregated signatures; rollups opt‑in per‑tx.

### 6. Governance & Upgradability
Diamond (EIP‑2535) architecture splits concerns:

- FacetStake – stake/unstake
- FacetPreconf – register, verify, slash
- FacetParams – owner‑governed risk parameters

## Next steps

- Front‑end (Next.js + wagmi):
  - real‑time BLS aggregation in WebAssembly (e.g. noble‑bls).
  - transaction wizard: select speed vs tip size.
- Subgraph to index pending vs slashed commitments for explorers.
- Cross‑Domain: implement IBC‑style packet that carries the preconf id so any rollup can prove inclusion in other L2s.
- Economic simulations: use CadCAD to tune α risk multiplier vs validator ROI.
- Formal verification: Scribble invariants (finalize ⇒ !slashable).

## Summary
This blueprint re‑imagines preconfirmation as a first‑class modular service rather than a bolt‑on. By combining BLS aggregation, restaked collateral and shared‑sequencing hooks we get sub‑second UX and credibly neutral security—all while staying fully open‑source and upgradeable. Feel free to fork, audit, and extend!