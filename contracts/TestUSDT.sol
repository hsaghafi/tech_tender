// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**@title A simple Test Token Contract
 * @author Hadi Saghafi
 * @notice This contract is developed using @openzeppelin to test Tender contract
 */

contract TestUSDT is ERC20, ERC20Permit {
    constructor(address initialOwner)
        ERC20("Test USDT", "USDT")
        ERC20Permit("Test USDT")
    {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
