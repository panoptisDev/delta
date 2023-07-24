// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    address immutable admin;
    uint8 decimals_;

    constructor(string memory name_, string memory symbol_, uint8 decimals__) ERC20(name_, symbol_) {
        admin = msg.sender;
        decimals_ = decimals__;
    }

    function decimals() public view override returns(uint8) {
        return decimals_;
    }

    function mint(address sender, uint256 amount) public returns(bool) {
        _mint(sender, amount);
        return true;
    }
}