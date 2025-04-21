// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./facets/StakeFacet.sol";
import "./facets/PreconfFacet.sol";

/**
 * @title Diamond
 * @notice Main entry point contract using the Diamond pattern (EIP-2535)
 * @dev This is a simplified version for the hackathon. A full implementation would use 
 * a more complete Diamond implementation with proper storage and facet management.
 */
contract Diamond is PreconfFacet {
    address public owner;
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Diamond: caller is not the owner");
        _;
    }
    
    /**
     * @notice Transfer ownership of the contract to a new account
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Diamond: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    /**
     * @notice Helper function to get commitment ID (for testing)
     * @param msgHash The message hash
     * @param pubKey The validator's BLS public key
     * @param deadline The block deadline
     * @return id The commitment ID
     */
    function getId(bytes32 msgHash, bytes memory pubKey, uint64 deadline) 
        external pure returns (bytes32) {
        return keccak256(abi.encodePacked(msgHash, pubKey, deadline));
    }
}