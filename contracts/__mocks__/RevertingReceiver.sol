// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title RevertingReceiver
 * @dev Mock contract that reverts on receive() to test DoS prevention in KiftRedemption
 */
contract RevertingReceiver {
    // Revert on receiving ETH to simulate a malicious or broken contract
    receive() external payable {
        revert("RevertingReceiver: intentional revert");
    }

    fallback() external payable {
        revert("RevertingReceiver: intentional revert");
    }
}
