// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DemoUSD is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 100_000_000;
    uint256 public constant FAUCET_COOLDOWN = 1 days;

    mapping(address account => uint256 timestamp) public nextFaucetAt;

    error UnsupportedChain(uint256 chainId);
    error FaucetCoolingDown(uint256 availableAt);

    constructor() ERC20("Agora Demo USD", "mUSD") {
        if (block.chainid != 31_337 && block.chainid != 97) {
            revert UnsupportedChain(block.chainid);
        }
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function faucet() external {
        uint256 availableAt = nextFaucetAt[msg.sender];
        if (block.timestamp < availableAt) revert FaucetCoolingDown(availableAt);

        nextFaucetAt[msg.sender] = block.timestamp + FAUCET_COOLDOWN;
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}
