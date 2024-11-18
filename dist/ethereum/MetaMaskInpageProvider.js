var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable no-dupe-class-members,@typescript-eslint/ban-ts-comment */
import { ethErrors } from 'eth-rpc-errors';
import BaseProvider from './BaseProvider';
import messages from './messages';
import sendSiteMetadata from './siteMetadata';
import { EMITTED_NOTIFICATIONS, NOOP } from './utils';
export default class MetaMaskInpageProvider extends BaseProvider {
    /**
     * @param connectionStream - A Node.js duplex stream
     * @param options - An options bag
     * @param options.jsonRpcStreamName - The name of the internal JSON-RPC stream.
     * Default: metamask-provider
     * @param options.logger - The logging API to use. Default: console
     * @param options.maxEventListeners - The maximum number of event
     * listeners. Default: 100
     * @param options.shouldSendMetadata - Whether the provider should
     * send page metadata. Default: true
     */
    constructor(config) {
        super(config);
        this._sentWarnings = {
            // methods
            enable: false,
            experimentalMethods: false,
            send: false,
            // events
            events: {
                close: false,
                data: false,
                networkChanged: false,
                notification: false,
            },
        };
        // sendSiteMetadataDomReady in ProviderPrivate, dont need here
        const shouldSendMetadata = false;
        this.networkVersion = null;
        this.isMetaMask = true;
        this._sendSync = this._sendSync.bind(this);
        this.enable = this.enable.bind(this);
        this.send = this.send.bind(this);
        this.sendAsync = this.sendAsync.bind(this);
        this._warnOfDeprecation = this._warnOfDeprecation.bind(this);
        this._metamask = this._getExperimentalApi();
        // handle JSON-RPC notifications
        this.bridge.on('notification', (payload) => {
            const { method } = payload;
            if (EMITTED_NOTIFICATIONS.includes(method)) {
                // deprecated
                // emitted here because that was the original order
                this.emit('data', payload);
                // deprecated
                const payloadParams = payload.params;
                this.emit('notification', payloadParams.result);
            }
        });
        // send website metadata
        if (shouldSendMetadata) {
            if (document.readyState === 'complete') {
                void sendSiteMetadata(this.bridge, this._log);
            }
            else {
                const domContentLoadedHandler = () => {
                    void sendSiteMetadata(this.bridge, this._log);
                    window.removeEventListener('DOMContentLoaded', domContentLoadedHandler);
                };
                window.addEventListener('DOMContentLoaded', domContentLoadedHandler);
            }
        }
    }
    //= ===================
    // Public Methods
    //= ===================
    /**
     * Submits an RPC request per the given JSON-RPC request object.
     *
     * @param payload - The RPC request object.
     * @param callback
     */
    sendAsync(payload, callback) {
        void this._rpcRequest(payload, callback);
    }
    /**
     * We override the following event methods so that we can warn consumers
     * about deprecated events:
     *   addListener, on, once, prependListener, prependOnceListener
     */
    // @ts-ignore
    addListener(eventName, listener) {
        this._warnOfDeprecation(eventName);
        return super.addListener(eventName, listener);
    }
    // @ts-ignore
    on(eventName, listener) {
        this._warnOfDeprecation(eventName);
        return super.on(eventName, listener);
    }
    // @ts-ignore
    once(eventName, listener) {
        this._warnOfDeprecation(eventName);
        return super.once(eventName, listener);
    }
    prependListener(eventName, listener) {
        this._warnOfDeprecation(eventName);
        return super.prependListener(eventName, listener);
    }
    prependOnceListener(eventName, listener) {
        this._warnOfDeprecation(eventName);
        return super.prependOnceListener(eventName, listener);
    }
    //= ===================
    // Private Methods
    //= ===================
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
        super._handleDisconnect(isRecoverable, errorMessage);
        if (this.networkVersion && !isRecoverable) {
            this.networkVersion = null;
        }
    }
    /**
     * Warns of deprecation for the given event, if applicable.
     */
    _warnOfDeprecation(eventName) {
        var _a;
        if (((_a = this._sentWarnings) === null || _a === void 0 ? void 0 : _a.events[eventName]) === false) {
            this._log.warn(messages.warnings.events[eventName]);
            this._sentWarnings.events[eventName] = true;
        }
    }
    //= ===================
    // Deprecated Methods
    //= ===================
    /**
     * Equivalent to: ethereum.request('eth_requestAccounts')
     *
     * @deprecated Use request({ method: 'eth_requestAccounts' }) instead.
     * @returns A promise that resolves to an array of addresses.
     */
    enable() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._sentWarnings.enable) {
                this._log.warn(messages.warnings.enableDeprecation);
                this._sentWarnings.enable = true;
            }
            return (yield this._rpcRequest({
                method: 'eth_requestAccounts',
                params: [],
            }));
        });
    }
    _rpcResult(result, payload) {
        var _a, _b;
        return {
            id: (_a = payload === null || payload === void 0 ? void 0 : payload.id) !== null && _a !== void 0 ? _a : undefined,
            jsonrpc: (_b = payload === null || payload === void 0 ? void 0 : payload.jsonrpc) !== null && _b !== void 0 ? _b : '2.0',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            result,
        };
    }
    send(methodOrPayload, callbackOrArgs) {
        if (!this._sentWarnings.send) {
            this._log.warn(messages.warnings.sendDeprecation);
            this._sentWarnings.send = true;
        }
        if (typeof methodOrPayload === 'string' && (!callbackOrArgs || Array.isArray(callbackOrArgs))) {
            return this._rpcRequest({
                method: methodOrPayload,
                params: callbackOrArgs,
            }).then((result) => this._rpcResult(result));
        }
        if (methodOrPayload &&
            typeof methodOrPayload === 'object' &&
            typeof callbackOrArgs === 'function') {
            return this._rpcRequest(methodOrPayload, callbackOrArgs);
        }
        return this._sendSync(methodOrPayload);
    }
    /**
     * Internal backwards compatibility method, used in send.
     *
     * @deprecated
     */
    _sendSync(payload) {
        let result;
        switch (payload.method) {
            case 'eth_accounts':
                result = this.selectedAddress ? [this.selectedAddress] : [];
                break;
            case 'eth_coinbase':
                result = this.selectedAddress || null;
                break;
            case 'eth_uninstallFilter':
                void this._rpcRequest(payload, NOOP);
                result = true;
                break;
            case 'net_version':
                result = this.networkVersion || null;
                break;
            default:
                throw new Error(messages.errors.unsupportedSync(payload.method));
        }
        return this._rpcResult(result, payload);
    }
    /**
     * Constructor helper.
     * Gets experimental _metamask API as Proxy, so that we can warn consumers
     * about its experiment nature.
     */
    _getExperimentalApi() {
        return new Proxy({
            /**
             * Determines if MetaMask is unlocked by the user.
             *
             * @returns Promise resolving to true if MetaMask is currently unlocked
             */
            isUnlocked: () => __awaiter(this, void 0, void 0, function* () {
                if (!this._state.initialized) {
                    yield new Promise((resolve) => {
                        this.on('_initialized', () => resolve());
                    });
                }
                return this._state.isUnlocked;
            }),
            /**
             * Make a batch RPC request.
             */
            requestBatch: (requests) => __awaiter(this, void 0, void 0, function* () {
                if (!Array.isArray(requests)) {
                    throw ethErrors.rpc.invalidRequest({
                        message: 'Batch requests must be made with an array of request objects.',
                        data: requests,
                    });
                }
                return this._rpcRequest(requests);
            }),
        }, {
            get: (obj, prop, ...args) => {
                if (!this._sentWarnings.experimentalMethods) {
                    this._log.warn(messages.warnings.experimentalMethods);
                    this._sentWarnings.experimentalMethods = true;
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return Reflect.get(obj, prop, ...args);
            },
        });
    }
    /**
     * Upon receipt of a new chainId and networkVersion, emits corresponding
     * events and sets relevant public state.
     * Does nothing if neither the chainId nor the networkVersion are different
     * from existing values.
     *
     * @emits MetamaskInpageProvider#chainChanged
     * @emits MetamaskInpageProvider#networkChanged
     * @param networkInfo - An object with network info.
     * @param networkInfo.chainId - The latest chain ID.
     * @param networkInfo.networkVersion - The latest network ID.
     */
    _handleChainChanged({ chainId, networkVersion, } = {}) {
        super._handleChainChanged({ chainId, networkVersion });
        if (networkVersion && networkVersion !== 'loading' && networkVersion !== this.networkVersion) {
            this.networkVersion = networkVersion;
            if (this._state.initialized) {
                this.emit('networkChanged', this.networkVersion);
            }
        }
    }
}
