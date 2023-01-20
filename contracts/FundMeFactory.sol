// SPDX-License-Identifier: MIT

/**@title A sample Funding Contract
 * @author @voyotex
 * @notice This contract is for creating a sample funding contract
 * @dev This implements price feeds as our library
 */
pragma solidity ^0.8.17;

import "./Clones.sol";
import "./Fund.sol";
import "./StringUtils.sol";

error FundMe__NotOwner();
error FundMe__NotEnoughFunds();
error FundMe__TransferFailed();
error FundMe__LowTargetFunding();
error FundMe__InvalidFundNameLength();
error FundMe__InvalidFundDuration();

contract FundMeFactory {
    using StringUtils for string;
    uint256 public fundsIndexCounter;
    uint256 public immutable i_minFundETH;
    address public immutable i_owner;
    address[] public funds;
    address public masterContract;
    uint256 i_minTargetFundingETH;

    constructor(address _masterContract) {
        masterContract = _masterContract;
        fundsIndexCounter = 0;
        i_minFundETH = 0.1 ether;
        i_minTargetFundingETH = 1 ether;
        i_owner = msg.sender;
    }

    event FundCreated(uint256 indexed index, address indexed fundAddress);

    receive() external payable {}

    fallback() external payable {}

    function createFund(
        string memory _fundName,
        uint256 _fundDuration,
        uint256 _targetFunding
    ) external returns (address fund) {
        if (_targetFunding < 1 ether) {
            revert FundMe__LowTargetFunding();
        }
        if (_fundName.length() < 3 || _fundName.length() > 32) {
            revert FundMe__InvalidFundNameLength();
        }
        if (_fundDuration < 7 days) {
            revert FundMe__InvalidFundDuration();
        }
        fund = Clones.clone(masterContract);
        Fund(fund).initialize(
            fundsIndexCounter,
            _fundName,
            msg.sender,
            _targetFunding,
            _fundDuration,
            address(this)
        );
        funds.push(address(fund));
        emit FundCreated(fundsIndexCounter, fund);
        fundsIndexCounter++;
    }

    function withdraw() public payable {
        uint256 balance = address(this).balance;
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        if (balance == 0) {
            revert FundMe__NotEnoughFunds();
        }
        (bool callResult, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        if (!callResult) revert FundMe__TransferFailed();
    }

    function getMasterContract() public view returns (address) {
        return masterContract;
    }

    function getFunds() public view returns (address[] memory) {
        return funds;
    }
}
