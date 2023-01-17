pragma solidity ^0.8.17;

contract Fund {
    string internal fundName;
    address internal fundOwner;
    uint256 internal index;
    uint256 internal targetGoal;
    uint256 internal currentGoal;

    // mapping of funders and amount they put into the fund
    mapping(address => uint256) fundersToAmount;

    constructor(
        string memory _fundName,
        address _fundOwner,
        uint256 _index,
        uint256 _targetGoal
    ) {
        currentGoal = 0;
        index = _index;
        targetGoal = _targetGoal;
        fundName = _fundName;
        fundOwner = _fundOwner;
    }

    function getData() public returns (string memory) {}
}
