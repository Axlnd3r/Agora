// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IMandateVault} from "./IMandateVault.sol";

contract MandateVault is IMandateVault, EIP712, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private constant MAX_DURATION = 30 days;
    uint256 private constant MAX_PROVIDERS = 20;
    uint32 private constant MAX_PAYMENTS = 10_000;

    bytes32 private constant INVOICE_TYPEHASH = keccak256(
        "Invoice(bytes32 invoiceId,bytes32 requestId,bytes32 mandateId,bytes32 serviceId,bytes32 requestHash,address vault,address token,address merchant,uint256 amount,uint64 validUntil)"
    );
    bytes32 private constant PAYMENT_INTENT_TYPEHASH = keccak256(
        "PaymentIntent(bytes32 mandateId,bytes32 invoiceDigest,uint64 deadline)"
    );

    address public immutable owner;
    address public immutable token;
    uint256 public reservedRemaining;
    bool public paymentsPaused;

    mapping(bytes32 mandateId => MandateState state) private mandates;
    mapping(bytes32 mandateId => mapping(uint256 utcDay => uint256 amount)) private dailySpend;
    mapping(bytes32 mandateId => mapping(address merchant => mapping(bytes32 serviceId => bool allowed))) private providers;
    mapping(bytes32 key => bytes32 digest) private paidInvoices;
    mapping(bytes32 key => bytes32 digest) private paidRequests;
    mapping(bytes32 digest => bool consumed) private consumedIntents;

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address owner_, address token_) EIP712("Agora", "1") {
        if (owner_ == address(0) || token_ == address(0) || token_.code.length == 0) revert InvalidConfig();
        owner = owner_;
        token = token_;
    }

    function freeBalance() public view returns (uint256) {
        uint256 balance = IERC20(token).balanceOf(address(this));
        return balance > reservedRemaining ? balance - reservedRemaining : 0;
    }

    function deposit(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert InvalidConfig();
        IERC20 asset = IERC20(token);
        uint256 beforeBalance = asset.balanceOf(address(this));
        asset.safeTransferFrom(msg.sender, address(this), amount);
        if (asset.balanceOf(address(this)) - beforeBalance != amount) revert UnsupportedTokenBehavior();
        emit Deposited(owner, amount);
    }

    function withdrawFree(uint256 amount, address recipient) external onlyOwner nonReentrant {
        if (amount == 0 || recipient == address(0) || recipient == address(this)) revert InvalidConfig();
        if (amount > freeBalance()) revert InsufficientFreeBalance();
        IERC20(token).safeTransfer(recipient, amount);
        emit Withdrawn(recipient, amount);
    }

    function createMandate(MandateConfig calldata config, ProviderPermission[] calldata allowedProviders)
        external
        onlyOwner
    {
        if (config.mandateId == bytes32(0)) revert InvalidConfig();
        if (mandates[config.mandateId].status != MandateStatus.None) revert MandateAlreadyExists();
        if (
            config.agent == address(0) || config.perPaymentLimit == 0
                || config.perPaymentLimit > config.dailyLimit || config.dailyLimit > config.totalLimit
                || config.maxPayments == 0 || config.maxPayments > MAX_PAYMENTS || config.validUntil <= config.validAfter
                || config.validUntil <= block.timestamp || config.validUntil - config.validAfter > MAX_DURATION
                || allowedProviders.length == 0 || allowedProviders.length > MAX_PROVIDERS
        ) revert InvalidConfig();
        if (config.totalLimit > freeBalance()) revert InsufficientFreeBalance();

        MandateState storage mandate = mandates[config.mandateId];
        mandate.config = config;
        mandate.status = MandateStatus.Active;
        reservedRemaining += config.totalLimit;

        for (uint256 index = 0; index < allowedProviders.length; index++) {
            ProviderPermission calldata permission = allowedProviders[index];
            if (permission.merchant == address(0) || permission.serviceId == bytes32(0)) revert InvalidConfig();
            if (providers[config.mandateId][permission.merchant][permission.serviceId]) revert InvalidConfig();
            providers[config.mandateId][permission.merchant][permission.serviceId] = true;
            emit ProviderAllowed(config.mandateId, permission.merchant, permission.serviceId);
        }

        emit MandateCreated(
            config.mandateId,
            config.agent,
            config.totalLimit,
            config.dailyLimit,
            config.perPaymentLimit,
            config.validAfter,
            config.validUntil,
            config.maxPayments
        );
    }

    function pauseMandate(bytes32 mandateId) external onlyOwner {
        MandateState storage mandate = _mandate(mandateId);
        if (mandate.status != MandateStatus.Active) revert InvalidStatusTransition();
        mandate.status = MandateStatus.Paused;
        emit MandateStatusChanged(mandateId, uint8(MandateStatus.Paused), 0);
    }

    function resumeMandate(bytes32 mandateId) external onlyOwner {
        MandateState storage mandate = _mandate(mandateId);
        if (mandate.status != MandateStatus.Paused) revert InvalidStatusTransition();
        if (block.timestamp >= mandate.config.validUntil) revert MandateExpired();
        mandate.status = MandateStatus.Active;
        emit MandateStatusChanged(mandateId, uint8(MandateStatus.Active), 0);
    }

    function revokeMandate(bytes32 mandateId) external onlyOwner {
        MandateState storage mandate = _mandate(mandateId);
        if (mandate.status != MandateStatus.Active && mandate.status != MandateStatus.Paused) {
            revert InvalidStatusTransition();
        }
        uint256 released = _release(mandate);
        mandate.status = MandateStatus.Revoked;
        emit MandateStatusChanged(mandateId, uint8(MandateStatus.Revoked), released);
    }

    function closeExpiredMandate(bytes32 mandateId) external {
        MandateState storage mandate = _mandate(mandateId);
        if (mandate.status != MandateStatus.Active && mandate.status != MandateStatus.Paused) {
            revert InvalidStatusTransition();
        }
        if (block.timestamp < mandate.config.validUntil) revert MandateNotExpired();
        uint256 released = _release(mandate);
        mandate.status = MandateStatus.Closed;
        emit MandateStatusChanged(mandateId, uint8(MandateStatus.Closed), released);
    }

    function setPaymentsPaused(bool paused) external onlyOwner {
        paymentsPaused = paused;
        emit PaymentsPauseChanged(paused);
    }

    function settlePayment(
        Invoice calldata invoice,
        bytes calldata merchantSignature,
        PaymentIntent calldata intent,
        bytes calldata agentSignature
    ) external nonReentrant returns (bytes32 intentDigest) {
        if (paymentsPaused) revert VaultPaymentsPaused();
        MandateState storage mandate = _mandate(invoice.mandateId);
        if (mandate.status != MandateStatus.Active) revert MandateNotActive();
        if (block.timestamp < mandate.config.validAfter) revert MandateNotStarted();
        if (block.timestamp >= mandate.config.validUntil) revert MandateExpired();

        if (
            invoice.invoiceId == bytes32(0) || invoice.requestId == bytes32(0) || invoice.serviceId == bytes32(0)
                || invoice.requestHash == bytes32(0) || invoice.mandateId != intent.mandateId
                || invoice.vault != address(this) || invoice.token != token || invoice.merchant == address(0)
                || invoice.amount == 0
        ) revert InvalidInvoice();
        if (!providers[invoice.mandateId][invoice.merchant][invoice.serviceId]) revert ProviderNotAllowed();
        if (
            block.timestamp >= invoice.validUntil || block.timestamp >= intent.deadline
                || intent.deadline > invoice.validUntil || intent.deadline > mandate.config.validUntil
        ) revert AuthorizationExpired();

        bytes32 invoiceDigest = hashInvoice(invoice);
        if (invoiceDigest != intent.invoiceDigest) revert InvalidInvoice();
        if (ECDSA.recover(invoiceDigest, merchantSignature) != invoice.merchant) revert InvalidMerchantSignature();

        intentDigest = hashIntent(intent);
        if (ECDSA.recover(intentDigest, agentSignature) != mandate.config.agent) revert InvalidAgentSignature();

        bytes32 invoiceKey = _paymentKey(invoice.merchant, invoice.invoiceId);
        bytes32 requestKey = _paymentKey(invoice.merchant, invoice.requestId);
        if (paidInvoices[invoiceKey] != bytes32(0)) revert InvoiceAlreadyPaid();
        if (paidRequests[requestKey] != bytes32(0)) revert RequestAlreadyPaid();
        if (consumedIntents[intentDigest]) revert IntentAlreadyUsed();
        if (invoice.amount > mandate.config.perPaymentLimit) revert PerPaymentLimitExceeded();
        if (invoice.amount > mandate.config.totalLimit - mandate.spentTotal) revert TotalLimitExceeded();

        uint256 utcDay = block.timestamp / 1 days;
        uint256 daySpent = dailySpend[invoice.mandateId][utcDay];
        if (invoice.amount > mandate.config.dailyLimit - daySpent) revert DailyLimitExceeded();
        if (mandate.paymentCount >= mandate.config.maxPayments) revert PaymentCountExceeded();
        if (reservedRemaining < invoice.amount || IERC20(token).balanceOf(address(this)) < invoice.amount) {
            revert UnsupportedTokenBehavior();
        }

        paidInvoices[invoiceKey] = invoiceDigest;
        paidRequests[requestKey] = invoiceDigest;
        consumedIntents[intentDigest] = true;
        mandate.spentTotal += invoice.amount;
        mandate.paymentCount += 1;
        daySpent += invoice.amount;
        dailySpend[invoice.mandateId][utcDay] = daySpent;
        reservedRemaining -= invoice.amount;

        IERC20(token).safeTransfer(invoice.merchant, invoice.amount);
        emit PaymentSettled(
            invoice.mandateId,
            invoice.invoiceId,
            invoice.requestId,
            mandate.config.agent,
            invoice.merchant,
            invoice.serviceId,
            invoiceDigest,
            intentDigest,
            invoice.amount,
            mandate.spentTotal,
            daySpent,
            utcDay
        );
    }

    function getMandate(bytes32 mandateId) external view returns (MandateState memory) {
        return mandates[mandateId];
    }

    function spentOnDay(bytes32 mandateId, uint256 utcDay) external view returns (uint256) {
        return dailySpend[mandateId][utcDay];
    }

    function isProviderAllowed(bytes32 mandateId, address merchant, bytes32 serviceId) external view returns (bool) {
        return providers[mandateId][merchant][serviceId];
    }

    function paidInvoiceDigest(address merchant, bytes32 invoiceId) external view returns (bytes32) {
        return paidInvoices[_paymentKey(merchant, invoiceId)];
    }

    function paidRequestDigest(address merchant, bytes32 requestId) external view returns (bytes32) {
        return paidRequests[_paymentKey(merchant, requestId)];
    }

    function isIntentConsumed(bytes32 intentDigest) external view returns (bool) {
        return consumedIntents[intentDigest];
    }

    function hashInvoice(Invoice calldata invoice) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    INVOICE_TYPEHASH,
                    invoice.invoiceId,
                    invoice.requestId,
                    invoice.mandateId,
                    invoice.serviceId,
                    invoice.requestHash,
                    invoice.vault,
                    invoice.token,
                    invoice.merchant,
                    invoice.amount,
                    invoice.validUntil
                )
            )
        );
    }

    function hashIntent(PaymentIntent calldata intent) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(abi.encode(PAYMENT_INTENT_TYPEHASH, intent.mandateId, intent.invoiceDigest, intent.deadline))
        );
    }

    function _mandate(bytes32 mandateId) private view returns (MandateState storage mandate) {
        mandate = mandates[mandateId];
        if (mandate.status == MandateStatus.None) revert MandateNotFound();
    }

    function _release(MandateState storage mandate) private returns (uint256 released) {
        released = mandate.config.totalLimit - mandate.spentTotal;
        reservedRemaining -= released;
    }

    function _paymentKey(address merchant, bytes32 identifier) private pure returns (bytes32) {
        return keccak256(abi.encode(merchant, identifier));
    }

    receive() external payable {
        revert InvalidConfig();
    }

    fallback() external payable {
        revert InvalidConfig();
    }
}
