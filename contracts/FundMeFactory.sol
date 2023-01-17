// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

error Fund__NoFundsToWithdraw();
error Fund__NotFundOwner();
error Fund__FundsTransferFailed(
    bool result,
    uint256 balance,
    uint256 transferAmount
);
error Fund__FeeTransferFailed(
    bool result,
    uint256 balance,
    uint256 transferAmount
);
error Fund__FundingExpired();

contract Fund {
    uint256 public index; //32
    uint256 public fundDuration; //32
    uint256 public startTime; //32
    uint256 public targetFunding; //64
    uint256 public currentFunding; //64
    address public fundOwner;
    address public fundManager;
    string public fundName;

    // mapping of funders and amount they put into the fund
    mapping(address => uint256) public funderToAmount;
    address[] public funders;

    function initialize(
        uint256 _index,
        string memory _fundName,
        address _fundOwner,
        uint256 _targetFunding,
        uint256 _fundDuration,
        address _fundManager
    ) public {
        currentFunding = 0;
        startTime = block.timestamp;
        fundDuration = _fundDuration;
        index = _index;
        targetFunding = _targetFunding;
        fundName = _fundName;
        fundOwner = _fundOwner;
        fundManager = _fundManager;
    }

    function fund() public payable {
        if (block.timestamp > startTime + fundDuration) {
            revert Fund__FundingExpired();
        }
        funderToAmount[msg.sender] += msg.value;
        funders.push(msg.sender);
        currentFunding += msg.value;
    }

    // function getCurrentFunding() public view returns (uint256) {
    //     return currentFunding;
    // }

    // function getFundOwner() public view returns (address) {
    //     return fundOwner;
    // }

    // function getTargetFunding() public view returns (uint256) {
    //     return targetFunding;
    // }

    // function getFundDuration() public view returns (uint256) {
    //     return fundDuration;
    // }

    // function getStartTime() public view returns (uint256) {
    //     return startTime;
    // }

    function getFundData()
        public
        view
        returns (uint256, string memory, address, uint256, uint256, uint256)
    {
        return (
            index,
            fundName,
            fundOwner,
            currentFunding,
            targetFunding,
            fundDuration
        );
    }

    function withdrawFunds() public payable {
        uint256 balance = address(this).balance;
        if (balance == 0) {
            revert Fund__NoFundsToWithdraw();
        }
        if (msg.sender != fundOwner) {
            revert Fund__NotFundOwner();
        }

        //taking 1% of all funds as service fee, transfer to contract factory
        uint256 fee = (balance * 1) / 100;
        (bool feeTransferRes, ) = payable(fundManager).call{value: fee}("");
        if (!feeTransferRes)
            revert Fund__FeeTransferFailed(feeTransferRes, balance, fee);

        (bool fundTransferRes, ) = payable(fundOwner).call{value: balance}("");

        if (!fundTransferRes)
            revert Fund__FundsTransferFailed(fundTransferRes, balance, balance);

        // (bool callResult, ) = payable(msg.sender).call{
        //     value: address(this).balance
        // }("");
        // if (!callResult) revert FundMe__TransferFailed();
    }
}
