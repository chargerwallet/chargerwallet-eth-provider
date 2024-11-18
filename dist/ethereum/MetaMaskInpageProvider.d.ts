import { IJsonRpcRequest, IJsonRpcResponse } from '@chargerwallet/cross-inpage-provider-types';
import { IBridgeRequestCallback, IInpageProviderConfig } from '@chargerwallet/cross-inpage-provider-core';
import BaseProvider, { BaseProviderOptions } from './BaseProvider';
export interface SendSyncJsonRpcRequest extends IJsonRpcRequest {
    method: 'eth_accounts' | 'eth_coinbase' | 'eth_uninstallFilter' | 'net_version';
}
export interface MetaMaskInpageProviderOptions extends BaseProviderOptions {
    /**
     * Whether the provider should send page metadata.
     */
    shouldSendMetadata?: boolean;
}
interface SentWarningsState {
    enable: boolean;
    experimentalMethods: boolean;
    send: boolean;
    events: {
        close: boolean;
        data: boolean;
        networkChanged: boolean;
        notification: boolean;
    };
}
export default class MetaMaskInpageProvider extends BaseProvider {
    protected _sentWarnings: SentWarningsState;
    /**
     * Experimental methods can be found here.
     */
    readonly _metamask: ReturnType<MetaMaskInpageProvider['_getExperimentalApi']>;
    networkVersion: string | null;
    /**
     * Indicating that this provider is a MetaMask provider.
     */
    readonly isMetaMask: true;
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
    constructor(config: IInpageProviderConfig);
    /**
     * Submits an RPC request per the given JSON-RPC request object.
     *
     * @param payload - The RPC request object.
     * @param callback
     */
    sendAsync(payload: IJsonRpcRequest, callback?: IBridgeRequestCallback): void;
    /**
     * We override the following event methods so that we can warn consumers
     * about deprecated events:
     *   addListener, on, once, prependListener, prependOnceListener
     */
    addListener(eventName: string, listener: (...args: unknown[]) => void): this;
    on(eventName: string, listener: (...args: unknown[]) => void): this;
    once(eventName: string, listener: (...args: unknown[]) => void): this;
    prependListener(eventName: string, listener: (...args: unknown[]) => void): this;
    prependOnceListener(eventName: string, listener: (...args: unknown[]) => void): this;
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
    protected _handleDisconnect(isRecoverable: boolean, errorMessage?: string): void;
    /**
     * Warns of deprecation for the given event, if applicable.
     */
    protected _warnOfDeprecation(eventName: string): void;
    /**
     * Equivalent to: ethereum.request('eth_requestAccounts')
     *
     * @deprecated Use request({ method: 'eth_requestAccounts' }) instead.
     * @returns A promise that resolves to an array of addresses.
     */
    enable(): Promise<string[]>;
    _rpcResult(result: any, payload?: SendSyncJsonRpcRequest): IJsonRpcResponse<any>;
    send(methodOrPayload: unknown, callbackOrArgs?: unknown): unknown;
    /**
     * Internal backwards compatibility method, used in send.
     *
     * @deprecated
     */
    protected _sendSync(payload: SendSyncJsonRpcRequest): IJsonRpcResponse<any>;
    /**
     * Constructor helper.
     * Gets experimental _metamask API as Proxy, so that we can warn consumers
     * about its experiment nature.
     */
    protected _getExperimentalApi(): {
        /**
         * Determines if MetaMask is unlocked by the user.
         *
         * @returns Promise resolving to true if MetaMask is currently unlocked
         */
        isUnlocked: () => Promise<boolean>;
        /**
         * Make a batch RPC request.
         */
        requestBatch: (requests: IJsonRpcRequest[]) => Promise<unknown>;
    };
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
    protected _handleChainChanged({ chainId, networkVersion, }?: {
        chainId?: string;
        networkVersion?: string;
    }): void;
}
export {};
