import { expect } from "chai";
import { ethers } from "hardhat";
import { Diamond } from "../typechain-types";

describe("BLS Preconfirmations", function () {
  // Test variables
  let diamond: Diamond;
  let owner: any;
  let leader: any;
  let validator1: any;
  let validator2: any;
  let user: any;
  let slasher: any;

  // Placeholder for BLS keys and signatures (in real implementation, these would be proper BLS values)
  const pubKeyLeader = "0x" + "01".repeat(48);
  const pubKeyVal1 = "0x" + "02".repeat(48);
  const pubKeyVal2 = "0x" + "03".repeat(48);
  const simulatedAggSig = "0x" + "aa".repeat(96);
  
  const simMsgHash = ethers.keccak256("0x1234");
  const txHashFull = ethers.keccak256("0x5678");
  
  beforeEach(async function () {
    [owner, leader, validator1, validator2, user, slasher] = await ethers.getSigners();
    
    // Deploy the Diamond contract
    diamond = await ethers.deployContract("Diamond");
    
    // Stake ETH for the validators
    await diamond.connect(leader).stake(pubKeyLeader, { value: ethers.parseEther("5") });
    await diamond.connect(validator1).stake(pubKeyVal1, { value: ethers.parseEther("3") });
    await diamond.connect(validator2).stake(pubKeyVal2, { value: ethers.parseEther("2") });
  });

  it("should allow staking and unstaking", async function () {
    // Check initial staked amounts
    expect(await diamond.stakeOf(leader.address)).to.equal(ethers.parseEther("5"));
    expect(await diamond.stakeOf(validator1.address)).to.equal(ethers.parseEther("3"));
    
    // New validator stakes
    const newValidator = (await ethers.getSigners())[6];
    await diamond.connect(newValidator).stake(pubKeyVal1, { value: ethers.parseEther("4") });
    expect(await diamond.stakeOf(newValidator.address)).to.equal(ethers.parseEther("4"));
    
    // Attempt unstake (should work since no preconfirmations)
    await diamond.connect(newValidator).unstake(ethers.parseEther("2"));
    expect(await diamond.stakeOf(newValidator.address)).to.equal(ethers.parseEther("2"));
  });

  it("should register and finalize preconfirmations", async function () {
    // Current block + 10 blocks for deadline
    const currentBlock = await ethers.provider.getBlockNumber();
    const deadline = BigInt(currentBlock + 10);
    
    // Get the commitment ID
    const commitmentId = await diamond.getId(simMsgHash, pubKeyLeader, deadline);
    
    // Register preconfirmation
    await diamond.connect(leader).registerAggPreconf(
      [simMsgHash],
      [pubKeyLeader],
      simulatedAggSig,
      deadline
    );
    
    // Verify the commitment exists
    const commitment = await diamond.commitments(commitmentId);
    expect(commitment.txHash).to.equal(simMsgHash);
    expect(commitment.deadline).to.equal(deadline);
    expect(commitment.finished).to.be.false;
    
    // Finalize the commitment
    await diamond.finalize(commitmentId, txHashFull);
    
    // Verify the commitment is now finalized
    const finalizedCommitment = await diamond.commitments(commitmentId);
    expect(finalizedCommitment.finished).to.be.true;
  });

  it("should allow slashing expired commitments", async function () {
    // Use a very short deadline (current block + 1)
    const currentBlock = await ethers.provider.getBlockNumber();
    const deadline = BigInt(currentBlock + 1);
    
    // Get the commitment ID
    const commitmentId = await diamond.getId(simMsgHash, pubKeyLeader, deadline);
    
    // Register preconfirmation
    await diamond.connect(leader).registerAggPreconf(
      [simMsgHash],
      [pubKeyLeader],
      simulatedAggSig,
      deadline
    );
    
    // Mine a few blocks to pass the deadline
    for (let i = 0; i < 2; i++) {
      await ethers.provider.send("evm_mine", []);
    }
    
    // Check leader's initial stake
    const initialStake = await diamond.stakeOf(leader.address);
    
    // Slash the commitment
    await diamond.connect(slasher).slash(commitmentId);
    
    // Verify leader's stake was reduced
    const finalStake = await diamond.stakeOf(leader.address);
    expect(finalStake).to.be.lessThan(initialStake);
    
    // Verify the slasher received their reward
    // This is a simplified check and would depend on the actual slashing mechanism
  });
  
  it("aggregated flow", async function () {
    // Current block + 10 blocks for deadline
    const currentBlock = await ethers.provider.getBlockNumber();
    const deadline = BigInt(currentBlock + 10);
    
    // Get the commitment ID
    const id = await diamond.getId(simMsgHash, pubKeyLeader, deadline);
    
    // Register aggregated preconfirmation
    await diamond.connect(leader).registerAggPreconf(
      [simMsgHash],
      [pubKeyLeader], 
      simulatedAggSig, 
      deadline
    );

    // Happy finalize
    await diamond.finalize(id, txHashFull);
    
    // Verify it's finalized
    const finalizedCommitment = await diamond.commitments(id);
    expect(finalizedCommitment.finished).to.be.true;
  });
});