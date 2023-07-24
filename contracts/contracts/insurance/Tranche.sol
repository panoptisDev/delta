// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


interface ITranche is IERC20 {
    function mint(address account, uint256 amount) external;
    function burn(address account, uint256 amount) external;
}


/// @title Tranche tokens for the DeltaInsurance contract
contract Tranche is ITranche, ERC20, Ownable {
    constructor(
        string memory name_, 
        string memory symbol_
    ) ERC20(name_, symbol_) { }


    /// @notice Allows the owner to mint new tranche tokens
    /// @dev The insurance contract should be the immutable owner
    /// @param account The recipient of the new tokens
    /// @param amount The amount of new tokens to mint
    function mint(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }


    /// @notice Allows the owner to burn tranche tokens
    /// @dev The insurance contract should be the immutable owner
    /// @param account The owner of the tokens to be burned
    /// @param amount The amount of tokens to burn
    function burn(address account, uint256 amount) public onlyOwner {
        _burn(account, amount);
    }
}