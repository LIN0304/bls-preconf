import { expect } from "chai";
import { ethers } from "hardhat";
import { Diamond } from "../typechain-types";

describe("Stake Functionality", function () {
  let diamond: Diamond;
  let owner: any;
  let validator1: any;
  let validator2: any;
  let nonValidator: any;
  
  // Placeholder BLS keys
  const validPubKey = "0x" + "01".repeat(48);  // 48 bytes
  const invalidPubKey = "0x" + "02".repeat(32); // 32 bytes (invalid length)
  
  beforeEach(async function () {
    [owner, validator1, validator2, nonValidator] = await ethers.getSigners();
    
    // Deploy the Diamond contract
    diamond = await ethers.deployContract("Diamond");
  });
  
  describe("Staking", function () {
    it("should allow validators to stake with valid pub keys", async function () {
      const stakeAmount = ethers.parseEther("3");
      
      // Initial state
      expect(await diamond.stakeOf(validator1.address)).to.equal(0);
      
      // Perform stake
      await diamond.connect(validator1).stake(validPubKey, { value: stakeAmount });
      
      // Verify stake was recorded
      expect(await diamond.stakeOf(validator1.address)).to.equal(stakeAmount);
      
      // Verify pub key was stored
      const storedPubKey = await diamond.blsPubKey(validator1.address);
      expect(storedPubKey).to.equal(validPubKey);
    });
    
    it("should fail when staking below minimum amount", async function () {
      const belowMinimum = ethers.parseEther("1");
      const minStake = await diamond.MIN_STAKE();
      
      // Ensure our test value is actually below minimum
      expect(belowMinimum).to.be.lessThan(minStake);
      
      // Attempt to stake below minimum should fail
      await expect(
        diamond.connect(validator1).stake(validPubKey, { value: belowMinimum })
      ).to.be.revertedWith("!stake");
    });
    
    it("should fail when pubkey has invalid length", async function () {
      const stakeAmount = ethers.parseEther("3");
      
      // Attempt to stake with invalid pubkey should fail
      await expect(
        diamond.connect(validator1).stake(invalidPubKey, { value: stakeAmount })
      ).to.be.revertedWith("!G2");
    });
    
    it("should allow additional stake to be added", async function () {
      // Initial stake
      const initialStake = ethers.parseEther("3");
      await diamond.connect(validator1).stake(validPubKey, { value: initialStake });
      
      // Additional stake
      const additionalStake = ethers.parseEther("2");
      await diamond.connect(validator1).stake(validPubKey, { value: additionalStake });
      
      // Verify total stake
      const totalExpected = initialStake + additionalStake;
      expect(await diamond.stakeOf(validator1.address)).to.equal(totalExpected);
    });
  });
  
  describe("Unstaking", function () {
    beforeEach(async function () {
      // Setup - stake some ETH
      await diamond.connect(validator1).stake(validPubKey, { value: ethers.parseEther("5") });
    });
    
    it("should allow validators to unstake", async function () {
      const unstakeAmount = ethers.parseEther("2");
      const initialStake = await diamond.stakeOf(validator1.address);
      const initialBalance = await ethers.provider.getBalance(validator1.address);
      
      // Perform unstake
      const tx = await diamond.connect(validator1).unstake(unstakeAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt ? receipt.gasUsed * receipt.gasPrice : 0n;
      
      // Verify stake was reduced
      const finalStake = await diamond.stakeOf(validator1.address);
      expect(finalStake).to.equal(initialStake - unstakeAmount);
      
      // Verify ETH was returned (accounting for gas)
      const finalBalance = await ethers.provider.getBalance(validator1.address);
      expect(finalBalance).to.be.closeTo(
        initialBalance + unstakeAmount - gasUsed,
        ethers.parseEther("0.01") // Allow small margin due to gas estimation
      );
    });
    
    it("should prevent unstaking when there are pending preconfirmations", async function () {
      // Setup a preconfirmation to block unstaking
      const currentBlock = await ethers.provider.getBlockNumber();
      const deadline = BigInt(currentBlock + 10);
      const mockMsgHash = ethers.keccak256("0x1234");
      const mockSig = "0x" + "aa".repeat(96);
      
      // Register a preconfirmation
      await diamond.connect(validator1).registerAggPreconf(
        [mockMsgHash],
        [validPubKey],
        mockSig,
        deadline
      );
      
      // Attempt to unstake should fail
      await expect(
        diamond.connect(validator1).unstake(ethers.parseEther("1"))
      ).to.be.revertedWith("open preconfs");
    });
    
    it("should fail when unstaking more than staked amount", async function () {
      const stakeAmount = await diamond.stakeOf(validator1.address);
      const exceedAmount = stakeAmount + ethers.parseEther("1");
      
      // Attempt to unstake more than available should fail with underflow error
      await expect(
        diamond.connect(validator1).unstake(exceedAmount)
      ).to.be.reverted; // Will revert with underflow
    });
  });
});