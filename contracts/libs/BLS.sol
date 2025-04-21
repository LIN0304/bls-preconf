// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Simple helper for the BLS12-381 curve precompiles proposed in EIP-2537.
/// Mainnet support expected ~Prague fork; on testnets use the Lodestar fork
library BLS {
    /* Precompile addresses per draft EIP-2537 */
    address internal constant PRECOMPILE_SINGLE = 0x13;
    address internal constant PRECOMPILE_MULTI  = 0x14;

    function verifySingle(
        bytes memory sig,   // 96-byte G1
        bytes memory pk,    // 48-byte G2
        bytes32 msgHash
    ) internal view returns (bool ok) {
        (ok, ) = PRECOMPILE_SINGLE.staticcall(abi.encode(sig, pk, msgHash));
    }

    function verifyAggregate(
        bytes memory aggSig,
        bytes[] memory pks,
        bytes32[] memory msgs
    ) internal view returns (bool ok) {
        (ok, ) = PRECOMPILE_MULTI.staticcall(abi.encode(aggSig, pks, msgs));
    }
}