"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unused-vars,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access */
const eth_rpc_errors_1 = require("eth-rpc-errors");
const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
const cross_inpage_provider_core_1 = require("@chargerwallet/cross-inpage-provider-core");
const cross_inpage_provider_types_1 = require("@chargerwallet/cross-inpage-provider-types");
const messages_1 = __importDefault(require("./messages"));
const utils_1 = require("./utils");
class BaseProvider extends cross_inpage_provider_core_1.ProviderBase {
    constructor(config) {
        var _a;
        super(config);
        this.providerName = cross_inpage_provider_types_1.IInjectedProviderNames.ethereum;
        this.isMetaMask = true;
        // TODO use debugLogger.ethereum()
        this._log = (_a = config.logger) !== null && _a !== void 0 ? _a : window.console;
        // TODO remove
        // this.setMaxListeners(config.maxEventListeners ?? 100);
        // private state
        this._state = Object.assign({}, BaseProvider._defaultState);
        // public state
        this.selectedAddress = null;
        this.chainId = null;
        // bind functions (to prevent consumers from making unbound calls)
        this._handleAccountsChanged = this._handleAccountsChanged.bind(this);
        this._handleConnect = this._handleConnect.bind(this);
        this._handleChainChanged = this._handleChainChanged.bind(this);
        this._handleDisconnect = this._handleDisconnect.bind(this);
        this._handleStreamDisconnect = this._handleStreamDisconnect.bind(this);
        this._handleUnlockStateChanged = this._handleUnlockStateChanged.bind(this);
        this._rpcRequest = this._rpcRequest.bind(this);
        this.request = this.request.bind(this);
        // TODO jsBridge disconnect event
        const disconnectHandler = this._handleStreamDisconnect.bind(this, 'ChargerWallet');
        // setup own event listeners
        // EIP-1193 connect
        this.on('connect', () => {
            this._state.isConnected = true;
        });
        // setup RPC connection
        // TODO jsBridge disconnect event
        const disconnectHandlerRpc = this._handleStreamDisconnect.bind(this, 'ChargerWallet RpcProvider');
        // handle RPC requests via dapp-side rpc engine
        // TODO middleware like methods
        // rpcEngine.push(createIdRemapMiddleware());
        // rpcEngine.push(createErrorMiddleware(this._log));
        void this._initializeState();
        // handle JSON-RPC notifications
        this.on('message_low_level', (payload) => {
            const { method, params } = payload;
            if (method === 'metamask_accountsChanged') {
                this._handleAccountsChanged(params);
            }
            else if (method === 'metamask_unlockStateChanged') {
                this._handleUnlockStateChanged(params);
            }
            else if (method === 'metamask_chainChanged') {
                this._handleChainChanged(params);
            }
            else if (utils_1.EMITTED_NOTIFICATIONS.includes(method)) {
                this.emit('message', {
                    type: method,
                    data: params,
                });
            }
            else if (method === 'METAMASK_STREAM_FAILURE') {
                // TODO destroy bridge connection
                const error = new Error(messages_1.default.errors.permanentlyDisconnected());
            }
        });
    }
    //= ===================
    // Public Methods
    //= ===================
    /**
     * Returns whether the provider can process RPC requests.
     */
    isConnected() {
        return this._state.isConnected;
    }
    /**
     * Submits an RPC request for the given method, with the given params.
     * Resolves with the result of the method call, or rejects on error.
     *
     * @param args - The RPC request arguments.
     * @param args.method - The RPC method name.
     * @param args.params - The parameters for the RPC method.
     * @returns A Promise that resolves with the result of the RPC method,
     * or rejects if an error is encountered.
     */
    request(args) {
        return __awaiter(this, void 0, void 0, function* () {
            cross_inpage_provider_core_1.appDebugLogger.ethereum('request', args);
            if (!args || typeof args !== 'object' || Array.isArray(args)) {
                throw eth_rpc_errors_1.ethErrors.rpc.invalidRequest({
                    message: messages_1.default.errors.invalidRequestArgs(),
                    data: args,
                });
            }
            const { method, params, id } = args;
            if (!method || typeof method !== 'string' || method.length === 0) {
                // createErrorMiddleware
                // `The request 'method' must be a non-empty string.`,
                throw eth_rpc_errors_1.ethErrors.rpc.invalidRequest({
                    message: messages_1.default.errors.invalidRequestMethod(),
                    data: args,
                });
            }
            if (params !== undefined &&
                !Array.isArray(params) &&
                (typeof params !== 'object' || params === null)) {
                throw eth_rpc_errors_1.ethErrors.rpc.invalidRequest({
                    message: messages_1.default.errors.invalidRequestParams(),
                    data: args,
                });
            }
            // TODO error logger
            //      log.error(`MetaMask - RPC Error: ${error.message}`, error);
            const res = (yield this._rpcRequest({ method, params, id }));
            cross_inpage_provider_core_1.appDebugLogger.ethereum('request->response', '\n', args, '\n ---> ', res);
            return res;
        });
    }
    //= ===================
    // Private Methods
    //= ===================
    /**
     * Constructor helper.
     * Populates initial state by calling 'metamask_getProviderState' and emits
     * necessary events.
     */
    _initializeState() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield this.request({
                    method: 'metamask_getProviderState',
                });
                const { accounts, chainId, isUnlocked, networkVersion } = res;
                // indicate that we've connected, for EIP-1193 compliance
                this.emit('connect', { chainId });
                this._handleChainChanged({ chainId, networkVersion });
                this._handleUnlockStateChanged({ accounts, isUnlocked });
                this._handleAccountsChanged(accounts);
            }
            catch (error) {
                this._log.error('MetaMask: Failed to get initial state. Please report this bug.', error);
            }
            finally {
                this._state.initialized = true;
                this.emit('_initialized');
            }
        });
    }
    /**
     * Internal RPC method. Forwards requests to background via the RPC engine.
     * Also remap ids inbound and outbound.
     *
     * @param payload - The RPC request object.
     * @param callback
     */
    _rpcRequest(payload, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Array.isArray(payload)) {
                if (!payload.jsonrpc) {
                    payload.jsonrpc = '2.0';
                }
                const result = yield this.bridgeRequest(payload, callback);
                if (payload.method === 'eth_accounts' || payload.method === 'eth_requestAccounts') {
                    // handle accounts changing
                    this._handleAccountsChanged(result || [], payload.method === 'eth_accounts');
                }
                return result;
            }
            // TODO array payload?
            return this.bridgeRequest(payload, callback);
        });
    }
    /**
     * When the provider becomes connected, updates internal state and emits
     * required events. Idempotent.
     *
     * @param chainId - The ID of the newly connected chain.
     * @emits MetaMaskInpageProvider#connect
     */
    _handleConnect(chainId) {
        if (!this._state.isConnected) {
            this._state.isConnected = true;
            this.emit('connect', { chainId });
            this._log.debug(messages_1.default.info.connected(chainId));
        }
    }
    /**
     * When the provider becomes disconnected, updates internal state and emits
     * required events. Idempotent with respect to the isRecoverable parameter.
     *
     * Error codes per the CloseEvent status codes as required by EIP-1193:
     * https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
     *
     * @param isRecoverable - Whether the disconnection is recoverable.
     * @param errorMessage - A custom error message.
     * @emits MetaMaskInpageProvider#disconnect
     */
    _handleDisconnect(isRecoverable, errorMessage) {
        if (this._state.isConnected || (!this._state.isPermanentlyDisconnected && !isRecoverable)) {
            this._state.isConnected = false;
            let error;
            if (isRecoverable) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                error = new eth_rpc_errors_1.EthereumRpcError(1013, // Try again later
                errorMessage || messages_1.default.errors.disconnected());
                this._log.debug(error);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                error = new eth_rpc_errors_1.EthereumRpcError(1011, // Internal error
                errorMessage || messages_1.default.errors.permanentlyDisconnected());
                this._log.error(error);
                this.chainId = null;
                this._state.accounts = null;
                this.selectedAddress = null;
                this._state.isUnlocked = false;
                this._state.isPermanentlyDisconnected = true;
            }
            this.emit('disconnect', error);
        }
    }
    /**
     * Called when connection is lost to critical streams.
     *
     * @emits MetamaskInpageProvider#disconnect
     */
    _handleStreamDisconnect(streamName, error) {
        (0, utils_1.logStreamDisconnectWarning)(this._log, streamName, error, this);
        this._handleDisconnect(false, error ? error.message : undefined);
    }
    /**
     * Upon receipt of a new chainId and networkVersion, emits corresponding
     * events and sets relevant public state.
     * Does nothing if neither the chainId nor the networkVersion are different
     * from existing values.
     *
     * @emits MetamaskInpageProvider#chainChanged
     * @param networkInfo - An object with network info.
     * @param networkInfo.chainId - The latest chain ID.
     * @param networkInfo.networkVersion - The latest network ID.
     */
    _handleChainChanged({ chainId, networkVersion } = {}) {
        if (!chainId ||
            typeof chainId !== 'string' ||
            !chainId.startsWith('0x') ||
            !networkVersion ||
            typeof networkVersion !== 'string') {
            this._log.error('MetaMask: Received invalid network parameters. Please report this bug.', {
                chainId,
                networkVersion,
            });
            return;
        }
        if (networkVersion === 'loading') {
            this._handleDisconnect(true);
        }
        else {
            this._handleConnect(chainId);
            if (this.isNetworkChanged(chainId)) {
                this.chainId = chainId;
                if (this._state.initialized) {
                    this.emit('chainChanged', this.chainId);
                }
            }
        }
    }
    isNetworkChanged(chainId) {
        return chainId !== this.chainId;
    }
    /**
     * Called when accounts may have changed. Diffs the new accounts value with
     * the current one, updates all state as necessary, and emits the
     * accountsChanged event.
     *
     * @param accounts - The new accounts value.
     * @param isEthAccounts - Whether the accounts value was returned by
     * a call to eth_accounts.
     */
    _handleAccountsChanged(accounts, isEthAccounts = false) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        let _accounts = accounts;
        if (!Array.isArray(accounts)) {
            this._log.error('MetaMask: Received invalid accounts parameter. Please report this bug.', accounts);
            _accounts = [];
        }
        for (const account of accounts) {
            if (typeof account !== 'string') {
                this._log.error('MetaMask: Received non-string account. Please report this bug.', accounts);
                _accounts = [];
                break;
            }
        }
        // emit accountsChanged if anything about the accounts array has changed
        if (this.isAccountsChanged(_accounts)) {
            // we should always have the correct accounts even before eth_accounts
            // returns
            if (isEthAccounts && this._state.accounts !== null) {
                this._log.error(`MetaMask: 'eth_accounts' unexpectedly updated accounts. Please report this bug.`, _accounts);
            }
            this._state.accounts = _accounts;
            // handle selectedAddress
            if (this.selectedAddress !== _accounts[0]) {
                this.selectedAddress = _accounts[0] || null;
            }
            // finally, after all state has been updated, emit the event
            if (this._state.initialized) {
                this.emit('accountsChanged', _accounts);
            }
        }
    }
    isAccountsChanged(_accounts) {
        return !(0, fast_deep_equal_1.default)(this._state.accounts, _accounts);
    }
    /**
     * Upon receipt of a new isUnlocked state, sets relevant public state.
     * Calls the accounts changed handler with the received accounts, or an empty
     * array.
     *
     * Does nothing if the received value is equal to the existing value.
     * There are no lock/unlock events.
     *
     * @param opts - Options bag.
     * @param opts.accounts - The exposed accounts, if any.
     * @param opts.isUnlocked - The latest isUnlocked value.
     */
    _handleUnlockStateChanged({ accounts, isUnlocked } = {}) {
        if (typeof isUnlocked !== 'boolean') {
            this._log.error('MetaMask: Received invalid isUnlocked parameter. Please report this bug.');
            return;
        }
        if (isUnlocked !== this._state.isUnlocked) {
            this._state.isUnlocked = isUnlocked;
            this._handleAccountsChanged(accounts || []);
        }
    }
}
exports.default = BaseProvider;
BaseProvider._defaultState = {
    accounts: null,
    isConnected: false,
    isUnlocked: false,
    initialized: false,
    isPermanentlyDisconnected: false,
};
