// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KOI
 * @dev Smart contract for KOI opinion markets
 * Users stake USDC or USDT on opinions, vote blindly for 24 hours
 * After 24h, winner is determined by higher staked side
 * Winners split losing side's pool (minus 5% platform rake)
 */

contract KOI is ReentrancyGuard {
    
    // ============ STATE VARIABLES ============
    
    address public admin; // Platform admin (collects rake)
    
    // Supported stablecoins
    mapping(address => bool) public supportedTokens;
    
    // Market storage
    struct Market {
        uint256 id;
        address creator;
        string title;
        address stakingToken; // USDC or USDT
        uint256 createdAt;
        uint256 endsAt; // createdAt + 24 hours
        uint256 totalAgreeStakes;
        uint256 totalDisagreeStakes;
        uint8 winner; // 0 = not resolved, 1 = agree wins, 2 = disagree wins
        bool resolved;
        bool payoutsDistributed; // Track if winners were auto-paid
    }
    
    mapping(uint256 => Market) public markets;
    uint256 public marketCounter = 0;
    
    // Store stakers for auto-payout
    mapping(uint256 => address[]) public marketStakers; // marketId => array of staker addresses
    mapping(uint256 => mapping(address => bool)) public hasStaked; // Track unique stakers
    
    // User stakes per market
    struct Stake {
        uint256 amount;
        uint8 side; // 1 = agree, 2 = disagree
        bool claimed; // Has user claimed winnings?
    }
    
    mapping(uint256 => mapping(address => Stake)) public stakes; // marketId => userAddress => Stake
    
    // Constants
    uint256 public constant MARKET_DURATION = 24 hours;
    uint256 public constant PLATFORM_RAKE_PERCENT = 5; // 5% rake
    
    // ============ EVENTS ============
    
    event MarketCreated(uint256 indexed marketId, address indexed creator, string title, address stakingToken);
    event StakePlaced(uint256 indexed marketId, address indexed user, uint8 side, uint256 amount, address stakingToken);
    event MarketResolved(uint256 indexed marketId, uint8 winner, uint256 agreeTotal, uint256 disagreeTotal);
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 payout);
    event MarketPayoutsDistributed(uint256 indexed marketId, uint256 totalDistributed, uint256 rakeAmount);
    event MarketRefunded(uint256 indexed marketId, string reason);
    event RefundSent(uint256 indexed marketId, address indexed user, uint256 amount);
    
    // ============ MODIFIERS ============
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier marketExists(uint256 _marketId) {
        require(_marketId < marketCounter, "Market does not exist");
        _;
    }
    
    modifier marketNotResolved(uint256 _marketId) {
        require(!markets[_marketId].resolved, "Market already resolved");
        _;
    }
    
    modifier marketResolved(uint256 _marketId) {
        require(markets[_marketId].resolved, "Market not resolved yet");
        _;
    }
    
    modifier validToken(address _token) {
        require(supportedTokens[_token], "Token not supported");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor(address[] memory _supportedTokens) {
        admin = msg.sender;
        
        // Register supported tokens (USDC and USDT on Polygon)
        for (uint256 i = 0; i < _supportedTokens.length; i++) {
            supportedTokens[_supportedTokens[i]] = true;
        }
    }
    
    // ============ CREATE MARKET ============
    
    /**
     * @dev Creator posts a new opinion market
     * @param _title Opinion statement (e.g., "Drake > Kendrick")
     * @param _stakingToken Address of USDC or USDT
     */
    function createMarket(
        string memory _title,
        address _stakingToken
    ) external validToken(_stakingToken) returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        
        uint256 marketId = marketCounter;
        
        Market storage newMarket = markets[marketId];
        newMarket.id = marketId;
        newMarket.creator = msg.sender;
        newMarket.title = _title;
        newMarket.stakingToken = _stakingToken;
            newMarket.createdAt = block.timestamp;
            newMarket.endsAt = block.timestamp + MARKET_DURATION;
            newMarket.totalAgreeStakes = 0;
            newMarket.totalDisagreeStakes = 0;
            newMarket.winner = 0;
            newMarket.resolved = false;
            newMarket.payoutsDistributed = false;
        
        marketCounter++;
        
        emit MarketCreated(marketId, msg.sender, _title, _stakingToken);
        
        return marketId;
    }
    
    // ============ STAKING ============
    
    /**
     * @dev User stakes on "agree" side
     * Uses blind voting - no one sees stakes until market resolves
     * @param _marketId Market ID
     * @param _amount Amount in USDC/USDT (wei)
     */
    function stakeAgree(
        uint256 _marketId,
        uint256 _amount
    ) external marketExists(_marketId) marketNotResolved(_marketId) nonReentrant {
        require(block.timestamp < markets[_marketId].endsAt, "Voting period ended");
        require(_amount > 0, "Amount must be greater than 0");
        require(stakes[_marketId][msg.sender].amount == 0, "User already staked on this market");
        
        Market storage market = markets[_marketId];
        IERC20 token = IERC20(market.stakingToken);
        
        // Transfer tokens from user to contract
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        
        // Record stake
        stakes[_marketId][msg.sender] = Stake({
            amount: _amount,
            side: 1, // agree
            claimed: false
        });
        
        market.totalAgreeStakes += _amount;
        
        // Track staker for auto-payout later
        if (!hasStaked[_marketId][msg.sender]) {
            marketStakers[_marketId].push(msg.sender);
            hasStaked[_marketId][msg.sender] = true;
        }
        
        emit StakePlaced(_marketId, msg.sender, 1, _amount, market.stakingToken);
    }
    
    /**
     * @dev User stakes on "disagree" side
     * @param _marketId Market ID
     * @param _amount Amount in USDC/USDT (wei)
     */
    function stakeDisagree(
        uint256 _marketId,
        uint256 _amount
    ) external marketExists(_marketId) marketNotResolved(_marketId) nonReentrant {
        require(block.timestamp < markets[_marketId].endsAt, "Voting period ended");
        require(_amount > 0, "Amount must be greater than 0");
        require(stakes[_marketId][msg.sender].amount == 0, "User already staked on this market");
        
        Market storage market = markets[_marketId];
        IERC20 token = IERC20(market.stakingToken);
        
        // Transfer tokens from user to contract
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        
        // Record stake
        stakes[_marketId][msg.sender] = Stake({
            amount: _amount,
            side: 2, // disagree
            claimed: false
        });
        
        market.totalDisagreeStakes += _amount;
        
        // Track staker for auto-payout later
        if (!hasStaked[_marketId][msg.sender]) {
            marketStakers[_marketId].push(msg.sender);
            hasStaked[_marketId][msg.sender] = true;
        }
        
        emit StakePlaced(_marketId, msg.sender, 2, _amount, market.stakingToken);
    }
    
    // ============ MARKET RESOLUTION ============
    
    /**
     * @dev Resolve market after 24 hours
     * Anyone can call this (not just admin)
     * @param _marketId Market ID
     */
    function resolveMarket(uint256 _marketId) external marketExists(_marketId) marketNotResolved(_marketId) {
        Market storage market = markets[_marketId];
        
        require(block.timestamp >= market.endsAt, "Voting period not ended");
        
        // Check for empty side - refund everyone
        if (market.totalAgreeStakes == 0 || market.totalDisagreeStakes == 0) {
            market.resolved = true;
            market.winner = 0; // 0 = refunded
            market.payoutsDistributed = true; // Mark as distributed to prevent double-refund
            
            emit MarketRefunded(_marketId, "One side had no bets");
            return;
        }
        
        // Determine winner (higher staked side)
        if (market.totalAgreeStakes > market.totalDisagreeStakes) {
            market.winner = 1; // agree wins
        } else if (market.totalDisagreeStakes > market.totalAgreeStakes) {
            market.winner = 2; // disagree wins
        } else {
            // Tie - shouldn't happen often, but handle it
            market.winner = 1; // default to agree
        }
        
        market.resolved = true;
        
        emit MarketResolved(
            _marketId,
            market.winner,
            market.totalAgreeStakes,
            market.totalDisagreeStakes
        );
    }
    
    /**
     * @dev Refund all stakes if market was invalid (one side empty)
     * Anyone can call this after market resolves with winner = 0
     */
    function refundAllStakes(uint256 _marketId) external marketExists(_marketId) nonReentrant {
        Market storage market = markets[_marketId];
        
        require(market.resolved, "Market not resolved yet");
        require(market.winner == 0, "Market was not refunded");
        require(!market.payoutsDistributed, "Already distributed");
        
        IERC20 token = IERC20(market.stakingToken);
        
        // Loop through all stakers and refund 100%
        address[] memory stakers = marketStakers[_marketId];
        uint256 totalRefunded = 0;
        
        for (uint256 i = 0; i < stakers.length; i++) {
            address staker = stakers[i];
            Stake storage userStake = stakes[_marketId][staker];
            
            if (userStake.amount > 0 && !userStake.claimed) {
                uint256 refundAmount = userStake.amount;
                
                // Transfer full amount back to user
                require(token.transfer(staker, refundAmount), "Transfer failed");
                userStake.claimed = true; // Mark as claimed to prevent double-refund
                totalRefunded += refundAmount;
                
                emit RefundSent(_marketId, staker, refundAmount);
            }
        }
        
        market.payoutsDistributed = true;
        
        emit MarketPayoutsDistributed(_marketId, totalRefunded, 0); // 0 rake on refund
    }
    
    // ============ AUTO-DISTRIBUTE WINNINGS ============
    
    /**
     * @dev Automatically distribute winnings to all winners
     * Anyone can call this after market resolves
     * Loops through all stakers and pays winners proportionally
     */
    function distributeWinnings(uint256 _marketId) external marketExists(_marketId) marketResolved(_marketId) nonReentrant {
        Market storage market = markets[_marketId];
        require(!market.payoutsDistributed, "Payouts already distributed");
        
        // Get total winner stakes
        uint256 winnerPool = market.winner == 1 ? market.totalAgreeStakes : market.totalDisagreeStakes;
        require(winnerPool > 0, "No winners");
        
        // Calculate rake (5%)
        uint256 rakeAmount = (winnerPool * PLATFORM_RAKE_PERCENT) / 100;
        uint256 winningsPool = winnerPool - rakeAmount;
        
        IERC20 token = IERC20(market.stakingToken);
        
        // Loop through all stakers
        address[] memory stakers = marketStakers[_marketId];
        uint256 totalDistributed = 0;
        
        for (uint256 i = 0; i < stakers.length; i++) {
            address staker = stakers[i];
            Stake storage userStake = stakes[_marketId][staker];
            
            // Only pay winners
            if (userStake.side == market.winner && userStake.amount > 0 && !userStake.claimed) {
                // Calculate proportional payout
                uint256 payout = (userStake.amount * winningsPool) / winnerPool;
                
                // Transfer to user
                require(token.transfer(staker, payout), "Transfer failed");
                userStake.claimed = true;
                totalDistributed += payout;
                
                emit WinningsClaimed(_marketId, staker, payout);
            }
        }
        
        market.payoutsDistributed = true;
        
        emit MarketPayoutsDistributed(_marketId, totalDistributed, rakeAmount);
    }
    
    // ============ CLAIMING WINNINGS ============
    
    /**
     * @dev Winner claims their proportional share of losing side's pool
     * @param _marketId Market ID
     */
    function claimWinnings(uint256 _marketId) external marketExists(_marketId) marketResolved(_marketId) nonReentrant {
        Market storage market = markets[_marketId];
        Stake storage userStake = stakes[_marketId][msg.sender];
        
        require(userStake.amount > 0, "No stake found");
        require(!userStake.claimed, "Already claimed");
        require(userStake.side == market.winner, "You did not win");
        
        userStake.claimed = true;
        
        // Calculate payout
        uint256 winnerPool;
        if (market.winner == 1) {
            winnerPool = market.totalAgreeStakes;
        } else {
            winnerPool = market.totalDisagreeStakes;
        }
        
        // Calculate 5% platform rake on winning pool
        uint256 rakeAmount = (winnerPool * 5) / 100;
        
        // Winning pool after rake deduction
        uint256 winningsPool = winnerPool - rakeAmount;
        
        // User's proportional share: (userStake / winnerPool) * winningsPool
        // Example: If user staked $100 out of $300 total, they get 33.3% of $285 = $95
        uint256 payout = (userStake.amount * winningsPool) / winnerPool;
        
        // Transfer winnings to user
        IERC20 token = IERC20(market.stakingToken);
        require(token.transfer(msg.sender, payout), "Transfer failed");
        
        emit WinningsClaimed(_marketId, msg.sender, payout);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Admin withdraws accumulated rake
     * @param _token Token to withdraw
     */
    function withdrawRake(address _token) external onlyAdmin nonReentrant {
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
        require(token.transfer(admin, balance), "Transfer failed");
    }
    
    /**
     * @dev Add new supported token
     * @param _token Token address
     */
    function addSupportedToken(address _token) external onlyAdmin {
        supportedTokens[_token] = true;
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get market details
     */
    function getMarket(uint256 _marketId) external view marketExists(_marketId) returns (Market memory) {
        return markets[_marketId];
    }
    
    /**
     * @dev Get user's stake in a market
     */
    function getUserStake(uint256 _marketId, address _user) external view returns (Stake memory) {
        return stakes[_marketId][_user];
    }
    
    /**
     * @dev Calculate potential payout for a winner
     */
    function calculatePayout(uint256 _marketId, address _user) external view marketExists(_marketId) marketResolved(_marketId) returns (uint256) {
        Market storage market = markets[_marketId];
        Stake storage userStake = stakes[_marketId][_user];
        
        if (userStake.amount == 0 || userStake.side != market.winner) {
            return 0;
        }
        
        uint256 winnerPool = market.winner == 1 ? market.totalAgreeStakes : market.totalDisagreeStakes;
        uint256 rakeAmount = (winnerPool * PLATFORM_RAKE_PERCENT) / 100;
        uint256 winningsPool = winnerPool - rakeAmount;
        
        return (userStake.amount * winningsPool) / winnerPool;
    }
}

