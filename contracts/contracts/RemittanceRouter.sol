// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != ENTERED, "ReentrancyGuard: reentrant call");
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

contract RemittanceRouter is ReentrancyGuard {
    event Remitted(address indexed token, address indexed from, address indexed to, uint256 amount, uint256 fee, string memo);
    event AllowedTokenSet(address indexed token, bool allowed);
    event FeeCollectorSet(address indexed feeCollector);
    event FeeBpsSet(uint16 feeBps);

    address public owner;
    address public feeCollector;
    uint16 public feeBps; // basis points, max 200 (2%)
    mapping(address => bool) public isTokenAllowed; // token address => allowed

    uint16 public constant MAX_FEE_BPS = 200;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _feeCollector, uint16 _feeBps) {
        require(_feeCollector != address(0), "feeCollector zero");
        require(_feeBps <= MAX_FEE_BPS, "fee too high");
        owner = msg.sender;
        feeCollector = _feeCollector;
        feeBps = _feeBps;
    }

    function setAllowedToken(address token, bool allowed) external onlyOwner {
        require(token != address(0), "token zero");
        isTokenAllowed[token] = allowed;
        emit AllowedTokenSet(token, allowed);
    }

    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "feeCollector zero");
        feeCollector = _feeCollector;
        emit FeeCollectorSet(_feeCollector);
    }

    function setFeeBps(uint16 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "fee too high");
        feeBps = _feeBps;
        emit FeeBpsSet(_feeBps);
    }

    function remit(address token, address to, uint256 amount, string calldata memo) external nonReentrant {
        require(isTokenAllowed[token], "token not allowed");
        require(to != address(0), "to zero");
        require(amount > 0, "amount zero");

        uint256 fee = (amount * feeBps) / 10_000;
        uint256 netAmount = amount - fee;

        // pull funds from sender
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        if (fee > 0) {
            require(IERC20(token).transfer(feeCollector, fee), "fee transfer failed");
        }
        require(IERC20(token).transfer(to, netAmount), "recipient transfer failed");

        emit Remitted(token, msg.sender, to, amount, fee, memo);
    }
}


