// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "../libs/BLS.sol";

contract StakeFacet {
    mapping(address => uint256) public stakeOf;
    mapping(address => bytes)   public blsPubKey;      // G2 pubkey

    event Staked(address indexed val, uint256 amt);
    event Unstaked(address indexed val, uint256 amt);

    uint256 public constant MIN_STAKE = 2 ether;

    function stake(bytes calldata pubKey) external payable {
        require(msg.value >= MIN_STAKE, "!stake");
        require(pubKey.length == 48, "!G2");
        stakeOf[msg.sender] += msg.value;
        blsPubKey[msg.sender] = pubKey;
        emit Staked(msg.sender, msg.value);
    }

    function unstake(uint256 amt) external {
        require(block.number > lastPending[msg.sender], "open preconfs");
        stakeOf[msg.sender] -= amt;
        (bool ok,) = msg.sender.call{value: amt}("");
        require(ok, "transfer");
        emit Unstaked(msg.sender, amt);
    }

    /* ----------  helper to mark pending commitments ---------- */
    mapping(address => uint256) internal lastPending;
    function _bumpPending(address val) internal {
        lastPending[val] = block.number;
    }
}