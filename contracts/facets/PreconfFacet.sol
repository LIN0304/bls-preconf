// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "../libs/BLS.sol";
import "./StakeFacet.sol";

contract PreconfFacet is StakeFacet {
    struct Commitment {
        bytes32 txHash;      // opaque until reveal
        uint64 deadline;     // L1 block height
        uint128 amount;      // stake at risk
        bool    finished;
    }

    mapping(bytes32 => Commitment) public commitments;
    event Preconfirmed(bytes32 id, address leader, uint64 deadline);
    event Finalized   (bytes32 id);
    event Slashed     (bytes32 id, address offender, address slasher);

    /* -------- REGISTER (called by seq leader after BLS aggregation) ------- */
    function registerAggPreconf(
        bytes32[] calldata msgHashes,
        bytes[]  calldata pks,
        bytes    calldata aggSignature,
        uint64   deadline
    ) external {
        require(msgHashes.length == pks.length, "!len");
        require(deadline > block.number && deadline - block.number <= 32, "bad dl");

        // 1. verify aggregate sig
        require(
            BLS.verifyAggregate(aggSignature, pks, msgHashes),
            "BLS-fail"
        );

        // 2. store each commitment
        for (uint i; i < msgHashes.length; ++i) {
            bytes32 id = keccak256(abi.encodePacked(msgHashes[i], pks[i], deadline));
            commitments[id] = Commitment({
                txHash: msgHashes[i],
                deadline: deadline,
                amount: uint128(stakeOf[msg.sender]),  // equal split for demo
                finished: false
            });
            emit Preconfirmed(id, msg.sender, deadline);
        }
        _bumpPending(msg.sender);
    }

    /* -------- REVEAL / FINALISE (called by any rollup prover) ------------- */
    function finalize(bytes32 id, bytes32 fullTxHash) external {
        Commitment storage c = commitments[id];
        require(!c.finished,"done");
        require(block.number <= c.deadline, "late");
        require(c.txHash == keccak256(abi.encodePacked(fullTxHash)), "mismatch");
        c.finished = true;
        emit Finalized(id);
    }

    /* -------- SLASH ------------------------------------------------------- */
    function slash(bytes32 id) external {
        Commitment storage c = commitments[id];
        require(!c.finished && block.number > c.deadline, "not-slashable");

        // burn half, pay half to slasher
        uint256 burnAmt = c.amount / 2;
        stakeOf[msg.sender] -= c.amount;
        (bool ok,) = msg.sender.call{value: c.amount - burnAmt}("");
        require(ok, "pay");

        emit Slashed(id, msg.sender, tx.origin);
    }
}