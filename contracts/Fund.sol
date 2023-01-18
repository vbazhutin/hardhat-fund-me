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

    function getFundData()
        public
        view
        returns (
            uint256,
            string memory,
            address,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (
            index,
            fundName,
            fundOwner,
            currentFunding,
            targetFunding,
            startTime,
            fundDuration
        );
    }

    function withdrawFunds() public payable {
        if (block.timestamp < startTime + fundDuration) {
            revert Fund__FundingInProcess();
        }

        uint256 balance = address(this).balance;
        if (balance == 0) {
            revert Fund__NoFundsToWithdraw();
        }
        if (msg.sender != fundOwner) {
            revert Fund__NotFundOwner();
        }

        (bool result, ) = payable(fundOwner).call{value: balance}("");
        if (!result) revert Fund__FundsTransferFailed();
    }
}
