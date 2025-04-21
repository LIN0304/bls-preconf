// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ISharedSequencer
 * @notice Interface for integrating with shared sequencing services like Espresso or Radius
 * @dev Allows shared sequencers to forward BLS signatures and handle aggregation
 */
interface ISharedSequencer {
    /**
     * @notice Submit a batch of preconfirmations from a shared sequencer
     * @param batchId Unique identifier for the batch 
     * @param rollupIds Array of rollup identifiers included in the batch
     * @param msgHashes Array of message hashes (commit-reveal format)
     * @param aggregateSignature BLS aggregate signature for all included messages
     * @param validatorPubKeys Array of validator public keys that participated
     * @param deadline Block number deadline for inclusion
     */
    function submitBatchPreconfirmations(
        bytes32 batchId,
        uint256[] calldata rollupIds,
        bytes32[] calldata msgHashes,
        bytes calldata aggregateSignature,
        bytes[] calldata validatorPubKeys,
        uint64 deadline
    ) external;

    /**
     * @notice Get the status of a submitted batch
     * @param batchId The batch identifier to check
     * @return status 0=unknown, 1=pending, 2=finalized, 3=slashed
     * @return finalizedAt The block number when it was finalized (if status=2)
     */
    function getBatchStatus(bytes32 batchId) external view 
        returns (uint8 status, uint256 finalizedAt);
}