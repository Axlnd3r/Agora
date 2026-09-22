// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMandateVault {
    enum MandateStatus {
        None,
        Active,
        Paused,
        Revoked,
        Closed
    }

    struct MandateConfig {
        bytes32 mandateId;
        address agent;
        uint256 totalLimit;
        uint256 dailyLimit;
        uint256 perPaymentLimit;
        uint64 validAfter;
        uint64 validUntil;
        uint32 maxPayments;
    }

    struct ProviderPermission {
        address merchant;
        bytes32 serviceId;
    }

    struct MandateState {
        MandateConfig config;
        uint256 spentTotal;
        uint32 paymentCount;
        MandateStatus status;
    }

    struct Invoice {
        bytes32 invoiceId;
        bytes32 requestId;
        bytes32 mandateId;
        bytes32 serviceId;
        bytes32 requestHash;
        address vault;
        address token;
        address merchant;
        uint256 amount;
        uint64 validUntil;
    }

    struct PaymentIntent {
        bytes32 mandateId;
        bytes32 invoiceDigest;
        uint64 deadline;
    }

    event Deposited(address indexed owner, uint256 amount);
    event Withdrawn(address indexed recipient, uint256 amount);
    event MandateCreated(
        bytes32 indexed mandateId,
        address indexed agent,
        uint256 totalLimit,
        uint256 dailyLimit,
        uint256 perPaymentLimit,
        uint64 validAfter,
        uint64 validUntil,
        uint32 maxPayments
    );
    event ProviderAllowed(bytes32 indexed mandateId, address indexed merchant, bytes32 indexed serviceId);
    event MandateStatusChanged(bytes32 indexed mandateId, uint8 status, uint256 releasedAmount);
    event PaymentsPauseChanged(bool paused);
    event PaymentSettled(
        bytes32 indexed mandateId,
        bytes32 indexed invoiceId,
        bytes32 indexed requestId,
        address agent,
        address merchant,
        bytes32 serviceId,
        bytes32 invoiceDigest,
        bytes32 intentDigest,
        uint256 amount,
        uint256 totalSpent,
        uint256 dailySpent,
        uint256 utcDay
    );

    error Unauthorized();
    error InvalidConfig();
    error MandateAlreadyExists();
    error MandateNotFound();
    error MandateNotActive();
    error MandateNotStarted();
    error MandateExpired();
    error VaultPaymentsPaused();
    error ProviderNotAllowed();
    error InvalidInvoice();
    error InvalidMerchantSignature();
    error InvalidAgentSignature();
    error AuthorizationExpired();
    error InvoiceAlreadyPaid();
    error RequestAlreadyPaid();
    error IntentAlreadyUsed();
    error PerPaymentLimitExceeded();
    error DailyLimitExceeded();
    error TotalLimitExceeded();
    error PaymentCountExceeded();
    error InsufficientFreeBalance();
    error UnsupportedTokenBehavior();
    error MandateNotExpired();
    error InvalidStatusTransition();

    function owner() external view returns (address);
    function token() external view returns (address);
    function reservedRemaining() external view returns (uint256);
    function freeBalance() external view returns (uint256);
    function paymentsPaused() external view returns (bool);
    function deposit(uint256 amount) external;
    function withdrawFree(uint256 amount, address recipient) external;
    function createMandate(MandateConfig calldata config, ProviderPermission[] calldata providers) external;
    function pauseMandate(bytes32 mandateId) external;
    function resumeMandate(bytes32 mandateId) external;
    function revokeMandate(bytes32 mandateId) external;
    function closeExpiredMandate(bytes32 mandateId) external;
    function setPaymentsPaused(bool paused) external;
    function settlePayment(
        Invoice calldata invoice,
        bytes calldata merchantSignature,
        PaymentIntent calldata intent,
        bytes calldata agentSignature
    ) external returns (bytes32 paymentDigest);
    function getMandate(bytes32 mandateId) external view returns (MandateState memory);
    function spentOnDay(bytes32 mandateId, uint256 utcDay) external view returns (uint256);
    function isProviderAllowed(bytes32 mandateId, address merchant, bytes32 serviceId) external view returns (bool);
    function paidInvoiceDigest(address merchant, bytes32 invoiceId) external view returns (bytes32);
    function paidRequestDigest(address merchant, bytes32 requestId) external view returns (bytes32);
    function isIntentConsumed(bytes32 intentDigest) external view returns (bool);
    function hashInvoice(Invoice calldata invoice) external view returns (bytes32);
    function hashIntent(PaymentIntent calldata intent) external view returns (bytes32);
}
