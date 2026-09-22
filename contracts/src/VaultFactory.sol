// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {MandateVault} from "./MandateVault.sol";

contract VaultFactory {
    address public immutable token;
    mapping(address owner => address vault) public vaultOf;

    event VaultCreated(address indexed owner, address indexed vault, address token);

    error InvalidToken();
    error VaultAlreadyExists();

    constructor(address token_) {
        if (token_ == address(0) || token_.code.length == 0) revert InvalidToken();

        try IERC20Metadata(token_).decimals() returns (uint8 tokenDecimals) {
            if (tokenDecimals != 6) revert InvalidToken();
        } catch {
            revert InvalidToken();
        }

        token = token_;
    }

    function createVault() external returns (address vault) {
        if (vaultOf[msg.sender] != address(0)) revert VaultAlreadyExists();

        vault = address(new MandateVault(msg.sender, token));
        vaultOf[msg.sender] = vault;
        emit VaultCreated(msg.sender, vault, token);
    }
}
