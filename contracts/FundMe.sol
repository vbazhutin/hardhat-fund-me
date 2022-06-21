// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./PriceConverter.sol";

error FundMe__NotOwner();
error FundMe__NotEnoughFunds();
error FundMe__TransferFailed();

/**@title A sample Funding Contract
 * @author @vbazhutin
 * @notice This contract is for creating a sample funding contract
 * @dev This implements price feeds as our library
 */
contract FundMe {
    using PriceConverter for uint256;
    uint256 public constant MIN_USD = 50;
    address[] public s_funders;
    address private immutable i_owner;
    AggregatorV3Interface public s_priceFeed;
    mapping(address => uint256) public s_addressToAmountFunded;

    modifier only_owner() {
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    constructor(address s_priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        if (msg.value.getConvertionRate(s_priceFeed) <= MIN_USD)
            revert FundMe__NotEnoughFunds();
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public only_owner {
        address[] memory local_funders = s_funders;
        for (uint256 i = 0; i < local_funders.length; i++) {
            address funder = local_funders[i];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);

        (bool callResult, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        if (!callResult) revert FundMe__TransferFailed();
    }

    // add getters for contract owner, priceFeed and funder[index], amount funded[funder]
    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
