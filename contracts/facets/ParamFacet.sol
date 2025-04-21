// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ParamFacet
 * @notice Governance-controlled parameters for risk management
 * @dev Part of the Diamond facet system
 */
contract ParamFacet {
    // Owner of the contract
    address public owner;
    
    // Alpha parameter - risk multiplier (stake required = alpha * txValue)
    // Represented as a fixed-point number with 18 decimals (1.0 = 1e18)
    uint256 public alpha = 1e18; // Default: 1.0
    
    // Maximum deadline window (in blocks)
    uint64 public maxDeadlineWindow = 32;
    
    // Minimum stake required to participate as a validator
    uint256 public minStake = 2 ether;
    
    // Percentage of slashed stake that gets burned (remainder goes to the slasher)
    // Represented in basis points (10000 = 100%)
    uint256 public slashBurnBasisPoints = 5000; // Default: 50%
    
    event ParameterUpdated(string paramName, uint256 newValue);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "ParamFacet: caller is not the owner");
        _;
    }
    
    /**
     * @notice Update the alpha risk multiplier
     * @param newAlpha New alpha value (fixed point with 18 decimals)
     */
    function setAlpha(uint256 newAlpha) external onlyOwner {
        alpha = newAlpha;
        emit ParameterUpdated("alpha", newAlpha);
    }
    
    /**
     * @notice Update the maximum deadline window
     * @param newMaxWindow New maximum window in blocks
     */
    function setMaxDeadlineWindow(uint64 newMaxWindow) external onlyOwner {
        maxDeadlineWindow = newMaxWindow;
        emit ParameterUpdated("maxDeadlineWindow", newMaxWindow);
    }
    
    /**
     * @notice Update the minimum stake requirement
     * @param newMinStake New minimum stake in wei
     */
    function setMinStake(uint256 newMinStake) external onlyOwner {
        minStake = newMinStake;
        emit ParameterUpdated("minStake", newMinStake);
    }
    
    /**
     * @notice Update the slash burn percentage
     * @param newBurnBasisPoints New burn percentage in basis points (10000 = 100%)
     */
    function setSlashBurnBasisPoints(uint256 newBurnBasisPoints) external onlyOwner {
        require(newBurnBasisPoints <= 10000, "ParamFacet: invalid basis points");
        slashBurnBasisPoints = newBurnBasisPoints;
        emit ParameterUpdated("slashBurnBasisPoints", newBurnBasisPoints);
    }
}