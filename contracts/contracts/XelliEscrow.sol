// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title XelliEscrow
 * @dev Escrow contract for holding payments until recipient accepts
 * Deploy one instance per chain (Base, Ethereum, BNB, Polygon)
 */
contract XelliEscrow is ReentrancyGuard, Ownable {
    struct Payment {
        address sender;
        address recipient;
        address token;
        uint256 amount;
        uint64 expiry; // Unix timestamp
        bool claimed;
        bool cancelled;
    }

    // paymentId => Payment
    mapping(uint256 => Payment) public payments;
    
    // Next payment ID (increments per chain)
    uint256 public nextPaymentId;

    // Events
    event PaymentCreated(
        uint256 indexed paymentId,
        address indexed sender,
        address indexed recipient,
        address token,
        uint256 amount,
        uint64 expiry
    );

    event PaymentClaimed(
        uint256 indexed paymentId,
        address indexed recipient,
        uint256 amount
    );

    event PaymentCancelled(
        uint256 indexed paymentId,
        address indexed sender,
        uint256 amount
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new escrow payment
     * @param recipient Address of the recipient
     * @param token ERC20 token address
     * @param amount Amount in token's smallest unit
     * @param expiry Unix timestamp when payment expires (0 = no expiry)
     */
    function createPayment(
        address recipient,
        address token,
        uint256 amount,
        uint64 expiry
    ) external nonReentrant returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");
        require(recipient != msg.sender, "Cannot send to yourself");

        // Transfer tokens from sender to escrow
        IERC20 tokenContract = IERC20(token);
        require(
            tokenContract.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        uint256 paymentId = nextPaymentId;
        nextPaymentId++;

        payments[paymentId] = Payment({
            sender: msg.sender,
            recipient: recipient,
            token: token,
            amount: amount,
            expiry: expiry,
            claimed: false,
            cancelled: false
        });

        emit PaymentCreated(
            paymentId,
            msg.sender,
            recipient,
            token,
            amount,
            expiry
        );

        return paymentId;
    }

    /**
     * @dev Claim a payment (recipient only)
     * @param paymentId The payment ID to claim
     */
    function claimPayment(uint256 paymentId) external nonReentrant {
        Payment storage payment = payments[paymentId];
        
        require(payment.recipient == msg.sender, "Not the recipient");
        require(!payment.claimed, "Already claimed");
        require(!payment.cancelled, "Payment cancelled");
        
        // Check expiry if set
        if (payment.expiry > 0) {
            require(block.timestamp <= payment.expiry, "Payment expired");
        }

        payment.claimed = true;

        // Transfer tokens to recipient
        IERC20 tokenContract = IERC20(payment.token);
        require(
            tokenContract.transfer(payment.recipient, payment.amount),
            "Transfer failed"
        );

        emit PaymentClaimed(paymentId, msg.sender, payment.amount);
    }

    /**
     * @dev Cancel a payment (sender only, if not claimed and expired or no expiry)
     * @param paymentId The payment ID to cancel
     */
    function cancelPayment(uint256 paymentId) external nonReentrant {
        Payment storage payment = payments[paymentId];
        
        require(payment.sender == msg.sender, "Not the sender");
        require(!payment.claimed, "Already claimed");
        require(!payment.cancelled, "Already cancelled");
        
        // Allow cancellation if expired or no expiry set
        if (payment.expiry > 0) {
            require(block.timestamp > payment.expiry, "Payment not expired");
        }

        payment.cancelled = true;

        // Return tokens to sender
        IERC20 tokenContract = IERC20(payment.token);
        require(
            tokenContract.transfer(payment.sender, payment.amount),
            "Transfer failed"
        );

        emit PaymentCancelled(paymentId, msg.sender, payment.amount);
    }

    /**
     * @dev Get payment details
     * @param paymentId The payment ID
     */
    function getPayment(uint256 paymentId) external view returns (
        address sender,
        address recipient,
        address token,
        uint256 amount,
        uint64 expiry,
        bool claimed,
        bool cancelled
    ) {
        Payment memory payment = payments[paymentId];
        return (
            payment.sender,
            payment.recipient,
            payment.token,
            payment.amount,
            payment.expiry,
            payment.claimed,
            payment.cancelled
        );
    }
}

