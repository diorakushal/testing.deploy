// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OpinionMarket
 * @dev Main contract for blind voting opinion markets
 */
contract OpinionMarket is ReentrancyGuard {
    address public owner;
    uint256 public constant RAKE_PERCENT = 5; // 5% platform rake
    
    // Addresses for USDC and USDT
    address public usdcAddress;
    address public usdtAddress;
    
    struct Market {
        address creator;
        string title;
        uint256 endsAt;
        uint256 totalAgreeStakes;
        uint256 totalDisagreeStakes;
        uint256 winner; // 1 = agree, 2 = disagree
        bool resolved;
        address tokenAddress;
    }
    
    struct Stake {
        address user;
        uint256 amount;
        uint256 side; // 1 = agree, 2 = disagree
        bool claimed;
    }
    
    // marketId => Market
    mapping(bytes32 => Market) public markets;
    
    // marketId => Stake[]
    mapping(bytes32 => Stake[]) public stakes;
    
    // marketId => user => stake index
    mapping(bytes32 => mapping(address => uint256)) public userStakesIndex;
    
    event MarketCreated(
        bytes32 indexed marketId,
        address indexed creator,
        string title,
        uint256 endsAt
    );
    
    event StakePlaced(
        bytes32 indexed marketId,
        address indexed user,
        uint256 amount,
        uint256 side
    );
    
    event MarketResolved(
        bytes32 indexed marketId,
        uint256 winner,
        uint256 totalAgree,
        uint256 totalDisagree
    );
    
    event PayoutClaimed(
        bytes32 indexed marketId,
        address indexed user,
        uint256 amount
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    modifier validMarket(bytes32 marketId) {
        require(markets[marketId].endsAt > 0, "Market does not exist");
        _;
    }
    
    constructor(address _usdcAddress, address _usdtAddress) {
        owner = msg.sender;
        usdcAddress = _usdcAddress;
        usdtAddress = _usdtAddress;
    }
    
    /**
     * @dev Create a new opinion market
     */
    function createMarket(
        bytes32 marketId,
        string memory title,
        uint256 duration,
        address tokenAddress
    ) external {
        require(tokenAddress == usdcAddress || tokenAddress == usdtAddress, "Invalid token");
        require(markets[marketId].endsAt == 0, "Market already exists");
        
        markets[marketId] = Market({
            creator: msg.sender,
            title: title,
            endsAt: block.timestamp + duration,
            totalAgreeStakes: 0,
            totalDisagreeStakes: 0,
            winner: 0,
            resolved: false,
            tokenAddress: tokenAddress
        });
        
        emit MarketCreated(marketId, msg.sender, title, markets[marketId].endsAt);
    }
    
    /**
     * @dev Place a blind stake on a market
     */
    function stake(
        bytes32 marketId,
        uint256 amount,
        uint256 side
    ) external validMarket(marketId) nonReentrant {
        require(!markets[marketId].resolved, "Market already resolved");
        require(block.timestamp < markets[marketId].endsAt, "Market ended");
        require(side == 1 || side == 2, "Invalid side");
        require(amount > 0, "Amount must be greater than 0");
        
        address tokenAddress = markets[marketId].tokenAddress;
        IERC20 token = IERC20(tokenAddress);
        
        require(token.balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(token.allowance(msg.sender, address(this)) >= amount, "Allowance too low");
        
        // Transfer tokens
        token.transferFrom(msg.sender, address(this), amount);
        
        // Record stake
        stakes[marketId].push(Stake({
            user: msg.sender,
            amount: amount,
            side: side,
            claimed: false
        }));
        
        userStakesIndex[marketId][msg.sender] = stakes[marketId].length - 1;
        
        if (side == 1) {
            markets[marketId].totalAgreeStakes += amount;
        } else {
            markets[marketId].totalDisagreeStakes += amount;
        }
        
        emit StakePlaced(marketId, msg.sender, amount, side);
    }
    
    /**
     * @dev Resolve market and calculate winner
     */
    function resolveMarket(bytes32 marketId) external validMarket(marketId) {
        require(!markets[marketId].resolved, "Market already resolved");
        require(block.timestamp >= markets[marketId].endsAt, "Market not ended yet");
        
        Market storage market = markets[marketId];
        
        // Determine winner (higher total stakes wins)
        if (market.totalAgreeStakes > market.totalDisagreeStakes) {
            market.winner = 1;
        } else if (market.totalDisagreeStakes > market.totalAgreeStakes) {
            market.winner = 2;
        } else {
            market.winner = 0; // Tie - refund all
        }
        
        market.resolved = true;
        
        emit MarketResolved(
            marketId,
            market.winner,
            market.totalAgreeStakes,
            market.totalDisagreeStakes
        );
    }
    
    /**
     * @dev Claim payout for winning side
     */
    function claimPayout(bytes32 marketId) external validMarket(marketId) nonReentrant {
        require(markets[marketId].resolved, "Market not resolved");
        
        Market storage market = markets[marketId];
        require(market.winner > 0, "Tie - use claimRefund");
        
        uint256 userIndex = userStakesIndex[marketId][msg.sender];
        require(userIndex < stakes[marketId].length, "No stake found");
        
        Stake storage userStake = stakes[marketId][userIndex];
        require(!userStake.claimed, "Already claimed");
        require(userStake.side == market.winner, "Not on winning side");
        
        userStake.claimed = true;
        
        // Calculate payout
        uint256 totalPool = market.winner == 1 ? market.totalDisagreeStakes : market.totalAgreeStakes;
        uint256 winnerPool = market.winner == 1 ? market.totalAgreeStakes : market.totalDisagreeStakes;
        
        uint256 rake = (totalPool * 5) / 100; // 5% rake
        uint256 payoutPool = totalPool - rake;
        
        uint256 userPayout = (userStake.amount * payoutPool) / winnerPool + userStake.amount;
        
        // Transfer payout
        IERC20 token = IERC20(market.tokenAddress);
        token.transfer(msg.sender, userPayout);
        
        emit PayoutClaimed(marketId, msg.sender, userPayout);
    }
    
    /**
     * @dev Claim refund for tie
     */
    function claimRefund(bytes32 marketId) external validMarket(marketId) nonReentrant {
        require(markets[marketId].resolved, "Market not resolved");
        require(markets[marketId].winner == 0, "Not a tie");
        
        uint256 userIndex = userStakesIndex[marketId][msg.sender];
        require(userIndex < stakes[marketId].length, "No stake found");
        
        Stake storage userStake = stakes[marketId][userIndex];
        require(!userStake.claimed, "Already claimed");
        
        userStake.claimed = true;
        
        IERC20 token = IERC20(markets[marketId].tokenAddress);
        token.transfer(msg.sender, userStake.amount);
        
        emit PayoutClaimed(marketId, msg.sender, userStake.amount);
    }
    
    /**
     * @dev Get market details
     */
    function getMarket(bytes32 marketId) external view returns (
        address creator,
        string memory title,
        uint256 endsAt,
        uint256 totalAgreeStakes,
        uint256 totalDisagreeStakes,
        uint256 winner,
        bool resolved
    ) {
        Market memory market = markets[marketId];
        return (
            market.creator,
            market.title,
            market.endsAt,
            market.totalAgreeStakes,
            market.totalDisagreeStakes,
            market.winner,
            market.resolved
        );
    }
    
    /**
     * @dev Get user stake for a market
     */
    function getUserStake(bytes32 marketId, address user) external view returns (
        uint256 amount,
        uint256 side,
        bool claimed
    ) {
        uint256 index = userStakesIndex[marketId][user];
        require(index < stakes[marketId].length, "No stake found");
        Stake memory stake = stakes[marketId][index];
        return (stake.amount, stake.side, stake.claimed);
    }
    
    /**
     * @dev Withdraw platform rake
     */
    function withdrawRake(address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(owner, balance);
    }
}

